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
