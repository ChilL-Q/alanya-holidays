import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"
import ICAL from "https://esm.sh/ical.js@1.5.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Auth context of the logged in user.
    // This allows us to use RLS policies instead of bypassing them with a Service Role Key.
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { propertyId } = await req.json()

    if (!propertyId) {
      throw new Error('Property ID is required')
    }

    console.log(`Syncing iCal feeds for property: ${propertyId}`)

    // 1. Get All iCal Feeds for this property
    const { data: feeds, error: feedsError } = await supabaseClient
      .from('property_ical_feeds')
      .select('id, name, url')
      .eq('property_id', propertyId)

    if (feedsError) throw feedsError

    // 2. Prepare all events from ALL feeds
    const allEvents = [];
    const errors = [];

    if (feeds && feeds.length > 0) {
        for (const feed of feeds) {
            try {
                console.log(`Processing feed: ${feed.name} (${feed.url})`)
                
                const icalResponse = await fetch(feed.url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                    }
                })

                if (!icalResponse.ok) {
                    throw new Error(`Failed to fetch ${feed.name}: ${icalResponse.statusText}`)
                }

                const icalData = await icalResponse.text()
                try {
                    const jcalData = ICAL.parse(icalData);
                    const vcalendar = new ICAL.Component(jcalData);
                    const vevents = vcalendar.getAllSubcomponents('vevent');

                    for (const event of vevents) {
                        const dtstart = event.getFirstPropertyValue('dtstart');
                        const dtend = event.getFirstPropertyValue('dtend');
                        const uid = event.getFirstPropertyValue('uid');

                        if (!dtstart || !dtend) continue;

                        // Helper to format date as YYYY-MM-DD from ICAL.Time
                        const formatDate = (time: any) => {
                            const y = time.year;
                            const m = String(time.month).padStart(2, '0');
                            const d = String(time.day).padStart(2, '0');
                            return `${y}-${m}-${d}`;
                        };

                        const startStr = formatDate(dtstart);
                        const endStr = formatDate(dtend); // Exclusive end date

                        let currentDate = new Date(startStr);
                        const endDateObj = new Date(endStr);

                        // Safety check
                        if (endDateObj <= currentDate) continue;
                        
                        // Limit loop to avoid hanging on bad data (e.g. 100 year booking)
                        let daysCount = 0;
                        while (currentDate < endDateObj && daysCount < 365) {
                            allEvents.push({
                                property_id: propertyId,
                                date: currentDate.toISOString().split('T')[0],
                                status: 'blocked',
                                source: 'ical',
                                feed_id: feed.id, 
                                external_id: uid,
                            })
                            currentDate.setDate(currentDate.getDate() + 1);
                            daysCount++;
                        }
                    }

                    // Update last synced time for feed
                    await supabaseClient
                        .from('property_ical_feeds')
                        .update({ last_synced_at: new Date().toISOString() })
                        .eq('id', feed.id)

                } catch (parseError) {
                   console.error(`Parse error for ${feed.name}:`, parseError);
                   errors.push(`${feed.name}: Invalid iCal format`);
                }

            } catch (err) {
                console.error(`Error syncing feed ${feed.name}:`, err)
                errors.push(`${feed.name}: ${err.message}`)
            }
        }
    }

    // 3. ATOMIC UPDATE: Delete ALL 'ical' source events for this property and insert new ones
    // This ensures no "orphan" null-feed_id rows remain and handles conflicts nicely.
    
    // A. Delete all existing iCal blocks
    await supabaseClient
        .from('property_availability')
        .delete()
        .eq('property_id', propertyId)
        .eq('source', 'ical');

    // B. Deduplicate and Insert new blocks
    let insertedCount = 0;
    if (allEvents.length > 0) {
        // Simple dedupe: blocked is blocked. First feed wins ownership if conflict.
        const uniqueEventsMap = new Map();
        for (const e of allEvents) {
            if (!uniqueEventsMap.has(e.date)) {
                uniqueEventsMap.set(e.date, e);
            }
        }
        const uniqueEvents = Array.from(uniqueEventsMap.values());

        const { error: insertError } = await supabaseClient
            .from('property_availability')
            .insert(uniqueEvents); // No upsert needed since we deleted everything
        
        if (insertError) {
             console.error('Bulk insert error:', insertError)
             throw insertError;
        }
        insertedCount = uniqueEvents.length;
    }

    // 4. Update Property Global Sync Status
    await supabaseClient
        .from('properties')
        .update({ last_synced_at: new Date().toISOString() })
        .eq('id', propertyId)

    return new Response(
      JSON.stringify({ 
          success: true, 
          count: insertedCount, 
          errors: errors.length > 0 ? errors : undefined,
          debug_kept_events: insertedCount
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
