import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { ForumReport, InsertForumReportDbInput } from '../types/forum.types';

@Injectable()
export class ForumReportsRepository {
  constructor(private readonly supabaseService: SupabaseService) {}

  get client() {
    return this.supabaseService.getClient();
  }

  async insertReport(data: InsertForumReportDbInput): Promise<void> {
    const { error } = await this.client.from('forum_reports').insert([data]);
    if (error) throw new Error(error.message);
  }

  async getReports(includeResolved: boolean): Promise<ForumReport[]> {
    let q = this.client
      .from('forum_reports')
      .select(
        '*, reporter:profiles!forum_reports_reporter_id_fkey(full_name, avatar_url)',
      )
      .order('created_at', { ascending: false });

    if (!includeResolved) {
      q = q.eq('resolved', false);
    }

    const { data } = await q;
    return (data as unknown as ForumReport[]) || [];
  }

  async updateReportResolved(id: string): Promise<void> {
    const { error } = await this.client
      .from('forum_reports')
      .update({ resolved: true })
      .eq('id', id);
    if (error) throw new Error(error.message);
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
