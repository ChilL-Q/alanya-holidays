import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface BreadcrumbProps {
    items: BreadcrumbItem[];
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
    const schema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.label,
            item: item.href ? `https://alanyaholidays.com${item.href}` : undefined,
        })),
    };

    return (
        <>
            <script type="application/ld+json">{JSON.stringify(schema)}</script>
            <nav aria-label="breadcrumb" className="text-sm">
                <ol className="flex items-center gap-2 flex-wrap">
                    {items.map((item, index) => {
                        const isLast = index === items.length - 1;
                        return (
                            <li key={index} className="flex items-center gap-2">
                                {index > 0 && (
                                    <ChevronRight size={16} className="text-slate-400 shrink-0" />
                                )}
                                {isLast || !item.href ? (
                                    <span className="font-medium text-slate-900 dark:text-white flex items-center gap-1">
                                        {index === 0 && item.label === 'Home' && (
                                            <Home size={14} className="text-slate-400" />
                                        )}
                                        {item.label}
                                    </span>
                                ) : (
                                    <Link
                                        to={item.href}
                                        className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors flex items-center gap-1"
                                    >
                                        {index === 0 && item.label === 'Home' && (
                                            <Home size={14} className="text-slate-400" />
                                        )}
                                        {item.label}
                                    </Link>
                                )}
                            </li>
                        );
                    })}
                </ol>
            </nav>
        </>
    );
};
