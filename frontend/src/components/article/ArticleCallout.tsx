import React from "react";
import { Lightbulb, Info, AlertTriangle, Compass, Quote } from "lucide-react";

export type CalloutVariant = "tip" | "info" | "warning" | "insider" | "quote";

export interface ArticleCalloutProps {
  variant?: CalloutVariant;
  title?: string;
  content?: string;
  children?: React.ReactNode;
  className?: string;
}

interface VariantConfig {
  containerClass: string;
  iconClass: string;
  iconBgClass: string;
  IconComponent: React.ComponentType<{ className?: string }>;
}

const VARIANT_CONFIGS: Record<CalloutVariant, VariantConfig> = {
  tip: {
    containerClass:
      "bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 text-emerald-950 dark:text-emerald-50",
    iconClass: "text-emerald-600 dark:text-emerald-400",
    iconBgClass: "bg-emerald-100 dark:bg-emerald-900/50",
    IconComponent: Lightbulb,
  },
  info: {
    containerClass:
      "bg-sky-50/80 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800/60 text-sky-950 dark:text-sky-50",
    iconClass: "text-sky-600 dark:text-sky-400",
    iconBgClass: "bg-sky-100 dark:bg-sky-900/50",
    IconComponent: Info,
  },
  warning: {
    containerClass:
      "bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60 text-amber-950 dark:text-amber-50",
    iconClass: "text-amber-600 dark:text-amber-400",
    iconBgClass: "bg-amber-100 dark:bg-amber-900/50",
    IconComponent: AlertTriangle,
  },
  insider: {
    containerClass:
      "bg-purple-50/80 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800/60 text-purple-950 dark:text-purple-50",
    iconClass: "text-purple-600 dark:text-purple-400",
    iconBgClass: "bg-purple-100 dark:bg-purple-900/50",
    IconComponent: Compass,
  },
  quote: {
    containerClass:
      "bg-primary-50/80 dark:bg-primary-950/30 border-primary-200 dark:border-primary-800/60 text-foreground-900 dark:text-foreground-100",
    iconClass: "text-primary-600 dark:text-primary-400",
    iconBgClass: "bg-primary-100 dark:bg-primary-900/50",
    IconComponent: Quote,
  },
};

export default function ArticleCallout({
  variant = "info",
  title,
  content,
  children,
  className = "",
}: ArticleCalloutProps) {
  const config = VARIANT_CONFIGS[variant] || VARIANT_CONFIGS.info;
  const { IconComponent, containerClass, iconClass, iconBgClass } = config;

  return (
    <aside
      className={`relative p-5 sm:p-6 rounded-2xl border my-6 shadow-sm ${containerClass} ${className}`}
    >
      <div className="flex items-start gap-3.5">
        <div className={`p-2 rounded-xl shrink-0 ${iconBgClass} ${iconClass}`}>
          <IconComponent className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className="font-heading font-bold text-base sm:text-lg mb-1.5 tracking-tight text-foreground-900 dark:text-white">
              {title}
            </h4>
          )}
          <div className="text-sm leading-relaxed text-foreground-700 dark:text-foreground-200 space-y-2">
            {children ? children : content ? <p>{content}</p> : null}
          </div>
        </div>
      </div>
    </aside>
  );
}
