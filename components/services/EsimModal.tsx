import React from 'react';
import { Modal } from '../ui/Modal';
import { Check, Copy, ExternalLink, Smartphone, Info, Zap } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface EsimModalProps {
    isOpen: boolean;
    onClose: () => void;
    plan: {
        id: string;
        name: string;
        price: string;
        data: string;
        days: string;
    };
    onConfirm: () => void;
}

export const EsimModal: React.FC<EsimModalProps> = ({
    isOpen,
    onClose,
    plan,
    onConfirm
}) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="eSIM Selection"
            maxWidth="md"
        >
            <div className="space-y-6">
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 mb-4">
                        <Smartphone size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Review Your Plan</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Ready to stay connected in Turkey?</p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-700">
                    <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Selected Plan</p>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-slate-500 dark:text-slate-400">Total Price</p>
                            <p className="text-xl font-bold text-teal-600 dark:text-teal-400">{plan.price}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                                <Zap size={18} className="text-teal-500" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Data</p>
                                <p className="text-sm font-bold dark:text-white">{plan.data} GB</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                                <Check size={18} className="text-teal-500" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Validity</p>
                                <p className="text-sm font-bold dark:text-white">{plan.days} Days</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/50 flex gap-3">
                    <Info className="text-blue-600 dark:text-blue-400 shrink-0" size={20} />
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                        You will be redirected to the <strong>Yesim</strong> regional checkout page for {plan.name.split(' ')[0]}. Follow the instructions there to complete your purchase and get your QR code instantly.
                    </p>
                </div>

                <div className="space-y-3">
                    <button
                        onClick={onConfirm}
                        className="flex items-center justify-center gap-2 w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-lg shadow-slate-200 dark:shadow-none"
                    >
                        Proceed to Secure Checkout
                        <ExternalLink size={18} />
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full py-3 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors text-sm font-medium"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </Modal>
    );
};
