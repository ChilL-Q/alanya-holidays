// @ts-ignore
import { createClient } from 'npm:@supabase/supabase-js@2'

declare const Deno: any

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
// Set this secret in Supabase Dashboard → Edge Functions → Secrets
const SITE_URL = Deno.env.get('SITE_URL') || 'https://alanyaholidays.com'
const ALLOWED_ORIGIN = SITE_URL

const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const cronSecret = Deno.env.get('CRON_SECRET');
  const reqSecret = req.headers.get('x-cron-secret');
  if (!cronSecret || reqSecret !== cronSecret) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // 1. Найти все просроченные pending бронирования с данными гостя и хоста
    // Отменяем только те брони у которых явно выставлен payment_expires_at и он уже прошёл
    // Брони без Stripe (наличные, банк) не будут затронуты
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
      .lt('payment_expires_at', new Date().toISOString())
      .not('payment_expires_at', 'is', null)

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

    // 3. Unblock dates in property_availability for all cancelled bookings
    // Uses centralized RPC (DRY principle) — delegates calendar cleanup to the database
    const unblockResults = await Promise.allSettled(
      ids.map((bookingId: string) =>
        supabase.rpc('unblock_dates_for_booking', { p_booking_id: bookingId })
      )
    )

    const unblockErrors = unblockResults
      .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
      .map((r) => r.reason)

    if (unblockErrors.length > 0) {
      console.error('Failed to unblock some dates:', unblockErrors)
    }

    // 4. Отправить email гостю и хосту по каждому бронированию
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

    // --- Auto-reject expired blog submissions ---
    let rejectedSubmissions = 0
    try {
      const { data: expired, error: expiredError } = await supabase
        .from('blog_submissions')
        .update({
          status: 'rejected',
          rejection_reason: 'Payment expired'
        })
        .eq('status', 'pending_payment')
        .lt('payment_expires_at', new Date().toISOString())
        .select('id')

      if (expiredError) {
        console.error('Failed to auto-reject expired blog submissions:', expiredError)
      } else if (expired && expired.length > 0) {
        rejectedSubmissions = expired.length
        console.warn(`Auto-rejected ${rejectedSubmissions} expired blog submissions`)
      }
    } catch (blogError: any) {
      console.error('Blog submission auto-reject error:', blogError.message)
    }

    return new Response(
      JSON.stringify({ cancelled: expiredBookings.length, ids, rejectedBlogSubmissions: rejectedSubmissions }),
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
