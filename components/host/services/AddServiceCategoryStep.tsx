import React from 'react';
import { Car, Map, Heart, Camera } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';

export type ServiceCategory = 'transportation' | 'adventure' | 'health' | 'creative' | null;

interface AddServiceCategoryStepProps {
    onSelect: (category: ServiceCategory) => void;
}

export const AddServiceCategoryStep: React.FC<AddServiceCategoryStepProps> = ({ onSelect }) => {
    const { t } = useLanguage();

    const categories = [
        {
            id: 'transportation' as const,
            icon: Car,
            color: 'blue',
            hoverBorder: 'hover:border-teal-500',
            hoverRing: 'hover:ring-teal-500/20'
        },
        {
            id: 'adventure' as const,
            icon: Map,
            color: 'orange',
            hoverBorder: 'hover:border-orange-500',
            hoverRing: 'hover:ring-orange-500/20'
        },
        {
            id: 'health' as const,
            icon: Heart,
            color: 'rose',
            hoverBorder: 'hover:border-rose-500',
            hoverRing: 'hover:ring-rose-500/20'
        },
        {
            id: 'creative' as const,
            icon: Camera,
            color: 'purple',
            hoverBorder: 'hover:border-purple-500',
            hoverRing: 'hover:ring-purple-500/20'
        }
    ];

    return (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map((cat) => {
                const Icon = cat.icon;
                return (
                    <button
                        key={cat.id}
                        onClick={() => onSelect(cat.id)}
                        className={`bg-white dark:bg-slate-800/80 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800/50 ${cat.hoverBorder} hover:ring-2 ${cat.hoverRing} hover:shadow-md transition-all duration-300 ease-out active:scale-[0.98] text-left group`}
                    >
                        <div className={`w-12 h-12 bg-${cat.color}-50 dark:bg-slate-800/50 text-${cat.color}-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                            <Icon size={28} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                            {t(`add_service.cat.${cat.id}`)}
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 text-xs line-clamp-2">
                            {t(`add_service.desc.${cat.id}`)}
                        </p>
                    </button>
                );
            })}
        </div>
    );
};
