import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Cookie } from 'lucide-react';
import { Link } from 'react-router-dom';

export const CookieConsent: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);
    const { t } = useLanguage();

    useEffect(() => {
        const consent = localStorage.getItem('cookie-consent');
        if (!consent) {
            // Delay slightly to not overwhelm on load
            const timer = setTimeout(() => setIsVisible(true), 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('cookie-consent', 'true');
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 p-4 z-[9999] animate-fade-up">
            <div className="max-w-7xl mx-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 md:flex items-center justify-between gap-6">
                <div className="flex items-start gap-4 mb-4 md:mb-0">
                    <div className="p-3 bg-teal-50 dark:bg-teal-900/30 text-teal-600 rounded-xl shrink-0">
                        <Cookie size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-white mb-1">
                            {t('cookies.title') || 'We use cookies'}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            {t('cookies.desc') || 'We use cookies to improve your experience and analyze our traffic. By clicking "Accept", you agree to our use of cookies.'}
                            {' '}
                            <Link to="/privacy" className="text-teal-600 hover:text-teal-700 underline font-medium">
                                {t('footer.privacy')}
                            </Link>
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    <button
                        onClick={handleAccept}
                        className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl hover:opacity-90 transition-opacity whitespace-nowrap"
                    >
                        {t('cookies.accept') || 'Accept All'}
                    </button>
                    <button
                        onClick={() => setIsVisible(false)}
                        className="p-3 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    >
                        ✕
                    </button>
                </div>
            </div>
        </div>
    );
};
