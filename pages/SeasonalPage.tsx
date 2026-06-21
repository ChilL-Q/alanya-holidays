import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { SEOHead } from '../components/seo/SEOHead';
import { Breadcrumb } from '../components/seo/Breadcrumb';
import {
  getSeasonalPage,
  RATING_LABELS,
  RATING_COLORS,
  type SeasonalPage as SeasonalPageData,
} from '../data/seasonalPages';
import {
  Sun, Thermometer, Droplets, Waves, ChevronDown, ChevronUp,
  CheckCircle2, XCircle, Hotel, MapPin, Car,
} from 'lucide-react';
import { faqPageSchema, touristAttractionSchema, alanyaAddress } from '../utils/schemaGenerators';

function buildSeasonalJsonLd(page: SeasonalPageData) {
  const baseUrl = 'https://alanya-holidays.com';
  const url = `${baseUrl}/${page.slug}`;

  // Guide pages (no weather data) are editorial articles, not physical attractions
  const primarySchema = page.weather
    ? touristAttractionSchema({
        name: page.title,
        description: page.metaDescription,
        url,
      })
    : {
        '@context': 'https://schema.org',
        '@type': 'Article',
        name: page.title,
        headline: page.title,
        description: page.metaDescription,
        url,
        author: { '@type': 'Organization', name: 'Alanya Holidays' },
        publisher: { '@type': 'Organization', name: 'Alanya Holidays' },
      };

  const faqSchema = faqPageSchema(page.faqs);
  if (!faqSchema) return primarySchema;

  return [primarySchema, faqSchema];
}

function WeatherWidget({ weather }: { weather: NonNullable<SeasonalPageData['weather']> }) {
  const stats = [
    { icon: Thermometer, label: 'Avg High', value: `${weather.avgHigh}°C`, sub: `Low ${weather.avgLow}°C` },
    { icon: Waves, label: 'Sea Temp', value: `${weather.seaTemp}°C`, sub: 'Mediterranean' },
    { icon: Sun, label: 'Sun Hours', value: `${weather.sunHours}h`, sub: 'per day' },
    { icon: Droplets, label: 'Rain Days', value: `${weather.rainDays}`, sub: 'per month' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-8">
      {stats.map(({ icon: Icon, label, value, sub }) => (
        <div
          key={label}
          className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 rounded-xl p-4 text-center shadow-sm"
        >
          <Icon className="w-6 h-6 text-teal-500 dark:text-cyan-400 mx-auto mb-2" />
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide mb-1">{label}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{sub}</p>
        </div>
      ))}
    </div>
  );
}

export const SeasonalPage: React.FC = () => {
  const slug = useLocation().pathname.replace(/^\/|\/$/g, '');
  const page = getSeasonalPage(slug);

  const [showFullDescription, setShowFullDescription] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  if (!page) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <SEOHead title="Page Not Found" noIndex />
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Page Not Found</h1>
          <Link to="/" className="text-teal-600 dark:text-cyan-400 hover:underline">
            Return to homepage
          </Link>
        </div>
      </div>
    );
  }

  const jsonLd = buildSeasonalJsonLd(page);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-24 pb-16">
      <SEOHead
        title={page.metaTitle}
        description={page.metaDescription}
        keywords={page.keywords}
        jsonLd={jsonLd}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            ...(slug !== 'best-time-to-visit-alanya'
              ? [{ label: 'Travel Guide', href: '/best-time-to-visit-alanya' }]
              : []),
            { label: page.title },
          ]}
        />
      </div>

      {/* Hero */}
      <div className="bg-white dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800/50 shadow-sm mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
            <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-white">
              {page.title}
            </h1>
            <span className={`inline-flex items-center self-start px-3 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap ${RATING_COLORS[page.rating]}`}>
              {RATING_LABELS[page.rating]}
            </span>
          </div>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-4xl leading-relaxed mb-4">
            {page.heroSubtitle}
          </p>

          {page.weather && <WeatherWidget weather={page.weather} />}

          <div className={`transition-all duration-500 overflow-hidden ${showFullDescription ? 'max-h-[4000px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="text-slate-700 dark:text-slate-300 max-w-4xl space-y-4 text-base md:text-lg leading-relaxed">
              {page.longDescription.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>
          <button
            onClick={() => setShowFullDescription(!showFullDescription)}
            className="text-teal-600 dark:text-cyan-400 hover:text-teal-700 dark:hover:text-cyan-300 font-semibold text-base mt-4 flex items-center gap-1"
          >
            {showFullDescription ? 'Read Less' : 'Read More'}
            {showFullDescription ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">

        {/* Highlights */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
            Why Visit Alanya {page.weather ? `in ${page.title.replace('Alanya in ', '').replace('Alanya ', '')}` : ''}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {page.highlights.map((highlight, i) => (
              <div
                key={i}
                className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 rounded-xl p-4 flex items-start gap-3 shadow-sm"
              >
                <CheckCircle2 className="w-5 h-5 text-teal-500 dark:text-cyan-400 flex-shrink-0 mt-0.5" />
                <p className="text-slate-700 dark:text-slate-300 text-sm font-medium">{highlight}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Activities */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
            Things to Do
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {page.activities.map((activity, i) => (
              <div
                key={i}
                className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 rounded-xl p-5 shadow-sm"
              >
                <h3 className="font-bold text-slate-900 dark:text-white mb-2">{activity.name}</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{activity.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pros & Cons */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Pros & Cons</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-emerald-600 dark:text-emerald-400 mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> Pros
              </h3>
              <ul className="space-y-2">
                {page.pros.map((pro, i) => (
                  <li key={i} className="flex items-start gap-2 text-slate-700 dark:text-slate-300 text-sm">
                    <span className="text-emerald-500 mt-0.5 flex-shrink-0">✓</span>
                    {pro}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-rose-600 dark:text-rose-400 mb-4 flex items-center gap-2">
                <XCircle className="w-5 h-5" /> Cons
              </h3>
              <ul className="space-y-2">
                {page.cons.map((con, i) => (
                  <li key={i} className="flex items-start gap-2 text-slate-700 dark:text-slate-300 text-sm">
                    <span className="text-rose-400 mt-0.5 flex-shrink-0">✗</span>
                    {con}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* CTAs */}
        <section className="border-t border-slate-200 dark:border-slate-800/50 pt-16">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 text-center">
            Plan Your Alanya Visit
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/alanya-hotels"
              className="group bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 rounded-xl p-6 text-center hover:border-teal-400 dark:hover:border-cyan-500 hover:shadow-md transition-all"
            >
              <Hotel className="w-8 h-8 text-teal-500 dark:text-cyan-400 mx-auto mb-3" />
              <h3 className="font-bold text-slate-900 dark:text-white mb-1 group-hover:text-teal-600 dark:group-hover:text-cyan-400 transition-colors">Find Hotels</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Browse hotels & villas in Alanya</p>
            </Link>
            <Link
              to="/things-to-do-in-alanya"
              className="group bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 rounded-xl p-6 text-center hover:border-teal-400 dark:hover:border-cyan-500 hover:shadow-md transition-all"
            >
              <MapPin className="w-8 h-8 text-teal-500 dark:text-cyan-400 mx-auto mb-3" />
              <h3 className="font-bold text-slate-900 dark:text-white mb-1 group-hover:text-teal-600 dark:group-hover:text-cyan-400 transition-colors">Book Excursions</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Tours, boat trips, and activities</p>
            </Link>
            <Link
              to="/airport-transfer"
              className="group bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 rounded-xl p-6 text-center hover:border-teal-400 dark:hover:border-cyan-500 hover:shadow-md transition-all"
            >
              <Car className="w-8 h-8 text-teal-500 dark:text-cyan-400 mx-auto mb-3" />
              <h3 className="font-bold text-slate-900 dark:text-white mb-1 group-hover:text-teal-600 dark:group-hover:text-cyan-400 transition-colors">Airport Transfer</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Fixed-price transfer from AYT & GZP</p>
            </Link>
          </div>
        </section>

        {/* FAQ */}
        {page.faqs.length > 0 && (
          <section className="border-t border-slate-200 dark:border-slate-800/50 pt-16 pb-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8 text-center">
                Frequently Asked Questions
              </h2>
              <div className="space-y-4">
                {page.faqs.map((faq, idx) => (
                  <div
                    key={idx}
                    className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 rounded-xl overflow-hidden hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                  >
                    <button
                      onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                      className="w-full text-left px-6 py-4 flex items-center justify-between font-semibold text-slate-900 dark:text-white"
                    >
                      {faq.question}
                      {expandedFaq === idx
                        ? <ChevronUp size={20} className="text-slate-400 dark:text-slate-500 flex-shrink-0" />
                        : <ChevronDown size={20} className="text-slate-400 dark:text-slate-500 flex-shrink-0" />
                      }
                    </button>
                    <div className={`px-6 pb-4 text-slate-600 dark:text-slate-400 leading-relaxed ${expandedFaq === idx ? 'block' : 'hidden'}`}>
                      {faq.answer}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
