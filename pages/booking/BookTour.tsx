import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, ServiceData } from '../../services/db';
import { useCart } from '../../context/CartContext';
import { useCurrency } from '../../context/CurrencyContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Calendar, ArrowLeft, Users, Clock, ChevronRight } from 'lucide-react';
import { ServiceType } from '../../types/index';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { enGB, ru, tr } from 'date-fns/locale';
import { IMaskInput } from 'react-imask';

// Custom Masked Input Component
const DateInputMask = React.forwardRef<HTMLInputElement, any>((props, ref) => (
    <IMaskInput
        {...props}
        mask="00.00.0000"
        definitions={{
            '0': /[0-9]/
        }}
        inputRef={ref}
        overwrite
    />
));

export const BookTour: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { convertPrice, formatPrice } = useCurrency();
    const { t, language } = useLanguage();
    const { user } = useAuth();

    const [service, setService] = useState<ServiceData | null>(null);
    const [loading, setLoading] = useState(true);
    const [date, setDate] = useState<Date | null>(null);
    const [guests, setGuests] = useState(1);

    useEffect(() => {
        const fetchService = async () => {
            if (!id) return;
            try {
                const serviceData = await db.getService(id);
                setService(serviceData);
            } catch (error) {
                console.error("Failed to fetch service", error);
            } finally {
                setLoading(false);
            }
        };
        fetchService();
    }, [id]);

    const handleBook = () => {
        if (!service || !date || guests <= 0) return;

        const totalPrice = service.price * guests;
        const dateStr = date.toISOString().split('T')[0];

        addToCart({
            id: service.id || Math.random().toString(),
            type: ServiceType.TOUR,
            title: service.title,
            price: totalPrice,
            image: service.images?.[0],
            details: `${guests} ${guests === 1 ? t('prop.guest_option', { count: 1 }) : t('prop.guests_option', { count: guests })} on ${dateStr}`,
            date: dateStr,
            guests: guests
        });

        navigate('/checkout');
    };

    if (loading) return <div className="pt-32 text-center">Loading...</div>;
    if (!service) return <div className="pt-32 text-center">Tour not found</div>;

    return (
        <div className="pt-24 pb-16 min-h-screen bg-slate-50 dark:bg-slate-900">
            <div className="max-w-4xl mx-auto px-4">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-teal-600 mb-8 transition-colors">
                    <ArrowLeft size={20} />
                    {t('auth.close') || 'Back'}
                </button>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Visuals */}
                    <div>
                        <img
                            src={service.images?.[0] || 'https://via.placeholder.com/600x400'}
                            alt={service.title}
                            className="w-full rounded-2xl shadow-md object-cover aspect-[4/3] mb-6"
                        />
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
                            <h3 className="font-bold text-slate-900 dark:text-white mb-4">{t('offer.details') || 'Tour Highlights'}</h3>
                            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-4">
                                {service.description}
                            </p>
                            <div className="text-sm text-slate-500 flex items-center gap-2">
                                <Clock size={16} />
                                <span>Duration: ~{service.features?.duration || '4 hours'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Booking Form */}
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-lg border border-slate-100 dark:border-slate-700 h-fit">
                        <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-white mb-2">{service.title}</h1>
                        <div className="flex items-baseline gap-2 mb-8">
                            <span className="text-2xl font-bold text-teal-600">{formatPrice(convertPrice(service.price, 'EUR'))}</span>
                            <span className="text-slate-500">per person</span>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('search.dates') || 'Tour Date'}</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none z-10">
                                        <Calendar className="text-slate-400" size={18} />
                                    </div>
                                    <DatePicker
                                        selected={date}
                                        onChange={(d) => setDate(d)}
                                        minDate={new Date()}
                                        placeholderText={t('date_format')}
                                        dateFormat="dd.MM.yyyy"
                                        locale={language === 'ru' ? ru : language === 'tr' ? tr : enGB}
                                        customInput={<DateInputMask className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" />}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('search.guests') || 'Guests'}</label>
                                <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl p-2 px-4">
                                    <Users size={20} className="text-slate-400" />
                                    <button
                                        onClick={() => setGuests(Math.max(1, guests - 1))}
                                        className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-teal-600 font-bold"
                                    >
                                        -
                                    </button>
                                    <span className="flex-1 text-center font-bold text-lg dark:text-white">{guests}</span>
                                    <button
                                        onClick={() => setGuests(guests + 1)}
                                        className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-teal-600 font-bold"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700 space-y-2">
                                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                                    <span>{formatPrice(convertPrice(service.price, 'EUR'))} x {guests} {guests === 1 ? t('prop.guest_option', { count: 1 }) : t('prop.guests_option', { count: guests })}</span>
                                    <span>{formatPrice(convertPrice(service.price * guests, 'EUR'))}</span>
                                </div>
                                <div className="flex justify-between font-bold text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-600">
                                    <span>{t('prop.total') || 'Total'}</span>
                                    <span>{formatPrice(convertPrice(service.price * guests, 'EUR'))}</span>
                                </div>
                            </div>

                            <button
                                onClick={handleBook}
                                disabled={!date || guests <= 0}
                                className="w-full bg-teal-600 text-white font-bold py-4 rounded-xl hover:bg-teal-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {t('checkout.title') || 'Continue to Checkout'}
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
