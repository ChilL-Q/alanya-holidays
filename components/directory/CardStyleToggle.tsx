import React from 'react';
import { Square, RectangleHorizontal } from 'lucide-react';
import { useCardStyle, CardStyle } from '../../context/CardStyleContext';

const OPTIONS: { value: CardStyle; label: string; Icon: React.ComponentType<{ size?: number }> }[] = [
    { value: 'box', label: 'Box', Icon: Square },
    { value: 'rectangle', label: 'Rectangle', Icon: RectangleHorizontal },
];

/** Lets users switch listing cards between rounded "box" and squared "rectangle" styles (T13). */
export const CardStyleToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
    const { cardStyle, setCardStyle } = useCardStyle();

    return (
        <div
            role="group"
            aria-label="Card style"
            className={`inline-flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-0.5 ${className}`}
        >
            {OPTIONS.map(({ value, label, Icon }) => {
                const active = cardStyle === value;
                return (
                    <button
                        key={value}
                        type="button"
                        onClick={() => setCardStyle(value)}
                        aria-pressed={active}
                        title={`${label} layout`}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
                            active
                                ? 'bg-teal-600 text-white'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                        }`}
                    >
                        <Icon size={16} />
                        <span className="hidden sm:inline">{label}</span>
                    </button>
                );
            })}
        </div>
    );
};
