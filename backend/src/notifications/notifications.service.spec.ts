import { Test, TestingModule } from '@nestjs/testing';
import {
  NotificationsService,
  NotificationPayload,
  LiveNotification,
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
    expect(emitMock).toHaveBeenCalledTimes(1);
    const firstCall = (
      emitMock.mock.calls as unknown as Array<[string, LiveNotification]>
    )[0];
    expect(firstCall[0]).toBe('notification');
    const emitted = firstCall[1];
    expect(emitted.type).toBe('NEW_BOOKING');
    expect(emitted.title).toBe('Новое бронирование!');
    expect(emitted.message).toBe(payload.message);
    expect(emitted.data).toEqual(payload.data);
    expect(typeof emitted.id).toBe('string');
    expect(typeof emitted.createdAt).toBe('string');
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

  it('should mark a specific notification as read', () => {
    const notif = service.notifyUser('user-1', {
      type: 'SYSTEM',
      title: 'System Alert',
      message: 'Maintenance in 1 hour',
    });

    expect(service.markAsRead('user-1', notif.id)).toBe(true);
    const userNotifications = service.getUserNotifications('user-1');
    expect(userNotifications[0].read).toBe(true);

    expect(service.markAsRead('user-1', 'non-existent-id')).toBe(false);
    expect(service.markAsRead('non-existent-user', notif.id)).toBe(false);
  });

  it('should mark all notifications as read and return updated count', () => {
    service.notifyUser('user-2', {
      type: 'SYSTEM',
      title: 'Alert 1',
      message: 'Msg 1',
    });
    service.notifyUser('user-2', {
      type: 'SYSTEM',
      title: 'Alert 2',
      message: 'Msg 2',
    });

    const count = service.markAllAsRead('user-2');
    expect(count).toBe(2);

    const userNotifications = service.getUserNotifications('user-2');
    expect(userNotifications.every((n) => n.read)).toBe(true);

    // Subsequent call should mark 0 as read
    expect(service.markAllAsRead('user-2')).toBe(0);
    expect(service.markAllAsRead('unknown-user')).toBe(0);
  });

  it('should delete a notification successfully', () => {
    const notif1 = service.notifyUser('user-3', {
      type: 'SYSTEM',
      title: 'Alert 1',
      message: 'Msg 1',
    });
    const notif2 = service.notifyUser('user-3', {
      type: 'SYSTEM',
      title: 'Alert 2',
      message: 'Msg 2',
    });

    expect(service.deleteNotification('user-3', notif1.id)).toBe(true);
    const notifications = service.getUserNotifications('user-3');
    expect(notifications).toHaveLength(1);
    expect(notifications[0].id).toBe(notif2.id);

    expect(service.deleteNotification('user-3', 'non-existent')).toBe(false);
    expect(service.deleteNotification('unknown-user', notif2.id)).toBe(false);
  });
});
