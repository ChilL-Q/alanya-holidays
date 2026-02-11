import React from 'react';
import { Wifi, Download, Zap } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const Esim: React.FC = () => {
    const { t } = useLanguage();
    return (
        <div className="pt-24 pb-16 min-h-screen bg-slate-50 dark:bg-slate-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                <div className="flex flex-col md:flex-row items-center justify-between gap-12 mb-16">
                    <div className="md:w-1/2">
                        <h1 className="text-4xl lg:text-5xl font-serif text-slate-900 dark:text-white mb-6 leading-tight">Tourist SIM Card</h1>
                        <p className="text-xl text-slate-600 dark:text-slate-400 mb-8 max-w-lg">
                            {t('esim.hero.subtitle')}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={() => window.open('https://yesim.app/', '_blank')} // TODO: Replace with your Yesim affiliate link (e.g., https://yesim.app/ref/YOURCODE)
                                className="bg-slate-900 dark:bg-white dark:text-slate-900 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-slate-800 transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shadow-lg"
                            >
                                <Download size={20} /> Get Yesim eSIM
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
                                    <h3 className="text-center text-xl font-bold mb-2">Connected</h3>
                                    <p className="text-center text-sm text-slate-300 mb-8">{t('esim.mock.plan')}</p>

                                    <div className="space-y-4">
                                        <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl flex items-center justify-between">
                                            <span className="text-sm">Status</span>
                                            <span className="font-bold text-teal-300">Online</span>
                                        </div>
                                        <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl flex items-center justify-between">
                                            <span className="text-sm">{t('esim.mock.speed')}</span>
                                            <span className="font-bold flex items-center gap-1"><Zap size={14} className="text-yellow-400" /> 4G</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
