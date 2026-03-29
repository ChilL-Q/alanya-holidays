import React from 'react';
import { VehicleRentalTemplate } from '../components/templates/VehicleRentalTemplate';
import { useLanguage } from '../context/LanguageContext';
import { useCars } from '../hooks/useCars';
import { CarCard } from '../components/services/CarCard';

export const CarRental: React.FC = () => {
    const { t } = useLanguage();
    const { carGroups, loading } = useCars();

    return (
        <VehicleRentalTemplate
            titleHtml={t('car.hero.title')}
            subtitle={t('car.hero.subtitle')}
            features={[t('car.features.delivery'), t('car.features.deposit'), t('car.features.support')]}
            heroImage="/images/transportation/cars/Rent-a-Car-Services-page.jpg"
            heroAlt="Luxury Car Rental"
            heroImageRotate="rotate-2"
            popularTitle={t('car.popular')}
            loading={loading}
            loadingMessage="Loading fleet..."
            isEmpty={!loading && carGroups.length === 0}
        >
            {carGroups.map((car) => (
                <CarCard key={car.id} car={car} />
            ))}
        </VehicleRentalTemplate>
    );
};

