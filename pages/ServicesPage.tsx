import React, { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { ServiceGrid } from '../components/services/ServiceGrid';
import { ServiceCard } from '../components/services/ServiceCard';
import { CategoryTabs } from '../components/services/CategoryTabs';
import { useServicePrices } from '../hooks/useServicePrices';
import { SERVICES_DATA } from '../data/services';
import { Filter, X } from 'lucide-react';

export const ServicesPage: React.FC = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const { category } = useParams<{ category: string }>();
    const [activeCategory, setActiveCategory] = useState(category || 'transport');
    const { minPrices } = useServicePrices();

    // Filter State
    const [showFilters, setShowFilters] = useState(false);
    const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: 1000 });
    const [searchQuery, setSearchQuery] = useState('');

    // Sync activeCategory with URL params
    React.useEffect(() => {
        if (category) {
            setActiveCategory(category);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            setActiveCategory('transport');
        }
    }, [category]);

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
        { id: 'creative', label: t('services.creative.title') },
        { id: 'connectivity', label: t('services.connectivity.title') },
    ];

    const [transportFilter, setTransportFilter] = useState<'all' | 'rental' | 'transfer'>('all');

    const filteredServices = useMemo(() => {
        return SERVICES_DATA.filter(service => {
            // 1. Category Filter
            if (activeCategory === 'transport' && service.category !== 'transport') return false;
            if (activeCategory !== 'transport' && service.category !== activeCategory) return false;

            // 1.1 Transport Sub-filter
            if (activeCategory === 'transport' && transportFilter !== 'all') {
                // @ts-ignore - subcategory depends on data update
                if (service.subcategory && service.subcategory !== transportFilter) return false;
                // Fallback for items without subcategory if any (though we updated data)
                if (!service.subcategory) return false;
            }

            // 2. Price Filter (if price exists)
            if (service.price !== undefined) {
                // Use dynamic minPrice if available for experiences
                let effectivePrice = service.price;
                if (service.category === 'experiences' && minPrices[service.id]) {
                    effectivePrice = minPrices[service.id];
                }

                if (effectivePrice < priceRange.min || effectivePrice > priceRange.max) return false;
            }

            // 3. Search Filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const title = t(service.title).toLowerCase();
                const desc = t(service.description).toLowerCase();
                if (!title.includes(query) && !desc.includes(query)) return false;
            }

            return true;
        });
    }, [activeCategory, priceRange, searchQuery, minPrices, t, transportFilter]);

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

                {/* Transport Sub-filters */}
                {activeCategory === 'transport' && (
                    <div className="flex justify-center mt-8 animate-in fade-in slide-in-from-top-4">
                        <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/50 backdrop-blur-sm">
                            {[
                                { id: 'all', label: 'All Transport' },
                                { id: 'rental', label: 'Rentals' },
                                { id: 'transfer', label: 'Transfers' }
                            ].map((filter) => (
                                <button
                                    key={filter.id}
                                    onClick={() => setTransportFilter(filter.id as any)}
                                    className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${transportFilter === filter.id
                                        ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm shadow-slate-200/50 dark:shadow-none translate-y-[-1px]'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50/50 dark:hover:bg-slate-700/30'
                                        }`}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Filters Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
                <div className="flex justify-end mb-4">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                        <Filter size={18} />
                        {showFilters ? 'Hide Filters' : 'Show Filters'}
                    </button>
                </div>

                {showFilters && (
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm animate-fade-down grid md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Search</label>
                            <input
                                type="text"
                                placeholder="Search services..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full p-2 rounded-lg border dark:bg-slate-900 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Min Price (€)</label>
                            <input
                                type="number"
                                value={priceRange.min}
                                onChange={(e) => setPriceRange({ ...priceRange, min: Number(e.target.value) })}
                                className="w-full p-2 rounded-lg border dark:bg-slate-900 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Max Price (€)</label>
                            <input
                                type="number"
                                value={priceRange.max}
                                onChange={(e) => setPriceRange({ ...priceRange, max: Number(e.target.value) })}
                                className="w-full p-2 rounded-lg border dark:bg-slate-900 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className="space-y-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <ServiceGrid id={activeCategory} title={categories.find(c => c.id === activeCategory)?.label || ''}>
                    {filteredServices.length > 0 ? (
                        filteredServices.map(service => {
                            // Determine price to show
                            let displayPrice = service.price;
                            if (service.category === 'experiences' && minPrices[service.id]) {
                                displayPrice = minPrices[service.id];
                            }

                            return (
                                <ServiceCard
                                    key={service.id}
                                    title={t(service.title)}
                                    description={t(service.description)}
                                    icon={service.icon}
                                    imageUrl={service.image}
                                    rawPrice={displayPrice}
                                    price={service.priceLabel}
                                    actionLabel={t(service.actionLabel || 'book_button')}
                                    onClick={() => navigate(service.route)}
                                />
                            );
                        })
                    ) : (
                        <div className="col-span-full text-center py-12 text-slate-500 dark:text-slate-400">
                            No services found matching your criteria.
                        </div>
                    )}
                </ServiceGrid>
            </div>
        </div>
    );
};

