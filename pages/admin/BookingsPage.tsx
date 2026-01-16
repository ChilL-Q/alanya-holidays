import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { Filter, Search, CheckCircle, XCircle, Clock } from 'lucide-react';

export const BookingsPage: React.FC = () => {
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadBookings();
    }, []);

    const loadBookings = async () => {
        try {
            // Load all bookings (inefficient for large DBs, suitable for demo/MVP)
            const all = await db.getBookingsByStatus('all') || [];

            // If getBookingsByStatus('all') isn't supported, we might need multiple calls
            // Assuming the DB service supports fetching all or we fetch by status and merge
            // For now, let's fetch by status and merge to be safe as per previous code
            const pending = await db.getBookingsByStatus('pending') || [];
            const confirmed = await db.getBookingsByStatus('confirmed') || [];
            const completed = await db.getBookingsByStatus('completed') || [];
            const cancelled = await db.getBookingsByStatus('cancelled') || [];

            // Merge and de-duplicate if necessary (though separate statuses shouldn't overlap)
            const merged = [...pending, ...confirmed, ...completed, ...cancelled]
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            setBookings(merged);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (id: number | string, newStatus: string) => {
        if (!confirm(`Are you sure you want to change status to ${newStatus}?`)) return;

        try {
            await db.updateBookingStatus(id.toString(), newStatus as 'confirmed' | 'cancelled' | 'completed');
            // Optimistic update
            setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
        } catch (e) {
            alert('Failed to update status');
        }
    };

    const filteredBookings = bookings.filter(b => {
        const matchesStatus = filterStatus === 'all' || b.status === filterStatus;
        const matchesSearch =
            b.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.itemTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.id.toString().includes(searchQuery);
        return matchesStatus && matchesSearch;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
            case 'confirmed': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
            case 'completed': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            case 'cancelled': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                <div className="flex gap-2 bg-slate-100 dark:bg-slate-700/50 p-1 rounded-xl">
                    {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterStatus === status
                                ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                    ))}
                </div>

                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search bookings..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 text-xs uppercase font-semibold">
                            <tr>
                                <th className="p-4 pl-6">ID</th>
                                <th className="p-4">Customer</th>
                                <th className="p-4">Item</th>
                                <th className="p-4">Dates</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Total</th>
                                <th className="p-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-slate-400">Loading bookings...</td>
                                </tr>
                            ) : filteredBookings.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-slate-400">No bookings found matching your filters.</td>
                                </tr>
                            ) : (
                                filteredBookings.map((booking) => (
                                    <tr key={booking.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                                        <td className="p-4 pl-6 text-sm text-slate-400">#{booking.id}</td>
                                        <td className="p-4">
                                            <div className="font-medium text-slate-900 dark:text-white">{booking.user?.full_name || 'Guest'}</div>
                                            <div className="text-xs text-slate-500">{booking.user?.email}</div>
                                        </td>
                                        <td className="p-4 font-medium text-slate-700 dark:text-slate-300">{booking.itemTitle}</td>
                                        <td className="p-4 text-sm text-slate-500">
                                            <div>{booking.check_in}</div>
                                            <div className="text-xs">to {booking.check_out}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getStatusColor(booking.status)}`}>
                                                {booking.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right font-bold text-slate-900 dark:text-white">
                                            €{booking.total_price}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {booking.status === 'pending' && (
                                                    <button
                                                        onClick={() => handleStatusChange(booking.id, 'confirmed')}
                                                        className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100"
                                                        title="Confirm"
                                                    >
                                                        <CheckCircle size={18} />
                                                    </button>
                                                )}
                                                {booking.status !== 'cancelled' && (
                                                    <button
                                                        onClick={() => handleStatusChange(booking.id, 'cancelled')}
                                                        className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100"
                                                        title="Cancel"
                                                    >
                                                        <XCircle size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
