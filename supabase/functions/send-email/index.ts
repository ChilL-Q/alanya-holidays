import { createClient } from "npm:@supabase/supabase-js@2"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailPayload {
  to?: string;

  userId?: string;
  type: 'booking_created' | 'booking_confirmed' | 'booking_rejected' | 'booking_cancelled' | 'listing_approved' | 'listing_rejected' | 'new_review' | 'listing_deleted' | 'booking_request_host' | 'booking_cancelled_host' | 'booking_expired_guest' | 'booking_expired_host' | 'admin_contact_message' | 'welcome_email';
  data: any; // Dynamic data for templates
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, userId, type, data }: EmailPayload = await req.json()

    if (!RESEND_API_KEY) throw new Error('Missing RESEND_API_KEY')
    if (!type) throw new Error('Missing email type')

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
    const { subject, html } = generateEmailContent(type, data);

    console.log(`Sending '${type}' email to: ${targetEmail}`)

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Alanya Holidays <onboarding@resend.dev>', // TODO: Change to verified domain in prod
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
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})

// --- Email Template Helpers ---

const BRAND_COLOR = '#0d9488'; // Teal-600
const BG_COLOR = '#f8fafc'; // Slate-50
const CONTAINER_BG = '#ffffff';
const TEXT_COLOR = '#334155'; // Slate-700
const LOGO_URL = 'https://placehold.co/200x50/0d9488/ffffff?text=Alanya+Holidays'; // Placeholder for dev

const getHtmlTemplate = (title: string, content: string, actionLink?: string, actionText?: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: ${BG_COLOR}; margin: 0; padding: 0; color: ${TEXT_COLOR}; line-height: 1.6; }
    .container { max-width: 600px; margin: 40px auto; background-color: ${CONTAINER_BG}; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
    .header { background-color: #ffffff; padding: 24px; text-align: center; border-bottom: 1px solid #e2e8f0; }
    .logo { height: 40px; }
    .hero { background-color: ${BRAND_COLOR}; padding: 32px 24px; text-align: center; color: white; }
    .hero h1 { margin: 0; font-size: 24px; font-weight: 600; letter-spacing: -0.5px; }
    .content { padding: 32px 24px; }
    .info-table { width: 100%; border-collapse: separate; border-spacing: 0; margin: 24px 0; background: #f1f5f9; border-radius: 12px; overflow: hidden; }
    .info-table td { padding: 12px 16px; border-bottom: 1px solid #e2e8f0; }
    .info-table tr:last-child td { border-bottom: none; }
    .label { font-weight: 600; color: ${TEXT_COLOR}; width: 120px; }
    .value { color: #0f172a; }
    .btn-container { text-align: center; margin-top: 32px; margin-bottom: 16px; }
    .btn { display: inline-block; background-color: ${BRAND_COLOR}; color: white !important; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 50px; transition: background 0.2s; box-shadow: 0 4px 6px -1px rgba(13, 148, 136, 0.4); }
    .footer { background-color: #f1f5f9; padding: 24px; text-align: center; font-size: 13px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
    .footer a { color: ${BRAND_COLOR}; text-decoration: none; }
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
      <p>&copy; ${new Date().getFullYear()} Alanya Holidays. All rights reserved.</p>
      <p>Turkey, Alanya • <a href="#">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>
`;

function generateEmailContent(type: string, data: any): { subject: string, html: string } {
    switch (type) {
        // --- Host Notifications ---
        case 'booking_request_host':
            return {
                subject: `🔔 New Booking Request: ${data.itemTitle}`,
                html: getHtmlTemplate(
                    'New Booking Request',
                    `
                    <p>Good news! You have received a new booking request from <strong>${data.guestName}</strong>.</p>
                    <table class="info-table">
                        <tr><td class="label">Property</td><td class="value">${data.itemTitle}</td></tr>
                        <tr><td class="label">Dates</td><td class="value">${data.checkIn} — ${data.checkOut}</td></tr>
                        <tr><td class="label">Guests</td><td class="value">${data.guests}</td></tr>
                        <tr><td class="label">Total Payout</td><td class="value" style="font-weight:bold; color: ${BRAND_COLOR}">€${data.totalPrice}</td></tr>
                        ${data.message ? `<tr><td class="label">Message</td><td class="value">"${data.message}"</td></tr>` : ''}
                    </table>
                    <p>Please review and accept or decline this request within 24 hours to maintain your response rate.</p>
                    `,
                    data.link,
                    'Manage Booking'
                )
            };

        case 'booking_cancelled_host':
            return {
                subject: `❌ Booking Cancelled: ${data.itemTitle}`,
                html: getHtmlTemplate(
                    'Booking Cancelled',
                    `
                    <p>The booking for <strong>${data.itemTitle}</strong> has been cancelled by the guest.</p>
                    <table class="info-table">
                        <tr><td class="label">Guest</td><td class="value">${data.guestName}</td></tr>
                        <tr><td class="label">Dates</td><td class="value">${data.checkIn} — ${data.checkOut}</td></tr>
                    </table>
                    <p>Your calendar has been automatically updated and the dates are now available for new bookings.</p>
                    `,
                    data.link,
                    'View Calendar'
                )
            };

        case 'booking_expired_host':
            return {
                subject: `⏳ Request Expired: ${data.itemTitle}`,
                html: getHtmlTemplate(
                    'Request Expired',
                    `
                    <p>The booking request from <strong>${data.guestName}</strong> has expired because no action was taken within 24 hours.</p>
                    <table class="info-table">
                        <tr><td class="label">Property</td><td class="value">${data.itemTitle}</td></tr>
                         <tr><td class="label">Dates</td><td class="value">${data.checkIn} — ${data.checkOut}</td></tr>
                    </table>
                    <p>The dates have been unblocked on your calendar.</p>
                    `,
                    data.link,
                    'View Dashboard'
                )
            };

        // --- Guest Notifications ---
        case 'booking_created':
            return {
                subject: `🕒 Booking Request Sent: ${data.itemTitle}`,
                html: getHtmlTemplate(
                    'Request Sent',
                    `
                    <p>Hi ${data.userName || 'there'},</p>
                    <p>We've received your request! The host has 24 hours to accept your booking.</p>
                    <table class="info-table">
                        <tr><td class="label">Property</td><td class="value">${data.itemTitle}</td></tr>
                        <tr><td class="label">Dates</td><td class="value">${data.checkIn} — ${data.checkOut}</td></tr>
                        <tr><td class="label">Total Price</td><td class="value" style="font-weight:bold">€${data.totalPrice}</td></tr>
                    </table>
                    <p>You won't be charged until the host accepts your request.</p>
                    `,
                    data.link,
                    'View Booking'
                )
            };

        case 'booking_confirmed':
            return {
                subject: `✅ Booking Confirmed: ${data.itemTitle}!`,
                html: getHtmlTemplate(
                    'Booking Confirmed!',
                    `
                    <p>Your trip is on! Your booking for <strong>${data.itemTitle}</strong> is confirmed.</p>
                    <table class="info-table">
                        <tr><td class="label">Dates</td><td class="value">${data.checkIn} — ${data.checkOut}</td></tr>
                        <tr><td class="label">Address</td><td class="value">${data.address || 'Check details in app'}</td></tr>
                        <tr><td class="label">Guests</td><td class="value">${data.guests}</td></tr>
                    </table>
                    <p>Get ready for an amazing stay in Alanya!</p>
                    `,
                    data.link,
                    'View Trip Details'
                )
            };

        case 'booking_rejected':
            return {
                subject: `⛔ Update on your booking for ${data.itemTitle}`,
                html: getHtmlTemplate(
                    'Booking Declined',
                    `
                    <p>We're sorry, but your booking request for <strong>${data.itemTitle}</strong> could not be accepted at this time.</p>
                    <table class="info-table">
                         <tr><td class="label">Reason</td><td class="value">${data.reason || 'Dates unavailable'}</td></tr>
                    </table>
                    <p>No charges have been made. You can find many other great properties for your dates.</p>
                    `,
                    data.searchLink,
                    'Search Properties'
                )
            };

        case 'booking_expired_guest':
            return {
                subject: `⏳ Request Expired: ${data.itemTitle}`,
                html: getHtmlTemplate(
                    'Request Expired',
                    `
                    <p>Your booking request for <strong>${data.itemTitle}</strong> has expired because the host didn't respond within 24 hours.</p>
                    <p>No charge has been made. Please try booking another property.</p>
                    `,
                    data.link,
                    'Find Another Stay'
                )
            };

        // --- Listings & Reviews ---
        case 'listing_approved':
            return {
                subject: `🎉 Your property is Live!`,
                html: getHtmlTemplate(
                    'Listing Published',
                    `
                    <p>Congratulations! Your property <strong>${data.title}</strong> has been approved by our team.</p>
                    <p>It is now visible to thousands of travelers searching for their next holiday.</p>
                    `,
                    data.link,
                    'View Listing'
                )
            };

        case 'listing_rejected':
            return {
                subject: `⚠️ Action Required: ${data.title}`,
                html: getHtmlTemplate(
                    'Listing Returned',
                    `
                    <p>Your property <strong>${data.title}</strong> needs some changes before it can be published.</p>
                    <table class="info-table">
                         <tr><td class="label">Reason</td><td class="value" style="color:#ef4444">${data.reason}</td></tr>
                    </table>
                    <p>Please update your listing based on this feedback and submit it again.</p>
                    `,
                    data.link,
                    'Edit Listing'
                )
            };

        case 'new_review':
            return {
                subject: `⭐ New Review for ${data.itemTitle}`,
                html: getHtmlTemplate(
                    'New Review Received',
                    `
                    <p>You received a new review from <strong>${data.guestName}</strong>.</p>
                    <div style="background: #f8fafc; padding: 16px; border-left: 4px solid ${BRAND_COLOR}; margin: 16px 0; font-style: italic;">
                        "${data.comment}"
                    </div>
                    <p><strong>Rating:</strong> ${data.rating}/5</p>
                    `,
                    data.link,
                    'Read Review'
                )
            };

        // --- Admin/System ---
        case 'admin_contact_message':
            return {
                subject: `📩 New Contact Message: ${data.subject}`,
                html: getHtmlTemplate(
                    'New Message',
                    `
                    <p>You received a new message via the contact form.</p>
                    <table class="info-table">
                        <tr><td class="label">From</td><td class="value">${data.name} (${data.email})</td></tr>
                        <tr><td class="label">Subject</td><td class="value">${data.subject}</td></tr>
                    </table>
                    <p><strong>Message:</strong></p>
                    <div style="background: #f1f5f9; padding: 16px; border-radius: 8px;">${data.message}</div>
                    `,
                    `mailto:${data.email}`,
                    'Reply via Email'
                )
            };

        // --- Fallback ---
        default:
            return {
                subject: 'Notification from Alanya Holidays',
                html: getHtmlTemplate(
                    'Notification',
                    `<p>You have a new notification.</p>
                     <pre style="background:#f1f5f9; padding:12px; overflow-x:auto;">${JSON.stringify(data, null, 2)}</pre>`
                )
            };
    }
}
