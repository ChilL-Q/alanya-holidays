import React from 'react';
import { Award, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DirectoryListingDB } from '../../types/models';
import { DirectoryListingCard } from '../directory/DirectoryListingCard';
import { useLanguage } from '../../context/LanguageContext';

interface RecentlyClaimedSectionProps {
    listings: DirectoryListingDB[];
    loading: boolean;
}

export const RecentlyClaimedSection: React.FC<RecentlyClaimedSectionProps> = ({ listings, loading }) => {
    const { t } = useLanguage();
    const navigate = useNavigate();

    // If not loading and no listings, hide the section entirely
    if (!loading && listings.length === 0) {
        return null;
    }

    return (
        <div className="bg-gradient-to-b from-teal-50/30 to-slate-50 dark:from-teal-950/5 dark:to-slate-900/50 py-16 md:py-24 border-y border-teal-100/30 dark:border-teal-900/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-10 gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Award className="w-5 h-5 text-teal-600 dark:text-cyan-400" />
                            <span className="text-xs uppercase font-bold text-teal-600 dark:text-cyan-400 tracking-widest">
                                {t('home.recently_claimed.badge')}
                            </span>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                            {t('home.recently_claimed.title')}
                        </h2>
                        <p className="mt-2 text-slate-600 dark:text-slate-400 text-sm md:text-base">
                            {t('home.recently_claimed.subtitle')}
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/search')}
                        className="flex items-center gap-1 text-sm font-semibold text-teal-600 dark:text-cyan-400 hover:text-teal-700 dark:hover:text-cyan-300 transition-colors self-start sm:self-auto"
                    >
                        {t('home.recently_claimed.view_all')} <ArrowRight size={16} />
                    </button>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-96 bg-white dark:bg-slate-800 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                )}

                {/* Listings Grid */}
                {!loading && listings.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {listings.map((listing) => (
                            <DirectoryListingCard key={listing.id} listing={listing} variant="box" />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
