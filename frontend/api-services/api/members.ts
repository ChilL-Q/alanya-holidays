import { ForumMember } from '../../types/models';
import { supabase } from '../supabase';

export interface MemberFilters {
    limit?: number;
    onlineOnly?: boolean;
}

async function getAuthHeaders() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {};
}

export const membersService = {
    /** Community members, ordered by recent activity, annotated with post counts + online flag. */
    async getForumMembers(filters: MemberFilters = {}): Promise<ForumMember[]> {
        const query = new URLSearchParams();
        if (filters.limit) query.set('limit', filters.limit.toString());
        if (filters.onlineOnly) query.set('onlineOnly', 'true');

        const res = await fetch(`/api/users/forum/members?${query.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch forum members');
        return res.json() as Promise<ForumMember[]>;
    },

    /** Count of members seen within the online window. */
    async getOnlineCount(): Promise<number> {
        const res = await fetch('/api/users/forum/online-count');
        if (!res.ok) return 0;
        return res.json() as Promise<number>;
    },

    /** Heartbeat: stamp the current user's last_seen_at. Never throws. */
    async touchPresence(): Promise<void> {
        try {
            const headers = await getAuthHeaders();
            if (!headers.Authorization) return;
            const res = await fetch('/api/users/presence/touch', {
                method: 'PUT',
                headers,
            });
            if (!res.ok) return;
        } catch {
            // Ignore presence touch errors quietly
        }
    },
};
