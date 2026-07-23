const SITE_URL = Deno.env.get('SITE_URL') || 'https://alanyaholidays.com'

/**
 * Common CORS headers for Edge Functions.
 * Dynamically matches request origin for local development (http://localhost:*, http://127.0.0.1:*),
 * production domains (*.alanyaholidays.com), and falls back to request origin or '*' for API clients.
 */
export function getCorsHeaders(req?: Request): Record<string, string> {
  const origin = req?.headers?.get('origin') || req?.headers?.get('Origin')

  let allowedOrigin = origin || '*'
  if (origin) {
    const isLocalhost = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
    const isAllowedDomain =
      origin === SITE_URL ||
      origin === 'https://alanyaholidays.com' ||
      origin.endsWith('.alanyaholidays.com')

    if (isLocalhost || isAllowedDomain) {
      allowedOrigin = origin
    } else {
      // Fallback: reflect request origin for preview deployments / dev environments
      allowedOrigin = origin
    }
  }

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type, x-cron-secret',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
  }
}

export const corsHeaders = getCorsHeaders()
