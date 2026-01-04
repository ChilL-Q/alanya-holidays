import React from 'react';
import { Star, MapPin } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const ValueProps: React.FC = () => {
    const { t } = useLanguage();

    return (
        <section className="bg-white py-12 border-b border-slate-100">
            <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <div className="p-4">
                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-xl font-bold">%</span>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">{t('value.zero_fees.title')}</h3>
                    <p className="text-slate-500 text-sm">{t('value.zero_fees.desc')}</p>
                </div>
                <div className="p-4">
                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                        <Star size={20} />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">{t('value.quality.title')}</h3>
                    <p className="text-slate-500 text-sm">{t('value.quality.desc')}</p>
                </div>
                <div className="p-4">
                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                        <MapPin size={20} />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">{t('value.local.title')}</h3>
                    <p className="text-slate-500 text-sm">{t('value.local.desc')}</p>
                </div>
            </div>
        </section>
    );
};
