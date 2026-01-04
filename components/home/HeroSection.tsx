import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { SearchWidget } from './SearchWidget';

interface HeroSectionProps {
    location: string;
    setLocation: (loc: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ location, setLocation }) => {
    const { t } = useLanguage();

    return (
        <section className="relative h-[600px] flex items-center justify-center">
            <div className="absolute inset-0">
                <img
                    src="/images/hero-bg.jpg"
                    onError={(e) => {
                        e.currentTarget.src = "https://picsum.photos/1920/1080?random=10";
                    }}
                    alt="Alanya Coastline"
                    className="w-full h-full object-cover"
                />
                {/* Darker overlay for better text contrast */}
                <div className="absolute inset-0 bg-black/20"></div>
                {/* Bottom gradient for smooth transition */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
            </div>

            <div className="relative z-10 w-full max-w-5xl px-4">
                <div className="text-center mb-10">
                    <h1 className="font-serif text-4xl md:text-6xl text-white mb-4 drop-shadow-2xl">
                        {t('hero.title')}
                    </h1>
                    <p className="text-lg md:text-xl text-slate-100 font-light">
                        {t('hero.subtitle')} <span className="font-semibold text-accent">{t('hero.zero_fees')}</span>
                    </p>
                </div>

                <SearchWidget location={location} setLocation={setLocation} />
            </div>
        </section>
    );
};
