import { supabase } from '../../../../api-services/supabase';
import { ForumEvent, EventAttendee } from '../../../../types/models';



async function getAuthHeaders() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {};
}

import { IForumEventsRepository, ForumEventFilters } from '../types';

export const supabaseForumEventsService: IForumEventsRepository = {
    async getForumEvents(filters: ForumEventFilters = {}): Promise<ForumEvent[]> {
        const params = new URLSearchParams();
        if (filters.upcomingOnly) params.set('upcomingOnly', 'true');
        if (filters.limit) params.set('limit', filters.limit.toString());
        if (filters.includeUnpublished) params.set('includeUnpublished', 'true');

        const headers = await getAuthHeaders();
        const res = await fetch(`/api/forum/events?${params.toString()}`, { headers });
        if (!res.ok) throw new Error('Failed to fetch forum events');
        return res.json();
    },

    async getForumEvent(slug: string): Promise<ForumEvent | null> {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/forum/events/slug/${slug}`, { headers });
        if (!res.ok) {
            if (res.status === 404) return null;
            throw new Error('Failed to fetch event');
        }
        return res.json();
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
        const headers = await getAuthHeaders();
        const res = await fetch('/api/forum/events', {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify(input)
        });
        if (!res.ok) throw new Error('Failed to create event');
        return res.json();
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
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/forum/events/${id}`, {
            method: 'PUT',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        if (!res.ok) throw new Error('Failed to update event');
        return res.json();
    },

    async deleteForumEvent(id: string): Promise<void> {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/forum/events/${id}`, { method: 'DELETE', headers });
        if (!res.ok) throw new Error('Failed to delete event');
    },

    async getEventAttendees(eventId: string): Promise<EventAttendee[]> {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/forum/events/${eventId}/attendees`, { headers });
        if (!res.ok) throw new Error('Failed to fetch attendees');
        return res.json();
    },

    async toggleEventRsvp(eventId: string, contactPhone?: string | null): Promise<{ going: boolean }> {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/forum/events/${eventId}/rsvp`, {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ contactPhone })
        });
        if (!res.ok) throw new Error('Failed to toggle RSVP');
        return res.json();
    },
};
