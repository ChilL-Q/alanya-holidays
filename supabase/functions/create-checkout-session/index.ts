
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.10.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { items, userId, email, origin } = await req.json();

    // Validate request
    if (!items || !Array.isArray(items) || items.length === 0) {
        throw new Error("Missing items in checkout request");
    }

    // Security Fix: Validate Origin to prevent open redirect vulnerability
    const allowedOrigins = Deno.env.get("ALLOWED_ORIGINS")?.split(",") || [];
    // If ALLOWED_ORIGINS is not set, we default to a safe-ish check or just log a warning in dev
    if (allowedOrigins.length > 0 && !allowedOrigins.includes(origin)) {
        console.error(`Blocked unauthorized origin: ${origin}`);
        throw new Error("Unauthorized origin");
    } else if (allowedOrigins.length === 0) {
        console.warn("ALLOWED_ORIGINS not set. Skipping origin validation - this is a security risk in production.");
    }

    // Prepare Line Items
    const line_items = items.map((item: any) => ({
      price_data: {
        currency: "eur",
        product_data: {
          name: item.title,
          images: item.image ? [item.image] : [],
          metadata: {
              listingId: item.listingId,
              bookingId: item.bookingId // Link each line item to its booking
          }
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: 1,
    }));

    // Collect Booking IDs for metadata
    const bookingIds = items.map((i: any) => i.bookingId).join(',');

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      success_url: `${origin}/booking/success?session_id={CHECKOUT_SESSION_ID}`, // We'll verify session to get booking IDs
      cancel_url: `${origin}/checkout?canceled=true`,
      customer_email: email,
      metadata: {
        bookingIds: bookingIds, // comma separated
        userId: userId,
        type: 'booking_payment'
      },
    });

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
