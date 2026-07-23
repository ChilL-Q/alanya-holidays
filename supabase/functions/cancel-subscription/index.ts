// @ts-ignore: npm: specifiers are resolved by Deno, not tsc
import Stripe from "npm:stripe@17"
// @ts-ignore: npm: specifiers are resolved by Deno, not tsc
import { createClient } from "npm:@supabase/supabase-js@2"

// @ts-ignore: jsr: specifiers are resolved by Deno, not tsc
import "jsr:@supabase/functions-js@^2/edge-runtime.d.ts"
import { getCorsHeaders } from "../_shared/cors.ts"

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const _SITE_URL = Deno.env.get('SITE_URL') || 'https://alanyaholidays.com'

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: (Deno.env.get('STRIPE_API_VERSION') ?? '2025-01-27.acacia') as any,
})

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req)

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

    // --- Get Subscription ID ---
    const { data: subRecord, error: fetchError } = await supabaseAdmin
      .from('premium_subscriptions')
      .select('id, stripe_subscription_id, status')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing'])
      .maybeSingle()

    if (fetchError) {
      return new Response(JSON.stringify({ error: 'Database error' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!subRecord) {
      return new Response(JSON.stringify({ error: 'No active subscription found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // --- Cancel Subscription in Stripe ---
    // Mark to cancel at end of period (preserve access until period ends)
    await stripe.subscriptions.update(subRecord.stripe_subscription_id, {
      cancel_at_period_end: true
    })

    // --- Update Database ---
    const { error: updateError } = await supabaseAdmin
      .from('premium_subscriptions')
      .update({ cancel_at_period_end: true })
      .eq('id', subRecord.id)

    if (updateError) {
      return new Response(JSON.stringify({ error: 'Failed to update subscription status in database' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Cancel Subscription Error:', error)
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})