// Thin forwarder — the single Stripe webhook implementation lives in the
// NestJS backend (POST /api/webhooks/stripe) with DB-claimed idempotency
// (processed_stripe_events) and the full handler chain.
//
// This function preserves the legacy Supabase webhook URL: it forwards the
// raw body and the stripe-signature header untouched, so the backend can
// verify the signature itself. Any forwarding failure returns 500 so Stripe
// retries — fail-loud, never silently drop a payment event.
Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return new Response(
      JSON.stringify({ error: 'Missing stripe-signature header' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const body = await req.text()
  const target =
    Deno.env.get('BACKEND_WEBHOOK_URL') ??
    'https://alanyaholidays.com/api/webhooks/stripe'

  try {
    const upstream = await fetch(target, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': signature,
      },
      body,
    })

    const text = await upstream.text()
    if (upstream.status >= 400) {
      console.error(
        `Backend rejected webhook: status=${upstream.status} body=${text.slice(0, 500)}`,
      )
    }
    return new Response(text, {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err: unknown) {
    console.error(
      'Failed to forward stripe webhook to backend:',
      err instanceof Error ? err.message : String(err),
    )
    return new Response(JSON.stringify({ error: 'Backend unreachable' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
