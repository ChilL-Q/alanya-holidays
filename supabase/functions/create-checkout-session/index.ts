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

const ALLOWED_ORIGIN = Deno.env.get('SITE_URL') || 'https://alanyaholidays.com'

const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
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

    const token = authHeader.replace(/^Bearer\s+/i, '')
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

    if (!origin.startsWith(ALLOWED_ORIGIN)) {
      return new Response(
        JSON.stringify({ error: 'Invalid origin' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const verifiedUserId = user.id

    // --- Server-side price verification ---
    const propertyIds: string[] = []
    const serviceIds: string[] = []

    for (const item of items as any[]) {
      if (item.type === 'service' || item.listingType === 'service') {
        serviceIds.push(item.listingId)
      } else {
        propertyIds.push(item.listingId)
      }
    }

    const [propertiesResult, servicesResult] = await Promise.all([
      propertyIds.length > 0
        ? supabase.from('properties').select('id, title, price_per_night, images').in('id', propertyIds)
        : Promise.resolve({ data: [] as any[], error: null }),
      serviceIds.length > 0
        ? supabase.from('services').select('id, title, price, images').in('id', serviceIds)
        : Promise.resolve({ data: [] as any[], error: null })
    ])

    if (propertiesResult.error) throw propertiesResult.error
    if (servicesResult.error) throw servicesResult.error

    const propertyMap = new Map((propertiesResult.data || []).map((p: any) => [p.id, p.price_per_night]))
    const serviceMap = new Map((servicesResult.data || []).map((s: any) => [s.id, s.price]))

    const lineItems: any[] = []

    for (const item of items as any[]) {
      let serverPrice: number | null = null

      if (item.type === 'service' || item.listingType === 'service') {
        serverPrice = serviceMap.get(item.listingId) ?? null
      } else {
        serverPrice = propertyMap.get(item.listingId) ?? null
      }

      if (serverPrice === null) {
        throw new Error(`Unable to verify price for item: ${item.title} (ID: ${item.listingId})`)
      }

      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: item.title,
            ...(item.image ? { images: [item.image] } : {}),
          },
          unit_amount: Math.round(serverPrice * 100),
        },
        quantity: 1,
      })
    }

    // Stripe Checkout Session (min expires_at = 30 min)
    const expiresAt = Math.floor(Date.now() / 1000) + 30 * 60

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: email,
      expires_at: expiresAt,
      line_items: lineItems,
      success_url: `${origin}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout`,
      metadata: {
        userId: verifiedUserId,
        bookingIds: items.map((i: any) => i.bookingId).filter(Boolean).join(','),
      },
    })

    // Сохраняем stripe_session_id и payment_expires_at во все брони этого чекаута
    const paymentExpiresAt = new Date(Date.now() + PAYMENT_WINDOW_MINUTES * 60 * 1000).toISOString()
    const bookingIds = items.map((i: any) => i.bookingId).filter(Boolean)

    if (bookingIds.length > 0) {
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
