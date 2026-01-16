import React, { useEffect, useState } from 'react';
import { Check, ChevronRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useLightbox } from '../context/LightboxContext';
import { useCurrency } from '../context/CurrencyContext';
import { db } from '../services/db';
import { useNavigate } from 'react-router-dom';

interface BikeGroup {
    id: string; // generated slug
    title: string;
    brand: string;
    model: string;
    year: string;
    minPrice: number;
    image: string;
    count: number;
    features: string[];
}

export const BikeRental: React.FC = () => {
    const { t } = useLanguage();
    const { openLightbox } = useLightbox();
    const { convertPrice, formatPrice } = useCurrency();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [bikeGroups, setBikeGroups] = useState<BikeGroup[]>([]);

    useEffect(() => {
        const fetchBikes = async () => {
            try {
                // Fetch both 'bike' and 'scooter' if you distinguish them, or just 'bike'
                // Our AddService uses 'bike' type for both.
                const { data: services } = await db.getServices('bike', 1, 100);

                // Aggregation Logic (Same as Car)
                const groups: Record<string, BikeGroup> = {};

                services?.forEach((service: any) => {
                    const brand = service.features?.brand || 'Unknown';
                    const model = service.features?.model || 'Model';
                    const key = `${brand}-${model}`.toLowerCase();
                    const title = `${brand} ${model}`;
                    const price = service.price;
                    // Use first image found, fallback to generic bike image
                    const image = service.images?.[0] || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=2670&auto=format&fit=crop';

                    if (!groups[key]) {
                        groups[key] = {
                            id: key,
                            title: title,
                            brand: brand,
                            model: model,
                            year: service.features?.year || '',
                            minPrice: price,
                            image: image,
                            count: 1,
                            features: ['Helmet', 'Insurance'] // Default features if not in DB, or extract from service
                        };
                    } else {
                        groups[key].count += 1;
                        if (price < groups[key].minPrice) {
                            groups[key].minPrice = price;
                        }
                    }
                });

                setBikeGroups(Object.values(groups));
            } catch (err) {
                console.error('Failed to fetch bikes', err);
            } finally {
                setLoading(false);
            }
        };

        fetchBikes();
    }, []);

    const allBikeImages = bikeGroups.map(b => ({ src: b.image, title: b.title }));

    return (
        <div className="pt-24 pb-16 min-h-screen bg-slate-50 dark:bg-slate-900">
            {/* Hero Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-serif text-slate-900 dark:text-white mb-6 leading-tight" dangerouslySetInnerHTML={{ __html: t('bike.hero.title') }} />
                        <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                            {t('bike.hero.subtitle')}
                        </p>

                        <div className="flex flex-wrap gap-4 mb-10">
                            {[t('bike.features.helmet'), t('bike.features.mileage'), t('bike.features.assistance')].map((feature, idx) => (
                                <div key={idx} className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-full shadow-sm text-sm font-medium text-slate-700 dark:text-slate-300">
                                    <Check size={16} className="text-teal-500" />
                                    {feature}
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-4">
                            <button className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-4 rounded-xl font-semibold shadow-lg shadow-teal-600/20 transition-all duration-300 hover:shadow-teal-600/40 hover:scale-105 active:scale-95 flex items-center gap-2">
                                {t('bike.button')} <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="absolute -inset-4 bg-teal-100 dark:bg-teal-900/30 rounded-full blur-3xl opacity-50"></div>
                        <img
                            src="https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=2670&auto=format&fit=crop"
                            alt="Scooter Rental"
                            className="relative rounded-3xl shadow-2xl transform -rotate-2 hover:rotate-0 transition-transform duration-500"
                        />
                    </div>
                </div>
            </div>

            {/* Fleet Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-3xl font-serif text-slate-900 dark:text-white mb-8">{t('bike.popular')}</h2>

                {loading ? (
                    <div className="text-center py-20 text-slate-500">Loading bikes...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {bikeGroups.map((bike, index) => (
                            <div
                                key={bike.id}
                                className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-100 dark:border-slate-800 group cursor-pointer"
                                // Note: We might want a separate BikeModelDetails page later, or reuse CarModelDetails if generic enough.
                                // For now, let's assume we link to a detail page. Reusing CarModelDetails might work if we make it generic "VehicleDetails".
                                // But for safety/speed, let's keep the link but we might need to duplicate the detail page or make it handle 'bike' type.
                                // Actually, CarModelDetails filters by 'car'. We should probably update it or make a new one.
                                // For this step, let's just enable the aggregation display.
                                onClick={() => navigate(`/services/car-rental/${bike.id}`, { state: { brand: bike.brand, model: bike.model, type: 'bike' } })}
                            >
                                <div className="aspect-[4/3] overflow-hidden relative">
                                    <img
                                        src={bike.image}
                                        alt={bike.title}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                    <div className="absolute top-3 right-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-slate-800 dark:text-white shadow-sm">
                                        {bike.year}
                                    </div>
                                    {bike.count > 1 && (
                                        <div className="absolute top-3 left-3 bg-teal-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                                            {bike.count} Offers
                                        </div>
                                    )}
                                </div>
                                <div className="p-5">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{bike.title}</h3>
                                        <div className="text-right">
                                            <div className="text-sm text-slate-500">from</div>
                                            <div className="text-xl font-bold text-teal-600">
                                                {formatPrice(convertPrice(bike.minPrice, 'EUR'))}
                                            </div>
                                            <div className="text-xs text-slate-500">{t('car.per_day')}</div>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mb-6">
                                        {bike.features.map((feature, i) => (
                                            <span key={i} className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-md font-medium capitalize">
                                                {feature}
                                            </span>
                                        ))}
                                    </div>
                                    <button className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-semibold hover:opacity-90 transition-opacity">
                                        {t('car.book')}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
