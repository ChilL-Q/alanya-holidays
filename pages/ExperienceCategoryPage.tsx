import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Check, ChevronRight, Compass, Sun, Map, Cloud, Anchor, Mountain, Heart, Car } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { db, ServiceData } from '../services/db';

export const ExperienceCategoryPage: React.FC = () => {
    const { category } = useParams<{ category: string }>();
    const { t } = useLanguage();
    const { convertPrice, formatPrice } = useCurrency();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [services, setServices] = useState<ServiceData[]>([]);

    // Configuration for each category
    const categoryConfig: Record<string, {
        title: string;
        subtitle: string;
        heroImage: string;
        features: string[];
        icon: any;
    }> = {
        water: {
            title: t('services.adventure.water'),
            subtitle: t('services.adventure.water_desc'),
            heroImage: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=2940&auto=format&fit=crop',
            features: ['Professional Guides', 'Safety Gear Included', 'Hotel Pickup'],
            icon: Anchor
        },
        safari: {
            title: t('services.adventure.safari'),
            subtitle: t('services.adventure.safari_desc'),
            heroImage: 'https://images.unsplash.com/photo-1533669955142-6a73332af4db?q=80&w=2912&auto=format&fit=crop', // Jeep/Offroad
            features: ['Off-road Adventure', 'Lunch Included', 'Photo Stops'],
            icon: Map
        },
        air: {
            title: t('services.adventure.air'),
            subtitle: t('services.adventure.air_desc'),
            heroImage: 'https://images.unsplash.com/photo-1474302770737-173ee21bab86?q=80&w=2692&auto=format&fit=crop', // Paragliding
            features: ['Certified Pilots', 'HD Video Available', 'Insurance Included'],
            icon: Cloud
        },
        land: {
            title: t('services.adventure.land'),
            subtitle: t('services.adventure.land_desc'),
            heroImage: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?q=80&w=2940&auto=format&fit=crop', // Canyon/Ruins
            features: ['Cultural Sites', 'Expert Guide', 'Comfortable Transport'],
            icon: Mountain
        },
        wellness: {
            title: t('services.health.title'),
            subtitle: t('services.health.subtitle'),
            heroImage: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=2940&auto=format&fit=crop', // Spa
            features: ['Certified Specialists', 'Relaxing Atmosphere', 'Premium Products'],
            icon: Heart
        },
        atv: {
            title: "ATV & Buggy",
            subtitle: "Adrenaline-filled off-road adventures",
            heroImage: 'https://images.unsplash.com/photo-1599401763784-5f53d2d603a1?q=80&w=2940&auto=format&fit=crop', // ATV
            features: ['Hourly Rentals', 'Safety Briefing', 'Helmet Included'],
            icon: Car
        }
    };

    const config = category ? categoryConfig[category] : null;

    useEffect(() => {
        const fetchServices = async () => {
            if (!category) return;
            try {
                // Fetch all tours and filter by subcategory
                // Ideally backend would support filtering by subcategory directly
                const { data } = await db.getServices('tour', 1, 100);
                if (data) {
                    // Filter locally for now effectively
                    const filtered = data.filter(s => s.features?.subcategory === category);
                    setServices(filtered);
                }
            } catch (err) {
                console.error('Failed to fetch services', err);
            } finally {
                setLoading(false);
            }
        };

        fetchServices();
        window.scrollTo(0, 0);
    }, [category]);

    if (!config) {
        return (
            <div className="pt-32 pb-16 min-h-screen text-center">
                <h1 className="text-2xl font-bold">Category not found</h1>
                <button onClick={() => navigate('/services')} className="mt-4 text-teal-600 hover:underline">
                    Back to Services
                </button>
            </div>
        );
    }

    return (
        <div className="pt-24 pb-16 min-h-screen bg-slate-50 dark:bg-slate-900">
            {/* Hero Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg text-teal-600 dark:text-teal-400">
                                <config.icon size={24} />
                            </div>
                            <span className="text-sm font-bold text-teal-600 tracking-wider uppercase">{t('footer.experiences')}</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-serif text-slate-900 dark:text-white mb-6 leading-tight">
                            {config.title}
                        </h1>

                        <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                            {config.subtitle}
                        </p>

                        <div className="flex flex-wrap gap-4 mb-10">
                            {config.features.map((feature, idx) => (
                                <div key={idx} className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-full shadow-sm text-sm font-medium text-slate-700 dark:text-slate-300">
                                    <Check size={16} className="text-teal-500" />
                                    {feature}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative">
                        <div className="absolute -inset-4 bg-teal-100 dark:bg-teal-900/30 rounded-full blur-3xl opacity-50"></div>
                        <img
                            src={config.heroImage}
                            alt={config.title}
                            className="relative rounded-3xl shadow-2xl transform rotate-2 hover:rotate-0 transition-transform duration-500 w-full object-cover max-h-[500px]"
                        />
                    </div>
                </div>
            </div>

            {/* Services Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-3xl font-serif text-slate-900 dark:text-white mb-8">Available Packages</h2>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 min-h-[400px]">
                        <div className="w-12 h-12 border-4 border-slate-200 border-t-teal-600 rounded-full animate-spin mb-4"></div>
                        <p className="text-slate-400 text-sm animate-pulse">Finding adventures...</p>
                    </div>
                ) : services.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
                        {services.map((service) => (
                            <div
                                key={service.id}
                                className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50 transition-all duration-300 border border-slate-100 dark:border-slate-800 group flex flex-col h-full hover:-translate-y-1 cursor-pointer"
                                onClick={() => navigate(`/book-tour/${service.id}`)} // Assuming book booking page for tours
                            >
                                <div className="aspect-[3/2] relative overflow-hidden bg-slate-100 dark:bg-slate-800">
                                    <img
                                        src={service.images?.[0] || 'https://images.unsplash.com/photo-1544521750-97f9ff30eb9c?q=80&w=2692&auto=format&fit=crop'}
                                        alt={service.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300" />

                                    <div className="absolute top-3 right-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-slate-800 dark:text-white shadow-sm flex items-center gap-1">
                                        <Sun size={10} className="text-orange-500" />
                                        {service.features?.duration ? `${service.features.duration}h` : 'Half Day'}
                                    </div>
                                </div>

                                <div className="p-5 flex flex-col flex-grow">
                                    {(service.provider?.company_name || service.provider?.full_name) && (
                                        <p className="text-xs text-teal-600 dark:text-teal-400 font-bold uppercase tracking-wider mb-1">
                                            {service.provider.company_name || service.provider.full_name}
                                        </p>
                                    )}
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight mb-2 group-hover:text-teal-600 transition-colors">
                                        {service.title}
                                    </h3>
                                    <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-2 mb-4 flex-grow leading-relaxed">
                                        {service.description}
                                    </p>

                                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-slate-400 font-medium">From</span>
                                            <span className="text-lg font-bold text-slate-900 dark:text-white">
                                                {formatPrice(convertPrice(service.price, 'EUR'))}
                                            </span>
                                        </div>
                                        <button className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-bold text-sm hover:opacity-90 transition-all active:scale-95">
                                            Book Now
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                        <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300 shadow-sm">
                            <Compass size={32} />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No adventures found</h3>
                        <p className="text-slate-500 max-w-sm mx-auto">
                            We currently don't have any listings in this category. Check back soon!
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
