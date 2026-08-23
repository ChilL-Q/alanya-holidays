import { Injectable } from '@nestjs/common';
import {
  AdminRepository,
  ConciergeEnquiryRecord,
  PlatformAnalyticsData,
} from './admin.repository';
import { CreateEnquiryDto } from './dto/create-enquiry.dto';

@Injectable()
export class AdminService {
  constructor(private readonly adminRepository: AdminRepository) {}

  async submitEnquiry(
    dto: CreateEnquiryDto,
  ): Promise<{ success: boolean; id: number; message: string }> {
    const result = await this.adminRepository.submitEnquiry(dto);
    return {
      success: result.success,
      id: result.id,
      message: 'Enquiry submitted successfully',
    };
  }

  async getRecentEnquiries(limit = 8): Promise<ConciergeEnquiryRecord[]> {
    return this.adminRepository.getRecentEnquiries(limit);
  }

  async getEnquiries(_userId?: string): Promise<ConciergeEnquiryRecord[]> {
    return this.adminRepository.getEnquiries();
  }

  async updateEnquiryStatus(
    id: number,
    status: string,
    _userId?: string,
  ): Promise<{ success: boolean }> {
    const success = await this.adminRepository.updateEnquiryStatus(id, status);
    return { success };
  }

  async assignEnquiry(
    id: number,
    assignedTo: string | null,
    _userId?: string,
  ): Promise<{ success: boolean }> {
    const success = await this.adminRepository.assignEnquiry(id, assignedTo);
    return { success };
  }

  async getPlatformAnalytics(
    days: number,
    _userId?: string,
  ): Promise<PlatformAnalyticsData> {
    const safeDays = Number.isInteger(days) && days > 0 ? days : 30;
    return await this.adminRepository.getPlatformAnalytics(safeDays);
  }
}
