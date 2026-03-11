import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../api-services';
import { useLanguage } from '../../context/LanguageContext';
import { BarChart3, Calendar, DollarSign, Home, Plus, ExternalLink, Star } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { useCurrency } from '../../context/CurrencyContext';
import { Button, buttonVariants, buttonBase } from '../../components/ui/Button';
import { cn } from '../../utils/cn';

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
                const [props, myBookings] = await Promise.all([
                    db.getPropertiesByHost(user.id),
                    db.getBookingsForHost(user.id)
                ]);

                setProperties(props || []);
                setBookings(myBookings || []);

            } catch (error) {
                console.error("Dashboard error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user, isAuthenticated, navigate]);

    // Chart Data Preparation
    const months = Array.from({ length: 6 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        return d.toLocaleString('default', { month: 'short' });
    }).reverse();

    const revenueHistory = months.map(month => {
        const monthlyBookings = bookings.filter(b => {
            // Use host_payout_amount for host revenue, not total_price
            const amount = Number(b.host_payout_amount) || 0;
            if (amount <= 0) return false;

            const d = new Date(b.created_at);
            return d.toLocaleString('default', { month: 'short' }) === month && b.payment_status === 'paid';
        });
        const monthlyRevenue = monthlyBookings.reduce((sum, b) => sum + (Number(b.host_payout_amount) || 0), 0);
        return { name: month, value: monthlyRevenue };
    });

    const bookingStatusDistribution = [
        { name: 'Pending', value: bookings.filter(b => b.status === 'pending').length, color: '#F59E0B' },
        { name: 'Confirmed', value: bookings.filter(b => b.status === 'confirmed').length, color: '#10B981' },
        { name: 'Completed', value: bookings.filter(b => b.status === 'completed').length, color: '#3B82F6' },
        { name: 'Cancelled', value: bookings.filter(b => b.status === 'cancelled').length, color: '#EF4444' }
    ].filter(item => item.value > 0);

    // Stats Calculation
    const totalEarnings = bookings
        .filter(b => b.payment_status === 'paid' && b.host_payout_amount)
        .reduce((sum, b) => sum + (Number(b.host_payout_amount) || 0), 0);

    const pendingPayouts = bookings
        .filter(b => b.payment_status === 'paid' && b.payout_status === 'pending')
        .reduce((sum, b) => sum + (Number(b.host_payout_amount) || 0), 0);

    const paidPayouts = bookings
        .filter(b => b.payout_status === 'paid')
        .reduce((sum, b) => sum + (Number(b.host_payout_amount) || 0), 0);

    if (loading) return <div className="h-full flex items-center justify-center min-h-[400px]">Loading Dashboard...</div>;

    return (
        <div className="space-y-8 animate-fade-up">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('host.dashboard.title')}</h1>
                    <p className="text-slate-500 dark:text-slate-400">{t('host.dashboard.welcome', { name: user?.name || 'Host' })}</p>
                </div>
                <Button
                    onClick={() => navigate('/list-property')}
                    className="hidden md:flex gap-2"
                >
                    <Plus size={20} />
                    {t('host.dashboard.add_listing')}
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-slate-800/80 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-teal-50 dark:bg-slate-800/50 rounded-xl text-teal-600 dark:text-cyan-400 dark:text-slate-200">
                            <DollarSign size={24} />
                        </div>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{t('host.stats.earnings')}</p>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{formatPrice(convertPrice(totalEarnings, 'EUR'))}</h3>
                    <p className="text-xs text-slate-400 mt-1">Total Net Earnings</p>
                </div>

                <div className="bg-white dark:bg-slate-800/80 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-xl text-yellow-600 dark:text-yellow-400">
                            <DollarSign size={24} />
                        </div>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Pending Payouts</p>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{formatPrice(convertPrice(pendingPayouts, 'EUR'))}</h3>
                    <p className="text-xs text-slate-400 mt-1">Funds held by platform</p>
                </div>

                <div className="bg-white dark:bg-slate-800/80 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-50 dark:bg-slate-800/50 rounded-xl text-blue-600 dark:text-slate-200">
                            <Calendar size={24} />
                        </div>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{t('host.stats.bookings')}</p>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{bookings.length}</h3>
                </div>

                <div className="bg-white dark:bg-slate-800/80 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-purple-50 dark:bg-slate-800/50 rounded-xl text-purple-600 dark:text-slate-200">
                            <Home size={24} />
                        </div>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{t('host.stats.properties')}</p>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{properties.length}</h3>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-slate-800/80 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/50 h-[350px]">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Earnings Trend</h3>
                    <div className="h-[280px] w-full min-w-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueHistory}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0D9488" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#0D9488" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} tickFormatter={(value) => `€${value}`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', color: '#000' }}
                                    itemStyle={{ color: '#0F172A', fontWeight: 'bold' }}
                                    formatter={(value: number) => [`€${value.toLocaleString()}`, 'Earnings']}
                                />
                                <Area type="monotone" dataKey="value" stroke="#0D9488" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800/80 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/50 h-[350px] flex flex-col">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Booking Status</h3>
                    <div className="flex-1 w-full min-h-[200px] min-w-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={bookingStatusDistribution}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {bookingStatusDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', color: '#000' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap justify-center gap-3 mt-4">
                        {bookingStatusDistribution.map((entry) => (
                            <div key={entry.name} className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                                <span className="text-xs text-slate-500 font-medium">{entry.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Bookings */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800/50 flex justify-between items-center">
                        <h3 className="font-bold text-slate-900 dark:text-white">{t('host.bookings.title')}</h3>
                        <Button variant="ghost" size="sm" onClick={() => navigate('/host/bookings')} className="text-indigo-600 hover:text-indigo-700">
                            {t('host.bookings.view_all')}
                        </Button>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                        {bookings.length > 0 ? bookings.slice(0, 5).map((booking) => (
                            <div key={booking.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/90/50 transition flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800/50 rounded-lg flex items-center justify-center text-slate-500">
                                        <Calendar size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">{booking.itemTitle || 'Property Reservation'}</h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(booking.check_in).toLocaleDateString()} - {new Date(booking.check_out).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={`text-xs font-bold px-2 py-1 rounded mb-1 inline-block ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                        booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                        }`}>
                                        {booking.status.toUpperCase()}
                                    </div>
                                    <p className="font-bold text-slate-900 dark:text-white text-sm">{formatPrice(convertPrice(booking.total_price, 'EUR'))}</p>
                                </div>
                            </div>
                        )) : (
                            <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                                {t('host.bookings.empty')}
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions / Properties */}
                <div className="space-y-6">


                    <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm p-6">
                        <h3 className="font-bold text-slate-900 dark:text-white mb-4">{t('host.listings.title')}</h3>
                        <div className="space-y-4">
                            {properties.slice(0, 3).map((prop: any) => (
                                <div key={prop.id} className="flex items-center gap-3">
                                    <img src={prop.images?.[0]} alt={prop.title} className="w-12 h-12 rounded-lg object-cover" />
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">{prop.title}</h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                            <Star size={10} className="fill-orange-400 text-orange-400" />
                                            {prop.rating || 5.0} • {prop.reviewsCount || 0} reviews
                                        </p>
                                    </div>
                                    <Link to={`/property/${prop.id}`} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700/80 rounded-lg text-slate-400 hover:text-indigo-600 transition">
                                        <ExternalLink size={16} />
                                    </Link>
                                </div>
                            ))}
                            <Button variant="ghost" size="sm" fullWidth onClick={() => navigate('/host/properties')} className="text-indigo-600 hover:text-indigo-700">
                                {t('host.listings.view_all')}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
