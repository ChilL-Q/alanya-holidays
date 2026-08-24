import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { forumService, type Category } from "@/api-services/forum.service";
import { isAbortError } from "@/lib/api-client";
import { ErrorState } from "@/components/base/ErrorState";
import { EmptyState } from "@/components/base/EmptyState";
import LoadingSpinner from "@/components/base/LoadingSpinner";
import Navbar from "@/pages/home/components/Navbar";
import Footer from "@/pages/home/components/Footer";

export default function CategoriesPage() {
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await forumService.getCategories({ signal });
      setCategoriesList(data || []);
    } catch (err) {
      if (isAbortError(err)) return;
      setError(err instanceof Error ? err.message : "Failed to load forum categories");
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    document.title = "Browse All Categories | Alanya Holidays";
    const controller = new AbortController();
    fetchCategories(controller.signal);
    return () => {
      controller.abort();
    };
  }, [fetchCategories]);

  return (
    <div className="min-h-screen bg-background-50">
      <Navbar />

      <main>
        {/* Hero Section */}
        <section className="relative w-full h-[340px] md:h-[420px] overflow-hidden">
          <img
            src="/images/placeholder-business.svg"
            alt="Alanya Categories"
            className="absolute inset-0 w-full h-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/60"></div>

          <div className="absolute bottom-0 left-0 right-0 w-full px-4 md:px-8 lg:px-12 pb-10 md:pb-14">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 mb-4">
              <Link
                to="/"
                className="text-white/60 hover:text-white/90 text-sm transition-colors underline underline-offset-2"
              >
                Home
              </Link>
              <i className="ri-arrow-right-s-line text-white/40 text-sm"></i>
              <span className="text-white/90 text-sm">Categories</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center bg-white/15 backdrop-blur-sm rounded-xl">
                    <i className="ri-stack-line text-white text-xl md:text-2xl"></i>
                  </div>
                  <h1 className="font-heading text-3xl md:text-4xl text-white">
                    Explore All Categories
                  </h1>
                </div>
                <p className="text-white/70 text-sm md:text-base max-w-xl">
                  From travel planning to local culture — find your community and
                  start the conversation.
                </p>
              </div>

              {/* Quick stats */}
              <div className="flex items-center gap-5 shrink-0">
                <div className="text-center">
                  <p className="text-white text-lg md:text-xl font-semibold">
                    {categoriesList.length}
                  </p>
                  <p className="text-white/50 text-xs">Categories</p>
                </div>
                <div className="w-px h-8 bg-white/20"></div>
                <div className="text-center">
                  <p className="text-white text-lg md:text-xl font-semibold">
                    {categoriesList
                      .reduce((sum, c) => sum + c.threadCount, 0)
                      .toLocaleString()}
                  </p>
                  <p className="text-white/50 text-xs">Discussions</p>
                </div>
                <div className="w-px h-8 bg-white/20"></div>
                <div className="text-center">
                  <p className="text-white text-lg md:text-xl font-semibold">
                    {categoriesList
                      .reduce((sum, c) => sum + c.memberCount, 0)
                      .toLocaleString()}
                  </p>
                  <p className="text-white/50 text-xs">Members</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* All Categories Grid */}
        <section className="w-full px-4 md:px-8 lg:px-12 py-12 md:py-16">
          {/* Section intro */}
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-2">
              <i className="ri-grid-line text-accent-500 text-lg"></i>
              <span className="text-sm font-semibold text-accent-500 uppercase tracking-wider">
                {categoriesList.length} Categories
              </span>
            </div>
            <h2 className="font-heading text-2xl md:text-3xl text-foreground-900 mb-2">
              Find Your Community
            </h2>
            <p className="text-foreground-500 text-sm md:text-base max-w-xl">
              Each category has dedicated sub-topics, expert local knowledge, and
              an active community ready to help.
            </p>
          </div>

          {/* Category Cards Grid */}
          {error ? (
            <ErrorState message={error} onRetry={fetchCategories} className="my-12" />
          ) : isLoading ? (
            <LoadingSpinner size="lg" className="my-20" />
          ) : categoriesList.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6">
              {categoriesList.map((category) => (
                <Link
                  key={category.id}
                  to={`/category/${category.id}`}
                  className="group bg-background-50 rounded-xl border border-background-200/70 overflow-hidden hover:border-primary-200/60 transition-all duration-300 flex flex-col"
                >
                  {/* Card Image */}
                  <div className="relative h-44 overflow-hidden">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>

                    {/* Icon badge */}
                    <div className="absolute bottom-3 left-3 w-10 h-10 flex items-center justify-center bg-white/20 backdrop-blur-sm rounded-lg">
                      <i className={`${category.icon} text-white text-lg`}></i>
                    </div>

                    {/* Topic count badge */}
                    <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 bg-black/40 backdrop-blur-sm text-white text-xs rounded-full">
                      <i className="ri-price-tag-3-line text-xs"></i>
                      {category.subcategories?.length || 0}
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 md:p-5 flex-1 flex flex-col">
                    <h3 className="font-heading text-lg text-foreground-900 group-hover:text-primary-500 transition-colors mb-2 leading-tight">
                      {category.name}
                    </h3>
                    <p className="text-foreground-500 text-xs md:text-sm leading-relaxed mb-4 flex-1">
                      {category.description}
                    </p>

                    {/* Stats row */}
                    <div className="flex items-center gap-4 pt-3 border-t border-background-100">
                      <div className="flex items-center gap-1.5 text-xs text-foreground-400">
                        <i className="ri-chat-3-line text-sm"></i>
                        <span className="font-medium text-foreground-700">
                          {category.threadCount.toLocaleString()}
                        </span>
                        <span className="hidden sm:inline">threads</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-foreground-400">
                        <i className="ri-group-line text-sm"></i>
                        <span className="font-medium text-foreground-700">
                          {category.memberCount.toLocaleString()}
                        </span>
                        <span className="hidden sm:inline">members</span>
                      </div>
                      <div className="ml-auto">
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-primary-500 group-hover:translate-x-0.5 transition-transform">
                          Browse
                          <i className="ri-arrow-right-line text-sm"></i>
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              icon="ri-stack-line"
              title="No categories found"
              description="Forum categories will appear here once configured."
              className="my-12"
            />
          )}
        </section>

        {/* Bottom CTA — Start a Discussion */}
        <section className="w-full px-4 md:px-8 lg:px-12 pb-20 md:pb-28">
          <div className="bg-background-100 rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="max-w-lg">
              <div className="flex items-center gap-2 mb-2">
                <i className="ri-lightbulb-flash-line text-accent-500 text-lg"></i>
                <span className="text-sm font-semibold text-accent-500 uppercase tracking-wider">
                  Can&apos;t Find What You Need?
                </span>
              </div>
              <h3 className="font-heading text-2xl md:text-3xl text-foreground-900 mb-2">
                Start Your Own Discussion
              </h3>
              <p className="text-foreground-500 text-sm md:text-base">
                Have a question or story to share? Create a new thread and
                get answers from the Alanya community within minutes.
              </p>
            </div>
            <Link
              to="/new-thread"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-background-50 rounded-full text-sm font-medium whitespace-nowrap hover:bg-primary-600 transition-colors shrink-0"
            >
              <i className="ri-edit-line"></i>
              Create a Thread
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}