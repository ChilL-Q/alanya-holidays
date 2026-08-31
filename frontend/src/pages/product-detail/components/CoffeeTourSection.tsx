import React, { useRef, useState, useCallback, useEffect } from "react";
import type { CafeStop } from "./types";
import {
  COFFEE_TOUR_CAFES,
  getTotalWalkTime,
  getWalkingEstimate,
} from "./types";
import { useTranslation } from "react-i18next";
import "@/i18n";

interface TourPhotoCarouselProps {
  cafes: CafeStop[];
}

function TourPhotoCarousel({ cafes }: TourPhotoCarouselProps) {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateScrollState, { passive: true });
    updateScrollState();
    return () => el.removeEventListener("scroll", updateScrollState);
  }, [updateScrollState]);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.querySelector(".tour-carousel-card")?.clientWidth ?? 300;
    const gap = 16;
    el.scrollBy({
      left: dir === "left" ? -(cardWidth + gap) : cardWidth + gap,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative mb-10">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-accent-100">
          <i className="ri-gallery-line text-accent-600 text-sm"></i>
        </div>
        <h3 className="font-heading text-lg text-foreground-900">{t("product.pairingPhotos")}</h3>
        <span className="text-xs text-foreground-400 bg-background-200/70 px-2.5 py-0.5 rounded-full">
          7 photos
        </span>
      </div>

      <div className="relative group">
        {/* Left Arrow */}
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm border border-background-200 shadow-sm text-foreground-700 hover:bg-white hover:text-foreground-900 transition-all cursor-pointer opacity-0 group-hover:opacity-100"
            aria-label={t("public.previousImages")}
          >
            <i className="ri-arrow-left-s-line text-lg"></i>
          </button>
        )}

        {/* Scrollable Track */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth pb-2"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {cafes.map((cafe, index) => {
            const tierLabel =
              index <= 2 ? "3-Stop Tour" : index <= 4 ? "5-Stop Tour" : "Full Day Tour";
            const tierColorClass =
              index <= 2
                ? "bg-accent-100 text-accent-700"
                : index <= 4
                  ? "bg-secondary-100 text-secondary-700"
                  : "bg-primary-100 text-primary-700";

            return (
              <div
                key={cafe.name}
                className="tour-carousel-card flex-shrink-0 w-[280px] md:w-[340px] snap-start rounded-2xl overflow-hidden bg-white border border-background-200/70 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              >
                {/* Image */}
                <div className="relative w-full h-[180px] md:h-[220px] overflow-hidden">
                  <img
                    src={cafe.imageUrl}
                    alt={`Stop ${index + 1}: ${cafe.name} pairing`}
                    className="w-full h-full object-cover object-top"
                  />
                  {/* Stop number badge */}
                  <div className="absolute top-3 left-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm text-foreground-900 text-sm font-bold shadow-sm">
                    {index + 1}
                  </div>
                  {/* Tier badge */}
                  <div
                    className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap ${tierColorClass}`}
                  >
                    {tierLabel}
                  </div>
                </div>

                {/* Info strip */}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-5 h-5 flex items-center justify-center rounded bg-accent-100 text-accent-600">
                      <i className={`${cafe.icon} text-[11px]`}></i>
                    </span>
                    <h4 className="font-heading text-sm text-foreground-900 leading-tight line-clamp-1">
                      {cafe.name}
                    </h4>
                  </div>
                  <p className="text-xs text-foreground-500 line-clamp-2 leading-relaxed">
                    {cafe.highlight}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Arrow */}
        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm border border-background-200 shadow-sm text-foreground-700 hover:bg-white hover:text-foreground-900 transition-all cursor-pointer opacity-0 group-hover:opacity-100"
            aria-label={t("public.nextImages")}
          >
            <i className="ri-arrow-right-s-line text-lg"></i>
          </button>
        )}
      </div>
    </div>
  );
}

interface TourAddToCartBarProps {
  productName: string;
  currentPrice: number;
  formatPrice: (p: number) => string;
  currentStock: number;
  quantity: number;
  setQuantity: (q: number | ((prev: number) => number)) => void;
  onAddToCart: () => void;
}

export function TourAddToCartBar({
  productName,
  currentPrice,
  formatPrice,
  currentStock,
  quantity,
  setQuantity,
  onAddToCart,
}: TourAddToCartBarProps) {
  const { t } = useTranslation();
  return (
    <div className="mt-8 p-5 md:p-6 rounded-2xl bg-white border-2 border-accent-300/60 shadow-sm">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-foreground-400 uppercase tracking-wider mb-1">
            {t("product.readyToExplore")}
          </p>
          <p className="text-sm text-foreground-700 truncate">
            <strong className="text-foreground-900">{productName}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-xl font-bold text-foreground-900 whitespace-nowrap">
            {formatPrice(currentPrice)}
          </span>

          {/* Quantity */}
          <div className="flex items-center gap-0 border border-background-300 rounded-full overflow-hidden bg-white">
            <button
              onClick={() => setQuantity((q: number) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="w-9 h-9 flex items-center justify-center text-foreground-600 hover:bg-background-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <i className="ri-subtract-line text-sm"></i>
            </button>
            <span className="w-10 text-center text-sm font-semibold text-foreground-900 select-none">
              {quantity}
            </span>
            <button
              onClick={() =>
                setQuantity((q: number) =>
                  Math.min(currentStock > 0 ? currentStock : 99, q + 1)
                )
              }
              disabled={currentStock > 0 && quantity >= currentStock}
              className="w-9 h-9 flex items-center justify-center text-foreground-600 hover:bg-background-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <i className="ri-add-line text-sm"></i>
            </button>
          </div>

          {/* Add to Cart */}
          <button
            onClick={onAddToCart}
            disabled={currentStock <= 0}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-accent-500 text-background-50 dark:text-foreground-950 rounded-full text-sm font-semibold hover:bg-accent-600 transition-all hover:scale-[1.03] whitespace-nowrap cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <i className="ri-shopping-cart-line"></i>
            {currentStock <= 0 ? "Sold Out" : "Add to Cart"}
          </button>
        </div>
      </div>
    </div>
  );
}

interface CoffeeTourSectionProps {
  productName: string;
  currentPrice: number;
  formatPrice: (p: number) => string;
  currentStock: number;
  quantity: number;
  setQuantity: (q: number | ((prev: number) => number)) => void;
  onAddToCart: () => void;
  favorites: Set<string>;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
  onPrintMap: () => void;
  onOpenSendModal: () => void;
  onShareTour: () => void;
}

export function CoffeeTourSection({
  productName,
  currentPrice,
  formatPrice,
  currentStock,
  quantity,
  setQuantity,
  onAddToCart,
  favorites,
  isFavorite,
  toggleFavorite,
  onPrintMap,
  onOpenSendModal,
  onShareTour,
}: CoffeeTourSectionProps) {
  const { t } = useTranslation();
  const favoritedCafes = COFFEE_TOUR_CAFES.filter((cafe) =>
    favorites.has(`coffee-tour-${cafe.name}`)
  );
  const totalWalkTime = getTotalWalkTime(COFFEE_TOUR_CAFES);

  return (
    <section className="w-full px-4 md:px-8 lg:px-12 py-16 md:py-24 bg-background-100">
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-foreground-200 bg-white mb-6">
            <i className="ri-map-pin-line text-accent-500 text-sm"></i>
              <span className="text-sm font-medium text-foreground-700">{t("product.routePreview")}</span>
          </div>
          <h2 className="font-heading text-3xl md:text-4xl text-foreground-900 mb-4">
            Your Coffee Journey Through Alanya
          </h2>
          <p className="text-foreground-500 text-sm md:text-base max-w-2xl mx-auto leading-relaxed mb-6">
            Seven hand-picked cafes — each stop unlocks a complimentary coffee and dessert. The route
            winds from the harbor through the old town, along Kleopatra Beach, and up to Mahmutlar.
            Pace yourself.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 mb-6">
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-background-200/70 shadow-sm">
              <span className="w-7 h-7 flex items-center justify-center rounded-full bg-accent-100">
                <i className="ri-walk-line text-accent-600 text-sm"></i>
              </span>
              <span className="text-sm font-semibold text-foreground-900 whitespace-nowrap">
                {totalWalkTime.label}
              </span>
              <span className="text-xs text-foreground-400 whitespace-nowrap">{t("product.totalWalking")}</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-background-200/70 shadow-sm">
              <span className="w-7 h-7 flex items-center justify-center rounded-full bg-accent-100">
                <i className="ri-map-pin-2-line text-accent-600 text-sm"></i>
              </span>
              <span className="text-sm font-semibold text-foreground-900">7</span>
              <span className="text-xs text-foreground-400 whitespace-nowrap">{t("product.cafeStops")}</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-background-200/70 shadow-sm">
              <span className="w-7 h-7 flex items-center justify-center rounded-full bg-accent-100">
                <i className="ri-route-line text-accent-600 text-sm"></i>
              </span>
              <span className="text-sm font-semibold text-foreground-900">{t("product.routeName")}</span>
              <span className="text-xs text-foreground-400 whitespace-nowrap">{t("product.route")}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onPrintMap}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-foreground-300 rounded-full text-sm font-semibold text-foreground-700 hover:bg-foreground-50 hover:border-foreground-400 hover:text-foreground-900 transition-all hover:scale-[1.02] whitespace-nowrap cursor-pointer"
            >
              <i className="ri-file-pdf-2-line text-lg"></i>
              Download Tour Map PDF
            </button>
            <button
              onClick={onOpenSendModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent-500 text-background-50 dark:text-foreground-950 border-2 border-accent-500 rounded-full text-sm font-semibold hover:bg-accent-600 hover:border-accent-600 transition-all hover:scale-[1.02] whitespace-nowrap cursor-pointer"
            >
              <i className="ri-smartphone-line text-lg"></i>
              Send Tour Map to My Phone
            </button>
            <button
              onClick={onShareTour}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-foreground-300 rounded-full text-sm font-semibold text-foreground-700 hover:bg-foreground-50 hover:border-foreground-400 hover:text-foreground-900 transition-all hover:scale-[1.02] whitespace-nowrap cursor-pointer"
            >
              <i className="ri-share-forward-line text-lg"></i>
              Share This Tour
            </button>
          </div>
        </div>

        {/* My Favorite Cafes */}
        {favoritedCafes.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-100">
                  <i className="ri-heart-fill text-red-500 text-sm"></i>
                </div>
                <h3 className="font-heading text-lg text-foreground-900">{t("product.favoriteCafes")}</h3>
                <span className="text-xs text-foreground-400 bg-background-200/70 px-2.5 py-0.5 rounded-full">
                  {favoritedCafes.length} saved
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {favoritedCafes.map((cafe) => {
                const originalIndex = COFFEE_TOUR_CAFES.findIndex((c) => c.name === cafe.name);
                return (
                  <a
                    key={cafe.name}
                    href={`#stop-${originalIndex}`}
                    className="group flex items-center gap-4 p-4 rounded-2xl bg-white border border-background-200/70 hover:border-accent-300 hover:shadow-sm transition-all cursor-pointer"
                  >
                    <div className="w-10 h-10 flex items-center justify-center rounded-full bg-accent-100 text-accent-600 shrink-0">
                      <i className={`${cafe.icon} text-sm`}></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground-900 group-hover:text-accent-600 transition-colors line-clamp-1">
                        {cafe.name}
                      </p>
                      <p className="text-xs text-foreground-400 mt-0.5">
                        Stop {originalIndex + 1} — {cafe.address.split(",")[0]}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleFavorite(`coffee-tour-${cafe.name}`);
                      }}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-red-50 border-2 border-red-400 text-red-500 hover:scale-110 transition-all cursor-pointer shrink-0"
                      title={t("public.removeFavorite")}
                    >
                      <i className="ri-heart-fill text-sm"></i>
                    </button>
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* Pairing Photo Carousel */}
        <TourPhotoCarousel cafes={COFFEE_TOUR_CAFES} />

        {/* Add to Cart CTA (top) */}
        <TourAddToCartBar
          productName={productName}
          currentPrice={currentPrice}
          formatPrice={formatPrice}
          currentStock={currentStock}
          quantity={quantity}
          setQuantity={setQuantity}
          onAddToCart={onAddToCart}
        />

        {/* Google Maps Embed */}
        <div className="bg-white rounded-2xl border border-background-200/70 overflow-hidden mb-10">
          <div className="relative w-full h-[400px] md:h-[520px]">
            <iframe
              src="https://maps.google.com/maps?q=Alanya+coffee+shops&ll=36.5440,31.9980&z=13&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={t("product.mapTitle")}
              className="absolute inset-0"
            ></iframe>
          </div>
        </div>

        {/* Tour Stops List */}
        <div className="space-y-0">
          {COFFEE_TOUR_CAFES.map((cafe, index) => {
            const tierLabel =
              index <= 2 ? "3-Stop Tour" : index <= 4 ? "5-Stop Tour" : "Full Day Tour";
            const tierColorClass =
              index <= 2
                ? "bg-accent-100 text-accent-700 border-accent-200"
                : index <= 4
                  ? "bg-secondary-100 text-secondary-700 border-secondary-200"
                  : "bg-primary-100 text-primary-700 border-primary-200";

            return (
              <React.Fragment key={cafe.name}>
                <div
                  id={`stop-${index}`}
                  className="flex flex-col lg:flex-row gap-6 md:gap-8 py-8 md:py-10 border-b border-background-200/60 last:border-b-0 scroll-mt-24"
                >
                  {/* Left: Stop number + connection line */}
                  <div className="flex flex-col items-center shrink-0 lg:w-[72px]">
                    <div className="w-12 h-12 flex items-center justify-center rounded-full bg-accent-500 text-background-50 text-lg font-bold shadow-sm">
                      {index + 1}
                    </div>
                    {index < COFFEE_TOUR_CAFES.length - 1 && (
                      <div className="w-px flex-1 min-h-[40px] bg-background-300 mt-1 mb-1 hidden lg:block"></div>
                    )}
                  </div>

                  {/* Right: Cafe details */}
                  <div className="flex-1">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-3">
                      <div>
                        <h3 className="font-heading text-xl text-foreground-900 mb-1.5 flex items-center gap-3">
                          <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-accent-100 text-accent-600">
                            <i className={`${cafe.icon} text-sm`}></i>
                          </span>
                          {cafe.name}
                        </h3>
                        <p className="text-sm text-foreground-500 flex items-center gap-1.5">
                          <i className="ri-map-pin-2-line text-foreground-400 text-xs"></i>
                          {cafe.address}
                        </p>
                      </div>
                      <span
                        className={`self-start inline-block px-3 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${tierColorClass}`}
                      >
                        {tierLabel}
                      </span>
                      <button
                        onClick={() => toggleFavorite(`coffee-tour-${cafe.name}`)}
                        className={`self-start w-9 h-9 flex items-center justify-center rounded-full border-2 transition-all cursor-pointer hover:scale-110 flex-shrink-0 ${
                          isFavorite(`coffee-tour-${cafe.name}`)
                            ? "bg-red-50 border-red-400 text-red-500"
                            : "bg-white border-background-200 text-foreground-400 hover:border-red-300 hover:text-red-400"
                        }`}
                        title={
                          isFavorite(`coffee-tour-${cafe.name}`)
                            ? "Remove from favorites"
                            : "Save to favorites"
                        }
                      >
                        <i
                          className={`text-sm ${
                            isFavorite(`coffee-tour-${cafe.name}`)
                              ? "ri-heart-fill"
                              : "ri-heart-line"
                          }`}
                        ></i>
                      </button>
                    </div>

                    <p className="text-sm text-foreground-600 leading-relaxed mb-3">
                      {cafe.description}
                    </p>

                    {/* Highlight */}
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-background-50 border border-background-200/50">
                      <div className="w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">
                        <i className="ri-star-fill text-accent-500 text-sm"></i>
                      </div>
                      <p className="text-sm text-foreground-700 font-medium leading-relaxed">
                        {cafe.highlight}
                      </p>
                    </div>

                    {/* Coffee & Dessert Pairing Photo */}
                    <div className="mt-4 w-full h-[200px] md:h-[260px] rounded-xl overflow-hidden border border-background-200/50 bg-background-100">
                      <img
                        src={cafe.imageUrl}
                        alt={`${cafe.name} — coffee and dessert pairing`}
                        className="w-full h-full object-cover object-top"
                      />
                    </div>

                    {/* Individual cafe mini-map */}
                    <div className="mt-4">
                      <div className="w-full h-[160px] md:h-[200px] rounded-xl overflow-hidden border border-background-200/50 bg-background-50">
                        <iframe
                          src={`https://maps.google.com/maps?q=${encodeURIComponent(
                            cafe.name + " " + cafe.address
                          )}&z=16&output=embed`}
                          width="100%"
                          height="100%"
                          style={{ border: 0 }}
                          allowFullScreen
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          title={`Map — ${cafe.name}`}
                        ></iframe>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Walking directions to next stop */}
                {index < COFFEE_TOUR_CAFES.length - 1 && (() => {
                  const walkTime = getWalkingEstimate(
                    cafe.lat,
                    cafe.lng,
                    COFFEE_TOUR_CAFES[index + 1].lat,
                    COFFEE_TOUR_CAFES[index + 1].lng
                  );
                  return (
                    <div className="flex items-center justify-center py-3 px-4 lg:pl-[72px]">
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&origin=${cafe.lat},${cafe.lng}&destination=${COFFEE_TOUR_CAFES[index + 1].lat},${COFFEE_TOUR_CAFES[index + 1].lng}&travelmode=walking`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-background-200 text-sm text-foreground-600 hover:text-foreground-900 hover:border-accent-300 hover:bg-accent-50 transition-all cursor-pointer shadow-sm"
                      >
                        <span className="w-6 h-6 flex items-center justify-center rounded-full bg-accent-100 text-accent-600">
                          <i className="ri-walk-line text-xs"></i>
                        </span>
                        Walking directions to {COFFEE_TOUR_CAFES[index + 1].name}
                        <span className="px-2 py-0.5 rounded-full bg-background-100 text-xs font-medium text-foreground-500 whitespace-nowrap">
                          {walkTime}
                        </span>
                        <i className="ri-external-link-line text-xs text-foreground-400"></i>
                      </a>
                    </div>
                  );
                })()}
              </React.Fragment>
            );
          })}
        </div>

        {/* Bottom note */}
        <div className="mt-12 p-5 rounded-2xl bg-white border border-accent-200/60 flex items-start gap-4">
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-accent-100 shrink-0">
            <i className="ri-information-line text-accent-600 text-lg"></i>
          </div>
          <div>
            <h4 className="font-heading text-sm text-foreground-900 mb-1">{t("product.howItWorks")}</h4>
            <p className="text-sm text-foreground-500 leading-relaxed">
              Each stop on the map is a participating cafe. Show your Coffee Tour Gift Card (digital
              or printed) at the counter and they'll mark your stop — one complimentary coffee and one
              dessert per location. No reservations needed, just walk in and enjoy. The card is valid
              for 12 months, so you can spread the stops across multiple days or tackle them all in
              one glorious caffeine-fueled marathon.
            </p>
          </div>
        </div>

        {/* Add to Cart CTA (bottom) */}
        <TourAddToCartBar
          productName={productName}
          currentPrice={currentPrice}
          formatPrice={formatPrice}
          currentStock={currentStock}
          quantity={quantity}
          setQuantity={setQuantity}
          onAddToCart={onAddToCart}
        />
      </div>
    </section>
  );
}
