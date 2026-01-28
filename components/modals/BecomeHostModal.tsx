import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Home, Check, X } from 'lucide-react';
import { Button } from '../ui/Button';

interface BecomeHostModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isLoading?: boolean;
}

export const BecomeHostModal: React.FC<BecomeHostModalProps> = ({ isOpen, onClose, onConfirm, isLoading }) => {
    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-slate-900 p-6 text-left align-middle shadow-xl transition-all border border-slate-100 dark:border-slate-800">
                                <div className="text-center">
                                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-teal-500/20">
                                        <Home className="text-white h-8 w-8" />
                                    </div>
                                    <Dialog.Title
                                        as="h3"
                                        className="text-xl font-bold leading-6 text-slate-900 dark:text-white"
                                    >
                                        Upgrade to Host Account
                                    </Dialog.Title>
                                    <div className="mt-2">
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            Become a host to start listing your properties and services. You'll get access to:
                                        </p>
                                    </div>

                                    <div className="mt-6 space-y-3 text-left bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
                                        <div className="flex items-start gap-3">
                                            <div className="p-1 bg-teal-100 dark:bg-teal-900/30 rounded-full text-teal-600 dark:text-teal-400 mt-0.5">
                                                <Check size={12} strokeWidth={3} />
                                            </div>
                                            <p className="text-sm text-slate-700 dark:text-slate-300">Property & Service Dashboard</p>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="p-1 bg-teal-100 dark:bg-teal-900/30 rounded-full text-teal-600 dark:text-teal-400 mt-0.5">
                                                <Check size={12} strokeWidth={3} />
                                            </div>
                                            <p className="text-sm text-slate-700 dark:text-slate-300">Calendar & Booking Management</p>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="p-1 bg-teal-100 dark:bg-teal-900/30 rounded-full text-teal-600 dark:text-teal-400 mt-0.5">
                                                <Check size={12} strokeWidth={3} />
                                            </div>
                                            <p className="text-sm text-slate-700 dark:text-slate-300">Direct Messaging with Guests</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 flex gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={onClose}
                                        className="flex-1"
                                        disabled={isLoading}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="primary"
                                        onClick={onConfirm}
                                        className="flex-1 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 border-none text-white shadow-lg shadow-teal-500/20"
                                        isLoading={isLoading}
                                    >
                                        Confirm Upgrade
                                    </Button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};
