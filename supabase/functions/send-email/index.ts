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

function generateEmailContent(type: string, data: any): { subject: string, html: string } {
    const styles = `
      body { font-family: sans-serif; color: #333; line-height: 1.6; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; }
      .header { background: #0d9488; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
      .content { padding: 20px; }
      .footer { text-align: center; font-size: 12px; color: #999; margin-top: 20px; }
      .btn { display: inline-block; background: #0d9488; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px; }
      .details { background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0; }
    `;

    const wrapper = (title: string, body: string) => `
      <!DOCTYPE html>
      <html>
      <head><style>${styles}</style></head>
      <body>
        <div class="container">
          <div class="header"><h1>${title}</h1></div>
          <div class="content">${body}</div>
          <div class="footer">Alanya Holidays • Best Rentals in Turkey</div>
        </div>
      </body>
      </html>
    `;

    switch (type) {
        case 'booking_request_host':
            return {
                subject: `Action Required: New Booking Request for ${data.itemTitle}`,
                html: wrapper('New Booking Request', `
                    <p>You have a new booking request from <strong>${data.guestName}</strong>!</p>
                    <div class="details">
                        <p><strong>Property:</strong> ${data.itemTitle}</p>
                        <p><strong>Dates:</strong> ${data.checkIn} - ${data.checkOut}</p>
                        <p><strong>Guests:</strong> ${data.guests}</p>
                        <p><strong>Total Payout:</strong> €${data.totalPrice}</p>
                        ${data.message ? `<div style="margin-top: 10px; padding: 10px; background-color: #f1f5f9; border-radius: 5px;"><strong>Message:</strong> <i>"${data.message}"</i></div>` : ''}
                    </div>
                    <p>Please review and accept or decline this request within 24 hours.</p>
                    <a href="${data.link || '#'}" class="btn">Manage Booking</a>
                `)
            };

        case 'booking_cancelled_host':
            return {
                subject: `Booking Cancelled: ${data.itemTitle}`,
                html: wrapper('Booking Cancelled', `
                    <p>The booking for <strong>${data.itemTitle}</strong> has been cancelled by the guest.</p>
                    <div class="details">
                        <p><strong>Guest:</strong> ${data.guestName}</p>
                        <p><strong>Dates:</strong> ${data.checkIn} - ${data.checkOut}</p>
                    </div>
                    <p>Your calendar has been automatically updated.</p>
                    <a href="${data.link || '#'}" class="btn">View Calendar</a>
                `)
            };

        case 'booking_expired_guest':
            return {
                subject: `Booking Request Expired: ${data.itemTitle}`,
                html: wrapper('Request Expired', `
                    <p>Your booking request for <strong>${data.itemTitle}</strong> has expired because it wasn't confirmed within 24 hours.</p>
                    <p>No charge has been made.</p>
                    <a href="${data.link || '#'}" class="btn">Find Another Property</a>
                `)
            };

        case 'booking_expired_host':
            return {
                subject: `Request Expired: ${data.itemTitle}`,
                html: wrapper('Request Expired', `
                    <p>The booking request from <strong>${data.guestName}</strong> has expired.</p>
                    <p>You missed the 24-hour window to accept or decline.</p>
                    <p>The dates have been unblocked.</p>
                `)
            };

        case 'booking_created':
            return {
                subject: `Booking Request: ${data.itemTitle}`,
                html: wrapper('Booking Request Received', `
                    <p>Hi ${data.userName || 'there'},</p>
                    <p>We have received your booking request for <strong>${data.itemTitle}</strong>.</p>
                    <div class="details">
                        <p><strong>Check-in:</strong> ${data.checkIn}</p>
                        <p><strong>Check-out:</strong> ${data.checkOut}</p>
                        <p><strong>Total Price:</strong> €${data.totalPrice}</p>
                        <p><strong>Guests:</strong> ${data.guests}</p>
                    </div>
                    <p>The host will review your request shortly. You will receive another email once verified.</p>
                    <a href="${data.link || '#'}" class="btn">View Booking</a>
                `)
            };

        case 'booking_confirmed':
            return {
                subject: `Booking Confirmed: ${data.itemTitle}`,
                html: wrapper('You are going to Alanya!', `
                    <p>Great news! Your booking for <strong>${data.itemTitle}</strong> has been confirmed.</p>
                    <div class="details">
                        <p><strong>Dates:</strong> ${data.checkIn} - ${data.checkOut}</p>
                        <p><strong>Address:</strong> ${data.address || 'Check details in app'}</p>
                    </div>
                    <p>Get ready for your trip!</p>
                    <a href="${data.link || '#'}" class="btn">View Trip Details</a>
                `)
            };

        case 'booking_rejected':
            return {
                subject: `Update on your booking for ${data.itemTitle}`,
                html: wrapper('Booking Declined', `
                    <p>We're sorry, but your booking request for <strong>${data.itemTitle}</strong> could not be accepted at this time.</p>
                    <p><strong>Reason:</strong> ${data.reason || 'Dates unavailable or other reason'}</p>
                    <p>No charges have been made.</p>
                    <a href="${data.searchLink || '#'}" class="btn">Search Other Properties</a>
                `)
            };
        
        case 'listing_approved':
            return {
                 subject: `Your property is Live!`,
                 html: wrapper('Listing Approved', `
                    <p>Congratulations! Your property <strong>${data.title}</strong> has been approved by our team.</p>
                    <p>It is now visible to thousands of travelers.</p>
                    <a href="${data.link || '#'}" class="btn">View Listing</a>
                 `)
            };

        case 'listing_rejected':
            return {
                 subject: `Action Required: ${data.title}`,
                 html: wrapper('Listing Returned', `
                    <p>Your property <strong>${data.title}</strong> was not approved for publishing.</p>
                    <p><strong>Reason:</strong> ${data.reason}</p>
                    <p>Please update your listing and submit again.</p>
                 `)
            };

        case 'new_review':
             return {
                 subject: `New Review for ${data.itemTitle}`,
                 html: wrapper('New 5-Star Review!', `
                    <p>You received a new review from <strong>${data.guestName}</strong>.</p>
                    <div class="details">
                        <p><i>"${data.comment}"</i></p>
                        <p>Rating: ${data.rating}/5</p>
                    </div>
                    <a href="${data.link || '#'}" class="btn">Read Review</a>
                 `)
             };

        case 'listing_deleted':
             return {
                 subject: `Property Removed: ${data.title}`,
                 html: wrapper('Listing Deleted', `
                    <p>Your property <strong>${data.title}</strong> has been removed from Alanya Holidays.</p>
                    <p><strong>Reason:</strong> ${data.reason || 'Administrative action'}</p>
                    <p>If you believe this is a mistake, please contact support.</p>
                 `)
             };

        case 'admin_contact_message':
            return {
                subject: `New Contact Message: ${data.subject}`,
                html: wrapper('New Message Received', `
                    <p>You received a new message via the contact form.</p>
                    <div class="details">
                        <p><strong>From:</strong> ${data.name} (${data.email})</p>
                        <p><strong>Subject:</strong> ${data.subject}</p>
                        <p><strong>Message:</strong></p>
                        <p>${data.message}</p>
                    </div>
                    <a href="mailto:${data.email}" class="btn">Reply via Email</a>
                `)
            };

        case 'welcome_email':
            return {
                subject: `Welcome to Alanya Holidays!`,
                html: wrapper('Welcome Aboard!', `
                    <p>Hi ${data.name},</p>
                    <p>Welcome to Alanya Holidays! We're thrilled to have you join our community.</p>
                    <p>Whether you're looking for a dream villa, a car for your trip, or an unforgettable tour, we've got you covered.</p>
                    <div class="details">
                        <p>Check out our latest listings:</p>
                        <ul>
                            <li><a href="${data.url}/stays">Stays</a></li>
                            <li><a href="${data.url}/services/car-rental">Car Rentals</a></li>
                            <li><a href="${data.url}/services/tours">Tours & Activities</a></li>
                        </ul>
                    </div>
                    <a href="${data.url}" class="btn">Start Exploring</a>
                `)
            };

        default:
            return {
                subject: 'Notification from Alanya Holidays',
                html: wrapper('Notification', `<p>${JSON.stringify(data)}</p>`)
            };
    }
}
