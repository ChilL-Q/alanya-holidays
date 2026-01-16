import React from 'react';
import { Check } from 'lucide-react';

interface StepsIndicatorProps {
    currentStep: number;
    totalSteps: number;
    labels?: string[];
}

export const StepsIndicator: React.FC<StepsIndicatorProps> = ({ currentStep, totalSteps, labels }) => {
    const progress = ((currentStep + 1) / totalSteps) * 100;

    return (
        <div className="w-full">
            {/* Progress Bar (Mobile/Simple) */}
            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-6">
                <div
                    className="h-full bg-teal-600 transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Labels (Desktop) */}
            {labels && (
                <div className="hidden md:flex justify-between relative px-2">
                    {labels.map((label, index) => {
                        const isCompleted = index < currentStep;
                        const isActive = index === currentStep;

                        return (
                            <div key={index} className="flex flex-col items-center relative z-10 group cursor-default">
                                <div className={`
                            w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 border-2
                            ${isCompleted
                                        ? 'bg-teal-600 border-teal-600 text-white'
                                        : isActive
                                            ? 'bg-white dark:bg-slate-900 border-teal-600 text-teal-600 scale-110'
                                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400'
                                    }
                        `}>
                                    {isCompleted ? <Check size={14} /> : index + 1}
                                </div>
                                <span className={`
                            absolute top-10 text-xs font-medium whitespace-nowrap transition-colors duration-300
                            ${isActive ? 'text-teal-600' : 'text-slate-500 dark:text-slate-400'}
                        `}>
                                    {label}
                                </span>
                            </div>
                        );
                    })}
                    {/* Connector Lines */}
                    <div className="absolute top-4 left-0 right-0 h-0.5 bg-slate-100 dark:bg-slate-800 -z-0 mx-6"></div>
                </div>
            )}
        </div>
    );
};
