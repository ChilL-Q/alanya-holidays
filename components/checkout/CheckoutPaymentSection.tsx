import React, { useState } from 'react';
import { CreditCard, Banknote, Shield, Bitcoin, Copy } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

type PaymentMethod = 'card' | 'bank' | 'crypto' | 'cash' | 'swift';

interface CheckoutPaymentSectionProps {
    paymentMethod: PaymentMethod;
    setPaymentMethod: (method: PaymentMethod) => void;
    total: number;
    convertAndFormat: (amount: number) => string;
    onPay: () => void;
    isProcessing: boolean;
    isDisabled: boolean;
}

export const CheckoutPaymentSection: React.FC<CheckoutPaymentSectionProps> = ({
    paymentMethod,
    setPaymentMethod,
    total,
    convertAndFormat,
    onPay,
    isProcessing,
    isDisabled
}) => {
    const { t } = useLanguage();
    const [copied, setCopied] = useState(false);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-white dark:bg-slate-800/80 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800/50 p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{t('checkout.payment')}</h2>
            <div className="grid grid-cols-2 gap-4 mb-6">
                {[
                    { id: 'card', icon: CreditCard, label: 'checkout.method.card' },
                    { id: 'cash', icon: Banknote, label: 'checkout.method.cash' },
                    { id: 'bank', icon: Shield, label: 'checkout.method.bank' },
                    { id: 'crypto', icon: Bitcoin, label: 'checkout.method.crypto' },
                    { id: 'swift', icon: Banknote, label: 'checkout.method.swift' }
                ].map((method) => (
                    <button
                        key={method.id}
                        onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                        className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition ${paymentMethod === method.id
                            ? 'border-teal-600 bg-teal-50 dark:bg-slate-800/50 text-teal-700 dark:text-cyan-400 dark:text-slate-200'
                            : 'border-slate-200 dark:border-slate-800/50 bg-white dark:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/80'
                            } ${method.id === 'swift' ? 'col-span-2 sm:col-span-1' : ''}`}
                    >
                        <method.icon className={paymentMethod === method.id ? 'text-teal-600 dark:text-cyan-400 dark:text-slate-200' : 'text-slate-400 dark:text-slate-400'} />
                        <span className={`text-sm font-bold ${paymentMethod === method.id ? 'text-teal-700 dark:text-cyan-400 dark:text-slate-200' : 'text-slate-600 dark:text-slate-300'}`}>{t(method.label)}</span>
                    </button>
                ))}
            </div>

            {/* Instruction Panels */}
            {paymentMethod === 'card' && (
                <div className="flex items-center gap-4 p-4 border border-slate-200 dark:border-slate-800/50 rounded-lg bg-slate-50 dark:bg-slate-800/50 mb-4 animate-in fade-in slide-in-from-top-2">
                    <CreditCard className="text-slate-400" />
                    <span className="text-slate-500 dark:text-slate-400 text-sm">You will be redirected to Stripe for secure payment</span>
                </div>
            )}

            {paymentMethod === 'cash' && (
                <div className="p-4 border border-orange-200 dark:border-slate-700/50 rounded-lg bg-orange-50 dark:bg-slate-800/50 mb-4 animate-in fade-in slide-in-from-top-2">
                    <p className="text-sm text-orange-800 dark:text-slate-200 font-medium mb-1">20% Non-refundable Deposit Required</p>
                    <p className="text-xs text-orange-600 dark:text-slate-200">
                        To secure your reservation with Cash on Arrival, we require a 20% deposit now via secure online payment. The remaining balance will be paid in cash upon arrival.
                    </p>
                </div>
            )}

            {paymentMethod === 'bank' && (
                <div className="p-4 border border-teal-100 dark:border-slate-700/50 rounded-lg bg-teal-50 dark:bg-slate-800/50 mb-4 animate-in fade-in slide-in-from-top-2">
                    <p className="text-sm text-teal-800 dark:text-cyan-400 dark:text-slate-200 font-medium mb-2">{t('checkout.method.bank_desc')}</p>
                    <div className="space-y-2 text-xs bg-white dark:bg-slate-900 p-3 rounded border border-teal-100 dark:border-slate-700/50">
                        <div className="flex justify-between items-center">
                            <span className="text-slate-500">Bank Name</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">Ziraat Bankası</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-500">Account Holder</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">Alanya Holidays Ltd.</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-500">IBAN</span>
                            <div className="flex items-center gap-2">
                                <code className="font-mono text-slate-700 dark:text-slate-300">TR12 3456 7890 1234 5678 9012 34</code>
                                <button onClick={() => copyToClipboard('TR12 3456 7890 1234 5678 9012 34')} className="text-teal-600 dark:text-cyan-400 dark:text-slate-200 hover:text-teal-800 dark:text-cyan-400 dark:hover:text-teal-300"><Copy size={12} /></button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {paymentMethod === 'crypto' && (
                <div className="p-4 border border-indigo-100 dark:border-indigo-900/50 rounded-lg bg-indigo-50 dark:bg-slate-800/50 mb-4 animate-in fade-in slide-in-from-top-2">
                    <p className="text-sm text-indigo-800 dark:text-slate-200 font-medium mb-2">{t('checkout.method.crypto_desc')}</p>
                    <div className="space-y-2 text-xs bg-white dark:bg-slate-900 p-3 rounded border border-indigo-100 dark:border-indigo-900">
                        <div className="flex justify-between items-center">
                            <span className="text-slate-500">Network</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">TRC20 (Tron)</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-500">USDT Address</span>
                            <div className="flex items-center gap-2">
                                <code className="font-mono text-slate-700 dark:text-slate-300 truncate max-w-[200px]">TVj...xYz</code>
                                <button onClick={() => copyToClipboard('TVj7...ExampleAddress...xYz')} className="text-indigo-600 dark:text-slate-200 hover:text-indigo-800 dark:hover:text-indigo-300"><Copy size={12} /></button>
                            </div>
                        </div>
                        <p className="text-[10px] text-amber-600 mt-1">⚠️ Please ensure you send only USDT on the TRC20 network.</p>
                    </div>
                </div>
            )}

            {paymentMethod === 'swift' && (
                <div className="p-4 border border-blue-100 dark:border-slate-700/50 rounded-lg bg-blue-50 dark:bg-slate-800/50 mb-4 animate-in fade-in slide-in-from-top-2">
                    <p className="text-sm text-blue-800 dark:text-slate-200 font-medium mb-2">{t('checkout.method.swift_desc')}</p>
                    <div className="space-y-2 text-xs bg-white dark:bg-slate-900 p-3 rounded border border-blue-100 dark:border-slate-700/50">
                        <div className="flex justify-between items-center">
                            <span className="text-slate-500">{t('checkout.bank_name')}</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">Garanti BBVA</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-500">{t('checkout.swift_bic')}</span>
                            <div className="flex items-center gap-2">
                                <code className="font-mono text-slate-700 dark:text-slate-300">GATRTRI2</code>
                                <button onClick={() => copyToClipboard('GATRTRI2')} className="text-blue-600 hover:text-blue-700"><Copy size={12} /></button>
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-500">{t('checkout.iban')}</span>
                            <div className="flex items-center gap-2">
                                <code className="font-mono text-slate-700 dark:text-slate-300">TR00 1234 5678 9000 0000 0000 00</code>
                                <button onClick={() => copyToClipboard('TR00 1234 5678 9000 0000 0000 00')} className="text-blue-600 hover:text-blue-700"><Copy size={12} /></button>
                            </div>
                        </div>
                        <p className="pt-2 text-[10px] text-slate-400 italic">{t('checkout.swift_ref')}</p>
                    </div>
                </div>
            )}

            <button
                onClick={onPay}
                disabled={isDisabled || isProcessing}
                data-testid="pay-button"
                className="w-full bg-teal-700 dark:bg-cyan-600 dark:bg-slate-800/50 text-white font-bold py-4 rounded-xl border-2 border-transparent hover:border-teal-500 dark:hover:border-teal-400 hover:bg-teal-800 dark:bg-cyan-600 dark:hover:bg-teal-700 dark:bg-cyan-600 shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {isProcessing ? (
                    <>Processing...</>
                ) : (
                    <>
                        {paymentMethod === 'cash' ? `Pay Deposit ${convertAndFormat(total * 0.2)}` : `${t('checkout.pay')} ${convertAndFormat(total)}`}
                    </>
                )}
            </button>
        </div>
    );
};
