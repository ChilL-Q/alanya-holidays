// @ts-ignore: npm: specifiers are resolved by Deno, not tsc
import { createClient } from "npm:@supabase/supabase-js@2";
// @ts-ignore: jsr: specifiers are resolved by Deno, not tsc
import "jsr:@supabase/functions-js@^2/edge-runtime.d.ts";

const YESIM_API_URL = "https://partners-api.yesim.biz";
const YESIM_API_TOKEN = Deno.env.get("YESIM_API_TOKEN")!;
const SITE_URL = Deno.env.get("SITE_URL") || "https://alanyaholidays.com";

const ALLOWED_ORIGINS = new Set([
  SITE_URL,
  "https://alanyaholidays.com",
  "http://localhost:3000",
  "http://localhost:5173",
]);

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// Rate limits: createOrder is expensive (real money), so keep it strict
const RATE_LIMITS: Record<string, number> = {
  createOrder: 5, // 5 orders per minute per user
  getPlans: 30, // 30 plan fetches per minute per user
};

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const allowedOrigin = ALLOWED_ORIGINS.has(origin) ? origin : SITE_URL;
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
  };
}

const yesimHeaders = (): Record<string, string> => {
  if (!YESIM_API_TOKEN) return {};
  return { Authorization: `Bearer ${YESIM_API_TOKEN}` };
};

async function checkRateLimit(
  userId: string,
  action: string,
): Promise<boolean> {
  const maxRequests = RATE_LIMITS[action] ?? 10;
  const { data, error } = await supabase.rpc("check_rate_limit", {
    p_user_id: userId,
    p_function_name: `yesim-proxy:${action}`,
    p_max_requests: maxRequests,
  });
  if (error) {
    console.error("Rate limit check failed:", error);
    return false; // Fail closed on DB error to prevent abuse
  }
  return data === true;
}

interface YesimPlan {
  id: string;
  name: string;
  days: string;
  price: string;
  data: string;
  countries_included: string;
  countryIso2: string;
  operators: string;
  image: string;
  plan_type: string;
}

interface YesimOrder {
  id: string;
  iccid: string;
  qrcode: string;
  ios_tap_link?: string;
  smdp_address?: string;
  activation_code?: string;
}

const DEMO_PLANS: YesimPlan[] = [
  {
    id: "turkey_3gb",
    name: "Turkey Essential",
    days: "7",
    price: "3.50",
    data: "3",
    countries_included: "Turkey",
    countryIso2: "TR",
    operators: "Turkcell",
    image: "https://cdn.yesim.app/flags/ver/1/tr.svg",
    plan_type: "country",
  },
  {
    id: "turkey_5gb",
    name: "Turkey Standard",
    days: "15",
    price: "5.50",
    data: "5",
    countries_included: "Turkey",
    countryIso2: "TR",
    operators: "Turkcell",
    image: "https://cdn.yesim.app/flags/ver/1/tr.svg",
    plan_type: "country",
  },
  {
    id: "turkey_10gb",
    name: "Turkey Advanced",
    days: "30",
    price: "9.00",
    data: "10",
    countries_included: "Turkey",
    countryIso2: "TR",
    operators: "Turkcell",
    image: "https://cdn.yesim.app/flags/ver/1/tr.svg",
    plan_type: "country",
  },
  {
    id: "turkey_20gb",
    name: "Turkey Max",
    days: "30",
    price: "16.00",
    data: "20",
    countries_included: "Turkey",
    countryIso2: "TR",
    operators: "Turkcell",
    image: "https://cdn.yesim.app/flags/ver/1/tr.svg",
    plan_type: "country",
  },
  {
    id: "turkey_unlimited",
    name: "Turkey Unlimited",
    days: "15",
    price: "29.00",
    data: "Unlimited",
    countries_included: "Turkey",
    countryIso2: "TR",
    operators: "Turkcell",
    image: "https://cdn.yesim.app/flags/ver/1/tr.svg",
    plan_type: "country",
  },
  {
    id: "global_pass",
    name: "Global Pass",
    days: "30",
    price: "35.00",
    data: "5",
    countries_included: "Global (120+)",
    countryIso2: "GL",
    operators: "Multiple",
    image: "https://cdn.yesim.app/flags/ver/1/gl.svg",
    plan_type: "global",
  },
];

type RequestBody =
  | { action: "getPlans" }
  | { action: "createOrder"; planId?: string };

Deno.serve(async (req: Request) => {
  const cors = getCorsHeaders(req);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  try {
    const body: RequestBody = await req.json();

    if (!body?.action) {
      return new Response(JSON.stringify({ error: "Missing action field" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // getPlans is public — no auth required
    if (body.action === "getPlans") {
      return await handleGetPlans(cors);
    }

    // All other actions require authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        {
          status: 401,
          headers: { ...cors, "Content-Type": "application/json" },
        },
      );
    }

    const token = authHeader.replace(/^Bearer\s+/i, "");
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error("User verification failed:", userError);
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Rate limit check
    const allowed = await checkRateLimit(user.id, body.action);
    if (!allowed) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded. Please wait a moment and try again.",
        }),
        {
          status: 429,
          headers: {
            ...cors,
            "Content-Type": "application/json",
            "Retry-After": "60",
          },
        },
      );
    }

    // --- Route by action ---
    switch (body.action) {
      case "createOrder": {
        const planId = typeof body.planId === "string" ? body.planId.trim() : "";
        if (!planId) {
          return new Response(JSON.stringify({ error: "Missing planId" }), {
            status: 400,
            headers: { ...cors, "Content-Type": "application/json" },
          });
        }
        return await handleCreateOrder(planId, cors);
      }
      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${body.action}` }),
          {
            status: 400,
            headers: { ...cors, "Content-Type": "application/json" },
          },
        );
    }
  } catch (error: unknown) {
    console.error("yesim-proxy error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } },
    );
  }
});

async function handleGetPlans(cors: Record<string, string>): Promise<Response> {
  if (!YESIM_API_TOKEN) {
    console.warn("YESIM_API_TOKEN not configured, returning demo plans");
    return new Response(JSON.stringify({ data: DEMO_PLANS }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  try {
    const response = await fetch(`${YESIM_API_URL}/plans`, {
      headers: yesimHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Yesim API responded with status ${response.status}`);
    }

    const data = await response.json();
    return new Response(JSON.stringify({ data }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Failed to fetch Yesim plans:", error);
    return new Response(
      JSON.stringify({ error: `Failed to fetch plans: ${error instanceof Error ? error.message : String(error)}` }),
      { status: 502, headers: { ...cors, "Content-Type": "application/json" } },
    );
  }
}

async function handleCreateOrder(
  planId: string,
  cors: Record<string, string>,
): Promise<Response> {
  if (!YESIM_API_TOKEN) {
    console.warn("YESIM_API_TOKEN not configured, returning demo order");
    await new Promise((r) => setTimeout(r, 1500));
    const demoOrder: YesimOrder = {
      id: "demo-sim-123",
      iccid: "899000000000000000",
      qrcode: "LPA:1$smdp.io$DEMO-ACTIVATION-CODE",
      ios_tap_link:
        "https://esimsetup.apple.com/esim_qrcode_provisioning?carddata=LPA:1$smdp.io$DEMO-ACTIVATION-CODE",
    };
    return new Response(JSON.stringify({ data: demoOrder }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  try {
    // 1. Create a new eSIM
    const simResponse = await fetch(`${YESIM_API_URL}/new_esim`, {
      headers: yesimHeaders(),
    });

    if (!simResponse.ok) {
      throw new Error(`Yesim API responded with status ${simResponse.status}`);
    }

    const simData = await simResponse.json();

    if (simData.status === "error") {
      throw new Error(simData.message || "Failed to create eSIM");
    }

    const { iccid, id: simId } = simData;

    // 2. Activate the plan on this eSIM
    const paymentId = `ORD-${Date.now()}`;
    const activationUrl = new URL(`${YESIM_API_URL}/add_plan_iccid`);
    activationUrl.searchParams.set("iccid", iccid);
    activationUrl.searchParams.set("plan_id", planId);
    activationUrl.searchParams.set("payment_id", paymentId);

    const activationResponse = await fetch(activationUrl.toString(), {
      method: "POST",
      headers: yesimHeaders(),
    });

    if (!activationResponse.ok) {
      throw new Error(
        `Yesim API responded with status ${activationResponse.status}`,
      );
    }

    const activationData = await activationResponse.json();

    if (activationData.status !== "success") {
      throw new Error(activationData.description || "Failed to activate plan");
    }

    // 3. Get eSIM details to return QR code
    const detailsUrl = new URL(`${YESIM_API_URL}/sim_info`);
    detailsUrl.searchParams.set("iccid", iccid);

    const detailsResponse = await fetch(detailsUrl.toString(), {
      headers: yesimHeaders(),
    });

    if (!detailsResponse.ok) {
      throw new Error(
        `Yesim API responded with status ${detailsResponse.status}`,
      );
    }

    const detailsData = await detailsResponse.json();

    const order: YesimOrder = {
      id: simId,
      iccid,
      qrcode: detailsData.qrcode,
      ios_tap_link: detailsData.ios_tap_link,
    };

    return new Response(JSON.stringify({ data: order }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Yesim Order Failed:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Order creation failed" }),
      { status: 502, headers: { ...cors, "Content-Type": "application/json" } },
    );
  }
}
