import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreateEnquiryDto } from './dto/create-enquiry.dto';
import { LimitQueryDto } from '../common/dto/pagination.dto';
import { PublicEnquirySummaryDto } from './dto/public-enquiry-summary.dto';

@Controller('enquiries')
export class EnquiriesController {
  constructor(private readonly adminService: AdminService) {}

  @Post()
  async submitEnquiry(@Body() dto: CreateEnquiryDto) {
    return this.adminService.submitEnquiry(dto);
  }

  @Get('recent')
  async getRecent(
    @Query() query?: LimitQueryDto,
  ): Promise<PublicEnquirySummaryDto[]> {
    const limit = query?.limit ?? 8;
    return this.adminService.getRecentEnquiries(limit);
  }
}
