// @ts-ignore
import { createClient } from "npm:@supabase/supabase-js@2"
// @ts-ignore
import { z } from "npm:zod@3"
// @ts-ignore
import { retry } from '../../utils/retry';

declare const Deno: any;

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const LAWYER_ADMIN_EMAIL = Deno.env.get('LAWYER_ADMIN_EMAIL')
const SITE_URL = Deno.env.get('SITE_URL') || 'https://alanyaholidays.com'

const corsHeaders = {
  'Access-Control-Allow-Origin': SITE_URL,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// --- Input Validation ---
const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters").max(2000),
});

function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // --- Parse Input ---
    const body = await req.json();
    const validationResult = contactSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(JSON.stringify({
        error: 'Invalid input',
        details: validationResult.error.issues
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { name, email, phone, message } = validationResult.data;

    if (!RESEND_API_KEY) throw new Error('Missing RESEND_API_KEY');
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error('Missing Supabase credentials');
    if (!LAWYER_ADMIN_EMAIL) throw new Error('Missing LAWYER_ADMIN_EMAIL');

    // --- Database Write (Write-Ahead) ---
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: insertData, error: insertError } = await supabaseAdmin
      .from('lawyer_contacts')
      .insert({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        message: message.trim()
      })
      .select('id') // RETURNING id
      .maybeSingle();

    if (insertError) {
      console.error('DB Insert Error:', insertError);
      throw insertError;
    }

    // Rate limit check: if insert was ignored due to UNIQUE conflict, insertData will be null
    // In that case, we still return success to prevent email enumeration
    if (!insertData) {
      console.warn(`Rate limit hit for email: ${email.split('@')[0]}@***`);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // --- Send Email to Admin ---
    // Using Resend API directly
    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; border-radius: 8px;">
        <h2 style="color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">New Lawyer Contact Request</h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #475569; width: 120px;">Name</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #0f172a;">${escapeHtml(name)}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #475569;">Email</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #0f172a;"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #475569;">Phone</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #0f172a;">${phone ? `<a href="tel:${escapeHtml(phone)}">${escapeHtml(phone)}</a>` : '<span style="color: #94a3b8;">Not provided</span>'}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold; color: #475569; vertical-align: top;">Message</td>
            <td style="padding: 8px; color: #0f172a; white-space: pre-wrap;">${escapeHtml(message)}</td>
          </tr>
        </table>
      </div>
    `;

    try {
      await retry(async () => {
        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: 'Alanya Holidays <noreply@alanyaholidays.com>',
            to: LAWYER_ADMIN_EMAIL,
            subject: `⚖️ New Lawyer Contact: ${escapeHtml(name)}`,
            html: emailHtml,
            reply_to: email, // Allow admin to reply directly to user
          }),
        });

        if (!resendRes.ok) {
          const errorData = await resendRes.json();
          throw new Error(`Resend API error: ${JSON.stringify(errorData)}`);
        }
      });
    } catch (emailError) {
      console.error('Failed to send lawyer contact email after multiple retries:', emailError);
      // Don't throw here — DB write succeeded. Admin can check DB if email failed.
      // We just log the failure.
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Contact Lawyer Function Error:', error);
    const safeMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return new Response(JSON.stringify({ error: safeMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
