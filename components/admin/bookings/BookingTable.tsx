import React from 'react';
import { Eye, CheckCircle, XCircle } from 'lucide-react';
import { useCurrency } from '../../../context/CurrencyContext';

interface BookingTableProps {
    loading: boolean;
    bookings: any[];
    onViewDetails: (booking: any) => void;
    onStatusChange: (id: string | number, status: string) => void;
}

export const BookingTable: React.FC<BookingTableProps> = ({
    loading, bookings, onViewDetails, onStatusChange
}) => {
    const { formatPrice, convertPrice } = useCurrency();

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800';
            case 'confirmed': return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800';
            case 'completed': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-slate-800/50 dark:text-slate-200 dark:border-slate-700/50';
            case 'cancelled': return 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    const getDisplayId = (booking: any) => {
        if (booking.booking_ref) {
            return `#${booking.booking_ref.toString().padStart(4, '0')}`;
        }
        return `#${booking.id.toString().slice(0, 8)}`;
    };

    return (
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-800/50 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs uppercase font-semibold">
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
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                        {loading ? (
                            <tr>
                                <td colSpan={8} className="p-8 text-center text-slate-400">Loading bookings...</td>
                            </tr>
                        ) : bookings.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="p-8 text-center text-slate-400">No bookings found matching your filters.</td>
                            </tr>
                        ) : (
                            bookings.map((booking) => (
                                <tr key={booking.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors group">
                                    <td className="p-4 pl-6 text-sm text-slate-400 font-mono font-bold">{getDisplayId(booking)}</td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            {booking.user?.avatar_url ? (
                                                <img src={booking.user.avatar_url} className="w-8 h-8 rounded-full object-cover" alt="" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800/50 flex items-center justify-center text-xs font-bold text-slate-500">
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
                                                onClick={() => onViewDetails(booking)}
                                                className="p-1.5 text-slate-400 hover:text-teal-600 dark:text-cyan-400 hover:bg-teal-50 rounded-lg transition-colors"
                                                title="View Details"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            {booking.status === 'pending' && (
                                                <button
                                                    onClick={() => onStatusChange(booking.id, 'confirmed')}
                                                    className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100"
                                                    title="Confirm"
                                                >
                                                    <CheckCircle size={18} />
                                                </button>
                                            )}
                                            {booking.status !== 'cancelled' && (
                                                <button
                                                    onClick={() => onStatusChange(booking.id, 'cancelled')}
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
    );
};
