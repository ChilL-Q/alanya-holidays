import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, ServiceData } from '../../services/db';
import { useCart } from '../../context/CartContext';
import { useCurrency } from '../../context/CurrencyContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Calendar, ArrowLeft, Fuel, Gauge, Armchair, ChevronRight } from 'lucide-react';
import { ServiceType } from '../../types';
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

export const BookVehicle: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { convertPrice, formatPrice } = useCurrency();
    const { t, language } = useLanguage();
    const { user } = useAuth();

    const [service, setService] = useState<ServiceData | null>(null);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [days, setDays] = useState(0);

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

    useEffect(() => {
        if (startDate && endDate) {
            const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            setDays(diffDays > 0 ? diffDays : 0);
        } else {
            setDays(0);
        }
    }, [startDate, endDate]);

    const handleBook = () => {
        if (!service || !startDate || !endDate || days <= 0) return;

        const totalPrice = service.price * days;

        // Format dates as YYYY-MM-DD for consistency with previous logic and CartItem expectations
        // Although Date objects are better, our CartItem interface currently uses string | undefined for startDate/endDate in some places, 
        // but let's stick to the string format 'YYYY-MM-DD' as expected by the existing cart display logic.
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];

        addToCart({
            id: service.id || Math.random().toString(),
            type: ServiceType.RENTAL,
            title: service.title,
            price: totalPrice,
            image: service.images?.[0],
            details: `${days} Days (${startDateStr} to ${endDateStr})`,
            startDate: startDateStr,
            endDate: endDateStr,
            date: startDateStr // Legacy support
        });

        navigate('/checkout');
    };

    if (loading) return <div className="pt-32 text-center">Loading...</div>;
    if (!service) return <div className="pt-32 text-center">Service not found</div>;

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
                            <h3 className="font-bold text-slate-900 dark:text-white mb-4">{t('offer.features') || 'Vehicle Features'}</h3>
                            <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                                {service.features?.fuel && (
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2"><Fuel size={16} /> Fuel</div>
                                        <span className="font-medium text-slate-900 dark:text-white capitalize">{service.features.fuel}</span>
                                    </div>
                                )}
                                {service.features?.transmission && (
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2"><Gauge size={16} /> Transmission</div>
                                        <span className="font-medium text-slate-900 dark:text-white capitalize">{service.features.transmission}</span>
                                    </div>
                                )}
                                {service.features?.seats && (
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2"><Armchair size={16} /> Seats</div>
                                        <span className="font-medium text-slate-900 dark:text-white">{service.features.seats}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Booking Form */}
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-lg border border-slate-100 dark:border-slate-700 h-fit">
                        <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-white mb-2">{service.title}</h1>
                        <div className="flex items-baseline gap-2 mb-8">
                            <span className="text-2xl font-bold text-teal-600">{formatPrice(convertPrice(service.price, 'EUR'))}</span>
                            <span className="text-slate-500">{t('car.per_day') || 'per day'}</span>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Rental Dates</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none z-10">
                                            <Calendar className="text-slate-400" size={18} />
                                        </div>
                                        <DatePicker
                                            selected={startDate}
                                            onChange={(date) => setStartDate(date)}
                                            selectsStart
                                            startDate={startDate}
                                            endDate={endDate}
                                            minDate={new Date()}
                                            placeholderText={t('date_format')}
                                            dateFormat="dd.MM.yyyy"
                                            locale={language === 'ru' ? ru : language === 'tr' ? tr : enGB}
                                            customInput={<DateInputMask className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" />}
                                        />
                                    </div>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none z-10">
                                            <Calendar className="text-slate-400" size={18} />
                                        </div>
                                        <DatePicker
                                            selected={endDate}
                                            onChange={(date) => setEndDate(date)}
                                            selectsEnd
                                            startDate={startDate}
                                            endDate={endDate}
                                            minDate={startDate || new Date()}
                                            placeholderText={t('date_format')}
                                            dateFormat="dd.MM.yyyy"
                                            locale={language === 'ru' ? ru : language === 'tr' ? tr : enGB}
                                            customInput={<DateInputMask className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" />}
                                        />
                                    </div>
                                </div>
                            </div>

                            {days > 0 && (
                                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700 space-y-2">
                                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                                        <span>{formatPrice(convertPrice(service.price, 'EUR'))} x {days} {t('esim.days') || 'days'}</span>
                                        <span>{formatPrice(convertPrice(service.price * days, 'EUR'))}</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-600">
                                        <span>{t('prop.total') || 'Total'}</span>
                                        <span>{formatPrice(convertPrice(service.price * days, 'EUR'))}</span>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={handleBook}
                                disabled={!startDate || !endDate || days <= 0}
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

