import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../api-services';
import { PropertyDB } from '../../types/models';
import { useLanguage } from '../../context/LanguageContext';
import { Plus, ExternalLink, Star, Calendar } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCurrency } from '../../context/CurrencyContext';
import { Button } from '../../components/ui/Button';

// Reuse Admin chart components as they are generic enough
import { RevenueChart } from '../../components/admin/dashboard/RevenueChart';
import { BookingStatusChart } from '../../components/admin/dashboard/BookingStatusChart';
import { HostStatCards } from '../../components/host/dashboard/HostStatCards';

export const HostDashboard: React.FC = () => {
    const { user, isAuthenticated } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const { convertPrice, formatPrice } = useCurrency();

    const [properties, setProperties] = useState<PropertyDB[]>([]);
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated) return;
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
    }, [user, isAuthenticated]);

    const now = useMemo(() => new Date(), []);

    const months = useMemo(() => Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now);
        d.setMonth(d.getMonth() - i);
        return d.toLocaleString('default', { month: 'short' });
    }).reverse(), [now]);

    const revenueHistory = useMemo(() => months.map(month => {
        const monthlyBookings = bookings.filter(b => {
            const amount = Number(b.host_payout_amount) || 0;
            if (amount <= 0) return false;
            const d = new Date(b.created_at);
            return d.toLocaleString('default', { month: 'short' }) === month && b.payment_status === 'paid';
        });
        const monthlyRevenue = monthlyBookings.reduce((sum, b) => sum + (Number(b.host_payout_amount) || 0), 0);
        return { name: month, value: monthlyRevenue };
    }), [bookings, months]);

    const bookingStatusDistribution = useMemo(() => {
        const counts = { pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
        bookings.forEach(b => {
            if (counts[b.status as keyof typeof counts] !== undefined) {
                counts[b.status as keyof typeof counts]++;
            }
        });
        return [
            { name: 'Pending', value: counts.pending, color: '#F59E0B' },
            { name: 'Confirmed', value: counts.confirmed, color: '#10B981' },
            { name: 'Completed', value: counts.completed, color: '#3B82F6' },
            { name: 'Cancelled', value: counts.cancelled, color: '#EF4444' }
        ].filter(item => item.value > 0);
    }, [bookings]);

    const { totalEarnings, pendingPayouts } = useMemo(() => {
        let totalEarnings = 0;
        let pendingPayouts = 0;
        bookings.forEach(b => {
            const amount = Number(b.host_payout_amount) || 0;
            if (b.payment_status === 'paid') {
                totalEarnings += amount;
                if (b.payout_status === 'pending') {
                    pendingPayouts += amount;
                }
            }
        });
        return { totalEarnings, pendingPayouts };
    }, [bookings]);
    
    if (loading) return <div className="h-full flex items-center justify-center min-h-[400px]">Loading Dashboard...</div>;

    return (
        <div className="space-y-8 animate-fade-up">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('host.dashboard.title')}</h1>
                    <p className="text-slate-500 dark:text-slate-400">{t('host.dashboard.welcome', { name: user?.name || 'Host' })}</p>
                </div>
                <Button onClick={() => navigate('/list-property')} className="hidden md:flex gap-2">
                    <Plus size={20} />
                    {t('host.dashboard.add_listing')}
                </Button>
            </div>

            <HostStatCards 
                totalEarnings={totalEarnings}
                pendingPayouts={pendingPayouts}
                totalBookings={bookings.length}
                totalProperties={properties.length}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <RevenueChart data={revenueHistory} />
                <BookingStatusChart data={bookingStatusDistribution} />
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
                    <div className="divide-y divide-slate-100 dark:border-slate-800/50">
                        {bookings.length > 0 ? bookings.slice(0, 5).map((booking) => (
                            <div key={booking.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/90/50 transition flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800/50 rounded-lg flex items-center justify-center text-slate-500">
                                        <Calendar size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">{booking.itemTitle || 'Reservation'}</h4>
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
                            <div className="p-8 text-center text-slate-500 dark:text-slate-400">{t('host.bookings.empty')}</div>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm p-6">
                        <h3 className="font-bold text-slate-900 dark:text-white mb-4">{t('host.listings.title')}</h3>
                        <div className="space-y-4">
                            {properties.slice(0, 3).map((prop: PropertyDB) => (
                                <div key={prop.id} className="flex items-center gap-3">
                                    <img src={prop.images?.[0]} alt={prop.title} className="w-12 h-12 rounded-lg object-cover" />
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">{prop.title}</h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                            <Star size={10} className="fill-orange-400 text-orange-400" />
                                            {prop.rating || 5.0}
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
