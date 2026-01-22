import React, { useState } from 'react';
import { Car, Anchor, Heart, Stethoscope, ShoppingBag, Cloud, Mountain } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { ServiceGrid } from '../components/services/ServiceGrid';
import { ServiceCard } from '../components/services/ServiceCard';
import { CategoryTabs } from '../components/services/CategoryTabs';



import { db } from '../services/db';

export const ServicesPage: React.FC = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const { category } = useParams<{ category: string }>();
    const [activeCategory, setActiveCategory] = useState(category || 'transport');
    const [minPrices, setMinPrices] = useState<Record<string, number>>({});

    // Sync activeCategory with URL params
    React.useEffect(() => {
        if (category) {
            setActiveCategory(category);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            setActiveCategory('transport');
        }
    }, [category]);

    // Fetch minimum prices for categories
    React.useEffect(() => {
        const fetchPrices = async () => {
            try {
                // Fetch tours to calculate min prices for experiences
                const { data } = await db.getServices('tour', 1, 100);
                if (data) {
                    const prices: Record<string, number> = {};
                    const subcategories = ['water', 'safari', 'air', 'land', 'atv'];

                    subcategories.forEach(sub => {
                        const servicesInSub = data.filter(s => s.features?.subcategory === sub && s.type === 'tour');
                        if (servicesInSub.length > 0) {
                            const minPrice = Math.min(...servicesInSub.map(s => s.price));
                            prices[sub] = minPrice;
                        }
                    });
                    setMinPrices(prices);
                }
            } catch (err) {
                console.error('Failed to fetch prices', err);
                // @ts-ignore
                if (err?.message) console.error('Error details:', err.message);
            }
        };
        fetchPrices();
    }, []);

    // Update URL when category changes
    const handleCategorySelect = (id: string) => {
        setActiveCategory(id);
        navigate(id === 'transport' ? '/services' : `/services/${id}`);
    };

    const categories = [
        { id: 'transport', label: t('services.transport.title') },
        { id: 'experiences', label: t('footer.experiences') },
        { id: 'health', label: t('services.health.title') },
        { id: 'visa', label: t('services.visa.title') },
        { id: 'connectivity', label: t('services.connectivity.title') },
    ];

    return (
        <div className="bg-slate-50 dark:bg-slate-950 min-h-screen pb-20 pt-24">
            <div className="max-w-7xl mx-auto px-4 mb-8 text-center">
                <h1 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 dark:text-white mb-6">{t('services.hero.title')}</h1>
                <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-8">{t('services.hero.subtitle')}</p>

                <CategoryTabs
                    categories={categories}
                    activeCategory={activeCategory}
                    onSelect={handleCategorySelect}
                />
            </div>

            <div className="space-y-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {activeCategory === 'transport' && (
                    <ServiceGrid id="cars" title={t('services.transport.title')}>
                        <ServiceCard
                            title={t('services.transport.car')}
                            description={t('services.transport.car_desc')}
                            icon={Car}
                            rawPrice={25}
                            price="/day"
                            actionLabel={t('book_button')}
                            onClick={() => navigate('/services/car-rental')}
                        />
                        <ServiceCard
                            title={t('services.transport.bike')}
                            description={t('services.transport.bike_desc')}
                            icon={Car}
                            rawPrice={10}
                            price="/day"
                            actionLabel={t('book_button')}
                            onClick={() => navigate('/services/bike-rental')}
                        />
                    </ServiceGrid>
                )}


                {activeCategory === 'experiences' && (
                    <ServiceGrid id="experiences" title={t('footer.experiences')}>
                        <ServiceCard
                            title={t('services.adventure.land')}
                            description={t('services.adventure.land_desc')}
                            icon={Mountain}
                            rawPrice={minPrices['land'] || 30}
                            actionLabel={t('book_button')}
                            onClick={() => navigate('/experiences/land')}
                        />
                        <ServiceCard
                            title={t('services.adventure.water')}
                            description={t('services.adventure.water_desc')}
                            icon={Anchor}
                            rawPrice={minPrices['water'] || 50}
                            actionLabel={t('book_button')}
                            onClick={() => navigate('/experiences/water')}
                        />
                        <ServiceCard
                            title={t('services.adventure.safari')}
                            description={t('services.adventure.safari_desc')}
                            icon={Car}
                            rawPrice={minPrices['safari'] || 35}
                            actionLabel={t('book_button')}
                            onClick={() => navigate('/experiences/safari')}
                        />
                        <ServiceCard
                            title="ATV & Buggy"
                            description="Hourly rentals for off-road fun"
                            icon={Car}
                            rawPrice={minPrices['atv'] || 45}
                            actionLabel={t('book_button')}
                            onClick={() => navigate('/experiences/atv')}
                        />
                        <ServiceCard
                            title={t('services.adventure.air')}
                            description={t('services.adventure.air_desc')}
                            icon={Cloud}
                            rawPrice={minPrices['air'] || 80}
                            actionLabel={t('book_button')}
                            onClick={() => navigate('/experiences/air')}
                        />
                    </ServiceGrid>
                )}

                {activeCategory === 'visa' && (
                    <ServiceGrid id="visa" title={t('services.visa.title')}>
                        <ServiceCard
                            title={t('services.visa.tourist')}
                            description={t('services.visa.tourist_desc')}
                            icon={Anchor}
                            rawPrice={50}
                            actionLabel="Consult"
                            onClick={() => navigate('/contact')}
                        />
                        <ServiceCard
                            title={t('services.visa.residence')}
                            description={t('services.visa.residence_desc')}
                            icon={Anchor}
                            rawPrice={250}
                            actionLabel="Consult"
                            onClick={() => navigate('/contact')}
                        />
                    </ServiceGrid>
                )}

                {activeCategory === 'connectivity' && (
                    <ServiceGrid id="sim" title={t('services.connectivity.title')}>
                        <ServiceCard
                            title={t('services.connectivity.esim')}
                            description={t('services.connectivity.esim_desc')}
                            icon={Anchor}
                            rawPrice={15}
                            actionLabel="Buy Now"
                            onClick={() => navigate('/services/esim')}
                        />
                    </ServiceGrid>
                )}

                {activeCategory === 'health' && (
                    <ServiceGrid id="health" title={t('services.health.title')}>
                        <ServiceCard
                            title={t('services.health.spa')}
                            description={t('services.health.spa_desc')}
                            icon={Heart}
                            rawPrice={40}
                            actionLabel={t('book_button')}
                            onClick={() => navigate('/experiences')}
                        />
                        <ServiceCard
                            title={t('services.health.dental')}
                            description={t('services.health.dental_desc')}
                            icon={Stethoscope}
                            actionLabel={t('consult_button')}
                            onClick={() => navigate('/contact')}
                        />
                        <ServiceCard
                            title={t('services.health.hair')}
                            description={t('services.health.hair_desc')}
                            icon={Heart}
                            actionLabel={t('consult_button')}
                            onClick={() => navigate('/contact')}
                        />
                        <ServiceCard
                            title={t('services.health.cosmetic')}
                            description={t('services.health.cosmetic_desc')}
                            icon={Heart}
                            actionLabel={t('consult_button')}
                            onClick={() => navigate('/contact')}
                        />
                        <ServiceCard
                            title={t('services.health.cave')}
                            description={t('services.health.cave_desc')}
                            icon={Heart}
                            rawPrice={10}
                            actionLabel={t('book_button')}
                            onClick={() => navigate('/contact')}
                        />
                    </ServiceGrid>
                )}
            </div>
        </div>
    );
};
