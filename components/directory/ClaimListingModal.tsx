import React, { useState, useEffect } from 'react';
import { X, Check, Info, ArrowRight, ArrowLeft, Loader2, Clock } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { db } from '../../api-services';
import { DirectoryListingDB } from '../../types/models';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';

interface ClaimListingModalProps {
    isOpen: boolean;
    onClose: () => void;
    listing: DirectoryListingDB;
}

export const ClaimListingModal: React.FC<ClaimListingModalProps> = ({ isOpen, onClose, listing }) => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        phone: '',
        role: '',
        additional_notes: '',
        business_name: '',
        contact_phone: '',
        whatsapp: '',
        website: '',
        address: '',
        description: '',
    });

    // Reset and initialize data on open/listing change
    useEffect(() => {
        if (isOpen && listing) {
            setStep(1);
            setError(null);
            setFormData({
                phone: '',
                role: '',
                additional_notes: '',
                business_name: listing.name || '',
                contact_phone: listing.whatsapp || '',
                whatsapp: listing.whatsapp || '',
                website: listing.website || '',
                address: listing.location || '',
                description: listing.short_description || '',
            });
        }
    }, [isOpen, listing]);

    const handleStep1Submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.phone || !formData.role) {
            toast.error(t('auth.error.required') || 'Please fill in all required fields');
            return;
        }
        setError(null);
        setStep(2);
    };

    const handleFinalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.business_name || !formData.contact_phone || !formData.description) {
            toast.error(t('auth.error.required') || 'Please fill in all required fields');
            return;
        }

        if (!user?.email) {
            toast.error('User email not found. Please log in again.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await db.submitListingClaim({
                listing_id: listing.id,
                email: user.email,
                phone: formData.phone,
                role: formData.role,
                additional_notes: formData.additional_notes,
                business_name: formData.business_name,
                contact_phone: formData.contact_phone,
                whatsapp: formData.whatsapp,
                website: formData.website,
                address: formData.address,
                description: formData.description,
            });

            setStep(3);
            toast.success(t('directory.claim.submitted') || 'Claim submitted! Check your email to verify.');
            setTimeout(() => {
                onClose();
            }, 2000);
        } catch (err: any) {
            console.error('Claim submission error:', err);
            setError(err.message || 'An error occurred while submitting your claim.');
            toast.error(err.message || 'An error occurred while submitting your claim.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            maxWidth="2xl"
            noPadding={true}
            hideCloseButton={true}
        >
            <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800/50 px-6 py-5 rounded-t-2xl flex items-center justify-between z-10">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                            {step === 3
                                ? t('directory.claim.modal.success.title')
                                : t('directory.claim.modal.title')}
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {listing.name} &mdash; {t(`dir.cat.${listing.category_id}`) || listing.category_id}
                        </p>
                    </div>
                    {step !== 3 && (
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>

                {/* Step Progress Indicators */}
                <div className="flex items-center justify-between px-6 py-4 bg-slate-50/50 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800/30 overflow-x-auto gap-4">
                    {/* Step 1 */}
                    <div className={`flex items-center gap-2 text-xs font-semibold whitespace-nowrap ${step === 1 ? 'text-teal-600 dark:text-cyan-400' : 'text-slate-500 dark:text-slate-400'}`}>
                        <div className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold ${step === 1 ? 'bg-teal-600 dark:bg-cyan-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                            1
                        </div>
                        {t('directory.claim.modal.step1')}
                    </div>
                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800 min-w-8" />

                    {/* Step 2 */}
                    <div className={`flex items-center gap-2 text-xs font-semibold whitespace-nowrap ${step === 2 ? 'text-teal-600 dark:text-cyan-400' : 'text-slate-500 dark:text-slate-400'}`}>
                        <div className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold ${step === 2 ? 'bg-teal-600 dark:bg-cyan-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                            2
                        </div>
                        {t('directory.claim.modal.step2')}
                    </div>
                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800 min-w-8" />

                    {/* Step 3 */}
                    <div className={`flex items-center gap-2 text-xs font-semibold whitespace-nowrap ${step === 3 ? 'text-teal-600 dark:text-cyan-400' : 'text-slate-500 dark:text-slate-400'}`}>
                        <div className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold ${step === 3 ? 'bg-teal-600 dark:bg-cyan-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                            3
                        </div>
                        {t('directory.claim.modal.step3')}
                    </div>
                </div>

                {/* Step Contents */}
                {step === 1 && (
                    <form onSubmit={handleStep1Submit} className="p-6 space-y-5">
                        <div className="bg-teal-50/50 dark:bg-cyan-950/10 border border-teal-100 dark:border-cyan-800/30 rounded-xl p-4 text-xs text-teal-800 dark:text-cyan-300 leading-relaxed flex items-start gap-2">
                            <Info size={16} className="mt-0.5 flex-shrink-0" />
                            <span>{t('directory.claim.modal.info')}</span>
                        </div>

                        {error && (
                            <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-xl p-4 text-xs text-red-700 dark:text-red-400">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="claim-phone" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                    {t('directory.claim.modal.phone')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="claim-phone"
                                    required
                                    type="tel"
                                    placeholder="+90 555 123 4567"
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="claim-role" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                {t('directory.claim.modal.role')?.replace('{name}', listing.name)} <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="claim-role"
                                required
                                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all appearance-none cursor-pointer"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M6 8L1 3h10z' fill='%23666'/%3E%3C/svg%3E")`,
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'right 16px center',
                                    paddingRight: '40px',
                                }}
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            >
                                <option value="">{t('directory.claim.modal.role.select')}</option>
                                <option value="owner">{t('directory.claim.modal.role.owner')}</option>
                                <option value="manager">{t('directory.claim.modal.role.manager')}</option>
                                <option value="marketing">{t('directory.claim.modal.role.marketing')}</option>
                                <option value="employee">{t('directory.claim.modal.role.employee')}</option>
                                <option value="other">{t('directory.claim.modal.role.other')}</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="claim-notes" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                {t('directory.claim.modal.notes')}
                            </label>
                            <textarea
                                id="claim-notes"
                                rows={3}
                                maxLength={300}
                                placeholder={t('directory.claim.modal.notes.placeholder') || 'Tell us how you are connected...'}
                                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all resize-none"
                                value={formData.additional_notes}
                                onChange={(e) => setFormData({ ...formData, additional_notes: e.target.value })}
                            />
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
                            >
                                {t('directory.claim.modal.cancel')}
                            </button>
                            <button
                                type="submit"
                                className="inline-flex items-center justify-center rounded-full font-semibold whitespace-nowrap cursor-pointer transition-all duration-200 bg-teal-600 hover:bg-teal-700 dark:bg-cyan-500 dark:hover:bg-cyan-600 text-white px-6 py-3 text-sm flex gap-2"
                            >
                                {t('directory.claim.modal.continue')}
                                <ArrowRight size={16} />
                            </button>
                        </div>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleFinalSubmit} className="p-6 space-y-5">
                        {error && (
                            <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-xl p-4 text-xs text-red-700 dark:text-red-400">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="edit-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                    {t('directory.claim.modal.business_name')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="edit-name"
                                    required
                                    type="text"
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                                    value={formData.business_name}
                                    onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label htmlFor="edit-phone" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                    {t('directory.claim.modal.contact_phone')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="edit-phone"
                                    required
                                    type="tel"
                                    placeholder="+90 555 123 4567"
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                                    value={formData.contact_phone}
                                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="edit-whatsapp" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                    {t('directory.claim.modal.whatsapp')}
                                </label>
                                <input
                                    id="edit-whatsapp"
                                    type="tel"
                                    placeholder="+90 555 123 4567"
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                                    value={formData.whatsapp}
                                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                                />
                            </div>
                            <div>
                                <label htmlFor="edit-website" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                    {t('directory.claim.modal.website')}
                                </label>
                                <input
                                    id="edit-website"
                                    type="url"
                                    placeholder="https://www.yourbusiness.com"
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                                    value={formData.website}
                                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="edit-address" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                {t('directory.claim.modal.address')}
                            </label>
                            <input
                                id="edit-address"
                                type="text"
                                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            />
                        </div>

                        <div>
                            <label htmlFor="edit-description" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                {t('directory.claim.modal.description')} <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                id="edit-description"
                                required
                                rows={4}
                                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all resize-none"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
                            >
                                <ArrowLeft size={16} />
                                {t('list_prop.back')}
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="inline-flex items-center justify-center rounded-full font-semibold whitespace-nowrap cursor-pointer transition-all duration-200 bg-teal-600 hover:bg-teal-700 dark:bg-cyan-500 dark:hover:bg-cyan-600 text-white px-6 py-3 text-sm flex gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        {t('directory.claim.modal.continue')}
                                        <ArrowRight size={16} />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )}

                {step === 3 && (
                    <div className="p-8 text-center bg-white dark:bg-slate-900">
                        <div className="w-16 h-16 mx-auto mb-5 flex items-center justify-center rounded-full bg-teal-50 dark:bg-cyan-950/20 text-teal-600 dark:text-cyan-400">
                            <Check size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                            {t('directory.claim.modal.success.title')}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm mx-auto mb-6 leading-relaxed">
                            {t('directory.claim.modal.success.desc')
                                ?.replace('{name}', listing.name)
                                ?.replace('{email}', user?.email || 'your email')}
                        </p>

                        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/40 rounded-xl p-4 max-w-sm mx-auto mb-6">
                            <div className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed text-left">
                                <Clock size={16} className="mt-0.5 flex-shrink-0 text-slate-500" />
                                <div>
                                    <p className="font-semibold mb-1">
                                        {t('directory.claim.modal.success.next')}
                                    </p>
                                    <ol className="list-decimal pl-4 space-y-1 text-slate-600 dark:text-slate-400">
                                        <li>{t('directory.claim.modal.success.next.step1')}</li>
                                        <li>{t('directory.claim.modal.success.next.step2')}</li>
                                        <li>{t('directory.claim.modal.success.next.step3')}</li>
                                        <li>{t('directory.claim.modal.success.next.step4')}</li>
                                    </ol>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="inline-flex items-center justify-center rounded-full font-semibold whitespace-nowrap cursor-pointer transition-all duration-200 bg-slate-900 dark:bg-white text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-100 px-8 py-3 text-base"
                        >
                            {t('directory.claim.modal.close')}
                        </button>
                    </div>
                )}
            </div>
        </Modal>
    );
};
