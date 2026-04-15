// @ts-ignore
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
// @ts-ignore
import { createClient } from "npm:@supabase/supabase-js@2"

declare const Deno: any;

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const ALLOWED_ORIGIN = Deno.env.get('SITE_URL') || 'https://alanyaholidays.com'

// 10 AI requests per minute per user
const AI_RATE_LIMIT = 10

const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AiProxyRequest {
  propertyName?: string | null;
  location?: string | null;
  userQuestion: string;
  history?: { role: 'user' | 'model'; content: string }[];
  mode?: 'chat' | 'structured';
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

    // --- Premium Subscription Gate (Task 91.2) ---
    // Check BEFORE rate limit — non-premium requests should not consume quota
    if (SUPABASE_SERVICE_ROLE_KEY) {
        const { data: isPremium, error: premError } = await supabaseAdmin.rpc('is_premium', {
            p_user_id: user.id
        })
        if (premError) {
            console.error('Premium check failed:', premError)
            // Fail open (allow) if DB check fails — don't block users if DB is temporarily unavailable
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
        p_function_name: 'ai-proxy',
        p_max_requests: AI_RATE_LIMIT,
      })
      if (rlError) {
        console.error('Rate limit check failed:', rlError)
        // Fail open — don't block users if DB check fails
      } else if (!allowed) {
        return new Response(
          JSON.stringify({ answer: "I'm receiving too many requests from you. Please wait a moment and try again! ⏳" }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '60' } }
        )
      }
    }
    // ---------------------

    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Config Error: GEMINI_API_KEY is missing in Supabase secrets.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { propertyName, location, userQuestion, history = [], mode }: AiProxyRequest = await req.json()

    if (!userQuestion?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Missing userQuestion' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const MAX_QUESTION_LENGTH = 500
    const MAX_HISTORY_ENTRIES = 15
    const MAX_HISTORY_CONTENT_LENGTH = 300

    // Sanitize user question: trim, limit length, strip prompt-injection markers
    const sanitizedQuestion = userQuestion
      .trim()
      .slice(0, MAX_QUESTION_LENGTH)
      .replace(/\[INST\]|\[\/INST\]|<s>|<\/s>|###\s*(System|Human|Assistant)/gi, '')

    // Sanitize property context fields
    const safePropertyName = propertyName ? String(propertyName).trim().slice(0, 200) : null
    const safeLocation = location ? String(location).trim().slice(0, 200) : null

    // Format conversation history with length limits
    const recentHistory = (history || [])
      .slice(-MAX_HISTORY_ENTRIES)
      .map(msg => {
        const role = msg.role === 'user' ? 'User' : 'Guide'
        const content = String(msg.content).trim().slice(0, MAX_HISTORY_CONTENT_LENGTH)
        return `${role}: ${content}`
      })
      .join('\n')

    const isStructured = mode === 'structured' || userQuestion.includes('JSON');
    
    const contextPrompt = isStructured 
      ? userQuestion 
      : `
      You are a friendly, knowledgeable local travel guide in Alanya, Turkey.
      ${safePropertyName ? `The user is considering booking a property named "${safePropertyName}" located in "${safeLocation}".` : 'The user is planning a trip to Alanya.'}

      Conversation History:
      ${recentHistory}

      User Question: "${sanitizedQuestion}"

      Provide a helpful, concise answer (max 100 words).
      If asked about services (health, transport, shopping), mention that Alanya Holidays offers verified direct bookings.
      Focus on distance, local tips, and atmosphere. Be enthusiastic about Alanya.
      IMPORTANT: Do not use markdown formatting (no bolding with asterisks, no headers). Use plain text only.
    `

    // Try models in order of preference
    const modelsToTry = [
      "gemini-2.0-flash-001",
      "gemini-2.0-flash-lite-preview-02-05",
      "gemini-flash-latest"
    ]

    let lastError = ''

    for (const modelName of modelsToTry) {
      try {
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-goog-api-key': GEMINI_API_KEY,
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: contextPrompt }] }],
// Version: 1.0.4 - Official JSON Mode
            generationConfig: {
              maxOutputTokens: isStructured ? 8192 : 512,
              temperature: isStructured ? 0.1 : 0.7,
              response_mime_type: isStructured ? "application/json" : "text/plain",
            }
          })
        })

        if (!response.ok) {
          const errBody = await response.text()
          lastError = `${response.status}: ${errBody}`
          continue
        }

        const result = await response.json()
        const text = result?.candidates?.[0]?.content?.parts?.[0]?.text

        if (!text) {
          lastError = 'Empty response from model'
          continue
        }

        return new Response(
          JSON.stringify({ answer: text }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } catch (err) {
        lastError = String(err)
      }
    }

    return new Response(
      JSON.stringify({ error: `AI service temporarily unavailable. Please try again later. Debug: ${lastError}` }),
      { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (_error) {
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred. Please try again later.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
