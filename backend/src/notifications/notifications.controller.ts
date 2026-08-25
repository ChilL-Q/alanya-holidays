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
  async getUserNotifications(
    @CurrentUser() user: AuthUser,
  ): Promise<LiveNotification[]> {
    return this.notificationsService.getUserNotifications(user.id);
  }

  @Patch('read-all')
  async markAllAsRead(@CurrentUser() user: AuthUser): Promise<{
    success: boolean;
    count: number;
  }> {
    const count = await this.notificationsService.markAllAsRead(user.id);
    return { success: true, count };
  }

  @Patch(':id/read')
  async markAsRead(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<{ success: boolean }> {
    const success = await this.notificationsService.markAsRead(user.id, id);
    return { success };
  }

  @Delete(':id')
  async deleteNotification(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<{ success: boolean }> {
    const success = await this.notificationsService.deleteNotification(
      user.id,
      id,
    );
    return { success };
  }
}
