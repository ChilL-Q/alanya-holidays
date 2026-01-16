import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Sun, History, Mountain, Utensils } from 'lucide-react';
import { DestinationModal } from './DestinationModal';

export const AlanyaIntro: React.FC = () => {
    const { t } = useLanguage();
    const [selectedDestination, setSelectedDestination] = useState<any>(null);

    const sections = [
        {
            key: 'beach',
            icon: Sun,
            image: '/images/home/cleopatra_beach.png'
        },
        {
            key: 'castle',
            icon: History,
            image: '/images/home/alanya_castle.png'
        },
        {
            key: 'nature',
            icon: Mountain,
            image: '/images/home/dim_river.png'
        },
        {
            key: 'cuisine',
            icon: Utensils,
            image: '/images/home/turkish_cuisine.png'
        }
    ];

    const handleCardClick = (section: any) => {
        setSelectedDestination({
            title: t(`intro.${section.key}.title`),
            description: t(`intro.${section.key}.long_desc`),
            image: section.image
        });
    };

    return (
        <>
            <section className="py-24 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16 max-w-2xl mx-auto animate-fade-up">
                        <h2 className="text-3xl md:text-4xl font-serif text-slate-900 dark:text-white mb-4">
                            {t('intro.title')}
                        </h2>
                        <p className="text-sm font-bold uppercase tracking-widest text-accent mb-6">
                            {t('intro.subtitle')}
                        </p>
                        <p className="text-lg text-slate-600 dark:text-slate-400 font-light leading-relaxed">
                            {t('intro.description')}
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {sections.map((section, index) => {
                            const Icon = section.icon;
                            // Calculate delay for stagger effect: 100ms, 200ms, etc.
                            const delayClass = `delay-${(index + 1) * 100}`;

                            return (
                                <div
                                    key={section.key}
                                    onClick={() => handleCardClick(section)}
                                    className={`group relative h-96 rounded-2xl overflow-hidden cursor-pointer shadow-xl transform transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl animate-fade-up opacity-0 fill-mode-forwards ${delayClass}`}
                                    style={{ animationDelay: `${(index + 1) * 100}ms` }}
                                >
                                    {/* Background Image */}
                                    <img
                                        src={section.image}
                                        alt={t(`intro.${section.key}.title`)}
                                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />

                                    {/* Gradient Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>

                                    {/* Content */}
                                    <div className="absolute inset-0 p-6 flex flex-col justify-end translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                        <div className="w-12 h-12 rounded-lg glass flex items-center justify-center mb-4 text-white border border-white/20 shadow-lg">
                                            <Icon size={24} />
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-2">
                                            {t(`intro.${section.key}.title`)}
                                        </h3>
                                        <p className="text-slate-200 text-sm leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 line-clamp-2">
                                            {t(`intro.${section.key}.desc`)}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            <DestinationModal
                isOpen={!!selectedDestination}
                onClose={() => setSelectedDestination(null)}
                data={selectedDestination}
            />
        </>
    );
};
