import { Injectable, UnauthorizedException } from '@nestjs/common';
import { slugify, generateUniqueSlug } from '../../utils/slugify';
import { ForumEventsRepository } from '../repositories/forum-events.repository';

@Injectable()
export class ForumEventsService {
  constructor(private readonly forumEventsRepository: ForumEventsRepository) {}

  private async requireAdmin(userId: string) {
    const role = await this.forumEventsRepository.getUserRole(userId);
    if (role !== 'admin')
      throw new UnauthorizedException('Not authorized');
  }

  private async resolveEventSlug(baseSlug: string): Promise<string> {
    const seed = baseSlug || 'event';
    const existingSlugs = await this.forumEventsRepository.getEventSlugs(seed);
    return generateUniqueSlug(seed, existingSlugs);
  }

  private async annotateRsvp(rows: any[], userId?: string) {
    if (!userId || rows.length === 0)
      return rows.map((e) => ({ ...e, going_by_me: false }));
    const ids = rows.map((e) => e.id);
    const data = await this.forumEventsRepository.getEventRsvps(userId, ids);
    const going = new Set((data || []).map((r: any) => r.event_id));
    return rows.map((e) => ({ ...e, going_by_me: going.has(e.id) }));
  }

  private EVENT_SELECT = `
      *,
      host:profiles!forum_events_host_id_fkey(full_name, avatar_url),
      category:forum_categories!forum_events_category_id_fkey(id, name, slug)
  `;

  async getForumEvents(filters: any, userId?: string) {
    if (filters.includeUnpublished) await this.requireAdmin(userId as string);
    const data = await this.forumEventsRepository.getEvents(filters, this.EVENT_SELECT);
    return this.annotateRsvp(data || [], userId);
  }

  async getForumEvent(slug: string, userId?: string) {
    const data = await this.forumEventsRepository.getEventBySlug(slug, this.EVENT_SELECT);
    if (!data) return null;
    const [annotated] = await this.annotateRsvp([data], userId);
    return annotated;
  }

  async createForumEvent(input: any, userId: string) {
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

  async updateForumEvent(id: string, updates: any, userId: string) {
    await this.requireAdmin(userId);
    const safe: any = {};
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

  async deleteForumEvent(id: string, userId: string) {
    await this.requireAdmin(userId);
    await this.forumEventsRepository.deleteEvent(id);
    return { success: true };
  }

  async getEventAttendees(eventId: string, userId: string) {
    await this.requireAdmin(userId);
    const rsvpRows = await this.forumEventsRepository.getEventRsvpAttendees(eventId);
    if (!rsvpRows || rsvpRows.length === 0) return [];
    
    const rsvpInfo = new Map(rsvpRows.map((r: any) => [r.user_id, r]));
    const userIds = rsvpRows.map((r: any) => r.user_id);
    const profileRows = await this.forumEventsRepository.getProfilesByIds(userIds);
    
    return (profileRows || [])
      .map((p: any) => ({
        ...p,
        rsvp_at: rsvpInfo.get(p.id)?.created_at || null,
        contact_phone: rsvpInfo.get(p.id)?.contact_phone || null,
      }))
      .sort((a: any, b: any) => (a.rsvp_at || '').localeCompare(b.rsvp_at || ''));
  }

  async toggleEventRsvp(
    eventId: string,
    contactPhone: string | null,
    userId: string,
  ) {
    const existing = await this.forumEventsRepository.checkEventRsvp(eventId, userId);
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
