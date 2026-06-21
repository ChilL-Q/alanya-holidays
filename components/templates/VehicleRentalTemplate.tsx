import React from 'react';
import { Check } from 'lucide-react';
import DOMPurify from 'dompurify';

interface VehicleRentalTemplateProps {
    titleHtml?: string;
    titleText?: string;
    subtitle: string;
    features: string[];
    heroImage: string;
    heroAlt: string;
    heroImageRotate?: string;
    popularTitle: string;
    loading: boolean;
    loadingMessage: string;
    emptyMessage?: string;
    isEmpty?: boolean;
    children: React.ReactNode;
}

export const VehicleRentalTemplate: React.FC<VehicleRentalTemplateProps> = ({
    titleHtml,
    titleText,
    subtitle,
    features,
    heroImage,
    heroAlt,
    heroImageRotate = 'rotate-0',
    popularTitle,
    loading,
    loadingMessage,
    emptyMessage,
    isEmpty,
    children
}) => {
    return (
        <div className="pt-24 pb-16 min-h-screen bg-slate-50 dark:bg-slate-900">
            {/* Hero Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div>
                        {titleHtml ? (
                            <h1
                                className="text-4xl md:text-5xl font-serif text-slate-900 dark:text-white mb-6 leading-tight"
                                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(titleHtml) }}
                            />
                        ) : (
                            <h1 className="text-4xl md:text-5xl font-serif text-slate-900 dark:text-white mb-6 leading-tight">
                                {titleText}
                            </h1>
                        )}
                        <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                            {subtitle}
                        </p>

                        <div className="flex flex-wrap gap-4 mb-10">
                            {features.map((feature, idx) => (
                                <div key={idx} className="flex items-center gap-2 bg-white dark:bg-slate-800/80 px-4 py-2 rounded-full shadow-sm text-sm font-medium text-slate-700 dark:text-slate-300">
                                    <Check size={16} className="text-teal-500 dark:text-cyan-400 " />
                                    {feature}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative">
                        <div className="absolute -inset-4 bg-teal-100 dark:bg-slate-800/50 rounded-full blur-3xl opacity-50"></div>
                        <picture>
                            <source srcSet={heroImage.replace(/\.(jpg|jpeg|png)$/i, '.webp')} type="image/webp" />
                            <img
                                src={heroImage}
                                alt={heroAlt}
                                loading="eager"
                                fetchPriority="high"
                                decoding="async"
                                className={`relative rounded-3xl shadow-2xl transform ${heroImageRotate} hover:rotate-0 transition-transform duration-500 w-full object-cover`}
                                width="1200"
                                height="800"
                            />
                        </picture>
                    </div>
                </div>
            </div>

            {/* Fleet Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-3xl font-serif text-slate-900 dark:text-white mb-8">{popularTitle}</h2>

                {loading ? (
                    <div className="text-center py-20 text-slate-500">{loadingMessage}</div>
                ) : isEmpty ? (
                    <div className="text-center py-20 text-slate-500">
                        <p>{emptyMessage || 'No vehicles currently available.'}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {children}
                    </div>
                )}
            </div>
        </div>
    );
};
