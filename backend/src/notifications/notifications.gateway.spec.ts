import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';
import { Socket } from 'socket.io';

describe('NotificationsGateway', () => {
  let gateway: NotificationsGateway;
  let serviceMock: {
    setServer: jest.Mock;
    getUserNotifications: jest.Mock;
  };

  beforeEach(async () => {
    serviceMock = {
      setServer: jest.fn(),
      getUserNotifications: jest.fn().mockReturnValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsGateway,
        {
          provide: NotificationsService,
          useValue: serviceMock,
        },
      ],
    }).compile();

    gateway = module.get<NotificationsGateway>(NotificationsGateway);
  });

  it('should join user room on subscribe event', async () => {
    const socketMock = {
      id: 'socket-1',
      join: jest.fn(),
      emit: jest.fn(),
    } as unknown as Socket;

    const result = await gateway.handleSubscribe(socketMock, {
      userId: 'user-777',
    });

    expect(socketMock.join).toHaveBeenCalledWith('user:user-777');
    expect(result).toEqual({ event: 'subscribed', room: 'user:user-777' });
  });
});
