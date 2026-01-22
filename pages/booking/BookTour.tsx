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

    if (loading) return <div className="pt-32 text-center">Loading...</div>;
    if (!service) return <div className="pt-32 text-center">Tour not found</div>;

    const isWhatsAppBooking = service.features?.subcategory === 'atv' || service.title.toLowerCase().includes('atv') || service.title.toLowerCase().includes('buggy');


    const handleBook = () => {
        if (!service || !date) return;

        const formatDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const dateStr = formatDate(date);

        if (isWhatsAppBooking) {
            const phoneNumber = '14389294208';

            const message = `Hello, I would like to book the tour: ${service.title}
Date: ${dateStr}
Guests: ${guests}
Total Price: ${formatPrice(convertPrice(service.price * guests, 'EUR'))}`;

            const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
            window.open(url, '_blank');
        } else {
            addToCart({
                id: service.id,
                title: service.title,
                price: service.price,
                image: service.images?.[0],
                type: ServiceType.TOUR,
                date: dateStr,
                startDate: dateStr,
                endDate: dateStr,
                guests: guests
            });
            navigate('/checkout');
        }
    };

    return (
        <div className="pt-24 pb-16 min-h-screen bg-slate-50 dark:bg-slate-900">
            <div className="max-w-4xl mx-auto px-4">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-teal-600 mb-8 transition-colors">
                    <ArrowLeft size={20} />
                    {t('auth.close') || 'Back'}
                </button>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Visuals & Details */}
                    <div>
                        <img
                            src={service.images?.[0] || 'https://via.placeholder.com/600x400'}
                            alt={service.title}
                            className="w-full rounded-2xl shadow-md object-cover aspect-[4/3] mb-6"
                        />
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 space-y-6">

                            {/* Description */}
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white mb-3">{t('offer.details') || 'Tour Highlights'}</h3>
                                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                                    {service.description}
                                </p>
                            </div>

                            <div className="h-px bg-slate-100 dark:bg-slate-700" />

                            {/* Key Stats */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                    <Clock size={16} className="text-teal-500" />
                                    <span>~{service.features?.duration || '4 hours'}</span>
                                </div>
                                {service.features?.groupSize && (
                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                        <Users size={16} className="text-teal-500" />
                                        <span>Max {service.features.groupSize}</span>
                                    </div>
                                )}
                            </div>

                            {/* Itinerary */}
                            {service.features?.itinerary && Array.isArray(service.features.itinerary) && service.features.itinerary.length > 0 && (
                                <>
                                    <div className="h-px bg-slate-100 dark:bg-slate-700" />
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white mb-3">Schedule</h3>
                                        <ul className="space-y-3">
                                            {service.features.itinerary.map((item: any, idx: number) => (
                                                <li key={idx} className="flex gap-3 text-sm">
                                                    <span className="font-bold text-teal-600 min-w-[60px]">{item.time || `Stop ${idx + 1}`}</span>
                                                    <span className="text-slate-600 dark:text-slate-400">{item.activity || item.description}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </>
                            )}

                            {/* Included */}
                            {service.features?.included && (
                                <>
                                    <div className="h-px bg-slate-100 dark:bg-slate-700" />
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white mb-3">Included</h3>
                                        <ul className="grid grid-cols-1 gap-2">
                                            {Array.isArray(service.features.included)
                                                ? service.features.included.map((item: string, i: number) => (
                                                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                                                        <span className="text-green-500 mt-0.5">✓</span> {item}
                                                    </li>
                                                ))
                                                : <p className="text-sm text-slate-600 dark:text-slate-400">{service.features.included}</p>
                                            }
                                        </ul>
                                    </div>
                                </>
                            )}

                            {/* Requirements/Notes */}
                            {service.features?.requirements && (
                                <>
                                    <div className="h-px bg-slate-100 dark:bg-slate-700" />
                                    <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-100 dark:border-amber-800/30">
                                        <h4 className="font-bold text-amber-800 dark:text-amber-400 text-xs uppercase tracking-wide mb-2">Important Information</h4>
                                        <p className="text-sm text-amber-900/80 dark:text-amber-200/80">
                                            {service.features.requirements}
                                        </p>
                                    </div>
                                </>
                            )}
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

                            {!isWhatsAppBooking && (
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
                            )}

                            <button
                                onClick={handleBook}
                                disabled={!date || guests <= 0}
                                className={`w-full text-white font-bold py-4 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${isWhatsAppBooking
                                    ? 'bg-green-600 hover:bg-green-700'
                                    : 'bg-teal-600 hover:bg-teal-700'
                                    }`}
                            >
                                {isWhatsAppBooking ? (
                                    <>
                                        <span>Reserve via WhatsApp</span>
                                        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                                    </>
                                ) : (
                                    <>
                                        {t('checkout.title') || 'Continue to Checkout'}
                                        <ChevronRight size={20} />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
