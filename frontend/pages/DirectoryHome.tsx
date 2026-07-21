import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, MapPin, Grid, Briefcase, ChevronRight, ChevronDown, Sparkles, ShieldCheck, CheckCircle2, Building2, Star } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import { toast } from 'react-hot-toast';
import { SEOHead } from '../components/seo/SEOHead';
import { cn } from '../utils/cn';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../components/ui/dropdown-menu';
import { db } from '../api-services';
import { DirectoryListingDB } from '../types/models';
import { PremiumListingsSection } from '../components/home/PremiumListingsSection';
import { FreeListingsSection } from '../components/home/FreeListingsSection';
import { SignatureListingsSection } from '../components/home/SignatureListingsSection';
import { TravelGuideSection } from '../components/home/TravelGuideSection';
import { RecentlyClaimedSection } from '../components/home/RecentlyClaimedSection';

export const DirectoryHome: React.FC = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const { openLogin } = useModal();
    const [searchQuery, setSearchQuery] = useState('');
    const [location, setLocation] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');


    const handleSearch = () => {
        const params = new URLSearchParams();
        if (searchQuery.trim()) params.set('q', searchQuery.trim());
        if (selectedCategory) params.set('category', selectedCategory);
        if (location) params.set('location', location);
        navigate(`/search?${params.toString()}`);
    };

    // Landing page listings
    const [premiumListings, setPremiumListings] = useState<DirectoryListingDB[]>([]);
    const [freeListings, setFreeListings] = useState<DirectoryListingDB[]>([]);
    const [signatureListings, setSignatureListings] = useState<DirectoryListingDB[]>([]);
    const [recentlyClaimedListings, setRecentlyClaimedListings] = useState<DirectoryListingDB[]>([]);
    const [testimonials, setTestimonials] = useState<any[]>([]);
    const [dbLocations, setDbLocations] = useState<string[]>([]);
    const [listingsLoading, setListingsLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        async function loadListings() {
            setListingsLoading(true);
            try {
                const [premium, free, signatures, recentlyClaimed, tests, locs] = await Promise.all([
                    db.getPremiumListings(),
                    db.getFreeListings(),
                    db.getSignatureListings(),
                    db.getRecentlyClaimedListings(6),
                    db.getPublicTestimonials(),
                    db.getLocations(),
                ]);
                if (!cancelled) {
                    setPremiumListings(premium);
                    setFreeListings(free);
                    setSignatureListings(signatures);
                    setRecentlyClaimedListings(recentlyClaimed);
                    setTestimonials(tests);
                    setDbLocations(locs.map(l => l.name));
                }
            } catch (err) {
                console.error('Failed to load landing listings:', err);
                toast.error('Failed to load data. Please try refreshing the page.');
            } finally {
                if (!cancelled) setListingsLoading(false);
            }
        }
        loadListings();
        return () => { cancelled = true; };
    }, []);

    const categories = [
        { id: 'medical', imagePath: '/images/categories/placeholder.jpg', title: t('dir.cat.medical'), path: '/medical-tourism-alanya' },
        { id: 'accommodations', imagePath: '/images/categories/placeholder.jpg', title: t('dir.cat.accommodations'), path: '/alanya-hotels' },
        { id: 'tours', imagePath: '/images/categories/placeholder.jpg', title: t('dir.cat.tours'), path: '/things-to-do-in-alanya' },
        { id: 'transport', imagePath: '/images/categories/placeholder.jpg', title: t('dir.cat.transport'), path: '/airport-transfer' },
        { id: 'restaurants', imagePath: '/images/categories/placeholder.jpg', title: t('dir.cat.restaurants'), path: '/restaurants' },
        { id: 'cafes', imagePath: '/images/categories/placeholder.jpg', title: t('dir.cat.cafes'), path: '/cafes' },
        { id: 'nature', imagePath: '/images/categories/placeholder.jpg', title: t('dir.cat.nature'), path: '/alanya-nature-attractions' },
        { id: 'spa-hamam', imagePath: '/images/categories/placeholder.jpg', title: t('dir.cat.spa_hamam'), path: '/alanya-spa-hamam' },
        { id: 'hair-beauty', imagePath: '/images/categories/placeholder.jpg', title: t('dir.cat.hair_beauty'), path: '/alanya-hair-beauty' },
        { id: 'real-estate', imagePath: '/images/categories/placeholder.jpg', title: t('dir.cat.realestate'), path: '/alanya-real-estate' },
        { id: 'visa', imagePath: '/images/categories/placeholder.jpg', title: t('dir.cat.visa'), path: '/alanya-residency-guide' },
        { id: 'shopping', imagePath: '/images/categories/placeholder.jpg', title: t('dir.cat.shopping'), path: '/alanya-shopping-guide' },
    ];

    const travelAgencySchema = useMemo(() => ({
        '@context': 'https://schema.org',
        '@type': 'TravelAgency',
        'name': 'Alanya Holidays',
        'description': t('dir.hero.meta_desc') || 'Premium vacation rentals, tours, and transfers in Alanya, Turkey.',
        'url': 'https://alanya-holidays.com',
        'image': 'https://alanya-holidays.com/og-image.jpg',
        'telephone': '+14389294208',
        'email': 'contact@alanyaholidays.com',
        'address': {
            '@type': 'PostalAddress',
            'streetAddress': 'Kesefli Mah.',
            'addressLocality': 'Alanya',
            'addressRegion': 'Antalya',
            'addressCountry': 'TR',
        },
        'priceRange': '$$',
        'openingHoursSpecification': {
            '@type': 'OpeningHoursSpecification',
            'dayOfWeek': [
                'Monday',
                'Tuesday',
                'Wednesday',
                'Thursday',
                'Friday',
                'Saturday',
                'Sunday'
            ],
            'opens': '09:00',
            'closes': '22:00'
        }
    }), [t]);

    return (
        <>
            <SEOHead
                title={t('dir.hero.page_title')}
                description={t('dir.hero.meta_desc')}
                type="website"
                keywords={['Alanya holidays', 'vacation rentals', ' Turkey', 'medical tourism', 'hotels', 'villas']}
                jsonLd={travelAgencySchema}
            />
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            <div className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden min-h-[600px] flex flex-col justify-center">
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute inset-0 animate-scale-in duration-[1.5s]">
                        <img
                            src="/images/hero-bg.jpg"
                            onError={(e) => {
                                e.currentTarget.src = "https://images.unsplash.com/photo-1542037104857-ffbb0b9155fb?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"; // Alanya specific image
                            }}
                            alt="Alanya Coastline"
                            className="w-full h-full object-cover"
                            fetchPriority="high"
                            loading="eager"
                        />
                        {/* A single, clean, uniform dark overlay. No gradients, no vignettes. */}
                        <div className="absolute inset-0 bg-black/30 backdrop-brightness-110"></div>
                    </div>
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mt-8 mb-6">
                    <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-6 flex flex-col items-center" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
                        <span className="text-amber-300 font-bold uppercase tracking-widest text-sm md:text-base mb-4" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{t('dir.hero.badge')}</span>
                        <span className="leading-tight">{t('dir.hero.title1')}</span>
                        <span className="leading-tight mt-1">
                            {t('dir.hero.title2')}
                        </span>
                    </h1>

                    <p className="mt-6 text-lg md:text-xl text-white max-w-2xl mx-auto mb-8 font-medium leading-relaxed" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
                        {t('dir.hero.subtitle')}
                    </p>

                    {/* Search Bar */}
                    <div className="max-w-5xl mx-auto mb-12">
                        <div className="bg-white dark:bg-slate-800/80 p-2 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800/50 flex flex-col md:flex-row gap-2">
                            <div className="flex-[1.5] relative flex items-center border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800/50">
                                <Search className="absolute left-4 w-5 h-5 text-slate-400 dark:text-slate-500" />
                                <input
                                    type="text"
                                    placeholder={t('dir.search.placeholder')}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSearch();
                                    }}
                                    className="w-full pl-12 pr-4 py-4 rounded-t-xl md:rounded-none md:rounded-l-xl border-none focus:ring-2 focus:ring-teal-500 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-all"
                                />
                            </div>

                            <div className="flex-1 relative flex items-center border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800/50">
                                <Grid className="absolute left-4 w-5 h-5 text-slate-400 dark:text-slate-500 pointer-events-none" />
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button
                                            type="button"
                                            className="w-full pl-12 pr-10 py-4 md:rounded-none border-none focus:ring-2 focus:ring-teal-500 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white outline-none transition-all cursor-pointer truncate text-left flex items-center justify-between hover:bg-slate-100/70 dark:hover:bg-slate-900/80 data-[state=open]:bg-slate-100 dark:data-[state=open]:bg-slate-900 group"
                                        >
                                            <span className="truncate">
                                                {selectedCategory ? categories.find(cat => cat.id === selectedCategory)?.title : t('dir.search.cat_all')}
                                            </span>
                                            <ChevronDown className="w-4 h-4 ml-2 flex-shrink-0 text-slate-400 dark:text-slate-500 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] max-h-[300px] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50">
                                        <DropdownMenuItem
                                            className={cn(
                                                "cursor-pointer",
                                                !selectedCategory && "bg-slate-100 dark:bg-slate-800 font-medium text-teal-600 dark:text-cyan-400"
                                            )}
                                            onClick={() => setSelectedCategory('')}
                                        >
                                            {t('dir.search.cat_all')}
                                        </DropdownMenuItem>
                                        {categories.map(cat => (
                                            <DropdownMenuItem
                                                key={cat.id}
                                                className={cn(
                                                    "cursor-pointer",
                                                    selectedCategory === cat.id && "bg-slate-100 dark:bg-slate-800 font-medium text-teal-600 dark:text-cyan-400"
                                                )}
                                                onClick={() => setSelectedCategory(cat.id)}
                                            >
                                                {cat.title}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <div className="w-px bg-slate-200 dark:bg-slate-800/50 hidden md:block" />

                            <div className="flex-1 relative flex items-center mb-2 md:mb-0">
                                <MapPin className="absolute left-4 w-5 h-5 text-slate-400 dark:text-slate-500 pointer-events-none" />
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button
                                            type="button"
                                            className="w-full pl-12 pr-10 py-4 rounded-b-xl md:rounded-none border-none focus:ring-2 focus:ring-teal-500 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white outline-none transition-all cursor-pointer truncate text-left flex items-center justify-between hover:bg-slate-100/70 dark:hover:bg-slate-900/80 data-[state=open]:bg-slate-100 dark:data-[state=open]:bg-slate-900 group"
                                        >
                                            <span className="truncate">
                                                {location || t('dir.search.loc_all')}
                                            </span>
                                            <ChevronDown className="w-4 h-4 ml-2 flex-shrink-0 text-slate-400 dark:text-slate-500 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] max-h-[300px] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50">
                                        <DropdownMenuItem
                                            className={cn(
                                                "cursor-pointer",
                                                !location && "bg-slate-100 dark:bg-slate-800 font-medium text-teal-600 dark:text-cyan-400"
                                            )}
                                            onClick={() => setLocation('')}
                                        >
                                            {t('dir.search.loc_all')}
                                        </DropdownMenuItem>
                                        {dbLocations.length > 0 ? (
                                            dbLocations.map(loc => (
                                                <DropdownMenuItem
                                                    key={loc}
                                                    className={cn(
                                                        "cursor-pointer",
                                                        location === loc && "bg-slate-100 dark:bg-slate-800 font-medium text-teal-600 dark:text-cyan-400"
                                                    )}
                                                    onClick={() => setLocation(loc)}
                                                >
                                                    {loc}
                                                </DropdownMenuItem>
                                            ))
                                        ) : (
                                            ['Alanya', 'Antalya', 'Mahmutlar', 'Oba'].map(loc => (
                                                <DropdownMenuItem
                                                    key={loc}
                                                    className={cn(
                                                        "cursor-pointer",
                                                        location === loc && "bg-slate-100 dark:bg-slate-800 font-medium text-teal-600 dark:text-cyan-400"
                                                    )}
                                                    onClick={() => setLocation(loc)}
                                                >
                                                    {loc}
                                                </DropdownMenuItem>
                                            ))
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <button
                                onClick={handleSearch}
                                className="bg-slate-900 dark:bg-slate-800/50 hover:bg-black dark:hover:bg-teal-500 text-white px-8 py-4 md:rounded-r-xl rounded-xl font-semibold tracking-wide transition-all min-w-[140px] shadow-sm"
                            >
                                {t('dir.search.btn')}
                            </button>
                        </div>
                    </div>

                    {/* CTA Buttons - Premium Unified Look */}
                    <div className="flex flex-col sm:flex-row justify-center gap-3 w-full max-w-2xl mx-auto px-2">
                        <button
                            onClick={() => {
                                document.getElementById('categories')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-white/10 dark:bg-slate-800/80 hover:bg-white/20 dark:hover:bg-slate-700/80 backdrop-blur-md border border-white/30 dark:border-slate-700/50 text-white rounded-xl sm:rounded-full font-semibold transition-all cursor-pointer"
                        >
                            <Grid className="w-5 h-5" />
                            {t('dir.cta.categories')}
                        </button>

                        <Link
                            to="/add-listing"
                            onClick={(e) => {
                                if (!isAuthenticated) {
                                    e.preventDefault();
                                    toast.error(t('auth.required') || 'Please log in to add a listing');
                                    openLogin();
                                }
                            }}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-white/10 dark:bg-slate-800/80 hover:bg-white/20 dark:hover:bg-slate-700/80 backdrop-blur-md border border-white/30 dark:border-slate-700/50 text-white rounded-xl sm:rounded-full font-semibold transition-all cursor-pointer"
                        >
                            <Briefcase className="w-5 h-5" />
                            {t('dir.cta.list')}
                        </Link>
                    </div>

                    {/* AI Planner Floating Entry Point */}
                    <div className="mt-8 sm:mt-12 px-2 max-w-sm mx-auto w-full">
                        <button
                            onClick={() => navigate('/ai-planner')}
                            className="group relative w-full inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-xl sm:rounded-full font-bold shadow-xl shadow-purple-500/30 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                        >
                            <Sparkles className="w-5 h-5 animate-pulse" />
                            <span className="tracking-wide">{t('dir.cta.ai')}</span>
                            <div className="absolute inset-0 rounded-xl sm:rounded-full border border-white/20 group-hover:scale-105 group-hover:opacity-0 transition-all duration-500" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Category Grid Section */}
            <div id="categories" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{t('dir.cat.title')}</h2>
                    <p className="mt-4 text-slate-600 dark:text-slate-400">{t('dir.cat.subtitle')}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                    {categories.map((category) => (
                        <button
                            key={category.id}
                            onClick={() => navigate(category.path)}
                            className="group flex flex-row sm:flex-col items-center sm:justify-center p-4 sm:p-8 bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800/50 rounded-2xl shadow-sm hover:shadow-xl dark:hover:shadow-slate-900/50 hover:-translate-y-1 transition-all duration-300 text-left sm:text-center text-slate-900 dark:text-white gap-4 sm:gap-0 cursor-pointer"
                        >
                            <img src={category.imagePath} alt={category.title} loading="lazy" width="200" height="150" className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl object-cover sm:mb-4 group-hover:scale-110 transition-all duration-300 flex-shrink-0" />
                            <div className="flex-1 flex flex-col justify-center">
                                <h3 className="text-base sm:text-lg font-semibold sm:mb-2 text-slate-900 dark:text-white">
                                    {category.title}
                                </h3>
                                <div className="hidden sm:flex items-center justify-center text-teal-600 dark:text-cyan-400 dark:text-slate-200 font-medium opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all">
                                    Explore <ChevronRight className="w-4 h-4 ml-1" />
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-400 sm:hidden" />
                        </button>
                    ))}
                </div>
            </div>

            {/* Premium Listings Section */}
            {signatureListings.length > 0 && (
                <SignatureListingsSection listings={signatureListings} loading={listingsLoading} />
            )}

            <PremiumListingsSection listings={premiumListings} loading={listingsLoading} />

            <RecentlyClaimedSection listings={recentlyClaimedListings} loading={listingsLoading} />

            {/* Travel Guide / Featured Blog Posts */}
            <TravelGuideSection />

            {/* Free Listings / Community Favorites Section */}
            <FreeListingsSection listings={freeListings} loading={listingsLoading} />

            {/* Authority Building Section */}
            <div className="bg-slate-50 dark:bg-slate-900/50 py-16 md:py-24 border-t border-slate-100 dark:border-slate-800/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">{t('dir.trust.title')}</h2>
                        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">{t('dir.trust.subtitle')}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-white dark:bg-slate-800/80 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800/50 text-center">
                            <div className="w-14 h-14 bg-teal-50 dark:bg-slate-800/50 text-teal-600 dark:text-cyan-400 dark:text-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <ShieldCheck size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{t('dir.trust.b1.title')}</h3>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{t('dir.trust.b1.desc')}</p>
                        </div>

                        <div className="bg-white dark:bg-slate-800/80 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800/50 text-center">
                            <div className="w-14 h-14 bg-blue-50 dark:bg-slate-800/50 text-blue-600 dark:text-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <CheckCircle2 size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{t('dir.trust.b2.title')}</h3>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{t('dir.trust.b2.desc')}</p>
                        </div>

                        <div className="bg-white dark:bg-slate-800/80 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800/50 text-center">
                            <div className="w-14 h-14 bg-indigo-50 dark:bg-slate-800/50 text-indigo-600 dark:text-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <Building2 size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{t('dir.trust.b3.title')}</h3>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{t('dir.trust.b3.desc')}</p>
                        </div>
                    </div>

                    {/* Testimonials */}
                    <div className="mt-20 pt-20 border-t border-slate-200 dark:border-slate-800/50 relative overflow-hidden">
                        {/* Subtle Background Glow */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-64 bg-teal-500/5 dark:bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none"></div>

                        <div className="relative z-10 text-center mb-14">
                            <h2 className="text-3xl lg:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 mb-4">
                                {t('dir.testi.title')}
                            </h2>
                            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">{t('dir.testi.subtitle')}</p>
                        </div>

                        {testimonials.length > 0 && (
                            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto px-4">
                                {testimonials.map((t) => (
                                    <div key={t.id} className="group bg-white/60 dark:bg-slate-800/40 backdrop-blur-xl p-8 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-white/50 dark:border-slate-700/50 hover:border-teal-500/30 dark:hover:border-cyan-500/30 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-teal-400 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        
                                        <div className="flex items-center gap-1.5 text-amber-500 dark:text-amber-400 mb-6 bg-amber-50 dark:bg-amber-400/10 w-fit px-3 py-1.5 rounded-full">
                                            {[...Array(5)].map((_, i) => <Star key={i} size={14} className={i < t.rating ? "fill-amber-500 dark:fill-amber-400" : "text-slate-300 dark:text-slate-600"} />)}
                                        </div>
                                        <p className="text-lg text-slate-700 dark:text-slate-300 italic mb-6 leading-relaxed flex-grow">
                                            "{t.content}"
                                        </p>
                                        <div className="flex items-center gap-4 mt-auto border-t border-slate-100 dark:border-slate-700/50 pt-6">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-bold shadow-md">
                                                {t.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 dark:text-white">{t.name}</p>
                                                {t.role && <p className="text-sm text-slate-500 dark:text-slate-400">{t.role}</p>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    </>
    );
};
