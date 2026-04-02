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

    if (session.payment_status === 'paid') {
      const bookingIds = session.metadata?.bookingIds?.split(',').filter(Boolean) ?? []

      if (bookingIds.length > 0) {
        const { error } = await supabase
          .from('bookings')
          .update({
            status: 'confirmed',
            payment_status: 'paid',
          })
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
              let lastError: any

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
                  console.log(`Email sent successfully for booking ${booking.id}`)
                  break
                } catch (e: any) {
                  lastError = e
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

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
