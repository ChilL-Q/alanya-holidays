import { useMemo } from "react";
import type { GiftCardCollection, GiftCardTier } from "../data/giftCardsData";
import GiftCardCard from "./GiftCardCard";
import { useTranslation } from "react-i18next";
import "@/i18n";

interface GiftCardGridProps {
  collections: GiftCardCollection[];
  selectedCategory: string;
  searchQuery: string;
  onAddToCart: (collection: GiftCardCollection, tier: GiftCardTier) => void;
  onResetFilters: () => void;
}

export default function GiftCardGrid({
  collections,
  selectedCategory,
  searchQuery,
  onAddToCart,
  onResetFilters,
}: GiftCardGridProps) {
  const { t } = useTranslation();
  const filteredCollections = useMemo(() => {
    return collections.filter((c) => {
      const matchesCategory =
        selectedCategory === "All Experiences" ||
        c.category.toLowerCase() === selectedCategory.toLowerCase();

      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      const inTitle = c.title.toLowerCase().includes(q);
      const inTagline = c.tagline.toLowerCase().includes(q);
      const inDesc = c.description.toLowerCase().includes(q);
      const inCat = c.category.toLowerCase().includes(q);
      const inTiers = c.tiers.some(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.perks.some((p) => p.toLowerCase().includes(q)),
      );

      return inTitle || inTagline || inDesc || inCat || inTiers;
    });
  }, [collections, selectedCategory, searchQuery]);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pb-4 border-b border-background-200">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary-600">
            {t("services.gifts.featured")}
          </span>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground-900 mt-1">
            {selectedCategory === "All Experiences"
              ? t("services.gifts.allCollections")
              : selectedCategory}
          </h2>
        </div>
        <div className="text-xs sm:text-sm text-foreground-500 font-medium">
          {t("services.gifts.showing", { shown: filteredCollections.length, total: collections.length })}
        </div>
      </div>

      {/* Grid or Empty State */}
      {filteredCollections.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {filteredCollections.map((collection) => (
            <GiftCardCard
              key={collection.id}
              collection={collection}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-4 bg-background-50 rounded-2xl border border-dashed border-background-300 max-w-xl mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-2xl">
            <i className="ri-search-eye-line"></i>
          </div>
          <h3 className="text-lg font-heading font-bold text-foreground-900 mb-2">
          {t("services.gifts.noMatch")}
          </h3>
          <p className="text-sm text-foreground-600 mb-6">
            {t("services.gifts.noMatchDesc", { query: searchQuery || selectedCategory })}
          </p>
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary-600 text-white font-medium text-sm hover:bg-primary-700 transition-colors shadow-sm cursor-pointer"
          >
            <i className="ri-refresh-line"></i>
            {t("services.gifts.resetAll")}
          </button>
        </div>
      )}
    </section>
  );
}
