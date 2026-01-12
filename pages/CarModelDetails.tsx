import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { db } from '../services/db';
import { useAuth } from '../context/AuthContext';
import { Check, Star, Shield, Fuel, Zap, ArrowLeft, MessageCircle } from 'lucide-react';

interface CarOffer {
    id: string;
    title: string;
    price: number;
    provider_id: string;
    provider: {
        full_name: string;
    };
    features: any;
    images: string[];
}

// Assuming ServiceData is similar to CarOffer but more generic
interface ServiceData {
    id: string;
    title: string;
    price: number;
    provider_id: string;
    provider: {
        full_name: string;
    };
    features: any; // This will contain brand, model, transmission, fuel, seats etc.
    images: string[];
    description?: string;
}

export const CarModelDetails: React.FC = () => {
    const { modelId } = useParams<{ modelId: string }>();
    const location = useLocation();
    const { brand, model, type: serviceType } = (location.state as { brand?: string; model?: string; type?: string }) || {}; // Expect type from state if provided
    const { t } = useLanguage();
    const { convertPrice, formatPrice } = useCurrency();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [offers, setOffers] = useState<ServiceData[]>([]);
    const [groupInfo, setGroupInfo] = useState<any>(null);

    useEffect(() => {
        const fetchOffers = async () => {
            try {
                // If type is explicitly passed (e.g. 'bike'), use it. Otherwise default to 'car'.
                const targetType = serviceType || 'car';
                const services = await db.getServices(targetType);

                // Filter by modelId (slug) or direct brand/model match
                // Slug generation logic: `${brand}-${model}`.toLowerCase()

                const filtered = services?.filter((s: any) => {
                    const sBrand = s.features?.brand || '';
                    const sModel = s.features?.model || '';
                    const slug = `${sBrand}-${sModel}`.toLowerCase();

                    if (modelId && slug === modelId) return true;
                    if (brand && model && sBrand.toLowerCase() === brand.toLowerCase() && sModel.toLowerCase() === model.toLowerCase()) return true;

                    return false;
                }) || [];

                setOffers(filtered);

                if (filtered.length > 0) {
                    const first = filtered[0];
                    setGroupInfo({
                        title: `${first.features.brand} ${first.features.model}`,
                        description: first.description,
                        image: first.images?.[0] || 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=2940&auto=format&fit=crop', // Fallback
                        features: [first.features.transmission, first.features.fuel, first.features.seats ? `${first.features.seats} Seats` : null].filter(Boolean)
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

    if (loading) return <div className="pt-32 text-center">Loading offers...</div>;
    if (!groupInfo) return <div className="pt-32 text-center">Model not found</div>;

    return (
        <div className="pt-24 pb-16 min-h-screen bg-slate-50 dark:bg-slate-900">
            <div className="max-w-7xl mx-auto px-4">
                <button onClick={() => navigate('/services/car-rental')} className="flex items-center gap-2 text-slate-500 hover:text-teal-600 mb-8 transition-colors">
                    <ArrowLeft size={20} />
                    Back to Fleet
                </button>

                {/* Model Header */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 mb-12 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row gap-8 items-center">
                    <div className="w-full md:w-1/2">
                        <img
                            src={groupInfo.image}
                            alt={groupInfo.title}
                            className="w-full rounded-2xl shadow-md object-cover h-64 md:h-auto"
                        />
                    </div>
                    <div className="w-full md:w-1/2">
                        <h1 className="text-4xl font-serif font-bold text-slate-900 dark:text-white mb-4">{groupInfo.title}</h1>
                        <div className="flex flex-wrap gap-3 mb-6">
                            {groupInfo.features.map((f: string, i: number) => (
                                <span key={i} className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full text-sm font-medium capitalize">
                                    {f}
                                </span>
                            ))}
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-lg mb-6">
                            {groupInfo.description || "Verified listings from top rated providers in Alanya. Compare prices and book directly."}
                        </p>
                    </div>
                </div>

                {/* Offers List */}
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Available Offers ({offers.length})</h2>
                <div className="space-y-4">
                    {offers.map((offer) => (
                        <div key={offer.id} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row items-center justify-between gap-6 transition-transform hover:scale-[1.01]">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center text-teal-600 font-bold text-xl">
                                    {offer.provider?.full_name?.charAt(0) || 'P'}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">{offer.provider?.full_name || 'Verified Provider'}</h3>
                                    <div className="flex items-center gap-1 text-yellow-500 text-sm">
                                        <Star size={14} fill="currentColor" />
                                        <span>5.0</span>
                                        <span className="text-slate-400 ml-1">(New)</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 md:px-8">
                                <div className="grid grid-cols-2 gap-4 text-sm text-slate-600 dark:text-slate-400">
                                    <div className="flex items-center gap-2">
                                        <Check size={16} className="text-green-500" />
                                        <span>Instant Confirmation</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Check size={16} className="text-green-500" />
                                        <span>Free Cancellation</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-teal-600">{formatPrice(convertPrice(offer.price, 'EUR'))}</div>
                                    <div className="text-xs text-slate-500">per day</div>
                                </div>
                                <button className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity">
                                    Book Now
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
