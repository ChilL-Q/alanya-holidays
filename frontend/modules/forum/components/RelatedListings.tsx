import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, MapPin, Loader2 } from 'lucide-react';
import { directoryService } from '../../../api-services';
import { DirectoryListingDB } from '../../../types/models';
import { mapForumCategoryToDirectoryCategories } from '../../../utils/forumToCategoryMapping';
import { getListingUrl } from '../../../constants/categoryPaths';

interface RelatedListingsProps {
    categorySlug: string | null | undefined;
    limit?: number;
}

export const RelatedListings: React.FC<RelatedListingsProps> = ({ categorySlug, limit = 5 }) => {
    const [listings, setListings] = useState<DirectoryListingDB[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadListings = async () => {
            setLoading(true);
            try {
                const categoryIds = mapForumCategoryToDirectoryCategories(categorySlug);
                if (categoryIds.length === 0) {
                    setListings([]);
                    return;
                }

                // Fetch listings for each mapped category and combine
                const results: DirectoryListingDB[] = [];
                for (const categoryId of categoryIds) {
                    try {
                        const categoryListings = await directoryService.getDirectoryListingsByCategory(categoryId);
                        results.push(...categoryListings);
                    } catch (err) {
                        console.error(`Failed to load listings for category ${categoryId}:`, err);
                    }
                }

                // Remove duplicates (by ID), sort by is_featured then base_score, and limit
                const unique = Array.from(new Map(results.map(l => [l.id, l])).values());
                unique.sort((a, b) => {
                    if (a.is_featured !== b.is_featured) {
                        return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
                    }
                    return (b.base_score || 0) - (a.base_score || 0);
                });

                setListings(unique.slice(0, limit));
            } catch (err) {
                console.error('Failed to load related listings:', err);
                setListings([]);
            } finally {
                setLoading(false);
            }
        };

        loadListings();
    }, [categorySlug, limit]);

    if (loading) {
        return (
            <aside className="mt-8 p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex justify-center">
                    <Loader2 size={24} className="animate-spin text-teal-500" />
                </div>
            </aside>
        );
    }

    if (listings.length === 0) {
        return null;
    }

    return (
        <aside className="mt-8">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Related Listings</h2>
            <div className="space-y-3">
                {listings.map((listing) => (
                    <Link
                        key={listing.id}
                        to={getListingUrl(listing.category_id, listing.slug || listing.id)}
                        className="block p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-teal-400 dark:hover:border-teal-400 hover:shadow-md transition-all duration-200"
                    >
                        <div className="flex gap-4">
                            {/* Image */}
                            <div className="flex-shrink-0 w-20 h-20 rounded-md overflow-hidden bg-slate-100 dark:bg-slate-700">
                                <img
                                    src={listing.gallery?.[0] || 'https://images.unsplash.com/photo-1542037104857-ffbb0b9155fb'}
                                    alt={listing.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-slate-900 dark:text-white text-sm line-clamp-2 hover:text-teal-600 dark:hover:text-teal-400">
                                    {listing.name}
                                </h3>
                                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1 mt-1">
                                    {listing.short_description}
                                </p>

                                {/* Rating & Location */}
                                <div className="flex items-center gap-2 mt-2 text-xs text-slate-600 dark:text-slate-400">
                                    {listing.reviews_average !== undefined && listing.reviews_average > 0 && (
                                        <div className="flex items-center gap-1">
                                            <Star size={12} className="fill-amber-500 text-amber-500" />
                                            <span className="font-medium">{listing.reviews_average.toFixed(1)}</span>
                                        </div>
                                    )}
                                    {listing.location && (
                                        <div className="flex items-center gap-1 line-clamp-1">
                                            <MapPin size={12} />
                                            <span className="truncate">{listing.location}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </aside>
    );
};
