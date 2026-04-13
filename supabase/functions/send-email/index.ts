// @ts-ignore
import { createClient } from "npm:@supabase/supabase-js@2"
// @ts-ignore
import { z } from "npm:zod@3"

declare const Deno: any;

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const ALLOWED_ORIGIN = Deno.env.get('SITE_URL') || 'https://alanyaholidays.com'

const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// --- Zod schemas per email type ---

const s = z.string().min(1)
const sOpt = z.string().optional()
const bookingBase = { itemTitle: s, checkIn: s, checkOut: s, link: sOpt, itemTypeLabel: sOpt }

const emailDataSchemas = {
  booking_request_host:  z.object({ ...bookingBase, guestName: s, guests: z.coerce.string(), totalPrice: z.coerce.string(), message: sOpt }),
  booking_cancelled_host: z.object({ ...bookingBase, guestName: s }),
  booking_expired_host:  z.object({ ...bookingBase, guestName: s }),
  booking_created:       z.object({ ...bookingBase, totalPrice: z.coerce.string(), userName: sOpt }),
  booking_confirmed:     z.object({ ...bookingBase, guests: z.coerce.string(), address: sOpt }),
  booking_rejected:      z.object({ itemTitle: s, reason: sOpt, searchLink: sOpt }),
  booking_expired_guest: z.object({ itemTitle: s, link: sOpt }),
  booking_cancelled:     z.object({ itemTitle: s, link: sOpt }),
  listing_approved:      z.object({ title: s, link: sOpt }),
  listing_rejected:      z.object({ title: s, reason: s, link: sOpt }),
  listing_deleted:       z.object({ title: s, link: sOpt }),
  service_approved:      z.object({ title: s, link: sOpt }),
  service_rejected:      z.object({ title: s, reason: s, link: sOpt }),
  service_updated:       z.object({ title: s, link: sOpt }),
  welcome_email:         z.object({ name: s, link: sOpt }),
  trip_reminder:         z.object({ itemTitle: s, guestName: s, checkIn: s, address: s, hostName: s, link: sOpt }),
  review_reminder:       z.object({ itemTitle: s, guestName: s, link: sOpt }),
  new_chat_message:      z.object({ senderName: s, messagePreview: s, link: sOpt }),
  payout_processed:      z.object({ amount: z.coerce.string(), reference: sOpt, link: sOpt }),
  refund_processed:      z.object({ amount: z.coerce.string(), itemTitle: s, link: sOpt }),
  new_review:            z.object({ itemTitle: s, guestName: s, rating: z.coerce.number().min(1).max(5), comment: s, link: sOpt }),
  admin_contact_message: z.object({ subject: s, name: s, email: s, message: s }),
  blog_submission_received: z.object({ postTitle: s, link: sOpt }),
  blog_submission_approved: z.object({ postTitle: s, postUrl: s, authorName: s }),
  blog_submission_rejected: z.object({ postTitle: s, reason: s, authorName: s }),
} as const

type EmailType = keyof typeof emailDataSchemas

const EMAIL_TYPES = Object.keys(emailDataSchemas) as EmailType[]

interface EmailPayload {
  to?: string;
  userId?: string;
  type: EmailType;
  data: unknown;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, userId, type, data }: EmailPayload = await req.json()

    if (!RESEND_API_KEY) throw new Error('Missing RESEND_API_KEY')
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error('Missing Supabase credentials')

    // --- Authentication Check ---
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), { 
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }
    const token = authHeader.replace(/^Bearer\s+/i, '')
    
    // We can use the service role client, but pass the token explicitly to getUser()
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized', details: authError?.message }), { 
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }
    // ----------------------------
    
    // --- Input Validation ---
    if (!type || !EMAIL_TYPES.includes(type as EmailType)) {
      return new Response(JSON.stringify({ error: `Invalid "type" field. Must be one of: ${EMAIL_TYPES.join(', ')}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const schemaResult = emailDataSchemas[type as EmailType].safeParse(data)
    if (!schemaResult.success) {
      return new Response(JSON.stringify({
        error: 'Invalid "data" payload for email type: ' + type,
        issues: schemaResult.error.issues.map(i => ({ path: i.path.join('.'), message: i.message })),
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const validatedData = schemaResult.data

    if (to && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      return new Response(JSON.stringify({ error: `Invalid email format: "${to}"` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    if (!to && !userId) {
      return new Response(JSON.stringify({ error: 'Either "to" (email) or "userId" must be provided.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    let targetEmail = to;

    // Resolve Email via Auth if not provided
    if (!targetEmail && userId && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
        const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId)
        if (!userError && userData?.user?.email) {
            targetEmail = userData.user.email
        } else {
            console.warn(`Failed to resolve email for user ${userId}`, userError)
        }
    }

    if (!targetEmail) throw new Error('No target email resolved')

    // Generate Content based on Type
    const { subject, html } = generateEmailContent(type, validatedData);

    // eslint-disable-next-line no-console
    console.log(`Sending '${type}' email to: ${targetEmail}`)

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Alanya Holidays <noreply@alanya-holidays.com>',
        to: targetEmail,
        subject,
        html,
      }),
    })

    const responseData = await res.json()

    if (!res.ok) {
        console.error('Resend API Error:', responseData);
        throw new Error(responseData.message || 'Failed to send email')
    }

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Email Function Error:', error);
    // Sanitize error — don't leak internals
    const safeMessage = error instanceof Error && error.message ? 'An error occurred sending the email' : 'An unexpected error occurred';
    return new Response(JSON.stringify({ error: safeMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})

// --- Security Helpers ---

function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// --- Email Template Helpers (Updated Design) ---

const BRAND_COLOR = '#05445E'; // Deep Petrol Blue
const BG_COLOR = '#f1f5f9'; // Slate-100
const CONTAINER_BG = '#ffffff';
const TEXT_COLOR = '#334155'; // Slate-700
const HEADING_COLOR = '#0f172a'; // Slate-900
const LOGO_URL = 'https://alanyaholidays.com/logo.png';

const getHtmlTemplate = (title: string, content: string, actionLink?: string, actionText?: string, isAlert: boolean = false) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: ${BG_COLOR}; margin: 0; padding: 40px 20px; color: ${TEXT_COLOR}; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; background-color: ${CONTAINER_BG}; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); }
    .header { background-color: #ffffff; padding: 32px 24px; text-align: center; border-bottom: 1px solid #f1f5f9; }
    .logo { height: 48px; object-fit: contain; }
    .hero { background: ${isAlert ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : `linear-gradient(135deg, ${BRAND_COLOR} 0%, #042f40 100%)`}; padding: 40px 32px; text-align: center; color: white; }
    .hero h1 { margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; line-height: 1.2; text-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .content { padding: 40px 32px; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 24px 0; }
    .info-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e2e8f0; }
    .info-row:last-child { border-bottom: none; }
    .label { font-weight: 600; color: #64748b; font-size: 14px; }
    .value { font-weight: 500; color: ${HEADING_COLOR}; text-align: right; }
    .price-value { color: ${BRAND_COLOR}; font-weight: 700; font-size: 18px; }
    .btn-container { text-align: center; margin-top: 40px; }
    .btn { display: inline-block; background-color: ${BRAND_COLOR}; color: white !important; font-weight: 600; text-decoration: none; padding: 16px 32px; border-radius: 12px; transition: all 0.2s; box-shadow: 0 4px 6px -1px rgba(13, 148, 136, 0.3); font-size: 16px; }
    .btn:hover { background-color: #0f766e; transform: translateY(-1px); }
    .footer { background-color: #f8fafc; padding: 32px; text-align: center; font-size: 13px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
    .footer a { color: ${BRAND_COLOR}; text-decoration: none; font-weight: 500; }
    .quote { font-style: italic; color: #475569; position: relative; padding-left: 20px; border-left: 4px solid ${BRAND_COLOR}; margin: 16px 0; background: white; padding: 16px; border-radius: 0 8px 8px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${LOGO_URL}" alt="Alanya Holidays" class="logo">
    </div>
    <div class="hero">
      <h1>${title}</h1>
    </div>
    <div class="content">
      ${content}
      ${actionLink ? `
        <div class="btn-container">
          <a href="${actionLink}" class="btn">${actionText || 'View Details'}</a>
        </div>
      ` : ''}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Alanya Holidays. Premium Rentals & Experiences.</p>
      <div style="margin-top: 12px;">
        <a href="#">My Account</a> • <a href="#">Support</a> • <a href="#">Privacy Policy</a>
      </div>
      <p style="margin-top: 24px; opacity: 0.6;">You received this email because of activity on your account.</p>
    </div>
  </div>
</body>
</html>
`;

function generateEmailContent(type: string, data: any): { subject: string, html: string } {
    const itemLabel = data.itemTypeLabel || 'Property';

    switch (type) {
        // --- Host Notifications ---
        case 'booking_request_host':
            return {
                subject: `🔔 New Booking Request: ${escapeHtml(data.itemTitle)}`,
                html: getHtmlTemplate(
                    'New Booking Request',
                    `
                    <p style="font-size: 16px;">Good news! You have received a new booking request from <strong>${escapeHtml(data.guestName)}</strong>.</p>
                    <div class="card">
                        <div class="info-row"><span class="label">${escapeHtml(itemLabel)}</span><span class="value">${escapeHtml(data.itemTitle)}</span></div>
                        <div class="info-row"><span class="label">Dates</span><span class="value">${escapeHtml(data.checkIn)} — ${escapeHtml(data.checkOut)}</span></div>
                        <div class="info-row"><span class="label">Guests</span><span class="value">${escapeHtml(data.guests)}</span></div>
                        <div class="info-row"><span class="label">Total Payout</span><span class="value price-value">€${escapeHtml(data.totalPrice)}</span></div>
                        ${data.message ? `<div class="info-row" style="flex-direction:column; gap:8px"><span class="label">Note:</span><div class="quote" style="margin:0">"${escapeHtml(data.message)}"</div></div>` : ''}
                    </div>
                    <p style="text-align: center; color: #64748b; font-size: 14px; margin-top: 24px;">Please review and accept or decline this request within 24 hours.</p>
                    `,
                    data.link,
                    'Manage Booking'
                )
            };

        case 'booking_cancelled_host':
            return {
                subject: `❌ Booking Cancelled: ${escapeHtml(data.itemTitle)}`,
                html: getHtmlTemplate(
                    'Booking Cancelled',
                    `
                    <p style="font-size: 16px;">The booking for <strong>${escapeHtml(data.itemTitle)}</strong> has been cancelled.</p>
                    <div class="card">
                        <div class="info-row"><span class="label">Guest</span><span class="value">${escapeHtml(data.guestName)}</span></div>
                        <div class="info-row"><span class="label">Dates</span><span class="value">${escapeHtml(data.checkIn)} — ${escapeHtml(data.checkOut)}</span></div>
                    </div>
                    <p style="text-align: center; color: #64748b; font-size: 14px;">Your calendar has been automatically updated.</p>
                    `,
                    data.link,
                    'View Calendar',
                    true
                )
            };

        case 'booking_expired_host':
            return {
                subject: `⏳ Request Expired: ${escapeHtml(data.itemTitle)}`,
                html: getHtmlTemplate(
                    'Request Expired',
                    `
                    <p style="font-size: 16px;">The booking request from <strong>${escapeHtml(data.guestName)}</strong> has expired because no action was taken within 24 hours.</p>
                     <div class="card">
                        <div class="info-row"><span class="label">${escapeHtml(itemLabel)}</span><span class="value">${escapeHtml(data.itemTitle)}</span></div>
                        <div class="info-row"><span class="label">Dates</span><span class="value">${escapeHtml(data.checkIn)} — ${escapeHtml(data.checkOut)}</span></div>
                    </div>
                    <p style="text-align: center; color: #64748b; font-size: 14px;">The dates have been unblocked on your calendar.</p>
                    `,
                    data.link,
                    'View Dashboard',
                    true
                )
            };

        // --- Guest Notifications ---
        case 'booking_created':
            return {
                subject: `🕒 Booking Request Sent: ${escapeHtml(data.itemTitle)}`,
                html: getHtmlTemplate(
                    'Request Sent',
                    `
                    <p style="font-size: 16px;">Hi ${escapeHtml(data.userName) || 'there'},</p>
                    <p>We've received your request! The host has 24 hours to accept your booking.</p>
                    <div class="card">
                        <div class="info-row"><span class="label">${escapeHtml(itemLabel)}</span><span class="value">${escapeHtml(data.itemTitle)}</span></div>
                        <div class="info-row"><span class="label">Dates</span><span class="value">${escapeHtml(data.checkIn)} — ${escapeHtml(data.checkOut)}</span></div>
                        <div class="info-row"><span class="label">Total Price</span><span class="value price-value">€${escapeHtml(data.totalPrice)}</span></div>
                    </div>
                    <p style="text-align: center; color: #64748b; font-size: 14px;">You won't be charged until the host accepts your request.</p>
                    `,
                    data.link,
                    'View Booking'
                )
            };

        case 'booking_confirmed':
            return {
                subject: `✅ Booking Confirmed: ${escapeHtml(data.itemTitle)}!`,
                html: getHtmlTemplate(
                    'Booking Confirmed!',
                    `
                    <p style="font-size: 16px;">Your booking for <strong>${escapeHtml(data.itemTitle)}</strong> is confirmed.</p>
                    <div class="card">
                        <div class="info-row"><span class="label">Dates</span><span class="value">${escapeHtml(data.checkIn)} — ${escapeHtml(data.checkOut)}</span></div>
                        <div class="info-row"><span class="label">Address</span><span class="value">${escapeHtml(data.address) || 'Check details in app'}</span></div>
                        <div class="info-row"><span class="label">Guests</span><span class="value">${escapeHtml(data.guests)}</span></div>
                    </div>
                    <p style="text-align: center; margin-top: 16px;">Get ready for an amazing experience!</p>
                    `,
                    data.link,
                    'View Details'
                )
            };

        case 'booking_rejected':
            return {
                subject: `⛔ Update on your booking for ${escapeHtml(data.itemTitle)}`,
                html: getHtmlTemplate(
                    'Booking Declined',
                    `
                    <p style="font-size: 16px;">We're sorry, but your booking request for <strong>${escapeHtml(data.itemTitle)}</strong> could not be accepted at this time.</p>
                    <div class="card">
                        <div class="info-row"><span class="label">Reason</span><span class="value" style="color:#ef4444">${escapeHtml(data.reason) || 'Dates unavailable'}</span></div>
                    </div>
                    <p style="text-align: center; color: #64748b; font-size: 14px;">No charges have been made.</p>
                    `,
                    data.searchLink,
                    'Search Others',
                    true
                )
            };

        case 'booking_expired_guest':
            return {
                subject: `⏳ Request Expired: ${escapeHtml(data.itemTitle)}`,
                html: getHtmlTemplate(
                    'Request Expired',
                    `
                    <p style="font-size: 16px;">Your booking request for <strong>${escapeHtml(data.itemTitle)}</strong> has expired because the host didn't respond within 24 hours.</p>
                    <p>No charge has been made.</p>
                    `,
                    data.link,
                    'Find Another Option',
                    true
                )
            };

        // --- Listings & Props ---
        case 'listing_approved':
            return {
                subject: `🎉 Your property is Live!`,
                html: getHtmlTemplate(
                    'Listing Published',
                    `
                    <p style="font-size: 16px; margin-bottom: 24px; text-align: center;">Congratulations! Your property description and photos have been verified by our team.</p>
                    <div class="card">
                         <div style="text-align: center; margin-bottom: 16px;">
                            <div style="background: #d1fae5; color: #059669; width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto;">
                                <span style="font-size: 32px;">✓</span>
                            </div>
                         </div>
                         <p style="text-align: center; font-weight: 600; color: ${HEADING_COLOR}; margin: 0;">${escapeHtml(data.title)} is now Live</p>
                    </div>
                    `,
                    data.link,
                    'View Listing'
                )
            };

        case 'listing_rejected':
            return {
                subject: `⚠️ Action Required: ${escapeHtml(data.title)}`,
                html: getHtmlTemplate(
                    'Listing Returned',
                    `
                    <p style="font-size: 16px;">Your property <strong>${escapeHtml(data.title)}</strong> needs some changes before it can be published.</p>
                     <div class="card">
                         <div class="info-row"><span class="label">Reason</span><span class="value" style="color:#ef4444">${escapeHtml(data.reason)}</span></div>
                    </div>
                    `,
                    data.link,
                    'Edit Listing',
                    true
                )
            };
        
        // --- Services ---
        case 'service_approved':
            return {
                subject: `🎉 Your service is Live!`,
                html: getHtmlTemplate(
                    'Service Published',
                    `
                    <p style="font-size: 16px; margin-bottom: 24px; text-align: center;">Congratulations! Your service <strong>${escapeHtml(data.title)}</strong> has been approved.</p>
                    <div class="card">
                         <div style="text-align: center; margin-bottom: 16px;">
                            <div style="background: #d1fae5; color: #059669; width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto;">
                                <span style="font-size: 32px;">✓</span>
                            </div>
                         </div>
                         <p style="text-align: center; font-weight: 600; color: ${HEADING_COLOR}; margin: 0;">${escapeHtml(data.title)}</p>
                         <p style="text-align: center; font-size: 14px; color: #64748b; margin-top: 8px;">Now visible to customers</p>
                    </div>
                    `,
                    data.link,
                    'View Service'
                )
            };

        case 'service_rejected':
            return {
                subject: `⚠️ Action Required: ${escapeHtml(data.title)}`,
                html: getHtmlTemplate(
                    'Service Rejected',
                    `
                    <p style="font-size: 16px;">Your service <strong>${escapeHtml(data.title)}</strong> was not approved.</p>
                     <div class="card">
                         <div class="info-row"><span class="label">Reason</span><span class="value" style="color:#ef4444">${escapeHtml(data.reason)}</span></div>
                    </div>
                    <p style="text-align: center;">Please review the feedback and submit again.</p>
                    `,
                    data.link,
                    'Edit Service',
                    true
                )
            };
        
        case 'service_updated':
            return {
                subject: `Service Updated: ${escapeHtml(data.title)}`,
                html: getHtmlTemplate(
                    'Service Updated',
                    `
                    <p style="font-size: 16px;">The details of your service <strong>${escapeHtml(data.title)}</strong> have been updated by the administrator.</p>
                    <div class="card">
                        <p style="margin: 0; color: #64748b;">Review the changes in your dashboard.</p>
                    </div>
                    `,
                    data.link,
                    'View Service'
                )
            };

        // --- New Lifecycle Emails ---

        case 'welcome_email':
            return {
                subject: `Welcome to Alanya Holidays! 🌴`,
                html: getHtmlTemplate(
                    'Welcome Aboard!',
                    `
                    <p style="font-size: 16px;">Hi ${escapeHtml(data.name)},</p>
                    <p>We are thrilled to have you join our community. Whether you are looking for the perfect vacation rental or offering one, we are here to help.</p>
                    <div class="card">
                        <p style="font-weight: 600;">Get started by exploring our top listings or setting up your profile.</p>
                    </div>
                    `,
                    data.link,
                    'Explore Stays'
                )
            };

        case 'trip_reminder':
            return {
                subject: `🏖️ Your Trip Starts Tomorrow: ${escapeHtml(data.itemTitle)}`,
                html: getHtmlTemplate(
                    'Ready for Takeoff?',
                    `
                    <p style="font-size: 16px;">Hi ${escapeHtml(data.guestName)},</p>
                    <p>Your stay at <strong>${escapeHtml(data.itemTitle)}</strong> begins tomorrow! Here is everything you need to know.</p>
                    <div class="card">
                        <div class="info-row"><span class="label">Check-in</span><span class="value">${escapeHtml(data.checkIn)}</span></div>
                        <div class="info-row"><span class="label">Address</span><span class="value">${escapeHtml(data.address)}</span></div>
                        <div class="info-row"><span class="label">Host</span><span class="value">${escapeHtml(data.hostName)}</span></div>
                    </div>
                    `,
                    data.link,
                    'View Trip Details'
                )
            };

        case 'review_reminder':
            return {
                subject: `How was your stay at ${escapeHtml(data.itemTitle)}?`,
                html: getHtmlTemplate(
                    'Welcome Back!',
                    `
                    <p style="font-size: 16px;">Hi ${escapeHtml(data.guestName)},</p>
                    <p>We hope you had a wonderful time at <strong>${escapeHtml(data.itemTitle)}</strong>. Would you mind sharing your experience?</p>
                    <p>Your review helps other travelers and supports your host.</p>
                    `,
                    data.link,
                    'Leave a Review'
                )
            };

        case 'new_chat_message':
            return {
                subject: `💬 New message from ${escapeHtml(data.senderName)}`,
                html: getHtmlTemplate(
                    'New Message',
                    `
                    <p style="font-size: 16px;">You have a new unread message from <strong>${escapeHtml(data.senderName)}</strong>.</p>
                     <div class="card">
                        <div class="quote" style="margin:0">"${escapeHtml(data.messagePreview)}..."</div>
                    </div>
                    `,
                    data.link,
                    'Reply Now'
                )
            };

        case 'payout_processed':
            return {
                subject: `💰 Payout Processed: €${escapeHtml(data.amount)}`,
                html: getHtmlTemplate(
                    'Payout Sent',
                    `
                    <p style="font-size: 16px;">Good news! We've sent a payout of <strong>€${escapeHtml(data.amount)}</strong> to your account.</p>
                    <div class="card">
                        <div class="info-row"><span class="label">Amount</span><span class="value price-value">€${escapeHtml(data.amount)}</span></div>
                        <div class="info-row"><span class="label">Reference</span><span class="value">${escapeHtml(data.reference) || 'N/A'}</span></div>
                        <div class="info-row"><span class="label">Date</span><span class="value">${new Date().toLocaleDateString()}</span></div>
                    </div>
                    <p style="text-align: center; font-size: 13px; color: #64748b;">Funds typically arrive within 1-3 business days.</p>
                    `,
                    data.link,
                    'View Wallet'
                )
            };

        case 'refund_processed':
            return {
                subject: `Refund Processed: €${escapeHtml(data.amount)}`,
                html: getHtmlTemplate(
                    'Refund Issued',
                    `
                    <p style="font-size: 16px;">We have processed a refund of <strong>€${escapeHtml(data.amount)}</strong> for your booking at ${escapeHtml(data.itemTitle)}.</p>
                    <div class="card">
                         <div class="info-row"><span class="label">Amount</span><span class="value">€${escapeHtml(data.amount)}</span></div>
                    </div>
                    <p style="font-size: 14px; text-align: center; color: #64748b;">It may take 5-10 days for the credit to appear on your statement.</p>
                    `,
                    data.link,
                    'View Account'
                )
            };

        case 'new_review':
            return {
                subject: `⭐ New Review for ${escapeHtml(data.itemTitle)}`,
                html: getHtmlTemplate(
                    'New Review Received',
                    `
                    <p style="font-size: 16px;">You received a new review from <strong>${escapeHtml(data.guestName)}</strong>.</p>
                    <div class="card" style="text-align: center;">
                         <div style="color: #fbbf24; font-size: 24px; margin-bottom: 12px; text-align: center;">
                            ${"★".repeat(Math.round(Number(data.rating) || 5))} <span style="color:#334155; font-size: 16px; font-weight:600">(${escapeHtml(data.rating)}/5)</span>
                         </div>
                         <div class="quote" style="text-align: left; background: transparent; border: none; padding: 0;">"${escapeHtml(data.comment)}"</div>
                         <p style="margin-top: 16px; font-size: 14px; color: #64748b;">— ${escapeHtml(data.guestName)}</p>
                    </div>
                    `,
                    data.link,
                    'Read Review'
                )
            };

        // --- Admin/System ---
        case 'admin_contact_message':
            return {
                subject: `📩 New Contact Message: ${escapeHtml(data.subject)}`,
                html: getHtmlTemplate(
                    'New Message',
                    `
                    <p style="font-size: 16px;">You received a new message via the contact form.</p>
                    <div class="card">
                        <div class="info-row"><span class="label">From</span><span class="value">${escapeHtml(data.name)} (${escapeHtml(data.email)})</span></div>
                        <div class="info-row"><span class="label">Subject</span><span class="value">${escapeHtml(data.subject)}</span></div>
                    </div>
                    <div class="quote" style="margin-top: 16px;">
                        ${escapeHtml(data.message)}
                    </div>
                    `,
                    `mailto:${encodeURIComponent(data.email || '')}`,
                    'Reply via Email'
                )
            };

        // --- Blog Submissions ---
        case 'blog_submission_received':
            return {
                subject: `📝 Blog Submission Received: ${escapeHtml(data.postTitle)}`,
                html: getHtmlTemplate(
                    'Submission Received',
                    `
                    <p style="font-size: 16px;">Thank you! Your blog post <strong>${escapeHtml(data.postTitle)}</strong> has been received.</p>
                    <div class="card">
                        <p style="text-align: center; margin: 0;">Your submission is awaiting payment confirmation. Once payment is processed, our editorial team will review your content within 3-5 business days.</p>
                    </div>
                    <p style="text-align: center; color: #64748b; font-size: 14px; margin-top: 24px;">You will receive an email once your post is reviewed and published.</p>
                    `,
                    data.link,
                    'View Blog'
                )
            };

        case 'blog_submission_approved':
            return {
                subject: `🎉 Your blog post is Live: ${escapeHtml(data.postTitle)}!`,
                html: getHtmlTemplate(
                    'Blog Post Published!',
                    `
                    <p style="font-size: 16px;">Hi ${escapeHtml(data.authorName)},</p>
                    <p>Great news! Your blog post <strong>${escapeHtml(data.postTitle)}</strong> has been approved and is now live on our website.</p>
                    <div class="card">
                         <div style="text-align: center; margin-bottom: 16px;">
                            <div style="background: #d1fae5; color: #059669; width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto;">
                                <span style="font-size: 32px;">✓</span>
                            </div>
                         </div>
                         <p style="text-align: center; font-weight: 600; color: ${HEADING_COLOR}; margin: 0;">${escapeHtml(data.postTitle)}</p>
                         <p style="text-align: center; font-size: 14px; color: #64748b; margin-top: 8px;">Now visible to all readers</p>
                    </div>
                    `,
                    data.postUrl,
                    'Read Your Post'
                )
            };

        case 'blog_submission_rejected':
            return {
                subject: `⚠️ Blog Submission Update: ${escapeHtml(data.postTitle)}`,
                html: getHtmlTemplate(
                    'Submission Review Complete',
                    `
                    <p style="font-size: 16px;">Hi ${escapeHtml(data.authorName)},</p>
                    <p>Thank you for your submission <strong>${escapeHtml(data.postTitle)}</strong>. After careful review, we are unable to publish it at this time.</p>
                     <div class="card">
                         <div class="info-row"><span class="label">Reason</span><span class="value" style="color:#ef4444">${escapeHtml(data.reason)}</span></div>
                    </div>
                    <p style="text-align: center; color: #64748b; font-size: 14px; margin-top: 24px;">You can revise your content and submit again.</p>
                    `,
                    undefined,
                    undefined,
                    true
                )
            };

        // --- Fallback ---
        default:
            return {
                subject: 'Notification from Alanya Holidays',
                html: getHtmlTemplate(
                    'Notification',
                    `<p>You have a new notification.</p>
                     <pre style="background:#f1f5f9; padding:12px; overflow-x:auto; border-radius: 8px;">${JSON.stringify(data, null, 2)}</pre>`
                )
            };
    }
}
