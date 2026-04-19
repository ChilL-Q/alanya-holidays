import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, BookOpen, Clock, Mail } from 'lucide-react';

export const BlogSubmissionSuccess: React.FC = () => {
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get('session_id');

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-24 pb-16 flex items-center">
            <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

                {/* Icon */}
                <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center">
                        <CheckCircle size={40} className="text-teal-600 dark:text-cyan-400" />
                    </div>
                </div>

                {/* Heading */}
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
                    Submission Received!
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                    Thank you for submitting your article. Payment confirmed — our editorial team will review it shortly.
                </p>

                {/* Steps */}
                <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-6 mb-8 text-left space-y-4">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center shrink-0">
                            <CheckCircle size={16} className="text-teal-600 dark:text-cyan-400" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Payment confirmed</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">€5 publication fee received</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center shrink-0">
                            <Clock size={16} className="text-slate-400" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Editorial review</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Usually 2–3 business days</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center shrink-0">
                            <Mail size={16} className="text-slate-400" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Email notification</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">You'll be emailed when your article is published or if we need changes</p>
                        </div>
                    </div>
                </div>

                {sessionId && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 mb-6">
                        Reference: {sessionId}
                    </p>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                        to="/blog"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl transition-colors"
                    >
                        <BookOpen size={16} />
                        Browse the Blog
                    </Link>
                    <Link
                        to="/profile"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                        Go to Profile
                    </Link>
                </div>

            </div>
        </div>
    );
};
