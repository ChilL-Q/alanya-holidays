export interface SitemapStaticUrl {
  path: string;
  changefreq: 'daily' | 'weekly' | 'monthly' | 'always' | 'hourly' | 'yearly' | 'never';
  priority: string;
}

export const STATIC_SITEMAP_URLS: SitemapStaticUrl[] = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/properties', changefreq: 'daily', priority: '0.9' },
  { path: '/about', changefreq: 'monthly', priority: '0.7' },
  { path: '/contact', changefreq: 'monthly', priority: '0.7' },
  { path: '/privacy', changefreq: 'monthly', priority: '0.5' },
  { path: '/terms', changefreq: 'monthly', priority: '0.5' },
  { path: '/services', changefreq: 'weekly', priority: '0.8' },
  { path: '/ai-planner', changefreq: 'weekly', priority: '0.8' },
  { path: '/zero-fees', changefreq: 'monthly', priority: '0.7' },
  { path: '/experiences', changefreq: 'weekly', priority: '0.8' },
  { path: '/shop', changefreq: 'weekly', priority: '0.7' },
  { path: '/help', changefreq: 'monthly', priority: '0.6' },
  { path: '/community', changefreq: 'weekly', priority: '0.7' },
  { path: '/blog', changefreq: 'daily', priority: '0.8' },
  { path: '/forum', changefreq: 'daily', priority: '0.7' },
  { path: '/faq', changefreq: 'monthly', priority: '0.6' },
  { path: '/support', changefreq: 'monthly', priority: '0.6' },
  { path: '/list-property', changefreq: 'monthly', priority: '0.7' },
  { path: '/list-business', changefreq: 'monthly', priority: '0.7' },
  { path: '/subscribe', changefreq: 'monthly', priority: '0.5' },
  { path: '/visa-consult', changefreq: 'weekly', priority: '0.7' },
  { path: '/hidden-gems-alanya', changefreq: 'monthly', priority: '0.8' },
  { path: '/best-beaches-alanya', changefreq: 'monthly', priority: '0.8' },
  
  // Directory category pages
  { path: '/medical-tourism-alanya', changefreq: 'weekly', priority: '0.8' },
  { path: '/alanya-hotels', changefreq: 'weekly', priority: '0.8' },
  { path: '/alanya-villas', changefreq: 'weekly', priority: '0.8' },
  { path: '/alanya-apartments', changefreq: 'weekly', priority: '0.8' },
  { path: '/things-to-do-in-alanya', changefreq: 'weekly', priority: '0.8' },
  { path: '/airport-transfer', changefreq: 'weekly', priority: '0.8' },
  { path: '/car-rental', changefreq: 'weekly', priority: '0.8' },
  { path: '/restaurants', changefreq: 'weekly', priority: '0.8' },
  { path: '/cafes', changefreq: 'weekly', priority: '0.8' },
  { path: '/alanya-real-estate', changefreq: 'weekly', priority: '0.8' },
  { path: '/alanya-residency-guide', changefreq: 'weekly', priority: '0.8' },
  { path: '/alanya-shopping-guide', changefreq: 'weekly', priority: '0.8' },
  { path: '/alanya-nature-attractions', changefreq: 'weekly', priority: '0.8' },
  { path: '/alanya-weather', changefreq: 'weekly', priority: '0.8' },
  { path: '/nightlife', changefreq: 'weekly', priority: '0.8' },
  { path: '/alanya-spa-hamam', changefreq: 'weekly', priority: '0.8' },
  { path: '/alanya-hair-beauty', changefreq: 'weekly', priority: '0.8' },

  // Service category pages
  { path: '/services/car-rental', changefreq: 'weekly', priority: '0.7' },
  { path: '/services/bike-rental', changefreq: 'weekly', priority: '0.7' },
  { path: '/services/bicycle-rental', changefreq: 'weekly', priority: '0.7' },
  { path: '/services/tourist-sim-card', changefreq: 'weekly', priority: '0.7' },
  { path: '/services/visa-legal', changefreq: 'weekly', priority: '0.7' },
];

export const SITEMAP_MONTHS = [
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
  'january',
];
