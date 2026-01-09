import React from 'react';

interface CategoryTabsProps {
    categories: { id: string; label: string }[];
    activeCategory: string;
    onSelect: (category: string) => void;
}

export const CategoryTabs: React.FC<CategoryTabsProps> = ({ categories, activeCategory, onSelect }) => {
    return (
        <div className="flex overflow-x-auto pb-4 pt-2 gap-2 md:gap-4 no-scrollbar mb-12 justify-start md:justify-center px-4">
            {categories.map((category) => (
                <button
                    key={category.id}
                    onClick={() => onSelect(category.id)}
                    className={`whitespace-nowrap px-6 py-3 rounded-full text-sm md:text-base font-medium transition-all duration-300 ${activeCategory === category.id
                        ? 'bg-slate-900 text-white shadow-lg scale-105'
                        : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                >
                    {category.label}
                </button>
            ))}
        </div>
    );
};
