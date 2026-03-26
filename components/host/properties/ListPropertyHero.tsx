import React from 'react';
import { ShieldCheck, TrendingUp, Settings } from 'lucide-react';
import { Button } from '../../ui/Button';
import { useLanguage } from '../../../context/LanguageContext';

interface ListPropertyHeroProps {
    onRegister: () => void;
    onLogin: () => void;
}

export const ListPropertyHero: React.FC<ListPropertyHeroProps> = ({ onRegister, onLogin }) => {
    const { t } = useLanguage();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20 transition-colors">
            <div className="relative bg-slate-900 text-white py-24 overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80')] bg-cover bg-center opacity-20"></div>
                <div className="relative max-w-7xl mx-auto px-4 text-center">
                    <h1 className="text-4xl md:text-6xl font-bold mb-6" dangerouslySetInnerHTML={{ __html: t('list.hero.title') }} />
                    <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
                        {t('list.hero.desc')}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button onClick={onRegister} variant="primary" size="lg" className="text-lg px-8">
                            {t('auth.submit.register')}
                        </Button>
                        <Button onClick={onLogin} variant="outline" size="lg" className="text-lg px-8 bg-transparent text-white border-white hover:bg-white/10">
                            {t('auth.submit.login')}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-20">
                <div className="grid md:grid-cols-3 gap-8">
                    <div className="bg-white dark:bg-slate-800/80 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800/50">
                        <div className="w-14 h-14 bg-blue-100 dark:bg-slate-800/50 rounded-2xl flex items-center justify-center text-blue-600 dark:text-slate-200 mb-6">
                            <ShieldCheck size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{t('list.benefit.verified.title')}</h3>
                        <p className="text-slate-600 dark:text-slate-400">{t('list.benefit.verified.desc')}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800/80 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800/50">
                        <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center text-green-600 dark:text-green-400 mb-6">
                            <TrendingUp size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{t('list.benefit.earnings.title')}</h3>
                        <p className="text-slate-600 dark:text-slate-400">{t('list.benefit.earnings.desc')}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800/80 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800/50">
                        <div className="w-14 h-14 bg-purple-100 dark:bg-slate-800/50 rounded-2xl flex items-center justify-center text-purple-600 dark:text-slate-200 mb-6">
                            <Settings size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{t('list.benefit.control.title')}</h3>
                        <p className="text-slate-600 dark:text-slate-400">{t('list.benefit.control.desc')}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
