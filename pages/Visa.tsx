import React from 'react';
import { FileCheck, Clock, ShieldCheck, Globe, CheckCircle } from 'lucide-react';

export const Visa: React.FC = () => {
    return (
        <div className="pt-24 pb-16 min-h-screen bg-slate-50 dark:bg-slate-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <span className="text-teal-600 dark:text-teal-400 font-semibold tracking-wider text-sm uppercase mb-2 block">Bureaucracy Simplified</span>
                    <h1 className="text-4xl md:text-5xl font-serif text-slate-900 dark:text-white mb-6">Visa & Residence Permits</h1>
                    <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                        Navigating Turkish immigration laws can be complex. Let our experts handle the paperwork while you enjoy your stay.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                    {/* Tourist Visa */}
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden group animate-stagger-enter" style={{ animationDelay: '0ms' }}>
                        {/* ... content ... */}
                    </div >

                    {/* Residence Permit */}
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden group animate-stagger-enter" style={{ animationDelay: '150ms' }}>
                        {/* ... content ... */}
                    </div>
                </div>

                {/* FAQ or Info Section */}
                <div className="bg-teal-900 rounded-2xl p-8 md:p-12 text-white">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <Clock size={48} className="text-teal-300 shrink-0" />
                        <div>
                            <h3 className="text-2xl font-bold mb-2">Why use our service?</h3>
                            <p className="text-teal-100 leading-relaxed">
                                Rules change frequently. We stay updated with the latest regulations from the Presidency of Migration Management to ensure your application has the highest chance of approval.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
