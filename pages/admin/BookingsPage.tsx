import React, { useState, useEffect } from 'react';
import { db } from '../../api-services';
import { Filter, Search, CheckCircle, XCircle, Clock, Eye, Calendar, DollarSign, User, Euro } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { useCurrency } from '../../context/CurrencyContext';
import { supabase } from '../../api-services/supabase';

export const BookingsPage: React.FC = () => {
    const { convertPrice, formatPrice } = useCurrency();
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedBooking, setSelectedBooking] = useState<any>(null);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    useEffect(() => {
        loadBookings();
    }, []);

    const loadBookings = async () => {
        try {
            setLoading(true);
            const data = await db.getAdminBookings();
            setBookings(data || []);
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
            if (selectedBooking?.id === id) {
                setSelectedBooking(prev => ({ ...prev, status: newStatus }));
            }
        } catch (e) {
            alert('Failed to update status');
        }
    };

    const handlePayoutStatusChange = async (id: string, newStatus: 'paid' | 'pending' | 'processing') => {
        if (!confirm(`Mark payout as ${newStatus}?`)) return;
        try {
            const { error } = await supabase.from('bookings').update({ payout_status: newStatus }).eq('id', id);
            if (error) throw error;

            setBookings(prev => prev.map(b => b.id === id ? { ...b, payout_status: newStatus } : b));
            if (selectedBooking?.id === id) {
                setSelectedBooking(prev => ({ ...prev, payout_status: newStatus }));
            }
        } catch (e) {
            alert('Failed to update payout status');
        }
    };

    const filteredBookings = bookings.filter(b => {
        const matchesStatus = filterStatus === 'all' || b.status === filterStatus;
        const matchesSearch =
            b.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.itemTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.id.toString().includes(searchQuery);

        let matchesDate = true;
        if (dateRange.start) {
            matchesDate = matchesDate && new Date(b.check_in) >= new Date(dateRange.start);
        }
        if (dateRange.end) {
            matchesDate = matchesDate && new Date(b.check_in) <= new Date(dateRange.end);
        }

        return matchesStatus && matchesSearch && matchesDate;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800';
            case 'confirmed': return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800';
            case 'completed': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
            case 'cancelled': return 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    const getDisplayId = (booking: any) => {
        if (booking.booking_ref) {
            return `#${booking.booking_ref.toString().padStart(4, '0')}`;
        }
        return `#${booking.id.slice(0, 8)}`;
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Bookings</h1>
                <div className="text-sm text-slate-500">
                    Total: {bookings.length}
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                <div className="flex overflow-x-auto gap-2 bg-slate-100 dark:bg-slate-700/50 p-1 rounded-xl w-full xl:w-auto no-scrollbar">
                    {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${filterStatus === status
                                ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                    ))}
                </div>

                <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto">
                    {/* Date Filters */}
                    <div className="flex gap-2 items-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2">
                        <Calendar size={16} className="text-slate-400" />
                        <input
                            type="date"
                            className="bg-transparent text-sm outline-none text-slate-600 dark:text-slate-300 w-32"
                            value={dateRange.start}
                            onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        />
                        <span className="text-slate-400">-</span>
                        <input
                            type="date"
                            className="bg-transparent text-sm outline-none text-slate-600 dark:text-slate-300 w-32"
                            value={dateRange.end}
                            onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        />
                    </div>

                    {/* Search */}
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search user, item, ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                        />
                    </div>
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
                                <th className="p-4">Payout</th>
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
                                        <td className="p-4 pl-6 text-sm text-slate-400 font-mono font-bold">{getDisplayId(booking)}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                {booking.user?.avatar_url ? (
                                                    <img src={booking.user.avatar_url} className="w-8 h-8 rounded-full object-cover" alt="" />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-500">
                                                        {booking.user?.full_name?.charAt(0) || 'U'}
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="font-medium text-slate-900 dark:text-white">{booking.user?.full_name || 'Guest'}</div>
                                                    <div className="text-xs text-slate-500">{booking.user?.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 font-medium text-slate-700 dark:text-slate-300">
                                            <div className="line-clamp-1 max-w-[150px]" title={booking.itemTitle}>{booking.itemTitle}</div>
                                            <div className="text-xs text-slate-400 capitalize">{booking.item_type}</div>
                                        </td>
                                        <td className="p-4 text-sm text-slate-500">
                                            <div>{new Date(booking.check_in).toLocaleDateString()}</div>
                                            <div className="text-xs">to {new Date(booking.check_out).toLocaleDateString()}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(booking.status)}`}>
                                                {booking.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${booking.payout_status === 'paid' ? 'bg-green-100 text-green-700' :
                                                booking.payout_status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-slate-100 text-slate-500'
                                                }`}>
                                                {booking.payout_status ? booking.payout_status.toUpperCase() : '-'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right font-bold text-slate-900 dark:text-white">
                                            {formatPrice(convertPrice(booking.total_price, 'EUR'))}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    onClick={() => setSelectedBooking(booking)}
                                                    className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                                                    title="View Details"
                                                >
                                                    <Eye size={18} />
                                                </button>
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

            {/* Admin Booking Details Modal */}
            <Modal
                isOpen={!!selectedBooking}
                onClose={() => setSelectedBooking(null)}
                title={selectedBooking ? `Booking ${getDisplayId(selectedBooking)}` : 'Booking Details'}
                maxWidth="2xl"
            >
                {selectedBooking && (
                    <div className="space-y-6">
                        {/* Summary Card */}
                        <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                            {(selectedBooking.item_type === 'property' && selectedBooking.property?.images?.[0]) ? (
                                <img src={selectedBooking.property.images[0]} className="w-20 h-20 rounded-lg object-cover" alt="" />
                            ) : (selectedBooking.item_type === 'service' && selectedBooking.service?.images?.[0]) ? (
                                <img src={selectedBooking.service.images[0]} className="w-20 h-20 rounded-lg object-cover" alt="" />
                            ) : (
                                <div className="w-20 h-20 bg-slate-200 rounded-lg flex items-center justify-center text-xs text-slate-500">No Image</div>
                            )}
                            <div>
                                <h3 className="font-bold text-lg text-slate-900 dark:text-white">{selectedBooking.itemTitle}</h3>
                                <div className="text-slate-500 text-sm flex gap-2 mt-1">
                                    <span className="capitalize px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-xs text-slate-700 dark:text-slate-300">
                                        {selectedBooking.item_type}
                                    </span>
                                    {selectedBooking.property?.location && <span>{selectedBooking.property.location}</span>}
                                </div>
                            </div>
                        </div>

                        {/* Financials Breakdown */}
                        <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                            <div>
                                <div className="text-xs text-slate-500 uppercase font-bold">Total Price</div>
                                <div className="text-lg font-bold text-slate-900 dark:text-white">{formatPrice(convertPrice(selectedBooking.total_price, 'EUR'))}</div>
                            </div>
                            <div>
                                <div className="text-xs text-slate-500 uppercase font-bold">Commission</div>
                                <div className="text-lg font-bold text-purple-600">{formatPrice(convertPrice(selectedBooking.commission_amount || 0, 'EUR'))}</div>
                            </div>
                            <div>
                                <div className="text-xs text-slate-500 uppercase font-bold">Host Payout</div>
                                <div className="text-lg font-bold text-teal-600">{formatPrice(convertPrice(selectedBooking.host_payout_amount || 0, 'EUR'))}</div>
                            </div>
                        </div>

                        {/* Guest Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                                <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase mb-3">
                                    <User size={14} /> Guest
                                </div>
                                <div className="font-medium">{selectedBooking.user?.full_name}</div>
                                <div className="text-sm text-slate-500">{selectedBooking.user?.email}</div>
                                <div className="text-sm text-slate-500">{selectedBooking.user?.phone || 'No phone'}</div>
                            </div>

                            <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                                <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase mb-3">
                                    <Euro size={14} /> Payment
                                </div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm text-slate-500">Total</span>
                                    <span className="font-bold text-lg">{formatPrice(convertPrice(selectedBooking.total_price, 'EUR'))}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">Status</span>
                                    <span className={`font-medium ${selectedBooking.payment_status === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                        {(selectedBooking.payment_status || 'Pending').toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Admin Actions */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Admin Actions</h4>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleStatusChange(selectedBooking.id, 'confirmed')}
                                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium"
                                >
                                    Confirm Booking
                                </button>
                                <button
                                    onClick={() => handleStatusChange(selectedBooking.id, 'cancelled')}
                                    className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 text-sm font-medium"
                                >
                                    Cancel Booking
                                </button>
                                <button
                                    onClick={() => handleStatusChange(selectedBooking.id, 'completed')}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                                >
                                    Mark Completed
                                </button>

                                {selectedBooking.payout_status === 'pending' && (
                                    <button
                                        onClick={() => handlePayoutStatusChange(selectedBooking.id, 'paid')}
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
                                    >
                                        Mark Payout Paid
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </Modal >
        </div >
    );
};
