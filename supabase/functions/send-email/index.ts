import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, userId, subject, html } = await req.json()

    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not set')
      throw new Error('Server configuration error: Missing API Key')
    }

    let targetEmail = to;

    // Try to resolve email via Auth if not provided, but don't crash if keys are missing
    if (!targetEmail && userId) {
        if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
            try {
                const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
                const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId)
                if (!userError && userData?.user) {
                    targetEmail = userData.user.email
                    console.log(`Resolved email for user ${userId}: ${targetEmail}`)
                } else {
                    console.warn('Failed to fetch user from Auth:', userError)
                }
            } catch (err) {
                console.error('Supabase Admin Client Error:', err)
            }
        } else {
            console.warn('Missing SUPABASE_SERVICE_ROLE_KEY, skipping Auth lookup')
        }
    }

    if (!targetEmail) {
        console.error('No target email resolved. Input:', { to, userId })
        throw new Error('No target email provided')
    }

    console.log(`Sending email to: ${targetEmail}`)

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        // Use onboarding domain for testing to ensure delivery if custom domain not verified
        from: 'Alanya Holidays <onboarding@resend.dev>', 
        to: targetEmail,
        subject,
        html,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
        console.error('Resend API Error:', data);
        const errorMessage = data.message || 'Failed to send email';
        // Check for specific Resend errors (like "domain not verified")
         if (errorMessage.includes("sandbox")) {
             throw new Error(`Sandboxed: Can only send to verified email (e.g. ${to})`)
         }
        throw new Error(errorMessage)
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Function Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
