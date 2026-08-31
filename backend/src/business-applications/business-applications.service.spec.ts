import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  BusinessApplicationsRepository,
  BusinessApplicationsPersistenceException,
} from './business-applications.repository';
import { BusinessApplicationsService } from './business-applications.service';

const application = {
  id: '11111111-1111-4111-8111-111111111111',
  userId: 'user-1',
  accountType: 'seller' as const,
  businessName: 'Alanya Crafts',
  contactEmail: 'owner@example.com',
  contactPhone: null,
  website: null,
  status: 'pending',
  rejectionReason: null,
  reviewedBy: null,
  reviewedAt: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

describe('BusinessApplicationsService', () => {
  const repository = {
    findMine: jest.fn(),
    hasApprovedBusinessAccount: jest.fn(),
    create: jest.fn(),
    findAll: jest.fn(),
    approve: jest.fn(),
    reject: jest.fn(),
  };
  const service = new BusinessApplicationsService(
    repository as unknown as BusinessApplicationsRepository,
  );

  beforeEach(() => jest.clearAllMocks());

  it('delegates approved business capability to the authoritative repository', async () => {
    repository.hasApprovedBusinessAccount.mockResolvedValue(true);

    await expect(service.hasApprovedBusinessAccount('user-1')).resolves.toBe(
      true,
    );
    expect(repository.hasApprovedBusinessAccount).toHaveBeenCalledWith(
      'user-1',
    );
  });

  it('scopes applicant reads and writes to the authenticated user id', async () => {
    repository.findMine.mockResolvedValue(application);
    repository.create.mockResolvedValue(application);
    const dto = {
      accountType: 'seller' as const,
      businessName: 'Alanya Crafts',
      contactEmail: 'owner@example.com',
    };

    await expect(service.getMine('user-1')).resolves.toEqual(application);
    await expect(service.submit('user-1', dto)).resolves.toEqual(application);
    expect(repository.findMine).toHaveBeenCalledWith('user-1');
    expect(repository.create).toHaveBeenCalledWith('user-1', dto);
  });

  it('normalizes submission strings before calling persistence', async () => {
    repository.create.mockResolvedValue(application);

    await service.submit('user-1', {
      accountType: 'seller',
      businessName: '  Alanya Crafts  ',
      contactEmail: '  owner@example.com  ',
      contactPhone: '   ',
      website: '  https://example.com  ',
    });

    expect(repository.create).toHaveBeenCalledWith('user-1', {
      accountType: 'seller',
      businessName: 'Alanya Crafts',
      contactEmail: 'owner@example.com',
      contactPhone: undefined,
      website: 'https://example.com',
    });
  });

  it('returns the pending review queue page from the repository', async () => {
    const page = {
      items: [application],
      page: 2,
      limit: 20,
      total: 21,
    };
    repository.findAll.mockResolvedValue(page);

    await expect(service.list({ page: 2, limit: 20 })).resolves.toEqual(page);
    expect(repository.findAll).toHaveBeenCalledWith(2, 20);
  });

  it('returns a sanitized conflict for duplicate applications', async () => {
    repository.create.mockRejectedValue(
      new BusinessApplicationsPersistenceException(
        'duplicate key value exposes constraint and email',
        '23505',
      ),
    );

    await expect(
      service.submit('user-1', {
        accountType: 'seller',
        businessName: 'Alanya Crafts',
        contactEmail: 'owner@example.com',
      }),
    ).rejects.toEqual(
      new ConflictException(
        'A business account application already exists for this account.',
      ),
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
  ])(
    'maps review RPC code $code to a sanitized HTTP exception',
    async ({ code, expected }) => {
      const rawMessage = `database details must not leak for ${code}`;
      repository.approve.mockRejectedValue(
        new BusinessApplicationsPersistenceException(rawMessage, code),
      );

      const operation = service.approve(application.id, 'admin-1');
      await expect(operation).rejects.toEqual(expected);
      await operation.catch((error: unknown) => {
        expect(String(error)).not.toContain(rawMessage);
      });
      expect(repository.approve).toHaveBeenCalledWith(
        application.id,
        'admin-1',
      );
    },
  );

  it('maps unknown review RPC failures to a sanitized internal error', async () => {
    const rawMessage = 'RPC internals including private table details';
    repository.reject.mockRejectedValue(
      new BusinessApplicationsPersistenceException(rawMessage, 'P0001'),
    );

    const operation = service.reject(
      application.id,
      'admin-1',
      'Insufficient evidence',
    );
    await expect(operation).rejects.toEqual(
      new InternalServerErrorException(
        'Unable to process the business account application.',
      ),
    );
    await operation.catch((error: unknown) => {
      expect(String(error)).not.toContain(rawMessage);
    });
    expect(repository.reject).toHaveBeenCalledWith(
      application.id,
      'admin-1',
      'Insufficient evidence',
    );
  });
});
