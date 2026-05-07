import React from 'react';
import { Home, RefreshCw, AlertTriangle } from 'lucide-react';

interface ServerErrorProps {
  error?: Error | null;
  onReset?: () => void;
}

export const ServerError: React.FC<ServerErrorProps> = ({ error, onReset }) => {
  const handleReset = () => {
    if (onReset) {
      onReset();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 text-center shadow-xl border border-slate-100 dark:border-slate-800/50 animate-fade-up">
        <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <AlertTriangle size={32} />
        </div>
        
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Something went wrong
        </h2>
        
        <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed text-sm">
          We're sorry, but the application encountered an unexpected error.
          Please try again or return to the home page.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
            onClick={handleReset}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 hover:bg-black dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl font-semibold transition-colors"
            >
            <RefreshCw size={18} />
            Try Again
            </button>
            
            {/* Use an anchor tag here since the router might be broken */}
            <a
            href="/"
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl font-semibold transition-colors"
            >
            <Home size={18} />
            Home
            </a>
        </div>
        
        {import.meta.env.DEV && error && (
          <div className="mt-8 text-left bg-slate-100 dark:bg-slate-950 p-4 rounded-xl overflow-auto text-xs text-slate-600 dark:text-slate-400 font-mono">
            {error.toString()}
          </div>
        )}
      </div>
    </div>
  );
};
