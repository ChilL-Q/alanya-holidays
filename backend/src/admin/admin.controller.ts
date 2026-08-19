import { Controller, Get, Patch, Param, Body } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('enquiries')
  async getEnquiries() {
    return this.adminService.getEnquiries();
  }

  @Patch('enquiries/:id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.adminService.updateEnquiryStatus(Number(id), body.status);
  }

  @Patch('enquiries/:id/assign')
  async assignEnquiry(
    @Param('id') id: string,
    @Body() body: { assigned_to: string | null },
  ) {
    return this.adminService.assignEnquiry(Number(id), body.assigned_to);
  }
}
