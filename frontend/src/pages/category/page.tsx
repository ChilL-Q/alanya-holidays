import { useState, useMemo, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { forumService, type Category, type CategoryThread } from "@/api-services/forum.service";
import { categories as defaultCategories } from "@/mocks/categories";
import { categoryThreads as defaultCategoryThreads } from "@/mocks/category-threads";
import Navbar from "@/pages/home/components/Navbar";
import Footer from "@/pages/home/components/Footer";
import CategoryHeader from "./components/CategoryHeader";
import SubcategorySidebar from "./components/SubcategorySidebar";
import ThreadCard from "./components/ThreadCard";
import ThreadFilters from "./components/ThreadFilters";

export default function CategoryPage() {
  const { categoryId } = useParams<{ categoryId: string }>();

  // Category state
  const initialCategory = defaultCategories.find((c) => c.id === categoryId) ?? null;
  const [category, setCategory] = useState<Category | null>(initialCategory);
  const [allCategories, setAllCategories] = useState<Category[]>(defaultCategories);

  // Threads state
  const initialThreads = categoryId && defaultCategoryThreads[categoryId] ? defaultCategoryThreads[categoryId] : [];
  const [fetchedThreads, setFetchedThreads] = useState<CategoryThread[]>(initialThreads);
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("latest");
  const [visibleCount, setVisibleCount] = useState(5);
  const ITEMS_PER_LOAD = 5;

  // Load category and all categories
  useEffect(() => {
    if (!categoryId) return;
    let isMounted = true;

    forumService
      .getCategoryById(categoryId)
      .then((cat) => {
        if (isMounted && cat) {
          setCategory(cat);
        }
      })
      .catch((err) => {
        console.warn("Failed to fetch category:", err);
      });

    forumService
      .getCategories()
      .then((cats) => {
        if (isMounted && cats && cats.length > 0) {
          setAllCategories(cats);
        }
      })
      .catch((err) => {
        console.warn("Failed to fetch all categories:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [categoryId]);

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
        console.warn("Failed to fetch threads:", err);
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

  const visibleThreads = allFilteredThreads.slice(0, visibleCount);
  const hasMore = visibleCount < allFilteredThreads.length;

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + ITEMS_PER_LOAD);
  };

  // Reset visible count when category or filters change
  useEffect(() => {
    setVisibleCount(5);
  }, [category?.id, activeSubcategory, sortBy]);

  if (!category) {
    return (
      <>
        <Navbar />
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 pt-20">
          <div className="w-20 h-20 flex items-center justify-center rounded-full bg-background-100">
            <i className="ri-error-warning-line text-foreground-400 text-3xl"></i>
          </div>
          <h2 className="font-heading text-2xl text-foreground-900">
            Category Not Found
          </h2>
          <p className="text-foreground-500 text-sm">
            The category you are looking for does not exist or has been moved.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 text-background-50 rounded-full text-sm font-medium hover:bg-primary-600 transition-colors"
          >
            <i className="ri-arrow-left-line"></i>
            Back to Home
          </Link>
        </div>
        <Footer />
      </>
    );
  }

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

                <Link
                  to={`/new-thread?category=${category.id}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 text-background-50 rounded-full text-sm font-medium whitespace-nowrap hover:bg-primary-600 transition-colors cursor-pointer"
                >
                  <i className="ri-edit-line"></i>
                  Start a Discussion
                </Link>
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
                    No discussions yet
                  </h3>
                  <p className="text-foreground-500 text-sm mb-6">
                    {activeSubcategory
                      ? `No threads in "${activeSubcategory}". Try a different topic or clear the filter.`
                      : "Be the first to start a discussion in this category!"}
                  </p>
                  {activeSubcategory && (
                    <button
                      onClick={() => setActiveSubcategory(null)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-background-100 text-foreground-700 rounded-full text-sm font-medium hover:bg-background-200 transition-colors cursor-pointer"
                    >
                      <i className="ri-filter-off-line"></i>
                      Clear Filter
                    </button>
                  )}
                </div>
              )}

              {/* Pagination */}
              {allFilteredThreads.length > 0 && (
                <div className="mt-8 flex items-center justify-between">
                  <p className="text-xs text-foreground-400">
                    Showing {visibleThreads.length} of {allFilteredThreads.length} discussions
                    {activeSubcategory && ` in "${activeSubcategory}"`}
                  </p>
                  {hasMore && (
                    <button
                      onClick={handleLoadMore}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-background-100 text-foreground-700 rounded-full text-sm font-medium hover:bg-primary-50 hover:text-primary-600 transition-colors cursor-pointer"
                    >
                      Load More
                      <i className="ri-arrow-down-line"></i>
                    </button>
                  )}
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
                Discover More
              </span>
            </div>
            <h2 className="font-heading text-2xl md:text-3xl text-foreground-900 mb-6">
              Explore Other Categories
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {allCategories
                .filter((c) => c.id !== category.id)
                .slice(0, 5)
                .map((c) => (
                  <Link
                    key={c.id}
                    to={`/category/${c.id}`}
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
    </>
  );
}