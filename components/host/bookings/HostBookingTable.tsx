import React from 'react';
import { CheckCircle, XCircle, Clock, Eye, Calendar, MapPin } from 'lucide-react';
import { useCurrency } from '../../../context/CurrencyContext';

interface HostBookingTableProps {
    bookings: any[];
    isLoading: boolean;
    onViewDetails: (booking: any) => void;
    onStatusUpdate: (id: string, status: 'confirmed' | 'cancelled') => void;
}

export const HostBookingTable: React.FC<HostBookingTableProps> = ({
    bookings, isLoading, onViewDetails, onStatusUpdate
}) => {
    const { convertPrice, formatPrice } = useCurrency();

    const getStatusBadge = (status: string) => {
        const styles = {
            pending: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
            confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
            cancelled: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800',
            completed: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-slate-800/50 dark:text-slate-200 dark:border-slate-700/50'
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
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-800/50 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 text-xs uppercase font-bold tracking-wider border-b border-slate-100 dark:border-slate-800/50">
                        <tr>
                            <th className="p-5 pl-6">Guest</th>
                            <th className="p-5">Property / Service</th>
                            <th className="p-5">Dates</th>
                            <th className="p-5">Status</th>
                            <th className="p-5">Total</th>
                            <th className="p-5 text-right pr-6">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                        {isLoading ? (
                            <tr><td colSpan={6} className="p-12 text-center text-slate-400">Loading reservations...</td></tr>
                        ) : bookings.length > 0 ? (
                            bookings.map((booking) => (
                                <tr key={booking.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors group">
                                    <td className="p-5 pl-6">
                                        <div className="flex items-center gap-3">
                                            {booking.user?.avatar_url ? (
                                                <img src={booking.user.avatar_url} className="w-10 h-10 rounded-full object-cover shadow-sm bg-slate-100" alt="" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center text-slate-500 font-bold">
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
                                        <div className="font-medium text-slate-900 dark:text-white line-clamp-1 max-w-[200px]" title={booking.itemTitle}>{booking.itemTitle}</div>
                                        {booking.property?.location && (
                                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5" title={booking.property.location}>
                                                <MapPin size={10} />
                                                <span className="truncate max-w-[150px]">{booking.property.location}</span>
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
                                                onClick={() => onViewDetails(booking)}
                                                className="p-2 text-slate-400 hover:text-teal-600 dark:text-cyan-400 hover:bg-teal-50 rounded-lg transition-colors"
                                                title="View Details"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            {booking.status === 'pending' && (
                                                <>
                                                    <button
                                                        onClick={() => onStatusUpdate(booking.id, 'confirmed')}
                                                        className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                                                        title="Approve"
                                                    >
                                                        <CheckCircle size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => onStatusUpdate(booking.id, 'cancelled')}
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
    );
};
