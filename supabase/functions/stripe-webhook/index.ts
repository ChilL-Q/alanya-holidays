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

        // Отправляем email гостю по каждой брони
        for (const bookingId of bookingIds) {
          const { data: booking } = await supabase
            .from('bookings')
            .select(`
              check_in, check_out, guests,
              property:properties(title),
              service:services(title),
              profile:profiles!bookings_user_id_fkey(email)
            `)
            .eq('id', bookingId)
            .single()

          if (booking) {
            const itemTitle = (booking.property as any)?.title ?? (booking.service as any)?.title ?? 'Booking'
            const guestEmail = (booking.profile as any)?.email

            if (guestEmail) {
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
              }).catch((e: any) => console.error('Email send failed:', e))
            }
          }
        }
      }
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
