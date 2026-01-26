import { createClient } from "npm:@supabase/supabase-js@2"

const URL = Deno.env.get('SUPABASE_URL')!
const KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(URL, KEY)

Deno.serve(async (req) => {
  try {
    // 1. Calculate threshold (24 hours ago)
    const threshold = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // 2. Fetch Expired Bookings
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*, property:properties(title, host_id), user:profiles(email)')
      .eq('status', 'pending')
      .lt('created_at', threshold);

    if (error) throw error;
    if (!bookings || bookings.length === 0) {
      return new Response(JSON.stringify({ message: "No expired bookings found." }), { status: 200 });
    }

    console.log(`Found ${bookings.length} expired bookings.`);

    const results = [];

    // 3. Loop and Cancel
    for (const booking of bookings) {
      // A. Update Status
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ status: 'cancelled', rejection_reason: 'expired' })
        .eq('id', booking.id);

      if (updateError) {
        console.error(`Failed to cancel booking ${booking.id}`, updateError);
        results.push({ id: booking.id, status: 'failed', error: updateError });
        continue;
      }

      // B. Notify Guest
      if (booking.user_id) {
         await supabase.functions.invoke('send-email', {
             body: {
                 type: 'booking_expired_guest',
                 userId: booking.user_id,
                 data: {
                     itemTitle: booking.property?.title || 'Property',
                     link: 'https://alanya-holidays.com/properties' // Hardcoded for now or env var
                 }
             }
         });
      }

      // C. Notify Host
      if (booking.property?.host_id) {
          await supabase.functions.invoke('send-email', {
             body: {
                 type: 'booking_expired_host',
                 userId: booking.property.host_id,
                 data: {
                     itemTitle: booking.property.title,
                     guestName: 'Guest' // Could fetch name if needed
                 }
             }
         });
      }

      results.push({ id: booking.id, status: 'cancelled' });
    }

    return new Response(JSON.stringify({ processed: results }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
})
