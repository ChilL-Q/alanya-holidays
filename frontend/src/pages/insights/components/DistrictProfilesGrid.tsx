import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { DISTRICT_PROFILES, type DistrictProfile } from "../data/regionalData";

interface DistrictProfilesGridProps {
  profiles?: DistrictProfile[];
}

const CATEGORIES = [
  "All",
  "Riviera & Beach",
  "Urban & Culture",
  "Nature & Adventure",
  "Luxury & Golf",
] as const;

function normalizeSearchText(str: string): string {
  return str
    .toLowerCase()
    .replace(/ı/g, "i")
    .replace(/İ/g, "i")
    .replace(/ş/g, "s")
    .replace(/Ş/g, "s")
    .replace(/ğ/g, "g")
    .replace(/Ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/Ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/Ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/Ç/g, "c")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export default function DistrictProfilesGrid({ profiles = DISTRICT_PROFILES }: DistrictProfilesGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedDistrictId, setExpandedDistrictId] = useState<string | null>("alanya");

  const filteredProfiles = useMemo(() => {
    return profiles.filter((profile) => {
      const matchesCategory =
        selectedCategory === "All" || profile.category === selectedCategory;
      const q = normalizeSearchText(searchQuery);
      if (!q) return matchesCategory;

      const matchesSearch =
        normalizeSearchText(profile.name).includes(q) ||
        normalizeSearchText(profile.id).includes(q) ||
        normalizeSearchText(profile.tagline).includes(q) ||
        normalizeSearchText(profile.vibeSummary).includes(q) ||
        profile.highlights.some((h) => normalizeSearchText(h).includes(q)) ||
        profile.topExpats.some((e) => normalizeSearchText(e).includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [profiles, selectedCategory, searchQuery]);

  const toggleExpand = (id: string) => {
    setExpandedDistrictId(expandedDistrictId === id ? null : id);
  };

  return (
    <section id="districts" className="py-8 md:py-12 border-t border-background-200 dark:border-background-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-950/80 border border-primary-200 dark:border-primary-800/60 text-primary-800 dark:text-primary-300 text-xs font-semibold uppercase tracking-wider mb-3">
            <i className="ri-map-pin-line" />
            <span>District Intelligence & Expat Profiles</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground-900 dark:text-foreground-50 tracking-tight">
            Explore 8 Key Municipal Districts
          </h2>
          <p className="text-sm sm:text-base text-foreground-600 dark:text-foreground-400 mt-2">
            Each district across Antalya Province offers a distinct lifestyle, demographic composition, natural landscape, and expat community profile. Discover which destination aligns with your travel or relocation plans.
          </p>
        </div>

        {/* Filter Bar & Search Controls */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-8">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? "bg-primary-600 dark:bg-primary-500 text-white shadow-sm"
                    : "bg-white dark:bg-background-800 text-foreground-700 dark:text-foreground-300 border border-background-200 dark:border-background-700 hover:border-primary-400"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[260px]">
            <i className="ri-search-line absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-400 text-sm" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search district, vibe, beach..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-white dark:bg-background-800 border border-background-200 dark:border-background-700 text-xs sm:text-sm text-foreground-900 dark:text-foreground-100 placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground-400 hover:text-foreground-600 text-xs p-1"
                aria-label="Clear search"
              >
                <i className="ri-close-line" />
              </button>
            )}
          </div>
        </div>

        {/* Results Count */}
        <div className="text-xs text-foreground-500 dark:text-foreground-400 mb-4 flex items-center justify-between">
          <span data-testid="district-count">
            Showing {filteredProfiles.length} of {profiles.length} districts
          </span>
          {searchQuery && (
            <span className="italic">
              Filtering by: &ldquo;{searchQuery}&rdquo;
            </span>
          )}
        </div>

        {/* District Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
          {filteredProfiles.map((district) => {
            const isExpanded = expandedDistrictId === district.id;
            const isAlanya = district.id === "alanya";

            return (
              <div
                key={district.id}
                data-testid={`district-card-${district.id}`}
                className={`flex flex-col justify-between rounded-2xl bg-white dark:bg-background-800/90 border transition-all duration-200 shadow-sm hover:shadow-md ${
                  isAlanya
                    ? "border-primary-400/80 dark:border-primary-600/60 ring-1 ring-primary-400/30"
                    : "border-background-200 dark:border-background-700/80 hover:border-background-300 dark:hover:border-background-600"
                }`}
              >
                <div className="p-5">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        isAlanya
                          ? "bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800/60"
                          : "bg-background-100 dark:bg-background-700 text-foreground-700 dark:text-foreground-300"
                      }`}
                    >
                      {district.badge}
                    </span>
                    <span className="text-[10px] font-semibold text-foreground-500 uppercase">
                      {district.category}
                    </span>
                  </div>

                  {/* Name & Tagline */}
                  <h3 className="text-xl font-bold text-foreground-900 dark:text-foreground-50">
                    {district.name}
                  </h3>
                  <p className="text-xs text-primary-600 dark:text-primary-400 font-medium mt-0.5 mb-4">
                    {district.tagline}
                  </p>

                  {/* Key Metrics Pill Grid */}
                  <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-background-50/80 dark:bg-background-900/60 border border-background-100 dark:border-background-700/50 mb-4 text-center">
                    <div>
                      <div className="text-[10px] text-foreground-500 uppercase font-medium">Population</div>
                      <div className="text-xs font-bold text-foreground-900 dark:text-foreground-100 mt-0.5">
                        {district.population}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-foreground-500 uppercase font-medium">Foreigners</div>
                      <div className="text-xs font-bold text-primary-600 dark:text-primary-400 mt-0.5">
                        {district.foreignPopulation}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-foreground-500 uppercase font-medium">Blue Flag</div>
                      <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {district.blueFlagBeaches > 0 ? `${district.blueFlagBeaches} 🏖️` : "—"}
                      </div>
                    </div>
                  </div>

                  {/* Vibe Narrative */}
                  <p className="text-xs text-foreground-600 dark:text-foreground-300 leading-relaxed mb-4">
                    {district.vibeSummary}
                  </p>

                  {/* Highlights List */}
                  <div className="space-y-1.5 mb-4">
                    <div className="text-[11px] font-bold text-foreground-800 dark:text-foreground-200 uppercase tracking-wider">
                      Key Highlights
                    </div>
                    {district.highlights.map((highlight, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-foreground-600 dark:text-foreground-300">
                        <i className="ri-check-line text-primary-500 text-sm mt-[-1px] flex-shrink-0" />
                        <span>{highlight}</span>
                      </div>
                    ))}
                  </div>

                  {/* Top Expat Communities */}
                  <div>
                    <div className="text-[11px] font-semibold text-foreground-700 dark:text-foreground-300 uppercase tracking-wider mb-1.5">
                      Prominent Expat Communities
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {district.topExpats.map((expat) => (
                        <span
                          key={expat}
                          className="px-2 py-0.5 rounded-md bg-background-100 dark:bg-background-700 text-foreground-700 dark:text-foreground-300 text-[11px]"
                        >
                          {expat}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="p-4 border-t border-background-100 dark:border-background-700/60 bg-background-50/50 dark:bg-background-900/30 rounded-b-2xl flex items-center justify-between gap-2">
                  <Link
                    to={district.exploreFilterUrl}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                  >
                    <span>Explore in {district.name}</span>
                    <i className="ri-arrow-right-line" />
                  </Link>

                  <button
                    onClick={() => toggleExpand(district.id)}
                    className="text-[11px] text-foreground-500 hover:text-foreground-800 dark:hover:text-foreground-200 px-2 py-1 rounded transition-colors"
                  >
                    {isExpanded ? "Less info" : "Details"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredProfiles.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-background-800/60 rounded-2xl border border-background-200 dark:border-background-700 p-8">
            <i className="ri-compass-3-line text-4xl text-foreground-400 mb-3 block" />
            <h3 className="text-lg font-bold text-foreground-900 dark:text-foreground-100">
              No districts match your search
            </h3>
            <p className="text-sm text-foreground-500 dark:text-foreground-400 mt-1 max-w-md mx-auto">
              Try searching for a different keyword or switch the category filter to &ldquo;All&rdquo;.
            </p>
            <button
              onClick={() => {
                setSelectedCategory("All");
                setSearchQuery("");
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-primary-600 text-white text-xs font-semibold hover:bg-primary-700 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
