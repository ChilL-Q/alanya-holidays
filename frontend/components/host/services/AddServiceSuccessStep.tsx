import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../../context/LanguageContext';

interface AddServiceSuccessStepProps {
    onReset: () => void;
}

export const AddServiceSuccessStep: React.FC<AddServiceSuccessStepProps> = ({ onReset }) => {
    const { t } = useLanguage();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-20 px-4 flex items-center justify-center">
            <div className="max-w-md w-full bg-white dark:bg-slate-800/80 rounded-2xl shadow-xl p-8 border border-slate-100 dark:border-slate-800/50 text-center">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 size={32} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Submission Received!</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-8">
                    Your service has been submitted for approval. You will be notified once it is live.
                </p>
                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => navigate('/services')}
                        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold py-3 rounded-xl transition-colors"
                    >
                        {t('add_service.view_all')}
                    </button>
                    <button
                        onClick={onReset}
                        className="w-full text-slate-500 hover:text-slate-900 font-medium py-2 transition-colors"
                    >
                        {t('add_service.add_another')}
                    </button>
                </div>
            </div>
        </div>
    );
};
