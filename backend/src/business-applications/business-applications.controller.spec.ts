import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { ROLE_KEY } from '../auth/decorators/require-role.decorator';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { BusinessApplicationsController } from './business-applications.controller';
import {
  BusinessApplicationsPersistenceException,
  BusinessApplicationsRepository,
} from './business-applications.repository';
import { BusinessApplicationsService } from './business-applications.service';

describe('BusinessApplicationsController security', () => {
  const service = {
    getMine: jest.fn(),
    submit: jest.fn(),
    list: jest.fn(),
    approve: jest.fn(),
    reject: jest.fn(),
  };
  const controller = new BusinessApplicationsController(
    service as unknown as BusinessApplicationsService,
  );
  const user = { id: 'authenticated-user', app_metadata: { role: 'admin' } };

  beforeEach(() => jest.clearAllMocks());

  it.each(['getMine', 'submit'] as const)(
    'protects applicant handler %s with AuthGuard',
    (handler) => {
      expect(Reflect.getMetadata(GUARDS_METADATA, controller[handler])).toEqual(
        [AuthGuard],
      );
    },
  );

  it.each(['list', 'approve', 'reject'] as const)(
    'protects admin handler %s using database-backed role authorization',
    (handler) => {
      expect(Reflect.getMetadata(GUARDS_METADATA, controller[handler])).toEqual(
        [AuthGuard, RolesGuard],
      );
      expect(Reflect.getMetadata(ROLE_KEY, controller[handler])).toEqual([
        'admin',
      ]);
    },
  );

  it('uses authenticated identity rather than token metadata or body identity', async () => {
    const dto = {
      accountType: 'seller' as const,
      businessName: 'Alanya Crafts',
      contactEmail: 'owner@example.com',
    };
    service.submit.mockResolvedValue({ id: 'application-1' });

    await controller.submit(dto, user);

    expect(service.submit).toHaveBeenCalledWith('authenticated-user', dto);
  });

  it('returns the pending review queue page from the admin list service', async () => {
    const query = { page: 2, limit: 20 };
    const page = {
      items: [{ id: 'application-1', status: 'pending' }],
      page: 2,
      limit: 20,
      total: 21,
    };
    service.list.mockResolvedValue(page);

    await expect(controller.list(query)).resolves.toEqual(page);
    expect(service.list).toHaveBeenCalledWith(query);
  });

  it('passes authenticated admin identity to both review operations', async () => {
    service.approve.mockResolvedValue({ status: 'approved' });
    service.reject.mockResolvedValue({ status: 'rejected' });

    await controller.approve('11111111-1111-4111-8111-111111111111', user);
    await controller.reject(
      '11111111-1111-4111-8111-111111111111',
      { reason: 'The evidence is insufficient.' },
      user,
    );

    expect(service.approve).toHaveBeenCalledWith(
      '11111111-1111-4111-8111-111111111111',
      'authenticated-user',
    );
    expect(service.reject).toHaveBeenCalledWith(
      '11111111-1111-4111-8111-111111111111',
      'authenticated-user',
      'The evidence is insufficient.',
    );
  });

  it.each([
    {
      code: 'P0002',
      expected: new NotFoundException(
        'Business account application not found.',
      ),
    },
    {
      code: '23514',
      expected: new ConflictException(
        'Business account application is no longer pending.',
      ),
    },
    {
      code: '23505',
      expected: new ConflictException(
        'A conflicting business account application already exists.',
      ),
    },
    {
      code: 'P0001',
      expected: new InternalServerErrorException(
        'Unable to process the business account application.',
      ),
    },
  ])(
    'exposes the sanitized review exception for repository code $code',
    async ({ code, expected }) => {
      const rawMessage = `private database review details for ${code}`;
      const repository = {
        approve: jest
          .fn()
          .mockRejectedValue(
            new BusinessApplicationsPersistenceException(rawMessage, code),
          ),
      };
      const integratedController = new BusinessApplicationsController(
        new BusinessApplicationsService(
          repository as unknown as BusinessApplicationsRepository,
        ),
      );

      const operation = integratedController.approve(
        '11111111-1111-4111-8111-111111111111',
        user,
      );
      await expect(operation).rejects.toEqual(expected);
      await operation.catch((error: unknown) => {
        expect(String(error)).not.toContain(rawMessage);
      });
    },
  );
});
