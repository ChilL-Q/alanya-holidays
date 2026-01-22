import React, { useEffect, useState } from 'react';
import { db } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { Search, Filter, Calendar, CheckCircle, XCircle, Clock, Eye, MessageSquare, Phone, Mail, MapPin } from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';
import { Modal } from '../../components/ui/Modal';
import { useNavigate } from 'react-router-dom';

export const HostBookingsPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { convertPrice, formatPrice } = useCurrency();
    const [bookings, setBookings] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedBooking, setSelectedBooking] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadBookings();
    }, [user]);

    const loadBookings = async () => {
        if (!user) return;
        try {
            setIsLoading(true);
            // Use the new efficient method
            const myBookings = await db.getBookingsForHost(user.id);
            setBookings(myBookings || []);
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
                if (selectedBooking?.id === id) {
                    setSelectedBooking(prev => ({ ...prev, status: newStatus }));
                }
            } catch (error) {
                alert('Failed to update booking status');
                console.error(error);
            }
        }
    };

    const filteredBookings = bookings.filter(b => {
        const matchesStatus = filterStatus === 'all' || b.status === filterStatus;
        const matchesSearch =
            b.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.itemTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.id.toString().includes(searchTerm);
        return matchesStatus && matchesSearch;
    });

    const getStatusBadge = (status: string) => {
        const styles = {
            pending: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
            confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
            cancelled: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800',
            completed: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'
        };
        const icons = {
            pending: Clock,
            confirmed: CheckCircle,
            cancelled: XCircle,
            completed: CheckCircle
        };
        const Icon = icons[status as keyof typeof icons] || Clock;

        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${styles[status as keyof typeof styles] || 'bg-slate-100'}`}>
                <Icon size={12} />
                {status.toUpperCase()}
            </span>
        );
    };

    return (
        <div className="space-y-6 animate-fade-up">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white font-serif">Reservations</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your guest bookings</p>
                </div>

                <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    {['all', 'pending', 'confirmed', 'upcoming', 'completed', 'cancelled'].map(status => (
                        status === 'upcoming' ? null : // Skip upcoming for now or implement logic
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${filterStatus === status
                                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                            >
                                {status}
                            </button>
                    ))}
                </div>
            </div>

            {/* Search & Toolbar */}
            <div className="flex gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search guests, properties, or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-sm outline-none"
                    />
                </div>
            </div>

            {/* Bookings List */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs uppercase font-bold tracking-wider border-b border-slate-100 dark:border-slate-700">
                            <tr>
                                <th className="p-5 pl-6">Guest</th>
                                <th className="p-5">Property</th>
                                <th className="p-5">Dates</th>
                                <th className="p-5">Status</th>
                                <th className="p-5">Total</th>
                                <th className="p-5 text-right pr-6">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {isLoading ? (
                                <tr><td colSpan={6} className="p-12 text-center text-slate-400">Loading reservations...</td></tr>
                            ) : filteredBookings.length > 0 ? (
                                filteredBookings.map((booking) => (
                                    <tr key={booking.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                                        <td className="p-5 pl-6">
                                            <div className="flex items-center gap-3">
                                                {booking.user?.avatar_url ? (
                                                    <img src={booking.user.avatar_url} className="w-10 h-10 rounded-full object-cover shadow-sm bg-slate-100" alt="" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 font-bold">
                                                        {booking.user?.full_name?.charAt(0) || 'G'}
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="font-bold text-slate-900 dark:text-white">{booking.user?.full_name || 'Guest User'}</div>
                                                    <div className="text-xs text-slate-500">{booking.user?.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <div className="font-medium text-slate-900 dark:text-white line-clamp-1 max-w-[200px]">{booking.itemTitle}</div>
                                            {booking.property?.location && (
                                                <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                                    <MapPin size={10} />
                                                    {booking.property.location}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-5">
                                            <div className="flex flex-col text-sm text-slate-600 dark:text-slate-300">
                                                <span className="font-medium">{new Date(booking.check_in).toLocaleDateString()}</span>
                                                <span className="text-xs text-slate-400">to {new Date(booking.check_out).toLocaleDateString()}</span>
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            {getStatusBadge(booking.status)}
                                        </td>
                                        <td className="p-5 font-bold text-slate-900 dark:text-white">
                                            {formatPrice(convertPrice(booking.total_price, 'EUR'))}
                                        </td>
                                        <td className="p-5 pr-6 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => setSelectedBooking(booking)}
                                                    className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                                                    title="View Details"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                {booking.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleStatusUpdate(booking.id, 'confirmed')}
                                                            className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                                                            title="Approve"
                                                        >
                                                            <CheckCircle size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusUpdate(booking.id, 'cancelled')}
                                                            className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
                                                            title="Reject"
                                                        >
                                                            <XCircle size={18} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                                                <Calendar size={32} />
                                            </div>
                                            <p className="text-slate-500 font-medium">No reservations found</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Booking Details Modal */}
            <Modal
                isOpen={!!selectedBooking}
                onClose={() => setSelectedBooking(null)}
                title="Booking Details"
                maxWidth="2xl"
            >
                {selectedBooking && (
                    <div className="space-y-6">
                        {/* Status Banner */}
                        <div className={`p-4 rounded-xl flex items-center justify-between ${selectedBooking.status === 'confirmed' ? 'bg-emerald-50 text-emerald-800' :
                            selectedBooking.status === 'cancelled' ? 'bg-rose-50 text-rose-800' :
                                selectedBooking.status === 'completed' ? 'bg-blue-50 text-blue-800' :
                                    'bg-amber-50 text-amber-800'
                            }`}>
                            <div className="font-bold flex items-center gap-2">
                                {getStatusBadge(selectedBooking.status)}
                            </div>
                            <div className="text-sm font-medium opacity-80">
                                ID: #{selectedBooking.booking_ref ? selectedBooking.booking_ref.toString().padStart(4, '0') : selectedBooking.id.slice(0, 8)}
                            </div>
                        </div>

                        {/* Guest Section */}
                        <div className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                            {selectedBooking.user?.avatar_url ? (
                                <img src={selectedBooking.user.avatar_url} className="w-14 h-14 rounded-full object-cover" alt="" />
                            ) : (
                                <div className="w-14 h-14 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-200 text-xl font-bold">
                                    {selectedBooking.user?.full_name?.charAt(0) || 'G'}
                                </div>
                            )}
                            <div className="flex-1">
                                <h3 className="font-bold text-lg text-slate-900 dark:text-white">{selectedBooking.user?.full_name || 'Guest User'}</h3>
                                <div className="space-y-1 mt-2">
                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                        <Mail size={14} />
                                        {selectedBooking.user?.email || 'No email provided'}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                        <Phone size={14} />
                                        {selectedBooking.user?.phone || 'No phone provided'}
                                    </div>
                                </div>
                                <div className="mt-4 flex gap-2">
                                    <button
                                        onClick={() => {
                                            // TODO: Navigate to chat
                                            navigate('/host/messages');
                                            // In a clearer implementation, we'd pass the conversation ID or start one
                                        }}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-teal-600 text-white text-xs font-bold rounded-lg hover:bg-teal-700 transition"
                                    >
                                        <MessageSquare size={14} />
                                        Message Guest
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Property & Dates */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                                <div className="text-xs text-slate-400 uppercase font-bold mb-1">Check In</div>
                                <div className="font-bold text-slate-900 dark:text-white text-lg">{new Date(selectedBooking.check_in).toLocaleDateString()}</div>
                                <div className="text-xs text-slate-500">After 3:00 PM</div>
                            </div>
                            <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                                <div className="text-xs text-slate-400 uppercase font-bold mb-1">Check Out</div>
                                <div className="font-bold text-slate-900 dark:text-white text-lg">{new Date(selectedBooking.check_out).toLocaleDateString()}</div>
                                <div className="text-xs text-slate-500">Before 11:00 AM</div>
                            </div>
                        </div>

                        {/* Property Mini Card */}
                        {/* Property Mini Card */}
                        <div className="flex gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 items-center">
                            {(selectedBooking.item_type === 'property' && selectedBooking.property?.images?.[0]) ? (
                                <img src={selectedBooking.property.images[0]} className="w-16 h-16 rounded-lg object-cover" alt="" />
                            ) : (selectedBooking.item_type === 'service' && selectedBooking.service?.images?.[0]) ? ( // Assuming service images are joined if available, though getBookingsForHost might optimize this differently.
                                <img src={selectedBooking.service.images[0]} className="w-16 h-16 rounded-lg object-cover" alt="" />
                            ) : selectedBooking.property?.images?.[0] ? ( // Fallback for host bookings where propery object is used for both
                                <img src={selectedBooking.property.images[0]} className="w-16 h-16 rounded-lg object-cover" alt="" />
                            ) : null}
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white">{selectedBooking.itemTitle}</h3>
                                <div className="text-sm text-slate-500 capitalize">{selectedBooking.item_type}</div>
                                {selectedBooking.property?.location && <div className="text-xs text-slate-400">{selectedBooking.property.location}</div>}
                            </div>
                        </div>

                        {/* Payment Summary */}
                        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl space-y-3">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">Total Price</span>
                                <span className="font-bold text-lg text-slate-900 dark:text-white">{formatPrice(convertPrice(selectedBooking.total_price, 'EUR'))}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800">
                                <span>Payment Status</span>
                                <span className={`font-bold ${selectedBooking.payment_status === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                    {(selectedBooking.payment_status || 'Pending').toUpperCase()}
                                </span>
                            </div>
                        </div>

                        {/* Action Buttons (if pending) */}
                        {selectedBooking.status === 'pending' && (
                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <button
                                    onClick={() => handleStatusUpdate(selectedBooking.id, 'cancelled')}
                                    className="p-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition"
                                >
                                    Decline Request
                                </button>
                                <button
                                    onClick={() => handleStatusUpdate(selectedBooking.id, 'confirmed')}
                                    className="p-3 rounded-xl bg-teal-600 text-white font-bold hover:bg-teal-700 transition shadow-lg shadow-teal-500/20"
                                >
                                    Accept Booking
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};
