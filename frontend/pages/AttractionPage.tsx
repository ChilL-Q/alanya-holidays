import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { SEOHead } from '../components/seo/SEOHead';
import { Breadcrumb } from '../components/seo/Breadcrumb';
import { DirectoryListingCard } from '../components/directory/DirectoryListingCard';
import { DirectoryListingModal } from '../components/directory/DirectoryListingModal';
import { DirectoryListingDB } from '../types/models';
import { directoryService } from '../api-services';
import { getAttraction, type Attraction } from '../data/attractionPages';
import { getExcursionType, type ExcursionType } from '../data/excursionTypes';
import { MapPin, Clock, Ticket, Bus, Lightbulb, ChevronDown, ChevronUp, Info, Compass } from 'lucide-react';

interface RelatedItem { slug: string; title: string; metaDescription: string }

function RelatedItemsGrid({ heading, items, icon: Icon, topMargin }: {
  heading: string;
  items: RelatedItem[];
  icon: React.ElementType;
  topMargin?: boolean;
}) {
  if (items.length === 0) return null;
  return (
    <div className={`${topMargin ? 'mt-16 ' : ''}mb-12 border-t border-slate-200 dark:border-slate-800/50 pt-16`}>
      <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8 text-center">{heading}</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map(item => (
          <Link
            key={item.slug}
            to={`/${item.slug}`}
            className="group bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800/50 rounded-xl p-4 hover:border-teal-500 dark:hover:border-cyan-400 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-2 mb-1">
              <Icon className="w-4 h-4 text-teal-600 dark:text-cyan-400" />
              <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-cyan-400 transition-colors text-sm">
                {item.title}
              </h3>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
              {item.metaDescription}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

function buildAttractionJsonLd(attraction: Attraction) {
  const base = {
    '@context': 'https://schema.org',
    name: attraction.title,
    description: attraction.metaDescription,
    url: `https://alanya-holidays.com/${attraction.slug}`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Alanya',
      addressRegion: 'Antalya',
      addressCountry: 'TR',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: attraction.coordinates.lat,
      longitude: attraction.coordinates.lng,
    },
    touristType: 'Sightseeing',
  };

  if (attraction.jsonLdType === 'TouristTrip') {
    return { ...base, '@type': 'TouristTrip', tripOrigin: { '@type': 'City', name: 'Alanya' } };
  }
  if (attraction.jsonLdType === 'Beach') {
    return { ...base, '@type': ['TouristAttraction', 'Beach'] };
  }
  return { ...base, '@type': attraction.jsonLdType };
}

const AttractionPage: React.FC = () => {
  const slug = useLocation().pathname.slice(1);
  const attraction = getAttraction(slug);

  const [listings, setListings] = useState<DirectoryListingDB[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState<DirectoryListingDB | null>(null);
  const [showFullDescription, setShowFullDescription] = useState(false);

  useEffect(() => {
    if (!attraction) return;
    const fetchListings = async () => {
      setLoading(true);
      try {
        const primaryQuery = attraction.searchKeywords[0] || attraction.title;
        const result = await directoryService.searchDirectoryListings(primaryQuery, 'tours');
        if (result.data?.length > 0) {
          setListings(result.data);
        } else {
          const fallbackQuery = attraction.title
            .replace(' in Alanya', '')
            .replace(' from Alanya', '')
            .replace(' near Alanya', '');
          const broader = await directoryService.searchDirectoryListings(fallbackQuery, 'tours');
          setListings(broader.data ?? []);
        }
      } catch (e) {
        console.error('Failed to load attraction listings', e);
      } finally {
        setLoading(false);
      }
    };
    fetchListings();
  }, [attraction]);

  const handleListingClick = useCallback((listing: DirectoryListingDB) => {
    setSelectedListing(listing);
    const sessionKey = `listing_view_${listing.id}_${new Date().toISOString().slice(0, 10)}`;
    if (!sessionStorage.getItem(sessionKey)) {
      sessionStorage.setItem(sessionKey, '1');
      directoryService.trackListingView(listing.id).catch(console.error);
    }
  }, []);

  if (!attraction) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <SEOHead title="Attraction Not Found" noIndex />
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Attraction Not Found</h1>
          <Link to="/things-to-do-in-alanya" className="text-teal-600 dark:text-cyan-400 hover:underline">
            Browse all things to do in Alanya
          </Link>
        </div>
      </div>
    );
  }

  const jsonLd = buildAttractionJsonLd(attraction);

  const relatedExcursions = attraction.relatedExcursionSlugs
    .map(s => getExcursionType(s))
    .filter((et): et is ExcursionType => et !== undefined);

  const relatedAttractions = attraction.relatedAttractionSlugs
    .map(s => getAttraction(s))
    .filter((a): a is Attraction => a !== undefined);

  const hasPracticalInfo =
    attraction.practicalInfo.hours ||
    attraction.practicalInfo.admission ||
    attraction.practicalInfo.howToGet ||
    attraction.practicalInfo.tips;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-24 pb-16">
      <SEOHead
        title={attraction.metaTitle}
        description={attraction.metaDescription}
        keywords={attraction.keywords}
        jsonLd={jsonLd}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Things to Do', href: '/things-to-do-in-alanya' },
            { label: attraction.title },
          ]}
        />
      </div>

      {/* Hero */}
      <div className="bg-white dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800/50 shadow-sm mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center md:text-left md:py-16">
          <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
            <MapPin className="w-8 h-8 text-teal-600 dark:text-cyan-400" />
            <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-white">
              {attraction.title}
            </h1>
          </div>
          <div className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-4xl leading-relaxed">
            <p className="mb-4">{attraction.metaDescription}</p>
            <div className={`transition-all duration-500 overflow-hidden text-left ${showFullDescription ? 'max-h-[2000px] opacity-100 mt-6' : 'max-h-0 opacity-0'}`}>
              <p className="mb-4 text-base md:text-lg">{attraction.longDescription}</p>
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
        {/* Practical Info */}
        {hasPracticalInfo && (
          <div className="mb-12 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800/50 rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Practical Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {attraction.practicalInfo.hours && (
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-teal-600 dark:text-cyan-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Hours</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{attraction.practicalInfo.hours}</p>
                  </div>
                </div>
              )}
              {attraction.practicalInfo.admission && (
                <div className="flex items-start gap-3">
                  <Ticket className="w-5 h-5 text-teal-600 dark:text-cyan-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Admission</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{attraction.practicalInfo.admission}</p>
                  </div>
                </div>
              )}
              {attraction.practicalInfo.howToGet && (
                <div className="flex items-start gap-3">
                  <Bus className="w-5 h-5 text-teal-600 dark:text-cyan-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">How to Get There</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{attraction.practicalInfo.howToGet}</p>
                  </div>
                </div>
              )}
              {attraction.practicalInfo.tips && (
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-teal-600 dark:text-cyan-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Tips</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{attraction.practicalInfo.tips}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Listings */}
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 px-2">
          Available Tours & Activities
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
              No tours available yet
            </h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm">
              We're adding more tours for this attraction. Check back soon or browse all things to do in Alanya.
            </p>
            <Link
              to="/things-to-do-in-alanya"
              className="mt-4 text-teal-600 dark:text-cyan-400 hover:underline font-medium"
            >
              Browse all things to do
            </Link>
          </div>
        )}

        {/* Related Excursions / Nearby Attractions */}
        <RelatedItemsGrid heading="Related Excursions" items={relatedExcursions} icon={Compass} topMargin />
        <RelatedItemsGrid heading="Nearby Attractions" items={relatedAttractions} icon={MapPin} />
      </div>

      <DirectoryListingModal
        listing={selectedListing}
        isOpen={!!selectedListing}
        onClose={() => setSelectedListing(null)}
      />
    </div>
  );
};

export { AttractionPage };