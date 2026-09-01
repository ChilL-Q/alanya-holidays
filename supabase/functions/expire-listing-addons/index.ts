// @ts-ignore: npm: specifiers are resolved by Deno, not tsc
import { createClient } from 'npm:@supabase/supabase-js@2'
// @ts-ignore: jsr: specifiers are resolved by Deno, not tsc
import "jsr:@supabase/functions-js@^2/edge-runtime.d.ts"
import { getCorsHeaders } from "../_shared/cors.ts"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req)

  const json = (payload: unknown, status = 200) =>
    new Response(JSON.stringify(payload), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const cronSecret = Deno.env.get('CRON_SECRET')
  const reqSecret = req.headers.get('x-cron-secret')
  if (!cronSecret || reqSecret !== cronSecret) {
    return json({ error: 'Unauthorized' }, 401)
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const now = new Date().toISOString()

    // Find active add-ons whose window has lapsed. Only time-boxed add-ons
    // (currently seasonal_placement) set expires_at; verified_badge etc. leave
    // it null and are therefore never picked up here.
    const { data: lapsed, error: fetchError } = await supabase
      .from('listing_addons')
      .select('id, listing_id, addon_type, metadata')
      .eq('status', 'active')
      .not('expires_at', 'is', null)
      .lt('expires_at', now)

    if (fetchError) throw fetchError
    if (!lapsed || lapsed.length === 0) {
      return json({ expired: 0, message: 'No lapsed add-ons found' })
    }

    // Flip the add-on rows to expired.
    const ids = lapsed.map((a: { id: string }) => a.id)
    const { error: updateError } = await supabase
      .from('listing_addons')
      .update({ status: 'expired', updated_at: now })
      .in('id', ids)

    if (updateError) throw updateError

    // Reverse the listing-level effect of each expiring add-on (mirror of the
    // stripe-webhook activation branch). seasonal_placement sets is_featured —
    // but only clear it if the add-on is what turned it on (was_featured_before
    // === false), so we never un-feature an admin/seed-featured listing.
    type LapsedAddon = { listing_id: string; addon_type: string; metadata: { was_featured_before?: boolean } | null }
    const unfeatureListingIds = [
      ...new Set(
        (lapsed as LapsedAddon[])
          .filter((a) => a.addon_type === 'seasonal_placement' && a.metadata?.was_featured_before !== true)
          .map((a) => a.listing_id),
      ),
    ]

    if (unfeatureListingIds.length > 0) {
      const { error: patchError } = await supabase
        .from('directory_listings')
        .update({ is_featured: false })
        .in('id', unfeatureListingIds)
      if (patchError) console.error('Failed to clear is_featured on expired placements:', patchError)
    }

    console.warn(`Expired ${ids.length} listing add-ons`, { ids, unfeatureListingIds })
    return json({ expired: ids.length, ids, unfeatured: unfeatureListingIds })
  } catch (error) {
    console.error('expire-listing-addons error:', error)
    return json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, 500)
  }
})
