import React, { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';

export interface EmptyStateProps {
  icon: LucideIcon | ReactNode | React.ElementType;
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
    icon?: ReactNode;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  const renderIcon = () => {
    if (React.isValidElement(Icon)) {
      return Icon;
    }
    if (typeof Icon === 'function' || (typeof Icon === 'object' && Icon !== null)) {
      const IconComponent = Icon as React.ElementType;
      return <IconComponent className="w-8 h-8" aria-hidden="true" />;
    }
    return null;
  };

  return (
    <div
      role="region"
      aria-label={title}
      className={`py-12 px-4 text-center rounded-2xl bg-slate-50/50 border border-dashed border-slate-200 max-w-lg mx-auto ${className}`}
    >
      <div className="w-16 h-16 rounded-2xl bg-primary-500/10 text-primary-600 flex items-center justify-center mx-auto mb-4">
        {renderIcon()}
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-1">{title}</h3>
      {description && <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">{description}</p>}
      {action &&
        (action.href ? (
          <Link
            to={action.href}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-medium text-sm transition-all shadow-xs"
          >
            {action.label}
            {action.icon}
          </Link>
        ) : (
          <button
            type="button"
            onClick={action.onClick}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-medium text-sm transition-all shadow-xs cursor-pointer"
          >
            {action.label}
            {action.icon}
          </button>
        ))}
    </div>
  );
}

export default EmptyState;
