import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { db, ServiceData } from '../api-services';
import { CAR_DESCRIPTIONS, DEFAULT_DESCRIPTION } from '../data/cars';
import { ArrowLeft } from 'lucide-react';
import { getCarImage } from '../utils/carImages';

// Modular Components
import { CarModelHeader } from '../components/services/car/CarModelHeader';
import { CarOfferCard } from '../components/services/car/CarOfferCard';
import { CarOfferModal } from '../components/services/car/CarOfferModal';

export const CarModelDetails: React.FC = () => {
    const { modelId } = useParams<{ modelId: string }>();
    const location = useLocation();
    const { brand, model, type: serviceType } = (location.state as { brand?: string; model?: string; type?: string }) || {};
    const { t } = useLanguage();
    const { convertPrice, formatPrice } = useCurrency();
    const navigate = useNavigate();
    const [selectedOffer, setSelectedOffer] = useState<ServiceData | null>(null);

    const [loading, setLoading] = useState(true);
    const [offers, setOffers] = useState<ServiceData[]>([]);
    const [groupInfo, setGroupInfo] = useState<any>(null);

    useEffect(() => {
        if (selectedOffer) {
            const handleEsc = (e: KeyboardEvent) => {
                if (e.key === 'Escape') setSelectedOffer(null);
            };
            window.addEventListener('keydown', handleEsc);
            return () => {
                window.removeEventListener('keydown', handleEsc);
            };
        }
    }, [selectedOffer]);

    useEffect(() => {
        const fetchOffers = async () => {
            try {
                const targetType = serviceType || 'car';
                const { data: services } = await db.getServices(targetType, 1, 1000);

                const filtered = services?.filter((s: any) => {
                    const sBrand = s.features?.brand || '';
                    const sModel = s.features?.model || '';
                    const slug = `${sBrand}-${sModel}`.toLowerCase();

                    if (modelId && slug === modelId) return true;
                    if (brand && model && sBrand.toLowerCase() === brand.toLowerCase() && sModel.toLowerCase() === model.toLowerCase()) return true;

                    return false;
                }) || [];

                setOffers(filtered);

                const constantService = filtered.length > 0 ? filtered[filtered.length - 1] : null;

                if (constantService) {
                    const brand = constantService.features.brand;
                    const model = constantService.features.model;

                    const serviceModel = await db.getServiceModel(targetType, brand, model);
                    const staticDescription = serviceModel?.description || CAR_DESCRIPTIONS[`${brand} ${model}`];
                    const staticImage = serviceModel?.image_url;

                    setGroupInfo({
                        ...constantService,
                        title: `${brand} ${model}`,
                        description: staticDescription || constantService.description || DEFAULT_DESCRIPTION,
                        image: getCarImage(brand, model, targetType, staticImage || constantService.images?.[0]),
                        features: [constantService.features.transmission, constantService.features.fuel, constantService.features.seats ? `${constantService.features.seats} Seats` : null].filter(Boolean)
                    });
                }
            } catch (error) {
                console.error("Failed to fetch offers", error);
            } finally {
                setLoading(false);
            }
        };

        fetchOffers();
    }, [modelId, brand, model, serviceType]);

    const handleBook = (offer: ServiceData) => {
        navigate(`/book-vehicle/${offer.service_ref || offer.id}`);
    };

    if (loading) return <div className="pt-32 text-center">Loading offers...</div>;
    if (!groupInfo) return <div className="pt-32 text-center">Model not found</div>;

    return (
        <div className="pt-24 pb-16 min-h-screen bg-slate-50 dark:bg-slate-900">
            <div className="max-w-7xl mx-auto px-4">
                <button onClick={() => navigate('/services/car-rental')} className="flex items-center gap-2 text-slate-500 hover:text-teal-600 dark:text-cyan-400 mb-8 transition-colors">
                    <ArrowLeft size={20} />
                    Back to Fleet
                </button>

                <CarModelHeader
                    image={groupInfo.image}
                    title={groupInfo.title}
                    description={groupInfo.description}
                    features={groupInfo.features}
                />

                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Available Offers ({offers.length})</h2>
                <div className="space-y-4">
                    {offers.map((offer) => (
                        <CarOfferCard
                            key={offer.id}
                            offer={offer}
                            onSelect={setSelectedOffer}
                            onBook={handleBook}
                            formatPrice={formatPrice}
                            convertPrice={convertPrice}
                        />
                    ))}
                </div>
            </div>

            {selectedOffer && (
                <CarOfferModal
                    offer={selectedOffer}
                    onClose={() => setSelectedOffer(null)}
                    onBook={handleBook}
                    formatPrice={formatPrice}
                    convertPrice={convertPrice}
                />
            )}
        </div>
    );
};
