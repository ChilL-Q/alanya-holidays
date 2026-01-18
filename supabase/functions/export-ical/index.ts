import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Allow GET requests for iCal feed usually (url param)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get ID from URL query params
    const url = new URL(req.url)
    const propertyId = url.searchParams.get('id')

    if (!propertyId) {
      throw new Error('Property ID is required')
    }

    // 1. Fetch Property Details
    const { data: property, error: propError } = await supabaseClient
      .from('properties')
      .select('title')
      .eq('id', propertyId)
      .single()

    if (propError || !property) throw new Error('Property not found')

    // 2. Fetch Confirmed Bookings
    const { data: bookings } = await supabaseClient
        .from('bookings')
        .select('check_in, check_out')
        .eq('item_id', propertyId)
        .eq('status', 'confirmed')

    // 3. Fetch Manual Blocks (property_availability)
    // We only care about blocked dates that are 'manual' or 'reservation' (internal)
    // 'ical' source is imported from others, we probably shouldn't re-export them back to them? 
    // Actually, Airbnb says "don't export what you imported from us".
    // So filter out source='ical'.
    const { data: blocks } = await supabaseClient
        .from('property_availability')
        .select('date')
        .eq('property_id', propertyId)
        .eq('status', 'blocked')
        .neq('source', 'ical')

    // 4. Construct iCal String
    let icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Alanya Holidays//Host Calendar 1.0//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        `X-WR-CALNAME:${property.title} - Alanya Holidays`,
    ]

    // Helper to format date for iCal (YYYYMMDD)
    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        return dateStr.split('T')[0].replace(/-/g, '');
    };

    // Add Bookings
    if (bookings) {
        bookings.forEach((b: any) => {
            if (!b.check_in || !b.check_out) return;
            const start = formatDate(b.check_in);
            const end = formatDate(b.check_out);
            
            icsContent.push('BEGIN:VEVENT')
            icsContent.push(`DTSTART;VALUE=DATE:${start}`)
            icsContent.push(`DTEND;VALUE=DATE:${end}`)
            icsContent.push(`SUMMARY:Reserved`)
            icsContent.push(`DESCRIPTION:Booking on Alanya Holidays`)
            icsContent.push(`UID:booking-${start}-${end}@alanyaholidays.com`)
            icsContent.push('END:VEVENT')
        })
    }

    // Add Manual Blocks
    if (blocks) {
        blocks.forEach((blk: any) => {
            const dateStr = blk.date;
            const start = formatDate(dateStr);
            
            // Calculate next day for DTEND
            const dateObj = new Date(dateStr);
            dateObj.setDate(dateObj.getDate() + 1);
            const nextDay = dateObj.toISOString().split('T')[0].replace(/-/g, '');

            icsContent.push('BEGIN:VEVENT')
            icsContent.push(`DTSTART;VALUE=DATE:${start}`)
            icsContent.push(`DTEND;VALUE=DATE:${nextDay}`)
            icsContent.push(`SUMMARY:Blocked`)
            icsContent.push(`UID:block-${start}@alanyaholidays.com`)
            icsContent.push('END:VEVENT')
        })
    }

    icsContent.push('END:VCALENDAR')


    return new Response(
      icsContent.join('\r\n'),
      {
        headers: {
            ...corsHeaders,
            'Content-Type': 'text/calendar; charset=utf-8',
            'Content-Disposition': `attachment; filename="calendar-${propertyId}.ics"`
        },
        status: 200,
      }
    )

  } catch (error) {
    console.error(error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
