import React, { useState } from 'react';
import { Phone, ArrowLeft, ShieldCheck, Loader2, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { messagesService } from '../api-services/api/misc';

export const VisaConsult: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [submitted, setSubmitted] = useState(false);

    if (submitted) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-24 pb-12 px-4">
                <div className="max-w-2xl mx-auto text-center py-16">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle size={40} />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                        {t('visa.consult.form.success')}
                    </h2>
                    <button
                        onClick={() => navigate('/')}
                        className="mt-6 text-teal-600 dark:text-cyan-400 font-medium hover:underline"
                    >
                        {t('list_prop.back')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-24 pb-12 px-4">
            <div className="max-w-2xl mx-auto">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white mb-8 transition-colors"
                >
                    <ArrowLeft size={20} />
                    {t('list_prop.back')}
                </button>

                <div className="bg-white dark:bg-slate-800/80 rounded-3xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-800/50">
                    <div className="bg-teal-600 dark:bg-cyan-600 p-8 text-center">
                        <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 text-white">
                            <ShieldCheck size={40} />
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">{t('visa.consult.title')}</h1>
                        <p className="text-teal-100 text-lg">{t('visa.consult.subtitle')}</p>
                    </div>

                    <div className="p-8 md:p-12">
                        <p className="text-lg text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
                            {t('visa.consult.desc')}
                        </p>

                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-8 border border-slate-200 dark:border-slate-800/50 mb-8">
                            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">{t('visa.consult.agent')}</h3>
                            <a
                                href="https://wa.me/905300846177"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-3 text-3xl font-bold text-slate-900 dark:text-white hover:text-teal-600 dark:text-cyan-400 dark:hover:text-teal-400 transition-colors"
                            >
                                <Phone className="mt-1" />
                                +90 530 084 61 77
                            </a>
                            <p className="text-sm text-slate-400 mt-4">{t('visa.consult.availability')}</p>
                        </div>

                        <VisaConsultForm onSuccess={() => setSubmitted(true)} />

                        <p className="text-sm text-slate-400 max-w-sm mx-auto mt-6 text-center">
                            {t('visa.consult.disclaimer')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

interface VisaConsultFormProps {
    onSuccess: () => void;
}

const VisaConsultForm: React.FC<VisaConsultFormProps> = ({ onSuccess }) => {
    const { t } = useLanguage();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        visa_type: 'tourist',
        message: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await messagesService.sendMessage({
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                visa_type: formData.visa_type,
                message: `[${formData.visa_type.toUpperCase()}] ${formData.message}`,
            });
            onSuccess();
        } catch {
            alert(t('visa.consult.form.error'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white text-center">
                {t('visa.consult.form.title')}
            </h3>

            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    {t('visa.consult.form.name')}
                </label>
                <input
                    required
                    type="text"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/50 focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder={t('visa.consult.form.name')}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        {t('visa.consult.form.email')}
                    </label>
                    <input
                        required
                        type="email"
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/50 focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        placeholder="email@example.com"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        {t('visa.consult.form.phone')}
                    </label>
                    <input
                        required
                        type="tel"
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/50 focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+90 5XX XXX XX XX"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    {t('visa.consult.form.visa_type')}
                </label>
                <select
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/50 focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                    value={formData.visa_type}
                    onChange={e => setFormData({ ...formData, visa_type: e.target.value })}
                >
                    <option value="tourist">{t('visa.consult.form.visa_type.tourist')}</option>
                    <option value="residence">{t('visa.consult.form.visa_type.residence')}</option>
                    <option value="other">{t('visa.consult.form.visa_type.other')}</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    {t('visa.consult.form.message')}
                </label>
                <textarea
                    required
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/50 focus:ring-2 focus:ring-teal-500 outline-none transition-all resize-none"
                    value={formData.message}
                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                    placeholder={t('visa.consult.form.message')}
                />
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-teal-600 dark:bg-cyan-600 hover:bg-teal-700 dark:hover:bg-cyan-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-teal-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {isLoading ? (
                    <>
                        <Loader2 size={20} className="animate-spin" />
                        Sending...
                    </>
                ) : (
                    t('visa.consult.form.submit')
                )}
            </button>
        </form>
    );
};
