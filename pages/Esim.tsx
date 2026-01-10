import React from 'react';
import { Wifi, Smartphone, Globe, Download, Zap } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import { useLanguage } from '../context/LanguageContext';

export const Esim: React.FC = () => {
    const { convertPrice, formatPrice } = useCurrency();
    const { t } = useLanguage();
    return (
        <div className="pt-24 pb-16 min-h-screen bg-slate-50 dark:bg-slate-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                <div className="flex flex-col md:flex-row items-center justify-between gap-12 mb-16">
                    <div className="md:w-1/2">
                        <h1 className="text-4xl lg:text-5xl font-serif text-slate-900 dark:text-white mb-6 leading-tight" dangerouslySetInnerHTML={{ __html: t('esim.hero.title') }} />
                        <p className="text-xl text-slate-600 dark:text-slate-400 mb-8 max-w-lg">
                            {t('esim.hero.subtitle')}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button className="bg-slate-900 dark:bg-white dark:text-slate-900 text-white px-8 py-3 rounded-xl font-semibold hover:bg-slate-800 transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shadow-lg">
                                <Download size={20} /> {t('esim.btn.install')}
                            </button>
                            <button className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 px-8 py-3 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-300 hover:scale-105 active:scale-95">
                                {t('esim.btn.plans')}
                            </button>
                        </div>
                    </div>
                    <div className="md:w-1/2 flex justify-center">
                        <div className="relative w-64 h-[500px] bg-slate-900 rounded-[3rem] border-8 border-slate-800 shadow-2xl p-4 flex flex-col items-center">
                            {/* Phone Notch */}
                            <div className="absolute top-0 w-32 h-6 bg-slate-800 rounded-b-xl z-10"></div>

                            {/* Screen Content */}
                            <div className="w-full h-full bg-slate-800 rounded-[2.2rem] overflow-hidden relative">
                                <div className="absolute inset-0 bg-gradient-to-br from-teal-500 to-blue-600 opacity-20"></div>
                                <div className="p-6 relative z-10 text-white h-full flex flex-col justify-center">
                                    <Wifi size={48} className="mx-auto mb-6 text-teal-400" />
                                    <h3 className="text-center text-xl font-bold mb-2">{t('esim.mock.active')}</h3>
                                    <p className="text-center text-sm text-slate-300 mb-8">{t('esim.mock.plan')}</p>

                                    <div className="space-y-4">
                                        <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl flex items-center justify-between">
                                            <span className="text-sm">{t('esim.mock.data')}</span>
                                            <span className="font-bold text-teal-300">12.5 GB</span>
                                        </div>
                                        <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl flex items-center justify-between">
                                            <span className="text-sm">{t('esim.mock.speed')}</span>
                                            <span className="font-bold flex items-center gap-1"><Zap size={14} className="text-yellow-400" /> 5G</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Plans Grid */}
                <h2 className="text-3xl font-bold text-center text-slate-900 dark:text-white mb-12">{t('esim.popular')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    {[
                        { gb: '5 GB', days: '7 Days', rawPrice: 15 },
                        { gb: '10 GB', days: '15 Days', rawPrice: 25, popular: true },
                        { gb: '20 GB', days: '30 Days', rawPrice: 40 },
                    ].map((plan, idx) => (
                        <div
                            key={idx}
                            className={`relative bg-white dark:bg-slate-800 rounded-2xl p-8 border ${plan.popular ? 'border-teal-500 shadow-xl shadow-teal-500/10 scale-105' : 'border-slate-100 dark:border-slate-700 shadow-sm'} animate-stagger-enter`}
                            style={{ animationDelay: `${idx * 100}ms` }}
                        >
                            {plan.popular && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-teal-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                                    {t('esim.most_popular')}
                                </div>
                            )}
                            <div className="text-center mb-6">
                                <div className="text-4xl font-bold text-slate-900 dark:text-white mb-1">{plan.gb}</div>
                                <div className="text-slate-500">{plan.days} {t('esim.validity')}</div>
                            </div>
                            <ul className="space-y-3 mb-8">
                                <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"><Check size={16} className="text-teal-500" /> {t('esim.feat.speed')}</li>
                                <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"><Check size={16} className="text-teal-500" /> {t('esim.feat.hotspot')}</li>
                                <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"><Check size={16} className="text-teal-500" /> {t('esim.feat.activation')}</li>
                            </ul>
                            <button className={`w-full py-3 rounded-lg font-bold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${plan.popular ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-500/30' : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600'}`}>
                                {t('esim.buy')} {formatPrice(convertPrice(plan.rawPrice, 'EUR'))}
                            </button>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
};

// Start Icon helper
import { Check } from 'lucide-react';
