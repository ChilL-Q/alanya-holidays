import React, { useEffect, useState } from 'react';
import { Compass, Map, Sun, Ship, Mountain, Cloud, Heart } from 'lucide-react';
import { db } from '../services/db';
import { useCurrency } from '../context/CurrencyContext';

export const Experiences: React.FC = () => {
    const { convertPrice, formatPrice } = useCurrency();
    const [activeTab, setActiveTab] = useState('all');
    const [tours, setTours] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const categories = [
        { id: 'all', label: 'All Experiences', icon: Compass },
        { id: 'water', label: 'Water', icon: Ship },
        { id: 'safari', label: 'Safari', icon: Map },
        { id: 'air', label: 'Air', icon: Cloud },
        { id: 'land', label: 'Land Tours', icon: Mountain },
        { id: 'wellness', label: 'Wellness', icon: Heart },
    ];

    useEffect(() => {
        const fetchTours = async () => {
            try {
                const { data } = await db.getServices('tour', 1, 100);
                setTours(data || []);
            } catch (error) {
                console.error('Error fetching tours:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchTours();
    }, []);

    const filteredTours = activeTab === 'all'
        ? tours
        : tours.filter(t => t.features?.subcategory === activeTab);

    return (
        <div className="pt-24 pb-16 min-h-screen bg-slate-50 dark:bg-slate-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-serif text-slate-900 dark:text-white mb-6">Unforgettable Experiences</h1>
                    <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10">
                        Explore the best of Alanya with our curated selection of tours and activities.
                    </p>

                    {/* Subcategory Tabs */}
                    <div className="flex flex-wrap justify-center gap-3 mb-12">
                        {categories.map((cat) => {
                            const Icon = cat.icon;
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveTab(cat.id)}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all ${activeTab === cat.id
                                        ? 'bg-slate-900 text-white shadow-lg scale-105 dark:bg-white dark:text-slate-900'
                                        : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                                        }`}
                                >
                                    <Icon size={18} />
                                    {cat.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {loading ? (
                    <div className="text-center text-slate-500 py-20">Loading adventures...</div>
                ) : filteredTours.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredTours.map((tour, idx) => (
                            <div
                                key={tour.id}
                                className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 dark:border-slate-800 group h-full flex flex-col"
                            >
                                <div className="aspect-[4/3] relative overflow-hidden">
                                    <img
                                        src={tour.images?.[0] || 'https://images.unsplash.com/photo-1544521750-97f9ff30eb9c?q=80&w=2692&auto=format&fit=crop'}
                                        alt={tour.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute top-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-slate-800 dark:text-white">
                                        {tour.features?.duration ? `${tour.features.duration} Hours` : 'Half Day'}
                                    </div>
                                </div>
                                <div className="p-8 flex flex-col flex-grow">
                                    <div className="mb-4">
                                        <div className="text-xs font-bold text-teal-600 uppercase tracking-wider mb-2">{tour.features?.subcategory || 'Adventure'}</div>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">{tour.title}</h3>
                                    </div>
                                    <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-3 mb-6 flex-grow">{tour.description}</p>

                                    <div className="flex items-center justify-between mt-auto pt-6 border-t border-slate-100 dark:border-slate-700">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-slate-500">From</span>
                                            <span className="text-xl font-bold text-slate-900 dark:text-white">{formatPrice(convertPrice(tour.price, 'EUR'))}</span>
                                        </div>
                                        <button className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity">
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                            <Compass size={32} />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No adventures found</h3>
                        <p className="text-slate-500 max-w-sm mx-auto">
                            We currently don't have any listings in this category. Check back soon or browse all experiences!
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
