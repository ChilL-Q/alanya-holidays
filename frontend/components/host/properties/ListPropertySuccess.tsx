import React from 'react';
import { CheckCircle } from 'lucide-react';
import { Button } from '../../ui/Button';
import { useLanguage } from '../../../context/LanguageContext';

interface ListPropertySuccessProps {
    onReturnHome: () => void;
}

export const ListPropertySuccess: React.FC<ListPropertySuccessProps> = ({ onReturnHome }) => {
    const { t } = useLanguage();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center px-4 transition-colors">
            <div className="bg-white dark:bg-slate-800/80 p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-slate-100 dark:border-slate-800/50">
                <div className="w-24 h-24 bg-teal-100 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6 text-teal-600 dark:text-cyan-400">
                    <CheckCircle size={48} />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">{t('list_prop.success.title')}</h2>
                <p className="text-slate-600 dark:text-slate-400 mb-8">{t('list_prop.success.desc')}</p>
                <Button onClick={onReturnHome} variant="primary" fullWidth>{t('list_prop.return_home')}</Button>
            </div>
        </div>
    );
};
