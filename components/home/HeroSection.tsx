import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { SearchWidget } from './SearchWidget';
import { WeatherWidget } from '../weather/WeatherWidget';

interface HeroSectionProps {
    location: string;
    setLocation: (loc: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ location, setLocation }) => {
    const { t } = useLanguage();

    return (
        <section className="relative min-h-[85vh] md:h-[600px] flex items-center justify-center pt-20 pb-10 md:py-0">
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute inset-0 animate-scale-in duration-[1.5s]">
                    <img
                        src="/images/hero-bg.jpg"
                        onError={(e) => {
                            e.currentTarget.src = "https://images.unsplash.com/photo-1542037104857-ffbb0b9155fb?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"; // Alanya specific image
                        }}
                        alt="Alanya Coastline"
                        className="w-full h-full object-cover"
                    />
                    {/* Darker overlay for better text contrast */}
                    <div className="absolute inset-0 bg-black/40 md:bg-black/20"></div>
                    {/* Bottom gradient for smooth transition */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-50/90 via-transparent to-black/30 md:from-black/60 md:via-black/20 md:to-transparent dark:from-slate-900/90"></div>
                </div>
            </div>

            <div className="relative z-10 w-full max-w-5xl px-4 md:px-6 animate-fade-up">
                <div className="text-center mb-8 md:mb-10">
                    <h1 className="font-serif text-3xl sm:text-4xl md:text-6xl text-white mb-3 md:mb-4 drop-shadow-2xl animate-fade-up opacity-0 fill-mode-forwards leading-tight" style={{ animationDelay: '200ms' }}>
                        {t('hero.title')}
                    </h1>
                    <p className="text-base sm:text-lg md:text-xl text-slate-100 font-light animate-fade-up opacity-0 fill-mode-forwards px-4" style={{ animationDelay: '400ms' }}>
                        {t('hero.subtitle')} <span className="font-semibold text-accent block sm:inline mt-1 sm:mt-0">{t('hero.zero_fees')}</span>
                    </p>
                </div>

                <SearchWidget location={location} setLocation={setLocation} />
            </div>
            <WeatherWidget />
        </section>
    );
};
