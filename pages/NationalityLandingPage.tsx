import React, { useState, useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { SEOHead, type HreflangAlternate } from '../components/seo/SEOHead';
import { getAppUrl } from '../utils/appUrl';
import { Breadcrumb } from '../components/seo/Breadcrumb';
import { NationalityCrossLinks } from '../components/seo/NationalityCrossLinks';
import {
  getNationalityPage,
  MARKET_FLAGS,
  MARKET_LABELS,
  HREFLANG_REPRESENTATIVES,
  UI_STRINGS,
  type NationalityPage as NationalityPageData,
  type TravelTip,
} from '../data/nationalityPages';
import {
  Plane, ChevronDown, ChevronUp, CheckCircle2,
  Hotel, MapPin, Car,
  FileText, CalendarCheck, Coins, CloudSun, Bus, Users,
} from 'lucide-react';
import { faqPageSchema, alanyaAddress } from '../utils/schemaGenerators';

const TIP_ICONS: Record<TravelTip['icon'], React.ElementType> = {
  visa: FileText,
  booking: CalendarCheck,
  currency: Coins,
  weather: CloudSun,
  transport: Bus,
  culture: Users,
};

function buildNationalityJsonLd(page: NationalityPageData) {
  const url = getAppUrl(page.slug);

  const tripSchema = {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    name: page.title,
    description: page.metaDescription,
    url,
    touristType: `Leisure travelers from ${MARKET_LABELS[page.market]}`,
    itinerary: {
      '@type': 'Place',
      name: 'Alanya',
      address: alanyaAddress(),
    },
  };

  const faqSchema = faqPageSchema(page.faqs);
  if (!faqSchema) return tripSchema;

  return [tripSchema, faqSchema];
}

function buildHreflangAlternates(page: NationalityPageData): HreflangAlternate[] {
  if (!page.hreflangCode) return [];

  const alternates: HreflangAlternate[] = [
    { hreflang: page.hreflangCode, href: getAppUrl(page.slug) },
  ];

  for (const [code, slug] of Object.entries(HREFLANG_REPRESENTATIVES)) {
    if (code !== page.hreflangCode) {
      alternates.push({ hreflang: code, href: getAppUrl(slug) });
    }
  }

  alternates.push({
    hreflang: 'x-default',
    href: getAppUrl(HREFLANG_REPRESENTATIVES['en-GB']),
  });

  return alternates;
}

function formatAirport(code: string): string {
  if (code === 'GZP') return 'Gazipasa (GZP)';
  if (code === 'AYT / GZP') return 'Antalya/Gazipasa (AYT/GZP)';
  return 'Antalya (AYT)';
}

export const NationalityLandingPage: React.FC = () => {
  const { pathname } = useLocation();
  const slug = pathname.replace(/^\/|\/$/g, '');
  const page = getNationalityPage(slug);

  const [showFullDescription, setShowFullDescription] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Reset expandable state when slug changes (React state-from-props pattern)
  const [prevSlug, setPrevSlug] = useState(slug);
  if (prevSlug !== slug) {
    setPrevSlug(slug);
    setShowFullDescription(false);
    setExpandedFaq(null);
  }

  const jsonLd = useMemo(() => {
    const p = getNationalityPage(slug);
    return p ? buildNationalityJsonLd(p) : null;
  }, [slug]);

  const hreflang = useMemo(() => {
    const p = getNationalityPage(slug);
    return p ? buildHreflangAlternates(p) : [];
  }, [slug]);

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

  const ui = UI_STRINGS[page.language];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-24 pb-16">
      <SEOHead
        title={page.metaTitle}
        description={page.metaDescription}
        keywords={page.keywords}
        jsonLd={jsonLd}
        hreflang={hreflang}
        lang={page.hreflangCode || page.language}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
        <Breadcrumb
          items={[
            { label: ui.home, href: '/' },
            { label: `${ui.holidaysFrom} ${MARKET_LABELS[page.market]}` },
            { label: page.title },
          ]}
        />
      </div>

      {/* Hero */}
      <div className="bg-white dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800/50 shadow-sm mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">{MARKET_FLAGS[page.market]}</span>
            <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-white">
              {page.title}
            </h1>
          </div>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-4xl leading-relaxed mb-4">
            {page.heroSubtitle}
          </p>

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
            {showFullDescription ? ui.readLess : ui.readMore}
            {showFullDescription ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">

        {/* Flight Info */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Plane className="w-6 h-6 text-teal-500 dark:text-cyan-400" />
            {ui.flightsHeading} {MARKET_LABELS[page.market]}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-4xl leading-relaxed">
            {page.flightSectionIntro}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 rounded-xl overflow-hidden shadow-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700/50">
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300">{ui.fromCol}</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300">{ui.airlineCol}</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300">{ui.toCol}</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300">{ui.durationCol}</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300">{ui.frequencyCol}</th>
                </tr>
              </thead>
              <tbody>
                {page.flightRoutes.map((route, i) => (
                  <tr
                    key={i}
                    className={`border-b border-slate-100 dark:border-slate-700/30 last:border-0 ${
                      i % 2 !== 0 ? 'bg-slate-50/50 dark:bg-slate-800/40' : ''
                    }`}
                  >
                    <td className="px-4 py-3 text-sm text-slate-900 dark:text-white font-medium">{route.fromCity}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{route.airline}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                      {formatAirport(route.toAirport)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{route.duration}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{route.frequency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Why Alanya */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
            {ui.whyAlanyaHeading} {MARKET_LABELS[page.market]} {ui.whyAlanyaSuffix}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {page.whyAlanyaHighlights.map((highlight, i) => (
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

        {/* Travel Tips */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
            {ui.travelTipsHeading} {MARKET_LABELS[page.market]} {ui.travelTipsSuffix}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {page.travelTips.map((tip, i) => {
              const Icon = TIP_ICONS[tip.icon];
              return (
                <div
                  key={i}
                  className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 rounded-xl p-5 shadow-sm"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-5 h-5 text-teal-500 dark:text-cyan-400 flex-shrink-0" />
                    <h3 className="font-bold text-slate-900 dark:text-white">{tip.title}</h3>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{tip.content}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-slate-200 dark:border-slate-800/50 pt-16">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 text-center">
            {ui.ctaHeading}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/alanya-hotels"
              className="group bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 rounded-xl p-6 text-center hover:border-teal-400 dark:hover:border-cyan-500 hover:shadow-md transition-all"
            >
              <Hotel className="w-8 h-8 text-teal-500 dark:text-cyan-400 mx-auto mb-3" />
              <h3 className="font-bold text-slate-900 dark:text-white mb-1 group-hover:text-teal-600 dark:group-hover:text-cyan-400 transition-colors">{ui.ctaHotels}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm">{ui.ctaHotelsDesc}</p>
            </Link>
            <Link
              to="/things-to-do-in-alanya"
              className="group bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 rounded-xl p-6 text-center hover:border-teal-400 dark:hover:border-cyan-500 hover:shadow-md transition-all"
            >
              <MapPin className="w-8 h-8 text-teal-500 dark:text-cyan-400 mx-auto mb-3" />
              <h3 className="font-bold text-slate-900 dark:text-white mb-1 group-hover:text-teal-600 dark:group-hover:text-cyan-400 transition-colors">{ui.ctaExcursions}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm">{ui.ctaExcursionsDesc}</p>
            </Link>
            <Link
              to="/airport-transfer"
              className="group bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 rounded-xl p-6 text-center hover:border-teal-400 dark:hover:border-cyan-500 hover:shadow-md transition-all"
            >
              <Car className="w-8 h-8 text-teal-500 dark:text-cyan-400 mx-auto mb-3" />
              <h3 className="font-bold text-slate-900 dark:text-white mb-1 group-hover:text-teal-600 dark:group-hover:text-cyan-400 transition-colors">{ui.ctaTransfer}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm">{ui.ctaTransferDesc}</p>
            </Link>
          </div>
        </section>

        {/* FAQ */}
        {page.faqs.length > 0 && (
          <section className="border-t border-slate-200 dark:border-slate-800/50 pt-16 pb-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8 text-center">
                {ui.faqHeading}
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

        {/* Cross-Links */}
        <NationalityCrossLinks currentSlug={page.slug} language={page.language} />
      </div>
    </div>
  );
};