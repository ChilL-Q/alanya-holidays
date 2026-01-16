import React from 'react';
import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'outline' | 'danger';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    isLoading?: boolean;
    fullWidth?: boolean;
}

export const buttonVariants = {
    variant: {
        primary: "bg-primary hover:bg-primary-dark text-white shadow-lg hover:shadow-primary/30",
        secondary: "bg-white text-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 dark:text-white",
        accent: "bg-accent hover:bg-accent-hover text-white shadow-lg hover:shadow-accent/30",
        ghost: "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300",
        outline: "border-2 border-primary text-primary hover:bg-primary/5",
        danger: "bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-red-500/30"
    },
    size: {
        sm: "h-9 px-4 text-sm",
        md: "h-11 px-6 text-base",
        lg: "h-14 px-8 text-lg",
        icon: "h-10 w-10 p-2 flex items-center justify-center"
    }
};

export const buttonBase = "inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed";

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', isLoading = false, fullWidth = false, children, disabled, ...props }, ref) => {

        return (
            <button
                ref={ref}
                disabled={isLoading || disabled}
                className={cn(
                    // Base styles
                    buttonBase,
                    // Variants & Sizes
                    buttonVariants.variant[variant],
                    buttonVariants.size[size],
                    // Full width
                    fullWidth ? "w-full" : "",
                    className
                )}
                {...props}
            >
                {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                {children}
            </button>
        );
    }
);

Button.displayName = "Button";
