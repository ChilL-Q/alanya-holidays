// @ts-ignore
import Stripe from 'npm:stripe@17'
// @ts-ignore
import { createClient } from 'npm:@supabase/supabase-js@2'
// @ts-ignore
import { z } from 'npm:zod@3'

declare const Deno: any

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2025-01-27.acacia',
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL'),
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
)

Deno.serve(async (req: Request) => {
  const signature = req.headers.get('stripe-signature')
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
  const body = await req.text()

  let event: Stripe.Event

  try {
    event = await stripe.webhooks.constructEventAsync(body, signature!, webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }

  // ============================================================
  // Premium Subscription Handlers (Task 90)
  // ============================================================

  if (event.type === 'customer.subscription.created') {
    const subscription = event.data.object as Stripe.Subscription
    const customerId = subscription.customer as string
    const metadata = subscription.metadata

    const metadataSchema = z.object({ userId: z.string().uuid(), plan: z.enum(['monthly', 'annual']) })
    const metadataResult = metadataSchema.safeParse(metadata)
    if (!metadataResult.success) {
      console.warn('subscription.created: Invalid or missing metadata', metadataResult.error.issues)
      return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } })
    }
    const { userId: metaUserId, plan: metaPlan } = metadataResult.data

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
    const { error: insertError } = await supabase
      .from('premium_subscriptions')
      .insert({
        user_id: metaUserId,
        plan: metaPlan,
        status: status,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: customerId,
        current_period_end: currentPeriodEnd,
        cancel_at_period_end: subscription.cancel_at_period_end,
      })

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
      try {
        await supabase.functions.invoke('send-email', {
          body: {
            to: userProfile.email,
            type: 'booking_rejected', // L1: closest available template for subscription ended notification
            data: {
              itemTitle: 'Premium Subscription',
              reason: 'Your subscription period has ended.',
              searchLink: `${Deno.env.get('SITE_URL') ?? 'https://alanyaholidays.com'}/profile`,
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
      try {
        await supabase.functions.invoke('send-email', {
          body: {
            to: userProfile.email,
            type: 'booking_rejected', // Reusing template for payment issue (no specific template exists)
            data: {
              itemTitle: 'Premium Subscription',
              reason: 'Payment failed. Please update your card details.',
              searchLink: `${Deno.env.get('SITE_URL') ?? 'https://alanyaholidays.com'}/profile`,
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
  // Existing Booking / Blog Subscription Handlers
  // ============================================================

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    const paymentIntentId = typeof session.payment_intent === 'string'
      ? session.payment_intent
      : (session.payment_intent as any)?.id ?? null

    // Idempotency: skip if already processed (payment_status already 'paid')
    const bookingIds = session.metadata?.bookingIds?.split(',').filter(Boolean) ?? []
    if (bookingIds.length > 0) {
      // H1: .single() throws on 0 rows — use .maybeSingle() for proper null handling
      const { data: existing } = await supabase
        .from('bookings')
        .select('id, payment_status')
        .eq('stripe_session_id', session.id)
        .limit(1)
        .maybeSingle()

      if (existing?.payment_status === 'paid') {
        console.warn(`Skipping duplicate webhook for session ${session.id}`)
        return new Response(JSON.stringify({ received: true }), {
          headers: { 'Content-Type': 'application/json' },
        })
      }
    }

    if (session.payment_status === 'paid') {
      // --- Handle blog submission payment ---
      if (session.metadata?.type === 'blog_submission') {
        const submissionId = session.metadata.submissionId
        if (submissionId) {
          // M1: verify amount_total is $5 (500 cents) — protects against our own billing bugs
          if (session.amount_total !== 500) {
            console.error(`Blog submission amount mismatch: expected 500, got ${session.amount_total}`)
            return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } })
          }

          const { data: submission, error: subError } = await supabase
            .from('blog_submissions')
            .select('id, user_id, title, status, payment_status')
            .eq('id', submissionId)
            .maybeSingle()

          if (subError) {
            console.error('Blog submission lookup error:', subError)
          } else if (submission) {
            // A2-C4: Use UPDATE with WHERE to detect if this is the first successful run
            // Guard: also check status='pending_payment' to avoid triggering the H4 state machine
            // if the submission was rejected by an admin before payment arrived (rejected → pending_review
            // is blocked by the trigger, causing a DB exception and an infinite Stripe retry loop).
            const { data: updatedSub, error: updateError } = await supabase
              .from('blog_submissions')
              .update({
                payment_status: 'paid',
                status: 'pending_review',
              })
              .eq('id', submissionId)
              .eq('payment_status', 'unpaid')
              .eq('status', 'pending_payment')
              .select('id')

            if (updateError) {
              console.error('Failed to confirm blog submission payment:', updateError)
              return new Response('DB update failed', { status: 500 })
            }

            // If updatedSub.length > 0, it's the first time.
            // If 0, it's a retry (or already paid), but we proceed to notifications anyway
            // to ensure they are sent if the previous run failed mid-way.
            if (updatedSub && updatedSub.length > 0) {
              console.warn(`Confirmed blog submission payment: ${submissionId}`)
            } else {
              console.warn(`Webhook retry or already paid for blog submission: ${submissionId}`)
            }

            // Notify all admins about new submission awaiting review
            const { data: admins } = await supabase
              .from('profiles')
              .select('id')
              .eq('role', 'admin')

            if (admins && admins.length > 0) {
              await supabase.from('notifications').insert(
                admins.map((admin: { id: string }) => ({
                  user_id: admin.id,
                  title: 'New Blog Submission',
                  message: `A new blog submission "${submission.title}" is ready for review.`,
                  type: 'info',
                  link: `/admin/blog-submissions/${submissionId}`,
                }))
              )
            }

            // Send email to author: submission received, awaiting moderation
            const { data: authorProfile } = await supabase
              .from('profiles')
              .select('email, full_name')
              .eq('id', submission.user_id)
              .maybeSingle()

            const authorEmail = authorProfile?.email
            if (authorEmail) {
              const siteUrl = Deno.env.get('SITE_URL') ?? 'https://alanyaholidays.com'
              // M4: fire-and-forget + M5: audit_logs on failure
              supabase.functions.invoke('send-email', {
                body: {
                  to: authorEmail,
                  type: 'blog_submission_received',
                  data: {
                    postTitle: submission.title,
                    link: `${siteUrl}/blog`,
                  },
                },
              }).then(() => {
                console.warn(`Sent received email to ${authorEmail}`)
              }).catch((e: unknown) => {
                const msg = e instanceof Error ? e.message : String(e)
                console.error(`Failed to send blog submission received email:`, msg)
                supabase.from('audit_logs').insert({
                  event_type: 'EMAIL_DELIVERY_FAILED',
                  details: { email_type: 'blog_submission_received', submission_id: submissionId, error: msg },
                }).then(() => {}).catch(() => {})
              })
            }
          } else {
            console.warn(`Blog submission not found in DB: ${submissionId}`)
          }
        }
      }

      // --- Handle booking payments (existing logic) ---
      else if (bookingIds.length > 0) {
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
          return new Response('Ownership check failed', { status: 500 })
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
          return new Response('DB update failed', { status: 500 })
        }

        if (!updatedRows || updatedRows.length === 0) {
          console.error(`No rows updated for bookings: ${bookingIds.join(', ')} — state machine may have rejected transition`)
          return new Response('DB update failed: no rows updated', { status: 500 })
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
    }
  }

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
      return new Response('DB lookup failed', { status: 500 })
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
      return new Response('DB update failed', { status: 500 })
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
      return new Response('DB lookup failed', { status: 500 })
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
      return new Response('DB update failed', { status: 500 })
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
