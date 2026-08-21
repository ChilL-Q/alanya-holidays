import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AuthGuard } from '../auth/auth.guard';
import { SupabaseService } from '../supabase/supabase.service';
import { AuthenticatedRequest } from '../directory/types/directory.types';

describe('AdminController', () => {
  let controller: AdminController;

  const mockAdminService = {
    getEnquiries: jest.fn().mockResolvedValue([
      {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Concierge Request',
        message: 'Looking for a private yacht tour',
        status: 'new',
        enquiry_type: 'yacht',
        created_at: new Date().toISOString(),
      },
    ]),
    updateEnquiryStatus: jest.fn().mockResolvedValue({ success: true }),
    assignEnquiry: jest.fn().mockResolvedValue({ success: true }),
    getPlatformAnalytics: jest.fn().mockResolvedValue({
      kpiSummary: { totalViews: 100 },
    }),
  };

  const mockReq = {
    user: { id: 'admin-uuid-123', role: 'admin' },
  } as unknown as AuthenticatedRequest;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        {
          provide: AdminService,
          useValue: mockAdminService,
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
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getEnquiries', () => {
    it('should return a list of enquiries with authenticated user id', async () => {
      const result = await controller.getEnquiries(mockReq);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('John Doe');
      expect(mockAdminService.getEnquiries).toHaveBeenCalledWith(
        'admin-uuid-123',
      );
    });
  });

  describe('updateStatus', () => {
    it('should update enquiry status with authenticated user id', async () => {
      const result = await controller.updateStatus(
        '1',
        { status: 'responded' },
        mockReq,
      );
      expect(result).toEqual({ success: true });
      expect(mockAdminService.updateEnquiryStatus).toHaveBeenCalledWith(
        1,
        'responded',
        'admin-uuid-123',
      );
    });
  });

  describe('assignEnquiry', () => {
    it('should assign enquiry to user with authenticated user id', async () => {
      const result = await controller.assignEnquiry(
        '1',
        { assigned_to: 'user-uuid-123' },
        mockReq,
      );
      expect(result).toEqual({ success: true });
      expect(mockAdminService.assignEnquiry).toHaveBeenCalledWith(
        1,
        'user-uuid-123',
        'admin-uuid-123',
      );
    });
  });

  describe('getAnalytics', () => {
    it('should call getPlatformAnalytics with parsed days and user id', async () => {
      const result = await controller.getAnalytics('60', mockReq);
      expect(result).toEqual({ kpiSummary: { totalViews: 100 } });
      expect(mockAdminService.getPlatformAnalytics).toHaveBeenCalledWith(
        60,
        'admin-uuid-123',
      );
    });
  });
});
