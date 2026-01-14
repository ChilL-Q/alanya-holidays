import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { useModal } from '../../context/ModalContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { AlertCircle, Loader2 } from 'lucide-react';

export const RegisterModal: React.FC = () => {
    const { activeModal, closeModal, openLogin } = useModal();
    const { t } = useLanguage();
    const { register } = useAuth();

    const [role, setRole] = useState<'guest' | 'host'>('guest');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const isOpen = activeModal === 'register';

    const handleSubmit = async (e: React.FormEvent) => {
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
                closeModal();
                // Clear form
                setName('');
                setEmail('');
                setPassword('');
                setRole('guest');
            } else {
                setError(result.error || 'Failed to register');
            }
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={closeModal} title={t('auth.register.title')}>
            <div className="space-y-4">
                <p className="text-slate-600 mb-6">{t('auth.register.subtitle')}</p>

                {error && (
                    <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
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
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                            placeholder="John Doe"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t('auth.email')}</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                            placeholder="hello@example.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t('auth.password')}</label>
                        <input
                            type="password"
                            required
                            minLength={6}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading && <Loader2 size={18} className="animate-spin" />}
                        {t('auth.submit.register')}
                    </button>
                </form>

                <div className="flex items-center gap-2 justify-center mt-6 text-sm text-slate-600">
                    <span>{t('auth.has_account')}</span>
                    <button
                        onClick={openLogin}
                        className="text-primary font-semibold hover:underline"
                    >
                        {t('auth.submit.login')}
                    </button>
                </div>
            </div>
        </Modal>
    );
};
