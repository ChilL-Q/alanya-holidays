import { GIFT_CARD_CATEGORIES } from "../data/giftCardsData";
import { useTranslation } from "react-i18next";
import "@/i18n";

interface GiftCardHeroProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function GiftCardHero({
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
}: GiftCardHeroProps) {
  const { t } = useTranslation();
  return (
    <div className="relative w-full bg-gradient-to-b from-foreground-900 via-foreground-800 to-foreground-900 text-white pt-24 md:pt-32 pb-16 md:pb-24 overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-accent-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Top Tag */}
        <div className="flex items-center justify-center mb-4">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-primary-500/20 text-primary-300 border border-primary-500/30 backdrop-blur-xs">
            <i className="ri-gift-2-line text-sm text-primary-400"></i>
            {t("services.gifts.experienceGifts")}
          </span>
        </div>

        {/* Hero Title & Subtitle */}
        <div className="text-center max-w-3xl mx-auto mb-8 md:mb-12">
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4 text-white">
            {t("services.gifts.culinaryTitle")} {" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-primary-300 to-accent-400">
              {t("services.gifts.giftCards")}
            </span>
          </h1>
          <p className="text-white/70 text-base sm:text-lg md:text-xl leading-relaxed">
            {t("services.gifts.description")}
          </p>
        </div>

        {/* Trust Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto mb-10 text-xs sm:text-sm">
          <div className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
            <i className="ri-flashlight-line text-primary-400 text-base"></i>
            <span className="text-white/80 font-medium">{t("services.gifts.instantDelivery")}</span>
          </div>
          <div className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
            <i className="ri-calendar-check-line text-primary-400 text-base"></i>
            <span className="text-white/80 font-medium">{t("services.gifts.validity")}</span>
          </div>
          <div className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
            <i className="ri-repeat-line text-primary-400 text-base"></i>
            <span className="text-white/80 font-medium">{t("services.gifts.exchanges")}</span>
          </div>
          <div className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
            <i className="ri-shield-check-line text-primary-400 text-base"></i>
            <span className="text-white/80 font-medium">{t("services.gifts.venues")}</span>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-white/50 text-lg"></i>
            <input
              type="text"
              aria-label={t("services.gifts.searchLabel")}
              placeholder={t("services.gifts.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:bg-white/15 transition-all text-sm sm:text-base backdrop-blur-md"
            />
            {searchQuery && (
              <button
                type="button"
                aria-label={t("services.gifts.clearSearch")}
                onClick={() => onSearchChange("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-1"
              >
                <i className="ri-close-line text-lg"></i>
              </button>
            )}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center justify-center flex-wrap gap-2 pt-2">
          {GIFT_CARD_CATEGORIES.map((category) => {
            const isSelected = selectedCategory === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => onSelectCategory(category)}
                className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? "bg-primary-500 text-white shadow-md shadow-primary-500/25 scale-105"
                    : "bg-white/10 text-white/80 hover:bg-white/20 hover:text-white border border-white/10"
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
