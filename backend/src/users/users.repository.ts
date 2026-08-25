import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class UsersRepository {
  private readonly logger = new Logger(UsersRepository.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  get client() {
    return this.supabaseService.getClient();
  }

  async getAllUsers(page = 1, limit = 20) {
    const from = (page - 1) * limit;
    const { data, error, count } = await this.client
      .from('profiles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);

    if (error) throw new Error(error.message);
    return { data: data ?? [], count: count ?? 0 };
  }

  async getUserProfile(id: string) {
    // Explicit projection: profiles carry banking PII (iban, bank_name,
    // crypto_wallet) that must never leave the server through this API.
    const { data, error } = await this.client
      .from('profiles')
      .select(
        'id, full_name, email, phone, avatar_url, bio, company_name, social_links, role, created_at',
      )
      .eq('id', id)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    return data;
  }

  async updateUserProfile(id: string, updates: Record<string, unknown>) {
    const { error } = await this.client
      .from('profiles')
      .update(updates)
      .eq('id', id);
    if (error) throw new Error(error.message);
  }

  async getUsersByRole(targetRole: string, page = 1, limit = 20) {
    const from = (page - 1) * limit;
    const { data, error, count } = await this.client
      .from('profiles')
      .select('*', { count: 'exact' })
      .eq('role', targetRole)
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);

    if (error) throw new Error(error.message);
    return { data: data ?? [], count: count ?? 0 };
  }

  async getForumMembers(limit?: number) {
    let q = this.client
      .from('profiles')
      .select(
        'id, full_name, avatar_url, role, created_at, last_seen_at, social_links',
      )
      .order('last_seen_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (limit) q = q.limit(limit);

    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return data || [];
  }

  async getForumMemberById(id: string) {
    const { data, error } = await this.client
      .from('profiles')
      .select(
        'id, full_name, avatar_url, role, bio, created_at, last_seen_at, social_links',
      )
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;

    const { count } = await this.client
      .from('forum_posts')
      .select('id', { count: 'exact', head: true })
      .eq('author_id', id)
      .eq('is_removed', false);

    return { ...data, post_count: count ?? 0 };
  }

  async getForumPostsAuthors() {
    const { data, error } = await this.client
      .from('forum_posts')
      .select('author_id')
      .eq('is_removed', false);

    if (error) throw new Error(error.message);
    return data || [];
  }

  async getOnlineCount(since: string) {
    const { count, error } = await this.client
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .gte('last_seen_at', since);

    if (error) {
      this.logger.error(
        'getOnlineCount error:',
        error instanceof Error ? error.stack : JSON.stringify(error),
      );
      return 0;
    }
    return count ?? 0;
  }

  async updatePresence(userId: string) {
    const { error } = await this.client
      .from('profiles')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', userId);
    if (error) {
      this.logger.error(
        'Failed to update presence:',
        error instanceof Error ? error.stack : JSON.stringify(error),
      );
    }
  }
}
