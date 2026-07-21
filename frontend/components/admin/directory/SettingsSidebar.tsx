import React from 'react';
import { Tag, Star, CheckCircle2, Mail } from 'lucide-react';

export interface SettingsSidebarProps {
    categoryId: string;
    isFeatured: boolean;
    isVerified: boolean;
    tier?: string;
    priceLevel: number;
    reviewsAverage: number;
    reviewsCount: number;
    newsletterFeatured?: boolean;
    onChange: (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => void;
}

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
    categoryId, isFeatured, isVerified, tier = 'explorer', priceLevel, reviewsAverage, reviewsCount, newsletterFeatured, onChange
}) => {
    const categories = ['medical', 'accommodations', 'tours', 'transport', 'restaurants', 'cafes', 'real-estate', 'visa', 'shopping', 'nature', 'spa-hamam', 'hair-beauty'];

    return (
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800/50 lg:sticky top-24">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Listing Settings</h2>

            <div className="space-y-5">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category *</label>
                    <div className="relative">
                        <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <select
                            name="category_id"
                            value={categoryId}
                            onChange={onChange}
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white appearance-none"
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>
                                    {cat.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800/50">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tier</label>
                    <select
                        name="tier"
                        value={tier}
                        onChange={onChange}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white appearance-none"
                    >
                        <option value="explorer">Explorer</option>
                        <option value="voyager">Voyager</option>
                        <option value="signature">Signature</option>
                        <option value="partner">Partner</option>
                    </select>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800/50">
                    <label className="flex items-start gap-3 cursor-pointer">
                        <div className="relative flex items-start mt-0.5">
                            <input
                                type="checkbox"
                                name="is_featured"
                                checked={isFeatured}
                                onChange={onChange}
                                className="w-5 h-5 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                            />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5"><Star size={14} className="text-amber-500 fill-current" /> Featured Listing</span>
                            <span className="text-xs text-slate-500">Highlights this listing in category grids</span>
                        </div>
                    </label>
                </div>

                <div className="pt-2">
                    <label className="flex items-start gap-3 cursor-pointer">
                        <div className="relative flex items-start mt-0.5">
                            <input
                                type="checkbox"
                                name="is_verified"
                                checked={isVerified}
                                onChange={onChange}
                                className="w-5 h-5 rounded border-slate-300 text-blue-500 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5"><CheckCircle2 size={14} className="text-blue-500" /> Verified Partner</span>
                            <span className="text-xs text-slate-500">Adds a verification badge to the business</span>
                        </div>
                    </label>
                </div>

                <div className="pt-2">
                    <label className="flex items-start gap-3 cursor-pointer">
                        <div className="relative flex items-start mt-0.5">
                            <input
                                type="checkbox"
                                name="newsletter_featured"
                                checked={newsletterFeatured || false}
                                onChange={onChange}
                                className="w-5 h-5 rounded border-slate-300 text-purple-500 focus:ring-purple-500"
                            />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5"><Mail size={14} className="text-purple-500" /> Include in Newsletter</span>
                            <span className="text-xs text-slate-500">
                                {tier === 'signature' ? 'Featured in upcoming newsletter campaigns' : 'Signature tier only'}
                            </span>
                        </div>
                    </label>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800/50">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Price Level Indicator</label>
                    <select
                        name="price_level"
                        value={priceLevel}
                        onChange={onChange}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white appearance-none"
                    >
                        <option value={1}>$ (Budget)</option>
                        <option value={2}>$$ (Moderate)</option>
                        <option value={3}>$$$ (Expensive)</option>
                        <option value={4}>$$$$ (Luxury)</option>
                    </select>
                </div>
                
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800/50">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Google Reviews (Stat Mocking)</label>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">Score (0-5)</label>
                            <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="5"
                                name="reviews_average"
                                value={reviewsAverage}
                                onChange={onChange}
                                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 text-sm outline-none dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">Total Count</label>
                            <input
                                type="number"
                                name="reviews_count"
                                min="0"
                                value={reviewsCount}
                                onChange={onChange}
                                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 text-sm outline-none dark:text-white"
                            />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
