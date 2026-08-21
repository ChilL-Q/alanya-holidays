import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminRepository } from './admin.repository';
import { CreateEnquiryDto } from './dto/create-enquiry.dto';

describe('AdminService', () => {
  let service: AdminService;

  const mockAdminRepository = {
    getUserRole: jest.fn(),
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
    getPlatformAnalytics: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

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
    it('should throw UnauthorizedException if user is not admin', async () => {
      mockAdminRepository.getUserRole.mockResolvedValue('user');
      await expect(service.getEnquiries('user-123')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockAdminRepository.getEnquiries).not.toHaveBeenCalled();
    });

    it('should return enquiries from repository if user is admin', async () => {
      mockAdminRepository.getUserRole.mockResolvedValue('admin');
      const result = await service.getEnquiries('admin-123');
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
    it('should throw UnauthorizedException if user is not admin', async () => {
      mockAdminRepository.getUserRole.mockResolvedValue('user');
      await expect(
        service.updateEnquiryStatus(1, 'responded', 'user-123'),
      ).rejects.toThrow(UnauthorizedException);
      expect(mockAdminRepository.updateEnquiryStatus).not.toHaveBeenCalled();
    });

    it('should update status via repository if user is admin', async () => {
      mockAdminRepository.getUserRole.mockResolvedValue('admin');
      const result = await service.updateEnquiryStatus(
        1,
        'responded',
        'admin-123',
      );
      expect(result).toEqual({ success: true });
      expect(mockAdminRepository.updateEnquiryStatus).toHaveBeenCalledWith(
        1,
        'responded',
      );
    });
  });

  describe('assignEnquiry', () => {
    it('should throw UnauthorizedException if user is not admin', async () => {
      mockAdminRepository.getUserRole.mockResolvedValue('user');
      await expect(
        service.assignEnquiry(1, 'agent-123', 'user-123'),
      ).rejects.toThrow(UnauthorizedException);
      expect(mockAdminRepository.assignEnquiry).not.toHaveBeenCalled();
    });

    it('should assign enquiry via repository if user is admin', async () => {
      mockAdminRepository.getUserRole.mockResolvedValue('admin');
      const result = await service.assignEnquiry(1, 'agent-123', 'admin-123');
      expect(result).toEqual({ success: true });
      expect(mockAdminRepository.assignEnquiry).toHaveBeenCalledWith(
        1,
        'agent-123',
      );
    });
  });
});
