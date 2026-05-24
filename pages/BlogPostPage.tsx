import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, User, Clock, Tag } from 'lucide-react';
import { Breadcrumb } from '../components/seo/Breadcrumb';
import { format } from 'date-fns';
import DOMPurify from 'dompurify';
import { db } from '../api-services';
import { SEOHead } from '../components/seo/SEOHead';
import { BlogPostWithTags } from '../api-services/api/blog';

export const BlogPostPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [post, setPost] = useState<BlogPostWithTags | null>(null);
    const [loading, setLoading] = useState(true);
    const viewsIncremented = useRef(false);

    useEffect(() => {
        if (!slug) return;
        let cancelled = false;

        async function loadPost() {
            setLoading(true);
            try {
                const data = await db.getBlogPost(slug, true);
                if (!cancelled) setPost(data);
            } catch (err) {
                console.error('Failed to load blog post:', err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        loadPost();
        return () => { cancelled = true; };
    }, [slug]);

    // Increment views once per mount (prevents double-counting on strict mode re-renders)
    useEffect(() => {
        if (!post || viewsIncremented.current) return;
        viewsIncremented.current = true;

        // getBlogPost already increments views, but if called without incrementViews=true,
        // we'd do it here. Since we pass true above, this is a safety guard.
    }, [post]);

    const sanitizedContent = useMemo(() =>
        post ? DOMPurify.sanitize(post.content || '') : '',
        [post]
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500 mx-auto mb-4"></div>
                    <p className="text-slate-500 dark:text-slate-400">Loading article...</p>
                </div>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center">
                <div className="text-center max-w-md px-4">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Article Not Found</h1>
                    <p className="text-slate-500 dark:text-slate-400 mb-6">The article you&apos;re looking for doesn&apos;t exist or has been removed.</p>
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 text-teal-600 dark:text-cyan-400 font-medium hover:underline"
                    >
                        <ArrowLeft size={16} /> Back to Home
                    </Link>
                </div>
            </div>
        );
    }

    const publishedDate = post.published_at
        ? format(new Date(post.published_at), 'MMMM d, yyyy')
        : null;

    const readTime = post.content
        ? Math.max(1, Math.ceil(post.content.replace(/<[^>]*>/g, '').split(/\s+/).length / 200))
        : 1;

    const articleJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: post.title,
        author: post.author?.full_name
            ? { '@type': 'Person', name: post.author.full_name }
            : undefined,
        datePublished: post.published_at || undefined,
        dateModified: post.updated_at || undefined,
        image: post.cover_image_url || undefined,
        publisher: {
            '@type': 'Organization',
            name: 'AlanyaHolidays',
            logo: {
                '@type': 'ImageObject',
                url: 'https://alanya-holidays.com/logo.png',
            },
        },
    };

    return (
        <>
            <SEOHead
                title={post.title}
                description={post.excerpt || post.title}
                image={post.cover_image_url || undefined}
                type="article"
                keywords={post.category ? [post.category, 'Alanya', 'Turkey', 'travel guide'] : ['Alanya', 'Turkey', 'travel guide']}
                jsonLd={articleJsonLd}
            />

            <article className="min-h-screen bg-white dark:bg-slate-900">
                {/* Breadcrumb */}
                <div className="border-b border-slate-100 dark:border-slate-800/50">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <Breadcrumb
                            items={[
                                { label: 'Home', href: '/' },
                                { label: 'Blog', href: '/blog' },
                                { label: post.category || 'Article' },
                            ]}
                        />
                    </div>
                </div>

                {/* Hero */}
                {post.cover_image_url && (
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6">
                        <div className="aspect-[21/9] rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                            <img
                                src={post.cover_image_url}
                                alt={post.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                )}

                {/* Content Container */}
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
                    {/* Meta Row */}
                    <div className="mt-6 mb-8 flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                        {post.category && (
                            <span className="inline-block px-3 py-1 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 rounded-full font-medium text-xs uppercase tracking-wider">
                                {post.category}
                            </span>
                        )}
                        {publishedDate && (
                            <span className="inline-flex items-center gap-1.5">
                                <Calendar size={14} />
                                {publishedDate}
                            </span>
                        )}
                        {post.author?.full_name && (
                            <span className="inline-flex items-center gap-1.5">
                                <User size={14} />
                                {post.author.full_name}
                            </span>
                        )}
                        <span className="inline-flex items-center gap-1.5">
                            <Clock size={14} />
                            {readTime} min read
                        </span>
                        <span className="text-slate-400 dark:text-slate-600">
                            {post.views.toLocaleString()} views
                        </span>
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white leading-tight mb-6">
                        {post.title}
                    </h1>

                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-8 pb-8 border-b border-slate-100 dark:border-slate-800/50">
                            {post.tags.map((tag) => (
                                <span
                                    key={tag.id}
                                    className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full text-xs font-medium"
                                >
                                    <Tag size={12} />
                                    {tag.name}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Article Body */}
                    <div
                        className="prose prose-lg dark:prose-invert max-w-none
                            prose-headings:font-bold prose-headings:text-slate-900 dark:prose-headings:text-white
                            prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
                            prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
                            prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-p:leading-relaxed
                            prose-a:text-teal-600 dark:prose-a:text-cyan-400 prose-a:no-underline hover:prose-a:underline
                            prose-img:rounded-xl prose-img:shadow-lg
                            prose-ul:text-slate-700 dark:prose-ul:text-slate-300
                            prose-li:text-slate-700 dark:prose-li:text-slate-300
                            prose-blockquote:border-l-4 prose-blockquote:border-teal-500 prose-blockquote:bg-teal-50/50 dark:prose-blockquote:bg-teal-900/10 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:italic"
                        dangerouslySetInnerHTML={{ __html: sanitizedContent }}
                    />

                    {/* Excerpt fallback if no content */}
                    {!post.content && post.excerpt && (
                        <div className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed italic">
                            {post.excerpt}
                        </div>
                    )}
                </div>
            </article>
        </>
    );
};
