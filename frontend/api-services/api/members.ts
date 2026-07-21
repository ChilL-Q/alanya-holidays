import { supabase } from '../supabase';
import { ForumMember } from '../../types/models';
import { toArray } from '../../utils/supabaseHelpers';

/** A member counts as "online" if seen within this window. */
const ONLINE_WINDOW_MS = 5 * 60 * 1000;

function isOnline(lastSeen: string | null): boolean {
    if (!lastSeen) return false;
    return Date.now() - new Date(lastSeen).getTime() < ONLINE_WINDOW_MS;
}

/** Map of author_id → non-removed post count. */
async function postCountsByAuthor(): Promise<Map<string, number>> {
    const { data, error } = await supabase
        .from('forum_posts')
        .select('author_id')
        .eq('is_removed', false);
    if (error) throw error;
    const counts = new Map<string, number>();
    for (const row of toArray<{ author_id: string | null }>(data)) {
        if (row.author_id) counts.set(row.author_id, (counts.get(row.author_id) || 0) + 1);
    }
    return counts;
}

export interface MemberFilters {
    limit?: number;
    onlineOnly?: boolean;
}

export const membersService = {
    /** Community members, ordered by recent activity, annotated with post counts + online flag. */
    async getForumMembers(filters: MemberFilters = {}): Promise<ForumMember[]> {
        const [{ data, error }, counts] = await Promise.all([
            (() => {
                let q = supabase
                    .from('profiles')
                    .select('id, full_name, avatar_url, role, created_at, last_seen_at, social_links')
                    .order('last_seen_at', { ascending: false, nullsFirst: false })
                    .order('created_at', { ascending: false });
                if (filters.limit) q = q.limit(filters.limit);
                return q;
            })(),
            postCountsByAuthor(),
        ]);
        if (error) throw error;

        let members = toArray<Omit<ForumMember, 'post_count' | 'is_online'>>(data).map((m) => ({
            ...m,
            post_count: counts.get(m.id) || 0,
            is_online: isOnline(m.last_seen_at),
        }));

        if (filters.onlineOnly) members = members.filter((m) => m.is_online);
        return members;
    },

    /** Count of members seen within the online window. */
    async getOnlineCount(): Promise<number> {
        const since = new Date(Date.now() - ONLINE_WINDOW_MS).toISOString();
        const { count, error } = await supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .gte('last_seen_at', since);
        if (error) return 0;
        return count || 0;
    },

    /** Heartbeat: stamp the current user's last_seen_at. Never throws. */
    async touchPresence(): Promise<void> {
        try {
            await supabase.rpc('touch_last_seen');
        } catch (e) {
            console.error('Failed to update presence:', e);
        }
    },
};
