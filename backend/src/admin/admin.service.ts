import { Injectable } from '@nestjs/common';
import {
  AdminRepository,
  ConciergeEnquiryRecord,
  PlatformAnalyticsData,
  RecentEnquirySource,
} from './admin.repository';
import { CreateEnquiryDto } from './dto/create-enquiry.dto';
import { PublicEnquirySummaryDto } from './dto/public-enquiry-summary.dto';

const PUBLIC_ENQUIRY_CATEGORIES = new Set([
  'Clothing & Apparel',
  'Home Decor & Ceramics',
  'Turkish Delight & Food',
  'Textiles & Towels',
  'Leather Goods',
  'Jewelry & Accessories',
  'Gift Items',
  'Travel Experiences',
]);

function toPublicEnquirySummary(
  enquiry: RecentEnquirySource,
): PublicEnquirySummaryDto {
  const match = enquiry.subject?.match(
    /Personal Shopper Request\s*[—–-]\s*(.+)/i,
  );
  const candidate = match?.[1]?.trim();

  return {
    display_name: 'Community member',
    category:
      candidate && PUBLIC_ENQUIRY_CATEGORIES.has(candidate)
        ? candidate
        : 'General Enquiry',
    submitted_at: enquiry.created_at,
  };
}

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

  async getRecentEnquiries(limit = 8): Promise<PublicEnquirySummaryDto[]> {
    const enquiries = await this.adminRepository.getRecentEnquiries(limit);
    return enquiries.map(toPublicEnquirySummary);
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
