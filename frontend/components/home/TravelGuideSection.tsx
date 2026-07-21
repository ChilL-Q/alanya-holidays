import React, { useState, useEffect } from 'react';
import { BookOpen, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { blogService } from '../../api-services';
import { BlogPostPreview } from '../../modules/blog';
import { BlogPostCard } from './BlogPostCard';

export const TravelGuideSection: React.FC = () => {
    const navigate = useNavigate();
    const [posts, setPosts] = useState<BlogPostPreview[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        async function loadPosts() {
            setLoading(true);
            try {
                const data = await blogService.getFeaturedBlogPosts(3);
                if (!cancelled && data.length > 0) {
                    setPosts(data);
                }
            } catch (err) {
                console.error('Failed to load featured blog posts:', err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        loadPosts();
        return () => { cancelled = true; };
    }, []);

    // Don't render anything if no featured posts or still loading initial check
    if (loading) {
        return (
            <div className="py-16 md:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <div className="h-8 w-64 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mx-auto mb-4" />
                        <div className="h-5 w-96 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mx-auto" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-80 bg-white dark:bg-slate-800 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (posts.length === 0) return null;

    return (
        <div className="py-16 md:py-24 bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-900/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-10 gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <BookOpen className="w-5 h-5 text-teal-600 dark:text-cyan-400" />
                            <span className="text-xs uppercase font-bold text-teal-600 dark:text-cyan-400 tracking-widest">
                                Travel Guide
                            </span>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                            Discover Alanya Like a Local
                        </h2>
                        <p className="mt-2 text-slate-600 dark:text-slate-400">
                            Expert tips, hidden gems, and insider guides to make your trip unforgettable
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/blog')}
                        className="flex items-center gap-1 text-sm font-semibold text-teal-600 dark:text-cyan-400 hover:text-teal-700 dark:hover:text-cyan-300 transition-colors self-start sm:self-auto"
                    >
                        View all articles <ArrowRight size={16} />
                    </button>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {posts.map((post, index) => (
                        <BlogPostCard key={post.id} post={post} index={index} />
                    ))}
                </div>
            </div>
        </div>
    );
};
