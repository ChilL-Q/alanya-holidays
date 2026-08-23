import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  NotificationsService,
  LiveNotification,
} from './notifications.service';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/types/auth-user.interface';

@Controller('notifications')
@UseGuards(AuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  getUserNotifications(@CurrentUser() user: AuthUser): LiveNotification[] {
    return this.notificationsService.getUserNotifications(user.id);
  }

  @Patch('read-all')
  markAllAsRead(@CurrentUser() user: AuthUser): {
    success: boolean;
    count: number;
  } {
    const count = this.notificationsService.markAllAsRead(user.id);
    return { success: true, count };
  }

  @Patch(':id/read')
  markAsRead(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): { success: boolean } {
    const success = this.notificationsService.markAsRead(user.id, id);
    return { success };
  }

  @Delete(':id')
  deleteNotification(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): { success: boolean } {
    const success = this.notificationsService.deleteNotification(user.id, id);
    return { success };
  }
}
