import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "@/pages/home/components/Navbar";
import Footer from "@/pages/home/components/Footer";
import { getPageHeroImage } from "@/components/base/PageHeroImage";
import ArticleContentRenderer from "@/components/article/ArticleContentRenderer";
import BlogComments from "./components/BlogComments";
import { blogService, type BlogPostDetail } from "@/api-services/blog.service";
import { logger } from "@/lib/logger";

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPostDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let isMounted = true;

    setIsLoading(true);
    setNotFound(false);

    blogService
      .getPostBySlug(slug)
      .then((res) => {
        if (isMounted) {
          if (res) {
            setPost(res);
          } else {
            setNotFound(true);
          }
          setIsLoading(false);
        }
      })
      .catch((err) => {
        logger.warn("Failed to fetch blog post:", err);
        if (isMounted) {
          setNotFound(true);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post?.title,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <>
      <div className="print-hide">
        <Navbar />
      </div>
      <main>
        {isLoading ? (
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="text-center">
              <i className="ri-loader-4-line animate-spin text-4xl text-primary-500 mb-4 block mx-auto"></i>
              <p className="text-foreground-500 text-sm">Loading post...</p>
            </div>
          </div>
        ) : notFound || !post ? (
          <div className="min-h-[60vh] flex items-center justify-center px-4">
            <div className="text-center">
              <i className="ri-article-line text-6xl text-foreground-300 mb-4 block"></i>
              <h1 className="font-heading text-2xl text-foreground-900 mb-2">Post Not Found</h1>
              <p className="text-sm text-foreground-500 mb-6">
                The blog post you are looking for does not exist or has been removed.
              </p>
              <Link
                to="/blog"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium transition-colors"
              >
                <i className="ri-arrow-left-line text-base"></i>
                Back to Blog
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Hero Image */}
            <section className="print-hide relative w-full h-[320px] md:h-[420px] overflow-hidden">
              <img
                src={post.cover_image_url || getPageHeroImage("blog")}
                alt={post.title}
                className="absolute inset-0 w-full h-full object-cover object-top"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/images/hero-bg.jpg";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-foreground-950/60 via-foreground-950/40 to-foreground-950/80"></div>

              <div className="absolute bottom-0 left-0 right-0 w-full px-4 md:px-8 lg:px-12 pb-10 md:pb-14">
                <div className="flex items-center gap-2 mb-4">
                  <Link
                    to="/"
                    className="text-white/60 hover:text-white/90 text-sm transition-colors underline underline-offset-2"
                  >
                    Home
                  </Link>
                  <i className="ri-arrow-right-s-line text-white/40 text-sm"></i>
                  <Link
                    to="/blog"
                    className="text-white/60 hover:text-white/90 text-sm transition-colors underline underline-offset-2"
                  >
                    Blog
                  </Link>
                  <i className="ri-arrow-right-s-line text-white/40 text-sm"></i>
                  <span className="text-white/90 text-sm truncate max-w-[200px]">{post.title}</span>
                </div>
                <div className="max-w-3xl">
                  <div className="flex items-center gap-2 mb-3">
                    {(post.tag || post.category) && (
                      <span className="px-2.5 py-0.5 rounded-full bg-accent-500/90 text-white text-xs font-medium whitespace-nowrap">
                        {post.tag || post.category}
                      </span>
                    )}
                    {post.readTime && (
                      <span className="text-white/60 text-xs">{post.readTime}</span>
                    )}
                  </div>
                  <h1 className="font-heading text-3xl md:text-5xl text-white mb-3">
                    {post.title}
                  </h1>
                  {post.excerpt && (
                    <p className="text-white/70 text-sm md:text-base">{post.excerpt}</p>
                  )}
                </div>
              </div>
            </section>

            {/* Article Content */}
            <section className="w-full px-4 md:px-8 lg:px-12 py-12 md:py-16 bg-white">
              <div className="max-w-3xl mx-auto">
                {/* Meta Bar */}
                <div className="print-hide flex items-center justify-between mb-8 pb-6 border-b border-background-200">
                  <div className="flex items-center gap-4">
                    {post.author?.avatar_url ? (
                      <img
                        src={post.author.avatar_url}
                        alt={post.author.full_name || "Author"}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <i className="ri-user-line text-primary-600"></i>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-foreground-900">
                        {post.author?.full_name || post.author_name || "Alanya Holidays Editor"}
                      </p>
                      <p className="text-xs text-foreground-500">
                        {formatDate(post.published_at || post.created_at)}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleShare}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-foreground-200 hover:border-primary-300 text-foreground-600 hover:text-primary-600 text-xs font-medium transition-all cursor-pointer"
                  >
                    <i className="ri-share-line text-sm"></i>
                    Share
                  </button>
                </div>

                {/* Content */}
                <ArticleContentRenderer content={post.content} />

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div className="print-hide mt-10 pt-6 border-t border-background-200">
                    <div className="flex flex-wrap gap-2">
                      {post.tags.map((t, i) => {
                        const name = typeof t === "string" ? t : t.name;
                        return (
                          <span
                            key={i}
                            className="px-3 py-1 rounded-full bg-background-100 text-foreground-600 text-xs font-medium"
                          >
                            {name}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Comments */}
                {post.id && <BlogComments postId={post.id} />}

                {/* Back Link */}
                <div className="print-hide mt-10">
                  <Link
                    to="/blog"
                    className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
                  >
                    <i className="ri-arrow-left-line text-base"></i>
                    Back to Blog
                  </Link>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
      <div className="print-hide">
        <Footer />
      </div>
    </>
  );
}
