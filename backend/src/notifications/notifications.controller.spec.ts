import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import {
  NotificationsService,
  LiveNotification,
} from './notifications.service';
import { AuthGuard } from '../auth/auth.guard';
import { AuthUser } from '../auth/types/auth-user.interface';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let mockNotificationsService: {
    getUserNotifications: jest.Mock;
    markAsRead: jest.Mock;
    markAllAsRead: jest.Mock;
    deleteNotification: jest.Mock;
  };

  const mockUser: AuthUser = { id: 'user-123', email: 'test@example.com' };

  const sampleNotifications: LiveNotification[] = [
    {
      id: 'notif-1',
      userId: 'user-123',
      type: 'NEW_BOOKING',
      title: 'Booking Created',
      message: 'New booking confirmed',
      read: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'notif-2',
      userId: 'user-123',
      type: 'SYSTEM',
      title: 'System Update',
      message: 'Maintenance scheduled',
      read: true,
      createdAt: new Date().toISOString(),
    },
  ];

  beforeEach(async () => {
    mockNotificationsService = {
      getUserNotifications: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      deleteNotification: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<NotificationsController>(NotificationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getUserNotifications', () => {
    it('should return all notifications for the authenticated user', async () => {
      mockNotificationsService.getUserNotifications.mockResolvedValue(
        sampleNotifications,
      );

      const result = await controller.getUserNotifications(mockUser);

      expect(
        mockNotificationsService.getUserNotifications,
      ).toHaveBeenCalledWith('user-123');
      expect(result).toEqual(sampleNotifications);
    });
  });

  describe('markAsRead', () => {
    it('should mark single notification as read', async () => {
      mockNotificationsService.markAsRead.mockResolvedValue(true);

      const result = await controller.markAsRead('notif-1', mockUser);

      expect(mockNotificationsService.markAsRead).toHaveBeenCalledWith(
        'user-123',
        'notif-1',
      );
      expect(result).toEqual({ success: true });
    });

    it('should return success false if notification was not found', async () => {
      mockNotificationsService.markAsRead.mockResolvedValue(false);

      const result = await controller.markAsRead('non-existent', mockUser);

      expect(mockNotificationsService.markAsRead).toHaveBeenCalledWith(
        'user-123',
        'non-existent',
      );
      expect(result).toEqual({ success: false });
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read and return the count', async () => {
      mockNotificationsService.markAllAsRead.mockResolvedValue(2);

      const result = await controller.markAllAsRead(mockUser);

      expect(mockNotificationsService.markAllAsRead).toHaveBeenCalledWith(
        'user-123',
      );
      expect(result).toEqual({ success: true, count: 2 });
    });
  });

  describe('deleteNotification', () => {
    it('should delete a notification and return success true', async () => {
      mockNotificationsService.deleteNotification.mockResolvedValue(true);

      const result = await controller.deleteNotification('notif-1', mockUser);

      expect(mockNotificationsService.deleteNotification).toHaveBeenCalledWith(
        'user-123',
        'notif-1',
      );
      expect(result).toEqual({ success: true });
    });

    it('should return success false when deleting non-existent notification', async () => {
      mockNotificationsService.deleteNotification.mockResolvedValue(false);

      const result = await controller.deleteNotification('notif-999', mockUser);

      expect(mockNotificationsService.deleteNotification).toHaveBeenCalledWith(
        'user-123',
        'notif-999',
      );
      expect(result).toEqual({ success: false });
    });
  });
});
