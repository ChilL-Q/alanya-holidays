
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, Home, Calendar, AlertCircle, Loader2, Hash, Clock } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { supabase } from '../../api-services/supabase';
import { useCurrency } from '../../context/CurrencyContext';

interface BookingDetails {
    id: string;
    status: string;
    payment_status: string;
    check_in: string;
    check_out: string;
    total_price: number;
}

export const BookingSuccess: React.FC = () => {
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get('session_id');
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { formatPrice } = useCurrency();

    const [status, setStatus] = useState<'loading' | 'success' | 'pending' | 'failed'>('loading');
    const [booking, setBooking] = useState<BookingDetails | null>(null);

    useEffect(() => {
        const verifyPayment = async () => {
            if (!sessionId) {
                navigate('/');
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('bookings')
                    .select('id, status, payment_status, check_in, check_out, total_price')
                    .eq('stripe_session_id', sessionId)
                    .single();

                if (error || !data) {
                    console.error('Booking not found:', error);
                    navigate('/');
                    return;
                }

                setBooking(data);

                if (data.status === 'confirmed') {
                    setStatus('success');
                } else if (data.payment_status === 'failed' || data.status === 'cancelled') {
                    setStatus('failed');
                } else {
                    setStatus('pending');
                }
            } catch (err) {
                console.error('Verification error:', err);
                navigate('/');
            }
        };

        verifyPayment();
    }, [sessionId, navigate]);

    if (status === 'loading') {
        return (
            <div className="min-h-screen pt-24 pb-12 bg-slate-50 dark:bg-slate-900 flex items-center justify-center px-4">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-teal-600 animate-spin mx-auto mb-4" />
                    <p className="text-slate-600 dark:text-slate-400">Verifying your payment...</p>
                </div>
            </div>
        );
    }

    if (status === 'failed') {
        return (
            <div className="min-h-screen pt-24 pb-12 bg-slate-50 dark:bg-slate-900 flex items-center justify-center px-4">
                <div className="max-w-md w-full bg-white dark:bg-slate-800/80 rounded-3xl shadow-xl p-8 text-center">
                    <div className="flex justify-center mb-6">
                        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                            <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Payment Failed</h1>
                    <p className="text-slate-600 dark:text-slate-400 mb-8">
                        Your payment could not be processed. No charge was made. Please try again or choose a different payment method.
                    </p>
                    <div className="space-y-3">
                        <Link
                            to="/checkout"
                            className="block w-full bg-teal-600 dark:bg-cyan-600 hover:bg-teal-700 text-white font-semibold py-3 px-6 rounded-xl transition flex items-center justify-center gap-2"
                        >
                            Try Again
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
    }

    if (status === 'pending') {
        return (
            <div className="min-h-screen pt-24 pb-12 bg-slate-50 dark:bg-slate-900 flex items-center justify-center px-4">
                <div className="max-w-md w-full bg-white dark:bg-slate-800/80 rounded-3xl shadow-xl p-8 text-center">
                    <div className="flex justify-center mb-6">
                        <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                            <AlertCircle className="w-10 h-10 text-amber-600 dark:text-amber-400" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Payment Pending</h1>
                    <p className="text-slate-600 dark:text-slate-400 mb-8">
                        Your payment is being processed. It may take a few minutes to confirm your booking. Please check your email or "My Bookings" page shortly.
                    </p>
                    <div className="space-y-3">
                        <Link
                            to="/inbox"
                            className="block w-full bg-teal-600 dark:bg-cyan-600 hover:bg-teal-700 text-white font-semibold py-3 px-6 rounded-xl transition flex items-center justify-center gap-2"
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
    }

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

                <p className="text-slate-600 dark:text-slate-400 mb-6">
                    {t('booking.success.message') || 'Thank you for your booking. A confirmation email has been sent to you.'}
                </p>

                {/* Booking Details Card */}
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 mb-8 text-left space-y-3 border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
                            <Hash size={16} />
                            <span>Booking ID</span>
                        </div>
                        <span className="font-mono font-bold text-slate-900 dark:text-white uppercase">
                            {booking.id.slice(0, 8)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
                            <Clock size={16} />
                            <span>Dates</span>
                        </div>
                        <span className="font-semibold text-slate-700 dark:text-slate-300 text-sm">
                            {new Date(booking.check_in).toLocaleDateString()} - {new Date(booking.check_out).toLocaleDateString()}
                        </span>
                    </div>
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Paid</span>
                        <span className="text-lg font-bold text-teal-600 dark:text-cyan-400">
                            {formatPrice(booking.total_price)}
                        </span>
                    </div>
                </div>

                <div className="space-y-3">
                    <Link
                        to="/inbox"
                        className="block w-full bg-teal-600 dark:bg-cyan-600 hover:bg-teal-700 text-white font-semibold py-3 px-6 rounded-xl transition flex items-center justify-center gap-2"
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
