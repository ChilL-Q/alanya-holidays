// @ts-ignore
import Stripe from 'npm:stripe@17'
// @ts-ignore
import { createClient } from 'npm:@supabase/supabase-js@2'

declare const Deno: any

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2025-01-27.acacia',
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL'),
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PAYMENT_WINDOW_MINUTES = 15

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      console.error('User verification failed:', userError)
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { items, email, origin } = await req.json()

    if (!items?.length || !origin) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const verifiedUserId = user.id

    // Stripe Checkout Session (min expires_at = 30 min)
    const expiresAt = Math.floor(Date.now() / 1000) + 30 * 60

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: email,
      expires_at: expiresAt,
      line_items: items.map((item: any) => ({
        price_data: {
          currency: 'eur',
          product_data: {
            name: item.title,
            ...(item.image ? { images: [item.image] } : {}),
          },
          unit_amount: Math.round(item.price * 100), // cents
        },
        quantity: 1,
      })),
      success_url: `${origin}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout`,
      metadata: {
        userId: verifiedUserId,
        bookingIds: items.map((i: any) => i.bookingId).join(','),
      },
    })

    // Сохраняем stripe_session_id и payment_expires_at во все брони этого чекаута
    const paymentExpiresAt = new Date(Date.now() + PAYMENT_WINDOW_MINUTES * 60 * 1000).toISOString()
    const bookingIds = items.map((i: any) => i.bookingId).filter(Boolean)

    if (bookingIds.length > 0) {
      // Security: Verify that these bookings belong to the verified user
      const { data: verifiedBookings, error: verifyError } = await supabase
        .from('bookings')
        .select('id')
        .eq('user_id', verifiedUserId)
        .in('id', bookingIds)

      if (verifyError) {
        console.error('Bookings verification error:', verifyError)
        return new Response(
          JSON.stringify({ error: 'Failed to verify bookings' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const verifiedIds = verifiedBookings?.map(b => b.id) || []
      
      if (verifiedIds.length === 0) {
        return new Response(
          JSON.stringify({ error: 'No valid bookings found for this user' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      await supabase
        .from('bookings')
        .update({
          stripe_session_id: session.id,
          payment_expires_at: paymentExpiresAt,
        })
        .in('id', verifiedIds)
    }

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('create-checkout-session error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
