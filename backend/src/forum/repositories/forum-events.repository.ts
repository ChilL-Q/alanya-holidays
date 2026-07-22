import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable()
export class ForumEventsRepository {
  constructor(private readonly supabaseService: SupabaseService) {}

  get client() {
    return this.supabaseService.getClient();
  }

  async getEvents(filters: any, eventSelect: string) {
    let q = this.client.from('forum_events').select(eventSelect);

    if (!filters.includeUnpublished) q = q.eq('is_published', true);
    if (filters.upcomingOnly)
      q = q.gte('event_date', new Date().toISOString());
    if (filters.search) {
      q = q.ilike('title', `%${filters.search}%`);
    }

    const { data } = await q
      .order('event_date', { ascending: true })
      .limit(filters.limit || 20);

    return data || [];
  }

  async getEventBySlug(slug: string, eventSelect: string) {
    const { data } = await this.client
      .from('forum_events')
      .select(eventSelect)
      .eq('slug', slug)
      .single();
    return data;
  }

  async getEventSlugs(seed: string) {
    const { data } = await this.client
      .from('forum_events')
      .select('slug')
      .ilike('slug', `${seed}%`);
    return (data || []).map((e: any) => e.slug);
  }

  async insertEvent(data: any) {
    const { data: event, error } = await this.client
      .from('forum_events')
      .insert([data])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return event;
  }

  async updateEvent(id: string, updates: any) {
    const { data, error } = await this.client
      .from('forum_events')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async deleteEvent(id: string) {
    const { error } = await this.client
      .from('forum_events')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
  }

  async getEventRsvpAttendees(eventId: string) {
    const { data } = await this.client
      .from('forum_event_rsvps')
      .select('user_id, contact_phone, created_at')
      .eq('event_id', eventId);
    return data || [];
  }

  async getProfilesByIds(userIds: string[]) {
    if (!userIds || userIds.length === 0) return [];
    const { data } = await this.client
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', userIds);
    return data || [];
  }

  async checkEventRsvp(eventId: string, userId: string) {
    const { data } = await this.client
      .from('forum_event_rsvps')
      .select('event_id')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .single();
    return data;
  }

  async insertEventRsvp(data: any) {
    await this.client.from('forum_event_rsvps').insert([data]);
  }

  async deleteEventRsvp(eventId: string, userId: string) {
    await this.client
      .from('forum_event_rsvps')
      .delete()
      .match({ event_id: eventId, user_id: userId });
  }

  async getEventRsvps(userId: string, ids: string[]) {
    const { data } = await this.client
      .from('forum_event_rsvps')
      .select('event_id')
      .eq('user_id', userId)
      .in('event_id', ids);
    return data;
  }

  async getUserRole(userId: string) {
    const { data } = await this.client
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    return data?.role;
  }
}
