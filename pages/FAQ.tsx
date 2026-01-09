import React from 'react';
import { HelpCircle, ChevronDown } from 'lucide-react';

export const FAQ: React.FC = () => {
    return (
        <div className="pt-24 pb-16 min-h-screen bg-slate-50 dark:bg-slate-900">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-serif text-slate-900 dark:text-white mb-4">Frequently Asked Questions</h1>
                    <p className="text-xl text-slate-600 dark:text-slate-400">
                        Find answers to common questions about booking, payments, and our services.
                    </p>
                </div>

                <div className="space-y-6">
                    {/* Q1 */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                            <HelpCircle size={20} className="text-teal-500" />
                            How do I book a rental?
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                            Simply browse our listings, select your dates, and click "Book Now". We charge 0% guest fees, so the price you see is the price you pay.
                        </p>
                    </div>

                    {/* Q2 */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                            <HelpCircle size={20} className="text-teal-500" />
                            What is the cancellation policy?
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                            Cancellation policies vary by property. You can find specific details on each property's page under the "Policies" section.
                        </p>
                    </div>

                    {/* Q3 */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                            <HelpCircle size={20} className="text-teal-500" />
                            Do you offer airport transfers?
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                            Yes! We can arrange private airport transfers from Antalya (AYT) or Gazipaşa (GZP) airports directly to your rental. Check our Services page for details.
                        </p>
                    </div>

                    {/* Q4 */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                            <HelpCircle size={20} className="text-teal-500" />
                            Are there any hidden fees?
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                            No. We pride ourselves on transparency. We charge 0% service fees to guests. The only additional cost might be a cleaning fee if specified by the host.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
