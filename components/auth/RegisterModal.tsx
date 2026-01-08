import React from 'react';
import { Modal } from '../ui/Modal';
import { useModal } from '../../context/ModalContext';
import { useLanguage } from '../../context/LanguageContext';

export const RegisterModal: React.FC = () => {
    const { activeModal, closeModal, openLogin } = useModal();
    const { t } = useLanguage();

    const isOpen = activeModal === 'register';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Simulate registration
        closeModal();
    };

    return (
        <Modal isOpen={isOpen} onClose={closeModal} title={t('auth.register.title')}>
            <div className="space-y-4">
                <p className="text-slate-600 mb-6">{t('auth.register.subtitle')}</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t('auth.name')}</label>
                        <input
                            type="text"
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                            placeholder="John Doe"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t('auth.email')}</label>
                        <input
                            type="email"
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                            placeholder="hello@example.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t('auth.password')}</label>
                        <input
                            type="password"
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-lg transition-colors"
                    >
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
