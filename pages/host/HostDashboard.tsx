import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { useLanguage } from '../../context/LanguageContext';
import { BarChart3, Calendar, DollarSign, Home, Users, Plus, ExternalLink, Star } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCurrency } from '../../context/CurrencyContext';

export const HostDashboard: React.FC = () => {
    const { user, isAuthenticated } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const { convertPrice, formatPrice } = useCurrency();

    const [properties, setProperties] = useState<any[]>([]);
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/');
            return;
        }
        if (user && user.role !== 'host' && user.role !== 'admin') {
            // Ideally redirect or show "Become a Host"
        }

        const fetchData = async () => {
            if (!user) return;
            try {
                const [props, allBookings] = await Promise.all([
                    db.getPropertiesByHost(user.id),
                    db.getBookings() // In real app, we'd filter by host's properties backend-side
                ]);

                setProperties(props || []);

                // Filter bookings for my properties (Client-side filtering for MVP)
                const myPropertyIds = new Set(props?.map(p => p.id));
                const myBookings = allBookings?.filter(b => myPropertyIds.has(b.item_id) && b.item_type === 'property') || [];
                setBookings(myBookings);

            } catch (error) {
                console.error("Dashboard error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user, isAuthenticated, navigate]);

    // Stats
    const totalEarnings = bookings
        .filter(b => b.status === 'confirmed' || b.status === 'completed')
        .reduce((sum, b) => sum + (b.total_price || 0), 0);

    const totalViews = properties.reduce((sum, p) => sum + (p.views || 0), 0); // Assuming 'views' exists or mocking it

    if (loading) return <div className="min-h-screen flex items-center justify-center pt-20">Loading Dashboard...</div>;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-24 pb-12 transition-colors">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{t['host.dashboard.title']}</h1>
                        <p className="text-slate-500 dark:text-slate-400">{t['host.dashboard.welcome'].replace('{name}', user?.name || '')}</p>
                    </div>
                    <Link to="/list-property" className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition">
                        <Plus size={20} />
                        {t['host.dashboard.add_listing']}
                    </Link>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-teal-50 dark:bg-teal-900/30 rounded-xl text-teal-600 dark:text-teal-400">
                                <DollarSign size={24} />
                            </div>
                            <span className="text-xs font-bold text-teal-600 bg-teal-50 dark:bg-teal-900/30 px-2 py-1 rounded">+12%</span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{t['host.stats.earnings']}</p>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{formatPrice(convertPrice(totalEarnings, 'EUR'))}</h3>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
                                <Calendar size={24} />
                            </div>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{t['host.stats.bookings']}</p>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{bookings.length}</h3>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-xl text-purple-600 dark:text-purple-400">
                                <Home size={24} />
                            </div>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{t['host.stats.properties']}</p>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{properties.length}</h3>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-orange-50 dark:bg-orange-900/30 rounded-xl text-orange-600 dark:text-orange-400">
                                <BarChart3 size={24} />
                            </div>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{t['host.stats.views']}</p>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">1,248</h3> {/* Mocked for now */}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Recent Bookings */}
                    <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900 dark:text-white">{t['host.bookings.title']}</h3>
                            <button className="text-sm text-teal-600 font-medium hover:underline">{t['host.bookings.view_all']}</button>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-700">
                            {bookings.length > 0 ? bookings.slice(0, 5).map((booking) => (
                                <div key={booking.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center text-slate-500">
                                            <Calendar size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 dark:text-white text-sm">{booking.itemTitle || 'Property Reservation'}</h4>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(booking.check_in).toLocaleDateString()} - {new Date(booking.check_out).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-xs font-bold px-2 py-1 rounded mb-1 inline-block ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                            {booking.status.toUpperCase()}
                                        </div>
                                        <p className="font-bold text-slate-900 dark:text-white text-sm">{formatPrice(convertPrice(booking.total_price, 'EUR'))}</p>
                                    </div>
                                </div>
                            )) : (
                                <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                                    {t['host.bookings.empty']}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Actions / Properties */}
                    <div className="space-y-6">
                        <div className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
                            <h3 className="font-bold text-lg mb-2">{t['host.sync.title']}</h3>
                            <p className="text-teal-100 text-sm mb-4">{t['host.sync.desc']}</p>
                            <button className="bg-white text-teal-600 px-4 py-2 rounded-lg font-bold text-sm w-full hover:bg-teal-50 transition">
                                {t['host.sync.btn']}
                            </button>
                        </div>

                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6">
                            <h3 className="font-bold text-slate-900 dark:text-white mb-4">{t['host.listings.title']}</h3>
                            <div className="space-y-4">
                                {properties.slice(0, 3).map(prop => (
                                    <div key={prop.id} className="flex items-center gap-3">
                                        <img src={prop.images?.[0]} alt={prop.title} className="w-12 h-12 rounded-lg object-cover" />
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">{prop.title}</h4>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                                <Star size={10} className="fill-orange-400 text-orange-400" />
                                                {prop.rating || 5.0} • {prop.reviewsCount || 0} reviews
                                            </p>
                                        </div>
                                        <Link to={`/property/${prop.id}`} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-teal-600 transition">
                                            <ExternalLink size={16} />
                                        </Link>
                                    </div>
                                ))}
                                <Link to="/profile" className="block text-center text-sm font-bold text-teal-600 hover:underline pt-2">{t['host.listings.view_all']}</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
