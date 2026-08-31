import { Test, TestingModule } from '@nestjs/testing';
import { EnquiriesController } from './enquiries.controller';
import { AdminService } from './admin.service';
import { CreateEnquiryDto } from './dto/create-enquiry.dto';

describe('EnquiriesController', () => {
  let controller: EnquiriesController;

  const mockAdminService = {
    submitEnquiry: jest.fn().mockResolvedValue({
      success: true,
      id: 42,
      message: 'Enquiry submitted successfully',
    }),
    getRecentEnquiries: jest.fn().mockResolvedValue([
      {
        display_name: 'Community member',
        category: 'General Enquiry',
        submitted_at: '2026-08-30T10:00:00.000Z',
      },
    ]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EnquiriesController],
      providers: [
        {
          provide: AdminService,
          useValue: mockAdminService,
        },
      ],
    }).compile();

    controller = module.get<EnquiriesController>(EnquiriesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('submitEnquiry (POST /enquiries)', () => {
    it('should submit an enquiry and return success response', async () => {
      const dto: CreateEnquiryDto = {
        name: 'Elena Rostova',
        email: 'elena@example.com',
        phone: '+905551234567',
        subject: 'VIP Concierge',
        message: 'Need yacht charter',
        enquiry_type: 'yacht',
        service_type: 'vip',
        dates: '2026-09-01',
        duration: '3 hours',
        party_size: 4,
        preferred_contact: 'whatsapp',
      };

      const result = await controller.submitEnquiry(dto);

      expect(result).toEqual({
        success: true,
        id: 42,
        message: 'Enquiry submitted successfully',
      });
      expect(mockAdminService.submitEnquiry).toHaveBeenCalledWith(dto);
    });
  });

  describe('getRecent (GET /enquiries/recent)', () => {
    it('should return recent enquiries with default limit 8', async () => {
      const result = await controller.getRecent();
      expect(result).toEqual([
        {
          display_name: 'Community member',
          category: 'General Enquiry',
          submitted_at: '2026-08-30T10:00:00.000Z',
        },
      ]);
      expect(mockAdminService.getRecentEnquiries).toHaveBeenCalledWith(8);
    });

    it('should pass limit from LimitQueryDto correctly', async () => {
      await controller.getRecent({ limit: 5 });
      expect(mockAdminService.getRecentEnquiries).toHaveBeenCalledWith(5);
    });
  });
});
