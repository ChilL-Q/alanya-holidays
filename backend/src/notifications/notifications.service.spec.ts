import { Test, TestingModule } from '@nestjs/testing';
import {
  NotificationsService,
  NotificationPayload,
} from './notifications.service';
import { Server } from 'socket.io';

describe('NotificationsService', () => {
  let service: NotificationsService;
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificationsService],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    service.setServer(serverMock as unknown as Server);
  });

  it('should emit notification event to target user room', () => {
    const payload: NotificationPayload = {
      type: 'NEW_BOOKING',
      title: 'Новое бронирование!',
      message: 'У вас новое бронирование апартаментов на даты 25.07 - 30.07',
      data: { bookingId: 'b-123', amount: 500 },
    };

    const result = service.notifyUser('host-user-456', payload);

    expect(serverMock.to).toHaveBeenCalledWith('user:host-user-456');
    expect(emitMock).toHaveBeenCalledWith(
      'notification',
      expect.objectContaining({
        id: expect.any(String),
        type: 'NEW_BOOKING',
        title: 'Новое бронирование!',
        message: payload.message,
        createdAt: expect.any(String),
        data: payload.data,
      }),
    );
    expect(result).toHaveProperty('id');
  });

  it('should store recent notifications in memory for retrieval', () => {
    service.notifyUser('host-user-1', {
      type: 'BOOKING_CANCELLED',
      title: 'Бронирование отменено',
      message: 'Гость отменил бронь',
    });

    const userNotifications = service.getUserNotifications('host-user-1');
    expect(userNotifications).toHaveLength(1);
    expect(userNotifications[0].title).toBe('Бронирование отменено');
  });
});
