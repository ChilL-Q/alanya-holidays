import React from 'react';
import { User, Euro } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { useCurrency } from '../../../context/CurrencyContext';

interface BookingDetailsModalProps {
    booking: any | null;
    onClose: () => void;
    onStatusChange: (id: string | number, status: string) => void;
    onPayoutStatusChange: (id: string, status: 'paid' | 'pending' | 'processing') => void;
}

export const BookingDetailsModal: React.FC<BookingDetailsModalProps> = ({
    booking, onClose, onStatusChange, onPayoutStatusChange
}) => {
    const { formatPrice, convertPrice } = useCurrency();

    const getDisplayId = (b: any) => {
        if (b.booking_ref) {
            return `#${b.booking_ref.toString().padStart(4, '0')}`;
        }
        return `#${b.id.toString().slice(0, 8)}`;
    };

    return (
        <Modal
            isOpen={!!booking}
            onClose={onClose}
            title={booking ? `Booking ${getDisplayId(booking)}` : 'Booking Details'}
            maxWidth="2xl"
        >
            {booking && (
                <div className="space-y-6">
                    <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-100 dark:border-slate-800/50">
                        {(booking.item_type === 'property' && booking.property?.images?.[0]) ? (
                            <img src={booking.property.images[0]} className="w-20 h-20 rounded-lg object-cover" alt="" />
                        ) : (booking.item_type === 'service' && booking.service?.images?.[0]) ? (
                            <img src={booking.service.images[0]} className="w-20 h-20 rounded-lg object-cover" alt="" />
                        ) : (
                            <div className="w-20 h-20 bg-slate-200 rounded-lg flex items-center justify-center text-xs text-slate-500">No Image</div>
                        )}
                        <div>
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white">{booking.itemTitle}</h3>
                            <div className="text-slate-500 text-sm flex gap-2 mt-1">
                                <span className="capitalize px-2 py-0.5 bg-slate-200 dark:bg-slate-800/50 rounded text-xs text-slate-700 dark:text-slate-300">
                                    {booking.item_type}
                                </span>
                                {booking.property?.location && <span>{booking.property.location}</span>}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-100 dark:border-slate-800/50">
                        <div>
                            <div className="text-xs text-slate-500 uppercase font-bold">Total Price</div>
                            <div className="text-lg font-bold text-slate-900 dark:text-white">{formatPrice(convertPrice(booking.total_price, 'EUR'))}</div>
                        </div>
                        <div>
                            <div className="text-xs text-slate-500 uppercase font-bold">Commission</div>
                            <div className="text-lg font-bold text-purple-600">{formatPrice(convertPrice(booking.commission_amount || 0, 'EUR'))}</div>
                        </div>
                        <div>
                            <div className="text-xs text-slate-500 uppercase font-bold">Host Payout</div>
                            <div className="text-lg font-bold text-teal-600 dark:text-cyan-400 ">{formatPrice(convertPrice(booking.host_payout_amount || 0, 'EUR'))}</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800/50">
                            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase mb-3">
                                <User size={14} /> Guest
                            </div>
                            <div className="font-medium dark:text-white">{booking.user?.full_name}</div>
                            <div className="text-sm text-slate-500">{booking.user?.email}</div>
                            <div className="text-sm text-slate-500">{booking.user?.phone || 'No phone'}</div>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800/50">
                            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase mb-3">
                                <Euro size={14} /> Payment
                            </div>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm text-slate-500">Total</span>
                                <span className="font-bold text-lg dark:text-white">{formatPrice(convertPrice(booking.total_price, 'EUR'))}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">Status</span>
                                <span className={`font-medium ${booking.payment_status === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                    {(booking.payment_status || 'Pending').toUpperCase()}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/50">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Admin Actions</h4>
                        <div className="flex gap-3">
                            <button
                                onClick={() => onStatusChange(booking.id, 'confirmed')}
                                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium"
                            >
                                Confirm
                            </button>
                            <button
                                onClick={() => onStatusChange(booking.id, 'cancelled')}
                                className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 text-sm font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => onStatusChange(booking.id, 'completed')}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                            >
                                Completed
                            </button>

                            {booking.payout_status === 'pending' && (
                                <button
                                    onClick={() => onPayoutStatusChange(booking.id, 'paid')}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
                                >
                                    Mark Paid
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </Modal>
    );
};
