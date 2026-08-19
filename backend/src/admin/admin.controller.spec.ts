import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

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
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        {
          provide: AdminService,
          useValue: mockAdminService,
        },
      ],
    }).compile();

    controller = module.get<AdminController>(AdminController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getEnquiries', () => {
    it('should return a list of enquiries', async () => {
      const result = await controller.getEnquiries();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('John Doe');
      expect(mockAdminService.getEnquiries).toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    it('should update enquiry status', async () => {
      const result = await controller.updateStatus('1', {
        status: 'responded',
      });
      expect(result).toEqual({ success: true });
      expect(mockAdminService.updateEnquiryStatus).toHaveBeenCalledWith(
        1,
        'responded',
      );
    });
  });

  describe('assignEnquiry', () => {
    it('should assign enquiry to user', async () => {
      const result = await controller.assignEnquiry('1', {
        assigned_to: 'user-uuid-123',
      });
      expect(result).toEqual({ success: true });
      expect(mockAdminService.assignEnquiry).toHaveBeenCalledWith(
        1,
        'user-uuid-123',
      );
    });
  });
});
