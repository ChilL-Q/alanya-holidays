import { Injectable, UnauthorizedException } from '@nestjs/common';
import { slugify, generateUniqueSlug } from '../../utils/slugify';
import { ForumEventsRepository } from '../repositories/forum-events.repository';
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
export class ForumEventsService {
  constructor(private readonly forumEventsRepository: ForumEventsRepository) {}

  private async requireAdmin(userId: string): Promise<void> {
    const role = await this.forumEventsRepository.getUserRole(userId);
    if (role !== 'admin') throw new UnauthorizedException('Not authorized');
  }

  private async resolveEventSlug(baseSlug: string): Promise<string> {
    const seed = baseSlug || 'event';
    const existingSlugs = await this.forumEventsRepository.getEventSlugs(seed);
    return generateUniqueSlug(seed, existingSlugs);
  }

  private async annotateRsvp(
    rows: ForumEvent[],
    userId?: string,
  ): Promise<ForumEvent[]> {
    if (!userId || rows.length === 0)
      return rows.map((e) => ({ ...e, going_by_me: false }));
    const ids = rows.map((e) => e.id);
    const data = await this.forumEventsRepository.getEventRsvps(userId, ids);
    const going = new Set(
      (data || []).map((r) => String((r as { event_id?: string }).event_id)),
    );
    return rows.map((e) => ({ ...e, going_by_me: going.has(String(e.id)) }));
  }

  private EVENT_SELECT = `
      *,
      host:profiles!forum_events_host_id_fkey(full_name, avatar_url),
      category:forum_categories!forum_events_category_id_fkey(id, name, slug)
  `;

  async getForumEvents(
    filters: ForumEventsFilter,
    userId?: string,
  ): Promise<ForumEvent[]> {
    if (filters.includeUnpublished) await this.requireAdmin(userId as string);
    const data = await this.forumEventsRepository.getEvents(
      filters,
      this.EVENT_SELECT,
    );
    return this.annotateRsvp(data, userId);
  }

  async getForumEvent(
    slug: string,
    userId?: string,
  ): Promise<ForumEvent | null> {
    const data = await this.forumEventsRepository.getEventBySlug(
      slug,
      this.EVENT_SELECT,
    );
    if (!data) return null;
    const [annotated] = await this.annotateRsvp([data], userId);
    return annotated ?? null;
  }

  async createForumEvent(
    input: CreateForumEventDto,
    userId: string,
  ): Promise<ForumEvent> {
    await this.requireAdmin(userId);
    const slug = await this.resolveEventSlug(slugify(input.title));
    return this.forumEventsRepository.insertEvent({
      title: input.title.trim(),
      slug,
      description: input.description?.trim() || null,
      location: input.location?.trim() || null,
      event_date: input.event_date,
      image_url: input.image_url || null,
      host_id: input.host_id || null,
      category_id: input.category_id || null,
      is_published: input.is_published ?? true,
      created_by: userId,
    });
  }

  async updateForumEvent(
    id: string,
    updates: UpdateForumEventDto,
    userId: string,
  ): Promise<ForumEvent> {
    await this.requireAdmin(userId);
    const safe: UpdateForumEventDbInput = {};
    if (updates.title !== undefined) safe.title = updates.title;
    if (updates.description !== undefined)
      safe.description = updates.description || null;
    if (updates.location !== undefined)
      safe.location = updates.location || null;
    if (updates.event_date !== undefined) safe.event_date = updates.event_date;
    if (updates.image_url !== undefined)
      safe.image_url = updates.image_url || null;
    if (updates.host_id !== undefined) safe.host_id = updates.host_id || null;
    if (updates.category_id !== undefined)
      safe.category_id = updates.category_id || null;
    if (updates.is_published !== undefined)
      safe.is_published = updates.is_published;

    return this.forumEventsRepository.updateEvent(id, safe);
  }

  async deleteForumEvent(
    id: string,
    userId: string,
  ): Promise<ForumActionResponse> {
    await this.requireAdmin(userId);
    await this.forumEventsRepository.deleteEvent(id);
    return { success: true };
  }

  async getEventAttendees(
    eventId: string,
    userId: string,
  ): Promise<ForumEventAttendee[]> {
    await this.requireAdmin(userId);
    const rsvpRows =
      await this.forumEventsRepository.getEventRsvpAttendees(eventId);
    if (!rsvpRows || rsvpRows.length === 0) return [];

    const rsvpInfo = new Map(rsvpRows.map((r) => [String(r.user_id), r]));
    const userIds = rsvpRows.map((r) => String(r.user_id));
    const profileRows =
      await this.forumEventsRepository.getProfilesByIds(userIds);

    return profileRows
      .map((p) => {
        const info = rsvpInfo.get(String(p.id));
        return {
          ...p,
          rsvp_at: info?.created_at || null,
          contact_phone: info?.contact_phone || null,
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
    const existing = await this.forumEventsRepository.checkEventRsvp(
      eventId,
      userId,
    );
    if (existing) {
      await this.forumEventsRepository.deleteEventRsvp(eventId, userId);
      return { going: false };
    }
    await this.forumEventsRepository.insertEventRsvp({
      event_id: eventId,
      user_id: userId,
      contact_phone: contactPhone?.trim() || null,
    });
    return { going: true };
  }
}
