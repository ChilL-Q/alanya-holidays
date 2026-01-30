
import { writeFileSync } from 'node:fs';

const BRAND_COLOR = '#05445E'; // Deep Petrol Blue (from index.css)
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
    .rating { color: #fbbf24; font-size: 24px; margin-bottom: 8px; }
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

// --- Sample Data ---
const samples = [
  {
    title: 'Listing Approved',
    type: 'listing_approved',
    data: { title: 'Luxury Villa with Sea View', link: '#' },
    content: (data: any) => `
      <p style="font-size: 16px; margin-bottom: 24px;">Congratulations! Your property description and photos have been verified by our team.</p>
      <div class="card">
         <div style="text-align: center; margin-bottom: 16px;">
            <div style="background: #d1fae5; color: #059669; width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto;">
                <span style="font-size: 32px;">✓</span>
            </div>
         </div>
         <p style="text-align: center; font-weight: 600; color: ${HEADING_COLOR}; margin: 0;">${data.title} is now Live</p>
         <p style="text-align: center; font-size: 14px; color: #64748b; margin-top: 8px;">Visible to thousands of travelers</p>
      </div>
    `
  },
  {
    title: 'New Booking Request',
    type: 'booking_request',
    data: { itemTitle: 'Sunny Apartment', guestName: 'Alice Smith', checkIn: '12 Oct', checkOut: '19 Oct', guests: 2, totalPrice: 850, message: "We love your place! Is it quiet at night?" },
    content: (data: any) => `
      <p style="font-size: 16px;">Good news! <strong>${data.guestName}</strong> wants to book your property.</p>
      <div class="card">
        <div class="info-row"><span class="label">Property</span><span class="value">${data.itemTitle}</span></div>
        <div class="info-row"><span class="label">Dates</span><span class="value">${data.checkIn} — ${data.checkOut}</span></div>
        <div class="info-row"><span class="label">Guests</span><span class="value">${data.guests} Adults</span></div>
        <div class="info-row"><span class="label">Total Payout</span><span class="value price-value">€${data.totalPrice}</span></div>
      </div>
      ${data.message ? `<p class="label" style="margin-bottom: 8px;">Message from guest:</p><div class="quote">"${data.message}"</div>` : ''}
      <p style="font-size: 14px; color: #64748b; text-align: center; margin-top: 24px;">Please respond within 24 hours to maintain your Superhost status.</p>
    `,
    action: 'Accept or Decline'
  },
  {
    title: 'New 5-Star Review!',
    type: 'new_review',
    data: { itemTitle: 'Mountain Cabin', guestName: 'John Doe', rating: 5, comment: "Absolutely stunning views and the host was incredibly helpful. The kitchen was fully stocked. We will definitely come back next year!", link: '#' },
    content: (data: any) => `
      <p style="font-size: 16px;">You received a glowing review from <strong>${data.guestName}</strong>.</p>
      <div class="card" style="text-align: center;">
         <div class="rating">★★★★★</div>
         <div class="quote" style="text-align: left; background: transparent; border: none; padding: 0;">"${data.comment}"</div>
         <p style="margin-top: 16px; font-size: 14px; color: #64748b;">— ${data.guestName} stayed at <span style="font-weight: 600; color: ${HEADING_COLOR}">${data.itemTitle}</span></p>
      </div>
    `,
    action: 'Reply to Review'
  }
];

// Generate Full HTML
let fullHtml = `<html><head><title>Email Previews</title><style>body { background: #333; padding: 40px; font-family: sans-serif; } .preview-wrapper { margin-bottom: 80px; position: relative; } .preview-label { color: white; font-size: 20px; margin-bottom: 10px; font-weight: bold; } iframe { width: 100%; height: 800px; border: none; background: white; border-radius: 8px; }</style></head><body>`;

samples.forEach(sample => {
  const emailHtml = getHtmlTemplate(sample.title, sample.content(sample.data), '#', sample.action);
  // Encode content for iframe srcdoc
  const safeHtml = emailHtml.replace(/"/g, '&quot;');
  
  fullHtml += `
    <div class="preview-wrapper">
        <div class="preview-label">${sample.title}</div>
        <div style="background: white; max-width: 800px; margin: 0 auto; border-radius: 8px; overflow: hidden;">
            ${emailHtml}
        </div>
    </div>
  `;
});

fullHtml += `</body></html>`;

writeFileSync('preview_emails.html', fullHtml);
console.log('Preview generated at preview_emails.html');
