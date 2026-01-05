import React from 'react';
import { Car, Anchor, Heart, Stethoscope, ShoppingBag } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { ServiceGrid } from '../components/services/ServiceGrid';
import { ServiceCard } from '../components/services/ServiceCard';

export const ServicesPage: React.FC = () => {
    const { t } = useLanguage();

    const sections = [
        {
            title: t('services.transport.title'),
            subtitle: t('services.transport.subtitle'),
            items: [
                { title: t('services.transport.car'), description: t('services.transport.car_desc'), icon: Car, price: '€25/day' },
                { title: t('services.transport.bike'), description: t('services.transport.bike_desc'), icon: Car, price: '€10/day' } // Using Car as placeholder if Bike unavailable in quick import
            ]
        },
        {
            title: t('services.adventure.title'),
            subtitle: t('services.adventure.subtitle'),
            items: [
                { title: t('services.adventure.water'), description: t('services.adventure.water_desc'), icon: Anchor, price: '€50' },
                { title: t('services.adventure.tours'), description: t('services.adventure.tours_desc'), icon: Anchor, price: '€35' }
            ]
        },
        {
            title: t('services.health.title'),
            subtitle: t('services.health.subtitle'),
            items: [
                { title: t('services.health.spa'), description: t('services.health.spa_desc'), icon: Heart, price: '€40' },
                { title: t('services.health.dental'), description: t('services.health.dental_desc'), icon: Stethoscope, action: 'Consultation' }
            ]
        }
    ];

    return (
        <div className="bg-slate-50 min-h-screen pb-20 pt-24">
            <div className="max-w-7xl mx-auto px-4 mb-12 text-center">
                <h1 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 mb-6">{t('services.hero.title')}</h1>
                <p className="text-xl text-slate-600 max-w-2xl mx-auto">{t('services.hero.subtitle')}</p>
            </div>

            <div className="space-y-12">
                <ServiceGrid title={t('services.transport.title')}>
                    <ServiceCard
                        title={t('services.transport.car')}
                        description={t('services.transport.car_desc')}
                        icon={Car}
                        price="€25/day"
                        actionLabel={t('book_button')}
                    />
                    <ServiceCard
                        title={t('services.transport.bike')}
                        description={t('services.transport.bike_desc')}
                        icon={Car}
                        price="€10/day"
                        actionLabel={t('book_button')}
                    />
                </ServiceGrid>

                <ServiceGrid title={t('services.adventure.title')}>
                    <ServiceCard
                        title={t('services.adventure.water')}
                        description={t('services.adventure.water_desc')}
                        icon={Anchor}
                        price="€50"
                        actionLabel={t('book_button')}
                    />
                    <ServiceCard
                        title={t('services.adventure.tours')}
                        description={t('services.adventure.tours_desc')}
                        icon={Anchor}
                        price="€35"
                        actionLabel={t('book_button')}
                    />
                </ServiceGrid>

                <ServiceGrid title={t('services.health.title')}>
                    <ServiceCard
                        title={t('services.health.spa')}
                        description={t('services.health.spa_desc')}
                        icon={Heart}
                        price="€40"
                        actionLabel={t('book_button')}
                    />
                    <ServiceCard
                        title={t('services.health.dental')}
                        description={t('services.health.dental_desc')}
                        icon={Stethoscope}
                        actionLabel={t('consult_button')}
                    />
                    <ServiceCard
                        title={t('services.shopping.artisan')}
                        description={t('services.shopping.artisan_desc')}
                        icon={ShoppingBag}
                        actionLabel={t('view_shop')}
                    />
                </ServiceGrid>
            </div>
        </div>
    );
};
