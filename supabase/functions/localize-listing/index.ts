// @ts-ignore: npm: specifiers are resolved by Deno, not tsc
import { createClient } from 'npm:@supabase/supabase-js@2'
// @ts-ignore: npm: specifiers are resolved by Deno, not tsc
import { z } from 'npm:zod@3'
// @ts-ignore: jsr: specifiers are resolved by Deno, not tsc
import "jsr:@supabase/functions-js@^2/edge-runtime.d.ts"

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const SITE_URL = Deno.env.get('SITE_URL') || 'https://alanyaholidays.com'

// Languages the AI-localization add-on adds, beyond the base en/tr/ru/ar set.
// Keyed by ISO code -> human name used in the translation prompt.
const TARGET_LANGS: Record<string, string> = {
  de: 'German',
}

const corsHeaders = {
  'Access-Control-Allow-Origin': SITE_URL,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
}

const json = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

const bodySchema = z.object({ listingId: z.string().uuid() })

// Mirrors ai-proxy's model fallback chain.
const MODELS = ['gemini-2.0-flash-001', 'gemini-2.0-flash-lite-preview-02-05', 'gemini-flash-latest']

async function translate(text: string, targetName: string): Promise<string | null> {
  const prompt =
    `Translate the following tourism business listing description into ${targetName}. ` +
    `Preserve meaning, tone and any proper nouns. Return ONLY the translation as plain text — ` +
    `no markdown, no quotes, no preamble.\n\n` +
    `"""${text}"""`

  for (const model of MODELS) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-goog-api-key': GEMINI_API_KEY },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 1024, temperature: 0.3, response_mime_type: 'text/plain' },
          }),
        },
      )
      if (!res.ok) continue
      const result = await res.json()
      const out = result?.candidates?.[0]?.content?.parts?.[0]?.text
      if (typeof out === 'string' && out.trim()) return out.trim()
    } catch (err) {
      console.error(`localize-listing: model ${model} failed:`, err)
    }
  }
  return null
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Internal/machine-to-machine only — triggered by the stripe-webhook on
  // ai_localization activation. Same shared-secret gate as the cron functions.
  const cronSecret = Deno.env.get('CRON_SECRET')
  const reqSecret = req.headers.get('x-cron-secret')
  if (!cronSecret || reqSecret !== cronSecret) {
    return json({ error: 'Unauthorized' }, 401)
  }

  if (!GEMINI_API_KEY) {
    return json({ error: 'GEMINI_API_KEY is not configured' }, 503)
  }

  try {
    const validation = bodySchema.safeParse(await req.json())
    if (!validation.success) {
      return json({ error: 'Invalid request. Provide listingId (uuid).' }, 400)
    }
    const { listingId } = validation.data

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { data: listing, error: fetchError } = await supabase
      .from('directory_listings')
      .select('id, short_description, descriptions')
      .eq('id', listingId)
      .maybeSingle()

    if (fetchError) throw fetchError
    if (!listing) return json({ error: 'Listing not found' }, 404)

    const descriptions: Record<string, string> = { ...(listing.descriptions ?? {}) }
    const source = (descriptions.en || listing.short_description || '').trim()
    if (!source) {
      return json({ translated: [], message: 'No source (English) text to translate' })
    }

    const translated: string[] = []
    for (const [code, name] of Object.entries(TARGET_LANGS)) {
      if (descriptions[code]?.trim()) continue // don't overwrite an existing translation
      const result = await translate(source, name)
      if (result) {
        descriptions[code] = result
        translated.push(code)
      }
    }

    if (translated.length === 0) {
      return json({ translated: [], message: 'Nothing to translate (already present or all failed)' })
    }

    const { error: updateError } = await supabase
      .from('directory_listings')
      .update({ descriptions, updated_at: new Date().toISOString() })
      .eq('id', listingId)

    if (updateError) throw updateError

    console.warn(`localize-listing: added ${translated.join(', ')} for listing ${listingId}`)
    return json({ translated })
  } catch (error) {
    console.error('localize-listing error:', error)
    return json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, 500)
  }
})
