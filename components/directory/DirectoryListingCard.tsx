import React from 'react';
import { Star, MapPin, Globe, MessageCircle, BadgeCheck, Check, ThumbsUp, ThumbsDown, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DirectoryListingDB } from '../../types/models';
import { db } from '../../api-services';
import { useLanguage } from '../../context/LanguageContext';
import { useCardStyle, CardStyle } from '../../context/CardStyleContext';
import { getListingDescription } from '../../utils/getListingDescription';
import { getListingUrl } from '../../constants/categoryPaths';

interface DirectoryListingCardProps {
    listing: DirectoryListingDB;
    onClick?: (listing: DirectoryListingDB) => void;
    userVote?: 1 | -1 | null;
    onVote?: (listingId: string, vote: 1 | -1) => void;
    isAuthenticated?: boolean;
    isVoting?: boolean;
    categoryName?: string;
    /** Overrides the global card-style preference (e.g. home carousels force 'box'). */
    variant?: CardStyle;
}

export const DirectoryListingCard: React.FC<DirectoryListingCardProps> = ({
    listing, onClick, userVote, onVote, isAuthenticated, isVoting, categoryName, variant
}) => {
    const { language } = useLanguage();
    const { cardStyle } = useCardStyle();
    const displayDescription = getListingDescription(listing, language);
    // T13: "box" = vertical card (grid); "rectangle" = horizontal row (list).
    const isList = (variant ?? cardStyle) === 'rectangle';
    const netVotes = listing.net_votes || 0;
    const isPaidTier = (tier?: string) => tier && tier !== 'explorer';

    const handleVote = (e: React.MouseEvent, vote: 1 | -1) => {
        e.stopPropagation();
        if (!isAuthenticated || isVoting) return;
        onVote?.(listing.id, vote);
    };

    return (
        <div
            className={`group bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-slate-200 dark:border-slate-700 ${isList ? 'flex flex-col sm:flex-row' : 'flex flex-col h-full'} ${onClick ? 'cursor-pointer' : ''}`}
            onClick={() => onClick && onClick(listing)}
        >
            {/* Image */}
            <div className={`relative flex-shrink-0 ${isList ? 'w-full h-56 sm:w-72 sm:h-auto' : 'w-full h-56'}`}>
                <img
                    src={listing.gallery?.[0] || 'https://images.unsplash.com/photo-1542037104857-ffbb0b9155fb'}
                    alt={listing.name}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                />
                {listing.is_featured && (
                    <div className="absolute top-4 left-4 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                        <Star size={12} className="fill-white" /> Trusted by Travellers
                    </div>
                )}
                {listing.tier === 'signature' && (
                    <div className="absolute top-4 right-4 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                        <BadgeCheck size={12} className="fill-white" /> Verified Experience
                    </div>
                )}
                {(listing.tier === 'voyager' || listing.tier === 'partner') && (
                    <div className="absolute top-4 right-4 bg-teal-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                        <Award size={12} className="fill-white" /> Recommended
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-5 flex-1 flex flex-col">
                {/* Rating Row */}
                <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-1">
                        <div className="flex text-amber-500">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star key={star} size={14} className={star <= Math.round(listing.reviews_average || 0) ? "fill-amber-500" : "fill-slate-200 text-slate-200"} />
                            ))}
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white text-sm ml-1">{listing.reviews_average?.toFixed(1) || 'New'}</span>
                    </div>
                    <div className="text-slate-500 dark:text-slate-400 text-sm">
                        ({listing.reviews_count || 0} reviews)
                    </div>
                </div>

                {/* Title and Location */}
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                    {listing.name}
                    {listing.is_verified && <BadgeCheck className="text-blue-500 w-5 h-5 flex-shrink-0" />}
                    {categoryName && (
                        <span className="text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                            {categoryName}
                        </span>
                    )}
                </h3>
                <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-sm mb-3">
                    <MapPin size={14} /> {listing.location}
                </div>

                {/* Description */}
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-4 line-clamp-2">
                    {displayDescription}
                </p>

                {/* Vote Buttons */}
                <div className="flex items-center gap-3 mb-4">
                    <button
                        onClick={(e) => handleVote(e, 1)}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            userVote === 1
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                : isAuthenticated && !isVoting
                                    ? 'bg-slate-100 dark:bg-slate-700 text-slate-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 dark:hover:text-green-400'
                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                        }`}
                        title={isAuthenticated ? 'Helpful' : 'Login to vote'}
                        disabled={!isAuthenticated || isVoting}
                    >
                        <ThumbsUp size={14} className={userVote === 1 ? 'fill-green-600 dark:fill-green-400' : ''} />
                    </button>
                    <button
                        onClick={(e) => handleVote(e, -1)}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            userVote === -1
                                ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                                : isAuthenticated && !isVoting
                                    ? 'bg-slate-100 dark:bg-slate-700 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:hover:text-red-400'
                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                        }`}
                        title={isAuthenticated ? 'Not helpful' : 'Login to vote'}
                        disabled={!isAuthenticated || isVoting}
                    >
                        <ThumbsDown size={14} className={userVote === -1 ? 'fill-red-600 dark:fill-red-400' : ''} />
                    </button>
                    <span className={`text-xs font-medium ${netVotes > 0 ? 'text-green-600 dark:text-green-400' : netVotes < 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-400'}`}>
                        {netVotes > 0 ? `+${netVotes}` : netVotes}
                    </span>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {listing.certifications?.slice(0, 2).map(cert => (
                        <span key={cert} className="inline-block px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs font-medium border border-amber-100 dark:border-amber-800/30">
                            {cert}
                        </span>
                    ))}
                    {listing.languages_spoken?.slice(0, 2).map(lang => (
                        <span key={lang} className="inline-block px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs font-medium border border-amber-100 dark:border-amber-800/30">
                            {lang}
                        </span>
                    ))}
                    {(!listing.certifications?.length && !listing.languages_spoken?.length) && (
                        <span className="inline-block px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs font-medium border border-amber-100 dark:border-amber-800/30">
                            Verified Partner
                        </span>
                    )}
                </div>

                <div className="flex-1"></div>

                {/* Features (Checkmarks) */}
                <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400 mb-4">
                    <div className="flex items-center gap-1"><Check size={14} className="text-green-500" /> English Support</div>
                    <div className="flex items-center gap-1"><Check size={14} className="text-green-500" /> Online Booking</div>
                </div>

                {/* Actions CTA (Subtle buttons, retaining functionality) */}
                <div className={`grid gap-2 pt-4 border-t border-slate-100 dark:border-slate-800 ${
                    isPaidTier(listing.tier) && listing.whatsapp ? 'grid-cols-3' : 'grid-cols-2'
                }`}>
                    {isPaidTier(listing.tier) && listing.whatsapp && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                db.trackListingClick(listing.id, 'whatsapp').catch(console.error);
                                window.open(`https://wa.me/${listing.whatsapp?.replace(/\D/g, '')}`, '_blank');
                            }}
                            className="flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-lg text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                        >
                            <MessageCircle size={16} /> WhatsApp
                        </button>
                    )}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (listing.website) {
                                db.trackListingClick(listing.id, 'website').catch(console.error);
                                window.open(listing.website, '_blank');
                            }
                        }}
                        className={`flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-lg transition-colors ${listing.website ? 'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20' : 'text-slate-400 opacity-50 cursor-not-allowed'}`}
                        disabled={!listing.website}
                    >
                        <Globe size={16} /> Website
                    </button>
                    <button
                        className="flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        onClick={(e) => {
                            e.stopPropagation();
                            db.trackListingClick(listing.id, 'map').catch(console.error);
                            if (listing.google_map_url) {
                                window.open(listing.google_map_url, '_blank');
                            } else {
                                const query = encodeURIComponent(`${listing.name} ${listing.location}`);
                                window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
                            }
                        }}
                    >
                        <MapPin size={16} /> Map
                    </button>
                </div>

                {listing.slug && !listing.owner_user_id && (
                    <Link
                        to={getListingUrl(listing.category_id, listing.slug)}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center justify-center gap-1.5 w-full mt-3 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-full text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-teal-400 hover:text-teal-600 dark:hover:text-cyan-400 dark:hover:border-cyan-500 transition-colors"
                    >
                        <Award size={14} /> Claim Listing
                    </Link>
                )}
            </div>
        </div>
    );
};
