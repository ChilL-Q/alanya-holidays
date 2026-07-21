import React from 'react';
import { Diamond, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DirectoryListingDB } from '../../types/models';
import { DirectoryListingCard } from '../directory/DirectoryListingCard';

interface SignatureListingsSectionProps {
    listings: DirectoryListingDB[];
    loading: boolean;
}

export const SignatureListingsSection: React.FC<SignatureListingsSectionProps> = ({ listings, loading }) => {
    const navigate = useNavigate();

    return (
        <div className="bg-gradient-to-b from-indigo-50/50 to-slate-50 dark:from-indigo-950/10 dark:to-slate-900/50 py-16 md:py-24 border-y border-indigo-100/50 dark:border-indigo-900/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-10 gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Diamond className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                            <span className="text-xs uppercase font-bold text-indigo-600 dark:text-indigo-400 tracking-widest">
                                Curated Experience
                            </span>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                            Signature Collection
                        </h2>
                        <p className="mt-2 text-slate-600 dark:text-slate-400">
                            Top-tier verified businesses with premium service standards
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/search')}
                        className="flex items-center gap-1 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors self-start sm:self-auto"
                    >
                        View all <ArrowRight size={16} />
                    </button>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-96 bg-white dark:bg-slate-800 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!loading && listings.length === 0 && (
                    <div className="text-center py-12 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                        <Diamond className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-500 dark:text-slate-400">Signature Collection coming soon!</p>
                    </div>
                )}

                {/* Listings Grid */}
                {!loading && listings.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {listings.map((listing) => (
                            <DirectoryListingCard key={listing.id} listing={listing} variant="box" />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
