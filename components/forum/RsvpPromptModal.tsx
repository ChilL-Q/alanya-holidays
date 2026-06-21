import React, { useState, useEffect } from 'react';
import { MessageCircle, Loader2 } from 'lucide-react';
import { Modal } from '../ui/Modal';

interface RsvpPromptModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (contactPhone: string) => void;
    eventTitle: string;
    busy?: boolean;
}

const digitCount = (s: string) => (s.match(/\d/g) || []).length;

export const RsvpPromptModal: React.FC<RsvpPromptModalProps> = ({ isOpen, onClose, onConfirm, eventTitle, busy }) => {
    const [phone, setPhone] = useState('');

    useEffect(() => {
        if (isOpen) setPhone('');
    }, [isOpen]);

    const valid = digitCount(phone) >= 7;

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!valid || busy) return;
        onConfirm(phone.trim());
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} maxWidth="sm" title="Reserve your spot">
            <form onSubmit={submit}>
                <div className="flex items-start gap-3 mb-4">
                    <span className="grid place-items-center w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 shrink-0">
                        <MessageCircle size={20} />
                    </span>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                        Please leave your WhatsApp number so the organizer can contact you about
                        <span className="font-semibold text-slate-800 dark:text-slate-100"> {eventTitle}</span>.
                    </p>
                </div>

                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">WhatsApp number</label>
                <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+90 5xx xxx xx xx"
                    autoFocus
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />

                <div className="flex gap-3 mt-5">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={!valid || busy}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {busy ? <Loader2 size={16} className="animate-spin" /> : null}
                        Confirm RSVP
                    </button>
                </div>
            </form>
        </Modal>
    );
};
