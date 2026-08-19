import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  NotificationsService,
  LiveNotification,
} from './notifications.service';
import { AuthGuard } from '../auth/auth.guard';

export interface AuthenticatedUser {
  id: string;
  email?: string;
  role?: string;
  [key: string]: unknown;
}

export interface AuthenticatedRequest {
  user: AuthenticatedUser;
  [key: string]: unknown;
}

@Controller('notifications')
@UseGuards(AuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  getUserNotifications(@Req() req: AuthenticatedRequest): LiveNotification[] {
    return this.notificationsService.getUserNotifications(req.user.id);
  }

  @Patch('read-all')
  markAllAsRead(@Req() req: AuthenticatedRequest): {
    success: boolean;
    count: number;
  } {
    const count = this.notificationsService.markAllAsRead(req.user.id);
    return { success: true, count };
  }

  @Patch(':id/read')
  markAsRead(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): { success: boolean } {
    const success = this.notificationsService.markAsRead(req.user.id, id);
    return { success };
  }

  @Delete(':id')
  deleteNotification(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): { success: boolean } {
    const success = this.notificationsService.deleteNotification(
      req.user.id,
      id,
    );
    return { success };
  }
}
