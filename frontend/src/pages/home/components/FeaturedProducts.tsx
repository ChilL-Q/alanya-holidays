import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { productsService, type ShopProduct as FeaturedProduct } from "@/api-services/products.service";
import { useTranslation } from "react-i18next";
import "@/i18n";
import ErrorState from "@/components/base/ErrorState";

function getCategoryBadge(product: FeaturedProduct): { labelKey: string; icon: string } {
  const catName = product.product_categories?.name || "";
  if (catName === "Food & Treats") return { labelKey: "home.productBadge.edible", icon: "ri-cake-line" };
  if (catName === "AlanyaHolidays Merch") return { labelKey: "home.productBadge.exclusive", icon: "ri-vip-crown-line" };
  if (catName === "Books & Learning") return { labelKey: "home.productBadge.digital", icon: "ri-book-open-line" };
  if (catName === "Travel Essentials") return { labelKey: "home.productBadge.popular", icon: "ri-suitcase-line" };
  if (catName === "Turkish Home & Decor") return { labelKey: "home.productBadge.handmade", icon: "ri-home-smile-line" };
  if (catName === "Turkish Textiles") return { labelKey: "home.productBadge.artisan", icon: "ri-t-shirt-line" };
  if (catName === "Gift Cards") return { labelKey: "home.productBadge.gift", icon: "ri-gift-line" };
  return { labelKey: "home.productBadge.new", icon: "ri-store-2-line" };
}

function formatPrice(product: FeaturedProduct): string {
  const symbol = product.currency === "EUR" ? "€" : product.currency === "USD" ? "$" : product.currency;
  return `${symbol}${Number(product.price).toFixed(2)}`;
}

export default function FeaturedProducts() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<FeaturedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function fetchFeatured() {
      try {
        setLoading(true);
        setError(null);
        const data = await productsService.getFeaturedProducts();
        if (!cancelled) {
          setProducts(data);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load featured products");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchFeatured();
    return () => { cancelled = true; };
  }, []);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || products.length === 0) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [products, updateScrollState]);

  const scrollBy = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.firstElementChild ? (el.firstElementChild as HTMLElement).offsetWidth : 280;
    const gap = 20;
    const scrollAmount = (cardWidth + gap) * 2;
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      setProducts(await productsService.getFeaturedProducts());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("home.productsUnavailable"));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-16 md:py-24 bg-background-100">
        <div className="w-full px-4 md:px-8 lg:px-12">
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-foreground-200 bg-white mb-6">
              <i className="ri-star-line text-accent-500 text-sm"></i>
              <span className="text-sm font-medium text-foreground-700">{t("public.featuredProducts")}</span>
            </div>
            <h2 className="font-heading text-3xl md:text-4xl text-foreground-900 mb-3">{t("public.handpickedForYou")}</h2>
            <p className="text-foreground-500 text-sm md:text-base max-w-xl">
              {t("home.productSupportDescription")}
            </p>
          </div>
          <div className="flex gap-5 overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="shrink-0 w-[260px] md:w-[280px] rounded-2xl bg-white border border-background-200/70 animate-pulse">
                <div className="w-full aspect-square bg-background-200 rounded-t-2xl"></div>
                <div className="p-4 space-y-3">
                  <div className="h-3 bg-background-200 rounded w-2/3"></div>
                  <div className="h-4 bg-background-200 rounded w-1/2"></div>
                  <div className="h-8 bg-background-200 rounded-full w-full"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error && products.length === 0) {
    return (
      <section className="py-16 md:py-24 bg-background-100">
        <div className="w-full px-4 md:px-8 lg:px-12">
          <ErrorState title={t("home.productsUnavailable")} message={error} onRetry={loadProducts} />
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  // Find the hottest gift card (highest price among gift cards)
  const giftCards = products.filter((p) => p.product_categories?.name === "Gift Cards");
  const maxGiftPrice = giftCards.length !== 0 ? Math.max(...giftCards.map(function getPrice(p) { return Number(p.price); })) : 0;
  const hottestGiftId = maxGiftPrice !== 0 ? giftCards.find((p) => Number(p.price) === maxGiftPrice)?.id ?? null : null;

  return (
    <section className="py-16 md:py-24 bg-background-100">
      <div className="w-full px-4 md:px-8 lg:px-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-10 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-foreground-200 bg-white mb-6">
              <i className="ri-star-line text-accent-500 text-sm"></i>
              <span className="text-sm font-medium text-foreground-700">{t("public.featuredProducts")}</span>
            </div>
            <h2 className="font-heading text-3xl md:text-4xl text-foreground-900 mb-3">{t("public.handpickedForYou")}</h2>
            <p className="text-foreground-500 text-sm md:text-base max-w-xl">
              {t("home.productSupportDescription")}
            </p>
          </div>

          {/* Desktop Arrows */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => scrollBy("left")}
              disabled={!canScrollLeft}
              className="w-10 h-10 flex items-center justify-center rounded-full border border-foreground-200 bg-white text-foreground-600 hover:border-foreground-300 hover:text-foreground-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              aria-label={t("home.scrollLeft")}
            >
              <i className="ri-arrow-left-s-line text-lg"></i>
            </button>
            <button
              onClick={() => scrollBy("right")}
              disabled={!canScrollRight}
              className="w-10 h-10 flex items-center justify-center rounded-full border border-foreground-200 bg-white text-foreground-600 hover:border-foreground-300 hover:text-foreground-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              aria-label={t("home.scrollRight")}
            >
              <i className="ri-arrow-right-s-line text-lg"></i>
            </button>
          </div>
        </div>

        {/* Carousel */}
        <div className="relative">
          <div
            ref={scrollRef}
            className="flex gap-5 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth pb-2"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {products.map((product) => {
              const badge = getCategoryBadge(product);
              const isGift = product.product_categories?.name === "Gift Cards";
              return (
                <Link
                  key={product.id}
                  to={`/shop/${product.id}`}
                  className="group shrink-0 w-[260px] md:w-[280px] snap-start bg-white rounded-2xl overflow-hidden border border-background-200/70 hover:border-primary-200/60 transition-all cursor-pointer flex flex-col"
                >
                  {/* Image */}
                  <div className="relative w-full aspect-square overflow-hidden bg-background-100">
                    {product.media && product.media.length > 0 && product.media[0]?.url ? (
                      <img
                        src={product.media[0].url}
                        alt={product.name}
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <i className={`${badge.icon} text-foreground-300 text-4xl`}></i>
                      </div>
                    )}
                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap shadow-sm backdrop-blur-sm ${
                        isGift
                          ? "bg-accent-500/90 text-white"
                          : "bg-white/90 text-foreground-800"
                      }`}>
                        {t(badge.labelKey)}
                      </span>
                    </div>
                    {/* Popular This Week badge */}
                    {product.id === hottestGiftId && (
                      <div className="absolute top-3 right-3">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap shadow-sm bg-white/90 text-accent-700 flex items-center gap-1">
                          <i className="ri-fire-line text-xs"></i>
                          {t("home.popularThisWeek")}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4 flex flex-col flex-1">
                    <span className="text-[11px] text-foreground-400 mb-1">
                      {product.product_categories?.name || t("home.productGeneral")}
                    </span>
                    <h3 className="font-heading text-sm text-foreground-900 mb-3 leading-snug line-clamp-2">
                      {product.name}
                    </h3>
                    <div className="mt-auto flex items-center justify-between">
                      <span className="text-base font-semibold text-primary-600 whitespace-nowrap">
                        {formatPrice(product)}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 group-hover:gap-2 transition-all">
                        {t("home.viewProduct")}
                        <i className="ri-arrow-right-line text-xs"></i>
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Mobile scroll hint */}
          <div className="flex md:hidden items-center justify-center mt-5 gap-1.5">
            <i className="ri-arrow-left-right-line text-foreground-300 text-xs"></i>
            <span className="text-xs text-foreground-400">{t("public.swipeToExplore")}</span>
          </div>
        </div>

        {/* View All CTA */}
        <div className="mt-10 text-center">
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary-500 text-background-50 text-sm font-medium hover:bg-primary-600 transition-colors whitespace-nowrap cursor-pointer"
          >
            {t("home.viewAllProducts")}
            <i className="ri-arrow-right-line"></i>
          </Link>
        </div>
      </div>
    </section>
  );
}
