import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AuthGuard } from '../auth/auth.guard';
import { AuthenticatedRequest } from '../directory/types/directory.types';
import {
  ConciergeEnquiryRecord,
  PlatformAnalyticsData,
} from './admin.repository';

@Controller('admin')
@UseGuards(AuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('enquiries')
  async getEnquiries(
    @Req() req: AuthenticatedRequest,
  ): Promise<ConciergeEnquiryRecord[]> {
    return await this.adminService.getEnquiries(req.user.id);
  }

  @Patch('enquiries/:id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
    @Req() req: AuthenticatedRequest,
  ): Promise<{ success: boolean }> {
    return await this.adminService.updateEnquiryStatus(
      Number(id),
      body.status,
      req.user.id,
    );
  }

  @Patch('enquiries/:id/assign')
  async assignEnquiry(
    @Param('id') id: string,
    @Body() body: { assigned_to: string | null },
    @Req() req: AuthenticatedRequest,
  ): Promise<{ success: boolean }> {
    return await this.adminService.assignEnquiry(
      Number(id),
      body.assigned_to,
      req.user.id,
    );
  }

  @Get('analytics')
  async getAnalytics(
    @Query('days') days: string | undefined,
    @Req() req: AuthenticatedRequest,
  ): Promise<PlatformAnalyticsData> {
    const parsedDays = days ? parseInt(days, 10) : 30;
    return await this.adminService.getPlatformAnalytics(
      parsedDays,
      req.user.id,
    );
  }
}
