
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import Stripe from "https://esm.sh/stripe@14.10.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

const cryptoProvider = Stripe.createSubtleCryptoProvider();

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const signature = req.headers.get("Stripe-Signature");
  if (!signature) {
    return new Response("No signature header", { status: 400 });
  }

  try {
    const body = await req.text();
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      stripeWebhookSecret,
      undefined,
      cryptoProvider // Needed for Deno environment
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const bookingIdsString = session.metadata?.bookingIds;
      const paymentIntentId = session.payment_intent as string;

      if (bookingIdsString) {
        const bookingIds = bookingIdsString.split(",");

        console.log(`Processing payout for bookings: ${bookingIds.join(", ")}`);

        // Calculate Commission (Example: 10%)
        // In a real app, we might fetch the specific percentage from config or listing
        const COMMISSION_RATE = 0.10;

        // Fetch bookings to get prices
        const { data: bookings } = await supabase
            .from('bookings')
            .select('id, total_price')
            .in('id', bookingIds);

        if (bookings) {
            for (const booking of bookings) {
                const total = booking.total_price || 0;
                const commission = total * COMMISSION_RATE;
                const hostPayout = total - commission;

                await supabase
                    .from("bookings")
                    .update({
                        status: "confirmed",
                        payment_status: "paid",
                        payment_intent_id: paymentIntentId,
                        payout_status: "pending", // Ready for manual payout logic
                        commission_amount: commission,
                        host_payout_amount: hostPayout,
                        payout_due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24h hold
                    })
                    .eq("id", booking.id);
            }
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }
});
