import { Test, TestingModule } from '@nestjs/testing';
import {
  NotificationsService,
  NotificationPayload,
  LiveNotification,
} from './notifications.service';
import { NOTIFICATIONS_REPOSITORY } from './domain/repositories/notifications.repository.interface';
import { Server } from 'socket.io';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let mockRepo: {
    create: jest.Mock;
    findByUserId: jest.Mock;
    markAsRead: jest.Mock;
    markAllAsRead: jest.Mock;
    delete: jest.Mock;
  };
  let serverMock: {
    to: jest.Mock;
  };
  let emitMock: jest.Mock;

  beforeEach(async () => {
    emitMock = jest.fn();
    serverMock = {
      to: jest.fn().mockReturnValue({
        emit: emitMock,
      }),
    };

    mockRepo = {
      create: jest.fn(),
      findByUserId: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: NOTIFICATIONS_REPOSITORY,
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    service.setServer(serverMock as unknown as Server);
  });

  it('should emit notification event to target user room and persist to repository', async () => {
    const payload: NotificationPayload = {
      type: 'NEW_BOOKING',
      title: 'Новое бронирование!',
      message: 'У вас новое бронирование апартаментов на даты 25.07 - 30.07',
      data: { bookingId: 'b-123', amount: 500 },
    };

    const persisted: LiveNotification = {
      id: 'notif-uuid-1',
      userId: 'host-user-456',
      read: false,
      createdAt: '2026-08-24T12:00:00.000Z',
      ...payload,
    };

    mockRepo.create.mockResolvedValue(persisted);

    const result = await service.notifyUser('host-user-456', payload);

    expect(mockRepo.create).toHaveBeenCalledWith({
      userId: 'host-user-456',
      type: payload.type,
      title: payload.title,
      message: payload.message,
      data: payload.data,
      link: undefined,
    });
    expect(serverMock.to).toHaveBeenCalledWith('user:host-user-456');
    expect(emitMock).toHaveBeenCalledTimes(1);
    expect(emitMock).toHaveBeenCalledWith('notification', persisted);
    expect(result).toEqual(persisted);
  });

  it('should retrieve persistent user notifications from repository', async () => {
    const expected = [
      {
        id: 'n-1',
        userId: 'host-user-1',
        type: 'BOOKING_CANCELLED',
        title: 'Бронирование отменено',
        message: 'Гость отменил бронь',
        read: false,
        createdAt: '2026-08-24T10:00:00.000Z',
      },
    ];

    mockRepo.findByUserId.mockResolvedValue(expected);

    const userNotifications = await service.getUserNotifications('host-user-1');
    expect(mockRepo.findByUserId).toHaveBeenCalledWith('host-user-1');
    expect(userNotifications).toEqual(expected);
  });

  it('should delegate markAsRead to repository', async () => {
    mockRepo.markAsRead.mockResolvedValue(true);

    const res = await service.markAsRead('user-1', 'notif-1');
    expect(mockRepo.markAsRead).toHaveBeenCalledWith('user-1', 'notif-1');
    expect(res).toBe(true);
  });

  it('should delegate markAllAsRead to repository', async () => {
    mockRepo.markAllAsRead.mockResolvedValue(3);

    const count = await service.markAllAsRead('user-2');
    expect(mockRepo.markAllAsRead).toHaveBeenCalledWith('user-2');
    expect(count).toBe(3);
  });

  it('should delegate deleteNotification to repository', async () => {
    mockRepo.delete.mockResolvedValue(true);

    const res = await service.deleteNotification('user-3', 'notif-1');
    expect(mockRepo.delete).toHaveBeenCalledWith('user-3', 'notif-1');
    expect(res).toBe(true);
  });
});
