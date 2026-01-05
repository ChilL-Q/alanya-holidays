import React from 'react';
import { CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const ZeroFeesPage: React.FC = () => {
    const { t } = useLanguage();

    return (
        <div className="pt-24 pb-20">
            {/* Hero */}
            <section className="bg-primary text-white py-20 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6">{t('zerofees.hero.title')}</h1>
                    <p className="text-xl md:text-2xl opacity-90">{t('zerofees.hero.subtitle')}</p>
                </div>
            </section>

            {/* Comparison */}
            <section className="max-w-5xl mx-auto px-4 -mt-10">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
                    <div className="grid grid-cols-1 md:grid-cols-2">
                        {/* Traditional Platforms */}
                        <div className="p-8 md:p-12 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-100">
                            <h3 className="text-xl font-bold text-slate-500 mb-6 uppercase tracking-wider">{t('zerofees.competitors.title')}</h3>
                            <ul className="space-y-4">
                                <li className="flex items-start gap-3">
                                    <XCircle className="text-red-500 shrink-0" />
                                    <div>
                                        <span className="font-bold text-slate-900 block">15-20% Service Fee</span>
                                        <span className="text-sm text-slate-500">Added on top of the nightly rate.</span>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <XCircle className="text-red-500 shrink-0" />
                                    <div>
                                        <span className="font-bold text-slate-900 block">Hidden Costs</span>
                                        <span className="text-sm text-slate-500">Surprise fees at checkout.</span>
                                    </div>
                                </li>
                            </ul>
                        </div>

                        {/* Alanya Holidays */}
                        <div className="p-8 md:p-12 bg-white">
                            <h3 className="text-xl font-bold text-primary mb-6 uppercase tracking-wider">Alanya Holidays</h3>
                            <ul className="space-y-4">
                                <li className="flex items-start gap-3">
                                    <CheckCircle className="text-green-500 shrink-0" />
                                    <div>
                                        <span className="font-bold text-slate-900 block">0% Guest Service Fee</span>
                                        <span className="text-sm text-slate-500">You pay what the host asks. Not a cent more.</span>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle className="text-green-500 shrink-0" />
                                    <div>
                                        <span className="font-bold text-slate-900 block">Transparent Pricing</span>
                                        <span className="text-sm text-slate-500">Total price shown upfront.</span>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Why */}
            <section className="max-w-3xl mx-auto px-4 py-20 text-center">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6 text-accent">
                    <TrendingUp size={32} />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-6">{t('zerofees.why.title')}</h2>
                <p className="text-lg text-slate-600 leading-relaxed">
                    {t('zerofees.why.desc')}
                </p>
            </section>
        </div>
    );
};
