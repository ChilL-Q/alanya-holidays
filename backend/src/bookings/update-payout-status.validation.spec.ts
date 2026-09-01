import { BadRequestException, NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Test, TestingModule } from '@nestjs/testing';
import { BookingsService } from './bookings.service';
import { BookingsRepository } from './bookings.repository';
import { EmailOutboxRepository } from './email-outbox.repository';
import { NotificationsService } from '../notifications/notifications.service';
import { UserRolesRepository } from '../common/auth/user-roles.repository';
import {
  UpdatePayoutStatusDto,
  PAYOUT_STATUSES,
} from './dto/update-payout-status.dto';

const VALID_PAYOUT_STATUSES = [
  'pending',
  'processing',
  'paid',
  'failed',
  'hold',
] as const;

describe('UpdatePayoutStatusDto', () => {
  it.each(VALID_PAYOUT_STATUSES)(
    'should accept valid payout status "%s"',
    async (status) => {
      const dto = plainToInstance(UpdatePayoutStatusDto, {
        payoutStatus: status,
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    },
  );

  it.each([
    'completed',
    '',
    'PENDING',
    'drop table bookings',
    null,
    undefined,
    123,
    {},
    [],
  ])('should reject invalid payout status %p', async (status) => {
    const dto = plainToInstance(UpdatePayoutStatusDto, {
      payoutStatus: status,
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should expose exactly the DB enum values', () => {
    expect([...PAYOUT_STATUSES].sort()).toEqual(
      [...VALID_PAYOUT_STATUSES].sort(),
    );
  });
});

describe('BookingsService.updatePayoutStatus (whitelist defense-in-depth)', () => {
  let service: BookingsService;
  let mockRepository: Record<string, jest.Mock>;
  let mockUserRolesRepo: { getRole: jest.Mock };

  beforeEach(async () => {
    mockUserRolesRepo = {
      getRole: jest.fn(),
    };
    mockRepository = {
      updatePayoutStatus: jest.fn().mockResolvedValue(undefined),
      getPayoutStatus: jest.fn().mockResolvedValue('pending'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: BookingsRepository, useValue: mockRepository },
        {
          provide: UserRolesRepository,
          useValue: mockUserRolesRepo,
        },
        {
          provide: EmailOutboxRepository,
          useValue: { enqueue: jest.fn() },
        },
        {
          provide: NotificationsService,
          useValue: { notifyUser: jest.fn(), getUserNotifications: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
  });

  describe('admin user', () => {
    beforeEach(() => {
      mockUserRolesRepo.getRole.mockResolvedValue('admin');
    });

    it.each(VALID_PAYOUT_STATUSES)(
      'should allow admin to set payout status "%s"',
      async (status) => {
        const result = await service.updatePayoutStatus(
          'b1',
          status,
          'admin-1',
        );
        expect(result).toEqual({ success: true });
        expect(mockRepository.updatePayoutStatus).toHaveBeenCalledWith(
          'b1',
          status,
        );
      },
    );

    it.each(['completed', '', 'DROP TABLE bookings', 'Paid'])(
      'should throw BadRequestException for invalid payout status %p',
      async (status) => {
        await expect(
          service.updatePayoutStatus('b1', status, 'admin-1'),
        ).rejects.toThrow(BadRequestException);
        expect(mockRepository.updatePayoutStatus).not.toHaveBeenCalled();
      },
    );
  });

  describe('payout state machine', () => {
    beforeEach(() => {
      mockUserRolesRepo.getRole.mockResolvedValue('admin');
    });

    it.each([
      ['pending', 'processing'],
      ['failed', 'pending'],
      ['hold', 'paid'],
      ['processing', 'paid'],
    ] as const)('should allow transition %s -> %s', async (current, next) => {
      mockRepository.getPayoutStatus.mockResolvedValue(current);
      await expect(
        service.updatePayoutStatus('b1', next, 'admin-1'),
      ).resolves.toEqual({ success: true });
    });

    it('should reject a transition from the terminal "paid" state', async () => {
      mockRepository.getPayoutStatus.mockResolvedValue('paid');
      await expect(
        service.updatePayoutStatus('b1', 'pending', 'admin-1'),
      ).rejects.toThrow(BadRequestException);
      expect(mockRepository.updatePayoutStatus).not.toHaveBeenCalled();
    });

    it('should stay idempotent when the status is unchanged', async () => {
      mockRepository.getPayoutStatus.mockResolvedValue('paid');
      await expect(
        service.updatePayoutStatus('b1', 'paid', 'admin-1'),
      ).resolves.toEqual({ success: true });
      expect(mockRepository.updatePayoutStatus).toHaveBeenCalledWith(
        'b1',
        'paid',
      );
    });

    it('should throw NotFound when the booking does not exist', async () => {
      mockRepository.getPayoutStatus.mockResolvedValue(null);
      await expect(
        service.updatePayoutStatus('missing', 'paid', 'admin-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
