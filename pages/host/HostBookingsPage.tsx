import React, { useEffect, useState } from 'react';
import { db } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { Search, Filter, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';

export const HostBookingsPage = () => {
    const { user } = useAuth();
    const { convertPrice, formatPrice } = useCurrency();
    const [bookings, setBookings] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        loadBookings();
    }, [user]);

    const loadBookings = async () => {
        if (!user) return;
        try {
            setIsLoading(true);
            // Fetch properties first to get IDs
            const props = await db.getPropertiesByHost(user.id);
            const myPropertyIds = new Set(props?.map((p: any) => p.id));

            // Fetch all bookings and filter (MVP approach)
            const allBookings = await db.getBookings();
            const myBookings = allBookings?.filter((b: any) =>
                myPropertyIds.has(b.item_id) && b.item_type === 'property'
            ) || [];

            setBookings(myBookings);
        } catch (error) {
            console.error('Failed to load bookings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStatusUpdate = async (id: string, newStatus: 'confirmed' | 'cancelled') => {
        if (confirm(`Are you sure you want to mark this booking as ${newStatus}?`)) {
            try {
                await db.updateBookingStatus(id, newStatus);
                setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
            } catch (error) {
                alert('Failed to update booking status');
                console.error(error);
            }
        }
    };

    const filteredBookings = bookings.filter(b =>
        filterStatus === 'all' || b.status === filterStatus
    );

    return (
        <div className="space-y-6 animate-fade-up">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reservations</h1>
                    <p className="text-slate-500 dark:text-slate-400">Manage upcoming stays and past bookings</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex bg-white dark:bg-slate-800 p-1.5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm w-full sm:w-fit">
                {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(status => (
                    <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize flex-1 sm:flex-none ${filterStatus === status
                                ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        {status}
                    </button>
                ))}
            </div>

            {/* List */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700 text-slate-500 font-semibold text-sm">
                            <tr>
                                <th className="p-4 pl-6">Guest / Property</th>
                                <th className="p-4">Dates</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Total</th>
                                <th className="p-4 text-right pr-6">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {isLoading ? (
                                [...Array(3)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="p-4 pl-6"><div className="h-10 w-48 bg-slate-100 dark:bg-slate-700 rounded-lg"></div></td>
                                        <td className="p-4"><div className="h-4 w-32 bg-slate-100 dark:bg-slate-700 rounded"></div></td>
                                        <td className="p-4"><div className="h-6 w-20 bg-slate-100 dark:bg-slate-700 rounded-full"></div></td>
                                        <td className="p-4"><div className="h-4 w-16 bg-slate-100 dark:bg-slate-700 rounded"></div></td>
                                        <td className="p-4"></td>
                                    </tr>
                                ))
                            ) : filteredBookings.length > 0 ? (
                                filteredBookings.map((booking) => (
                                    <tr key={booking.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="p-4 pl-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 font-bold">
                                                    {booking.user_id?.charAt(0) || 'G'}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-slate-900 dark:text-white line-clamp-1">{booking.itemTitle}</div>
                                                    <div className="text-xs text-slate-500">Guest ID: {booking.user_id?.slice(0, 8)}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col text-sm text-slate-600 dark:text-slate-300">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-12 text-slate-400 text-xs">Check-in:</span>
                                                    {new Date(booking.check_in).toLocaleDateString()}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="w-12 text-slate-400 text-xs">Check-out:</span>
                                                    {new Date(booking.check_out).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${booking.status === 'confirmed'
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-900/50'
                                                    : booking.status === 'pending'
                                                        ? 'bg-yellow-50 text-yellow-700 border-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-900/50'
                                                        : booking.status === 'cancelled'
                                                            ? 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                                                            : 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-400'
                                                }`}>
                                                {booking.status === 'confirmed' && <CheckCircle size={12} />}
                                                {booking.status === 'pending' && <Clock size={12} />}
                                                {booking.status === 'cancelled' && <XCircle size={12} />}
                                                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold text-slate-900 dark:text-white">
                                                {formatPrice(convertPrice(booking.total_price, 'EUR'))}
                                            </div>
                                        </td>
                                        <td className="p-4 pr-6 text-right">
                                            {booking.status === 'pending' && (
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleStatusUpdate(booking.id, 'confirmed')}
                                                        className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 transition shadow-sm"
                                                    >
                                                        Accept
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusUpdate(booking.id, 'cancelled')}
                                                        className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-50 transition"
                                                    >
                                                        Decline
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-500 dark:text-slate-400">
                                        No bookings found matching filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
