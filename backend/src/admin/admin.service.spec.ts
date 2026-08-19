import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { AdminRepository } from './admin.repository';
import { CreateEnquiryDto } from './dto/create-enquiry.dto';

describe('AdminService', () => {
  let service: AdminService;

  const mockAdminRepository = {
    getEnquiries: jest.fn().mockResolvedValue([
      {
        id: 1,
        name: 'Sarah Connor',
        email: 'sarah@example.com',
        subject: 'Villa Enquiry',
        message: 'Sea view villa needed for 2 weeks',
        status: 'new',
        enquiry_type: 'villa',
        created_at: new Date().toISOString(),
      },
    ]),
    getRecentEnquiries: jest.fn().mockResolvedValue([
      {
        id: 1,
        name: 'Sarah Connor',
        email: 'sarah@example.com',
        subject: 'Villa Enquiry',
        message: 'Sea view villa needed for 2 weeks',
        status: 'new',
        enquiry_type: 'villa',
        created_at: new Date().toISOString(),
      },
    ]),
    submitEnquiry: jest.fn().mockResolvedValue({ id: 101, success: true }),
    updateEnquiryStatus: jest.fn().mockResolvedValue(true),
    assignEnquiry: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: AdminRepository,
          useValue: mockAdminRepository,
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getEnquiries', () => {
    it('should return enquiries from repository', async () => {
      const result = await service.getEnquiries();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Sarah Connor');
      expect(mockAdminRepository.getEnquiries).toHaveBeenCalled();
    });
  });

  describe('getRecentEnquiries', () => {
    it('should return recent enquiries with specified limit', async () => {
      const result = await service.getRecentEnquiries(5);
      expect(result).toHaveLength(1);
      expect(mockAdminRepository.getRecentEnquiries).toHaveBeenCalledWith(5);
    });

    it('should return recent enquiries with default limit', async () => {
      const result = await service.getRecentEnquiries();
      expect(result).toHaveLength(1);
      expect(mockAdminRepository.getRecentEnquiries).toHaveBeenCalledWith(8);
    });
  });

  describe('submitEnquiry', () => {
    it('should submit an enquiry and return formatted response', async () => {
      const dto: CreateEnquiryDto = {
        name: 'Sarah Connor',
        email: 'sarah@example.com',
        message: 'Sea view villa needed for 2 weeks',
      };

      const result = await service.submitEnquiry(dto);
      expect(result).toEqual({
        success: true,
        id: 101,
        message: 'Enquiry submitted successfully',
      });
      expect(mockAdminRepository.submitEnquiry).toHaveBeenCalledWith(dto);
    });
  });

  describe('updateEnquiryStatus', () => {
    it('should update status via repository', async () => {
      const result = await service.updateEnquiryStatus(1, 'responded');
      expect(result).toEqual({ success: true });
      expect(mockAdminRepository.updateEnquiryStatus).toHaveBeenCalledWith(
        1,
        'responded',
      );
    });
  });

  describe('assignEnquiry', () => {
    it('should assign enquiry via repository', async () => {
      const result = await service.assignEnquiry(1, 'agent-123');
      expect(result).toEqual({ success: true });
      expect(mockAdminRepository.assignEnquiry).toHaveBeenCalledWith(
        1,
        'agent-123',
      );
    });
  });
});
