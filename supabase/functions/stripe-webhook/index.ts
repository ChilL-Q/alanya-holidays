// @ts-ignore: npm: specifiers are resolved by Deno, not tsc
import Stripe from 'npm:stripe@17'
// @ts-ignore: npm: specifiers are resolved by Deno, not tsc
import { createClient } from 'npm:@supabase/supabase-js@2'
// @ts-ignore: npm: specifiers are resolved by Deno, not tsc
import { z } from 'npm:zod@3'

// @ts-ignore: jsr: specifiers are resolved by Deno, not tsc
import "jsr:@supabase/functions-js@^2/edge-runtime.d.ts"

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  // L1: Allow override via env var for easy API version updates without code change
  apiVersion: (Deno.env.get('STRIPE_API_VERSION') ?? '2025-01-27.acacia') as Stripe.StripeConstructorOptions['apiVersion'],
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req: Request) => {
  const signature = req.headers.get('stripe-signature')
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!

  if (!signature) {
    return new Response(JSON.stringify({ error: 'Missing stripe-signature header' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  }

  const body = await req.text()

  let event: Stripe.Event

  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Webhook signature verification failed:', message)
    return new Response(JSON.stringify({ error: `Webhook Error: ${message}` }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  }

  // ============================================================
  // Premium Subscription Handlers (Task 90)
  // ============================================================

  if (event.type === 'customer.subscription.created') {
    const subscription = event.data.object as Stripe.Subscription
    const customerId = subscription.customer as string
    const metadata = subscription.metadata

    const metadataSchema = z.object({
      userId: z.string().uuid(),
      plan: z.enum(['monthly', 'annual']),
      tier: z.enum(['voyager', 'signature']).optional(),
    })
    const metadataResult = metadataSchema.safeParse(metadata)
    if (!metadataResult.success) {
      console.warn('subscription.created: Invalid or missing metadata', metadataResult.error.issues)
      return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } })
    }
    const { userId: metaUserId, plan: metaPlan, tier: metaTier } = metadataResult.data

    // Idempotency: check if already exists
    const { data: existing } = await supabase
      .from('premium_subscriptions')
      .select('id')
      .eq('stripe_subscription_id', subscription.id)
      .maybeSingle()

    if (existing) {
      console.warn(`Skipping duplicate subscription.created webhook for sub ${subscription.id}`)
      return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } })
    }

    // Determine status: trialing if trial_end < now, otherwise active
    let status: 'active' | 'trialing' = 'active'
    if (subscription.status === 'trialing' || (subscription.trial_end && new Date(subscription.trial_end * 1000) > new Date())) {
      status = 'trialing'
    }

    const currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString()

    // Insert into DB
    const insertPayload: Record<string, unknown> = {
      user_id: metaUserId,
      plan: metaPlan,
      status: status,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: customerId,
      current_period_end: currentPeriodEnd,
      cancel_at_period_end: subscription.cancel_at_period_end,
    }
    if (metaTier) {
      insertPayload.tier = metaTier
    }

    const { error: insertError } = await supabase
      .from('premium_subscriptions')
      .insert(insertPayload)

    if (insertError) {
      console.error('Failed to insert premium subscription:', insertError)
      return new Response(JSON.stringify({ error: 'DB insert failed' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }

    console.warn(`Premium subscription created for user ${metaUserId} — plan: ${metaPlan}`)

    // In-app notification
    await supabase.from('notifications').insert({
      user_id: metaUserId,
      title: '🎉 Welcome to Premium!',
      message: 'You now have access to AI Trip Planner and Premium benefits.',
      type: 'success',
      link: '/profile',
    })

    // Email
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', metaUserId)
      .maybeSingle()

    if (userProfile?.email) {
      console.warn(`Sending welcome email to user ${metaUserId} at ${userProfile.email}`)
      try {
        await supabase.functions.invoke('send-email', {
          body: {
            to: userProfile.email,
            type: 'welcome_email', // Using existing template, or we can add 'welcome_premium'
            data: {
              name: userProfile.full_name || 'there',
              link: `${Deno.env.get('SITE_URL') ?? 'https://alanyaholidays.com'}/profile`,
            },
          },
        })
      } catch (e) {
        console.error('Failed to send welcome email:', e)
      }
    }

    return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } })
  } // end customer.subscription.created

  if (event.type === 'customer.subscription.updated') {
    const subscription = event.data.object as Stripe.Subscription

    // Find sub record by stripe_subscription_id
    const { data: subRecord, error: fetchError } = await supabase
      .from('premium_subscriptions')
      .select('id, stripe_customer_id, user_id, status, cancel_at_period_end')
      .eq('stripe_subscription_id', subscription.id)
      .maybeSingle()

    if (fetchError || !subRecord) {
      console.error('subscription.updated: Failed to find subscription record:', fetchError?.message ?? 'not found')
      return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } })
    }

    // Always update period end and cancel flag first
    const currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString()
    const cancelAtPeriodEnd = subscription.cancel_at_period_end ?? false
    const newStatus: 'active' | 'trialing' | 'past_due' | 'cancelled' = subscription.status === 'active' ? 'active' : subscription.status === 'trialing' ? 'trialing' : subscription.status === 'past_due' ? 'past_due' : 'cancelled'

    const { error: updateError } = await supabase
      .from('premium_subscriptions')
      .update({
        status: newStatus,
        current_period_end: currentPeriodEnd,
        cancel_at_period_end: cancelAtPeriodEnd,
      })
      .eq('id', subRecord.id)

    if (updateError) {
      console.error('Failed to update premium subscription status:', updateError)
      return new Response(JSON.stringify({ error: 'DB update failed' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }

    console.warn(`Premium subscription updated: id ${subRecord.id}, status -> ${newStatus}`)

    // Recovery notification: if it was past_due and now active
    if (subRecord.status === 'past_due' && newStatus === 'active') {
      await supabase.from('notifications').insert({
        user_id: subRecord.user_id,
        title: 'Subscription Restored',
        message: 'Your Premium subscription has been restored. Enjoy your benefits!',
        type: 'success',
        link: '/profile',
      })

      // Send recovery email
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', subRecord.user_id)
        .maybeSingle()

      if (userProfile?.email) {
        console.warn(`Sending subscription restored email to user ${subRecord.user_id} at ${userProfile.email}`)
        try {
          await supabase.functions.invoke('send-email', {
            body: {
              to: userProfile.email,
              type: 'subscription_restored',
              data: {
                name: userProfile.full_name || 'there',
                link: `${Deno.env.get('SITE_URL') ?? 'https://alanyaholidays.com'}/profile`,
              },
            },
          })
        } catch (e) {
          console.error('Failed to send subscription restored email:', e)
        }
      }
    }

    // Cancellation notification (Stripe sets cancel_at_period_end but status is still active until period ends)
    if (cancelAtPeriodEnd && !subRecord.cancel_at_period_end) {
      await supabase.from('notifications').insert({
        user_id: subRecord.user_id,
        title: 'Subscription Cancellation Scheduled',
        message: `Your Premium subscription will end on ${currentPeriodEnd}. You still have access until then.`,
        type: 'warning',
        link: '/profile',
      })

      // Email notification
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', subRecord.user_id)
        .maybeSingle()

      if (userProfile?.email) {
        console.warn(`Sending cancellation scheduled email to user ${subRecord.user_id} at ${userProfile.email}`)
        try {
          await supabase.functions.invoke('send-email', {
            body: {
              to: userProfile.email,
              type: 'subscription_cancellation_scheduled',
              data: {
                name: userProfile.full_name || 'there',
                periodEnd: new Date(currentPeriodEnd).toLocaleDateString(),
                link: `${Deno.env.get('SITE_URL') ?? 'https://alanyaholidays.com'}/profile`,
              },
            },
          })
        } catch (e) {
          console.error('Failed to send cancellation scheduled email:', e)
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } })
  } // end customer.subscription.updated

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription

    const { data: subRecord, error: fetchError } = await supabase
      .from('premium_subscriptions')
      .select('id, user_id, stripe_customer_id, current_period_end')
      .eq('stripe_subscription_id', subscription.id)
      .maybeSingle()

    if (fetchError || !subRecord) {
      console.warn('subscription.deleted: Subscription record not found or already deleted')
      return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } })
    }

    const { error: updateError } = await supabase
      .from('premium_subscriptions')
      .update({ status: 'cancelled' })
      .eq('id', subRecord.id)

    if (updateError) {
      console.error('Failed to cancel premium subscription in DB:', updateError)
      return new Response(JSON.stringify({ error: 'DB update failed' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }

    console.warn(`Premium subscription cancelled: id ${subRecord.id}`)

    // Notification
    await supabase.from('notifications').insert({
      user_id: subRecord.user_id,
      title: 'Subscription Cancelled',
      message: `Your Premium subscription has ended. You had access until ${new Date(subRecord.current_period_end).toLocaleDateString()}.`,
      type: 'info',
      link: '/profile',
    })

    // Email
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', subRecord.user_id)
      .maybeSingle()

    if (userProfile?.email) {
      console.warn(`Sending cancellation email to user ${subRecord.user_id} at ${userProfile.email}`)
      try {
        await supabase.functions.invoke('send-email', {
          body: {
            to: userProfile.email,
            type: 'subscription_cancelled',
            data: {
              name: userProfile.full_name || 'there',
              periodEnd: new Date(subRecord.current_period_end).toLocaleDateString(),
              link: `${Deno.env.get('SITE_URL') ?? 'https://alanyaholidays.com'}/profile`,
            },
          },
        })
      } catch (e) {
        console.error('Failed to send cancellation email:', e)
      }
    }

    return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } })
  } // end customer.subscription.deleted

  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object as Stripe.Invoice
    const customerId = invoice.customer as string

    // Find user's subscription by customer ID
    // M1: include 'trialing' — trial-period invoices can also fail
    // M2: .limit(1) before .maybeSingle() — prevents PostgREST error if customer has 2 records
    const { data: subRecord, error: fetchError } = await supabase
      .from('premium_subscriptions')
      .select('id, user_id, stripe_subscription_id')
      .eq('stripe_customer_id', customerId)
      .in('status', ['active', 'trialing'])
      .limit(1)
      .maybeSingle()

    if (fetchError || !subRecord) {
      console.warn('invoice.payment_failed: No active/trialing subscription found for customer')
      return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } })
    }

    const { error: updateError } = await supabase
      .from('premium_subscriptions')
      .update({ status: 'past_due' })
      .eq('id', subRecord.id)

    if (updateError) {
      console.error('Failed to update subscription to past_due:', updateError)
      return new Response(JSON.stringify({ error: 'DB update failed' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }

    console.warn(`Premium subscription marked past_due: id ${subRecord.id}`)

    // Notification
    await supabase.from('notifications').insert({
      user_id: subRecord.user_id,
      title: '⚠️ Payment Failed',
      message: 'Your Premium subscription payment failed. Please update your payment method to maintain access.',
      type: 'error',
      link: '/profile',
    })

    // Email
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', subRecord.user_id)
      .maybeSingle()

    if (userProfile?.email) {
      console.warn(`Sending payment-failed email to user ${subRecord.user_id} at ${userProfile.email}`)
      try {
        await supabase.functions.invoke('send-email', {
          body: {
            to: userProfile.email,
            type: 'subscription_payment_failed',
            data: {
              name: 'there',
              link: `${Deno.env.get('SITE_URL') ?? 'https://alanyaholidays.com'}/profile`,
            },
          },
        })
      } catch (e) {
        console.error('Failed to send payment failed email:', e)
      }
    }

    return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } })
  } // end invoice.payment_failed

  // ============================================================
  // Booking / Checkout Handler
  // ============================================================

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    // Blog submissions are now free — log and ignore if an old link triggers this
    if (session.metadata?.type === 'blog_submission') {
      console.warn(`Unexpected blog_submission payment received for session: ${session.id}`)
      return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } })
    }

    const paymentIntentId = typeof session.payment_intent === 'string'
      ? session.payment_intent
      : (session.payment_intent as any)?.id ?? null

    // --- Listing add-on purchase (Upgrades tab) ---
    if (session.metadata?.type === 'listing_addon') {
      if (session.payment_status !== 'paid') {
        return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } })
      }

      const addonSchema = z.object({
        userId: z.string().uuid(),
        listingId: z.string().uuid(),
        addonType: z.enum(['verified_badge', 'seasonal_placement', 'sponsored_article', 'ai_localization']),
      })
      const addonResult = addonSchema.safeParse(session.metadata)
      if (!addonResult.success) {
        console.error('listing_addon: invalid metadata', addonResult.error.issues)
        return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } })
      }
      const { userId: addonUserId, listingId, addonType } = addonResult.data

      // Idempotency: skip if this payment was already recorded
      if (paymentIntentId) {
        const { data: existingAddon } = await supabase
          .from('listing_addons')
          .select('id')
          .eq('stripe_payment_intent_id', paymentIntentId)
          .limit(1)
          .maybeSingle()
        if (existingAddon) {
          console.warn(`Skipping duplicate add-on webhook for payment_intent ${paymentIntentId}`)
          return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } })
        }
      }

      // Seasonal placement is time-boxed; others do not expire
      const expiresAt = addonType === 'seasonal_placement'
        ? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
        : null

      const { error: addonInsertError } = await supabase
        .from('listing_addons')
        .insert({
          listing_id: listingId,
          addon_type: addonType,
          status: 'active',
          stripe_payment_intent_id: paymentIntentId,
          expires_at: expiresAt,
        })

      if (addonInsertError) {
        console.error('Failed to insert listing add-on:', addonInsertError)
        return new Response(JSON.stringify({ error: 'DB insert failed' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
      }

      // Apply the listing-level effect of the add-on
      const listingPatch: Record<string, unknown> = {}
      if (addonType === 'verified_badge') listingPatch.is_verified = true
      if (addonType === 'seasonal_placement') listingPatch.is_featured = true
      if (Object.keys(listingPatch).length > 0) {
        const { error: patchError } = await supabase
          .from('directory_listings')
          .update(listingPatch)
          .eq('id', listingId)
        if (patchError) console.error('Failed to apply add-on effect to listing:', patchError)
      }

      await supabase.from('notifications').insert({
        user_id: addonUserId,
        title: 'Upgrade activated',
        message: `Your "${addonType.replace(/_/g, ' ')}" add-on is now active.`,
        type: 'success',
        link: '/host/upgrades',
      })

      console.warn(`Listing add-on activated: ${addonType} for listing ${listingId}`)
      return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } })
    }

    // Idempotency: skip if already processed
    const bookingIds = session.metadata?.bookingIds?.split(',').filter(Boolean) ?? []
    if (bookingIds.length > 0) {
      const { data: existing } = await supabase
        .from('bookings')
        .select('id, payment_status')
        .eq('stripe_session_id', session.id)
        .limit(1)
        .maybeSingle()

      if (existing?.payment_status === 'paid') {
        console.warn(`Skipping duplicate webhook for session ${session.id}`)
        return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } })
      }
    }

    if (session.payment_status === 'paid') {
      if (bookingIds.length > 0) {
        // A1-C1: Verify all bookingIds belong to the userId from this session
        const sessionUserId = session.metadata?.userId
        if (!sessionUserId) {
          // Return 200 to prevent Stripe retries — this is a code bug, retrying won't fix it
          console.error(`Missing userId in session metadata: ${session.id}`)
          return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } })
        }

        const { data: ownedBookings, error: ownerCheckError } = await supabase
          .from('bookings')
          .select('id')
          .in('id', bookingIds)
          .eq('user_id', sessionUserId)

        if (ownerCheckError) {
          console.error('Ownership check failed:', ownerCheckError)
          return new Response(JSON.stringify({ error: 'Ownership check failed' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
        }

        const ownedIds = (ownedBookings ?? []).map((b: { id: string }) => b.id)
        const unauthorized = bookingIds.filter((id: string) => !ownedIds.includes(id))
        if (unauthorized.length > 0) {
          // Return 200 to prevent Stripe retries — security alert goes to logs
          console.error(`Unauthorized booking IDs in session ${session.id}:`, unauthorized)
          return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } })
        }

        const updatePayload: Record<string, unknown> = {
          status: 'confirmed',
          payment_status: 'paid',
        }

        if (paymentIntentId) {
          updatePayload.payment_intent_id = paymentIntentId
        }

        // A1-C2 + H2 + H3: Use .select() to detect rows actually updated
        // H2: .eq('status', 'pending') prevents confirming already-cancelled (cron race)
        // H3: .eq('stripe_session_id', session.id) prevents concurrent retries from updating
        const { data: updatedRows, error } = await supabase
          .from('bookings')
          .update(updatePayload)
          .in('id', bookingIds)
          .eq('status', 'pending')
          .eq('stripe_session_id', session.id)
          .select('id')

        if (error) {
          console.error('Failed to confirm bookings:', error)
          return new Response(JSON.stringify({ error: 'DB update failed' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
        }

        if (!updatedRows || updatedRows.length === 0) {
          // Bookings were likely already cancelled by cron or state machine rejected the transition.
          // Return 200 to prevent Stripe from retrying — retries won't fix this.
          console.warn(`No rows updated for bookings: ${bookingIds.join(', ')} — likely cancelled by cron or already processed`)
          return new Response(JSON.stringify({ received: true, note: 'no rows updated' }), { headers: { 'Content-Type': 'application/json' } })
        }

        // Use only the IDs that were actually confirmed (state machine may have skipped some)
        const confirmedIds = updatedRows.map((r: { id: string }) => r.id)
        console.warn(`Confirmed bookings: ${confirmedIds.join(', ')}`)

        // Fetch only confirmed bookings for email sending (not original bookingIds — some may have been skipped by state machine)
        const { data: bookings, error: fetchError } = await supabase
          .from('bookings')
          .select(`
            id, check_in, check_out, guests,
            property:properties(title),
            service:services(title),
            profile:profiles!bookings_user_id_fkey(email)
          `)
          .in('id', confirmedIds)

        if (fetchError) {
          console.error('Failed to fetch bookings for emails:', fetchError)
        }

        // Отправляем email гостю по каждой брони
        // M4: fire-and-forget — don't block on email delivery to stay within Stripe 30s timeout
        if (bookings && bookings.length > 0) {
          type BookingRow = { id: string; check_in: string; check_out: string; guests: number | null; property: { title: string } | null; service: { title: string } | null; profile: { email: string } | null }
          bookings.forEach((booking: BookingRow) => {
            const itemTitle = booking.property?.title ?? booking.service?.title ?? 'Booking'
            const guestEmail = booking.profile?.email
            if (!guestEmail) return

            console.warn(`Sending booking confirmation email for booking ${booking.id} to ${guestEmail}`)
            supabase.functions.invoke('send-email', {
              body: {
                to: guestEmail,
                type: 'booking_confirmed',
                data: {
                  itemTitle,
                  checkIn: booking.check_in,
                  checkOut: booking.check_out,
                  guests: String(booking.guests ?? 1),
                  link: `${Deno.env.get('SITE_URL') ?? 'https://alanyaholidays.com'}/profile`,
                },
              },
            }).catch((e: unknown) => {
              // M5: audit_logs on failure
              const msg = e instanceof Error ? e.message : String(e)
              console.error(`Email send failed for booking ${booking.id}:`, msg)
              supabase.from('audit_logs').insert({
                event_type: 'EMAIL_DELIVERY_FAILED',
                details: { email_type: 'booking_confirmed', booking_id: booking.id, error: msg },
              }).then(() => {}).catch(() => {})
            })
          })
        }
      }
    } // end if session.payment_status === 'paid'
  } // end checkout.session.completed

  if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent
    const paymentIntentId = paymentIntent.id

    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('id, user_id, property:properties(title), service:services(title)')
      .eq('payment_intent_id', paymentIntentId)
      .limit(1)
      .maybeSingle()

    if (fetchError) {
      console.error('Failed to fetch booking for payment_intent:', fetchError)
      return new Response(JSON.stringify({ error: 'DB lookup failed' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }

    if (!booking) {
      console.warn(`No booking found for payment_intent ${paymentIntentId}`)
      return new Response(JSON.stringify({ received: true }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { error: updateError } = await supabase
      .from('bookings')
      .update({ payment_status: 'failed' })
      .eq('id', booking.id)

    if (updateError) {
      console.error('Failed to update booking payment_status to failed:', updateError)
      return new Response(JSON.stringify({ error: 'DB update failed' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }

    const itemTitle = (booking.property as any)?.title ?? (booking.service as any)?.title ?? 'your booking'

    await supabase.from('notifications').insert({
      user_id: booking.user_id,
      title: 'Payment Failed',
      message: `Your payment for "${itemTitle}" could not be processed. Please update your payment method and try again.`,
      type: 'error',
      link: '/profile',
    })

    console.warn(`Payment failed: booking ${booking.id}, payment_intent ${paymentIntentId}`)
  }

  if (event.type === 'charge.dispute.created') {
    const dispute = event.data.object as Stripe.Dispute
    const paymentIntentId = dispute.payment_intent as string | undefined

    if (paymentIntentId) {
      const { data: booking } = await supabase
        .from('bookings')
        .select('id, user_id')
        .eq('payment_intent_id', paymentIntentId)
        .limit(1)
        .maybeSingle()

      if (booking) {
        const { error: disputeUpdateError } = await supabase
          .from('bookings')
          .update({ payment_status: 'failed' })
          .eq('id', booking.id)
        if (disputeUpdateError) {
          console.error(`Failed to mark booking ${booking.id} as failed on dispute:`, disputeUpdateError)
        }
      }

      // Notify all admins
      const { data: admins } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin')

      if (admins && admins.length > 0) {
        await supabase.from('notifications').insert(
          admins.map((admin: { id: string }) => ({
            user_id: admin.id,
            title: 'Charge Dispute Filed',
            message: `A dispute has been filed for payment intent ${paymentIntentId}${booking ? `. Booking ID: ${booking.id}` : ''}. Dispute reason: ${dispute.reason ?? 'unknown'}.`,
            type: 'warning',
            link: '/admin/bookings',
          }))
        )
      }

      console.warn(`Dispute created: payment_intent ${paymentIntentId}, booking ${booking?.id ?? 'not found'}, reason: ${dispute.reason}`)
    }
  }

  if (event.type === 'charge.refunded') {
    const charge = event.data.object as Stripe.Charge
    const paymentIntentId = charge.payment_intent as string | undefined
    const amountRefundedCents = charge.amount_refunded ?? 0
    const amountRefunded = (amountRefundedCents / 100).toFixed(2)

    if (!paymentIntentId) {
      console.warn('charge.refunded event received without payment_intent — cannot lookup booking')
      return new Response(JSON.stringify({ received: true }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Look up booking by payment_intent_id (set by checkout.session.completed handler)
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select(`
        id, user_id, payment_status,
        property:properties(title),
        service:services(title),
        profile:profiles!bookings_user_id_fkey(email)
      `)
      .eq('payment_intent_id', paymentIntentId)
      .limit(1)
      .maybeSingle()

    if (fetchError) {
      console.error('Failed to fetch booking for refund:', fetchError)
      return new Response(JSON.stringify({ error: 'DB lookup failed' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }

    if (!booking) {
      console.warn(`No booking found for payment_intent ${paymentIntentId} — refund not applied`)
      return new Response(JSON.stringify({ received: true }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Idempotency: skip if already refunded
    if (booking.payment_status === 'refunded') {
      console.warn(`Booking ${booking.id} already refunded — skipping`)
      return new Response(JSON.stringify({ received: true }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Update payment_status
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ payment_status: 'refunded' })
      .eq('id', booking.id)

    if (updateError) {
      console.error('Failed to update booking payment_status to refunded:', updateError)
      return new Response(JSON.stringify({ error: 'DB update failed' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }

    // Create audit log
    const itemTitle = (booking.property as any)?.title ?? (booking.service as any)?.title ?? 'Booking'
    await supabase.from('audit_logs').insert({
      event_type: 'REFUND',
      details: {
        bookingId: booking.id,
        amountRefunded,
        currency: charge.currency ?? 'eur',
        chargeId: charge.id,
        previousPaymentStatus: booking.payment_status,
      },
      user_id: booking.user_id,
      created_at: new Date().toISOString(),
    })

    // In-app notification to guest
    await supabase.from('notifications').insert({
      user_id: booking.user_id,
      title: 'Refund Processed',
      message: `A refund of €${amountRefunded} has been processed for "${itemTitle}". It may take 5-10 business days for the credit to appear on your statement.`,
      type: 'info',
      link: '/profile',
    })

    // Email to guest (uses existing 'refund_processed' template)
    const guestEmail = (booking.profile as any)?.email
    if (guestEmail) {
      console.warn(`Sending refund email for booking ${booking.id} to ${guestEmail}`)
      const siteUrl = Deno.env.get('SITE_URL') ?? 'https://alanyaholidays.com'
      const maxRetries = 3
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          await supabase.functions.invoke('send-email', {
            body: {
              to: guestEmail,
              type: 'refund_processed',
              data: {
                amount: amountRefunded,
                itemTitle,
                link: `${siteUrl}/profile`,
              },
            },
          })
          break
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e)
          if (attempt < maxRetries) {
            const delayMs = Math.pow(2, attempt) * 1000
            console.warn(`Refund email send failed for booking ${booking.id}, attempt ${attempt}/${maxRetries}. Retrying in ${delayMs}ms...`)
            await new Promise(resolve => setTimeout(resolve, delayMs))
          } else {
            console.error(`Refund email send failed for booking ${booking.id} after ${maxRetries} attempts:`, msg)
          }
        }
      }
    }

    console.warn(`Refund processed: booking ${booking.id}, amount €${amountRefunded}, charge ${charge.id}`)
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
