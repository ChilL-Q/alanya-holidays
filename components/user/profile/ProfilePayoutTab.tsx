import React from 'react';
import { Banknote, Wallet, Save } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';

interface ProfilePayoutTabProps {
    payoutForm: { iban: string; bankName: string; bankAccountHolderName: string; cryptoWallet: string };
    setPayoutForm: React.Dispatch<React.SetStateAction<any>>;
    savingPayout: boolean;
    handleUpdatePayout: (e: React.FormEvent) => void;
}

export const ProfilePayoutTab: React.FC<ProfilePayoutTabProps> = ({
    payoutForm,
    setPayoutForm,
    savingPayout,
    handleUpdatePayout
}) => {
    const { t } = useLanguage();

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="bg-white dark:bg-slate-800/80 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800/50 p-8">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{t('profile.payout_details') || 'Payout Details'}</h2>
                <p className="text-slate-500 mb-8">Set up how you want to receive your earnings from listings.</p>

                <form onSubmit={handleUpdatePayout} className="space-y-8 max-w-2xl">
                    <div className="space-y-6">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Banknote className="text-teal-600 dark:text-cyan-400 " size={20} />
                            Bank Transfer (IBAN)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">IBAN</label>
                                <input
                                    type="text"
                                    value={payoutForm.iban}
                                    onChange={(e) => setPayoutForm({ ...payoutForm, iban: e.target.value })}
                                    placeholder="TR00 0000 0000 0000 0000 0000 00"
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/50 rounded-xl focus:ring-2 focus:ring-primary outline-none dark:text-white font-mono"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Bank Name</label>
                                <input
                                    type="text"
                                    value={payoutForm.bankName}
                                    onChange={(e) => setPayoutForm({ ...payoutForm, bankName: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/50 rounded-xl focus:ring-2 focus:ring-primary outline-none dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Account Holder Name</label>
                                <input
                                    type="text"
                                    value={payoutForm.bankAccountHolderName}
                                    onChange={(e) => setPayoutForm({ ...payoutForm, bankAccountHolderName: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/50 rounded-xl focus:ring-2 focus:ring-primary outline-none dark:text-white"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-slate-100 dark:border-slate-800/50 space-y-6">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Wallet className="text-orange-500" size={20} />
                            Crypto Wallet (USDT/USDC)
                        </h3>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Wallet Address (TRC20 / ERC20 / BEP20)</label>
                            <input
                                type="text"
                                value={payoutForm.cryptoWallet}
                                onChange={(e) => setPayoutForm({ ...payoutForm, cryptoWallet: e.target.value })}
                                placeholder="0x... or T..."
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/50 rounded-xl focus:ring-2 focus:ring-primary outline-none dark:text-white font-mono"
                            />
                            <p className="text-xs text-slate-500 mt-2">Please ensure the network type is clearly specified if needed in notes.</p>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800/50">
                        <button
                            type="submit"
                            disabled={savingPayout}
                            className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {savingPayout ? t('auth.submitting') : (
                                <>
                                    <Save size={18} />
                                    Save Payout Details
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
