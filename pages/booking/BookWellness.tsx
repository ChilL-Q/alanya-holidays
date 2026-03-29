import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, ServiceData } from '../../api-services';
import { useCurrency } from '../../context/CurrencyContext';
import { useLanguage } from '../../context/LanguageContext';
import { Calendar, ArrowLeft, Heart, MessageCircle } from 'lucide-react';
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

export const BookWellness: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { convertPrice, formatPrice } = useCurrency();
    const { t, language } = useLanguage();

    const [service, setService] = useState<ServiceData | null>(null);
    const [loading, setLoading] = useState(true);
    const [date, setDate] = useState<Date | null>(null);

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
    if (!service) return <div className="pt-32 text-center">Service not found</div>;

    const handleContact = () => {
        if (!service) return;

        const formatDate = (d: Date) => d ? `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}` : 'Dates to be discussed';
        const dateStr = date ? formatDate(date) : '';

        // Prioritize service specific whatsapp, otherwise fallback (though generic fallback might not be ideal for health)
        const phoneNumber = service.features?.whatsapp || '905551234567';

        let message = `Hello! I am interested in your wellness service: ${service.title}.`;
        if (date) {
            message += `\nPreferred Date: ${dateStr}`;
        }
        message += `\nPlease provide more information about availability and preparing for the procedure.`;

        const url = `https://wa.me/${phoneNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    return (
        <div className="pt-24 pb-16 min-h-screen bg-slate-50 dark:bg-slate-900">
            <div className="max-w-4xl mx-auto px-4">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-teal-600 dark:text-cyan-400 mb-8 transition-colors">
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
                        <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800/50 space-y-6">

                            {/* Description */}
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white mb-3">{t('offer.details') || 'Service Details'}</h3>
                                <div className="flex items-center gap-2 mb-4 text-rose-500">
                                    <Heart size={18} />
                                    <span className="font-medium capitalize">{service.features?.subcategory || 'Wellness'}</span>
                                </div>
                                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                                    {service.description}
                                </p>
                            </div>

                            <div className="h-px bg-slate-100 dark:bg-slate-800/50" />

                            {/* Provider Info */}
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800/50">
                                <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-2">Direct Contact</h4>
                                <p className="text-sm text-slate-500 mb-2">You will be communicating directly with the clinic/specialist via WhatsApp.</p>
                                <div className="flex items-center gap-2 text-green-600 font-medium text-sm">
                                    <MessageCircle size={16} />
                                    <span>Fast Response</span>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Booking/Contact Form */}
                    <div className="bg-white dark:bg-slate-800/80 rounded-3xl p-8 shadow-lg border border-slate-100 dark:border-slate-800/50 h-fit">
                        <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-white mb-2">{service.title}</h1>
                        <div className="flex items-baseline gap-2 mb-8">
                            <span className="text-2xl font-bold text-teal-600 dark:text-cyan-400 dark:text-accent dark:text-amber-400 ">
                                {service.price > 0 ? formatPrice(convertPrice(service.price, 'EUR')) : 'Contact for Price'}
                            </span>
                            {service.price > 0 && <span className="text-slate-500 dark:text-slate-400">approx. cost</span>}
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('search.dates') || 'Preferred Date'}</label>
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
                                        customInput={<DateInputMask className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" />}
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleContact}
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl transition shadow-lg shadow-green-600/20 flex items-center justify-center gap-2"
                            >
                                <span>Contact via WhatsApp</span>
                                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
