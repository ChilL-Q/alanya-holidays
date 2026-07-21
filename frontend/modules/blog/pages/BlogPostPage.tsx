import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, User, Clock, Tag, Share2 } from 'lucide-react';
import { Breadcrumb } from '../../../components/seo/Breadcrumb';
import { format } from 'date-fns';
import DOMPurify from 'dompurify';
import { toast } from 'react-hot-toast';
import { blogService } from '../../../api-services';
import { SEOHead } from '../../../components/seo/SEOHead';
import { BlogPostWithTags, BlogPostPreview } from '../api';
import { BlogPostCard } from '../../../components/home/BlogPostCard';
import { isValidVideoUrl } from '../../../utils/videoEmbed';
import { VideoEmbed } from '../../../components/ui/VideoEmbed';
import { extractHeadingsFromHTML } from '../../../utils/extractHeadings';
import { useAsyncEffect } from '../../../hooks/useAsyncEffect';
import { BLOG_PROSE_WITH_TOC } from '../../../utils/blogProseStyles';
import { getRelatedDiscussions } from '../../../utils/communityLinks';
import { RelatedDiscussions } from '../../../components/community/RelatedDiscussions';
import { ForumPost } from '../../../types/models';

const TOC_HEADING_THRESHOLD = 3;

export const BlogPostPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [post, setPost] = useState<BlogPostWithTags | null>(null);
    const [loading, setLoading] = useState(true);
    const viewsIncremented = useRef(false);

    useAsyncEffect(async (isCancelled) => {
        if (!slug) return;
        setLoading(true);
        try {
            const data = await blogService.getBlogPost(slug, true);
            if (!isCancelled()) setPost(data);
        } finally {
            if (!isCancelled()) setLoading(false);
        }
    }, [slug]);

    // Increment views once per mount (prevents double-counting on strict mode re-renders)
    useEffect(() => {
        if (!post || viewsIncremented.current) return;
        viewsIncremented.current = true;

        // getBlogPost already increments views, but if called without incrementViews=true,
        // we'd do it here. Since we pass true above, this is a safety guard.
    }, [post]);

    const [relatedPosts, setRelatedPosts] = useState<BlogPostPreview[]>([]);
    const [relatedDiscussions, setRelatedDiscussions] = useState<ForumPost[]>([]);
    const [loadingDiscussions, setLoadingDiscussions] = useState(false);

    useAsyncEffect(async (isCancelled) => {
        if (!post) return;
        try {
            const data = await blogService.getRelatedPosts(post.id, post.category, 3);
            if (!isCancelled()) setRelatedPosts(data);
        } catch (err) {
            if (!isCancelled()) console.error('Failed to load related posts:', err);
        }
    }, [post?.id, post?.category]);

    useAsyncEffect(async (isCancelled) => {
        if (!post) return;
        setLoadingDiscussions(true);
        try {
            const data = await getRelatedDiscussions(post, 5);
            if (!isCancelled()) setRelatedDiscussions(data);
        } catch (err) {
            if (!isCancelled()) console.error('Failed to load related discussions:', err);
        } finally {
            if (!isCancelled()) setLoadingDiscussions(false);
        }
    }, [post?.id, post?.category]);

    const sanitizedContent = useMemo(() =>
        post ? DOMPurify.sanitize(post.content || '') : '',
        [post]
    );

    const { processedContent, headings } = useMemo(() =>
        extractHeadingsFromHTML(sanitizedContent),
        [sanitizedContent]
    );

    const hasVideo = useMemo(() => post ? isValidVideoUrl(post.video_url || '') : false, [post]);

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

    const handleShare = async () => {
        const shareUrl = window.location.href;
        if (navigator.share) {
            try {
                await navigator.share({ title: post.title, url: shareUrl });
            } catch (_error) {
                // User cancelled share
            }
        } else {
            navigator.clipboard.writeText(shareUrl);
            toast.success('Link copied to clipboard!');
        }
    };

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
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
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
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6">
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
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
                    <div className="lg:grid lg:grid-cols-12 lg:gap-8 mt-6">
                        {/* Main column */}
                        <div className={`${headings.length >= TOC_HEADING_THRESHOLD ? 'lg:col-span-8 xl:col-span-9' : 'lg:col-span-12 max-w-3xl mx-auto w-full'}`}>
                            {/* Meta Row */}
                            <div className="mb-8 flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
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
                                        {post.author.avatar_url ? (
                                            <img
                                                src={post.author.avatar_url}
                                                alt=""
                                                className="w-5 h-5 rounded-full object-cover"
                                            />
                                        ) : (
                                            <User size={14} />
                                        )}
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
                                <button
                                    type="button"
                                    onClick={handleShare}
                                    className="inline-flex items-center gap-1.5 text-teal-600 dark:text-cyan-400 hover:underline"
                                >
                                    <Share2 size={14} />
                                    Share
                                </button>
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

                            {/* Mobile TOC - Accordion style */}
                            {headings.length >= 3 && (
                                <div className="lg:hidden mb-8 p-5 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                                    <details className="group">
                                        <summary className="flex items-center justify-between cursor-pointer list-none">
                                            <span className="font-bold text-slate-900 dark:text-white text-base">
                                                Table of Contents
                                            </span>
                                            <span className="transition-transform duration-300 group-open:rotate-180">
                                                <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </span>
                                        </summary>
                                        <nav className="mt-4 pl-1 space-y-2.5 border-t border-slate-200/50 dark:border-slate-700/50 pt-4">
                                            {headings.map((heading) => (
                                                <a
                                                    key={heading.id}
                                                    href={`#${heading.id}`}
                                                    className={`block text-sm transition-colors hover:text-teal-600 dark:hover:text-cyan-400 ${
                                                        heading.level === 'h2'
                                                            ? 'font-medium text-slate-700 dark:text-slate-300'
                                                            : 'pl-4 text-slate-500 dark:text-slate-400'
                                                    }`}
                                                >
                                                    {heading.text}
                                                </a>
                                            ))}
                                        </nav>
                                    </details>
                                </div>
                            )}

                            {/* Article Body */}
                            <div
                                className={BLOG_PROSE_WITH_TOC}
                                dangerouslySetInnerHTML={{ __html: processedContent }}
                            />

                            {hasVideo && (
                                <div className="mt-10 pt-10 border-t border-slate-100 dark:border-slate-800/50">
                                    <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Video</h3>
                                    <VideoEmbed url={post.video_url || ''} title="Blog video" />
                                </div>
                            )}

                            {/* Excerpt fallback if no content */}
                            {!post.content && post.excerpt && (
                                <div className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed italic">
                                    {post.excerpt}
                                </div>
                            )}
                        </div>

                        {/* Sticky Desktop TOC Column */}
                        {headings.length >= TOC_HEADING_THRESHOLD && (
                            <aside className="hidden lg:block lg:col-span-4 xl:col-span-3">
                                <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pl-6 border-l border-slate-100 dark:border-slate-800/60">
                                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4">
                                        On this page
                                    </h2>
                                    <nav className="space-y-3">
                                        {headings.map((heading) => (
                                            <a
                                                key={heading.id}
                                                href={`#${heading.id}`}
                                                className={`block text-sm transition-colors duration-200 hover:text-teal-600 dark:hover:text-cyan-400 ${
                                                    heading.level === 'h2'
                                                        ? 'font-semibold text-slate-800 dark:text-slate-200'
                                                        : 'pl-3 text-xs text-slate-500 dark:text-slate-400 border-l border-transparent hover:border-teal-500 dark:hover:border-cyan-400'
                                                }`}
                                            >
                                                {heading.text}
                                            </a>
                                        ))}
                                    </nav>
                                </div>
                            </aside>
                        )}
                    </div>

                    {/* Related Posts */}
                    {relatedPosts.length > 0 && (
                        <div className="mt-16 pt-12 border-t border-slate-100 dark:border-slate-800/50">
                            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-8">
                                You Might Also Like
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {relatedPosts.map((relatedPost, index) => (
                                    <BlogPostCard key={relatedPost.id} post={relatedPost} index={index} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Related Community Discussions */}
                    {(relatedDiscussions.length > 0 || loadingDiscussions) && (
                        <RelatedDiscussions
                            discussions={relatedDiscussions}
                            title="Related Community Discussions"
                            loading={loadingDiscussions}
                        />
                    )}
                </div>
            </article>
        </>
    );
};
