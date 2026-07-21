import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ServiceData, servicesService } from '../../api-services';
import { useCurrency } from '../../context/CurrencyContext';
import { useLanguage } from '../../context/LanguageContext';
import { Calendar, ArrowLeft, Fuel, Gauge, Armchair } from 'lucide-react';
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
    const { convertPrice, formatPrice } = useCurrency();
    const { t, language } = useLanguage();

    const [service, setService] = useState<ServiceData | null>(null);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [days, setDays] = useState(0);

    useEffect(() => {
        const fetchService = async () => {
            if (!id) return;
            try {
                const serviceData = await servicesService.getService(id);
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


    if (loading) return <div className="pt-32 text-center">Loading...</div>;
    if (!service) return <div className="pt-32 text-center">Service not found</div>;

    return (
        <div className="pt-24 pb-16 min-h-screen bg-slate-50 dark:bg-slate-900">
            <div className="max-w-4xl mx-auto px-4">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-teal-600 dark:text-cyan-400 mb-8 transition-colors">
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
                        <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800/50">
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
                    <div className="bg-white dark:bg-slate-800/80 rounded-3xl p-8 shadow-lg border border-slate-100 dark:border-slate-800/50 h-fit">
                        <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-white mb-2">{service.title}</h1>
                        <div className="flex items-baseline gap-2 mb-8">
                            <span className="text-2xl font-bold text-teal-600 dark:text-cyan-400 dark:text-accent dark:text-amber-400 ">{formatPrice(convertPrice(service.price, 'EUR'))}</span>
                            <span className="text-slate-500 dark:text-slate-400">{t('car.per_day') || 'per day'}</span>
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
                                            customInput={<DateInputMask className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" />}
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
                                            customInput={<DateInputMask className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" />}
                                        />
                                    </div>
                                </div>
                            </div>

                            {days > 0 && (
                                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800/50 space-y-2">
                                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                                        <span>{formatPrice(convertPrice(service.price, 'EUR'))} x {days} {t('esim.days') || 'days'}</span>
                                        <span>{formatPrice(convertPrice(service.price * days, 'EUR'))}</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700/50">
                                        <span>{t('prop.total') || 'Total'}</span>
                                        <span>{formatPrice(convertPrice(service.price * days, 'EUR'))}</span>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={() => {
                                    if (!service || !startDate || !endDate || days <= 0) return;

                                    const formatDate = (d: Date) => `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
                                    const startDateStr = formatDate(startDate);
                                    const endDateStr = formatDate(endDate);

                                    // WhatsApp Reservation Flow for Vehicles
                                    const message = `Hello! I would like to rent ${service.title} for ${days} days (${startDateStr} to ${endDateStr}). Is it available?`;
                                    const encodedMessage = encodeURIComponent(message);
                                    const phoneNumber = '14389294208';
                                    window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
                                }}
                                disabled={!startDate || !endDate || days <= 0}
                                className="w-full bg-green-600 text-white font-bold py-4 rounded-xl hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <span>Reserve via WhatsApp</span>
                                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

