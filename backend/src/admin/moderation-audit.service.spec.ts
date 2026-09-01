import { Test, TestingModule } from '@nestjs/testing';
import { ModerationAuditService } from './moderation-audit.service';
import { ModerationAuditRepository } from './moderation-audit.repository';
import { CreateAuditLogDto, GetAuditLogsQueryDto } from './dto/audit-log.dto';

describe('ModerationAuditService', () => {
  let service: ModerationAuditService;
  let mockRepository: Record<string, jest.Mock>;

  const mockAuditRecord = {
    id: 'audit-uuid-1',
    entity_type: 'listing',
    entity_id: 'list-100',
    action: 'approve',
    admin_id: 'admin-1',
    reason: null,
    metadata: { score: 90 },
    created_at: '2026-08-24T00:00:00Z',
    admin: {
      id: 'admin-1',
      full_name: 'Admin User',
      email: 'admin@example.com',
      avatar_url: 'https://example.com/avatar.jpg',
    },
  };

  beforeEach(async () => {
    mockRepository = {
      logAction: jest.fn().mockResolvedValue(mockAuditRecord),
      getAuditLogs: jest.fn().mockResolvedValue({
        data: [mockAuditRecord],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModerationAuditService,
        {
          provide: ModerationAuditRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ModerationAuditService>(ModerationAuditService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('logAction', () => {
    it('should delegate logAction to repository and return the record', async () => {
      const entry: CreateAuditLogDto = {
        entity_type: 'listing',
        entity_id: 'list-100',
        action: 'approve',
        admin_id: 'admin-1',
        metadata: { score: 90 },
      };

      const result = await service.logAction(entry);
      expect(result).toEqual(mockAuditRecord);
      expect(mockRepository.logAction).toHaveBeenCalledWith(entry);
    });
  });

  describe('getAuditLogs', () => {
    it('should delegate getAuditLogs with query filters to repository', async () => {
      const query: GetAuditLogsQueryDto = {
        entity_type: 'listing',
        action: 'approve',
        admin_id: 'admin-1',
        page: 1,
        limit: 10,
        search: 'list-100',
      };

      const result = await service.getAuditLogs(query, 'admin-1');
      expect(result).toEqual({
        data: [mockAuditRecord],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
      expect(mockRepository.getAuditLogs).toHaveBeenCalledWith(query);
    });
  });
});
