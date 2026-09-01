import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Optional,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { ModerationAuditService } from './moderation-audit.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { RequireRole } from '../auth/decorators/require-role.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/types/auth-user.interface';
import {
  AdminRepository,
  ConciergeEnquiryRecord,
  PlatformAnalyticsData,
} from './admin.repository';
import { DaysQueryDto } from '../common/dto/pagination.dto';
import { UpdateEnquiryStatusDto } from './dto/update-enquiry-status.dto';
import { AssignEnquiryDto } from './dto/assign-enquiry.dto';
import { AdminEnquiriesQueryDto } from './dto/admin-enquiries-query.dto';
import {
  GetAuditLogsQueryDto,
  PaginatedAuditLogsResult,
} from './dto/audit-log.dto';

@Controller('admin')
@UseGuards(AuthGuard, RolesGuard)
@RequireRole('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    @Optional()
    private readonly moderationAuditService?: ModerationAuditService,
    @Optional()
    private readonly adminRepository?: AdminRepository,
  ) {}

  @Get('enquiries')
  async getEnquiries(
    @Query() query: AdminEnquiriesQueryDto,
    @CurrentUser() _user: AuthUser,
  ): Promise<ConciergeEnquiryRecord[]> {
    if (this.adminRepository) {
      return await this.adminRepository.getEnquiries(query.page, query.limit);
    }
    return await this.adminService.getEnquiries(_user.id);
  }

  @Patch('enquiries/:id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateEnquiryStatusDto,
    @CurrentUser() user: AuthUser,
  ): Promise<{ success: boolean }> {
    return await this.adminService.updateEnquiryStatus(
      Number(id),
      body.status,
      user.id,
    );
  }

  @Patch('enquiries/:id/assign')
  async assignEnquiry(
    @Param('id') id: string,
    @Body() body: AssignEnquiryDto,
    @CurrentUser() user: AuthUser,
  ): Promise<{ success: boolean }> {
    return await this.adminService.assignEnquiry(
      Number(id),
      body.assigned_to ?? null,
      user.id,
    );
  }

  @Get('analytics')
  async getAnalytics(
    @Query() query: DaysQueryDto,
    @CurrentUser() user: AuthUser,
  ): Promise<PlatformAnalyticsData> {
    return await this.adminService.getPlatformAnalytics(
      query.days ?? 30,
      user.id,
    );
  }

  @Get('audit-logs')
  async getAuditLogs(
    @Query() query: GetAuditLogsQueryDto,
    @CurrentUser() user: AuthUser,
  ): Promise<PaginatedAuditLogsResult> {
    if (!this.moderationAuditService) {
      return {
        data: [],
        total: 0,
        page: query.page || 1,
        limit: query.limit || 20,
        totalPages: 0,
      };
    }
    return await this.moderationAuditService.getAuditLogs(query, user.id);
  }
}
