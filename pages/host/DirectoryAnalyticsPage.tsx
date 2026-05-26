import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, Eye, MessageCircle, Globe, MapPin, ArrowRight } from 'lucide-react';
import { db } from '../../api-services';
import { ListingAnalyticsSummary, CategoryAnalyticsAverage } from '../../types/models';
import toast from 'react-hot-toast';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    CartesianGrid
} from 'recharts';

export const DirectoryAnalyticsPage: React.FC = () => {
    const [analytics, setAnalytics] = useState<ListingAnalyticsSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [categoryAvg, setCategoryAvg] = useState<CategoryAnalyticsAverage | null>(null);

    useEffect(() => {
        db.getDirectoryAnalyticsForOwner(30)
            .then(data => {
                setAnalytics(data);
                setSelectedIndex(0);
            })
            .catch(err => {
                console.error(err);
                toast.error('Failed to load analytics');
            })
            .finally(() => setLoading(false));
    }, []);

    const selected = analytics[selectedIndex];

    useEffect(() => {
        if (!selected?.listing_category_id) {
            setCategoryAvg(null);
            return;
        }
        db.getCategoryAnalyticsAverage(selected.listing_category_id)
            .then(setCategoryAvg)
            .catch(err => {
                console.error('Failed to load category average:', err);
                setCategoryAvg(null);
            });
    }, [selected?.listing_category_id]);

    const chartData = useMemo(() => {
        if (!selected) return [];
        return selected.daily_data.map(day => ({
            name: new Date(day.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            views: day.views,
            whatsapp: day.whatsapp_clicks,
            website: day.website_clicks,
            map: day.map_clicks,
        }));
    }, [selected?.listing_id]);

    const summaryCards = selected ? [
        { label: 'Views', value: selected.total_views, icon: Eye, color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-900/20' },
        { label: 'WhatsApp', value: selected.total_whatsapp_clicks, icon: MessageCircle, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
        { label: 'Website', value: selected.total_website_clicks, icon: Globe, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
        { label: 'Map', value: selected.total_map_clicks, icon: MapPin, color: 'text-slate-600', bg: 'bg-slate-50 dark:bg-slate-800' },
    ] : [];

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="animate-pulse text-slate-400">Loading analytics...</div>
            </div>
        );
    }

    if (analytics.length === 0) {
        return (
            <div className="max-w-4xl mx-auto">
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 p-12 text-center">
                    <BarChart3 className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Analytics Yet</h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-6">
                        You don't have any directory listings with active subscriptions. Upgrade to Voyager to start tracking performance.
                    </p>
                    <a
                        href="/list-business"
                        className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-colors"
                    >
                        List Your Business <ArrowRight size={16} />
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Directory Analytics</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Last 30 days performance</p>
                </div>
                {analytics.length > 1 && (
                    <select
                        value={selectedIndex}
                        onChange={e => setSelectedIndex(Number(e.target.value))}
                        className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                    >
                        {analytics.map((item, idx) => (
                            <option key={item.listing_id} value={idx}>{item.listing_name}</option>
                        ))}
                    </select>
                )}
            </div>

            {selected && (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {summaryCards.map(card => {
                            const Icon = card.icon;
                            return (
                                <div
                                    key={card.label}
                                    className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm"
                                >
                                    <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center mb-3`}>
                                        <Icon size={20} className={card.color} />
                                    </div>
                                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                                        {card.value.toLocaleString()}
                                    </div>
                                    <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{card.label}</div>
                                </div>
                            );
                        })}
                    </div>

                    {categoryAvg && categoryAvg.listing_count > 1 && (
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">vs. Category Average</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    { label: 'Views', value: selected.total_views, avg: categoryAvg.avg_views },
                                    { label: 'WhatsApp', value: selected.total_whatsapp_clicks, avg: categoryAvg.avg_whatsapp_clicks },
                                    { label: 'Website', value: selected.total_website_clicks, avg: categoryAvg.avg_website_clicks },
                                    { label: 'Map', value: selected.total_map_clicks, avg: categoryAvg.avg_map_clicks },
                                ].map(card => {
                                    const delta = card.avg === 0 ? 0 : Math.round(((card.value - card.avg) / card.avg) * 100);
                                    const isPositive = card.value >= card.avg;
                                    return (
                                        <div key={card.label} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
                                            <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">{card.label}</div>
                                            <div className="text-xl font-bold text-slate-900 dark:text-white">
                                                {card.value.toLocaleString()}
                                            </div>
                                            <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                                Avg: {Math.round(card.avg).toLocaleString()}
                                            </div>
                                            <div className={`mt-2 inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${
                                                isPositive
                                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                            }`}>
                                                {card.avg === 0 ? '—' : `${isPositive ? '+' : ''}${delta}%`}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Daily Activity</h2>
                        {chartData.length > 0 ? (
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                        <YAxis tick={{ fontSize: 12 }} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'rgba(255,255,255,0.95)',
                                                borderRadius: '12px',
                                                border: '1px solid #e2e8f0',
                                                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                                            }}
                                        />
                                        <Legend />
                                        <Bar dataKey="views" name="Views" fill="#0d9488" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="whatsapp" name="WhatsApp" fill="#16a34a" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="website" name="Website" fill="#2563eb" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="map" name="Map" fill="#64748b" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="text-center py-12 text-slate-400">No activity recorded yet.</div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};
