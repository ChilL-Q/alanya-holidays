import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

/**
 * Persistent store of processed Stripe event ids (audit 2.3).
 * Replaces the in-memory Map in StripeWebhookService so duplicate
 * deliveries are detected across restarts and multiple instances.
 */
@Injectable()
export class ProcessedStripeEventsRepository {
  constructor(private readonly supabaseService: SupabaseService) {}

  get client() {
    return this.supabaseService.getClient();
  }

  /**
   * Atomically claims an event id via INSERT ... ON CONFLICT DO NOTHING.
   * Returns true if this is the first delivery, false for duplicates.
   * Throws on DB failure so callers fail closed.
   */
  async tryClaimEvent(eventId: string): Promise<boolean> {
    const { data, error } = (await this.client.rpc('claim_stripe_event', {
      p_event_id: eventId,
    })) as { data: boolean | null; error: { message: string } | null };

    if (error) throw new Error(error.message);
    return data === true;
  }

  /**
   * Releases a previously claimed event so Stripe retries are processed
   * instead of being skipped as duplicates after a handler failure.
   */
  async releaseEvent(eventId: string): Promise<void> {
    const { error } = await this.client
      .from('processed_stripe_events')
      .delete()
      .eq('event_id', eventId);

    if (error) throw new Error(error.message);
  }
}
