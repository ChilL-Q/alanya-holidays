import { Test, TestingModule } from '@nestjs/testing';
import {
  NotificationsService,
  NotificationPayload,
  LiveNotification,
} from './notifications.service';
import { NOTIFICATIONS_REPOSITORY } from './domain/repositories/notifications.repository.interface';
import { SupabaseService } from '../supabase/supabase.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let mockRepo: {
    create: jest.Mock;
    findByUserId: jest.Mock;
    markAsRead: jest.Mock;
    markAllAsRead: jest.Mock;
    delete: jest.Mock;
  };
  let mockSupabase: { getClient: jest.Mock };

  beforeEach(async () => {
    mockRepo = {
      create: jest.fn(),
      findByUserId: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      delete: jest.fn(),
    };

    mockSupabase = { getClient: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: NOTIFICATIONS_REPOSITORY,
          useValue: mockRepo,
        },
        {
          provide: SupabaseService,
          useValue: mockSupabase,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  it('should persist notification to repository and return it', async () => {
    const payload: NotificationPayload = {
      type: 'NEW_BOOKING',
      title: 'Новое бронирование!',
      message: 'У вас новое бронирование апартаментов на даты 25.07 - 30.07',
      data: { bookingId: 'b-123', amount: 500 },
    };

    const persisted: LiveNotification = {
      id: 'notif-uuid-1',
      userId: 'host-user-456',
      read: false,
      createdAt: '2026-08-24T12:00:00.000Z',
      ...payload,
    };

    mockRepo.create.mockResolvedValue(persisted);

    const result = await service.notifyUser('host-user-456', payload);

    expect(mockRepo.create).toHaveBeenCalledWith({
      userId: 'host-user-456',
      type: payload.type,
      title: payload.title,
      message: payload.message,
      data: payload.data,
      link: undefined,
    });
    expect(result).toEqual(persisted);
  });

  it('should degrade gracefully when repository create fails', async () => {
    mockRepo.create.mockRejectedValue(new Error('db down'));

    const result = await service.notifyUser('user-1', {
      type: 'SYSTEM',
      title: 't',
      message: 'm',
    });

    expect(result.id).toBeDefined();
    expect(result.userId).toBe('user-1');
    expect(result.type).toBe('SYSTEM');
  });

  describe('notifyAdmins', () => {
    const adminRows = [{ id: 'admin-1' }, { id: 'admin-2' }];

    function mockAdminQuery(rows: { id: string }[] | null, error?: Error) {
      const eq = jest
        .fn()
        .mockReturnValue(
          error
            ? Promise.resolve({ data: null, error })
            : Promise.resolve({ data: rows, error: null }),
        );
      mockSupabase.getClient.mockReturnValue({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({ eq }),
        }),
      });
      return eq;
    }

    it('should notify every admin profile with role=admin', async () => {
      mockAdminQuery(adminRows);
      mockRepo.create.mockImplementation(({ userId }) =>
        Promise.resolve({
          id: `n-${userId}`,
          userId,
          read: false,
          createdAt: '2026-08-25T00:00:00.000Z',
          type: 'warning',
          title: 't',
          message: 'm',
        }),
      );

      const results = await service.notifyAdmins({
        title: 'Charge Dispute Filed',
        message: 'A dispute has been filed.',
        type: 'warning',
        link: '/admin/bookings',
      });

      expect(mockRepo.create).toHaveBeenCalledTimes(2);
      expect(results.map((r) => r.userId)).toEqual(['admin-1', 'admin-2']);
    });

    it('should notify nobody when admin resolution fails (never throws)', async () => {
      mockAdminQuery(null, new Error('rls denied'));
      mockRepo.create.mockResolvedValue({
        id: 'n-1',
        userId: 'x',
        read: false,
        createdAt: 'now',
        type: 'warning',
        title: 't',
        message: 'm',
      });

      const results = await service.notifyAdmins({
        title: 't',
        message: 'm',
        type: 'warning',
      });

      expect(results).toEqual([]);
      expect(mockRepo.create).not.toHaveBeenCalled();
    });

    it('should notify nobody when there are no admins', async () => {
      mockAdminQuery([]);

      const results = await service.notifyAdmins({
        title: 't',
        message: 'm',
        type: 'info',
      });

      expect(results).toEqual([]);
    });
  });

  it('should retrieve persistent user notifications from repository', async () => {
    const expected = [
      {
        id: 'n-1',
        userId: 'host-user-1',
        type: 'BOOKING_CANCELLED',
        title: 'Бронирование отменено',
        message: 'Гость отменил бронь',
        read: false,
        createdAt: '2026-08-24T10:00:00.000Z',
      },
    ];

    mockRepo.findByUserId.mockResolvedValue(expected);

    const userNotifications = await service.getUserNotifications('host-user-1');
    expect(mockRepo.findByUserId).toHaveBeenCalledWith('host-user-1');
    expect(userNotifications).toEqual(expected);
  });

  it('should delegate markAsRead to repository', async () => {
    mockRepo.markAsRead.mockResolvedValue(true);

    const res = await service.markAsRead('user-1', 'notif-1');
    expect(mockRepo.markAsRead).toHaveBeenCalledWith('user-1', 'notif-1');
    expect(res).toBe(true);
  });

  it('should delegate markAllAsRead to repository', async () => {
    mockRepo.markAllAsRead.mockResolvedValue(3);

    const count = await service.markAllAsRead('user-2');
    expect(mockRepo.markAllAsRead).toHaveBeenCalledWith('user-2');
    expect(count).toBe(3);
  });

  it('should delegate deleteNotification to repository', async () => {
    mockRepo.delete.mockResolvedValue(true);

    const res = await service.deleteNotification('user-3', 'notif-1');
    expect(mockRepo.delete).toHaveBeenCalledWith('user-3', 'notif-1');
    expect(res).toBe(true);
  });
});
