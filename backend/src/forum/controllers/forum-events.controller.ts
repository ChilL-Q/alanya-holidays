import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ForumEventsService } from '../services/forum-events.service';
import { AuthGuard } from '../../auth/auth.guard';

@Controller('forum/events')
export class ForumEventsController {
  constructor(private readonly forumEventsService: ForumEventsService) {}

  @Get()
  async getForumEvents(@Query() query: any, @Req() req: any) {
    const filters = {
      upcomingOnly: query.upcomingOnly === 'true',
      limit: query.limit ? parseInt(query.limit) : undefined,
      includeUnpublished: query.includeUnpublished === 'true',
    };
    return this.forumEventsService.getForumEvents(filters, req.user?.id);
  }

  @Get('slug/:slug')
  async getForumEvent(@Param('slug') slug: string, @Req() req: any) {
    return this.forumEventsService.getForumEvent(slug, req.user?.id);
  }

  @Post()
  @UseGuards(AuthGuard)
  async createForumEvent(@Body() body: any, @Req() req: any) {
    return this.forumEventsService.createForumEvent(body, req.user.id);
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  async updateForumEvent(
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    return this.forumEventsService.updateForumEvent(id, body, req.user.id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async deleteForumEvent(@Param('id') id: string, @Req() req: any) {
    return this.forumEventsService.deleteForumEvent(id, req.user.id);
  }

  @Get(':id/attendees')
  @UseGuards(AuthGuard)
  async getEventAttendees(@Param('id') id: string, @Req() req: any) {
    return this.forumEventsService.getEventAttendees(id, req.user.id);
  }

  @Post(':id/rsvp')
  @UseGuards(AuthGuard)
  async toggleEventRsvp(
    @Param('id') id: string,
    @Body('contactPhone') contactPhone: string,
    @Req() req: any,
  ) {
    return this.forumEventsService.toggleEventRsvp(id, contactPhone, req.user.id);
  }
}
