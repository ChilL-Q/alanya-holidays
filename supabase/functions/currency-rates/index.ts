// Currency rates proxy — fetches from frankfurter.app server-side, caches for 1 hour
// Browser → Edge Function → frankfurter.app (CORS controlled by us, no JWT required)

// @ts-ignore: jsr: specifiers are resolved by Deno, not tsc
import "jsr:@supabase/functions-js@^2/edge-runtime.d.ts"

const SITE_URL = Deno.env.get("SITE_URL") || "https://alanyaholidays.com";
const ALLOWED_ORIGINS = new Set([
    SITE_URL,
    "https://alanyaholidays.com",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:3003",
]);

// In-memory cache — lives as long as the function instance is warm
let ratesCache: { rates: Record<string, number>; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function getCorsHeaders(req: Request) {
    const origin = req.headers.get("origin") || "";
    const allowedOrigin = ALLOWED_ORIGINS.has(origin) ? origin : SITE_URL;
    return {
        "Access-Control-Allow-Origin": allowedOrigin,
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    };
}

Deno.serve(async (req: Request) => {
    const cors = getCorsHeaders(req);

    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: cors });
    }

    if (req.method !== "GET") {
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
            status: 405,
            headers: { ...cors, "Content-Type": "application/json" },
        });
    }

    // Require anon key OR auth header — either is sufficient for public access
    const apikey = req.headers.get("apikey");
    if (!apikey && !req.headers.get("authorization")) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { ...cors, "Content-Type": "application/json" },
        });
    }

    // Return cached rates if fresh
    if (ratesCache && Date.now() - ratesCache.fetchedAt < CACHE_TTL_MS) {
        return new Response(JSON.stringify(ratesCache.rates), {
            headers: { ...cors, "Content-Type": "application/json", "X-Cache": "HIT" },
        });
    }

    try {
        const res = await fetch("https://api.frankfurter.app/latest?from=EUR&to=USD,TRY");
        if (!res.ok) throw new Error(`Frankfurter responded with ${res.status}`);
        const json = await res.json();

        const rates = { EUR: 1, USD: json.rates.USD, TRY: json.rates.TRY };
        ratesCache = { rates, fetchedAt: Date.now() };

        return new Response(JSON.stringify(rates), {
            headers: { ...cors, "Content-Type": "application/json", "X-Cache": "MISS" },
        });
    } catch (error: unknown) {
        console.error("Failed to fetch currency rates:", error instanceof Error ? error.message : String(error));
        return new Response(JSON.stringify({ error: "Failed to fetch rates" }), {
            status: 502,
            headers: { ...cors, "Content-Type": "application/json" },
        });
    }
});