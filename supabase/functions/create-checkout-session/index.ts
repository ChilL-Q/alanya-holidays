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

interface CartItem {
  type: string
  listingType?: string
  listingId: string
  title: string
}

interface BlogSubmissionPayload {
  submissionId: string
  title: string
  authorEmail?: string
}

interface SupabaseEmptyResponse {
  data: unknown[]
  error: null
}

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

    const { items, email, origin, mode, blogSubmission } = await req.json()

    if (!origin) {
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

    // --- Blog submission checkout ---
    if (mode === 'blog_submission') {
      const payload = blogSubmission as BlogSubmissionPayload | undefined
      if (!payload?.submissionId) {
        return new Response(
          JSON.stringify({ error: 'submissionId is required for blog_submission mode' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Verify ownership
      const { data: submission, error: subError } = await supabase
        .from('blog_submissions')
        .select('id, title, user_id, status')
        .eq('id', payload.submissionId)
        .single()

      if (subError || !submission) {
        return new Response(
          JSON.stringify({ error: 'Submission not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (submission.user_id !== verifiedUserId) {
        return new Response(
          JSON.stringify({ error: 'Not authorized' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (submission.status !== 'pending_payment') {
        return new Response(
          JSON.stringify({ error: 'Submission is not in pending_payment status' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const expiresAt = Math.floor(Date.now() / 1000) + 30 * 60
      const paymentExpiresAt = new Date(Date.now() + PAYMENT_WINDOW_MINUTES * 60 * 1000).toISOString()

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer_email: email,
        expires_at: expiresAt,
        line_items: [{
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Blog Post Submission Fee',
              description: `Publication fee for: ${submission.title}`,
            },
            unit_amount: 500, // $5.00
          },
          quantity: 1,
        }],
        success_url: `${origin}/blog/submission-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/blog/submit`,
        metadata: {
          userId: verifiedUserId,
          type: 'blog_submission',
          submissionId: payload.submissionId,
        },
      })

      try {
        const { error: updateError } = await supabase
          .from('blog_submissions')
          .update({
            stripe_session_id: session.id,
            payment_expires_at: paymentExpiresAt,
          })
          .eq('id', payload.submissionId)

        if (updateError) throw updateError
      } catch (err) {
        console.error('Failed to update blog_submission with session ID:', err)
        // H1: Expire Stripe session if DB update fails [A2-H1]
        try {
          await stripe.checkout.sessions.expire(session.id)
        } catch (expireErr) {
          console.error('Failed to expire Stripe session:', expireErr)
        }
        throw new Error('Failed to record payment session. Please try again.')
      }

      return new Response(
        JSON.stringify({ url: session.url }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // --- Standard cart/booking checkout ---
    if (!items?.length) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: items' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // --- Server-side price verification ---
    const propertyIds: string[] = []
    const serviceIds: string[] = []

    for (const item of items as CartItem[]) {
      if (item.type === 'service' || item.listingType === 'service') {
        serviceIds.push(item.listingId)
      } else {
        propertyIds.push(item.listingId)
      }
    }

    const [propertiesResult, servicesResult] = await Promise.all([
      propertyIds.length > 0
        ? supabase.from('properties').select('id, title, price_per_night, images').in('id', propertyIds)
    : Promise.resolve<SupabaseEmptyResponse>({ data: [], error: null }),
      serviceIds.length > 0
        ? supabase.from('services').select('id, title, price, images').in('id', serviceIds)
    : Promise.resolve<SupabaseEmptyResponse>({ data: [], error: null })
    ])

    if (propertiesResult.error) throw propertiesResult.error
    if (servicesResult.error) throw servicesResult.error

    const propertyMap = new Map((propertiesResult.data || []).map((p: any) => [p.id, p.price_per_night]))
    const serviceMap = new Map((servicesResult.data || []).map((s: any) => [s.id, s.price]))

    const lineItems: any[] = []

    for (const item of items as CartItem[]) {
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

      try {
        const { error: updateError } = await supabase
          .from('bookings')
          .update({
            stripe_session_id: session.id,
            payment_expires_at: paymentExpiresAt,
            // payment_intent_id is NOT saved here — Stripe only provides it
            // after the session is completed. It's saved by stripe-webhook
            // on the 'checkout.session.completed' event.
          })
          .in('id', verifiedIds)

        if (updateError) throw updateError
      } catch (err) {
        console.error('Failed to update bookings with session ID:', err)
        // H1: Expire Stripe session if DB update fails [A2-H1]
        try {
          await stripe.checkout.sessions.expire(session.id)
        } catch (expireErr) {
          console.error('Failed to expire Stripe session:', expireErr)
        }
        throw new Error('Failed to record payment session. Please try again.')
      }
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
