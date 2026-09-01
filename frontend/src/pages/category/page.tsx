import { useState, useMemo, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { forumService, type Category, type CategoryThread } from "@/api-services/forum.service";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/pages/home/components/Navbar";
import Footer from "@/pages/home/components/Footer";
import CategoryHeader from "./components/CategoryHeader";
import SubcategorySidebar from "./components/SubcategorySidebar";
import ThreadCard from "./components/ThreadCard";
import ThreadFilters from "./components/ThreadFilters";
import PaginationControls from "@/components/base/PaginationControls";
import ErrorState from "@/components/base/ErrorState";
import { logger } from "@/lib/logger";
import SubmitContentModal from "@/components/feature/SubmitContentModal";
import { useTranslation } from "react-i18next";
import "@/i18n";

export default function CategoryPage() {
  const { t } = useTranslation();
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();

  // Category state
  const [category, setCategory] = useState<Category | null>(null);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  // Threads state
  const [fetchedThreads, setFetchedThreads] = useState<CategoryThread[]>([]);
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("latest");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(5);
  const [visibleCount, setVisibleCount] = useState(5);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const ITEMS_PER_LOAD = 5;

  const loadCategory = useCallback(async () => {
    if (!categoryId) return;
    setCategoryLoading(true);
    setCategoryError(null);
    try {
      const [cat, cats] = await Promise.all([
        forumService.getCategoryById(categoryId),
        forumService.getCategories(),
      ]);
      setCategory(cat);
      if (cats) setAllCategories(cats);
    } catch {
    setCategoryError(t("public.categoryLoadFailed"));
    } finally {
      setCategoryLoading(false);
    }
  }, [categoryId, t]);

  useEffect(() => {
    loadCategory();
  }, [loadCategory]);

  // Load threads
  useEffect(() => {
    if (!categoryId) return;
    let isMounted = true;

    forumService
      .getThreads({
        categoryId,
        categorySlug: categoryId,
        subcategory: activeSubcategory || undefined,
        sort: sortBy as "latest" | "hot" | "popular" | "unreplied",
      })
      .then((result) => {
        if (isMounted) {
          setFetchedThreads(result.threads);
        }
      })
      .catch((err) => {
        logger.warn("Failed to fetch threads:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [categoryId, activeSubcategory, sortBy]);

  const allFilteredThreads = useMemo(() => {
    let result = [...fetchedThreads];

    if (activeSubcategory) {
      result = result.filter((t) => t.subcategory === activeSubcategory);
    }

    switch (sortBy) {
      case "hot":
        result.sort((a, b) => b.replies - a.replies);
        break;
      case "popular":
        result.sort((a, b) => b.views - a.views);
        break;
      case "unreplied":
        result.sort((a, b) => a.replies - b.replies);
        break;
      case "latest":
      default:
        break;
    }

    return result;
  }, [fetchedThreads, activeSubcategory, sortBy]);

  const totalPages = Math.ceil(allFilteredThreads.length / pageSize) || 1;
  const visibleThreads = allFilteredThreads.slice(0, visibleCount);
  const hasMore = visibleCount < allFilteredThreads.length;

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + ITEMS_PER_LOAD);
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setVisibleCount(page * pageSize);
    window.scrollTo({ top: 350, behavior: "smooth" });
  };

  // Reset visible count when category or filters change
  useEffect(() => {
    setVisibleCount(5);
    setCurrentPage(1);
  }, [category?.id, activeSubcategory, sortBy]);

  if (categoryLoading) {
    return (
      <>
        <Navbar />
        <main className="min-h-[60vh] flex flex-col items-center justify-center p-8">
          <div className="w-full max-w-md bg-background-50 rounded-2xl border border-background-200/70 p-8 text-center animate-pulse space-y-4">
            <div className="h-6 bg-background-200 rounded w-1/2 mx-auto" />
            <div className="h-4 bg-background-100 rounded w-3/4 mx-auto" />
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (categoryError) {
    return (
      <>
        <Navbar />
        <main className="min-h-[60vh] flex flex-col items-center justify-center p-8">
          <ErrorState
            title={t("public.categoryLoadFailed")}
            message={categoryError}
            onRetry={loadCategory}
          />
        </main>
        <Footer />
      </>
    );
  }

  if (!category) {
    return (
      <>
        <Navbar />
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 pt-20">
          <div className="w-20 h-20 flex items-center justify-center rounded-full bg-background-100">
            <i className="ri-error-warning-line text-foreground-400 text-3xl"></i>
          </div>
          <h2 className="font-heading text-2xl text-foreground-900">
            {t("public.categoryNotFound")}
          </h2>
          <p className="text-foreground-500 text-sm">
            {t("public.categoryMissing")}
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 text-background-50 rounded-full text-sm font-medium hover:bg-primary-600 transition-colors"
          >
            <i className="ri-arrow-left-line"></i>
            {t("public.backHome")}
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  const handleStartDiscussion = () => {
    if (authLoading) return;

    if (!isAuthenticated) {
      const searchParams = new URLSearchParams({
        category: category.slug || category.id,
      });
      if (activeSubcategory) {
        searchParams.set("subcategory", activeSubcategory);
      }
      const returnPath = `/new-thread?${searchParams.toString()}`;

      navigate("/register", {
        state: { from: { pathname: returnPath } },
      });
      return;
    }

    setIsSubmitModalOpen(true);
  };

  return (
    <>
      <Navbar />
      <main>
        <CategoryHeader category={category} />

        {/* Main content area */}
        <section className="w-full px-4 md:px-8 lg:px-12 py-8 md:py-12">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
            {/* Sidebar */}
            <SubcategorySidebar
              subcategories={category.subcategories}
              categoryName={category.name}
              activeSubcategory={activeSubcategory}
              onSelect={setActiveSubcategory}
            />

            {/* Thread listing */}
            <div className="flex-1 min-w-0">
              {/* Top bar: Filters + New Discussion CTA */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <ThreadFilters
                  totalThreads={allFilteredThreads.length}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                />

                <button
                  type="button"
                  onClick={handleStartDiscussion}
                  disabled={authLoading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 text-background-50 rounded-full text-sm font-medium whitespace-nowrap hover:bg-primary-600 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-wait"
                >
                  <i className="ri-edit-line"></i>
                  {t("public.startDiscussion")}
                </button>
              </div>

              {/* Thread list */}
              {allFilteredThreads.length > 0 ? (
                <>
                  <div className="space-y-4">
                    {visibleThreads.map((thread) => (
                      <ThreadCard key={thread.id} thread={thread} />
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-16">
                  <div className="w-16 h-16 mx-auto flex items-center justify-center rounded-full bg-background-100 mb-4">
                    <i className="ri-chat-off-line text-foreground-400 text-2xl"></i>
                  </div>
                  <h3 className="font-heading text-lg text-foreground-900 mb-2">
                    {t("public.noDiscussionsYet")}
                  </h3>
                  <p className="text-foreground-500 text-sm mb-6">
                    {activeSubcategory
                      ? t("public.noThreadsInTopic", { topic: activeSubcategory })
                      : t("public.beFirstDiscussion")}
                  </p>
                  {activeSubcategory && (
                    <button
                      onClick={() => setActiveSubcategory(null)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-background-100 text-foreground-700 rounded-full text-sm font-medium hover:bg-background-200 transition-colors cursor-pointer"
                    >
                      <i className="ri-filter-off-line"></i>
                      {t("public.clearFilter")}
                    </button>
                  )}
                </div>
              )}

              {/* Pagination Controls */}
              {allFilteredThreads.length > 0 && (
                <div className="mt-8">
                  <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={allFilteredThreads.length}
                    pageSize={pageSize}
                    showItemCount={true}
                    itemName="discussions"
                    mode="both"
                    hasMore={hasMore}
                    onLoadMore={handleLoadMore}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Related categories */}
        <section className="w-full px-4 md:px-8 lg:px-12 pb-16 md:pb-24">
          <div className="border-t border-background-200/70 pt-10 md:pt-14">
            <div className="flex items-center gap-2 mb-2">
              <i className="ri-stack-line text-accent-500 text-lg"></i>
              <span className="text-sm font-semibold text-accent-500 uppercase tracking-wider">
                {t("public.discoverMore")}
              </span>
            </div>
            <h2 className="font-heading text-2xl md:text-3xl text-foreground-900 mb-6">
              {t("public.exploreOtherCategories")}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {allCategories
                .filter((c) => c.id !== category.id)
                .slice(0, 5)
                .map((c) => (
                  <Link
                    key={c.id}
                    to={`/category/${c.slug || c.id}`}
                    className="group flex items-center gap-3 px-4 py-3 bg-background-50 rounded-xl border border-background-200/70 hover:border-primary-200/60 transition-all"
                  >
                    <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-background-100 group-hover:bg-primary-100 transition-colors">
                      <i className={`${c.icon} text-foreground-600 group-hover:text-primary-500 transition-colors`}></i>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground-900 truncate">
                        {c.name}
                      </p>
                      <p className="text-xs text-foreground-400">
                        {c.threadCount.toLocaleString()} threads
                      </p>
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <SubmitContentModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        initialCategoryId={category.id}
        initialCategoryName={category.name}
        initialSubcategory={activeSubcategory || undefined}
        fallbackPath={`/category/${category.slug || category.id}`}
        lockCategory
      />
    </>
  );
}
