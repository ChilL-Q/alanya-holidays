import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { ForumStatsResponse } from '../types/forum.types';

@Injectable()
export class ForumStatsRepository {
  constructor(private readonly supabaseService: SupabaseService) {}

  get client() {
    return this.supabaseService.getClient();
  }

  async getStats(): Promise<ForumStatsResponse> {
    const [topicsRes, repliesRes] = await Promise.all([
      this.client
        .from('forum_posts')
        .select('*', { count: 'exact', head: true })
        .eq('is_removed', false),
      this.client
        .from('forum_comments')
        .select('*', { count: 'exact', head: true })
        .eq('is_removed', false),
    ]);

    if (topicsRes.error)
      console.error('getStats topics query failed:', topicsRes.error);
    if (repliesRes.error)
      console.error('getStats replies query failed:', repliesRes.error);

    const ONLINE_WINDOW_MS = 5 * 60 * 1000;
    const since = new Date(Date.now() - ONLINE_WINDOW_MS).toISOString();

    const onlineRes = await this.client
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .gte('last_seen_at', since);
    if (onlineRes.error)
      console.error('getStats online count query failed:', onlineRes.error);

    const membersRes = await this.client
      .from('profiles')
      .select('full_name')
      .order('created_at', { ascending: false })
      .limit(1);
    if (membersRes.error)
      console.error('getStats latest member query failed:', membersRes.error);

    const memberData = membersRes.data;

    return {
      totalTopics: topicsRes.count ?? 0,
      totalReplies: repliesRes.count ?? 0,
      usersOnline: onlineRes.count ?? 0,
      latestMember: memberData?.[0]?.full_name || null,
    };
  }
}
