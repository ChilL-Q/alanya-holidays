import React from 'react';
import { ShoppingBag } from 'lucide-react';

export const ShopHero: React.FC = () => {
    return (
        <div className="relative h-[40vh] min-h-[400px] flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0">
                <picture>
                    <source srcSet="/images/alanya-bazaar-hero.webp" type="image/webp" />
                    <img
                        src="/images/alanya-bazaar-hero.png"
                        alt="Colorful Turkish Lamps"
                        className="w-full h-full object-cover animate-stagger-enter"
                        style={{ animationDelay: '0.1s' }}
                        loading="lazy"
                        width="640"
                        height="640"
                    />
                </picture>
                <div className="absolute inset-0 bg-slate-900/40"></div>
            </div>
            <div className="relative z-10 text-center px-4 max-w-4xl mx-auto animate-stagger-enter" style={{ animationDelay: '0.3s' }}>
                <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 px-4 py-2 rounded-full mb-6 border border-amber-500/30 backdrop-blur-md">
                    <ShoppingBag size={18} />
                    <span className="font-medium tracking-wide text-sm uppercase">Alanya Artisan Shop</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-serif text-white mb-6 leading-tight">
                    Authentic Local Treasures
                </h1>
                <p className="text-xl text-slate-200 font-light max-w-2xl mx-auto">
                    Discover handmade goods, spices, and souvenirs directly from local artisans.
                </p>
            </div>
        </div>
    );
};
