import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'full';
  className?: string;
  label?: string;
}

export default function LoadingSpinner({
  size = 'full',
  className = '',
  label = 'Loading...',
}: LoadingSpinnerProps) {
  const spinner = (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center gap-3 ${className}`}
    >
      <div
        className={`rounded-full border-primary-500/20 border-t-primary-500 animate-spin ${
          size === 'sm'
            ? 'w-5 h-5 border-2'
            : size === 'md'
            ? 'w-8 h-8 border-3'
            : 'w-12 h-12 border-4'
        }`}
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </div>
  );

  if (size === 'full') {
    return (
      <div className="min-h-[60vh] w-full flex items-center justify-center bg-background-50">
        {spinner}
      </div>
    );
  }

  return spinner;
}
