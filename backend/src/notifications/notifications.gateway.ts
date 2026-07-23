import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { NotificationsService } from './notifications.service';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/ws/notifications',
})
export class NotificationsGateway implements OnGatewayInit {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  afterInit(server: Server) {
    this.notificationsService.setServer(server);
    this.logger.log('Notifications WebSocket Gateway initialized');
  }

  @SubscribeMessage('subscribe')
  async handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string },
  ) {
    if (data && data.userId) {
      const room = `user:${data.userId}`;
      await client.join(room);
      this.logger.log(`Client ${client.id} joined room ${room}`);

      // Send recent unread notifications upon connection
      const recent = this.notificationsService.getUserNotifications(data.userId);
      client.emit('initial_notifications', recent);

      return { event: 'subscribed', room };
    }
    return { event: 'error', message: 'userId is required' };
  }
}
