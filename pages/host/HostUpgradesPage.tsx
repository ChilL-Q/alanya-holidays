import React, { useEffect, useState, useCallback } from 'react';
import { Sparkles, Check, Clock } from 'lucide-react';
import { db } from '../../api-services';
import { DirectoryListingDB, ListingAddon } from '../../types/models';
import { ADDON_CATALOG } from '../../data/addonCatalog';

const ACCENT: Record<string, { icon: string; ring: string }> = {
    amber: { icon: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400', ring: 'border-amber-200 dark:border-amber-900/30' },
    blue: { icon: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400', ring: 'border-blue-200 dark:border-blue-900/30' },
    rose: { icon: 'text-rose-600 bg-rose-50 dark:bg-rose-900/20 dark:text-rose-400', ring: 'border-rose-200 dark:border-rose-900/30' },
    indigo: { icon: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 dark:text-indigo-400', ring: 'border-indigo-200 dark:border-indigo-900/30' },
    teal: { icon: 'text-teal-600 bg-teal-50 dark:bg-teal-900/20 dark:text-teal-400', ring: 'border-teal-200 dark:border-teal-900/30' },
};

export const HostUpgradesPage: React.FC = () => {
    const [listings, setListings] = useState<DirectoryListingDB[]>([]);
    const [selectedId, setSelectedId] = useState<string>('');
    const [addons, setAddons] = useState<ListingAddon[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const mine = await db.getMyDirectoryListings();
                if (cancelled) return;
                setListings(mine);
                if (mine.length > 0) setSelectedId(mine[0].id);
            } catch (err) {
                console.error('Failed to load listings:', err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const loadAddons = useCallback(async (listingId: string) => {
        try {
            const rows = await db.getListingAddons(listingId);
            setAddons(rows);
        } catch (err) {
            console.error('Failed to load add-ons:', err);
            setAddons([]);
        }
    }, []);

    useEffect(() => {
        if (selectedId) loadAddons(selectedId);
    }, [selectedId, loadAddons]);

    const statusFor = (type: string): ListingAddon | undefined =>
        addons.find(a => a.addon_type === type && (a.status === 'active' || a.status === 'pending'));

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-500" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400">
                    <Sparkles className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Upgrades</h1>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mb-8">
                Boost a listing's visibility and bookings with paid add-ons.
            </p>

            {listings.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                    <Sparkles className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-500 dark:text-slate-400">
                        You don't have any directory listings yet. Create one to unlock upgrades.
                    </p>
                </div>
            ) : (
                <>
                    <label className="block mb-6">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Listing</span>
                        <select
                            value={selectedId}
                            onChange={(e) => setSelectedId(e.target.value)}
                            className="mt-1 block w-full sm:w-80 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        >
                            {listings.map(l => (
                                <option key={l.id} value={l.id}>{l.name}</option>
                            ))}
                        </select>
                    </label>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {ADDON_CATALOG.map(entry => {
                            const Icon = entry.icon;
                            const accent = ACCENT[entry.accent];
                            const active = statusFor(entry.type);
                            return (
                                <div
                                    key={entry.type}
                                    className={`flex flex-col rounded-2xl border bg-white dark:bg-slate-800/50 p-5 ${accent.ring}`}
                                >
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <div className={`p-2.5 rounded-xl ${accent.icon}`}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        {active && (
                                            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${active.status === 'active' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'}`}>
                                                {active.status === 'active'
                                                    ? <><Check size={12} /> Active</>
                                                    : <><Clock size={12} /> Pending</>}
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{entry.name}</h3>
                                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 flex-1">{entry.description}</p>
                                    <div className="mt-4 flex items-center justify-between">
                                        <span className="text-sm font-bold text-slate-900 dark:text-white">{entry.priceLabel}</span>
                                        <button
                                            type="button"
                                            disabled
                                            title="Checkout coming soon"
                                            className="text-sm font-semibold px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                                        >
                                            {active?.status === 'active' ? 'Active' : 'Coming soon'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
};
