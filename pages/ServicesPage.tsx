import React, { useState } from 'react';
import { Car, Anchor, Heart, Stethoscope, ShoppingBag } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { ServiceGrid } from '../components/services/ServiceGrid';
import { ServiceCard } from '../components/services/ServiceCard';
import { CategoryTabs } from '../components/services/CategoryTabs';

export const ServicesPage: React.FC = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const categoryParam = searchParams.get('category');
    const [activeCategory, setActiveCategory] = useState(categoryParam || 'transport');

    // Sync activeCategory with URL params
    React.useEffect(() => {
        if (categoryParam) {
            setActiveCategory(categoryParam);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [categoryParam]);

    // Update URL when category changes
    const handleCategorySelect = (category: string) => {
        setActiveCategory(category);
        setSearchParams({ category });
    };

    const categories = [
        { id: 'transport', label: t('services.transport.title') },
        { id: 'adventure', label: t('services.adventure.title') },
        { id: 'health', label: t('services.health.title') },
        { id: 'visa', label: t('services.visa.title') },
        { id: 'connectivity', label: t('services.connectivity.title') },
    ];

    return (
        <div className="bg-slate-50 min-h-screen pb-20 pt-24">
            <div className="max-w-7xl mx-auto px-4 mb-8 text-center">
                <h1 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 mb-6">{t('services.hero.title')}</h1>
                <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-8">{t('services.hero.subtitle')}</p>

                <CategoryTabs
                    categories={categories}
                    activeCategory={activeCategory}
                    onSelect={setActiveCategory}
                />
            </div>

            <div className="space-y-12">
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

                {activeCategory === 'adventure' && (
                    <ServiceGrid id="tours" title={t('services.adventure.title')}>
                        <ServiceCard
                            title={t('services.adventure.water')}
                            description={t('services.adventure.water_desc')}
                            icon={Anchor}
                            rawPrice={50}
                            actionLabel={t('book_button')}
                            onClick={() => navigate('/experiences')}
                        />
                        <ServiceCard
                            title={t('services.adventure.tours')}
                            description={t('services.adventure.tours_desc')}
                            icon={Anchor}
                            rawPrice={35}
                            actionLabel={t('book_button')}
                            onClick={() => navigate('/experiences')}
                        />
                        <ServiceCard
                            title={t('services.adventure.bikes')}
                            description={t('services.adventure.bikes_desc')}
                            icon={Car}
                            rawPrice={15}
                            price="/day"
                            actionLabel={t('book_button')}
                            onClick={() => navigate('/services/bike-rental')}
                        />
                        <ServiceCard
                            title={t('services.adventure.ebikes')}
                            description={t('services.adventure.ebikes_desc')}
                            icon={Car}
                            rawPrice={25}
                            price="/day"
                            actionLabel={t('book_button')}
                            onClick={() => navigate('/services/bike-rental')}
                        />
                        <ServiceCard
                            title={t('services.adventure.atv')}
                            description={t('services.adventure.atv_desc')}
                            icon={Car}
                            rawPrice={45}
                            actionLabel={t('book_button')}
                            onClick={() => navigate('/experiences')}
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
                            actionLabel="Apply"
                            onClick={() => navigate('/services/visa')}
                        />
                        <ServiceCard
                            title={t('services.visa.residence')}
                            description={t('services.visa.residence_desc')}
                            icon={Anchor}
                            actionLabel="Consult"
                            onClick={() => navigate('/services/visa')}
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
