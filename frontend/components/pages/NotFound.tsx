import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Search, ArrowLeft, HelpCircle } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-2xl w-full text-center animate-fade-up">
        {/* 404 Number */}
        <div className="text-9xl font-bold text-slate-200 dark:text-slate-800 select-none mb-8">
          404
        </div>

        {/* Icon */}
        <div className="w-24 h-24 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
          <Search size={48} className="text-slate-400" />
        </div>

        {/* Title & Description */}
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
          Page Not Found
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 mb-10 max-w-md mx-auto leading-relaxed">
          The page you're looking for doesn't exist or has been moved.
          Let's get you back on track.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <Link
            to="/"
            className="group flex items-center gap-2 px-8 py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold shadow-lg shadow-teal-600/20 transition-all hover:scale-105 active:scale-95"
          >
            <Home size={20} />
            Back to Home
          </Link>

          <Link
            to="/search-results"
            className="group flex items-center gap-2 px-8 py-4 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl font-semibold transition-all hover:scale-105 active:scale-95"
          >
            <Search size={20} />
            Explore Properties
          </Link>
        </div>

        {/* Help Section */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-100 dark:border-slate-800/50 max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <HelpCircle size={24} className="text-teal-600 dark:text-cyan-400" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Need Help?
            </h3>
          </div>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            If you believe this is an error, please contact our support team.
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 text-teal-600 dark:text-cyan-400 hover:underline font-medium"
          >
            Contact Support
            <ArrowLeft size={16} className="rotate-180" />
          </Link>
        </div>
      </div>
    </div>
  );
};
