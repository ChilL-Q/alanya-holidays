import { Test, TestingModule } from '@nestjs/testing';
import { ForumModerationController } from './forum-moderation.controller';
import { ForumDiscussionService } from './application/forum-discussion.service';
import { ForumReportService } from './application/forum-report.service';
import { ModerationAuditService } from '../admin/moderation-audit.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { AuthUser } from '../auth/types/auth-user.interface';
import {
  CreateForumReportDto,
  GetForumReportsQueryDto,
} from './dto/forum-reports.dto';

describe('ForumModerationController', () => {
  let controller: ForumModerationController;
  let mockService: Record<string, jest.Mock>;
  let mockAuditService: Record<string, jest.Mock>;

  beforeEach(async () => {
    mockService = {
      reportContent: jest.fn().mockResolvedValue({ success: true }),
      getForumReports: jest.fn().mockResolvedValue([]),
      resolveForumReport: jest.fn().mockResolvedValue({ success: true }),
      getRemovedComments: jest.fn().mockResolvedValue([]),
    };

    mockAuditService = {
      logAction: jest.fn().mockResolvedValue({ id: 'audit-rep-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ForumModerationController],
      providers: [
        {
          provide: ForumDiscussionService,
          useValue: mockService,
        },
        {
          provide: ForumReportService,
          useValue: mockService,
        },
        {
          provide: ModerationAuditService,
          useValue: mockAuditService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ForumModerationController>(
      ForumModerationController,
    );
  });

  it('should delegate reportContent with reporter userId', async () => {
    const user: AuthUser = { id: 'usr-1' };
    const body: CreateForumReportDto = {
      target_type: 'post',
      target_id: 'post-1',
      reason: 'Inappropriate content',
    };

    const res = await controller.reportContent(body, user);
    expect(res).toEqual({ success: true });
    expect(mockService.reportContent).toHaveBeenCalledWith(body, 'usr-1');
  });

  it('should delegate getForumReports with includeResolved boolean or string', async () => {
    const user: AuthUser = { id: 'admin-1' };

    await controller.getForumReports({ includeResolved: true }, user);
    expect(mockService.getForumReports).toHaveBeenCalledWith(
      expect.objectContaining({ includeResolved: true }),
      'admin-1',
    );

    await controller.getForumReports(
      { includeResolved: 'true' as unknown as boolean },
      user,
    );
    expect(mockService.getForumReports).toHaveBeenCalledWith(
      expect.objectContaining({ includeResolved: true }),
      'admin-1',
    );

    await controller.getForumReports({ includeResolved: false }, user);
    expect(mockService.getForumReports).toHaveBeenCalledWith(
      expect.objectContaining({ includeResolved: false }),
      'admin-1',
    );
  });

  it('should delegate getForumReports with pagination and target_type filters', async () => {
    const user: AuthUser = { id: 'admin-1' };
    const query: GetForumReportsQueryDto = {
      includeResolved: true,
      page: 2,
      limit: 10,
      target_type: 'post',
    };

    await controller.getForumReports(query, user);
    expect(mockService.getForumReports).toHaveBeenCalledWith(
      {
        includeResolved: true,
        page: 2,
        limit: 10,
        target_type: 'post',
      },
      'admin-1',
    );
  });

  it('should delegate resolveForumReport with id and userId and log audit action', async () => {
    const user: AuthUser = { id: 'admin-1' };

    const res = await controller.resolveForumReport('rep-1', user);
    expect(res).toEqual({ success: true });
    expect(mockService.resolveForumReport).toHaveBeenCalledWith(
      'rep-1',
      'admin-1',
    );
    expect(mockAuditService.logAction).toHaveBeenCalledWith({
      entity_type: 'forum_report',
      entity_id: 'rep-1',
      action: 'resolve',
      admin_id: 'admin-1',
    });
  });

  it('should delegate getRemovedComments with custom limit and default limit', async () => {
    const user: AuthUser = { id: 'admin-1' };

    await controller.getRemovedComments({ limit: 25 }, user);
    expect(mockService.getRemovedComments).toHaveBeenCalledWith(25, 'admin-1');

    await controller.getRemovedComments({}, user);
    expect(mockService.getRemovedComments).toHaveBeenCalledWith(50, 'admin-1');
  });
});
