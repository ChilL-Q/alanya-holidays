import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "@/pages/home/components/Navbar";
import Footer from "@/pages/home/components/Footer";
import BusinessCard from "@/pages/explore/components/BusinessCard";
import MapView from "@/pages/explore/components/MapView";
import { businesses as initialBusinesses, businessCategories } from "@/mocks/businesses";
import { directoryService } from "@/api-services/directory.service";
import { useFavorites } from "@/hooks/useFavorites";
import { useCompare } from "@/hooks/useCompare";
import type { Business } from "@/mocks/businesses";

export default function ExplorePage() {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [sortBy, setSortBy] = useState<"rating" | "reviews" | "name">("rating");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [allBusinesses, setAllBusinesses] = useState<Business[]>(initialBusinesses);
  const { isFavorite, favoriteCount } = useFavorites();
  const { selectedIds, isSelected, toggleSelect, clearSelection, selectedCount, maxReached } = useCompare();
  const navigate = useNavigate();

  // Read initial category from URL
  useEffect(() => {
    const category = searchParams.get("category");
    if (category && businessCategories.some((c) => c.id === category)) {
      setActiveCategory(category);
      setShowFavoritesOnly(false);
    }
  }, [searchParams]);

  // Load businesses via directoryService
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const res = searchQuery.trim()
          ? await directoryService.searchListings(searchQuery.trim(), {
              category: activeCategory !== "all" ? activeCategory : undefined,
            })
          : await directoryService.getListings({
              category: activeCategory !== "all" ? activeCategory : undefined,
              sortBy,
            });

        if (isMounted && res && res.data) {
          setAllBusinesses(res.data);
        }
      } catch (err) {
        console.warn("Failed to load listings via directoryService:", err);
      }
    };

    loadData();

    return () => {
      isMounted = false;
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

  const sortLabel = sortBy === "rating" ? "Top Rated" : sortBy === "reviews" ? "Most Reviewed" : "A-Z";

  return (
    <>
      <Navbar />
      <main>
        {/* Hero Section */}
        <section className="relative w-full h-[320px] md:h-[420px] overflow-hidden">
          <img
            src="https://readdy.ai/api/search-image?query=Wide%20panoramic%20aerial%20view%20of%20Alanya%20city%20center%20harbor%20marina%20with%20boats%20medieval%20castle%20on%20rocky%20peninsula%20modern%20buildings%20along%20coastline%20turquoise%20Mediterranean%20sea%20golden%20sunset%20warm%20light%20stunning%20travel%20destination%20editorial%20photography%20high%20detail&width=1800&height=840&seq=explore-hero-v2&orientation=landscape"
            alt="Alanya Business Directory"
            className="absolute inset-0 w-full h-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-foreground-950/50 via-foreground-950/25 to-foreground-950/70"></div>

          <div className="absolute bottom-0 left-0 right-0 w-full px-4 md:px-8 lg:px-12 pb-10 md:pb-14">
            <div className="flex items-center gap-2 mb-4">
              <Link to="/" className="text-white/60 hover:text-white/90 text-sm transition-colors underline underline-offset-2">Home</Link>
              <i className="ri-arrow-right-s-line text-white/40 text-sm"></i>
              <span className="text-white/90 text-sm">Business Directory</span>
            </div>
            <h1 className="font-heading text-3xl md:text-5xl text-white mb-2">Alanya Business Directory</h1>
            <p className="text-white/70 text-sm md:text-base max-w-xl">
              Find the best restaurants, hotels, tours, services, and more — all the businesses travelers need in one place.
            </p>
          </div>
        </section>

        {/* Search Bar */}
        <section className="w-full px-4 md:px-8 lg:px-12 bg-background-50">
          <div className="max-w-3xl mx-auto -mt-8 relative z-10">
            <div className="bg-white rounded-2xl border border-background-200/70 p-2 flex items-center gap-2">
              <div className="flex items-center gap-2 flex-1 px-3">
                <i className="ri-search-line text-foreground-400 text-lg"></i>
                <input
                  type="text"
                  placeholder="Search businesses by name, category, or keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 text-sm text-foreground-900 placeholder:text-foreground-400 py-3 bg-transparent border-none outline-none"
                />
              </div>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-background-100 text-foreground-500 hover:bg-background-200 transition-colors cursor-pointer shrink-0"
                >
                  <i className="ri-close-line text-lg"></i>
                </button>
              )}
              <button className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors whitespace-nowrap shrink-0 cursor-pointer">
                <i className="ri-search-line text-sm"></i>
                Search
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
                  onClick={() => { setActiveCategory(cat.id); setShowFavoritesOnly(false); }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                    activeCategory === cat.id && !showFavoritesOnly
                      ? "bg-primary-500 text-white"
                      : "bg-white border border-foreground-200 text-foreground-600 hover:border-primary-200 hover:text-foreground-900"
                  }`}
                >
                  <i className={`${cat.icon} text-sm`}></i>
                  {cat.name}
                </button>
              ))}
              <div className="w-px h-8 bg-background-200 mx-1"></div>
              <button
                onClick={() => { setShowFavoritesOnly(!showFavoritesOnly); setActiveCategory("all"); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                  showFavoritesOnly
                    ? "bg-accent-500 text-white"
                    : "bg-white border border-foreground-200 text-foreground-600 hover:border-accent-200 hover:text-foreground-900"
                }`}
              >
                <i className={`${showFavoritesOnly ? "ri-heart-fill" : "ri-heart-line"} text-sm`}></i>
                My Favorites
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

        {/* Results Header */}
        <section className="w-full px-4 md:px-8 lg:px-12 py-6 bg-background-50">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-heading text-xl md:text-2xl text-foreground-900 mb-1">
                  {showFavoritesOnly
                    ? "My Favorites"
                    : currentCategory && activeCategory !== "all"
                      ? currentCategory.name
                      : "All Businesses"}
                </h2>
                <p className="text-sm text-foreground-500">
                  {filteredBusinesses.length} {filteredBusinesses.length === 1 ? "business" : "businesses"} found
                  {showFavoritesOnly && " in your favorites"}
                  {searchQuery && (
                    <span> for &quot;{searchQuery}&quot;</span>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* View toggle */}
                <div className="flex items-center bg-background-100 rounded-full p-1">
                  <button
                    onClick={() => setViewMode("list")}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                      viewMode === "list"
                        ? "bg-white text-foreground-900 shadow-sm"
                        : "text-foreground-500 hover:text-foreground-700"
                    }`}
                  >
                    <i className="ri-list-check-3 text-sm"></i>
                    List
                  </button>
                  <button
                    onClick={() => { setViewMode("map"); setCompareMode(false); }}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                      viewMode === "map"
                        ? "bg-white text-foreground-900 shadow-sm"
                        : "text-foreground-500 hover:text-foreground-700"
                    }`}
                  >
                    <i className="ri-map-pin-line text-sm"></i>
                    Map
                  </button>
                </div>

                {/* Compare toggle */}
                {viewMode === "list" && (
                  <button
                    onClick={() => { setCompareMode(!compareMode); if (compareMode) clearSelection(); }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                      compareMode
                        ? "bg-accent-500 text-white"
                        : "bg-white border border-foreground-200 text-foreground-700 hover:border-accent-300 hover:text-foreground-900"
                    }`}
                  >
                    <i className={`${compareMode ? "ri-scales-fill" : "ri-scales-line"} text-sm`}></i>
                    Compare
                  </button>
                )}

                {/* Sort dropdown - only in list view */}
                {viewMode === "list" && (
                  <div className="relative">
                    <button
                      onClick={() => setShowSortDropdown(!showSortDropdown)}
                      className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-foreground-200 text-sm text-foreground-700 hover:border-foreground-300 transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <i className="ri-sort-desc text-sm"></i>
                      {sortLabel}
                      <i className={`ri-arrow-down-s-line text-sm transition-transform duration-200 ${showSortDropdown ? "rotate-180" : ""}`}></i>
                    </button>

                    {showSortDropdown && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowSortDropdown(false)}></div>
                        <div className="absolute right-0 top-full mt-2 w-44 rounded-xl bg-white border border-background-200/80 overflow-hidden z-20">
                          <button
                            onClick={() => { setSortBy("rating"); setShowSortDropdown(false); }}
                            className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors cursor-pointer ${sortBy === "rating" ? "bg-primary-50 text-primary-700 font-semibold" : "text-foreground-700 hover:bg-background-100"}`}
                          >
                            <i className="ri-star-line text-sm"></i>
                            Top Rated
                          </button>
                          <button
                            onClick={() => { setSortBy("reviews"); setShowSortDropdown(false); }}
                            className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors cursor-pointer ${sortBy === "reviews" ? "bg-primary-50 text-primary-700 font-semibold" : "text-foreground-700 hover:bg-background-100"}`}
                          >
                            <i className="ri-message-3-line text-sm"></i>
                            Most Reviewed
                          </button>
                          <button
                            onClick={() => { setSortBy("name"); setShowSortDropdown(false); }}
                            className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors cursor-pointer ${sortBy === "name" ? "bg-primary-50 text-primary-700 font-semibold" : "text-foreground-700 hover:bg-background-100"}`}
                          >
                            <i className="ri-sort-alphabet-asc text-sm"></i>
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

        {/* Business Cards Grid - List View */}
        {viewMode === "list" ? (
          <section className="w-full px-4 md:px-8 lg:px-12 pb-20 bg-background-50">
            <div className="max-w-7xl mx-auto">
              {filteredBusinesses.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                  {filteredBusinesses.map((business) => (
                    <BusinessCard
                      key={business.id}
                      business={business}
                      compareMode={compareMode}
                      isCompared={isSelected(business.id)}
                      onToggleCompare={toggleSelect}
                      maxReached={maxReached}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center rounded-full bg-accent-100">
                    {showFavoritesOnly ? (
                      <i className="ri-heart-line text-accent-500 text-2xl"></i>
                    ) : (
                      <i className="ri-search-line text-accent-500 text-2xl"></i>
                    )}
                  </div>
                  {showFavoritesOnly ? (
                    <>
                      <h3 className="font-heading text-xl text-foreground-900 mb-2">No favorites yet</h3>
                      <p className="text-sm text-foreground-500 max-w-md mx-auto mb-6">
                        Heart the businesses you love as you browse and they&apos;ll show up here. Start exploring and save your favorites!
                      </p>
                      <button
                        onClick={() => setShowFavoritesOnly(false)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors whitespace-nowrap cursor-pointer"
                      >
                        <i className="ri-compass-3-line text-sm"></i>
                        Browse All Businesses
                      </button>
                    </>
                  ) : (
                    <>
                      <h3 className="font-heading text-xl text-foreground-900 mb-2">No businesses found</h3>
                      <p className="text-sm text-foreground-500 max-w-md mx-auto mb-6">
                        Try adjusting your search or filters. We couldn&apos;t find any businesses matching your criteria.
                      </p>
                      <button
                        onClick={() => { setSearchQuery(""); setActiveCategory("all"); setShowFavoritesOnly(false); }}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors whitespace-nowrap cursor-pointer"
                      >
                        <i className="ri-refresh-line text-sm"></i>
                        Reset Filters
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </section>
        ) : (
          /* Map View */
          <section className="w-full pb-20 bg-background-50">
            <MapView
              businesses={filteredBusinesses}
              searchQuery={searchQuery}
              activeCategory={activeCategory}
              onSearchChange={setSearchQuery}
              onCategoryChange={setActiveCategory}
            />
          </section>
        )}

        {/* Floating Compare Bar */}
        {compareMode && selectedCount > 0 && (
          <div className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-4 pointer-events-none">
            <div className="max-w-3xl mx-auto bg-foreground-900 rounded-2xl px-5 py-4 flex items-center justify-between gap-4 pointer-events-auto">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-accent-500/20">
                  <i className="ri-scales-line text-accent-400 text-lg"></i>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white whitespace-nowrap">
                    {selectedCount} {selectedCount === 1 ? "business" : "businesses"} selected
                  </p>
                  <p className="text-xs text-white/50 whitespace-nowrap">
                    {selectedCount < 2 ? "Select at least 2 to compare" : "Ready to compare!"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={clearSelection}
                  className="px-4 py-2 rounded-full text-sm text-white/60 hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap cursor-pointer"
                >
                  Clear
                </button>
                <button
                  onClick={() => {
                    const ids = Array.from(selectedIds).join(",");
                    navigate(`/compare?ids=${ids}`);
                  }}
                  disabled={selectedCount < 2}
                  className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    selectedCount < 2
                      ? "bg-white/20 text-white/40 cursor-not-allowed"
                      : "bg-accent-500 text-white hover:bg-accent-600"
                  }`}
                >
                  <i className="ri-scales-line text-sm mr-1.5"></i>
                  Compare Now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CTA Section */}
        <section className="w-full px-4 md:px-8 lg:px-12 py-16 md:py-20 bg-foreground-900">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 bg-white/5 mb-6">
              <i className="ri-store-2-line text-accent-400 text-sm"></i>
              <span className="text-sm font-medium text-white/80">Own a business in Alanya?</span>
            </div>
            <h2 className="font-heading text-2xl md:text-4xl text-white mb-4">
              List Your Business on Alanya Holidays
            </h2>
            <p className="text-white/60 text-sm md:text-base max-w-xl mx-auto mb-8">
              Get discovered by thousands of travelers searching for restaurants, tours, hotels, and services in the Alanya region. Join the directory and grow your business.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors whitespace-nowrap"
              >
                <i className="ri-add-circle-line text-sm"></i>
                Add Your Business
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/30 text-white text-sm font-medium hover:bg-white/10 transition-colors whitespace-nowrap"
              >
                <i className="ri-user-add-line text-sm"></i>
                Create Account
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}