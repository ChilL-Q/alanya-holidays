import { supabase } from '../supabase';
import { getUserRole } from '../auth';
import { ForumEvent, EventAttendee } from '../../types/models';
import { slugify, generateUniqueSlug } from '../../utils/slugify';
import { toArray } from '../../utils/supabaseHelpers';

const EVENT_SELECT = `
    *,
    host:profiles!forum_events_host_id_fkey(full_name, avatar_url),
    category:forum_categories!forum_events_category_id_fkey(id, name, slug)
`;

async function requireUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    return user;
}

async function requireAdmin() {
    const user = await requireUser();
    const role = await getUserRole(user.id);
    if (role !== 'admin') throw new Error('Not authorized');
    return user;
}

async function resolveEventSlug(baseSlug: string): Promise<string> {
    const seed = baseSlug || 'event';
    const [exact, suffixed] = await Promise.all([
        supabase.from('forum_events').select('slug').eq('slug', seed),
        supabase.from('forum_events').select('slug').like('slug', `${seed}-%`),
    ]);
    const existing = [
        ...toArray<{ slug: string }>(exact.data),
        ...toArray<{ slug: string }>(suffixed.data),
    ].map((r) => r.slug);
    return generateUniqueSlug(seed, existing);
}

/** Annotate events with whether the current user has RSVP'd. */
async function annotateRsvp(rows: ForumEvent[], userId: string | null): Promise<ForumEvent[]> {
    if (!userId || rows.length === 0) {
        return rows.map((e) => ({ ...e, going_by_me: false }));
    }
    const ids = rows.map((e) => e.id);
    const { data } = await supabase
        .from('forum_event_rsvps')
        .select('event_id')
        .eq('user_id', userId)
        .in('event_id', ids);
    const going = new Set(toArray<{ event_id: string }>(data).map((r) => r.event_id));
    return rows.map((e) => ({ ...e, going_by_me: going.has(e.id) }));
}

export interface ForumEventFilters {
    upcomingOnly?: boolean;
    limit?: number;
    includeUnpublished?: boolean;
}

export const forumEventsService = {
    async getForumEvents(filters: ForumEventFilters = {}): Promise<ForumEvent[]> {
        const { data: { user } } = await supabase.auth.getUser();
        let query = supabase.from('forum_events').select(EVENT_SELECT);

        if (!filters.includeUnpublished) query = query.eq('is_published', true);
        if (filters.upcomingOnly) query = query.gte('event_date', new Date().toISOString());

        query = query.order('event_date', { ascending: true });
        if (filters.limit) query = query.limit(filters.limit);

        const { data, error } = await query;
        if (error) throw error;
        return annotateRsvp((data || []) as unknown as ForumEvent[], user?.id ?? null);
    },

    async getForumEvent(slug: string): Promise<ForumEvent | null> {
        const { data: { user } } = await supabase.auth.getUser();
        const { data, error } = await supabase
            .from('forum_events')
            .select(EVENT_SELECT)
            .eq('slug', slug)
            .single();
        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        const [annotated] = await annotateRsvp([data as unknown as ForumEvent], user?.id ?? null);
        return annotated;
    },

    async createForumEvent(input: {
        title: string;
        event_date: string;
        description?: string;
        location?: string;
        image_url?: string;
        host_id?: string | null;
        category_id?: string | null;
        is_published?: boolean;
    }): Promise<ForumEvent> {
        const admin = await requireAdmin();
        if (!input.title?.trim()) throw new Error('Title is required');
        if (!input.event_date) throw new Error('Event date is required');

        const slug = await resolveEventSlug(slugify(input.title));
        const { data, error } = await supabase
            .from('forum_events')
            .insert([{
                title: input.title.trim(),
                slug,
                description: input.description?.trim() || null,
                location: input.location?.trim() || null,
                event_date: input.event_date,
                image_url: input.image_url || null,
                host_id: input.host_id || null,
                category_id: input.category_id || null,
                is_published: input.is_published ?? true,
                created_by: admin.id,
            }])
            .select()
            .single();
        if (error) throw error;
        return data as ForumEvent;
    },

    async updateForumEvent(id: string, updates: Partial<{
        title: string;
        description: string;
        location: string;
        event_date: string;
        image_url: string;
        host_id: string | null;
        category_id: string | null;
        is_published: boolean;
    }>): Promise<ForumEvent> {
        await requireAdmin();
        const safe: Record<string, unknown> = {};
        if (updates.title !== undefined) safe.title = updates.title;
        if (updates.description !== undefined) safe.description = updates.description || null;
        if (updates.location !== undefined) safe.location = updates.location || null;
        if (updates.event_date !== undefined) safe.event_date = updates.event_date;
        if (updates.image_url !== undefined) safe.image_url = updates.image_url || null;
        if (updates.host_id !== undefined) safe.host_id = updates.host_id || null;
        if (updates.category_id !== undefined) safe.category_id = updates.category_id || null;
        if (updates.is_published !== undefined) safe.is_published = updates.is_published;

        const { data, error } = await supabase
            .from('forum_events')
            .update(safe)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data as ForumEvent;
    },

    async deleteForumEvent(id: string): Promise<void> {
        await requireAdmin();
        const { error } = await supabase.from('forum_events').delete().eq('id', id);
        if (error) throw error;
    },

    /** Admin-only: list everyone who RSVP'd to an event, with contact details. */
    async getEventAttendees(eventId: string): Promise<EventAttendee[]> {
        await requireAdmin();

        const { data: rsvpRows, error: rsvpError } = await supabase
            .from('forum_event_rsvps')
            .select('user_id, created_at, contact_phone')
            .eq('event_id', eventId)
            .order('created_at', { ascending: true });
        if (rsvpError) throw rsvpError;

        const rsvps = toArray<{ user_id: string; created_at: string | null; contact_phone: string | null }>(rsvpRows);
        if (rsvps.length === 0) return [];

        const rsvpInfo = new Map(rsvps.map((r) => [r.user_id, r]));
        const userIds = rsvps.map((r) => r.user_id);

        const { data: profileRows, error: profileError } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, email, phone, social_links')
            .in('id', userIds);
        if (profileError) throw profileError;

        return toArray<Omit<EventAttendee, 'rsvp_at' | 'contact_phone'>>(profileRows)
            .map((p) => ({
                ...p,
                rsvp_at: rsvpInfo.get(p.id)?.created_at ?? null,
                contact_phone: rsvpInfo.get(p.id)?.contact_phone ?? null,
            }))
            .sort((a, b) => (a.rsvp_at || '').localeCompare(b.rsvp_at || ''));
    },

    /**
     * Toggle the current user's RSVP for an event. Returns the new state.
     * When registering, an optional contact number (e.g. WhatsApp) is stored
     * on the RSVP so admins can reach the attendee.
     */
    async toggleEventRsvp(eventId: string, contactPhone?: string | null): Promise<{ going: boolean }> {
        const user = await requireUser();
        const { data: existing } = await supabase
            .from('forum_event_rsvps')
            .select('event_id')
            .eq('event_id', eventId)
            .eq('user_id', user.id)
            .maybeSingle();

        if (existing) {
            const { error } = await supabase
                .from('forum_event_rsvps')
                .delete()
                .eq('event_id', eventId)
                .eq('user_id', user.id);
            if (error) throw error;
            return { going: false };
        }

        const phone = contactPhone?.trim();
        const { error } = await supabase
            .from('forum_event_rsvps')
            .insert([{ event_id: eventId, user_id: user.id, contact_phone: phone || null }]);
        if (error) throw error;
        return { going: true };
    },
};
