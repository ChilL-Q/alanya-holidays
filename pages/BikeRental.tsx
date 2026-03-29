import React, { useEffect, useState } from 'react';
import { VehicleRentalTemplate } from '../components/templates/VehicleRentalTemplate';
import { useLanguage } from '../context/LanguageContext';
import { useLightbox } from '../context/LightboxContext';
import { useCurrency } from '../context/CurrencyContext';
import { db } from '../api-services';
import { useNavigate } from 'react-router-dom';
import { getCarImage } from '../utils/carImages';

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
                    // Use getCarImage to ensure local files are used
                    const image = getCarImage(brand, model, 'bike', service.images?.[0]);

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
                            features: service.features?.included ? service.features.included.split(',') : []
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

    return (
        <VehicleRentalTemplate
            titleHtml={t('bike.hero.title')}
            subtitle={t('bike.hero.subtitle')}
            features={[t('bike.features.helmet'), t('bike.features.mileage'), t('bike.features.assistance')]}
            heroImage="/images/transportation/bike/rent-a-bike-page.png"
            heroAlt="Scooter Rental"
            heroImageRotate="-rotate-2"
            popularTitle={t('bike.popular')}
            loading={loading}
            loadingMessage="Loading bikes..."
            isEmpty={!loading && bikeGroups.length === 0}
        >
            {bikeGroups.map((bike, index) => (
                <div
                    key={bike.id}
                    className="bg-white dark:bg-slate-800/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-100 dark:border-slate-800/50 group cursor-pointer"
                    onClick={() => navigate(`/services/car-rental/${bike.id}`, { state: { brand: bike.brand, model: bike.model, type: 'bike' } })}
                >
                    <div className="aspect-[4/3] overflow-hidden relative">
                        <img
                            src={bike.image}
                            alt={bike.title}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute top-3 right-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-slate-800 dark:text-white shadow-sm">
                            {bike.year}
                        </div>
                        {bike.count > 1 && (
                            <div className="absolute top-3 left-3 bg-teal-500 dark:bg-cyan-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                                {bike.count} Offers
                            </div>
                        )}
                    </div>
                    <div className="p-5">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{bike.title}</h3>
                            <div className="text-right">
                                <div className="text-sm text-slate-500 dark:text-slate-400">from</div>
                                <div className="text-xl font-bold text-teal-600 dark:text-cyan-400 dark:text-accent dark:text-amber-400 ">
                                    {formatPrice(convertPrice(bike.minPrice, 'EUR'))}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">{t('car.per_day')}</div>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-6">
                            {bike.features.map((feature, i) => (
                                <span key={i} className="px-2 py-1 bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 text-xs rounded-md font-medium capitalize">
                                    {feature}
                                </span>
                            ))}
                        </div>
                        <button className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-white rounded-xl font-semibold hover:opacity-90 transition-opacity">
                            {t('request_details')}
                        </button>
                    </div>
                </div>
            ))}
        </VehicleRentalTemplate>
    );
};
