import React from 'react';
import { Phone, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export const VisaConsult: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-24 pb-12 px-4">
            <div className="max-w-2xl mx-auto">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white mb-8 transition-colors"
                >
                    <ArrowLeft size={20} />
                    {t('list_prop.back')}
                </button>

                <div className="bg-white dark:bg-slate-800/80 rounded-3xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-800/50">
                    <div className="bg-teal-600 dark:bg-cyan-600 p-8 text-center">
                        <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 text-white">
                            <ShieldCheck size={40} />
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">{t('visa.consult.title')}</h1>
                        <p className="text-teal-100 text-lg">{t('visa.consult.subtitle')}</p>
                    </div>

                    <div className="p-8 md:p-12 text-center">
                        <p className="text-lg text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
                            {t('visa.consult.desc')}
                        </p>

                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-8 border border-slate-200 dark:border-slate-800/50 mb-8">
                            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">{t('visa.consult.agent')}</h3>
                            <a
                                href="https://wa.me/905300846177"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-3 text-3xl font-bold text-slate-900 dark:text-white hover:text-teal-600 dark:text-cyan-400 dark:hover:text-teal-400 dark:text-cyan-400 transition-colors"
                            >
                                <Phone className="mt-1" />
                                +90 530 084 61 77
                            </a>
                            <p className="text-sm text-slate-400 mt-4">{t('visa.consult.availability')}</p>
                        </div>

                        <p className="text-sm text-slate-400 max-w-sm mx-auto">
                            {t('visa.consult.disclaimer')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
