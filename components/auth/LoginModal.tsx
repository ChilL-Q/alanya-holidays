import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { useModal } from '../../context/ModalContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, AlertCircle, Loader2, ArrowLeft, KeyRound } from 'lucide-react';
import { useSubmitShortcut } from '../../hooks/useSubmitShortcut';

export const LoginModal: React.FC = () => {
    const { activeModal, closeModal, openRegister } = useModal();
    const { t } = useLanguage();
    const { login, sendOtp, verifyOtp } = useAuth();

    const [mode, setMode] = useState<'login' | 'recovery' | 'otp'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const isOpen = activeModal === 'login';

    // Reset state on close/open
    useEffect(() => {
        if (!isOpen) {
            setMode('login');
            setError('');
            setOtp('');
            setPassword('');
            // Keep email for potential re-login or recovery attempts
            // setEmail(''); 
        }
    }, [isOpen]);

    const handleLoginSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await login(email, password);
            if (result.success) {
                closeModal();
            } else {
                setError(result.error || 'Invalid email or password');
            }
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleRecoverySubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // We use signInWithOtp (sendOtp) as a "Login with Code" flow for recovery
            const result = await sendOtp(email);
            if (result.success) {
                setMode('otp');
            } else {
                setError(result.error || 'Failed to send code');
            }
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleOtpSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // type 'email' covers standard magic link / OTP login
            const result = await verifyOtp(email, otp, 'email');
            if (result.success) {
                closeModal();
            } else {
                setError(result.error || 'Invalid code');
            }
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    // Keyboard Shortcuts
    useSubmitShortcut(() => {
        if (mode === 'login') handleLoginSubmit();
        else if (mode === 'recovery') handleRecoverySubmit();
        else if (mode === 'otp') handleOtpSubmit();
    });

    const getTitle = () => {
        if (mode === 'recovery') return 'Reset Password';
        if (mode === 'otp') return 'Check your email';
        return t('auth.login.title');
    };

    return (
        <Modal isOpen={isOpen} onClose={closeModal} title={getTitle()}>
            <div className="space-y-6">
                {(mode === 'recovery' || mode === 'otp') && (
                    <button
                        onClick={() => setMode('login')}
                        className="text-slate-500 hover:text-slate-800 flex items-center gap-1 text-sm mb-2"
                    >
                        <ArrowLeft size={16} />
                        Back to Login
                    </button>
                )}

                {error && (
                    <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                {/* LOGIN FORM */}
                {mode === 'login' && (
                    <form onSubmit={handleLoginSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">{t('auth.email')}</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                                    placeholder="hello@example.com"
                                />
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-sm font-medium text-slate-700">{t('auth.password')}</label>
                                <button
                                    type="button"
                                    onClick={() => setMode('recovery')}
                                    className="text-sm text-primary font-semibold hover:underline"
                                >
                                    Forgot password?
                                </button>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading && <Loader2 size={18} className="animate-spin" />}
                            {t('auth.submit.login')}
                        </button>

                        <div className="flex items-center gap-2 justify-center mt-6 text-sm text-slate-600">
                            <span>{t('auth.no_account')}</span>
                            <button
                                type="button"
                                onClick={openRegister}
                                className="text-primary font-semibold hover:underline"
                            >
                                {t('auth.submit.register')}
                            </button>
                        </div>
                    </form>
                )}

                {/* RECOVERY REQUEST FORM */}
                {mode === 'recovery' && (
                    <form onSubmit={handleRecoverySubmit} className="space-y-4">
                        <p className="text-slate-600 text-sm">
                            Enter your email address and we'll send you a code to log in instantly.
                        </p>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">{t('auth.email')}</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                                    placeholder="hello@example.com"
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading && <Loader2 size={18} className="animate-spin" />}
                            Send Code
                        </button>
                    </form>
                )}

                {/* OTP FORM */}
                {mode === 'otp' && (
                    <form onSubmit={handleOtpSubmit} className="space-y-6">
                        <div className="text-center space-y-2">
                            <p className="text-slate-500">We sent a login code to <strong>{email}</strong></p>
                        </div>

                        <div className="flex justify-center">
                            <input
                                type="text"
                                maxLength={8}
                                required
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                                className="w-64 text-center text-3xl tracking-[0.3em] font-bold py-3 border-b-2 border-slate-300 focus:border-primary outline-none text-slate-900 bg-transparent placeholder:tracking-normal placeholder:text-slate-300"
                                placeholder="12345678"
                                autoFocus
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || otp.length < 6}
                            className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
                        >
                            {loading && <Loader2 size={24} className="animate-spin" />}
                            Verify & Login
                        </button>

                        <div className="text-center">
                            <button
                                type="button"
                                onClick={() => sendOtp(email)}
                                disabled={loading}
                                className="text-sm text-slate-500 hover:text-primary transition-colors"
                            >
                                Resend Code
                            </button>
                        </div>
                    </form>
                )}

            </div>
        </Modal>
    );
};
