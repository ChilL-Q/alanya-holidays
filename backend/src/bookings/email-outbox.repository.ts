import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export interface EmailOutboxPayload {
  to?: string;
  userId?: string;
  type: string;
  data: Record<string, unknown>;
}

/**
 * Persistent email outbox (audit 2.4).
 * Emails are durably enqueued in the DB and delivered by the
 * process-email-outbox edge function (cron-driven), replacing fire-and-forget
 * edge function invocations that silently lost mail on restart.
 */
@Injectable()
export class EmailOutboxRepository {
  private readonly logger = new Logger(EmailOutboxRepository.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  get client() {
    return this.supabaseService.getClient();
  }

  /**
   * Durably persists an email for later delivery. Throws on failure so the
   * caller knows the mail was NOT persisted (fail-loud, never silent loss).
   */
  async enqueue(payload: EmailOutboxPayload): Promise<void> {
    const { error } = await this.client.rpc('enqueue_email', {
      p_payload: payload,
    });

    if (error) {
      this.logger.error(
        `Failed to enqueue email "${payload.type}": ${error.message}`,
      );
      throw new Error(error.message);
    }
  }
}
