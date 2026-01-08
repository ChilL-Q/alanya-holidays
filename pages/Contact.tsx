import React from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';

export const Contact: React.FC = () => {
    return (
        <div className="pt-24 pb-16 min-h-screen bg-slate-50 dark:bg-slate-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-serif text-slate-900 dark:text-white mb-4">Contact Us</h1>
                    <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                        We're here to help with any questions about your booking or our services.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-16">
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm text-center">
                        <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center text-teal-600 dark:text-teal-400 mb-6 mx-auto">
                            <Phone size={24} />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Phone</h3>
                        <p className="text-slate-600 dark:text-slate-400">+14389294208</p>
                        <p className="text-sm text-slate-500 mt-1">Mon-Sun 9:00-22:00</p>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm text-center">
                        <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center text-teal-600 dark:text-teal-400 mb-6 mx-auto">
                            <Mail size={24} />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Email</h3>
                        <p className="text-slate-600 dark:text-slate-400">service.dep.hq@gmail.com</p>
                        <p className="text-sm text-slate-500 mt-1">Response within 24h</p>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm text-center">
                        <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center text-teal-600 dark:text-teal-400 mb-6 mx-auto">
                            <MapPin size={24} />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Office</h3>
                        <p className="text-slate-600 dark:text-slate-400">Kesefli Mah. Alanya, Turkiye</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
