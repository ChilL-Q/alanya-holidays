// @ts-ignore
import Stripe from "npm:stripe@17"
// @ts-ignore
import { createClient } from "npm:@supabase/supabase-js@2"
// @ts-ignore
import { z } from "npm:zod@3"

declare const Deno: any;

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const SITE_URL = Deno.env.get('SITE_URL') || 'https://alanyaholidays.com'

// Tier-specific price IDs take precedence; generic IDs are the fallback
const PRICE_IDS: Record<string, Record<string, string | undefined>> = {
  voyager: {
    monthly: Deno.env.get('STRIPE_VOYAGER_MONTHLY_PRICE_ID') || Deno.env.get('STRIPE_PREMIUM_MONTHLY_PRICE_ID'),
    annual: Deno.env.get('STRIPE_VOYAGER_ANNUAL_PRICE_ID') || Deno.env.get('STRIPE_PREMIUM_ANNUAL_PRICE_ID'),
  },
  signature: {
    monthly: Deno.env.get('STRIPE_SIGNATURE_MONTHLY_PRICE_ID') || Deno.env.get('STRIPE_PREMIUM_MONTHLY_PRICE_ID'),
    annual: Deno.env.get('STRIPE_SIGNATURE_ANNUAL_PRICE_ID') || Deno.env.get('STRIPE_PREMIUM_ANNUAL_PRICE_ID'),
  },
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: (Deno.env.get('STRIPE_API_VERSION') ?? '2025-01-27.acacia') as Stripe.StripeConstructorOptions['apiVersion'],
})

const corsHeaders = {
  'Access-Control-Allow-Origin': SITE_URL,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const bodySchema = z.object({
  plan: z.enum(['monthly', 'annual']),
  // tier is optional — omitting it uses generic STRIPE_PREMIUM_* price IDs (AI Planner flow)
  tier: z.enum(['voyager', 'signature']).optional(),
})

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // --- Authentication ---
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    const token = authHeader.replace(/^Bearer\s+/i, '')

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const userId = user.id
    const body = await req.json()
    const validationResult = bodySchema.safeParse(body)
    if (!validationResult.success) {
      return new Response(JSON.stringify({ error: 'Invalid request. Must provide plan ("monthly"|"annual") and tier ("voyager"|"signature")' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    const { plan, tier } = validationResult.data

    // --- Check if already subscribed ---
    const { data: existingSub } = await supabaseAdmin
      .from('premium_subscriptions')
      .select('id, status, stripe_customer_id')
      .eq('user_id', userId)
      .maybeSingle()

    if (existingSub && (existingSub.status === 'active' || existingSub.status === 'trialing')) {
      return new Response(JSON.stringify({ error: 'User already has an active subscription' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // --- Select Price ID ---
    const STRIPE_PREMIUM_MONTHLY_PRICE_ID = Deno.env.get('STRIPE_PREMIUM_MONTHLY_PRICE_ID')
    const STRIPE_PREMIUM_ANNUAL_PRICE_ID = Deno.env.get('STRIPE_PREMIUM_ANNUAL_PRICE_ID')
    const genericPriceId = plan === 'monthly' ? STRIPE_PREMIUM_MONTHLY_PRICE_ID : STRIPE_PREMIUM_ANNUAL_PRICE_ID
    const priceId = tier ? (PRICE_IDS[tier]?.[plan] ?? genericPriceId) : genericPriceId
    if (!priceId) {
      return new Response(JSON.stringify({ error: `Stripe Price ID not configured for ${tier ?? 'generic'}/${plan}` }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // --- Reuse Stripe Customer if exists (from previous cancelled subscription) ---
    const customerId: string | null = existingSub?.stripe_customer_id ?? null

    // --- Create Checkout Session ---
    const sessionParams: any = {
      mode: 'subscription',
      payment_method_types: ['card', 'sepa_debit'],
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: {
        userId: userId,
        plan: plan,
        tier: tier,
      },
      // CRITICAL: subscription_data.metadata is what appears on the Subscription object.
      // The top-level metadata is only on the CheckoutSession — not copied to Subscription.
      // stripe-webhook reads subscription.metadata.userId, plan, and tier.
      subscription_data: {
        metadata: {
          userId: userId,
          plan: plan,
          tier: tier,
        }
      },
      success_url: `${SITE_URL}/add-listing?subscribed=true`,
      cancel_url: `${SITE_URL}/list-business`,
      allow_promotion_codes: true,
    }

    if (customerId) {
      sessionParams.customer = customerId
    } else {
      sessionParams.customer_email = user.email
    }

    const session = await stripe.checkout.sessions.create(sessionParams)

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Create Subscription Checkout Error:', error)
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
