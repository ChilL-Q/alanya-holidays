import React from 'react';

interface ServiceGridProps {
    children: React.ReactNode;
    title: string;
    subtitle?: string;
    id?: string;
}

export const ServiceGrid: React.FC<ServiceGridProps> = ({ children, title, subtitle, id }) => {
    return (
        <section id={id} className="py-16 scroll-mt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-12">
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">{title}</h2>
                    {subtitle && (
                        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl">{subtitle}</p>
                    )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {React.Children.map(children, (child, index) => (
                        <div
                            className="animate-stagger-enter"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            {child}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
