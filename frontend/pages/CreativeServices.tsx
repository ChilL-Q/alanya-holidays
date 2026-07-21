import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Check, Camera, Video, Sparkles, Compass } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { ServiceData, servicesService } from '../api-services';
import { SEOHead } from '../components/seo/SEOHead';

export const CreativeServices: React.FC = () => {
    const { subcategory } = useParams<{ subcategory: string }>();
    const { t } = useLanguage();
    const { convertPrice, formatPrice } = useCurrency();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [services, setServices] = useState<ServiceData[]>([]);

    const config: Record<string, {
        title: string;
        subtitle: string;
        heroImage: string;
        features: string[];
        icon: React.ElementType;
    }> = {
        photographer: {
            title: t('services.creative.photo'),
            subtitle: t('services.creative.photo_desc'),
            heroImage: 'https://images.unsplash.com/photo-1554048612-b6a482bc67e5?auto=format&fit=crop&q=80',
            features: ['High-res Editing', 'All Originals Included', 'Alanya Hidden Gems'],
            icon: Camera
        },
        videographer: {
            title: t('services.creative.video'),
            subtitle: t('services.creative.video_desc'),
            heroImage: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80',
            features: ['Drone 4K Footage', 'Cinematic Editing', 'Sound Design'],
            icon: Video
        },
        content_creator: {
            title: t('services.creative.content'),
            subtitle: t('services.creative.content_desc'),
            heroImage: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&q=80',
            features: ['Reels & TikTok Ready', 'Fast Delivery', 'Viral Aesthetics'],
            icon: Sparkles
        }
    };

    const currentConfig = subcategory ? config[subcategory] : null;

    useEffect(() => {
        const fetchServices = async () => {
            if (!subcategory) return;
            try {
                const { data } = await servicesService.getServices('creative', 1, 100);
                if (data) {
                    const filtered = data.filter(s => s.features?.subcategory === subcategory);
                    setServices(filtered);
                }
            } catch (err) {
                console.error('Failed to fetch creative services', err);
            } finally {
                setLoading(false);
            }
        };

        fetchServices();
        window.scrollTo(0, 0);
    }, [subcategory]);

    if (!currentConfig) {
        return (
            <div className="pt-32 pb-16 min-h-screen text-center">
                <h1 className="text-2xl font-bold">Category not found</h1>
                <button onClick={() => navigate('/services')} className="mt-4 text-teal-600 dark:text-cyan-400 hover:underline">
                    Back to Services
                </button>
            </div>
        );
    }

    return (
        <>
        <SEOHead
            title="Creative Professionals in Alanya | Alanya Holidays"
            description="Find photographers, designers, and creative professionals in Alanya. Professional services for your holiday needs."
            keywords={['creative professionals alanya', 'photographer alanya', 'alanya design services']}
        />
        <div className="pt-24 pb-16 min-h-screen bg-slate-50 dark:bg-slate-900">
            {/* Hero Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 bg-purple-100 dark:bg-slate-800/50 rounded-lg text-purple-600 dark:text-slate-200">
                                <currentConfig.icon size={24} />
                            </div>
                            <span className="text-sm font-bold text-purple-600 tracking-wider uppercase">{t('add_service.cat.creative')}</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-serif text-slate-900 dark:text-white mb-6 leading-tight">
                            {currentConfig.title}
                        </h1>

                        <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                            {currentConfig.subtitle}
                        </p>

                        <div className="flex flex-wrap gap-4 mb-10">
                            {currentConfig.features.map((feature, idx) => (
                                <div key={idx} className="flex items-center gap-2 bg-white dark:bg-slate-800/80 px-4 py-2 rounded-full shadow-sm text-sm font-medium text-slate-700 dark:text-slate-300">
                                    <Check size={16} className="text-teal-500 dark:text-cyan-400 " />
                                    {feature}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative">
                        <div className="absolute -inset-4 bg-purple-100 dark:bg-slate-800/50 rounded-full blur-3xl opacity-50"></div>
                        <img
                            src={currentConfig.heroImage}
                            alt={currentConfig.title}
                            className="relative rounded-3xl shadow-2xl transform rotate-2 hover:rotate-0 transition-transform duration-500 w-full aspect-[4/3] object-cover"
                        />
                    </div>
                </div>
            </div>

            {/* Services Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-3xl font-serif text-slate-900 dark:text-white">Creative Professionals</h2>
                    <p className="text-slate-500 text-sm">{services.length} professionals found</p>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 min-h-[400px]">
                        <div className="w-12 h-12 border-4 border-slate-200 border-t-purple-600 rounded-full animate-spin mb-4"></div>
                        <p className="text-slate-400 text-sm animate-pulse">Scanning portfolio...</p>
                    </div>
                ) : services.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {services.map((service) => (
                            <div
                                key={service.id}
                                className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50 transition-all duration-300 border border-slate-100 dark:border-slate-800/50 group flex flex-col h-full hover:-translate-y-1 cursor-pointer"
                                onClick={() => navigate(`/contact?service=${service.id}`)}
                            >
                                <div className="aspect-[3/2] relative overflow-hidden bg-slate-100 dark:bg-slate-800/80">
                                    <img
                                        src={service.images?.[0] || currentConfig.heroImage}
                                        alt={service.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300" />
                                </div>

                                <div className="p-5 flex flex-col flex-grow">
                                    {(service.provider?.full_name || service.provider?.company_name) && (
                                        <p className="text-xs text-purple-600 dark:text-slate-200 font-bold uppercase tracking-wider mb-1">
                                            {service.provider.company_name || service.provider.full_name}
                                        </p>
                                    )}
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight mb-2 group-hover:text-purple-600 transition-colors">
                                        {service.title}
                                    </h3>
                                    <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-2 mb-4 flex-grow leading-relaxed">
                                        {service.description}
                                    </p>

                                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100 dark:border-slate-800/50">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-slate-400 font-medium">Starting from</span>
                                            <span className="text-lg font-bold text-slate-900 dark:text-white">
                                                {formatPrice(convertPrice(service.price, 'EUR'))}
                                            </span>
                                        </div>
                                        <button className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-white rounded-lg font-bold text-sm hover:opacity-90 transition-all active:scale-95">
                                            Book Now
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/80 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800/50">
                        <div className="w-16 h-16 bg-white dark:bg-slate-800/80 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300 shadow-sm">
                            <Compass size={32} />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No professionals found</h3>
                        <p className="text-slate-500 max-w-sm mx-auto">
                            We currently don't have any professionals listed for this category. Check back soon!
                        </p>
                    </div>
                )}
            </div>
        </div>
        </>
    );
};
