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

export const BicycleRental: React.FC = () => {
    const { t } = useLanguage();
    const { openLightbox } = useLightbox();
    const { convertPrice, formatPrice } = useCurrency();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [bikeGroups, setBikeGroups] = useState<BikeGroup[]>([]);

    useEffect(() => {
        const fetchBikes = async () => {
            try {
                // Fetch specialized e-bike tours/rentals
                const { data: tours } = await db.getServices('tour', 1, 100);

                // Filter for e-bikes
                const eBikes = tours?.filter(s => s.features?.subcategory === 'ebike' || s.features?.subcategory === 'bicycle') || [];

                // Map to the display format
                const formattedBikes: BikeGroup[] = eBikes.map(service => ({
                    id: service.id,
                    title: service.title,
                    brand: service.features?.brand || 'Premium',
                    model: service.features?.model || 'E-Bike',
                    year: service.features?.year || '2024',
                    minPrice: service.price,
                    image: service.images?.[0] || '/images/experiences/bikes_hero.png',
                    count: 1,
                    features: service.features?.included ? service.features.included.split(',') : []
                }));

                setBikeGroups(formattedBikes);
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
            titleText="Explore on Two Wheels (Bicycles)"
            subtitle="Discover the city at your own pace with our premium selection of bicycles and e-bikes."
            features={[t('bike.features.helmet'), t('bike.features.mileage'), t('bike.features.assistance')]}
            heroImage="/images/experiences/bikes_hero.png"
            heroAlt="E-Bike Rental"
            heroImageRotate="-rotate-2"
            popularTitle={t('bike.popular')}
            loading={loading}
            loadingMessage="Loading bikes..."
            isEmpty={!loading && bikeGroups.length === 0}
        >
            {bikeGroups.map((bike) => (
                <div
                    key={bike.id}
                    className="bg-white dark:bg-slate-800/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-100 dark:border-slate-800/50 group cursor-pointer"
                    onClick={() => navigate(`/book-tour/${bike.id}`)}
                >
                    <div className="aspect-[4/3] overflow-hidden relative">
                        <img
                            src={bike.image}
                            alt={bike.title}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    </div>
                    <div className="p-5">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white line-clamp-1">{bike.title}</h3>
                            <div className="text-right whitespace-nowrap ml-2">
                                <div className="text-sm text-slate-500">from</div>
                                <div className="text-xl font-bold text-teal-600 dark:text-cyan-400 ">
                                    {formatPrice(convertPrice(bike.minPrice, 'EUR'))}
                                </div>
                                <div className="text-xs text-slate-500">{t('car.per_day')}</div>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-6 h-12 overflow-hidden">
                            {bike.features.slice(0, 3).map((feature, i) => (
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
