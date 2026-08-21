import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminRepository } from './admin.repository';
import { AdminController } from './admin.controller';
import { AuthenticatedRequest } from '../directory/types/directory.types';

import { AuthGuard } from '../auth/auth.guard';
import { SupabaseService } from '../supabase/supabase.service';

describe('Admin Analytics & Hub TDD Suite', () => {
  let controller: AdminController;
  let service: AdminService;

  const mockAnalyticsData = {
    kpiSummary: {
      totalViews: 1250,
      totalClicks: 340,
      totalWhatsAppClicks: 180,
      totalWebsiteClicks: 110,
      totalMapClicks: 50,
      activeListingsCount: 45,
      pendingListingsCount: 8,
      pendingClaimsCount: 4,
      totalClaimsCount: 12,
      approvedClaimsCount: 6,
      claimConversionRate: 50.0,
    },
    viewsTrend: [
      {
        date: '2026-08-01',
        views: 120,
        whatsappClicks: 15,
        websiteClicks: 10,
        mapClicks: 5,
        totalClicks: 30,
      },
      {
        date: '2026-08-02',
        views: 140,
        whatsappClicks: 20,
        websiteClicks: 12,
        mapClicks: 8,
        totalClicks: 40,
      },
    ],
    channelBreakdown: [
      {
        channel: 'whatsapp' as const,
        label: 'WhatsApp',
        clicks: 180,
        percentage: 52.94,
      },
      {
        channel: 'website' as const,
        label: 'Website',
        clicks: 110,
        percentage: 32.35,
      },
      {
        channel: 'map' as const,
        label: 'Directions',
        clicks: 50,
        percentage: 14.71,
      },
    ],
    tierDistribution: {
      explorer: 25,
      voyager: 12,
      signature: 5,
      partner: 3,
    },
    statusDistribution: {
      approved: 45,
      pending: 8,
      rejected: 3,
      draft: 6,
    },
    topListings: [
      {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Grand Alanya Resort',
        category: 'Hotels',
        tier: 'signature',
        views: 450,
        clicks: 120,
      },
    ],
  };

  const mockAdminRepository = {
    getUserRole: jest.fn(),
    getPlatformAnalytics: jest.fn(),
    getEnquiries: jest.fn(),
    updateEnquiryStatus: jest.fn(),
    assignEnquiry: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        AdminService,
        {
          provide: AdminRepository,
          useValue: mockAdminRepository,
        },
        {
          provide: SupabaseService,
          useValue: {},
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AdminController>(AdminController);
    service = module.get<AdminService>(AdminService);
  });

  describe('AdminService.getPlatformAnalytics', () => {
    it('should throw UnauthorizedException if user is not admin', async () => {
      mockAdminRepository.getUserRole.mockResolvedValue('user');

      await expect(
        service.getPlatformAnalytics(30, 'user-uuid-1'),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockAdminRepository.getUserRole).toHaveBeenCalledWith(
        'user-uuid-1',
      );
      expect(mockAdminRepository.getPlatformAnalytics).not.toHaveBeenCalled();
    });

    it('should return aggregated platform analytics if user is admin', async () => {
      mockAdminRepository.getUserRole.mockResolvedValue('admin');
      mockAdminRepository.getPlatformAnalytics.mockResolvedValue(
        mockAnalyticsData,
      );

      const result = await service.getPlatformAnalytics(30, 'admin-uuid-1');

      expect(mockAdminRepository.getUserRole).toHaveBeenCalledWith(
        'admin-uuid-1',
      );
      expect(mockAdminRepository.getPlatformAnalytics).toHaveBeenCalledWith(30);
      expect(result).toEqual(mockAnalyticsData);
      expect(result.kpiSummary.totalViews).toBe(1250);
      expect(result.kpiSummary.claimConversionRate).toBe(50.0);
    });

    it('should fallback to 30 days if days param is invalid or omitted', async () => {
      mockAdminRepository.getUserRole.mockResolvedValue('admin');
      mockAdminRepository.getPlatformAnalytics.mockResolvedValue(
        mockAnalyticsData,
      );

      await service.getPlatformAnalytics(0, 'admin-uuid-1');
      expect(mockAdminRepository.getPlatformAnalytics).toHaveBeenCalledWith(30);
    });
  });

  describe('AdminController.getAnalytics', () => {
    it('should delegate getAnalytics to AdminService with authenticated user id and days query', async () => {
      mockAdminRepository.getUserRole.mockResolvedValue('admin');
      mockAdminRepository.getPlatformAnalytics.mockResolvedValue(
        mockAnalyticsData,
      );

      const req = {
        user: { id: 'admin-uuid-1', role: 'admin' },
      } as AuthenticatedRequest;

      const result = await controller.getAnalytics('90', req);

      expect(result).toEqual(mockAnalyticsData);
      expect(mockAdminRepository.getPlatformAnalytics).toHaveBeenCalledWith(90);
    });
  });

  describe('AdminRepository.getPlatformAnalytics (Empirical Data Rollups & Null Safety)', () => {
    it('handles malformed rows (missing dates, null listing_ids) without crashing', async () => {
      const mockSupabase = {
        from: jest.fn().mockImplementation((table: string) => {
          if (table === 'directory_listings') {
            return {
              select: jest.fn().mockResolvedValue({
                data: [
                  {
                    id: 'l1',
                    name: 'Resort A',
                    status: 'approved',
                    tier: 'signature',
                    category_id: 'hotels',
                  },
                  {
                    id: 'l2',
                    name: 'Spa B',
                    status: 'pending',
                    tier: 'voyager',
                    category_id: 'wellness',
                  },
                ],
                error: null,
              }),
            };
          }
          if (table === 'listing_analytics') {
            return {
              select: jest.fn().mockReturnValue({
                gte: jest.fn().mockReturnValue({
                  order: jest.fn().mockResolvedValue({
                    data: [
                      {
                        listing_id: 'l1',
                        date: '2026-08-15',
                        views: 100,
                        whatsapp_clicks: 10,
                        website_clicks: 5,
                        map_clicks: 2,
                      },
                      {
                        listing_id: null,
                        date: null,
                        views: 50,
                        whatsapp_clicks: 5,
                        website_clicks: 2,
                        map_clicks: 1,
                      }, // malformed row
                      {
                        listing_id: 'l1',
                        date: '2026-08-15',
                        views: 20,
                        whatsapp_clicks: 2,
                        website_clicks: 1,
                        map_clicks: 0,
                      },
                    ],
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === 'listing_claims') {
            return {
              select: jest.fn().mockResolvedValue({
                data: [
                  { id: 'c1', status: 'approved' },
                  { id: 'c2', status: 'pending' },
                ],
                error: null,
              }),
            };
          }
          return {
            select: jest.fn().mockResolvedValue({ data: [], error: null }),
          };
        }),
      };

      const realRepo = new AdminRepository({
        getClient: () => mockSupabase,
      } as unknown as SupabaseService);

      const analytics = await realRepo.getPlatformAnalytics(30);

      expect(analytics.kpiSummary.totalViews).toBe(120);
      expect(analytics.kpiSummary.totalWhatsAppClicks).toBe(12);
      expect(analytics.kpiSummary.totalWebsiteClicks).toBe(6);
      expect(analytics.kpiSummary.totalMapClicks).toBe(2);
      expect(analytics.kpiSummary.totalClicks).toBe(20);
      expect(analytics.kpiSummary.approvedClaimsCount).toBe(1);
      expect(analytics.kpiSummary.totalClaimsCount).toBe(2);
      expect(analytics.kpiSummary.claimConversionRate).toBe(50);
      expect(analytics.viewsTrend).toHaveLength(1);
      expect(analytics.viewsTrend[0].date).toBe('2026-08-15');
      expect(analytics.viewsTrend[0].views).toBe(120);
      expect(analytics.topListings).toHaveLength(1);
      expect(analytics.topListings[0].id).toBe('l1');
      expect(analytics.topListings[0].name).toBe('Resort A');
    });
  });
});
