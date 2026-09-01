// @ts-ignore: npm: specifiers are resolved by Deno, not tsc
import { createClient } from 'npm:@supabase/supabase-js@2'
// @ts-ignore: jsr: specifiers are resolved by Deno, not tsc
import "jsr:@supabase/functions-js@^2/edge-runtime.d.ts"

// Process Email Outbox worker (audit 2.4).
// Claims pending emails from public.email_outbox and delivers them via the
// existing send-email function. Driven by pg_cron every minute.

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const CRON_SECRET = Deno.env.get('CRON_SECRET')!

const MAX_ATTEMPTS = 5

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: { 'Access-Control-Allow-Origin': '*' },
    })
  }

  const reqSecret = req.headers.get('x-cron-secret')
  if (!CRON_SECRET || reqSecret !== CRON_SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  try {
    const { data: claimed, error: claimError } = await supabase.rpc(
      'claim_pending_emails',
      { p_batch_size: 20 },
    )

    if (claimError) throw claimError
    if (!claimed || claimed.length === 0) {
      return new Response(JSON.stringify({ delivered: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    let delivered = 0
    for (const row of claimed as Array<{
      id: number
      payload: Record<string, unknown>
      attempts: number
    }>) {
      try {
        const { error: sendError } = await supabase.functions.invoke(
          'send-email',
          { body: row.payload },
        )
        if (sendError) throw sendError

        await supabase.rpc('complete_email_delivery', {
          p_id: row.id,
          p_success: true,
        })
        delivered += 1
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        // Final failure only when attempts are exhausted; otherwise stays pending for retry.
        const isFinal = row.attempts >= MAX_ATTEMPTS
        await supabase.rpc('complete_email_delivery', {
          p_id: row.id,
          p_success: false,
          p_error: message,
        })
        console.warn(
          `Outbox email ${row.id} delivery failed (attempt ${row.attempts}${isFinal ? ', final' : ''}): ${message}`,
        )
      }
    }

    return new Response(JSON.stringify({ delivered }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('process-email-outbox failed:', message)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
