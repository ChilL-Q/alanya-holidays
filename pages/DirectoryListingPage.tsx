import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    Star, MapPin, Globe, MessageCircle, BadgeCheck, Check,
    Info, Award, ArrowLeft, ExternalLink,
} from 'lucide-react';
import { SEOHead } from '../components/seo/SEOHead';
import { Breadcrumb } from '../components/seo/Breadcrumb';
import { db } from '../api-services';
import { DirectoryListingDB } from '../types/models';
import { directoryCategoryIntros } from '../data/directoryData';
import { CATEGORY_PATHS, getListingUrl, getSchemaType } from '../constants/categoryPaths';
import { isValidVideoUrl } from '../utils/videoEmbed';
import { VideoEmbed } from '../components/ui/VideoEmbed';
import { ListingReviewSection } from '../components/directory/ListingReviewSection';
import { DirectoryListingCard } from '../components/directory/DirectoryListingCard';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { ClaimListingModal } from '../components/directory/ClaimListingModal';

interface DirectoryListingPageProps {
    categoryId: string;
}

export const DirectoryListingPage: React.FC<DirectoryListingPageProps> = ({ categoryId }) => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { user } = useAuth();

    const [listing, setListing] = useState<DirectoryListingDB | null>(null);
    const [related, setRelated] = useState<DirectoryListingDB[]>([]);
    const [loading, setLoading] = useState(true);
    const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);

    const handleClaimClick = () => {
        if (!user) {
            navigate(`/login?returnUrl=${encodeURIComponent(window.location.pathname)}`);
            return;
        }
        setIsClaimModalOpen(true);
    };

    const categoryIntro = directoryCategoryIntros[categoryId];
    const categoryPath = CATEGORY_PATHS[categoryId] || '/';

    useEffect(() => {
        if (!slug) return;

        let cancelled = false;

        const load = async () => {
            setLoading(true);
            try {
                const [found, allInCategory] = await Promise.all([
                    db.getDirectoryListingBySlug(slug),
                    db.getDirectoryListingsByCategory(categoryId),
                ]);
                if (cancelled) return;

                if (found) {
                    db.trackListingView(found.id).catch(console.error);
                    setRelated(allInCategory.filter(l => l.id !== found.id).slice(0, 3));
                }
                setListing(found);
            } catch (err) {
                console.error('Failed to load listing page:', err);
                if (!cancelled) setListing(null);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();
        return () => { cancelled = true; };
    }, [slug, categoryId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-24 pb-16 flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-500" />
            </div>
        );
    }

    if (!listing) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-24 pb-16">
                <div className="max-w-3xl mx-auto px-4 py-16 text-center">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Listing not found</h1>
                    <p className="text-slate-600 dark:text-slate-400 mb-8">
                        This listing may have been removed or the URL has changed.
                    </p>
                    <Link
                        to={categoryPath}
                        className="inline-flex items-center gap-2 text-teal-600 dark:text-cyan-400 font-semibold hover:underline"
                    >
                        <ArrowLeft size={16} /> Back to {categoryIntro?.title || 'Directory'}
                    </Link>
                </div>
            </div>
        );
    }

    const isPaidTier = listing.tier && listing.tier !== 'explorer';
    const hasVideo = listing.video_url ? isValidVideoUrl(listing.video_url) : false;

    const localBusinessSchema = {
        '@context': 'https://schema.org',
        '@type': getSchemaType(categoryId),
        name: listing.name,
        description: listing.short_description,
        image: listing.gallery?.[0] || undefined,
        url: `https://alanya-holidays.com${getListingUrl(categoryId, listing.slug!)}`,
        address: {
            '@type': 'PostalAddress',
            addressLocality: listing.location,
            addressCountry: 'TR',
        },
        ...(listing.reviews_average && listing.reviews_count ? {
            aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: listing.reviews_average,
                reviewCount: listing.reviews_count,
                bestRating: 5,
                worstRating: 1,
            },
        } : {}),
        ...(listing.price_level ? { priceRange: '$$$$'.slice(0, listing.price_level) } : {}),
    };

    const categoryTitle = categoryIntro?.title || 'Directory';

    const listingKeywords = [
        `${listing.name} Alanya`,
        `${listing.name} ${listing.location}`,
        `${listing.name} ${listing.location} Alanya`,
        `${categoryTitle} Alanya`,
        `${listing.name} Turkey`,
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-24 pb-16">
            <SEOHead
                title={`${listing.name} — ${categoryTitle}`}
                description={listing.short_description}
                image={listing.gallery?.[0]}
                type="website"
                keywords={listingKeywords}
                jsonLd={localBusinessSchema}
            />

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Breadcrumb */}
                <div className="pt-6 pb-4">
                    <Breadcrumb
                        items={[
                            { label: 'Home', href: '/' },
                            { label: categoryTitle, href: categoryPath },
                            { label: listing.name },
                        ]}
                    />
                </div>

                {/* Hero Gallery */}
                {listing.gallery && listing.gallery.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8 rounded-2xl overflow-hidden">
                        <div className="sm:row-span-2 relative h-64 sm:h-auto">
                            <img
                                src={listing.gallery[0]}
                                alt={listing.name}
                                className="w-full h-full object-cover"
                            />
                            {listing.is_featured && (
                                <div className="absolute top-4 left-4 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                                    <Star size={12} className="fill-white" /> Featured
                                </div>
                            )}
                        </div>
                        {listing.gallery.slice(1, 3).map((img, i) => (
                            <div key={i} className="relative h-48 sm:h-auto">
                                <img src={img} alt={`${listing.name} ${i + 2}`} className="w-full h-full object-cover" />
                            </div>
                        ))}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Title + Badges */}
                        <div>
                            <div className="flex flex-wrap items-center gap-3 mb-3">
                                {listing.tier === 'signature' && (
                                    <span className="inline-flex items-center gap-1 text-sm font-medium bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 px-3 py-1 rounded-full">
                                        <BadgeCheck size={14} /> Verified Premium
                                    </span>
                                )}
                                {(listing.tier === 'voyager' || listing.tier === 'partner') && (
                                    <span className="inline-flex items-center gap-1 text-sm font-medium bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 px-3 py-1 rounded-full">
                                        <Award size={14} /> Recommended
                                    </span>
                                )}
                                {listing.is_verified && (
                                    <span className="inline-flex items-center gap-1 text-sm font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full">
                                        <BadgeCheck size={14} /> Verified
                                    </span>
                                )}
                            </div>

                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{listing.name}</h1>

                            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                                <span className="flex items-center gap-1">
                                    <MapPin size={14} /> {listing.location}
                                </span>
                                <span className="flex items-center gap-1">
                                    <div className="flex text-amber-500">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <Star key={star} size={13} className={star <= Math.round(listing.reviews_average || 0) ? 'fill-amber-500' : 'fill-slate-200 text-slate-200'} />
                                        ))}
                                    </div>
                                    <span className="font-bold text-slate-900 dark:text-white ml-1">
                                        {listing.reviews_average?.toFixed(1) || 'New'}
                                    </span>
                                    <span className="text-slate-500">({listing.reviews_count || 0})</span>
                                </span>
                                {listing.price_level && (
                                    <span className="font-medium text-slate-700 dark:text-slate-300">
                                        {'$$$$'.slice(0, listing.price_level)}
                                        <span className="text-slate-300 dark:text-slate-600">{'$$$$'.slice(listing.price_level)}</span>
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Description */}
                        <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-6 border border-slate-100 dark:border-slate-800/50">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3">About</h2>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
                                {listing.short_description}
                            </p>
                        </div>

                        {/* Certifications & Languages */}
                        {(listing.certifications?.length || listing.languages_spoken?.length) ? (
                            <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-6 border border-slate-100 dark:border-slate-800/50 space-y-5">
                                {listing.certifications && listing.certifications.length > 0 && (
                                    <div>
                                        <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Specialties</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {listing.certifications.map(cert => (
                                                <span key={cert} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-teal-50 dark:bg-cyan-900/20 text-teal-700 dark:text-cyan-400 text-sm font-medium border border-teal-100 dark:border-cyan-800/30">
                                                    <BadgeCheck size={13} /> {cert}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {listing.languages_spoken && listing.languages_spoken.length > 0 && (
                                    <div>
                                        <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Languages spoken</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {listing.languages_spoken.map(lang => (
                                                <span key={lang} className="inline-block px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md text-sm border border-slate-200 dark:border-slate-700">
                                                    {lang}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : null}

                        {/* Amenities */}
                        <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-6 border border-slate-100 dark:border-slate-800/50">
                            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">What's included</h3>
                            <div className="grid grid-cols-2 gap-2 text-sm text-slate-600 dark:text-slate-400">
                                <div className="flex items-center gap-1.5"><Check size={14} className="text-green-500" /> English Support</div>
                                <div className="flex items-center gap-1.5"><Check size={14} className="text-green-500" /> Online Booking</div>
                                {listing.is_verified && (
                                    <div className="flex items-center gap-1.5"><Check size={14} className="text-green-500" /> Verified Partner</div>
                                )}
                            </div>
                        </div>

                        {/* Video */}
                        {hasVideo && (
                            <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-6 border border-slate-100 dark:border-slate-800/50">
                                <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Video</h3>
                                <VideoEmbed url={listing.video_url || ''} title="Listing video" />
                            </div>
                        )}

                        {/* Full gallery */}
                        {listing.gallery && listing.gallery.length > 3 && (
                            <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-6 border border-slate-100 dark:border-slate-800/50">
                                <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Gallery</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {listing.gallery.slice(3).map((img, i) => (
                                        <img key={i} src={img} alt={`${listing.name} photo ${i + 4}`} className="w-full h-32 object-cover rounded-xl" />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Reviews */}
                        <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-6 border border-slate-100 dark:border-slate-800/50">
                            <ListingReviewSection listingId={listing.id} />
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-5">

                        {/* Contact Box */}
                        <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-6 border border-slate-100 dark:border-slate-800/50 sticky top-28">
                            <h2 className="font-bold text-slate-900 dark:text-white mb-4 text-lg">Contact provider</h2>

                            <div className="space-y-3">
                                {isPaidTier && listing.whatsapp && (
                                    <button
                                        onClick={() => {
                                            db.trackListingClick(listing.id, 'whatsapp').catch(console.error);
                                            window.open(`https://wa.me/${listing.whatsapp?.replace(/\D/g, '')}`, '_blank');
                                        }}
                                        className="w-full flex items-center justify-center gap-2 py-3.5 px-4 font-semibold rounded-xl bg-green-500 hover:bg-green-600 text-white shadow-sm transition-all"
                                    >
                                        <MessageCircle size={18} /> Chat on WhatsApp
                                    </button>
                                )}

                                <button
                                    onClick={() => {
                                        if (listing.website) {
                                            db.trackListingClick(listing.id, 'website').catch(console.error);
                                            window.open(listing.website, '_blank');
                                        }
                                    }}
                                    disabled={!listing.website}
                                    className={`w-full flex items-center justify-center gap-2 py-3 px-4 font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-all ${listing.website ? 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800' : 'text-slate-400 cursor-not-allowed opacity-50'}`}
                                >
                                    <Globe size={18} /> Visit Website
                                </button>

                                <button
                                    onClick={() => {
                                        db.trackListingClick(listing.id, 'map').catch(console.error);
                                        if (listing.google_map_url) {
                                            window.open(listing.google_map_url, '_blank');
                                        } else {
                                            const q = encodeURIComponent(`${listing.name} ${listing.location}`);
                                            window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, '_blank');
                                        }
                                    }}
                                    className="w-full flex items-center justify-center gap-2 py-3 px-4 font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                                >
                                    <MapPin size={18} /> View on Map
                                </button>

                                {!listing.owner_user_id && (
                                    <button
                                        onClick={handleClaimClick}
                                        className="w-full flex items-center justify-center gap-2 py-3 px-4 font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-teal-500 dark:hover:border-cyan-500 hover:text-teal-600 dark:hover:text-cyan-400 transition-all cursor-pointer"
                                    >
                                        <Award size={18} className="text-teal-600 dark:text-cyan-400" /> {t('directory.claim.button')}
                                    </button>
                                )}
                            </div>

                            <div className="flex items-start gap-3 mt-4 p-4 bg-teal-50 dark:bg-cyan-900/10 rounded-xl text-teal-800 dark:text-cyan-300">
                                <Info size={18} className="flex-shrink-0 mt-0.5" />
                                <p className="text-xs leading-relaxed">
                                    Please mention <strong>Alanya Holidays</strong> when contacting the provider.
                                </p>
                            </div>
                        </div>

                        {/* Back to category */}
                        <Link
                            to={categoryPath}
                            className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-cyan-400 transition-colors"
                        >
                            <ArrowLeft size={14} /> Back to {categoryTitle}
                        </Link>
                    </div>
                </div>

                {/* Related Listings */}
                {related.length > 0 && (
                    <div className="mt-16">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                            More in {categoryTitle}
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {related.map(item => (
                                <DirectoryListingCard
                                    key={item.id}
                                    listing={item}
                                    isAuthenticated={false}
                                    onClick={() => item.slug && navigate(getListingUrl(item.category_id, item.slug))}
                                />
                            ))}
                        </div>

                        <div className="mt-8 text-center">
                            <Link
                                to={categoryPath}
                                className="inline-flex items-center gap-2 text-teal-600 dark:text-cyan-400 font-semibold hover:underline"
                            >
                                View all in {categoryTitle} <ExternalLink size={16} />
                            </Link>
                        </div>
                    </div>
                )}
            </div>

            {isClaimModalOpen && (
                <ClaimListingModal
                    isOpen={isClaimModalOpen}
                    onClose={() => setIsClaimModalOpen(false)}
                    listing={listing}
                />
            )}
        </div>
    );
};
