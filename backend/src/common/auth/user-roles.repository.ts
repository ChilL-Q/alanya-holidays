import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Single shared source of truth for user role resolution (audit 1.2).
 * Previously duplicated as getUserRole() in 10 feature repositories.
 */
@Injectable()
export class UserRolesRepository {
  constructor(private readonly supabaseService: SupabaseService) {}

  get client() {
    return this.supabaseService.getClient();
  }

  async getRole(userId: string): Promise<string | undefined> {
    if (!UUID_RE.test(userId)) return undefined;

    try {
      const { data, error } = await this.client
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single<{ role: string }>();

      if (error && (error.code === 'PGRST116' || error.code === '22P02')) {
        return undefined;
      }
      return data?.role ?? undefined;
    } catch {
      return undefined;
    }
  }

  async getUserRole(userId: string): Promise<string | undefined> {
    return this.getRole(userId);
  }
}
