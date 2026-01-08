import React from 'react';
import { Shield, Users, Heart } from 'lucide-react';

export const About: React.FC = () => {
    return (
        <div className="pt-24 pb-16 min-h-screen bg-slate-50 dark:bg-slate-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-serif text-slate-900 dark:text-white mb-4">Discover Alanya</h1>
                    <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                        We’re revolutionizing travel by making it more affordable and ethical for everyone.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-24">
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm">
                        <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center text-teal-600 dark:text-teal-400 mb-6">
                            <Shield size={24} />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">0% Guest Fees</h3>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                            Unlike major platforms that charge 14-20% in fees, we believe travel should be affordable for everyone.
                            Save up to $200 per booking when you choose Alanya Holidays.
                        </p>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm">
                        <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center text-teal-600 dark:text-teal-400 mb-6">
                            <Users size={24} />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">7% Host Fees Only</h3>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                            Fair commission structure that benefits both hosts and guests, creating a sustainable travel ecosystem.
                            We offer the lowest host fees in Turkey.
                        </p>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm">
                        <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center text-teal-600 dark:text-teal-400 mb-6">
                            <Heart size={24} />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Ethical Travel</h3>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                            We stand for transparency and social consciousness, supporting communities without compromising values.
                            Travel with purpose.
                        </p>
                    </div>
                </div>

                <div className="bg-teal-900 rounded-3xl p-12 text-center text-white">
                    <h2 className="text-3xl font-serif mb-6">Join the Ethical Travel Movement</h2>
                    <p className="text-lg text-teal-100 max-w-2xl mx-auto mb-8">
                        Starting in Alanya and expanding across Turkey, we’re proving that affordable, ethical travel is possible. Be part of the change that puts communities first.
                    </p>
                </div>
            </div>
        </div>
    );
};
