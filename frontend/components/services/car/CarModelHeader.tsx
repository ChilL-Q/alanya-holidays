import React from 'react';

interface CarModelHeaderProps {
    image: string;
    title: string;
    description: string;
    features: string[];
}

export const CarModelHeader: React.FC<CarModelHeaderProps> = ({ image, title, description, features }) => {
    return (
        <div className="bg-white dark:bg-slate-800/80 rounded-3xl p-8 mb-12 shadow-sm border border-slate-100 dark:border-slate-800/50 flex flex-col md:flex-row gap-8 items-center animate-fade-up">
            <div className="w-full md:w-1/2">
                <img
                    src={image}
                    alt={title}
                    className="w-full rounded-2xl shadow-md object-contain sm:object-cover aspect-[4/3] bg-white dark:bg-slate-900"
                />
            </div>
            <div className="w-full md:w-1/2">
                <h1 className="text-4xl font-serif font-bold text-slate-900 dark:text-white mb-4">{title}</h1>
                <div className="flex flex-wrap gap-3 mb-6">
                    {features.map((f, i) => (
                        <span key={i} className="px-3 py-1 bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 rounded-full text-sm font-medium capitalize">
                            {f}
                        </span>
                    ))}
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-lg mb-6">
                    {description || "Verified listings from top rated providers in Alanya. Compare prices and book directly."}
                </p>
            </div>
        </div>
    );
};
