import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export interface PremiumSubscriptionRecord {
  id: string;
  user_id: string;
  plan: string;
  status: string;
  tier?: string | null;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Доступ к premium_subscriptions. RLS таблицы разрешает own-read,
 * сервис работает через service-role (обходит RLS).
 */
@Injectable()
export class BillingRepository {
  constructor(private readonly supabaseService: SupabaseService) {}

  private get client() {
    return this.supabaseService.getClient();
  }

  async findByUserId(
    userId: string,
  ): Promise<PremiumSubscriptionRecord | null> {
    const { data, error } = await this.client
      .from('premium_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle<PremiumSubscriptionRecord>();

    if (error) throw new Error(error.message);
    return data ?? null;
  }

  async setCancelAtPeriodEnd(id: string, flag: boolean): Promise<void> {
    const { error } = await this.client
      .from('premium_subscriptions')
      .update({ cancel_at_period_end: flag })
      .eq('id', id);

    if (error) throw new Error(error.message);
  }
}
