import React from 'react';
import { Star, MapPin, Globe, MessageCircle, BadgeCheck, Check, Info, Award } from 'lucide-react';
import { DirectoryListingDB } from '../../types/models';
import { Modal } from '../ui/Modal';
import { db } from '../../api-services';
import { parseVideoEmbed } from '../../utils/videoEmbed';

interface DirectoryListingModalProps {
    listing: DirectoryListingDB | null;
    isOpen: boolean;
    onClose: () => void;
}

export const DirectoryListingModal: React.FC<DirectoryListingModalProps> = ({ listing, isOpen, onClose }) => {
    if (!listing) return null;

    const isPaidTier = (tier?: string) => tier && tier !== 'explorer';
    const videoEmbed = listing.video_url ? parseVideoEmbed(listing.video_url) : null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} maxWidth="2xl" title={listing.name} lockBodyScroll={false}>
            <div className="space-y-6">
                
                {/* Header Image */}
                {listing.gallery?.[0] && (
                    <div className="relative w-full h-48 sm:h-64 rounded-xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800">
                        <img
                            src={listing.gallery[0]}
                            alt={listing.name}
                            className="w-full h-full object-cover"
                        />
                        {listing.is_featured && (
                            <div className="absolute top-3 left-3 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                                <Star size={12} className="fill-white" /> Featured
                            </div>
                        )}
                    </div>
                )}

                {/* Subinfo Row */}
                <div className="flex flex-wrap items-center gap-4 text-sm sm:text-base text-slate-600 dark:text-slate-400">
                    {listing.is_verified && (
                        <div className="flex items-center gap-1 font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-lg">
                            <BadgeCheck size={16} /> Verified
                        </div>
                    )}
                    {isPaidTier(listing.tier) && (
                        <div className="flex items-center gap-1 font-medium bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 px-3 py-1.5 rounded-lg">
                            <Award size={16} /> Recommended
                        </div>
                    )}
                    <div className="flex items-center gap-1 font-medium bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg">
                        <MapPin size={16} className="text-slate-400" />
                        {listing.location}
                    </div>
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg">
                        <div className="flex text-amber-500">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star key={star} size={14} className={star <= Math.round(listing.reviews_average || 0) ? "fill-amber-500" : "fill-slate-200 text-slate-200"} />
                            ))}
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white ml-1">{listing.reviews_average?.toFixed(1) || 'New'}</span>
                        <span className="text-slate-500">({listing.reviews_count || 0})</span>
                    </div>
                    {listing.price_level && (
                        <div className="font-medium bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg text-slate-700 dark:text-slate-300">
                            {'$$$$'.slice(0, listing.price_level)}<span className="text-slate-300 dark:text-slate-600">{'$$$$'.slice(listing.price_level)}</span>
                        </div>
                    )}
                </div>

                {/* Main Content & Actions Split */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Left Col: Details */}
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">About</h3>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm whitespace-pre-wrap">
                                {listing.short_description}
                            </p>
                        </div>

                        {videoEmbed && (
                            <div className="space-y-2">
                                <h4 className="font-semibold text-slate-900 dark:text-white text-sm">Video</h4>
                                <div className="relative w-full rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 aspect-video">
                                    <iframe
                                        src={videoEmbed.embedUrl}
                                        title="Listing video"
                                        className="absolute inset-0 w-full h-full border-0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        loading="lazy"
                                    />
                                </div>
                            </div>
                        )}

                        {(listing.certifications?.length || listing.languages_spoken?.length) ? (
                            <div className="space-y-4">
                                {listing.certifications && listing.certifications.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold text-slate-900 dark:text-white mb-2 text-sm">Specialties</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {listing.certifications.map(cert => (
                                                <span key={cert} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-teal-50 dark:bg-cyan-900/20 text-teal-700 dark:text-cyan-400 text-xs font-medium border border-teal-100 dark:border-cyan-800/30">
                                                    <BadgeCheck size={12} /> {cert}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {listing.languages_spoken && listing.languages_spoken.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold text-slate-900 dark:text-white mb-2 text-sm">Languages</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {listing.languages_spoken.map(lang => (
                                                <span key={lang} className="inline-flex items-center px-2.5 py-1 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md text-xs border border-slate-200 dark:border-slate-700">
                                                    {lang}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : null}

                        <div>
                            <h4 className="font-semibold text-slate-900 dark:text-white mb-2 text-sm">Amenities</h4>
                            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
                                <div className="flex items-center gap-1.5"><Check size={14} className="text-green-500" /> English Support</div>
                                <div className="flex items-center gap-1.5"><Check size={14} className="text-green-500" /> Online Booking</div>
                                {listing.is_verified && (
                                    <div className="flex items-center gap-1.5"><Check size={14} className="text-green-500" /> Verified Partner</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Col: Actions */}
                    <div className="space-y-4">
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <h3 className="font-bold text-slate-900 dark:text-white mb-4">Contact provider</h3>
                            
                            <div className="space-y-3">
                                {isPaidTier(listing.tier) && listing.whatsapp ? (
                                    <button
                                        onClick={() => {
                                            db.trackListingClick(listing.id, 'whatsapp').catch(console.error);
                                            window.open(`https://wa.me/${listing.whatsapp?.replace(/\D/g, '')}`, '_blank');
                                        }}
                                        className="w-full flex items-center justify-center gap-2 py-3.5 px-4 font-semibold rounded-xl bg-green-500 hover:bg-green-600 text-white shadow-sm hover:shadow transition-all"
                                    >
                                        <MessageCircle size={18} /> Chat on WhatsApp
                                    </button>
                                ) : null}

                                <button
                                    onClick={() => {
                                        if (listing.website) {
                                            db.trackListingClick(listing.id, 'website').catch(console.error);
                                            window.open(listing.website, '_blank');
                                        }
                                    }}
                                    className={`w-full flex items-center justify-center gap-2 py-3 px-4 font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-all ${listing.website ? 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800' : 'text-slate-400 bg-slate-50 dark:bg-slate-800/30 cursor-not-allowed'}`}
                                    disabled={!listing.website}
                                >
                                    <Globe size={18} /> Visit Website
                                </button>

                                <button
                                    className="w-full flex items-center justify-center gap-2 py-3 px-4 font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                                    onClick={() => {
                                        db.trackListingClick(listing.id, 'map').catch(console.error);
                                        if (listing.google_map_url) {
                                            window.open(listing.google_map_url, '_blank');
                                        } else {
                                            const query = encodeURIComponent(`${listing.name} ${listing.location}`);
                                            window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
                                        }
                                    }}
                                >
                                    <MapPin size={18} /> View on Map
                                </button>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-4 bg-teal-50 dark:bg-cyan-900/10 rounded-xl text-teal-800 dark:text-cyan-300">
                            <Info size={18} className="flex-shrink-0 mt-0.5" />
                            <p className="text-xs leading-relaxed">
                                Please mention <strong>Alanya Holidays</strong> when contacting the provider.
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </Modal>
    );
};
