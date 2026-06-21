// @ts-ignore: npm: specifiers are resolved by Deno, not tsc
import { createClient } from 'npm:@supabase/supabase-js@2'

// @ts-ignore: jsr: specifiers are resolved by Deno, not tsc
import "jsr:@supabase/functions-js@^2/edge-runtime.d.ts"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const CRON_SECRET = Deno.env.get('CRON_SECRET')!

const BASE_URL = Deno.env.get('SITE_URL') ?? 'https://alanya-holidays.com'

const CATEGORY_PATHS: Record<string, string> = {
  'medical':        '/medical-tourism-alanya',
  'accommodations': '/alanya-hotels',
  'villas':         '/alanya-villas',
  'apartments':     '/alanya-apartments',
  'tours':          '/things-to-do-in-alanya',
  'transport':      '/airport-transfer',
  'restaurants':    '/restaurants',
  'cafes':          '/cafes',
  'real-estate':    '/alanya-real-estate',
  'visa':           '/alanya-residency-guide',
  'shopping':       '/alanya-shopping-guide',
  'nature':         '/alanya-nature-attractions',
  'weather':        '/alanya-weather',
  'nightlife':      '/nightlife',
  'spa-hamam':      '/alanya-spa-hamam',
  'hair-beauty':    '/alanya-hair-beauty',
}

interface SitemapUrl {
  loc: string
  lastmod?: string
  changefreq: string
  priority: string
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function buildSitemap(urls: SitemapUrl[]): string {
  const xmlUrls = urls
    .map((u) => {
      const lastmod = u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''
      return `  <url>\n    <loc>${escapeXml(u.loc)}</loc>${lastmod}\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${xmlUrls}\n</urlset>`
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': BASE_URL,
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  const reqSecret = req.headers.get('x-cron-secret')
  if (!CRON_SECRET || reqSecret !== CRON_SECRET) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    )
  }

  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing Supabase environment variables')
      return new Response('Server configuration error', { status: 500 })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const urls: SitemapUrl[] = []

    // Static pages
    const staticPages: SitemapUrl[] = [
      { loc: `${BASE_URL}/`, changefreq: 'daily', priority: '1.0' },
      { loc: `${BASE_URL}/properties`, changefreq: 'daily', priority: '0.9' },
      { loc: `${BASE_URL}/about`, changefreq: 'monthly', priority: '0.7' },
      { loc: `${BASE_URL}/contact`, changefreq: 'monthly', priority: '0.7' },
      { loc: `${BASE_URL}/privacy`, changefreq: 'monthly', priority: '0.5' },
      { loc: `${BASE_URL}/terms`, changefreq: 'monthly', priority: '0.5' },
      { loc: `${BASE_URL}/services`, changefreq: 'weekly', priority: '0.8' },
      { loc: `${BASE_URL}/ai-planner`, changefreq: 'weekly', priority: '0.8' },
      { loc: `${BASE_URL}/zero-fees`, changefreq: 'monthly', priority: '0.7' },
      { loc: `${BASE_URL}/experiences`, changefreq: 'weekly', priority: '0.8' },
      { loc: `${BASE_URL}/shop`, changefreq: 'weekly', priority: '0.7' },
      { loc: `${BASE_URL}/help`, changefreq: 'monthly', priority: '0.6' },
      { loc: `${BASE_URL}/community`, changefreq: 'weekly', priority: '0.7' },
      { loc: `${BASE_URL}/blog`, changefreq: 'daily', priority: '0.8' },
      { loc: `${BASE_URL}/forum`, changefreq: 'daily', priority: '0.7' },
      { loc: `${BASE_URL}/faq`, changefreq: 'monthly', priority: '0.6' },
      { loc: `${BASE_URL}/support`, changefreq: 'monthly', priority: '0.6' },
      { loc: `${BASE_URL}/list-property`, changefreq: 'monthly', priority: '0.7' },
      { loc: `${BASE_URL}/list-business`, changefreq: 'monthly', priority: '0.7' },
      { loc: `${BASE_URL}/subscribe`, changefreq: 'monthly', priority: '0.5' },
      { loc: `${BASE_URL}/visa-consult`, changefreq: 'weekly', priority: '0.7' },
      { loc: `${BASE_URL}/hidden-gems-alanya`, changefreq: 'monthly', priority: '0.8' },
      { loc: `${BASE_URL}/best-beaches-alanya`, changefreq: 'monthly', priority: '0.8' },
      // Directory category pages
      { loc: `${BASE_URL}/medical-tourism-alanya`, changefreq: 'weekly', priority: '0.8' },
      { loc: `${BASE_URL}/alanya-hotels`, changefreq: 'weekly', priority: '0.8' },
      { loc: `${BASE_URL}/alanya-villas`, changefreq: 'weekly', priority: '0.8' },
      { loc: `${BASE_URL}/alanya-apartments`, changefreq: 'weekly', priority: '0.8' },
      { loc: `${BASE_URL}/things-to-do-in-alanya`, changefreq: 'weekly', priority: '0.8' },
      { loc: `${BASE_URL}/airport-transfer`, changefreq: 'weekly', priority: '0.8' },
      { loc: `${BASE_URL}/car-rental`, changefreq: 'weekly', priority: '0.8' },
      { loc: `${BASE_URL}/restaurants`, changefreq: 'weekly', priority: '0.8' },
      { loc: `${BASE_URL}/cafes`, changefreq: 'weekly', priority: '0.8' },
      { loc: `${BASE_URL}/alanya-real-estate`, changefreq: 'weekly', priority: '0.8' },
      { loc: `${BASE_URL}/alanya-residency-guide`, changefreq: 'weekly', priority: '0.8' },
      { loc: `${BASE_URL}/alanya-shopping-guide`, changefreq: 'weekly', priority: '0.8' },
      { loc: `${BASE_URL}/alanya-nature-attractions`, changefreq: 'weekly', priority: '0.8' },
      { loc: `${BASE_URL}/alanya-weather`, changefreq: 'weekly', priority: '0.8' },
      { loc: `${BASE_URL}/nightlife`, changefreq: 'weekly', priority: '0.8' },
      { loc: `${BASE_URL}/alanya-spa-hamam`, changefreq: 'weekly', priority: '0.8' },
      { loc: `${BASE_URL}/alanya-hair-beauty`, changefreq: 'weekly', priority: '0.8' },
      // Service category pages
      { loc: `${BASE_URL}/services/car-rental`, changefreq: 'weekly', priority: '0.7' },
      { loc: `${BASE_URL}/services/bike-rental`, changefreq: 'weekly', priority: '0.7' },
      { loc: `${BASE_URL}/services/bicycle-rental`, changefreq: 'weekly', priority: '0.7' },
      { loc: `${BASE_URL}/services/tourist-sim-card`, changefreq: 'weekly', priority: '0.7' },
      { loc: `${BASE_URL}/services/visa-legal`, changefreq: 'weekly', priority: '0.7' },
    ]
    urls.push(...staticPages)

    // Excursion Type Pages
    const excursionTypes = [
      { slug: 'alanya-boat-tours', priority: '0.9' },
      { slug: 'alanya-jeep-safari', priority: '0.9' },
      { slug: 'alanya-buggy-safari', priority: '0.8' },
      { slug: 'alanya-rafting', priority: '0.9' },
      { slug: 'scuba-diving-alanya', priority: '0.9' },
      { slug: 'sapadere-canyon-tour', priority: '0.8' },
      { slug: 'green-canyon-tour', priority: '0.8' },
      { slug: 'parasailing-alanya', priority: '0.8' },
      { slug: 'alanya-fishing-trips', priority: '0.7' },
      { slug: 'alanya-city-tour', priority: '0.8' },
      { slug: 'alanya-yacht-charter', priority: '0.8' }
    ]
    for (const exc of excursionTypes) {
      urls.push({
        loc: `${BASE_URL}/${exc.slug}`,
        changefreq: 'weekly',
        priority: exc.priority
      })
    }

    // Attraction Pages
    const attractions = [
      { slug: 'cleopatra-beach', priority: '0.9' },
      { slug: 'alanya-castle', priority: '0.9' },
      { slug: 'dim-cave', priority: '0.9' },
      { slug: 'incekum-beach', priority: '0.8' },
      { slug: 'keykubat-beach', priority: '0.8' },
      { slug: 'dim-river', priority: '0.8' },
      { slug: 'sapadere-canyon', priority: '0.8' },
      { slug: 'red-tower-alanya', priority: '0.8' },
      { slug: 'alanya-shipyard', priority: '0.8' },
      { slug: 'syedra-ancient-city', priority: '0.8' },
      { slug: 'manavgat-waterfall', priority: '0.8' },
      { slug: 'side-day-trip', priority: '0.8' },
      { slug: 'green-canyon', priority: '0.8' }
    ]
    for (const attr of attractions) {
      urls.push({
        loc: `${BASE_URL}/${attr.slug}`,
        changefreq: 'weekly',
        priority: attr.priority
      })
    }

    // District Pages
    const districts = ['mahmutlar', 'kargicak', 'oba', 'tosmur', 'konakli', 'avsallar', 'turkler', 'okurcalar', 'incekum']
    for (const dist of districts) {
      urls.push({ loc: `${BASE_URL}/hotels-in-${dist}`, changefreq: 'weekly', priority: '0.8' })
      urls.push({ loc: `${BASE_URL}/villas-in-${dist}`, changefreq: 'weekly', priority: '0.8' })
      urls.push({ loc: `${BASE_URL}/apartments-in-${dist}`, changefreq: 'weekly', priority: '0.8' })
      urls.push({ loc: `${BASE_URL}/things-to-do-in-${dist}`, changefreq: 'weekly', priority: '0.8' })
      urls.push({ loc: `${BASE_URL}/airport-transfer-to-${dist}`, changefreq: 'weekly', priority: '0.8' })
    }

    // Seasonal Pages
    const seasonalPages = [
      { slug: 'best-time-to-visit-alanya', priority: '0.9' },
      { slug: 'alanya-summer-holidays', priority: '0.8' },
      { slug: 'alanya-winter-holiday', priority: '0.8' }
    ]
    for (const sp of seasonalPages) {
      urls.push({
        loc: `${BASE_URL}/${sp.slug}`,
        changefreq: 'monthly',
        priority: sp.priority
      })
    }
    const months = ['april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december', 'january']
    for (const m of months) {
      urls.push({
        loc: `${BASE_URL}/alanya-in-${m}`,
        changefreq: 'monthly',
        priority: '0.7'
      })
    }

    // Nationality Landing Pages
    const nationalPages = [
      'alanya-holidays-from-uk',
      'alanya-holidays-from-london',
      'alanya-package-holidays-uk',
      'alanya-urlaub',
      'alanya-reisen',
      'alanya-vakantie',
      'alanya-holidays-from-norway',
      'alanya-holidays-from-sweden'
    ]
    for (const p of nationalPages) {
      urls.push({
        loc: `${BASE_URL}/${p}`,
        changefreq: 'monthly',
        priority: '0.8'
      })
    }

    // Blog posts
    const { data: blogPosts, error: blogError } = await supabase
      .from('blog_posts')
      .select('slug, updated_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false })

    if (blogError) {
      console.error('Failed to fetch blog posts for sitemap:', blogError)
    } else if (blogPosts) {
      for (const post of blogPosts) {
        if (!post.slug) continue
        urls.push({
          loc: `${BASE_URL}/blog/${post.slug}`,
          lastmod: post.updated_at ? new Date(post.updated_at).toISOString().split('T')[0] : undefined,
          changefreq: 'weekly',
          priority: '0.7',
        })
      }
    }

    // Blog categories (discovered dynamically from published posts)
    const { data: blogCategories } = await supabase
      .from('blog_posts')
      .select('category')
      .eq('status', 'published')
      .not('category', 'is', null)

    if (blogCategories) {
      const uniqueCategories = new Set<string>(
        blogCategories.map((c: { category: string | null }) => c.category).filter(Boolean)
      )
      for (const category of uniqueCategories) {
        urls.push({
          loc: `${BASE_URL}/blog/category/${encodeURIComponent(category)}`,
          changefreq: 'weekly',
          priority: '0.6',
        })
      }
    }

    // Properties
    const { data: properties, error: propError } = await supabase
      .from('properties')
      .select('id, updated_at')
      .eq('status', 'approved')
      .order('updated_at', { ascending: false })

    if (propError) {
      console.error('Failed to fetch properties for sitemap:', propError)
    } else if (properties) {
      for (const prop of properties) {
        if (!prop.id) continue
        urls.push({
          loc: `${BASE_URL}/property/${prop.id}`,
          lastmod: prop.updated_at ? new Date(prop.updated_at).toISOString().split('T')[0] : undefined,
          changefreq: 'weekly',
          priority: '0.8',
        })
      }
    }

    // Directory listing detail pages
    const { data: listings, error: listingsError } = await supabase
      .from('directory_listings')
      .select('slug, category_id, updated_at')
      .not('slug', 'is', null)
      .order('updated_at', { ascending: false })

    if (listingsError) {
      console.error('Failed to fetch directory listings for sitemap:', listingsError)
    } else if (listings) {
      for (const listing of listings) {
        if (!listing.slug || !listing.category_id) continue
        const prefix = CATEGORY_PATHS[listing.category_id]
        if (!prefix) continue
        urls.push({
          loc: `${BASE_URL}${prefix}/${listing.slug}`,
          lastmod: listing.updated_at ? new Date(listing.updated_at).toISOString().split('T')[0] : undefined,
          changefreq: 'weekly',
          priority: '0.7',
        })
      }
    }

    const sitemapXml = buildSitemap(urls)

    // Ping Google about the updated sitemap
    try {
      const pingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(`${BASE_URL}/sitemap.xml`)}`
      await fetch(pingUrl, { method: 'GET' })
      console.warn('Sitemap ping sent to Google')
    } catch (e) {
      console.error('Failed to ping Google sitemap:', e)
    }

    return new Response(sitemapXml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error: any) {
    console.error('Sitemap generation error:', error)
    return new Response('Internal server error', { status: 500 })
  }
})
