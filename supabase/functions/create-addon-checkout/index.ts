// @ts-ignore: npm: specifiers are resolved by Deno, not tsc
import Stripe from "npm:stripe@17"
// @ts-ignore: npm: specifiers are resolved by Deno, not tsc
import { createClient } from "npm:@supabase/supabase-js@2"
// @ts-ignore: npm: specifiers are resolved by Deno, not tsc
import { z } from "npm:zod@3"

// @ts-ignore: jsr: specifiers are resolved by Deno, not tsc
import "jsr:@supabase/functions-js@^2/edge-runtime.d.ts"
import { getCorsHeaders } from "../_shared/cors.ts"

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const SITE_URL = Deno.env.get('SITE_URL') || 'https://alanyaholidays.com'

// One Stripe Price ID per purchasable add-on. Configure these as Supabase secrets.
// instant_booking is intentionally excluded — its booking-logic track is deferred.
const ADDON_PRICE_IDS: Record<string, string | undefined> = {
  verified_badge: Deno.env.get('STRIPE_ADDON_VERIFIED_BADGE_PRICE_ID'),
  seasonal_placement: Deno.env.get('STRIPE_ADDON_SEASONAL_PLACEMENT_PRICE_ID'),
  sponsored_article: Deno.env.get('STRIPE_ADDON_SPONSORED_ARTICLE_PRICE_ID'),
  ai_localization: Deno.env.get('STRIPE_ADDON_AI_LOCALIZATION_PRICE_ID'),
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: (Deno.env.get('STRIPE_API_VERSION') ?? '2025-01-27.acacia') as any,
})

const bodySchema = z.object({
  listingId: z.string().uuid(),
  addonType: z.enum(['verified_badge', 'seasonal_placement', 'sponsored_article', 'ai_localization']),
})

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req)

  const json = (payload: unknown, status = 200) =>
    new Response(JSON.stringify(payload), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Missing Authorization header' }, 401)
    const token = authHeader.replace(/^Bearer\s+/i, '')

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) return json({ error: 'Unauthorized' }, 401)

    const validation = bodySchema.safeParse(await req.json())
    if (!validation.success) {
      return json({ error: 'Invalid request. Provide listingId (uuid) and a valid addonType.' }, 400)
    }
    const { listingId, addonType } = validation.data

    // Verify the caller owns this listing
    const { data: listing, error: listingError } = await supabaseAdmin
      .from('directory_listings')
      .select('id, name, owner_user_id')
      .eq('id', listingId)
      .maybeSingle()

    if (listingError) return json({ error: 'Listing lookup failed' }, 500)
    if (!listing || listing.owner_user_id !== user.id) {
      return json({ error: 'You do not own this listing' }, 403)
    }

    // Block duplicate active add-on of the same type
    const { data: activeAddon } = await supabaseAdmin
      .from('listing_addons')
      .select('id')
      .eq('listing_id', listingId)
      .eq('addon_type', addonType)
      .eq('status', 'active')
      .maybeSingle()

    if (activeAddon) return json({ error: 'This add-on is already active for the listing' }, 400)

    const priceId = ADDON_PRICE_IDS[addonType]

    const getAddonDetails = (type: string): { name: string; amount: number } => {
      switch (type) {
        case 'verified_badge': return { name: 'Verified Badge', amount: 4900 }
        case 'seasonal_placement': return { name: 'Seasonal Placement (90 days)', amount: 9900 }
        case 'sponsored_article': return { name: 'Sponsored Article', amount: 14900 }
        case 'ai_localization': return { name: 'AI Translation & Localization', amount: 2900 }
        default: return { name: 'Listing Add-on', amount: 4900 }
      }
    }

    const addonDetails = getAddonDetails(addonType)
    const lineItem = priceId
      ? { price: priceId, quantity: 1 }
      : {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Add-on: ${addonDetails.name}`,
              description: `Add-on for listing ${listing.name || listingId}`,
            },
            unit_amount: addonDetails.amount,
          },
          quantity: 1,
        }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [lineItem],
      metadata: {
        type: 'listing_addon',
        userId: user.id,
        listingId,
        addonType,
      },
      customer_email: user.email,
      success_url: `${SITE_URL}/host/upgrades?addon=success`,
      cancel_url: `${SITE_URL}/host/upgrades?addon=cancelled`,
      allow_promotion_codes: true,
    })

    return json({ url: session.url })
  } catch (error) {
    console.error('Create Add-on Checkout Error:', error)
    return json({ error: 'Internal Server Error' }, 500)
  }
})
