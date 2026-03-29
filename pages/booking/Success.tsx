
import React, { useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, Home, Calendar } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const BookingSuccess: React.FC = () => {
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get('session_id');
    const navigate = useNavigate();
    const { t } = useLanguage();

    useEffect(() => {
        if (!sessionId) {
            navigate('/');
        }
    }, [sessionId, navigate]);

    return (
        <div className="min-h-screen pt-24 pb-12 bg-slate-50 dark:bg-slate-900 flex items-center justify-center px-4">
            <div className="max-w-md w-full bg-white dark:bg-slate-800/80 rounded-3xl shadow-xl p-8 text-center animate-in fade-in zoom-in duration-500">
                <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                    {t('booking.success.title') || 'Payment Successful!'}
                </h1>

                <p className="text-slate-600 dark:text-slate-400 mb-8">
                    {t('booking.success.message') || 'Thank you for your booking. A confirmation email has been sent to you.'}
                </p>

                <div className="space-y-3">
                    <Link
                        to="/inbox"
                        className="block w-full bg-teal-600 dark:bg-cyan-600 hover:bg-teal-700 dark:bg-cyan-600 text-white font-semibold py-3 px-6 rounded-xl transition flex items-center justify-center gap-2"
                    >
                        <Calendar size={20} />
                        {t('booking.success.my_bookings') || 'View My Bookings'}
                    </Link>

                    <Link
                        to="/"
                        className="block w-full bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-semibold py-3 px-6 rounded-xl transition flex items-center justify-center gap-2"
                    >
                        <Home size={20} />
                        {t('booking.success.home') || 'Return to Home'}
                    </Link>
                </div>
            </div>
        </div>
    );
};
