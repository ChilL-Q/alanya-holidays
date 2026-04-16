// @ts-ignore
import Stripe from 'npm:stripe@17'
// @ts-ignore
import { createClient } from 'npm:@supabase/supabase-js@2'

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

    if (!metadata?.userId || !metadata?.plan) {
      console.warn('subscription.created: Missing metadata (userId or plan) — skipping premium flow')
      return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } })
    }

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
        user_id: metadata.userId,
        plan: metadata.plan,
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

    console.warn(`Premium subscription created for user ${metadata.userId} — plan: ${metadata.plan}`)

    // In-app notification
    await supabase.from('notifications').insert({
      user_id: metadata.userId,
      title: '🎉 Welcome to Premium!',
      message: 'You now have access to AI Trip Planner and Premium benefits.',
      type: 'success',
      link: '/profile',
    })

    // Email
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', metadata.userId)
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
            type: 'refund_processed', // We can add a specific 'subscription_cancelled' later if needed
            data: {
              amount: '',
              itemTitle: 'Premium Subscription',
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
    const { data: subRecord, error: fetchError } = await supabase
      .from('premium_subscriptions')
      .select('id, user_id, stripe_subscription_id')
      .eq('stripe_customer_id', customerId)
      .eq('status', 'active') // Only update if it was active
      .maybeSingle()

    if (fetchError || !subRecord) {
      console.warn('invoice.payment_failed: No active subscription found for customer')
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
      const { data: existing } = await supabase
        .from('bookings')
        .select('id, payment_status')
        .eq('stripe_session_id', session.id)
        .limit(1)
        .single()

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
          const { data: submission, error: subError } = await supabase
            .from('blog_submissions')
            .select('id, user_id, title, status, payment_status')
            .eq('id', submissionId)
            .maybeSingle()

          if (subError) {
            console.error('Blog submission lookup error:', subError)
          } else if (submission && submission.payment_status !== 'paid') {
            // Idempotency: skip if already paid
            const { error: updateError } = await supabase
              .from('blog_submissions')
              .update({
                payment_status: 'paid',
                status: 'pending_review',
              })
              .eq('id', submissionId)

            if (updateError) {
              console.error('Failed to confirm blog submission payment:', updateError)
              return new Response('DB update failed', { status: 500 })
            }

            console.warn(`Confirmed blog submission payment: ${submissionId}`)

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
              try {
                await supabase.functions.invoke('send-email', {
                  body: {
                    to: authorEmail,
                    type: 'blog_submission_received',
                    data: {
                      postTitle: submission.title,
                      link: `${siteUrl}/blog`,
                    },
                  },
                })
                console.warn(`Sent received email to ${authorEmail}`)
              } catch (e) {
                console.error('Failed to send received email:', e)
              }
            }
          } else {
            console.warn(`Skipping duplicate webhook for submission ${submissionId}`)
          }
        }
      }

      // --- Handle booking payments (existing logic) ---
      else if (bookingIds.length > 0) {
        const updatePayload: Record<string, unknown> = {
          status: 'confirmed',
          payment_status: 'paid',
        }

        if (paymentIntentId) {
          updatePayload.payment_intent_id = paymentIntentId
        }

        const { error } = await supabase
          .from('bookings')
          .update(updatePayload)
          .in('id', bookingIds)

        if (error) {
          console.error('Failed to confirm bookings:', error)
          return new Response('DB update failed', { status: 500 })
        }

        console.warn(`Confirmed bookings: ${bookingIds.join(', ')}`)

        // Fetch all bookings at once to avoid N+1
        const { data: bookings, error: fetchError } = await supabase
          .from('bookings')
          .select(`
            id, check_in, check_out, guests,
            property:properties(title),
            service:services(title),
            profile:profiles!bookings_user_id_fkey(email)
          `)
          .in('id', bookingIds)

        if (fetchError) {
          console.error('Failed to fetch bookings for emails:', fetchError)
        }

        // Отправляем email гостю по каждой брони
        if (bookings && bookings.length > 0) {
          await Promise.all(bookings.map(async (booking: any) => {
            const itemTitle = booking.property?.title ?? booking.service?.title ?? 'Booking'
            const guestEmail = booking.profile?.email

            if (guestEmail) {
              const maxRetries = 3
              for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                  await supabase.functions.invoke('send-email', {
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
                  })
                  break
                } catch (e: any) {
                  if (attempt < maxRetries) {
                    const delayMs = Math.pow(2, attempt) * 1000
                    console.warn(`Email send failed for booking ${booking.id}, attempt ${attempt}/${maxRetries}. Retrying in ${delayMs}ms...`)
                    await new Promise(resolve => setTimeout(resolve, delayMs))
                  } else {
                    console.error(`Email send failed for booking ${booking.id} after ${maxRetries} attempts:`, e)
                  }
                }
              }
            }
          }))
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
        await supabase
          .from('bookings')
          .update({ payment_status: 'failed' })
          .eq('id', booking.id)
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
        } catch (e: any) {
          if (attempt < maxRetries) {
            const delayMs = Math.pow(2, attempt) * 1000
            console.warn(`Refund email send failed for booking ${booking.id}, attempt ${attempt}/${maxRetries}. Retrying in ${delayMs}ms...`)
            await new Promise(resolve => setTimeout(resolve, delayMs))
          } else {
            console.error(`Refund email send failed for booking ${booking.id} after ${maxRetries} attempts:`, e)
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
