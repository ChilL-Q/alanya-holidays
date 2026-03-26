import React from 'react';
import { Package, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../../context/LanguageContext';

interface ProfileBookingsTabProps {
    bookings: any[];
    loading: boolean;
    onCancelBooking: (bookingId: string, createdAt: string) => void;
}

export const ProfileBookingsTab: React.FC<ProfileBookingsTabProps> = ({
    bookings,
    loading,
    onCancelBooking
}) => {
    const { t } = useLanguage();
    const navigate = useNavigate();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-white">{t('profile.bookings')}</h2>
                <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-bold rounded-full">
                    {bookings.length}
                </span>
            </div>

            {loading ? (
                <div className="grid gap-4">
                    {[1, 2].map(i => (
                        <div key={i} className="bg-white dark:bg-slate-800/80 rounded-2xl h-40 animate-pulse border border-slate-100 dark:border-slate-800/50"></div>
                    ))}
                </div>
            ) : bookings.length === 0 ? (
                <div className="bg-white dark:bg-slate-800/80 rounded-3xl shadow-sm p-12 text-center border-2 border-dashed border-slate-100 dark:border-slate-800/50">
                    <Package size={48} className="mx-auto text-slate-200 dark:text-slate-300 mb-6" />
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{t('profile.no_bookings')}</h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm mx-auto">{t('profile.empty_message')}</p>
                    <button
                        onClick={() => navigate('/stays')}
                        className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-2xl font-bold transition-all hover:scale-105 shadow-lg shadow-primary/20"
                    >
                        {t('profile.explore_button')}
                    </button>
                </div>
            ) : (
                <div className="grid gap-6">
                    {bookings.map((booking) => (
                        <div key={booking.id} className="bg-white dark:bg-slate-800/80 rounded-2xl shadow-sm overflow-hidden border border-slate-100 dark:border-slate-800/50 group hover:shadow-xl transition-all duration-300">
                            <div className="flex flex-col md:flex-row">
                                <div className="w-full md:w-64 h-48 md:h-auto overflow-hidden relative">
                                    {booking.property?.images?.[0] ? (
                                        <img src={booking.property.images[0]} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" alt={booking.property.title} />
                                    ) : booking.service?.images?.[0] ? (
                                        <img src={booking.service.images[0]} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" alt={booking.service.title} />
                                    ) : (
                                        <div className="flex items-center justify-center h-full bg-slate-50 dark:bg-slate-900 text-slate-400">
                                            <Package size={32} />
                                        </div>
                                    )}
                                    <div className="absolute top-4 left-4">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm ${booking.status === 'confirmed' ? 'bg-green-500 text-white' :
                                            booking.status === 'cancelled' ? 'bg-red-500 text-white' :
                                                'bg-amber-500 text-white'
                                            }`}>
                                            {booking.status}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-6 flex-grow flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <p className="text-[10px] font-bold text-accent dark:text-amber-400 uppercase tracking-widest mb-1">
                                                    {booking.item_type}
                                                </p>
                                                <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                                                    {booking.property?.title || booking.service?.title || 'Booking'}
                                                </h3>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">{t('prop.total')}</p>
                                                <p className="text-xl font-serif font-bold text-slate-900 dark:text-white">
                                                    €{booking.total_price}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-4 text-sm">
                                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 px-3 py-1.5 rounded-xl">
                                                <Calendar size={14} className="text-primary" />
                                                <span className="font-medium">
                                                    {new Date(booking.check_in).toLocaleDateString()}
                                                    {booking.check_out && ` - ${new Date(booking.check_out).toLocaleDateString()}`}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 flex items-center justify-between border-t border-slate-50 dark:border-slate-800/50 pt-4">
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                            {t('profile.id_label')}: {booking.id.slice(0, 8)}
                                        </p>
                                        <button
                                            onClick={() => navigate(`/properties/${booking.item_id}`)}
                                            className="text-xs font-bold text-primary hover:text-primary-dark transition-colors flex items-center gap-1 group/btn"
                                        >
                                            {t('profile.view_details')}
                                            <Package size={14} className="group-hover/btn:translate-x-0.5 transition-transform" />
                                        </button>

                                        {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                                            <button
                                                onClick={() => onCancelBooking(booking.id, booking.created_at)}
                                                className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors flex items-center gap-1 ml-4"
                                            >
                                                {t('profile.cancel') || 'Cancel'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
