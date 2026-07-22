import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable()
export class ForumStatsRepository {
  constructor(private readonly supabaseService: SupabaseService) {}

  get client() {
    return this.supabaseService.getClient();
  }

  async getStats() {
    const [{ count: topicsCount }, { count: repliesCount }] = await Promise.all(
      [
        this.client
          .from('forum_posts')
          .select('*', { count: 'exact', head: true })
          .eq('is_removed', false),
        this.client
          .from('forum_comments')
          .select('*', { count: 'exact', head: true })
          .eq('is_removed', false),
      ],
    );

    const ONLINE_WINDOW_MS = 5 * 60 * 1000;
    const since = new Date(Date.now() - ONLINE_WINDOW_MS).toISOString();

    const { count: onlineCount } = await this.client
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .gte('last_seen_at', since);

    const { data: latestMembers } = await this.client
      .from('profiles')
      .select('full_name')
      .order('created_at', { ascending: false })
      .limit(1);

    return {
      totalTopics: topicsCount || 0,
      totalReplies: repliesCount || 0,
      usersOnline: onlineCount || 0,
      latestMember: latestMembers?.[0]?.full_name || null,
    };
  }
}
