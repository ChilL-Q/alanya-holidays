import React from 'react';
import { Shield, Users, Heart, ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Link } from 'react-router-dom';
import { SEOHead } from '../components/seo/SEOHead';

export const About: React.FC = () => {
    const { t } = useLanguage();

    return (
        <>
            <SEOHead
                title="About Us"
                description="Learn about Alanya Holidays - your trusted partner for premium vacation rentals in Alanya, Turkey. Zero fees, genuine hospitality."
                type="website"
                keywords={['about Alanya Holidays', 'vacation rental company', 'Turkey']}
            />
            <div className="min-h-screen bg-white dark:bg-slate-900">
            {/* Hero Section */}
            <div className="relative h-[60vh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img
                        src="/images/hero-bg.jpg"
                        alt="Alanya Coastline"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/40 to-slate-900/90" />
                </div>

                <div className="relative z-10 text-center px-4 max-w-4xl mx-auto animate-fade-in-up">
                    <h1 className="text-4xl md:text-6xl font-serif text-white mb-6 leading-tight">
                        {t('about.hero.title')}
                    </h1>
                    <p className="text-xl md:text-2xl text-slate-200 font-light max-w-2xl mx-auto">
                        {t('about.hero.subtitle')}
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-20 pb-20">
                {/* Stats / Pillars */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-24">
                    <div className="bg-white dark:bg-slate-800/80 p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-slate-100 dark:border-slate-800/50">
                        <div className="w-14 h-14 bg-teal-50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-center text-teal-600 dark:text-cyan-400 dark:text-slate-200 mb-6 group-hover:scale-110 transition-transform">
                            <Shield size={28} strokeWidth={1.5} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{t('about.pillar.fees_guest.title')}</h3>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm lg:text-base">
                            {t('about.pillar.fees_guest.desc')}
                        </p>
                    </div>

                    <div className="bg-white dark:bg-slate-800/80 p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-slate-100 dark:border-slate-800/50">
                        <div className="w-14 h-14 bg-blue-50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-center text-blue-600 dark:text-slate-200 mb-6 group-hover:scale-110 transition-transform">
                            <Users size={28} strokeWidth={1.5} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{t('about.pillar.fees_host.title')}</h3>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm lg:text-base">
                            {t('about.pillar.fees_host.desc')}
                        </p>
                    </div>

                    <div className="bg-white dark:bg-slate-800/80 p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-slate-100 dark:border-slate-800/50">
                        <div className="w-14 h-14 bg-rose-50 dark:bg-rose-900/20 rounded-2xl flex items-center justify-center text-rose-600 dark:text-rose-400 mb-6 group-hover:scale-110 transition-transform">
                            <Heart size={28} strokeWidth={1.5} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{t('about.pillar.ethical.title')}</h3>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm lg:text-base">
                            {t('about.pillar.ethical.desc')}
                        </p>
                    </div>
                </div>

                {/* Our Story */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24">
                    <div className="order-2 lg:order-1">
                        <h2 className="text-3xl md:text-4xl font-serif text-slate-900 dark:text-white mb-6">{t('about.story.title')}</h2>
                        <div className="space-y-4 text-slate-600 dark:text-slate-400 leading-relaxed text-lg">
                            <p>
                                {t('about.story.p1')}
                            </p>
                            <p>
                                {t('about.story.p2')}
                            </p>
                            <p>
                                {t('about.story.p3')}
                            </p>
                        </div>
                    </div>
                    <div className="relative h-[500px] rounded-3xl overflow-hidden shadow-2xl order-1 lg:order-2 group">
                        <img
                            src="https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=2949"
                            alt="Alanya Harbor"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                    </div>
                </div>

                {/* CTA */}
                <div className="relative rounded-3xl overflow-hidden">
                    <div className="absolute inset-0">
                        <img
                            src="https://images.unsplash.com/photo-1582733352932-514d7a8deda6?auto=format&fit=crop&q=80&w=2832"
                            alt="Turkish Hospitality"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-teal-900/40" />
                    </div>

                    <div className="relative z-10 p-12 md:p-24 text-center text-white">
                        <h2 className="text-3xl md:text-5xl font-serif mb-6">{t('about.movement.title')}</h2>
                        <p className="text-lg md:text-xl text-teal-100 max-w-2xl mx-auto mb-10 leading-relaxed">
                            {t('about.movement.desc')}
                        </p>
                        <Link to="/stays" className="inline-flex items-center bg-white text-teal-900 px-8 py-4 rounded-full font-bold text-lg hover:bg-teal-50 transition-all duration-300 hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                            {t('checkout.start')} <ArrowRight className="ml-2" />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    </>
    );
};
