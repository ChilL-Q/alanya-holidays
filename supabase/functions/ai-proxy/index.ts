// @ts-ignore
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
// @ts-ignore
import { createClient } from "npm:@supabase/supabase-js@2"

declare const Deno: any;

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AiProxyRequest {
  propertyName: string | null;
  location: string | null;
  userQuestion: string;
  history: { role: 'user' | 'model'; content: string }[];
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

    if (!GEMINI_API_KEY) {
      throw new Error('Missing GEMINI_API_KEY in environment')
    }

    const { propertyName, location, userQuestion, history = [] }: AiProxyRequest = await req.json()

    if (!userQuestion || typeof userQuestion !== 'string' || !userQuestion.trim()) {
      return new Response(
        JSON.stringify({ error: 'Missing or empty userQuestion' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Format conversation history
    const recentHistory = (history || []).slice(-15).map(msg =>
      `${msg.role === 'user' ? 'User' : 'Guide'}: ${msg.content}`
    ).join('\n')

    const contextPrompt = `
      You are a friendly, knowledgeable local travel guide in Alanya, Turkey.
      ${propertyName ? `The user is considering booking a property named "${propertyName}" located in "${location}".` : 'The user is planning a trip to Alanya.'}

      Conversation History:
      ${recentHistory}

      User Question: "${userQuestion}"
      
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

    let lastError: string = ''

    for (const modelName of modelsToTry) {
      try {
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: contextPrompt }] }],
            generationConfig: {
              maxOutputTokens: 256,
              temperature: 0.7,
            }
          })
        })

        if (!response.ok) {
          const errBody = await response.text()
          if (response.status === 429) {
            console.warn(`Model ${modelName} rate limited.`)
            lastError = `429: Rate limited`
            continue
          }
          lastError = `${response.status}: ${errBody}`
          console.warn(`Model ${modelName} failed: ${lastError}`)
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
        console.warn(`Model ${modelName} error:`, err)
      }
    }

    // All models failed
    if (lastError.includes('429')) {
      return new Response(
        JSON.stringify({ answer: "I'm currently receiving too many requests. Please wait 10-20 seconds and try again! ⏳" }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: `All AI models failed. Last error: ${lastError}` }),
      { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('AI Proxy Error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
