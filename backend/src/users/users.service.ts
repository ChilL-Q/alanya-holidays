import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class UsersService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getAllUsers(page = 1, limit = 20, requestUserId: string) {
    const supabase = this.supabaseService.getClient();
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', requestUserId).single();
    if (profile?.role !== 'admin') throw new UnauthorizedException('Not authorized');

    const from = (page - 1) * limit;
    const { data, error, count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);
    
    if (error) throw new Error(error.message);
    return { data, pagination: { page, limit, total: count || 0, totalPages: Math.ceil((count || 0) / limit) } };
  }

  async getUserProfile(id: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
    if (error) throw new NotFoundException('User not found');
    return data;
  }

  async updateUserProfile(id: string, updates: any, requestUserId: string) {
    const supabase = this.supabaseService.getClient();
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', requestUserId).single();
    const role = profile?.role;

    if (requestUserId !== id && role !== 'admin') {
      throw new UnauthorizedException('Not authorized');
    }

    const safeUpdates = { ...updates };
    if (role !== 'admin') {
      delete safeUpdates.role;
    }

    const { error } = await supabase.from('profiles').update(safeUpdates).eq('id', id);
    if (error) throw new Error(error.message);
    return { success: true };
  }

  async getUsersByRole(targetRole: string, page = 1, limit = 20, requestUserId: string) {
    const supabase = this.supabaseService.getClient();
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', requestUserId).single();
    if (profile?.role !== 'admin') throw new UnauthorizedException('Not authorized');

    const from = (page - 1) * limit;
    const { data, error, count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .eq('role', targetRole)
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);
      
    if (error) throw new Error(error.message);
    return { data, pagination: { page, limit, total: count || 0, totalPages: Math.ceil((count || 0) / limit) } };
  }
}
