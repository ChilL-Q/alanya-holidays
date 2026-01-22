import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { useModal } from '../../context/ModalContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { AlertCircle, Loader2, ArrowLeft, Mail, User, Lock } from 'lucide-react';

export const RegisterModal: React.FC = () => {
    const { activeModal, closeModal, openLogin } = useModal();
    const { t } = useLanguage();
    const { register, verifyOtp } = useAuth();

    const [step, setStep] = useState<'register' | 'otp'>('register');
    const [role, setRole] = useState<'guest' | 'host'>('guest');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const isOpen = activeModal === 'register';

    // Reset when closing or opening
    React.useEffect(() => {
        if (!isOpen) {
            setStep('register');
            setError('');
            setOtp('');
            setPassword('');
        }
    }, [isOpen]);

    const handleRegisterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            const result = await register(name, email, password, role);
            if (result.success) {
                setStep('otp');
            } else {
                setError(result.error || 'Failed to register');
            }
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleOtpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await verifyOtp(email, otp, 'signup');
            if (result.success) {
                closeModal();
                // Clear form
                setName('');
                setEmail('');
                setPassword('');
                setRole('guest');
                setOtp('');
                setStep('register');
            } else {
                setError(result.error || 'Invalid code');
            }
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        setStep('register');
        setError('');
        setOtp('');
    };

    return (
        <Modal isOpen={isOpen} onClose={closeModal} title={step === 'register' ? t('auth.register.title') : 'Confirm your email'}>
            <div className="space-y-6">
                {step === 'otp' && (
                    <button onClick={handleBack} className="text-slate-500 hover:text-slate-800 flex items-center gap-1 text-sm mb-2">
                        <ArrowLeft size={16} />
                        Back to Registration
                    </button>
                )}

                {error && (
                    <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                {step === 'register' ? (
                    <form onSubmit={handleRegisterSubmit} className="space-y-4">
                        {/* Role Selection */}
                        <div className="grid grid-cols-2 gap-4 mb-2">
                            <button
                                type="button"
                                onClick={() => setRole('guest')}
                                className={`p-4 rounded-xl border-2 text-left transition-all ${role === 'guest'
                                    ? 'border-teal-600 bg-teal-50 ring-1 ring-teal-600'
                                    : 'border-slate-200 hover:border-teal-200 hover:bg-slate-50'
                                    }`}
                            >
                                <span className={`block font-bold mb-1 ${role === 'guest' ? 'text-teal-800' : 'text-slate-700'}`}>
                                    {t('auth.role.buyer') || 'Buyer'}
                                </span>
                                <span className={`text-xs block ${role === 'guest' ? 'text-teal-600' : 'text-slate-500'}`}>
                                    {t('auth.role.buyer_desc') || 'I want to book stays'}
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setRole('host')}
                                className={`p-4 rounded-xl border-2 text-left transition-all ${role === 'host'
                                    ? 'border-teal-600 bg-teal-50 ring-1 ring-teal-600'
                                    : 'border-slate-200 hover:border-teal-200 hover:bg-slate-50'
                                    }`}
                            >
                                <span className={`block font-bold mb-1 ${role === 'host' ? 'text-teal-800' : 'text-slate-700'}`}>
                                    {t('auth.role.seller') || 'Seller'}
                                </span>
                                <span className={`text-xs block ${role === 'host' ? 'text-teal-600' : 'text-slate-500'}`}>
                                    {t('auth.role.seller_desc') || 'I want to list properties'}
                                </span>
                            </button>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">{t('auth.name')}</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                                    placeholder="John Doe"
                                />
                            </div>
                        </div>
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
                            <label className="block text-sm font-medium text-slate-700 mb-1">{t('auth.password')}</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input
                                    type="password"
                                    required
                                    minLength={6}
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
                            {t('auth.submit.register')}
                        </button>

                        <div className="flex items-center gap-2 justify-center mt-6 text-sm text-slate-600">
                            <span>{t('auth.has_account')}</span>
                            <button
                                type="button"
                                onClick={openLogin}
                                className="text-primary font-semibold hover:underline"
                            >
                                {t('auth.submit.login')}
                            </button>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={handleOtpSubmit} className="space-y-6">
                        <div className="text-center space-y-2">
                            <h3 className="text-xl font-bold text-slate-900">Confirm your email address</h3>
                            <p className="text-slate-500">We sent a verification code to <strong>{email}</strong></p>
                            <p className="text-xs text-slate-400">Enter the code below to complete registration.</p>
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
                            Verify & Register
                        </button>
                    </form>
                )}
            </div>
        </Modal>
    );
};
