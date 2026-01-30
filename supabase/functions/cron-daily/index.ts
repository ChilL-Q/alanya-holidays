
import { createClient } from "npm:@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

Deno.serve(async (req) => {
  try {
    const today = new Date()
    
    // 1. Calculate dates
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]

    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    console.log(`Running Cron Daily: CheckIn=${tomorrowStr}, CheckOut=${yesterdayStr}`)

    // 2. Trip Reminders (Check-in Tomorrow)
    const { data: upcomingBookings, error: upcomingError } = await supabase
      .from('bookings')
      .select(`
        *,
        guest:profiles!user_id(full_name, email),
        property:properties(title, address, host_id),
        service:services(title, provider_id)
      `)
      .eq('status', 'confirmed')
      .eq('check_in', tomorrowStr)

    if (upcomingError) throw upcomingError

    console.log(`Found ${upcomingBookings?.length || 0} upcoming bookings`)

    for (const booking of upcomingBookings || []) {
        const itemTitle = booking.property?.title || booking.service?.title || 'Your Booking'
        const address = booking.property?.address || 'See details in app'
        const link = `${req.headers.get('origin') || 'https://alanyaholidays.com'}/account/bookings` // Simplified link

        await supabase.functions.invoke('send-email', {
            body: {
                type: 'trip_reminder',
                to: booking.guest?.email,
                userId: booking.user_id,
                data: {
                    guestName: booking.guest?.full_name || 'Guest',
                    itemTitle,
                    checkIn: booking.check_in,
                    address,
                    link,
                    hostName: 'Host' // Could fetch host profile if needed, keeping simple for now
                }
            }
        })
    }

    // 3. Review Reminders (Check-out Yesterday)
    const { data: pastBookings, error: pastError } = await supabase
      .from('bookings')
      .select(`
        *,
        guest:profiles!user_id(full_name, email),
        property:properties(title),
        service:services(title)
      `)
      .eq('status', 'confirmed')
      .eq('check_out', yesterdayStr)

    if (pastError) throw pastError

    console.log(`Found ${pastBookings?.length || 0} past bookings for review`)

    for (const booking of pastBookings || []) {
        const itemTitle = booking.property?.title || booking.service?.title || 'Your Trip'
        const link = `${req.headers.get('origin') || 'https://alanyaholidays.com'}/property/${booking.property?.id || ''}` // Redirect to property for review

        await supabase.functions.invoke('send-email', {
             body: {
                type: 'review_reminder',
                to: booking.guest?.email,
                userId: booking.user_id,
                data: {
                    guestName: booking.guest?.full_name || 'Guest',
                    itemTitle,
                    link
                }
            }
        })
    }

    return new Response(JSON.stringify({ success: true, processed: (upcomingBookings?.length || 0) + (pastBookings?.length || 0) }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Cron Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
