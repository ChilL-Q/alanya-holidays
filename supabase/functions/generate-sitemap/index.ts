// @ts-ignore
import { createClient } from 'npm:@supabase/supabase-js@2'

declare const Deno: any

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const BASE_URL = 'https://alanya-holidays.com'

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
      { loc: `${BASE_URL}/about`, changefreq: 'monthly', priority: '0.7' },
      { loc: `${BASE_URL}/contact`, changefreq: 'monthly', priority: '0.7' },
      { loc: `${BASE_URL}/blog`, changefreq: 'daily', priority: '0.9' },
      { loc: `${BASE_URL}/services`, changefreq: 'weekly', priority: '0.8' },
      { loc: `${BASE_URL}/faq`, changefreq: 'monthly', priority: '0.6' },
      { loc: `${BASE_URL}/privacy`, changefreq: 'yearly', priority: '0.4' },
      { loc: `${BASE_URL}/terms`, changefreq: 'yearly', priority: '0.4' },
      { loc: `${BASE_URL}/help`, changefreq: 'monthly', priority: '0.6' },
      { loc: `${BASE_URL}/support`, changefreq: 'monthly', priority: '0.6' },
      { loc: `${BASE_URL}/list-property`, changefreq: 'monthly', priority: '0.7' },
      { loc: `${BASE_URL}/list-business`, changefreq: 'monthly', priority: '0.7' },
      { loc: `${BASE_URL}/subscribe`, changefreq: 'monthly', priority: '0.5' },
      { loc: `${BASE_URL}/zero-fees`, changefreq: 'monthly', priority: '0.6' },
      { loc: `${BASE_URL}/visa-consult`, changefreq: 'weekly', priority: '0.7' },
      { loc: `${BASE_URL}/shop`, changefreq: 'weekly', priority: '0.7' },
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
      const uniqueCategories = new Set(
        blogCategories.map((c) => c.category).filter(Boolean)
      )
      for (const category of uniqueCategories) {
        urls.push({
          loc: `${BASE_URL}/blog/category/${encodeURIComponent(category as string)}`,
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

    const sitemapXml = buildSitemap(urls)

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
