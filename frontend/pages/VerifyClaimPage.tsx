import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle } from 'lucide-react';
import { db } from '../api-services';
import { useLanguage } from '../context/LanguageContext';

type VerificationStatus = 'loading' | 'success' | 'error';

export const VerifyClaimPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const { t } = useLanguage();
    const [status, setStatus] = useState<VerificationStatus>('loading');

    useEffect(() => {
        const verifyToken = async () => {
            const token = searchParams.get('token');

            if (!token) {
                setStatus('error');
                return;
            }

            try {
                const result = await db.verifyClaimEmail(token);
                if (!result) {
                    setStatus('error');
                    return;
                }
                setStatus('success');
            } catch (err) {
                console.error('Error verifying claim email:', err);
                setStatus('error');
            }
        };

        verifyToken();
    }, [searchParams]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {status === 'loading' && (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 dark:border-cyan-400 mx-auto mb-6" />
                        <p className="text-slate-600 dark:text-slate-300">{t('common.verifying') || 'Verifying your email...'}</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 text-center">
                        <div className="flex justify-center mb-6">
                            <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-4">
                                <CheckCircle size={48} className="text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                            {t('directory.claim.verified') || 'Email Verified!'}
                        </h1>
                        <p className="text-slate-600 dark:text-slate-300 mb-8">
                            {t('directory.claim.verifiedMessage') || 'Your email has been verified. Your claim is now pending admin review.'}
                        </p>
                        <Link
                            to="/"
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 dark:bg-cyan-500 text-white font-semibold rounded-xl hover:bg-teal-700 dark:hover:bg-cyan-600 transition-all"
                        >
                            {t('common.backHome') || 'Back to Home'}
                        </Link>
                    </div>
                )}

                {status === 'error' && (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 text-center">
                        <div className="flex justify-center mb-6">
                            <div className="bg-red-100 dark:bg-red-900/30 rounded-full p-4">
                                <XCircle size={48} className="text-red-600 dark:text-red-400" />
                            </div>
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                            {t('directory.claim.verificationFailed') || 'Verification Failed'}
                        </h1>
                        <p className="text-slate-600 dark:text-slate-300 mb-8">
                            {t('directory.claim.verificationFailedMessage') || 'The verification link is invalid or has expired. Please try claiming the listing again.'}
                        </p>
                        <Link
                            to="/"
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 dark:bg-cyan-500 text-white font-semibold rounded-xl hover:bg-teal-700 dark:hover:bg-cyan-600 transition-all"
                        >
                            {t('common.backHome') || 'Back to Home'}
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};
