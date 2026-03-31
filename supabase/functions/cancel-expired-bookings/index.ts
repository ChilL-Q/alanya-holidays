// @ts-ignore
import { createClient } from 'npm:@supabase/supabase-js@2'

declare const Deno: any

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
// Set this secret in Supabase Dashboard → Edge Functions → Secrets
const SITE_URL = Deno.env.get('SITE_URL') || 'https://alanyaholidays.com'

const EXPIRY_HOURS = 24

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // 1. Найти все просроченные pending бронирования с данными гостя и хоста
    const { data: expiredBookings, error: fetchError } = await supabase
      .from('bookings')
      .select(`
        id,
        type,
        check_in,
        check_out,
        guest:profiles!bookings_user_id_fkey (email, full_name),
        property:properties (title, host:profiles!properties_host_id_fkey (email)),
        service:services (title, host:profiles!services_provider_id_fkey (email))
      `)
      .eq('status', 'pending')
      .lt('created_at', new Date(Date.now() - EXPIRY_HOURS * 60 * 60 * 1000).toISOString())

    if (fetchError) throw fetchError
    if (!expiredBookings || expiredBookings.length === 0) {
      return new Response(
        JSON.stringify({ cancelled: 0, message: 'No expired bookings found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Отменить все найденные бронирования одним запросом
    const ids = expiredBookings.map((b: any) => b.id)
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .in('id', ids)

    if (updateError) throw updateError

    // 3. Отправить email гостю и хосту по каждому бронированию
    const emailPromises = expiredBookings.map(async (booking: any) => {
      const guestEmail = booking.guest?.email
      const guestName  = booking.guest?.full_name || 'Guest'
      const itemTitle  = booking.property?.title || booking.service?.title || 'Your booking'
      const hostEmail  = booking.property?.host?.email || booking.service?.host?.email
      const profileLink = `${SITE_URL}/profile`

      const promises = []

      // Email гостю
      if (guestEmail) {
        promises.push(
          supabase.functions.invoke('send-email', {
            body: {
              to:   guestEmail,
              type: 'booking_expired_guest',
              data: { itemTitle, link: profileLink },
            },
          })
        )
      }

      // Email хосту
      if (hostEmail) {
        promises.push(
          supabase.functions.invoke('send-email', {
            body: {
              to:   hostEmail,
              type: 'booking_expired_host',
              data: {
                itemTitle,
                guestName,
                checkIn:  booking.check_in,
                checkOut: booking.check_out,
                link:     profileLink,
              },
            },
          })
        )
      }

      await Promise.allSettled(promises)
    })

    await Promise.allSettled(emailPromises)

    console.warn(`Cancelled ${expiredBookings.length} expired bookings`)

    return new Response(
      JSON.stringify({ cancelled: expiredBookings.length, ids }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('cancel-expired-bookings error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
