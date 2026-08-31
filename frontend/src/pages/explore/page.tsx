import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "@/pages/home/components/Navbar";
import Footer from "@/pages/home/components/Footer";
import PageHeroImage from "@/components/base/PageHeroImage";
import BusinessCard from "@/pages/explore/components/BusinessCard";
import MapView from "@/pages/explore/components/MapView";
import ClaimListingModal from "@/components/feature/ClaimListingModal";
import ListBusinessModal from "@/components/feature/ListBusinessModal";
import {
  directoryService,
  businessCategories,
  normalizeBusinessCategory,
  type Business,
} from "@/api-services/directory.service";
import { isAbortError } from "@/lib/api-client";
import { ErrorState } from "@/components/base/ErrorState";
import { EmptyState } from "@/components/base/EmptyState";
import LoadingSpinner from "@/components/base/LoadingSpinner";
import { useFavorites } from "@/hooks/useFavorites";
import { useCompare } from "@/hooks/useCompare";
import { useTranslation } from "react-i18next";
import "@/i18n";

export default function ExplorePage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [sortBy, setSortBy] = useState<"rating" | "reviews" | "name">("rating");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid" | "map">("grid");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [allBusinesses, setAllBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claimBusiness, setClaimBusiness] = useState<Business | null>(null);
  const [listModalOpen, setListModalOpen] = useState(false);

  const { isFavorite, favoriteCount } = useFavorites();
  const { selectedIds, isSelected, toggleSelect, clearSelection, selectedCount, maxReached } = useCompare();
  const navigate = useNavigate();

  // Read initial category from URL
  useEffect(() => {
    const category = searchParams.get("category");
    const normalizedCategory = category ? normalizeBusinessCategory(category) : null;
    if (normalizedCategory && businessCategories.some((c) => c.id === normalizedCategory)) {
      setActiveCategory(normalizedCategory);
      setShowFavoritesOnly(false);
    }
  }, [searchParams]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = searchQuery.trim()
        ? await directoryService.searchListings(searchQuery.trim(), {
            category: activeCategory !== "all" ? activeCategory : undefined,
          })
        : await directoryService.getListings({
            category: activeCategory !== "all" ? activeCategory : undefined,
            sortBy,
          });

      setAllBusinesses(res?.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load directory listings");
    } finally {
      setIsLoading(false);
    }
  };

  // Load businesses via directoryService with AbortController
  useEffect(() => {
    const controller = new AbortController();

    const executeLoad = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = searchQuery.trim()
          ? await directoryService.searchListings(searchQuery.trim(), {
              category: activeCategory !== "all" ? activeCategory : undefined,
              signal: controller.signal,
            })
          : await directoryService.getListings({
              category: activeCategory !== "all" ? activeCategory : undefined,
              sortBy,
              signal: controller.signal,
            });

        setAllBusinesses(res?.data || []);
      } catch (err) {
        if (isAbortError(err)) return;
        setError(err instanceof Error ? err.message : "Failed to load directory listings");
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    executeLoad();

    return () => {
      controller.abort();
    };
  }, [activeCategory, searchQuery, sortBy]);

  const filteredBusinesses = useMemo(() => {
    let results: Business[] = allBusinesses;

    // Category filter
    if (activeCategory !== "all") {
      results = results.filter((b) => b.category === activeCategory);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      results = results.filter(
        (b) =>
          b.name.toLowerCase().includes(query) ||
          b.description.toLowerCase().includes(query) ||
          b.subcategory.toLowerCase().includes(query) ||
          b.tags.some((tag) => tag.toLowerCase().includes(query)) ||
          b.address.toLowerCase().includes(query)
      );
    }

    // Favorites filter
    if (showFavoritesOnly) {
      results = results.filter((b) => isFavorite(b.id));
    }

    // Sort
    if (sortBy === "rating") {
      results = [...results].sort((a, b) => b.rating - a.rating);
    } else if (sortBy === "reviews") {
      results = [...results].sort((a, b) => b.reviewCount - a.reviewCount);
    } else {
      results = [...results].sort((a, b) => a.name.localeCompare(b.name));
    }

    return results;
  }, [allBusinesses, searchQuery, activeCategory, sortBy, showFavoritesOnly, isFavorite]);

  const currentCategory = businessCategories.find((c) => c.id === activeCategory);
  const sortLabel = sortBy === "rating" ? t("public.topRated") : sortBy === "reviews" ? t("public.mostReviewed") : "A-Z";

  return (
    <>
      <Navbar />
      <main>
        {/* Hero Section */}
        <section className="relative w-full h-[320px] md:h-[420px] overflow-hidden">
          <PageHeroImage
            page="explore"
            alt="Alanya Business Directory"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-foreground-950/50 via-foreground-950/25 to-foreground-950/70" />

          <div className="absolute bottom-0 left-0 right-0 w-full px-4 md:px-8 lg:px-12 pb-10 md:pb-14">
            <div className="flex items-center gap-2 mb-4">
                <Link to="/" className="text-white/60 hover:text-white/90 text-sm transition-colors underline underline-offset-2">{t("nav.home")}</Link>
              <i className="ri-arrow-right-s-line text-white/40 text-sm" />
              <span className="text-white/90 text-sm">{t("public.businessDirectory")}</span>
            </div>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="font-heading text-3xl md:text-5xl text-white mb-2">{t("public.directoryTitle")}</h1>
                <p className="text-white/70 text-sm md:text-base max-w-xl">
                  {t("public.exploreDescription")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setListModalOpen(true)}
                className="self-start md:self-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 transition-colors shadow-sm cursor-pointer whitespace-nowrap"
              >
                <i className="ri-add-circle-fill text-base" />
                {t("public.listYourBusiness")}
              </button>
            </div>
          </div>
        </section>

        {/* Search Bar */}
        <section className="w-full px-4 md:px-8 lg:px-12 bg-background-50">
          <div className="max-w-3xl mx-auto -mt-8 relative z-10">
            <div className="bg-white rounded-2xl border border-background-200/70 p-2 flex items-center gap-2 shadow-sm">
              <div className="flex items-center gap-2 flex-1 px-3">
                <i className="ri-search-line text-foreground-400 text-lg" />
                <input
                  type="text"
                  placeholder={t("public.directorySearch")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 text-sm text-foreground-900 placeholder:text-foreground-400 py-3 bg-transparent border-none outline-none"
                />
              </div>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-background-100 text-foreground-500 hover:bg-background-200 transition-colors cursor-pointer shrink-0"
                >
                  <i className="ri-close-line text-lg" />
                </button>
              )}
              <button
                type="button"
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <i className="ri-search-line text-sm" />
                {t("public.searchBusinesses")}
              </button>
            </div>
          </div>
        </section>

        {/* Category Filters */}
        <section className="w-full px-4 md:px-8 lg:px-12 pt-8 pb-4 bg-background-50">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide flex-wrap">
              {businessCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => { setActiveCategory(cat.id); setShowFavoritesOnly(false); }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                    activeCategory === cat.id && !showFavoritesOnly
                      ? "bg-primary-500 text-white shadow-sm"
                      : "bg-white border border-foreground-200 text-foreground-600 hover:border-primary-200 hover:text-foreground-900"
                  }`}
                >
                  <i className={`${cat.icon} text-sm`} />
                  {cat.name}
                </button>
              ))}
              <div className="w-px h-8 bg-background-200 mx-1" />
              <button
                type="button"
                onClick={() => { setShowFavoritesOnly(!showFavoritesOnly); setActiveCategory("all"); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                  showFavoritesOnly
                    ? "bg-accent-500 text-white shadow-sm"
                    : "bg-white border border-foreground-200 text-foreground-600 hover:border-accent-200 hover:text-foreground-900"
                }`}
              >
                <i className={`${showFavoritesOnly ? "ri-heart-fill" : "ri-heart-line"} text-sm`} />
                {t("public.myFavorites")}
                {favoriteCount > 0 && (
                  <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${
                    showFavoritesOnly ? "bg-white/20 text-white" : "bg-accent-100 text-accent-700"
                  }`}>
                    {favoriteCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Results Header with 3-Way Responsive View Switcher */}
        <section className="w-full px-4 md:px-8 lg:px-12 py-6 bg-background-50">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-heading text-xl md:text-2xl text-foreground-900 mb-1">
                  {showFavoritesOnly
                    ? t("public.myFavorites")
                    : currentCategory && activeCategory !== "all"
                      ? currentCategory.name
                      : t("public.allBusinesses")}
                </h2>
                <p className="text-sm text-foreground-500">
                  {t(filteredBusinesses.length === 1 ? "public.businessFound" : "public.businessesFound", { count: filteredBusinesses.length })}
                  {showFavoritesOnly && t("public.inFavorites")}
                  {searchQuery && (
                    <span> for &quot;{searchQuery}&quot;</span>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                {/* 3-Way View Switcher: Grid (Default), List, Map */}
                <div className="flex items-center bg-background-100 rounded-full p-1 border border-background-200">
                  <button
                    type="button"
                    onClick={() => setViewMode("grid")}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      viewMode === "grid"
                        ? "bg-white text-foreground-900 shadow-sm"
                        : "text-foreground-500 hover:text-foreground-700"
                    }`}
                  >
                    <i className="ri-grid-fill text-sm" />
                    {t("public.grid")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      viewMode === "list"
                        ? "bg-white text-foreground-900 shadow-sm"
                        : "text-foreground-500 hover:text-foreground-700"
                    }`}
                  >
                    <i className="ri-list-check-3 text-sm" />
                    {t("public.list")}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setViewMode("map"); setCompareMode(false); }}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      viewMode === "map"
                        ? "bg-white text-foreground-900 shadow-sm"
                        : "text-foreground-500 hover:text-foreground-700"
                    }`}
                  >
                    <i className="ri-map-pin-line text-sm" />
                    {t("public.map")}
                  </button>
                </div>

                {/* Compare toggle */}
                {viewMode !== "map" && (
                  <button
                    type="button"
                    onClick={() => { setCompareMode(!compareMode); if (compareMode) clearSelection(); }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                      compareMode
                        ? "bg-accent-500 text-white shadow-sm"
                        : "bg-white border border-foreground-200 text-foreground-700 hover:border-accent-300 hover:text-foreground-900"
                    }`}
                  >
                    <i className={`${compareMode ? "ri-scales-fill" : "ri-scales-line"} text-sm`} />
                    {t("public.compare")}
                  </button>
                )}

                {/* Sort dropdown */}
                {viewMode !== "map" && (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowSortDropdown(!showSortDropdown)}
                      className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-foreground-200 text-xs sm:text-sm text-foreground-700 hover:border-foreground-300 transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <i className="ri-sort-desc text-sm" />
                      {sortLabel}
                      <i className={`ri-arrow-down-s-line text-sm transition-transform duration-200 ${showSortDropdown ? "rotate-180" : ""}`} />
                    </button>

                    {showSortDropdown && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowSortDropdown(false)} />
                        <div className="absolute right-0 top-full mt-2 w-44 rounded-xl bg-white border border-background-200/80 shadow-lg overflow-hidden z-20">
                          <button
                            type="button"
                            onClick={() => { setSortBy("rating"); setShowSortDropdown(false); }}
                            className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors cursor-pointer ${sortBy === "rating" ? "bg-primary-50 text-primary-700 font-semibold" : "text-foreground-700 hover:bg-background-100"}`}
                          >
                            <i className="ri-star-line text-sm" />
                            Top Rated
                          </button>
                          <button
                            type="button"
                            onClick={() => { setSortBy("reviews"); setShowSortDropdown(false); }}
                            className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors cursor-pointer ${sortBy === "reviews" ? "bg-primary-50 text-primary-700 font-semibold" : "text-foreground-700 hover:bg-background-100"}`}
                          >
                            <i className="ri-message-3-line text-sm" />
                            Most Reviewed
                          </button>
                          <button
                            type="button"
                            onClick={() => { setSortBy("name"); setShowSortDropdown(false); }}
                            className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors cursor-pointer ${sortBy === "name" ? "bg-primary-50 text-primary-700 font-semibold" : "text-foreground-700 hover:bg-background-100"}`}
                          >
                            <i className="ri-sort-alphabet-asc text-sm" />
                            A-Z
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Business Cards Display (Horizontal List vs Grid vs Map) */}
        {viewMode === "list" ? (
          <section className="w-full px-4 md:px-8 lg:px-12 pb-20 bg-background-50">
            <div className="max-w-7xl mx-auto">
              {error ? (
                <ErrorState message={error} onRetry={loadData} className="my-12" />
              ) : isLoading ? (
                <LoadingSpinner size="lg" className="my-20" />
              ) : filteredBusinesses.length > 0 ? (
                <div className="flex flex-col gap-5">
                  {filteredBusinesses.map((business) => (
                    <BusinessCard
                      key={business.id}
                      business={business}
                      layout="horizontal"
                      compareMode={compareMode}
                      isCompared={isSelected(business.id)}
                      onToggleCompare={toggleSelect}
                      onClaimClick={(biz) => setClaimBusiness(biz)}
                      maxReached={maxReached}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon="ri-search-line"
                  title={t("public.noBusinesses")}
                  description={t("public.adjustSearch")}
                  action={{
                    label: t("public.resetFilters"),
                    onClick: () => {
                      setSearchQuery("");
                      setActiveCategory("all");
                      setShowFavoritesOnly(false);
                    },
                    icon: <i className="ri-refresh-line text-sm" />,
                  }}
                  className="my-12"
                />
              )}
            </div>
          </section>
        ) : viewMode === "grid" ? (
          <section className="w-full px-4 md:px-8 lg:px-12 pb-20 bg-background-50">
            <div className="max-w-7xl mx-auto">
              {error ? (
                <ErrorState message={error} onRetry={loadData} className="my-12" />
              ) : isLoading ? (
                <LoadingSpinner size="lg" className="my-20" />
              ) : filteredBusinesses.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                  {filteredBusinesses.map((business) => (
                    <BusinessCard
                      key={business.id}
                      business={business}
                      layout="grid"
                      compareMode={compareMode}
                      isCompared={isSelected(business.id)}
                      onToggleCompare={toggleSelect}
                      onClaimClick={(biz) => setClaimBusiness(biz)}
                      maxReached={maxReached}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon="ri-search-line"
                  title={t("public.noBusinesses")}
                  description={t("public.adjustSearch")}
                  action={{
                    label: t("public.resetFilters"),
                    onClick: () => {
                      setSearchQuery("");
                      setActiveCategory("all");
                      setShowFavoritesOnly(false);
                    },
                    icon: <i className="ri-refresh-line text-sm" />,
                  }}
                  className="my-12"
                />
              )}
            </div>
          </section>
        ) : (
          /* Map View */
          <section className="w-full pb-20 bg-background-50">
            {error ? (
              <div className="max-w-7xl mx-auto px-4">
                <ErrorState message={error} onRetry={loadData} className="my-12" />
              </div>
            ) : isLoading ? (
              <LoadingSpinner size="lg" className="my-20" />
            ) : (
              <MapView
                businesses={filteredBusinesses}
                searchQuery={searchQuery}
                activeCategory={activeCategory}
                onSearchChange={setSearchQuery}
                onCategoryChange={setActiveCategory}
              />
            )}
          </section>
        )}

        {/* Floating Compare Bar */}
        {compareMode && selectedCount > 0 && (
          <div className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-4 pointer-events-none">
            <div className="max-w-3xl mx-auto bg-foreground-900 rounded-2xl px-5 py-4 flex items-center justify-between gap-4 pointer-events-auto shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-accent-500/20">
                  <i className="ri-scales-line text-accent-400 text-lg" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white whitespace-nowrap">
                    {t("public.selected", { count: selectedCount })}
                  </p>
                  <p className="text-xs text-white/50 whitespace-nowrap">
                    {selectedCount < 2 ? t("public.selectMore") : t("public.readyCompare")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={clearSelection}
                  className="px-4 py-2 rounded-full text-sm text-white/60 hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap cursor-pointer"
                >
                  {t("public.clear")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const ids = Array.from(selectedIds).join(",");
                    navigate(`/compare?ids=${ids}`);
                  }}
                  disabled={selectedCount < 2}
                  className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    selectedCount < 2
                      ? "bg-white/20 text-white/40 cursor-not-allowed"
                      : "bg-accent-500 text-white hover:bg-accent-600 shadow-sm"
                  }`}
                >
                  <i className="ri-scales-line text-sm mr-1.5" />
                  {t("public.compareNow")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CTA Section */}
        <section className="w-full px-4 md:px-8 lg:px-12 py-16 md:py-20 bg-foreground-900">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 bg-white/5 mb-6">
              <i className="ri-store-2-line text-accent-400 text-sm" />
              <span className="text-sm font-medium text-white/80">{t("public.ownBusinessCta")}</span>
            </div>
            <h2 className="font-heading text-2xl md:text-4xl text-white mb-4">
              {t("public.listBusinessTitle")}
            </h2>
            <p className="text-white/60 text-sm md:text-base max-w-xl mx-auto mb-8">
              {t("public.listBusinessDescription")}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setListModalOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors whitespace-nowrap shadow-sm cursor-pointer"
              >
                <i className="ri-add-circle-line text-sm" />
                {t("public.addBusiness")}
              </button>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/30 text-white text-sm font-medium hover:bg-white/10 transition-colors whitespace-nowrap"
              >
                <i className="ri-user-add-line text-sm" />
                Create Account
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Claim Listing Modal */}
      <ClaimListingModal
        business={claimBusiness}
        isOpen={!!claimBusiness}
        onClose={() => setClaimBusiness(null)}
      />

      {/* List Business Modal */}
      <ListBusinessModal
        isOpen={listModalOpen}
        onClose={() => setListModalOpen(false)}
      />

      <Footer />
    </>
  );
}
