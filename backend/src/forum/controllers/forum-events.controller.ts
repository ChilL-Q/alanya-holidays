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
import { OptionalAuthGuard } from '../../auth/optional-auth.guard';
import {
  CreateForumEventDto,
  GetForumEventsQueryDto,
  ToggleEventRsvpDto,
  UpdateForumEventDto,
} from '../dto/forum-events.dto';
import {
  AuthenticatedRequest,
  ForumActionResponse,
  ForumEvent,
  ForumEventAttendee,
  ForumEventsFilter,
  ForumRsvpResponse,
  OptionalAuthenticatedRequest,
} from '../types/forum.types';

@Controller('forum/events')
export class ForumEventsController {
  constructor(private readonly forumEventsService: ForumEventsService) {}

  @Get()
  @UseGuards(OptionalAuthGuard)
  async getForumEvents(
    @Query()
    query: GetForumEventsQueryDto,
    @Req() req: OptionalAuthenticatedRequest,
  ): Promise<ForumEvent[]> {
    const filters: ForumEventsFilter = {
      upcomingOnly:
        query.upcomingOnly === true ||
        (query.upcomingOnly as unknown) === 'true',
      limit: query.limit !== undefined ? Number(query.limit) : undefined,
      includeUnpublished:
        query.includeUnpublished === true ||
        (query.includeUnpublished as unknown) === 'true',
      search: query.search,
    };
    return this.forumEventsService.getForumEvents(filters, req.user?.id);
  }

  @Get('slug/:slug')
  @UseGuards(OptionalAuthGuard)
  async getForumEvent(
    @Param('slug') slug: string,
    @Req() req: OptionalAuthenticatedRequest,
  ): Promise<ForumEvent | null> {
    return this.forumEventsService.getForumEvent(slug, req.user?.id);
  }

  @Post()
  @UseGuards(AuthGuard)
  async createForumEvent(
    @Body() body: CreateForumEventDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<ForumEvent> {
    return this.forumEventsService.createForumEvent(body, req.user.id);
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  async updateForumEvent(
    @Param('id') id: string,
    @Body() body: UpdateForumEventDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<ForumEvent> {
    return this.forumEventsService.updateForumEvent(id, body, req.user.id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async deleteForumEvent(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<ForumActionResponse> {
    return this.forumEventsService.deleteForumEvent(id, req.user.id);
  }

  @Get(':id/attendees')
  @UseGuards(AuthGuard)
  async getEventAttendees(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<ForumEventAttendee[]> {
    return this.forumEventsService.getEventAttendees(id, req.user.id);
  }

  @Post(':id/rsvp')
  @UseGuards(AuthGuard)
  async toggleEventRsvp(
    @Param('id') id: string,
    @Body() body: ToggleEventRsvpDto | { contactPhone?: string | null },
    @Req() req: AuthenticatedRequest,
  ): Promise<ForumRsvpResponse> {
    const contactPhone =
      typeof body === 'object' && body !== null && 'contactPhone' in body
        ? (body.contactPhone as string | null)
        : typeof body === 'string'
          ? body
          : null;
    return this.forumEventsService.toggleEventRsvp(
      id,
      contactPhone,
      req.user.id,
    );
  }
}
