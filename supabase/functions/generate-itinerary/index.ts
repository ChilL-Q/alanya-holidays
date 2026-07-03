// @ts-ignore: jsr: specifiers are resolved by Deno, not tsc
import "jsr:@supabase/functions-js@^2/edge-runtime.d.ts"
// @ts-ignore: npm: specifiers are resolved by Deno, not tsc
import { createClient } from "npm:@supabase/supabase-js@2"
// @ts-ignore: npm: specifiers are resolved by Deno, not tsc
import Anthropic from "npm:@anthropic-ai/sdk@^0.22.0"

const CLAUDE_API_KEY = Deno.env.get('CLAUDE_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ALLOWED_ORIGIN = Deno.env.get('SITE_URL') || 'https://alanyaholidays.com'

// 10 AI requests per minute per user
const AI_RATE_LIMIT = 10

const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GenerateItineraryRequest {
  duration: number;
  companion: string;
  interests: string[];
  pace: string;
  budget: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // --- Authentication Check ---
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Missing Supabase environment variables')
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    })

    // Validate the token and ensure user exists
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized', details: authError?.message }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    // ----------------------------

    // Admin client for server-side operations
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // --- Premium Subscription Gate ---
    // Check BEFORE rate limit — non-premium requests should not consume quota
    if (SUPABASE_SERVICE_ROLE_KEY) {
        const { data: isPremium, error: premError } = await supabaseAdmin.rpc('is_premium', {
            p_user_id: user.id
        })
        if (premError) {
            console.error('Premium check failed:', premError)
            return new Response(
                JSON.stringify({ error: 'Service temporarily unavailable. Please try again later.' }),
                { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        } else if (!isPremium) {
            return new Response(
                JSON.stringify({
                    error: 'upgrade_required',
                    message: 'Trip Planner requires a Premium subscription. Click Upgrade to unlock full access.'
                }),
                { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }
    }
    // ----------------------

    // --- Rate Limiting ---
    if (SUPABASE_SERVICE_ROLE_KEY) {
      const { data: allowed, error: rlError } = await supabaseAdmin.rpc('check_rate_limit', {
        p_user_id: user.id,
        p_function_name: 'generate-itinerary',
        p_max_requests: AI_RATE_LIMIT,
      })
      if (rlError) {
        console.error('Rate limit check failed:', rlError)
        // Fail open — don't block users if DB check fails
      } else if (!allowed) {
        return new Response(
          JSON.stringify({ error: "I'm receiving too many requests from you. Please wait a moment and try again! ⏳" }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '60' } }
        )
      }
    }
    // ---------------------

    if (!CLAUDE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Config Error: CLAUDE_API_KEY is missing in Supabase secrets.' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { duration, companion, interests, pace, budget }: GenerateItineraryRequest = await req.json()

    if (!duration || !companion || !interests || interests.length === 0 || !pace || !budget) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: duration, companion, interests, pace, budget' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const prompt = `Act as an expert Alanya tour guide. Generate a detailed ${duration}-day trip itinerary for a ${companion}.
    Interests: ${interests.join(', ')}.
    Pace: ${pace}.
    Budget Level: ${budget}.

    IMPORTANT GUIDELINES:
    - If budget is "economy": Suggest using "Dolmuş" (local buses) for transport. Recommend free public beaches (Damlataş, Kleopatra), local Pide/Lavaş restaurants, and hiking the Castle hills.
    - If budget is "standard": Suggest car/scooter rentals. Recommend a mix of local favorites and popular tourist spots like Dim Çayı or Sapadere Canyon.
    - If budget is "luxury": Suggest private VIP transfers or luxury car rentals. Recommend premium beach clubs (e.g., Illusia, Envie), private yacht tours from the harbor, and fine dining with castle views.
    - If pace is "relaxed": Focus on 1-2 key locations per day with plenty of "Beach time" or "Leisure at harbor".
    - If pace is "intense": Include 3-4 distinct stops per day (e.g., Morning: Castle & Red Tower; Afternoon: Dim Cave; Evening: Harbor & Nightlife).

    YOUR ENTIRE RESPONSE MUST BE A SINGLE JSON OBJECT. DO NOT USE MARKDOWN BLOCKS (\`\`\`json). DO NOT ADD PREAMBLE OR POSTAMBLE.

    Structure:
    {
      "itinerary": [
        {
          "day": 1,
          "title": "Day Title",
          "items": [
            {"time": "09:00", "title": "Activity Name", "description": "Brief description", "location": "Area", "link": "/services/...", "lat": 36.5438, "lng": 32.0000}
          ]
        }
      ]
    }

    Coordinates guidelines (Alanya, Turkey):
    - Include accurate lat/lng for each activity location when known.
    - If you do not know the exact coordinates, omit lat and lng entirely rather than guessing.
    - Examples:
      - Alanya Castle (Kalesi): lat 36.5438, lng 31.9998
      - Kleopatra Beach: lat 36.5480, lng 31.9850
      - Damlatas Cave: lat 36.5450, lng 31.9900
      - Red Tower (Kizil Kule): lat 36.5420, lng 31.9950
      - Alanya Harbor: lat 36.5400, lng 32.0050
      - Dim Cayi: lat 36.4700, lng 32.1500
      - Sapadere Canyon: lat 36.4000, lng 32.2000

    Link suggestions:
    - /services/car-rental
    - /things-to-do-in-alanya
    - /medical-tourism-alanya
    - /alanya-real-estate
    - /alanya-hotels`

    try {
      const client = new Anthropic({ apiKey: CLAUDE_API_KEY })

      // Use streaming to send chunks back to client progressively
      const stream = await client.messages.stream({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 8192,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      })

      // Convert the event stream to a readable stream of JSON chunks
      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            let buffer = ''

            for await (const event of stream) {
              if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
                const text = event.delta.text
                buffer += text

                // Send chunk as JSON-encoded event for client parsing
                controller.enqueue(new TextEncoder().encode(JSON.stringify({ chunk: text }) + '\n'))
              }
            }

            // Signal completion
            if (buffer) {
              controller.enqueue(new TextEncoder().encode(JSON.stringify({ done: true }) + '\n'))
            } else {
              controller.error(new Error('Empty response from Claude'))
            }
          } catch (err) {
            controller.error(err)
          } finally {
            controller.close()
          }
        }
      })

      return new Response(readableStream, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/x-ndjson', // Newline-delimited JSON for streaming
          'Transfer-Encoding': 'chunked'
        }
      })
    } catch (err) {
      const errorMsg = String(err)
      console.error('Claude API error:', errorMsg)

      // Check for rate limits and timeout errors
      if (errorMsg.includes('429') || errorMsg.includes('rate')) {
        return new Response(
          JSON.stringify({ error: "I'm receiving too many requests. Please wait 10-20 seconds and try again! ⏳" }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '60' } }
        )
      }

      return new Response(
        JSON.stringify({ error: 'AI service temporarily unavailable. Please try again later.' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (_error) {
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred. Please try again later.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
