import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import {
  ForumEvent,
  ForumEventAttendee,
  ForumEventsFilter,
  InsertForumEventDbInput,
  InsertForumEventRsvpDbInput,
  UpdateForumEventDbInput,
} from '../types/forum.types';

@Injectable()
export class ForumEventsRepository {
  constructor(private readonly supabaseService: SupabaseService) {}

  get client() {
    return this.supabaseService.getClient();
  }

  async getEvents(
    filters: ForumEventsFilter,
    eventSelect: string,
  ): Promise<ForumEvent[]> {
    let q = this.client.from('forum_events').select(eventSelect);

    if (!filters.includeUnpublished) q = q.eq('is_published', true);
    if (filters.upcomingOnly) q = q.gte('event_date', new Date().toISOString());
    if (filters.search) {
      q = q.ilike('title', `%${filters.search}%`);
    }

    const { data } = await q
      .order('event_date', { ascending: true })
      .limit(filters.limit || 20);

    return (data as unknown as ForumEvent[]) || [];
  }

  async getEventBySlug(
    slug: string,
    eventSelect: string,
  ): Promise<ForumEvent | null> {
    const { data } = await this.client
      .from('forum_events')
      .select(eventSelect)
      .eq('slug', slug)
      .single();
    return (data as unknown as ForumEvent) ?? null;
  }

  async getEventSlugs(seed: string): Promise<string[]> {
    const { data } = await this.client
      .from('forum_events')
      .select('slug')
      .ilike('slug', `${seed}%`);
    return (data || []).map((e) => String(e.slug));
  }

  async insertEvent(data: InsertForumEventDbInput): Promise<ForumEvent> {
    const { data: event, error } = await this.client
      .from('forum_events')
      .insert([data])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return event as unknown as ForumEvent;
  }

  async updateEvent(
    id: string,
    updates: UpdateForumEventDbInput,
  ): Promise<ForumEvent> {
    const { data, error } = await this.client
      .from('forum_events')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as unknown as ForumEvent;
  }

  async deleteEvent(id: string): Promise<void> {
    const { error } = await this.client
      .from('forum_events')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
  }

  async getEventRsvpAttendees(
    eventId: string,
  ): Promise<
    Array<{ user_id: string; contact_phone: string | null; created_at: string }>
  > {
    const { data } = await this.client
      .from('forum_event_rsvps')
      .select('user_id, contact_phone, created_at')
      .eq('event_id', eventId);
    return data || [];
  }

  async getProfilesByIds(userIds: string[]): Promise<ForumEventAttendee[]> {
    if (!userIds || userIds.length === 0) return [];
    const { data } = await this.client
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', userIds);
    return (data as unknown as ForumEventAttendee[]) || [];
  }

  async checkEventRsvp(
    eventId: string,
    userId: string,
  ): Promise<{ event_id: string } | null> {
    const { data } = await this.client
      .from('forum_event_rsvps')
      .select('event_id')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .single();
    return data ?? null;
  }

  async insertEventRsvp(data: InsertForumEventRsvpDbInput): Promise<void> {
    await this.client.from('forum_event_rsvps').insert([data]);
  }

  async deleteEventRsvp(eventId: string, userId: string): Promise<void> {
    await this.client
      .from('forum_event_rsvps')
      .delete()
      .match({ event_id: eventId, user_id: userId });
  }

  async getEventRsvps(
    userId: string,
    ids: string[],
  ): Promise<Array<{ event_id: string }> | null> {
    const { data } = await this.client
      .from('forum_event_rsvps')
      .select('event_id')
      .eq('user_id', userId)
      .in('event_id', ids);
    return data ?? null;
  }

  async getUserRole(userId: string): Promise<string | undefined> {
    const { data } = await this.client
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    return (data as { role?: string } | null)?.role;
  }
}
