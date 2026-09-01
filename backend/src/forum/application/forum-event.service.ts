import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { slugify, generateUniqueSlug } from '../../utils/slugify';
import { ForumRepository, EVENT_SELECT } from '../forum.repository';
import { UserRolesRepository } from '../../common/auth/user-roles.repository';
import { BusinessApplicationsService } from '../../business-applications/business-applications.service';
import { assertAdmin } from '../domain/forum-authorization.helper';
import {
  CreateForumEventDto,
  UpdateForumEventDto,
} from '../dto/forum-events.dto';
import {
  ForumActionResponse,
  ForumEvent,
  ForumEventAttendee,
  ForumEventsFilter,
  ForumRsvpResponse,
  UpdateForumEventDbInput,
} from '../types/forum.types';

@Injectable()
export class ForumEventService {
  constructor(
    private readonly forumRepository: ForumRepository,
    private readonly businessApplicationsService: BusinessApplicationsService,
    @Optional() private readonly userRolesRepo?: UserRolesRepository,
  ) {}

  private async requireAdmin(userId: string): Promise<void> {
    const role = await this.userRolesRepo?.getRole(userId);
    assertAdmin(role);
  }

  private async getRole(userId: string): Promise<string | undefined> {
    return this.userRolesRepo?.getRole(userId);
  }

  private async requireEventManager(
    userId: string,
  ): Promise<'admin' | 'merchant'> {
    if ((await this.getRole(userId)) === 'admin') return 'admin';
    if (
      !(await this.businessApplicationsService.hasApprovedBusinessAccount(
        userId,
      ))
    ) {
      throw new ForbiddenException(
        'An approved business account is required to manage events',
      );
    }
    return 'merchant';
  }

  private async requireEventOwnerOrAdmin(
    eventId: string,
    userId: string,
  ): Promise<'admin' | 'owner'> {
    if ((await this.requireEventManager(userId)) === 'admin') return 'admin';
    const ownership = await this.forumRepository.getEventOwnership(eventId);
    if (!ownership) throw new NotFoundException('Event not found');
    if (ownership.host_id !== userId && ownership.created_by !== userId) {
      throw new ForbiddenException('Not authorized');
    }
    if (ownership.is_published) {
      throw new ForbiddenException('Only admins can modify a published event');
    }
    return 'owner';
  }

  private async resolveEventSlug(baseSlug: string): Promise<string> {
    const seed = slugify(baseSlug) || 'event';
    const existingSlugs = await this.forumRepository.getEventSlugs(seed);
    return generateUniqueSlug(seed, existingSlugs);
  }

  private async annotateRsvp(
    rows: ForumEvent[],
    userId?: string,
  ): Promise<ForumEvent[]> {
    if (typeof this.forumRepository.annotateRsvp === 'function') {
      return this.forumRepository.annotateRsvp(rows, userId);
    }
    if (!userId || rows.length === 0)
      return rows.map((e) => ({ ...e, going_by_me: false }));
    const ids = rows.map((e) => e.id);
    const data = await this.forumRepository.getEventRsvps(userId, ids);
    const going = new Set(
      (data || []).map((r) => String((r as { event_id?: string }).event_id)),
    );
    return rows.map((e) => ({ ...e, going_by_me: going.has(String(e.id)) }));
  }

  // ============================================================
  // Events
  // ============================================================
  async getForumEvents(
    filters: ForumEventsFilter,
    userId?: string,
  ): Promise<ForumEvent[]> {
    if (filters.includeUnpublished) await this.requireAdmin(userId as string);
    const limit =
      Number.isFinite(filters.limit) && (filters.limit as number) > 0
        ? Math.min(filters.limit as number, 100)
        : 20;
    const data = await this.forumRepository.getEvents(
      { ...filters, limit },
      EVENT_SELECT,
    );
    return this.annotateRsvp(data, userId);
  }

  async getForumEvent(
    slug: string,
    userId?: string,
  ): Promise<ForumEvent | null> {
    const data = await this.forumRepository.getEventBySlug(slug, EVENT_SELECT);
    if (!data) return null;
    if (data.is_published === false) {
      if (!userId) return null;
      const role = await this.getRole(userId);
      if (
        role !== 'admin' &&
        data.host_id !== userId &&
        data.created_by !== userId
      ) {
        return null;
      }
      if (
        role !== 'admin' &&
        !(await this.businessApplicationsService.hasApprovedBusinessAccount(
          userId,
        ))
      ) {
        return null;
      }
    }
    const [annotated] = await this.annotateRsvp([data], userId);
    return annotated ?? null;
  }

  async getMyForumEvents(userId: string): Promise<ForumEvent[]> {
    await this.requireEventManager(userId);
    const data = await this.forumRepository.getEvents(
      {
        ownerId: userId,
        includeUnpublished: true,
        limit: 100,
      },
      EVENT_SELECT,
    );
    return this.annotateRsvp(data, userId);
  }

  async createForumEvent(
    input: CreateForumEventDto,
    userId: string,
  ): Promise<ForumEvent> {
    const access = await this.requireEventManager(userId);
    const slug = await this.resolveEventSlug(slugify(input.title));
    return this.forumRepository.insertEvent({
      title: input.title.trim(),
      slug,
      description: input.description?.trim() || null,
      location: input.location?.trim() || null,
      event_date: input.event_date,
      image_url: input.image_url || null,
      host_id: access === 'admin' ? input.host_id || null : userId,
      category_id: input.category_id || null,
      is_published: access === 'admin' ? (input.is_published ?? true) : false,
      created_by: userId,
    });
  }

  async updateForumEvent(
    id: string,
    updates: UpdateForumEventDto,
    userId: string,
  ): Promise<ForumEvent> {
    const access = await this.requireEventOwnerOrAdmin(id, userId);
    if (access !== 'admin' && updates.is_published === true) {
      throw new ForbiddenException('Only admins can publish an event');
    }
    const safe: UpdateForumEventDbInput = {};
    if (updates.title !== undefined) safe.title = updates.title.trim();
    if (updates.description !== undefined)
      safe.description = updates.description?.trim() || null;
    if (updates.location !== undefined)
      safe.location = updates.location?.trim() || null;
    if (updates.event_date !== undefined) safe.event_date = updates.event_date;
    if (updates.image_url !== undefined)
      safe.image_url = updates.image_url || null;
    if (access === 'admin' && updates.host_id !== undefined)
      safe.host_id = updates.host_id || null;
    if (updates.category_id !== undefined)
      safe.category_id = updates.category_id || null;
    if (updates.is_published !== undefined)
      safe.is_published = updates.is_published;

    const updated = await this.forumRepository.updateEvent(
      id,
      safe,
      access === 'owner' ? userId : undefined,
    );
    if (!updated) {
      if (access === 'admin') throw new NotFoundException('Event not found');
      throw new ForbiddenException(
        'Event ownership or publication status changed',
      );
    }
    return updated;
  }

  async deleteForumEvent(
    id: string,
    userId: string,
  ): Promise<ForumActionResponse> {
    const access = await this.requireEventOwnerOrAdmin(id, userId);
    const deleted = await this.forumRepository.deleteEvent(
      id,
      access === 'owner' ? userId : undefined,
    );
    if (!deleted) {
      if (access === 'admin') throw new NotFoundException('Event not found');
      throw new ForbiddenException(
        'Event ownership or publication status changed',
      );
    }
    return { success: true };
  }

  async getEventAttendees(
    eventId: string,
    userId: string,
  ): Promise<ForumEventAttendee[]> {
    await this.requireAdmin(userId);
    const rsvpRows = await this.forumRepository.getEventRsvpAttendees(eventId);
    if (!rsvpRows || rsvpRows.length === 0) return [];

    const userIds = rsvpRows.map((r) => String(r.user_id));
    const profileRows = await this.forumRepository.getProfilesByIds(userIds);
    const profileMap = new Map(
      (profileRows || []).map((p) => [String(p.id), p]),
    );

    return rsvpRows
      .map((r) => {
        const profile = profileMap.get(String(r.user_id));
        return {
          id: String(r.user_id),
          full_name: profile?.full_name ?? null,
          avatar_url: profile?.avatar_url ?? null,
          rsvp_at: r.created_at || null,
          contact_phone: r.contact_phone || null,
        };
      })
      .sort((a, b) =>
        String(a.rsvp_at || '').localeCompare(String(b.rsvp_at || '')),
      );
  }

  async toggleEventRsvp(
    eventId: string,
    contactPhone: string | null,
    userId: string,
  ): Promise<ForumRsvpResponse> {
    if (typeof this.forumRepository.toggleRow === 'function') {
      const { active } = await this.forumRepository.toggleRow(
        'forum_event_rsvps',
        'event_id',
        eventId,
        userId,
        { contact_phone: contactPhone?.trim() || null },
      );
      return { going: active };
    }

    const existing = await this.forumRepository.checkEventRsvp(eventId, userId);
    if (existing) {
      await this.forumRepository.deleteEventRsvp(eventId, userId);
      return { going: false };
    }
    try {
      await this.forumRepository.insertEventRsvp({
        event_id: eventId,
        user_id: userId,
        contact_phone: contactPhone?.trim() || null,
      });
      return { going: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg.includes('23505') ||
        msg.includes('duplicate') ||
        msg.includes('unique')
      ) {
        return { going: true };
      }
      throw err;
    }
  }
}
