import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Calendar, ChevronRight } from 'lucide-react';

interface Section {
    id: string;
    title: string;
}

interface LegalLayoutProps {
    title: string;
    lastUpdated: string;
    sections: Section[];
    children: React.ReactNode;
}

export const LegalLayout: React.FC<LegalLayoutProps> = ({ title, lastUpdated, sections, children }) => {
    return (
        <div className="min-h-screen bg-white dark:bg-slate-900 pb-20">
            {/* Hero Section */}
            <div className="relative bg-slate-900 pt-32 pb-20 overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550133730-695473e544be?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center opacity-20 filter blur-sm"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h1 className="text-4xl md:text-5xl font-serif text-white mb-6 leading-tight">
                        {title}
                    </h1>
                    <div className="flex items-center text-slate-300 text-sm md:text-base">
                        <Calendar size={18} className="mr-2 text-accent" />
                        <span>Last updated: {lastUpdated}</span>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex flex-col lg:flex-row gap-12">
                    {/* Sidebar / Table of Contents */}
                    <div className="lg:w-1/4">
                        <div className="sticky top-24">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">
                                Table of Contents
                            </h3>
                            <nav className="space-y-1">
                                {sections.map((section) => (
                                    <a
                                        key={section.id}
                                        href={`#${section.id}`}
                                        className="group flex items-center py-2 px-3 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-accent transition-colors text-sm"
                                    >
                                        <ChevronRight size={14} className="mr-2 opacity-0 group-hover:opacity-100 transition-opacity text-accent" />
                                        {section.title}
                                    </a>
                                ))}
                            </nav>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:w-3/4">
                        <div className="prose dark:prose-invert prose-lg max-w-none prose-headings:font-serif prose-headings:text-slate-900 dark:prose-headings:text-white prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-li:text-slate-600 dark:prose-li:text-slate-300 prose-a:text-accent hover:prose-a:text-accent-hover">
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
