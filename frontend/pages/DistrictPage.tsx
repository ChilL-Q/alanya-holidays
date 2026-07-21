import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { SEOHead } from '../components/seo/SEOHead';
import { Breadcrumb } from '../components/seo/Breadcrumb';
import { DistrictCrossLinks } from '../components/seo/DistrictCrossLinks';
import { DirectoryListingCard } from '../components/directory/DirectoryListingCard';
import { DirectoryListingModal } from '../components/directory/DirectoryListingModal';
import { DirectoryListingDB } from '../types/models';
import { directoryService } from '../api-services';
import {
  getDistrictPage,
  getDistrictBySlug,
  type DistrictPageContent,
  type DistrictPageType,
} from '../data/districtPages';
import { ChevronDown, ChevronUp, Info, Building2, Home, Building, Compass, Bus } from 'lucide-react';

import { alanyaAddress, taxiServiceSchema, touristAttractionSchema } from '../utils/schemaGenerators';

const PAGE_TYPE_ICONS: Record<DistrictPageType, React.ElementType> = {
  'hotels': Building2,
  'villas': Home,
  'apartments': Building,
  'things-to-do': Compass,
  'airport-transfer': Bus,
};

const PAGE_TYPE_SECTION_LABELS: Record<DistrictPageType, string> = {
  'hotels': 'Hotels in this Area',
  'villas': 'Villas in this Area',
  'apartments': 'Apartments in this Area',
  'things-to-do': 'Tours & Activities',
  'airport-transfer': 'Transfer Services',
};

const PAGE_TYPE_EMPTY_TEXT: Record<DistrictPageType, string> = {
  'hotels': 'No hotels listed in this area yet',
  'villas': 'No villas listed in this area yet',
  'apartments': 'No apartments listed in this area yet',
  'things-to-do': 'No tours available in this area yet',
  'airport-transfer': 'No transfer services listed yet',
};

const PAGE_TYPE_BREADCRUMB: Record<DistrictPageType, { label: string; href: string }> = {
  'hotels': { label: 'Hotels', href: '/alanya-hotels' },
  'villas': { label: 'Villas', href: '/alanya-villas' },
  'apartments': { label: 'Apartments', href: '/alanya-apartments' },
  'things-to-do': { label: 'Things to Do', href: '/things-to-do-in-alanya' },
  'airport-transfer': { label: 'Airport Transfer', href: '/airport-transfer' },
};

function buildDistrictJsonLd(page: DistrictPageContent, districtName: string) {
  const baseUrl = 'https://alanya-holidays.com';
  const url = `${baseUrl}/${page.url}`;

  const districtSchema = {
    '@context': 'https://schema.org',
    '@type': 'City',
    name: `${districtName}, Alanya`,
    description: page.metaDescription,
    url,
    address: alanyaAddress({ addressLocality: districtName }),
    containedInPlace: {
      '@type': 'City',
      name: 'Alanya',
    },
  };

  if (page.pageType === 'airport-transfer') {
    return [
      districtSchema,
      taxiServiceSchema({
        name: `Airport Transfer to ${districtName}`,
        description: page.metaDescription,
        url,
        addressLocality: districtName,
        areaServed: districtName,
      }),
    ];
  }

  if (page.pageType === 'things-to-do') {
    return [
      districtSchema,
      touristAttractionSchema({
        name: `Things to Do in ${districtName}`,
        description: page.metaDescription,
        url,
        addressLocality: districtName,
        touristType: 'Leisure travelers',
      }),
    ];
  }

  return districtSchema;
}

export const DistrictPage: React.FC = () => {
  const slug = useLocation().pathname.replace(/^\/|\/$/g, '');
  const page = getDistrictPage(slug);
  const district = page ? getDistrictBySlug(page.districtSlug) : undefined;

  const [listings, setListings] = useState<DirectoryListingDB[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedListing, setSelectedListing] = useState<DirectoryListingDB | null>(null);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  useEffect(() => {
    if (!page || !district) return;
    const fetchListings = async () => {
      setLoading(true);
      try {
        const result = await directoryService.searchDirectoryListings('', page.categoryId, district.name);
        setListings(result.data ?? []);
      } catch (e) {
        console.error('Failed to load district listings', e);
        setListings([]);
      } finally {
        setLoading(false);
      }
    };
    fetchListings();
  }, [page, district]);

  const handleListingClick = useCallback((listing: DirectoryListingDB) => {
    setSelectedListing(listing);
    const sessionKey = `listing_view_${listing.id}_${new Date().toISOString().slice(0, 10)}`;
    if (!sessionStorage.getItem(sessionKey)) {
      directoryService.trackListingView(listing.id)
        .then(() => sessionStorage.setItem(sessionKey, '1'))
        .catch(console.error);
    }
  }, []);

  if (!page || !district) {
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

  const jsonLd = buildDistrictJsonLd(page, district.name);
  const Icon = PAGE_TYPE_ICONS[page.pageType];
  const parentCrumb = PAGE_TYPE_BREADCRUMB[page.pageType];

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
            { label: parentCrumb.label, href: parentCrumb.href },
            { label: `${district.name} ${parentCrumb.label}` },
          ]}
        />
      </div>

      {/* Hero */}
      <div className="bg-white dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800/50 shadow-sm mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center md:text-left md:py-16">
          <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
            <Icon className="w-8 h-8 text-teal-600 dark:text-cyan-400" />
            <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-white">
              {page.metaTitle}
            </h1>
          </div>
          <div className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-4xl leading-relaxed">
            <p className="mb-4">{page.metaDescription}</p>
            <div className={`transition-all duration-500 overflow-hidden text-left ${showFullDescription ? 'max-h-[4000px] opacity-100 mt-6' : 'max-h-0 opacity-0'}`}>
              {page.longDescription.map((para, i) => (
                <p key={i} className="mb-4 text-base md:text-lg">{para}</p>
              ))}
            </div>
            <button
              onClick={() => setShowFullDescription(!showFullDescription)}
              className="text-teal-600 dark:text-cyan-400 hover:text-teal-700 dark:hover:text-cyan-300 font-semibold text-base mt-2 flex items-center justify-center md:justify-start gap-1 w-full md:w-auto"
            >
              {showFullDescription ? 'Read Less' : 'Read More'}
              {showFullDescription ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Listings */}
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 px-2">
          {PAGE_TYPE_SECTION_LABELS[page.pageType]}
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse bg-white dark:bg-slate-800/80 rounded-2xl h-80 border border-slate-200 dark:border-slate-800/50" />
            ))}
          </div>
        ) : listings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map(listing => (
              <DirectoryListingCard
                key={listing.id}
                listing={listing}
                onClick={handleListingClick}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800/50 rounded-2xl p-12 flex flex-col items-center justify-center text-center shadow-sm">
            <Info className="w-16 h-16 text-slate-300 dark:text-slate-400 mb-4" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              {PAGE_TYPE_EMPTY_TEXT[page.pageType]}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm">
              Browse all options in Alanya instead.
            </p>
            <Link
              to={parentCrumb.href}
              className="mt-4 text-teal-600 dark:text-cyan-400 hover:underline font-medium"
            >
              View all {parentCrumb.label.toLowerCase()} in Alanya
            </Link>
          </div>
        )}

        {/* Cross-links */}
        <DistrictCrossLinks currentDistrictSlug={page.districtSlug} currentPageType={page.pageType} />

        {/* FAQ */}
        {page.faqs.length > 0 && (
          <div className="mt-16 mb-12 border-t border-slate-200 dark:border-slate-800/50 pt-16">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8 text-center">
                Frequently Asked Questions
              </h2>
              <div className="space-y-4">
                {page.faqs.map((faq, idx) => (
                  <div key={idx} className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800/50 rounded-xl overflow-hidden hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
                    <button
                      onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                      className="w-full text-left px-6 py-4 flex items-center justify-between font-semibold text-slate-900 dark:text-white"
                    >
                      {faq.question}
                      {expandedFaq === idx ? <ChevronUp size={20} className="text-slate-400 dark:text-slate-500" /> : <ChevronDown size={20} className="text-slate-400 dark:text-slate-500" />}
                    </button>
                    <div className={`px-6 pb-4 text-slate-600 dark:text-slate-400 leading-relaxed ${expandedFaq === idx ? 'block' : 'hidden'}`}>
                      {faq.answer}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <DirectoryListingModal
        listing={selectedListing}
        isOpen={!!selectedListing}
        onClose={() => setSelectedListing(null)}
      />
    </div>
  );
};