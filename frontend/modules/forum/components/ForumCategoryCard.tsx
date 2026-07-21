import React from 'react';
import { Link } from 'react-router-dom';
import { Layers, ArrowUpRight } from 'lucide-react';
import { ForumCategory } from '../../../types/models';
import { getCategoryIcon, getAccent } from '../../../data/forumContent';

interface ForumCategoryCardProps {
    category: ForumCategory;
    className?: string;
}

export const ForumCategoryCard: React.FC<ForumCategoryCardProps> = ({ category, className = '' }) => {
    const Icon = getCategoryIcon(category.icon);
    const accent = getAccent(category.accent);
    const topics = category.topic_count ?? category.children?.length ?? 0;
    const discussions = category.discussion_count ?? 0;
    const to = `/forum/category/${category.slug}`;

    if (category.image_url) {
        return (
            <Link
                to={to}
                className={`group relative overflow-hidden rounded-2xl min-h-[180px] flex flex-col justify-end p-5 ${className}`}
            >
                <img
                    src={category.image_url}
                    alt={category.name}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
                {topics > 0 && (
                    <span className={`absolute top-4 right-4 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-white ${accent.badge}`}>
                        <Layers size={12} /> {topics} topics
                    </span>
                )}
                <div className="relative z-10">
                    <h3 className="text-lg font-bold text-white mb-0.5">{category.name}</h3>
                    <p className="text-sm text-white/80">{discussions.toLocaleString('en-US')} discussions</p>
                </div>
            </Link>
        );
    }

    return (
        <Link
            to={to}
            className={`group relative overflow-hidden rounded-2xl min-h-[180px] flex flex-col justify-between p-5 bg-gradient-to-br ${accent.gradient} ${className}`}
        >
            <div className="absolute -right-6 -bottom-6 opacity-20 group-hover:opacity-30 transition-opacity">
                <Icon size={120} className="text-white" strokeWidth={1} />
            </div>
            <div className="relative z-10 flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Icon size={24} className="text-white" />
                </div>
                <ArrowUpRight size={20} className="text-white/70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
            <div className="relative z-10">
                <h3 className="text-lg font-bold text-white mb-0.5">{category.name}</h3>
                <p className="text-sm text-white/80">
                    {discussions.toLocaleString('en-US')} discussions
                    {topics > 0 && ` · ${topics} topics`}
                </p>
            </div>
        </Link>
    );
};
