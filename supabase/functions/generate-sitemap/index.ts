// @ts-ignore: npm: specifiers are resolved by Deno, not tsc
import { createClient } from 'npm:@supabase/supabase-js@2'

// @ts-ignore: jsr: specifiers are resolved by Deno, not tsc
import "jsr:@supabase/functions-js@^2/edge-runtime.d.ts"

// Central URL configuration and static lists
import { STATIC_SITEMAP_URLS, SITEMAP_MONTHS } from '../../../config/sitemapUrls.ts'
import { EXCURSION_TYPES } from '../../../data/excursionTypes.ts'
import { ATTRACTIONS } from '../../../data/attractionPages.ts'
import { DISTRICT_PAGES } from '../../../data/districtPages.ts'
import { SEASONAL_PAGES } from '../../../data/seasonalPages.ts'
import { NATIONALITY_PAGES } from '../../../data/nationalityPages.ts'
import { CATEGORY_PATHS } from '../../../constants/categoryPaths.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const CRON_SECRET = Deno.env.get('CRON_SECRET')!

const BASE_URL = Deno.env.get('SITE_URL') ?? 'https://alanya-holidays.com'

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

    // Static and Category pages from config
    for (const urlConfig of STATIC_SITEMAP_URLS) {
      // Avoid leading/trailing slash double-up
      const pathPart = urlConfig.path === '/' ? '' : urlConfig.path;
      urls.push({
        loc: `${BASE_URL}${pathPart}`,
        changefreq: urlConfig.changefreq,
        priority: urlConfig.priority,
      });
    }

    // Excursion Type Pages
    for (const exc of EXCURSION_TYPES) {
      urls.push({
        loc: `${BASE_URL}/${exc.slug}`,
        changefreq: 'weekly',
        priority: exc.priority ?? '0.8',
      });
    }

    // Attraction Pages
    for (const attr of ATTRACTIONS) {
      urls.push({
        loc: `${BASE_URL}/${attr.slug}`,
        changefreq: 'weekly',
        priority: attr.priority ?? '0.8',
      });
    }

    // District Pages
    for (const page of DISTRICT_PAGES) {
      urls.push({
        loc: `${BASE_URL}/${page.url}`,
        changefreq: 'weekly',
        priority: '0.8',
      });
    }

    // Seasonal Pages
    for (const sp of SEASONAL_PAGES) {
      urls.push({
        loc: `${BASE_URL}/${sp.slug}`,
        changefreq: 'monthly',
        priority: sp.slug === 'best-time-to-visit-alanya' ? '0.9' : '0.8',
      });
    }

    // Seasonal month sub-pages
    for (const m of SITEMAP_MONTHS) {
      urls.push({
        loc: `${BASE_URL}/alanya-in-${m}`,
        changefreq: 'monthly',
        priority: '0.7',
      });
    }

    // Nationality Landing Pages
    for (const page of NATIONALITY_PAGES) {
      urls.push({
        loc: `${BASE_URL}/${page.slug}`,
        changefreq: 'monthly',
        priority: '0.8',
      });
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
        blogCategories.map((c: { category: string | null }) => c.category).filter((c): c is string => !!c)
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
