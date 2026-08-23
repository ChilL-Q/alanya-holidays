import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void | Promise<void>;
  variant?: 'inline' | 'card' | 'fullscreen';
  className?: string;
}

export function ErrorState({
  title = 'Unable to load content',
  message = 'An unexpected error occurred. Please check your connection and try again.',
  onRetry,
  variant = 'card',
  className = '',
}: ErrorStateProps) {
  if (variant === 'inline') {
    return (
      <div
        role="alert"
        aria-live="polite"
        className={`p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-rose-800 ${className}`}
      >
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" aria-hidden="true" />
          <p className="text-sm font-medium">{message}</p>
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={() => void onRetry()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold hover:bg-rose-100/50 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
            Retry
          </button>
        )}
      </div>
    );
  }

  if (variant === 'fullscreen') {
    return (
      <div
        role="alert"
        aria-live="polite"
        className={`min-h-[60vh] w-full flex items-center justify-center p-6 ${className}`}
      >
        <div className="py-12 px-6 text-center rounded-2xl bg-rose-50/60 border border-dashed border-rose-200 max-w-lg w-full">
          <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7" aria-hidden="true" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">{title}</h3>
          <p className="text-sm text-slate-600 mb-6 max-w-sm mx-auto">{message}</p>
          {onRetry && (
            <button
              type="button"
              onClick={() => void onRetry()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium text-sm transition-all shadow-xs cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`py-12 px-6 text-center rounded-2xl bg-rose-50/50 border border-dashed border-rose-200 max-w-lg mx-auto ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="w-7 h-7" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-600 mb-6 max-w-sm mx-auto">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={() => void onRetry()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium text-sm transition-all shadow-xs cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
          Try Again
        </button>
      )}
    </div>
  );
}

export default ErrorState;
