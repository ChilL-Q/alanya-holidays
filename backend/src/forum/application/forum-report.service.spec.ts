import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ForumReportService } from './forum-report.service';
import { ForumRepository } from '../forum.repository';
import { UserRolesRepository } from '../../common/auth/user-roles.repository';

describe('ForumReportService', () => {
  let service: ForumReportService;
  let mockRepository: Record<string, jest.Mock>;
  let mockUserRoles: Record<string, jest.Mock>;

  const userId = '11111111-1111-4111-a111-111111111111';

  beforeEach(async () => {
    mockRepository = {
      insertReport: jest.fn().mockResolvedValue(undefined),
      getReports: jest.fn().mockResolvedValue([]),
      updateReportResolved: jest.fn().mockResolvedValue(undefined),
    };

    mockUserRoles = {
      getRole: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ForumReportService,
        {
          provide: ForumRepository,
          useValue: mockRepository,
        },
        {
          provide: UserRolesRepository,
          useValue: mockUserRoles,
        },
      ],
    }).compile();

    service = module.get<ForumReportService>(ForumReportService);
  });

  describe('Reporting & Moderation', () => {
    it('submits report for post or comment', async () => {
      const res = await service.reportContent(
        {
          target_type: 'post',
          target_id: 'post-1',
          reason: 'Spam',
        },
        userId,
      );
      expect(res).toEqual({ success: true });
      expect(mockRepository.insertReport).toHaveBeenCalledWith({
        target_type: 'post',
        target_id: 'post-1',
        reporter_id: userId,
        reason: 'Spam',
      });
    });

    it('requires admin to get reports and resolve report', async () => {
      mockUserRoles.getRole.mockResolvedValue('user');
      await expect(service.getForumReports(false, userId)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.resolveForumReport('rep-1', userId)).rejects.toThrow(
        UnauthorizedException,
      );

      mockUserRoles.getRole.mockResolvedValue('admin');
      mockRepository.getReports.mockResolvedValueOnce([
        { id: 'rep-1', reason: 'Spam' },
      ]);
      const reports = await service.getForumReports(false, userId);
      expect(reports).toHaveLength(1);

      const resolveRes = await service.resolveForumReport('rep-1', userId);
      expect(resolveRes).toEqual({ success: true });
      expect(mockRepository.updateReportResolved).toHaveBeenCalledWith('rep-1');
    });
  });
});
