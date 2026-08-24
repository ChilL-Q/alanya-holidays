import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { SupabaseService } from '../../supabase/supabase.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { RedisService } from '../../common/redis/redis.service';

@Injectable()
export class AddonWebhookHandler {
  private readonly logger = new Logger(AddonWebhookHandler.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly notificationsService: NotificationsService,
    private readonly redisService: RedisService,
  ) {}

  private get supabase() {
    return this.supabaseService.getClient();
  }

  async handleCheckoutSession(session: Stripe.Checkout.Session): Promise<void> {
    if (session.payment_status && session.payment_status !== 'paid') {
      return;
    }

    const listingId = session.metadata?.listingId;
    const addonType = session.metadata?.addonType;
    const rawDays = session.metadata?.durationDays
      ? parseInt(session.metadata.durationDays, 10)
      : null;
    const durationDays =
      rawDays !== null && Number.isFinite(rawDays) && rawDays > 0
        ? rawDays
        : null;
    const userId = session.metadata?.userId;

    if (!listingId || !addonType || !userId) {
      this.logger.error(
        `Missing metadata for listing_addon checkout: ${JSON.stringify(session.metadata)}`,
      );
      return;
    }

    const paymentIntentId =
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id || null;

    let expiresAt: string | null = null;
    if (durationDays !== null) {
      const expDate = new Date();
      expDate.setDate(expDate.getDate() + durationDays);
      expiresAt = expDate.toISOString();
    } else if (addonType === 'seasonal_placement') {
      const expDate = new Date();
      expDate.setDate(expDate.getDate() + 90);
      expiresAt = expDate.toISOString();
    }

    try {
      if (paymentIntentId) {
        const { data: existingAddon } = await this.supabase
          .from('listing_addons')
          .select('id')
          .eq('stripe_payment_intent_id', paymentIntentId)
          .maybeSingle();

        if (existingAddon) {
          this.logger.log(
            `Listing add-on already recorded for payment ${paymentIntentId}, skipping duplicate`,
          );
          return;
        }
      }

      const addonMetadata: Record<string, unknown> = {
        amount: session.amount_total ? session.amount_total / 100 : 0,
        currency: session.currency || 'eur',
      };

      if (addonType === 'seasonal_placement') {
        const { data: preState } = await this.supabase
          .from('directory_listings')
          .select('is_featured')
          .eq('id', listingId)
          .maybeSingle();
        addonMetadata.was_featured_before = preState?.is_featured === true;
      }

      const { error: insertError } = await this.supabase
        .from('listing_addons')
        .insert({
          listing_id: listingId,
          addon_type: addonType,
          status: 'active',
          starts_at: new Date().toISOString(),
          expires_at: expiresAt,
          stripe_payment_intent_id: paymentIntentId,
          metadata: addonMetadata,
        });

      if (insertError) {
        this.logger.error(
          `Failed to insert listing_addon for session ${session.id}: ${insertError.message}`,
        );
        throw insertError;
      }

      // Apply fast-path flags to the listing record directly
      let patch: Record<string, unknown> | null = null;
      if (addonType === 'verified_badge') {
        patch = { is_verified: true };
      } else if (addonType === 'seasonal_placement') {
        patch = { is_featured: true };
      }

      if (patch) {
        const { error: patchError } = await this.supabase
          .from('directory_listings')
          .update(patch)
          .eq('id', listingId);

        if (patchError) {
          this.logger.error(
            `Failed to update directory_listings for listing ${listingId} with patch ${JSON.stringify(patch)}: ${patchError.message}`,
          );
        } else {
          // Fast-path flags bypass DirectoryListingService, so this handler
          // owns the cache invalidation for them — otherwise Guests see the
          // badge only after up to 600s of stale cache.
          await this.redisService.delByPattern('directory:*');
        }
      }

      if (addonType === 'sponsored_article') {
        const { data: addonListing } = await this.supabase
          .from('directory_listings')
          .select('name')
          .eq('id', listingId)
          .maybeSingle();

        const listingRecord = addonListing as { name?: string | null } | null;
        const listingName = listingRecord?.name ?? listingId;

        await this.notificationsService.notifyAdmins({
          title: 'Sponsored article purchased',
          message: `Listing "${listingName}" purchased a Sponsored Article. Reach out to the owner and schedule the editorial piece.`,
          type: 'info',
          link: '/admin/directory',
        });
      }

      await this.notificationsService.notifyUser(userId, {
        title: 'Upgrade activated',
        message: `Your "${addonType.replace(/_/g, ' ')}" add-on is now active.`,
        type: 'success',
        link: '/host/upgrades',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const stack = err instanceof Error ? err.stack : undefined;
      this.logger.error(
        `Failed processing listing_addon checkout for session ${session.id}: ${msg}`,
        stack,
      );
      throw err;
    }
  }
}
