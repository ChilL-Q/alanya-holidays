import React from 'react';
import { FileCheck, Clock, ShieldCheck, Globe, CheckCircle } from 'lucide-react';

import { useLanguage } from '../context/LanguageContext';

export const Visa: React.FC = () => {
    const { t } = useLanguage();
    return (
        <div className="pt-24 pb-16 min-h-screen bg-slate-50 dark:bg-slate-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <span className="text-teal-600 dark:text-teal-400 font-semibold tracking-wider text-sm uppercase mb-2 block">{t('visa.hero.badge')}</span>
                    <h1 className="text-4xl md:text-5xl font-serif text-slate-900 dark:text-white mb-6">{t('visa.hero.title')}</h1>
                    <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                        {t('visa.hero.subtitle')}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                    {/* Tourist Visa */}
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden group animate-stagger-enter" style={{ animationDelay: '0ms' }}>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="bg-teal-100 dark:bg-teal-900/50 p-3 rounded-xl text-teal-600 dark:text-teal-400">
                                <Globe size={28} />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{t('visa.tourist.title')}</h3>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                            {t('visa.tourist.desc')}
                        </p>
                        <ul className="space-y-4 mb-8">
                            {[t('visa.tourist.list1'), t('visa.tourist.list2'), t('visa.tourist.list3')].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                                    <CheckCircle size={18} className="text-teal-500 shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                        <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-700">
                            <div>
                                <div className="text-xs text-slate-500 uppercase tracking-wide">{t('visa.tourist.price')}</div>
                                <div className="text-2xl font-bold text-teal-600">€50</div>
                            </div>
                            <button className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity">
                                Apply
                            </button>
                        </div>
                    </div >

                    {/* Residence Permit */}
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden group animate-stagger-enter" style={{ animationDelay: '150ms' }}>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="bg-purple-100 dark:bg-purple-900/50 p-3 rounded-xl text-purple-600 dark:text-purple-400">
                                <FileCheck size={28} />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{t('visa.residence.title')}</h3>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                            {t('visa.residence.desc')}
                        </p>
                        <ul className="space-y-4 mb-8">
                            {[t('visa.residence.list1'), t('visa.residence.list2'), t('visa.residence.list3')].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                                    <CheckCircle size={18} className="text-purple-500 shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                        <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-700">
                            <div>
                                <div className="text-xs text-slate-500 uppercase tracking-wide">{t('visa.residence.price')}</div>
                                <div className="text-2xl font-bold text-purple-600">€250</div>
                            </div>
                            <button className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity">
                                Consult
                            </button>
                        </div>
                    </div>
                </div>

                {/* FAQ or Info Section */}
                <div className="bg-teal-900 rounded-2xl p-8 md:p-12 text-white">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <Clock size={48} className="text-teal-300 shrink-0" />
                        <div>
                            <h3 className="text-2xl font-bold mb-2">{t('visa.faq.title')}</h3>
                            <p className="text-teal-100 leading-relaxed">
                                {t('visa.faq.desc')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
