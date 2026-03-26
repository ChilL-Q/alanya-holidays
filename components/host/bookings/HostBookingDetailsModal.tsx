import React from 'react';
import { Mail, Phone, MessageSquare, MapPin } from 'lucide-react';
import { useCurrency } from '../../../context/CurrencyContext';
import { Modal } from '../../../components/ui/Modal';
import { useNavigate } from 'react-router-dom';

interface HostBookingDetailsModalProps {
    booking: any | null;
    onClose: () => void;
    onStatusUpdate: (id: string, status: 'confirmed' | 'cancelled') => void;
}

export const HostBookingDetailsModal: React.FC<HostBookingDetailsModalProps> = ({
    booking, onClose, onStatusUpdate
}) => {
    const { convertPrice, formatPrice } = useCurrency();
    const navigate = useNavigate();

    if (!booking) return null;

    const getStatusBadge = (status: string) => {
        let textClass = 'text-slate-500';
        switch (status) {
            case 'pending': textClass = 'text-amber-600'; break;
            case 'confirmed': textClass = 'text-emerald-600'; break;
            case 'cancelled': textClass = 'text-rose-600'; break;
            case 'completed': textClass = 'text-blue-600'; break;
        }
        return <span className={`uppercase font-bold ${textClass}`}>{status}</span>;
    };

    return (
        <Modal
            isOpen={!!booking}
            onClose={onClose}
            title="Booking Details"
            maxWidth="2xl"
        >
            <div className="space-y-6">
                {/* Status Banner */}
                <div className={`p-4 rounded-xl flex items-center justify-between ${
                    booking.status === 'confirmed' ? 'bg-emerald-50 text-emerald-800' :
                        booking.status === 'cancelled' ? 'bg-rose-50 text-rose-800' :
                            booking.status === 'completed' ? 'bg-blue-50 text-blue-800' :
                                'bg-amber-50 text-amber-800'
                    }`}>
                    <div className="font-bold flex items-center gap-2">
                        {getStatusBadge(booking.status)}
                    </div>
                    <div className="text-sm font-medium opacity-80">
                        ID: #{booking.booking_ref ? booking.booking_ref.toString().padStart(4, '0') : booking.id.slice(0, 8)}
                    </div>
                </div>

                {/* Guest Section */}
                <div className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                    {booking.user?.avatar_url ? (
                        <img src={booking.user.avatar_url} className="w-14 h-14 rounded-full object-cover" alt="" />
                    ) : (
                        <div className="w-14 h-14 rounded-full bg-white dark:bg-slate-800/80 flex items-center justify-center text-slate-400 border border-slate-200 text-xl font-bold">
                            {booking.user?.full_name?.charAt(0) || 'G'}
                        </div>
                    )}
                    <div className="flex-1">
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">{booking.user?.full_name || 'Guest User'}</h3>
                        <div className="space-y-1 mt-2">
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                <Mail size={14} />
                                {booking.user?.email || 'No email provided'}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                <Phone size={14} />
                                {booking.user?.phone || 'No phone provided'}
                            </div>
                        </div>
                        <div className="mt-4 flex gap-2">
                            <button
                                onClick={() => navigate('/host/messages')}
                                className="flex items-center gap-2 px-3 py-1.5 bg-teal-600 dark:bg-cyan-600 text-white text-xs font-bold rounded-lg hover:bg-teal-700 dark:bg-cyan-600 transition"
                            >
                                <MessageSquare size={14} />
                                Message Guest
                            </button>
                        </div>
                    </div>
                </div>

                {/* Property & Dates */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                        <div className="text-xs text-slate-400 uppercase font-bold mb-1">Check In</div>
                        <div className="font-bold text-slate-900 dark:text-white text-lg">{new Date(booking.check_in).toLocaleDateString()}</div>
                        <div className="text-xs text-slate-500">After 3:00 PM</div>
                    </div>
                    <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                        <div className="text-xs text-slate-400 uppercase font-bold mb-1">Check Out</div>
                        <div className="font-bold text-slate-900 dark:text-white text-lg">{new Date(booking.check_out).toLocaleDateString()}</div>
                        <div className="text-xs text-slate-500">Before 11:00 AM</div>
                    </div>
                </div>

                {/* Property Mini Card */}
                <div className="flex gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/50 items-center">
                    {(booking.item_type === 'property' && booking.property?.images?.[0]) ? (
                        <img src={booking.property.images[0]} className="w-16 h-16 rounded-lg object-cover" alt="" />
                    ) : (booking.item_type === 'service' && booking.service?.images?.[0]) ? (
                        <img src={booking.service.images[0]} className="w-16 h-16 rounded-lg object-cover" alt="" />
                    ) : booking.property?.images?.[0] ? (
                        <img src={booking.property.images[0]} className="w-16 h-16 rounded-lg object-cover" alt="" />
                    ) : null}
                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-white">{booking.itemTitle}</h3>
                        <div className="text-sm text-slate-500 capitalize">{booking.item_type}</div>
                        {booking.property?.location && <div className="text-xs text-slate-400 flex items-center gap-1"><MapPin size={10} />{booking.property.location}</div>}
                    </div>
                </div>

                {/* Payment Summary */}
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Total Price</span>
                        <span className="font-bold text-lg text-slate-900 dark:text-white">{formatPrice(convertPrice(booking.total_price, 'EUR'))}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800/50">
                        <span>Payment Status</span>
                        <span className={`font-bold ${booking.payment_status === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {(booking.payment_status || 'Pending').toUpperCase()}
                        </span>
                    </div>
                </div>

                {/* Action Buttons (if pending) */}
                {booking.status === 'pending' && (
                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <button
                            onClick={() => onStatusUpdate(booking.id, 'cancelled')}
                            className="p-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition"
                        >
                            Decline Request
                        </button>
                        <button
                            onClick={() => onStatusUpdate(booking.id, 'confirmed')}
                            className="p-3 rounded-xl bg-teal-600 dark:bg-cyan-600 text-white font-bold hover:bg-teal-700 dark:bg-cyan-600 transition shadow-lg shadow-teal-500/20"
                        >
                            Accept Booking
                        </button>
                    </div>
                )}
            </div>
        </Modal>
    );
};
