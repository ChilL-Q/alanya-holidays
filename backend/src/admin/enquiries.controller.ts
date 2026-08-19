import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreateEnquiryDto } from './dto/create-enquiry.dto';

@Controller('enquiries')
export class EnquiriesController {
  constructor(private readonly adminService: AdminService) {}

  @Post()
  async submitEnquiry(@Body() dto: CreateEnquiryDto) {
    return this.adminService.submitEnquiry(dto);
  }

  @Get('recent')
  async getRecent(@Query('limit') limit?: string) {
    const parsedLimit = limit
      ? Math.max(1, Math.min(100, parseInt(limit, 10) || 8))
      : 8;
    return this.adminService.getRecentEnquiries(parsedLimit);
  }
}
