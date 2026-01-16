import React from 'react';
import { Minus, Plus } from 'lucide-react';

interface CounterProps {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    label?: string;
    subtitle?: string;
}

export const Counter: React.FC<CounterProps> = ({
    value,
    onChange,
    min = 0,
    max = 99,
    label,
    subtitle
}) => {
    const handleDecrement = (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent form submission if inside a form
        if (value > min) onChange(value - 1);
    };

    const handleIncrement = (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent form submission if inside a form
        if (value < max) onChange(value + 1);
    };

    return (
        <div className="flex items-center justify-between py-4 border-b border-slate-100 dark:border-slate-800 last:border-0">
            <div>
                {label && <div className="font-medium text-slate-900 dark:text-white">{label}</div>}
                {subtitle && <div className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</div>}
            </div>
            <div className="flex items-center gap-4">
                <button
                    onClick={handleDecrement}
                    disabled={value <= min}
                    className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${value <= min
                            ? 'border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600 cursor-not-allowed'
                            : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-800 dark:hover:border-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                >
                    <Minus size={14} />
                </button>
                <div className="w-6 text-center font-medium text-slate-900 dark:text-white">
                    {value}
                </div>
                <button
                    onClick={handleIncrement}
                    disabled={value >= max}
                    className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${value >= max
                            ? 'border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600 cursor-not-allowed'
                            : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-800 dark:hover:border-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                >
                    <Plus size={14} />
                </button>
            </div>
        </div>
    );
};
