import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "@/pages/home/components/Navbar";
import Footer from "@/pages/home/components/Footer";
import PageHeroImage from "@/components/base/PageHeroImage";
import PaginationControls from "@/components/base/PaginationControls";
import { BLOG_CATEGORIES } from "@/pages/blog/blog.constants";
import { blogService, type BlogPostItem, type BlogTag } from "@/api-services/blog.service";
import { logger } from "@/lib/logger";

export default function BlogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState<BlogPostItem[]>([]);
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const pageSize = 6;

  const activeCategory = searchParams.get("category") || "All";
  const activeTag = searchParams.get("tag") || "All";
  const searchQuery = searchParams.get("search") || "";
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [searchQuery]);

  useEffect(() => {
    let isMounted = true;
    blogService
      .getTags()
      .then((fetchedTags) => {
        if (isMounted && Array.isArray(fetchedTags) && fetchedTags.length > 0) {
          setTags(fetchedTags);
        }
      })
      .catch((err) => {
        logger.warn("Failed to fetch blog tags:", err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const categoryParam = activeCategory === "All" ? undefined : activeCategory;
    const tagParam = activeTag === "All" ? undefined : activeTag;
    const searchParam = debouncedSearchQuery.trim() || undefined;

    blogService
      .getPosts({
        page: currentPage,
        limit: pageSize,
        category: categoryParam,
        tag: tagParam,
        search: searchParam,
      })
      .then((res) => {
        if (isMounted) {
          setPosts(res?.posts || []);
          setTotalPosts(res?.total || 0);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        logger.warn("Failed to fetch blog posts:", err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeCategory, activeTag, currentPage, debouncedSearchQuery]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, activeTag, debouncedSearchQuery]);

  const setCategory = (cat: string) => {
    const next = new URLSearchParams(searchParams);
    if (cat === "All") {
      next.delete("category");
    } else {
      next.set("category", cat);
    }
    setSearchParams(next, { replace: true });
  };

  const setTag = (tagId: string) => {
    const next = new URLSearchParams(searchParams);
    if (tagId === "All") {
      next.delete("tag");
    } else {
      next.set("tag", tagId);
    }
    setSearchParams(next, { replace: true });
  };

  const setSearch = (q: string) => {
    const next = new URLSearchParams(searchParams);
    if (!q) {
      next.delete("search");
    } else {
      next.set("search", q);
    }
    setSearchParams(next, { replace: true });
  };

  const totalPages = Math.ceil(totalPosts / pageSize) || 1;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 400, behavior: "smooth" });
  };

  return (
    <>
      <div className="print-hide">
        <Navbar />
      </div>
      <main>
        {/* Hero Section */}
        <section className="print-hide relative w-full h-[320px] md:h-[420px] overflow-hidden">
          <PageHeroImage
            page="blog"
            alt="Alanya Travel Blog"
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
              <span className="text-white/90 text-sm">Blog</span>
            </div>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h1 className="font-heading text-3xl md:text-5xl text-white mb-2">
                  Travel Blog
                </h1>
                <p className="text-white/75 text-sm md:text-base max-w-xl">
                  Stories, tips, and insights from Alanya — written by locals, expats, and fellow travelers.
                </p>
              </div>

              <Link
                to="/blog/submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent-500 hover:bg-accent-600 text-white text-sm font-medium transition-all shadow-md hover:shadow-lg whitespace-nowrap"
              >
                <i className="ri-quill-pen-line text-base"></i>
                Submit Post
              </Link>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="print-hide w-full px-4 md:px-8 lg:px-12 py-12 md:py-20 bg-background-50">
          <div className="max-w-6xl mx-auto">
            {/* Filter and Search Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 pb-6 border-b border-foreground-100">
              <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
                <button
                  onClick={() => setCategory("All")}
                  className={`px-4 py-2 rounded-full text-xs md:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                    activeCategory === "All"
                      ? "bg-primary-500 text-white shadow-sm"
                      : "bg-white border border-foreground-200 text-foreground-700 hover:border-primary-300 hover:text-primary-600"
                  }`}
                >
                  All Categories
                </button>
                {BLOG_CATEGORIES.map((blogCategory) => (
                  <button
                    key={blogCategory}
                    onClick={() => setCategory(blogCategory)}
                    className={`px-4 py-2 rounded-full text-xs md:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                      activeCategory === blogCategory
                        ? "bg-primary-500 text-white shadow-sm"
                        : "bg-white border border-foreground-200 text-foreground-700 hover:border-primary-300 hover:text-primary-600"
                    }`}
                  >
                    {blogCategory}
                  </button>
                ))}
              </div>

              <div className="relative min-w-[240px]">
                <i className="ri-search-line absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-400 text-sm"></i>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search blog posts..."
                  className="w-full pl-9 pr-8 py-2 rounded-full border border-foreground-200 bg-white text-xs md:text-sm text-foreground-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder:text-foreground-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-400 hover:text-foreground-600"
                    aria-label="Clear search"
                  >
                    <i className="ri-close-circle-line text-sm"></i>
                  </button>
                )}
              </div>
            </div>

            {tags.length > 0 && (
              <div className="mb-10 flex items-center gap-2 overflow-x-auto scrollbar-none">
                <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-foreground-500">
                  Tags
                </span>
                <button
                  onClick={() => setTag("All")}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                    activeTag === "All"
                      ? "bg-accent-500 text-white"
                      : "bg-white border border-foreground-200 text-foreground-600 hover:border-accent-300"
                  }`}
                >
                  All Tags
                </button>
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => setTag(tag.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                      activeTag === tag.id
                        ? "bg-accent-500 text-white"
                        : "bg-white border border-foreground-200 text-foreground-600 hover:border-accent-300"
                    }`}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            )}

            {/* Posts Grid */}
            {isLoading && posts.length === 0 ? (
              <div className="py-20 text-center">
                <i className="ri-loader-4-line animate-spin text-3xl text-primary-500 mb-3 block mx-auto"></i>
                <p className="text-foreground-500 text-sm">Loading blog posts...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="py-20 text-center bg-white rounded-2xl border border-background-200 p-8">
                <i className="ri-article-line text-5xl text-foreground-300 mb-4 block"></i>
                <h3 className="font-heading text-lg text-foreground-800 mb-2">No posts found</h3>
                <p className="text-sm text-foreground-500 max-w-md mx-auto mb-6">
                  No blog posts matched your filter. Try another category or submit your own post.
                </p>
                <button
                  onClick={() => {
                    setSearchParams({}, { replace: true });
                  }}
                  className="px-5 py-2 rounded-full bg-primary-500 text-white text-xs font-medium hover:bg-primary-600 transition-colors cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                  {posts.map((post) => {
                    const tag = post.tag || post.category || "General";
                    const readTime = post.readTime || "5 min read";
                    const description = post.description || post.excerpt || "";

                    return (
                      <Link
                        key={post.id}
                        to={`/blog/${post.slug}`}
                        className="bg-white rounded-2xl overflow-hidden border border-background-200/70 hover:border-primary-200/60 hover:shadow-md transition-all group flex flex-col"
                      >
                        <div className="w-full h-44 overflow-hidden">
                          <img
                            src={post.cover_image_url || "/images/placeholder-business.svg"}
                            alt={post.title}
                            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div className="p-6 flex flex-col flex-1">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="px-2.5 py-0.5 rounded-full bg-accent-100 text-accent-700 text-xs font-medium whitespace-nowrap">
                              {tag}
                            </span>
                            <span className="text-xs text-foreground-400">{readTime}</span>
                          </div>
                          <h3 className="font-heading text-base text-foreground-900 mb-2 group-hover:text-primary-600 transition-colors">
                            {post.title}
                          </h3>
                          <p className="text-sm text-foreground-500 leading-relaxed line-clamp-3 mb-4 flex-1">
                            {description}
                          </p>
                          <div className="pt-4 border-t border-background-100 flex items-center justify-between text-xs text-primary-600 font-medium">
                            <span>Read Post</span>
                            <i className="ri-arrow-right-line group-hover:translate-x-1 transition-transform"></i>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* Pagination Controls */}
                {posts.length > 0 && (
                  <div className="mt-10">
                    <PaginationControls
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalItems={totalPosts}
                      pageSize={pageSize}
                      showItemCount={true}
                      itemName="posts"
                      mode="numbered"
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>
      <div className="print-hide">
        <Footer />
      </div>
    </>
  );
}
