// @ts-ignore
import Stripe from "npm:stripe@17"
// @ts-ignore
import { createClient } from "npm:@supabase/supabase-js@2"
// @ts-ignore
import { z } from "npm:zod@3"

declare const Deno: any;

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')
const STRIPE_PREMIUM_MONTHLY_PRICE_ID = Deno.env.get('STRIPE_PREMIUM_MONTHLY_PRICE_ID')
const STRIPE_PREMIUM_ANNUAL_PRICE_ID = Deno.env.get('STRIPE_PREMIUM_ANNUAL_PRICE_ID')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const SITE_URL = Deno.env.get('SITE_URL') || 'https://alanyaholidays.com'

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2025-01-27.acacia'
})

const corsHeaders = {
  'Access-Control-Allow-Origin': SITE_URL,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const planSchema = z.enum(['monthly', 'annual'])

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
    const validationResult = planSchema.safeParse(body.plan)
    if (!validationResult.success) {
      return new Response(JSON.stringify({ error: 'Invalid plan. Must be "monthly" or "annual"' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    const plan = validationResult.data

    // --- Check if already subscribed ---
    // Check status in DB directly (no RLS for admin client)
    const { data: existingSub } = await supabaseAdmin
      .from('premium_subscriptions')
      .select('id, status')
      .eq('user_id', userId)
      .maybeSingle()

    if (existingSub && existingSub.status === 'active') {
      return new Response(JSON.stringify({ error: 'User already has an active subscription' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // --- Select Price ID ---
    const priceId = plan === 'monthly' ? STRIPE_PREMIUM_MONTHLY_PRICE_ID : STRIPE_PREMIUM_ANNUAL_PRICE_ID
    if (!priceId) {
      return new Response(JSON.stringify({ error: 'Stripe Price ID not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // --- Get or Create Stripe Customer ---
    let customerId: string | null = null

    if (existingSub?.id) {
      // If user has a previous record (even cancelled), reuse customer ID
      // We stored customer_id there.
    }

    // For simplicity, we always create a new Customer for the checkout.
    // Stripe Customer Portal will allow them to manage existing cards.
    // However, to reuse, we should have stored stripe_customer_id.
    // Let's try to find existing customer from previous attempts
    if (existingSub) {
      const { data: subDetails } = await supabaseAdmin
        .from('premium_subscriptions')
        .select('stripe_customer_id')
        .eq('user_id', userId)
        .not('stripe_customer_id', 'is', null)
        .limit(1)
        .maybeSingle()

      if (subDetails) {
        customerId = subDetails.stripe_customer_id
      }
    }

    // --- Create Checkout Session ---
    const sessionParams: any = {
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: {
        userId: userId,
        plan: plan
      },
      // CRITICAL: subscription_data.metadata is what appears on the Subscription object.
      // The top-level metadata is only on the CheckoutSession — not copied to Subscription.
      // stripe-webhook reads subscription.metadata.userId and subscription.metadata.plan.
      subscription_data: {
        metadata: {
          userId: userId,
          plan: plan,
        }
      },
      success_url: `${SITE_URL}/profile?subscription=success`,
      cancel_url: `${SITE_URL}/profile?subscription=cancelled`,
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