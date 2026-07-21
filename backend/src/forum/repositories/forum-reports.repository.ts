import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable()
export class ForumReportsRepository {
  constructor(private readonly supabaseService: SupabaseService) {}

  get client() {
    return this.supabaseService.getClient();
  }

  async insertReport(data: any) {
    const { error } = await this.client
      .from('forum_reports')
      .insert([data]);
    if (error) throw new Error(error.message);
  }

  async getReports(includeResolved: boolean) {
    let q = this.client
      .from('forum_reports')
      .select('*, reporter:profiles!forum_reports_reporter_id_fkey(full_name, avatar_url)')
      .order('created_at', { ascending: false });

    if (!includeResolved) {
      q = q.eq('status', 'pending');
    }

    const { data } = await q;
    return data || [];
  }

  async updateReportResolved(id: string) {
    const { error } = await this.client
      .from('forum_reports')
      .update({ status: 'resolved' })
      .eq('id', id);
    if (error) throw new Error(error.message);
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
