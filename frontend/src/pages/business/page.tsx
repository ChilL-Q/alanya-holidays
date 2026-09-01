import { useState, useMemo, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "@/pages/home/components/Navbar";
import Footer from "@/pages/home/components/Footer";
import {
  directoryService,
  businessCategories,
  type Business,
  type BusinessReview,
} from "@/api-services/directory.service";
import { ErrorState } from "@/components/base/ErrorState";
import LoadingSpinner from "@/components/base/LoadingSpinner";
import { useFavorites } from "@/hooks/useFavorites";
import TrustBadge from "@/components/common/TrustBadge";
import ClaimListingModal from "@/components/feature/ClaimListingModal";
import { useTranslation } from "react-i18next";
import "@/i18n";
import { useAuth } from "@/context/AuthContext";

const priceRangeLabel: Record<string, string> = {
  "$": "business.priceBudget",
  "$$": "business.priceModerate",
  "$$$": "business.pricePremium",
};

const businessGalleryImages: Record<string, string[]> = {
  "biz-001": [
    "/images/placeholder-business.svg",
    "/images/placeholder-business.svg",
  ],
  "biz-002": [
    "/images/placeholder-business.svg",
    "/images/placeholder-business.svg",
  ],
  "biz-003": [
    "/images/placeholder-business.svg",
    "/images/placeholder-business.svg",
  ],
  "biz-004": [
    "/images/placeholder-business.svg",
    "/images/placeholder-business.svg",
  ],
  "biz-005": [
    "/images/placeholder-business.svg",
    "/images/placeholder-business.svg",
  ],
  "biz-006": [
    "/images/placeholder-business.svg",
    "/images/placeholder-business.svg",
  ],
  "biz-007": [
    "/images/placeholder-business.svg",
    "/images/placeholder-business.svg",
  ],
  "biz-008": [
    "/images/placeholder-business.svg",
    "/images/placeholder-business.svg",
  ],
  "biz-009": [
    "/images/placeholder-business.svg",
    "/images/placeholder-business.svg",
  ],
  "biz-010": [
    "/images/placeholder-business.svg",
    "/images/placeholder-business.svg",
  ],
  "biz-011": [
    "/images/placeholder-business.svg",
    "/images/placeholder-business.svg",
  ],
  "biz-012": [
    "/images/placeholder-business.svg",
    "/images/placeholder-business.svg",
  ],
  "biz-013": [
    "/images/placeholder-business.svg",
    "/images/placeholder-business.svg",
  ],
  "biz-024": [
    "/images/placeholder-business.svg",
    "/images/placeholder-business.svg",
  ],
};

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;
  const starCount = 5;
  const starSize = size === "lg" ? "text-base" : "text-xs";

  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: starCount }).map((_, i) => {
        if (i < fullStars) {
          return <i key={i} className={`ri-star-fill text-yellow-400 ${starSize}`}></i>;
        }
        if (i === fullStars && hasHalf) {
          return <i key={i} className={`ri-star-half-line text-yellow-400 ${starSize}`}></i>;
        }
        return <i key={i} className={`ri-star-fill text-foreground-200 ${starSize}`}></i>;
      })}
    </span>
  );
}

function getCategoryIcon(categoryId: string): string {
  const cat = businessCategories.find((c) => c.id === categoryId);
  return cat?.icon || "ri-store-2-line";
}

function buildMapUrl(business: Business): string {
  const query = encodeURIComponent(`${business.name}, ${business.address}`);
  return `https://maps.google.com/maps?q=${query}&z=16&output=embed`;
}

function getGalleryForBusiness(businessId: string): string[] {
  return businessGalleryImages[businessId] || [
    "/images/placeholder-business.svg",
    "/images/placeholder-business.svg",
  ];
}

export default function BusinessDetailPage() {
  const { t } = useTranslation();
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [business, setBusiness] = useState<Business | null>(null);
  const [reviews, setReviews] = useState<BusinessReview[]>([]);
  const [similarBusinesses, setSimilarBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [reviewFormOpen, setReviewFormOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewFormSubmitting, setReviewFormSubmitting] = useState(false);
  const [reviewFormSuccess, setReviewFormSuccess] = useState(false);
  const [reviewFormError, setReviewFormError] = useState("");
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorited = businessId ? isFavorite(businessId) : false;

  const loadData = useCallback(async () => {
    if (!businessId) {
      setBusiness(null);
      setReviews([]);
      setSimilarBusinesses([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [fetchedBiz, fetchedReviews] = await Promise.all([
        directoryService.getListingById(businessId, { allowSyncFallback: false }),
        directoryService.getListingReviews(businessId),
      ]);

      setBusiness(fetchedBiz);
      setReviews(fetchedReviews ?? []);

      if (fetchedBiz) {
        try {
          const similarRes = await directoryService.getListings({
            category: fetchedBiz.category,
            limit: 5,
          });

          setSimilarBusinesses(
            similarRes?.data?.filter((b) => b.id !== fetchedBiz.id).slice(0, 4) ?? []
          );
        } catch {
          setSimilarBusinesses([]);
        }
      } else {
        setSimilarBusinesses([]);
      }
    } catch (err) {
      setBusiness(null);
      setReviews([]);
      setSimilarBusinesses([]);
      setError(err instanceof Error ? err.message : t("business.loadErrorGeneric"));
    } finally {
      setIsLoading(false);
    }
  }, [businessId, t]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const reviewStats = useMemo(() => {
    if (!reviews.length) {
      return { average: 0, total: 0, distribution: [0, 0, 0, 0, 0] };
    }
    const total = reviews.length;
    const average = reviews.reduce((sum, r) => sum + r.rating, 0) / total;
    const distribution = [0, 0, 0, 0, 0];
    reviews.forEach((r) => {
      if (r.rating >= 1 && r.rating <= 5) {
        distribution[r.rating - 1]++;
      }
    });
    return { average, total, distribution };
  }, [reviews]);

  const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 4);
  const getPriceRangeLabel = (priceRange: string) => {
    const translationKey = priceRangeLabel[priceRange];
    return translationKey ? t(translationKey) : priceRange;
  };

  if (isLoading) {
    return (
      <>
        <Navbar />
        <LoadingSpinner size="full" />
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="min-h-[60vh] bg-background-50 flex items-center justify-center p-6">
          <ErrorState
            title={t("business.loadFailed")}
            message={error}
            onRetry={loadData}
          />
        </div>
        <Footer />
      </>
    );
  }

  if (!business) {
    return (
      <>
        <Navbar />
        <div className="min-h-[60vh] bg-background-50 flex items-center justify-center">
          <div className="text-center px-4">
            <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center rounded-full bg-accent-100">
              <i className="ri-store-2-line text-accent-500 text-2xl"></i>
            </div>
            <h2 className="font-heading text-2xl text-foreground-900 mb-2">{t("business.notFound")}</h2>
            <p className="text-sm text-foreground-500 max-w-md mx-auto mb-6">
              {t("business.notFoundDescription")}
            </p>
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors whitespace-nowrap cursor-pointer"
            >
              <i className="ri-arrow-left-line"></i>
              {t("business.browseAllBusinesses")}
            </Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const categoryIcon = getCategoryIcon(business.category);
  const mapUrl = buildMapUrl(business);
  const galleryExtras = getGalleryForBusiness(business.id);
  const hasGoogleRating =
    typeof business.googleRating === "number" &&
    Number.isFinite(business.googleRating) &&
    business.googleRating > 0 &&
    typeof business.googleReviewCount === "number" &&
    Number.isInteger(business.googleReviewCount) &&
    business.googleReviewCount > 0;
  const handleFavoriteToggle = () => {
    if (authLoading) return;

    if (!isAuthenticated) {
      navigate("/register", {
        state: { from: { pathname: `/business/${business.id}` } },
      });
      return;
    }

    toggleFavorite(business.id);
  };

  return (
    <>
      <Navbar />
      <main>
        {/* Hero Section */}
        <section className="relative w-full h-[350px] md:h-[480px] overflow-hidden">
          <img
            src={business.image}
            alt={business.name}
            className="absolute inset-0 w-full h-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground-950/80 via-foreground-950/40 to-foreground-950/30"></div>

          <div className="absolute bottom-0 left-0 right-0 w-full px-4 md:px-8 lg:px-12 pb-8 md:pb-12">
            <div className="max-w-7xl mx-auto">
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 mb-4">
                <Link to="/" className="text-white/50 hover:text-white/80 text-xs transition-colors underline underline-offset-2">{t("nav.home")}</Link>
                <i className="ri-arrow-right-s-line text-white/30 text-xs"></i>
                <Link to="/explore" className="text-white/50 hover:text-white/80 text-xs transition-colors underline underline-offset-2">{t("public.businessDirectory")}</Link>
                <i className="ri-arrow-right-s-line text-white/30 text-xs"></i>
                <span className="text-white/70 text-xs truncate max-w-[200px]">{business.name}</span>
              </div>

              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <TrustBadge
                      badge={business.trustBadge}
                      business={business}
                      variant="glass"
                      size="sm"
                    />
                    <span className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-medium whitespace-nowrap">
                      <i className={`${categoryIcon} mr-1`}></i>
                      {business.subcategory}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-medium whitespace-nowrap">
                      {getPriceRangeLabel(business.priceRange)}
                    </span>
                  </div>
                  <h1 className="font-heading text-3xl md:text-5xl text-white mb-2">{business.name}</h1>
                  {hasGoogleRating ? (
                    <div className="flex items-center gap-3">
                      <StarRating rating={business.googleRating!} size="lg" />
                      <span className="text-white/80 text-sm">
                        {t("public.googleRatingSummary", {
                          rating: business.googleRating!.toFixed(1),
                          count: business.googleReviewCount,
                        })}
                      </span>
                    </div>
                  ) : (
                    <p className="text-white/70 text-sm">{t("public.googleRatingUnavailable")}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleFavoriteToggle}
                    disabled={authLoading}
                    aria-label={favorited ? t("public.removeFavorite") : t("public.saveFavorite")}
                    className={`w-11 h-11 flex items-center justify-center rounded-full border backdrop-blur-sm transition-all cursor-pointer disabled:opacity-60 disabled:cursor-wait ${
                      favorited
                        ? "bg-accent-500/20 border-accent-400/40 text-white"
                        : "bg-white/10 border-white/20 text-white/70 hover:text-white hover:border-white/40 hover:bg-white/20"
                    }`}
                      title={favorited ? t("public.removeFavorite") : t("public.saveFavorite")}
                  >
                    <i className={`${favorited ? "ri-heart-fill" : "ri-heart-line"} text-lg`}></i>
                  </button>
                  <a
                    href={`tel:${business.phone}`}
                    className="flex items-center gap-2 px-5 py-3 rounded-full bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <i className="ri-phone-line"></i>
                    {t("business.callNow")}
                  </a>
                  <a
                    href={business.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-5 py-3 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-medium hover:bg-white/30 transition-colors whitespace-nowrap cursor-pointer border border-white/20"
                  >
                    <i className="ri-external-link-line"></i>
                    {t("business.visitWebsite")}
                  </a>
                  {business.can_claim === true && (
                    <button
                      type="button"
                      onClick={() => setClaimModalOpen(true)}
                      className="flex items-center gap-2 px-5 py-3 rounded-full bg-accent-500 text-white text-sm font-medium hover:bg-accent-600 transition-colors whitespace-nowrap cursor-pointer shadow-sm"
                      title={t("business.claimListing")}
                    >
                      <i className="ri-shield-user-fill"></i>
                      {t("business.claimListingAction")}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Info Bar */}
        <section className="w-full px-4 md:px-8 lg:px-12 border-b border-background-200/70 bg-white">
          <div className="max-w-7xl mx-auto py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
              <div className="flex items-start gap-2">
                <i className="ri-map-pin-line text-foreground-400 text-sm mt-0.5 shrink-0"></i>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-foreground-400 uppercase tracking-wide mb-0.5">{t("public.address")}</p>
                  <p className="text-sm text-foreground-900 font-medium leading-snug truncate">{business.address}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <i className="ri-time-line text-foreground-400 text-sm mt-0.5 shrink-0"></i>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-foreground-400 uppercase tracking-wide mb-0.5">{t("public.hours")}</p>
                  <p className="text-sm text-foreground-900 font-medium leading-snug truncate">{business.openingHours}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <i className="ri-phone-line text-foreground-400 text-sm mt-0.5 shrink-0"></i>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-foreground-400 uppercase tracking-wide mb-0.5">{t("public.phone")}</p>
                  <a href={`tel:${business.phone}`} className="text-sm text-foreground-900 font-medium hover:text-primary-500 transition-colors truncate cursor-pointer">{business.phone}</a>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <i className="ri-money-dollar-circle-line text-foreground-400 text-sm mt-0.5 shrink-0"></i>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-foreground-400 uppercase tracking-wide mb-0.5">{t("business.priceRange")}</p>
                  <p className="text-sm text-foreground-900 font-medium leading-snug">{getPriceRangeLabel(business.priceRange)}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="w-full px-4 md:px-8 lg:px-12 py-8 md:py-12 bg-background-50">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Left Column */}
              <div className="flex-1 min-w-0 space-y-10">
                {/* About */}
                <div>
                  <h2 className="font-heading text-xl md:text-2xl text-foreground-900 mb-4">{t("business.about", { name: business.name })}</h2>
                  <p className="text-sm md:text-base text-foreground-600 leading-relaxed">
                    {business.description}
                  </p>
                </div>

                {/* Tags */}
                <div>
                  <h3 className="font-heading text-sm uppercase tracking-wider text-foreground-400 mb-3">
                    {t("business.highlights")}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {business.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1.5 rounded-full bg-secondary-100 text-secondary-800 text-sm font-medium whitespace-nowrap"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Photo Gallery */}
                <div>
                    <h2 className="font-heading text-xl md:text-2xl text-foreground-900 mb-4">{t("public.photos")}</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="rounded-xl overflow-hidden aspect-[4/3]">
                      <img
                        src={business.image}
                        alt={t("business.photoAlt", { name: business.name, number: 1 })}
                        className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="rounded-xl overflow-hidden aspect-[4/3]">
                      <img
                        src={galleryExtras[0]}
                        alt={t("business.photoAlt", { name: business.name, number: 2 })}
                        className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="rounded-xl overflow-hidden aspect-[4/3]">
                      <img
                        src={galleryExtras[1]}
                        alt={t("business.photoAlt", { name: business.name, number: 3 })}
                        className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Reviews */}
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="font-heading text-xl md:text-2xl text-foreground-900">
                      {t("public.communityReviewsHeading")}
                    </h2>
                    <span className="text-sm text-foreground-500">
                      {reviewStats.total === 0
                        ? t("public.communityReviewsEmpty")
                        : t("public.communityReviewsCount", { count: reviewStats.total })}
                    </span>
                  </div>

                  {/* Review Summary */}
                  {reviews.length > 0 && (
                    <div className="bg-white rounded-2xl border border-background-200/70 p-5 md:p-6 mb-6">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8">
                        <div className="text-center">
                          <div className="text-4xl md:text-5xl font-heading font-bold text-foreground-900 mb-1">
                            {reviewStats.average.toFixed(1)}
                          </div>
                          <StarRating rating={reviewStats.average} size="sm" />
                          <p className="text-xs text-foreground-500 mt-1">
                            {t("public.communityReviewsCount", { count: reviewStats.total })}
                          </p>
                        </div>
                        <div className="flex-1 w-full space-y-1.5">
                          {[5, 4, 3, 2, 1].map((star) => {
                            const count = reviewStats.distribution[star - 1];
                            const pct = (count / reviewStats.total) * 100;
                            return (
                              <div key={star} className="flex items-center gap-2">
                                <span className="text-xs text-foreground-500 w-16 whitespace-nowrap">
                                  {t("business.ratingLabel", { count: star })}
                                </span>
                                <div className="flex-1 h-2 bg-background-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                                    style={{ width: `${pct}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs text-foreground-400 w-8 text-right">{count}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Review List */}
                  {reviews.length > 0 ? (
                    <div className="space-y-4">
                      {displayedReviews.map((review) => (
                        <ReviewCard key={review.id} review={review} />
                      ))}
                      {reviews.length > 4 && !showAllReviews && (
                        <button
                          onClick={() => setShowAllReviews(true)}
                          className="w-full py-3 mt-2 rounded-xl border border-dashed border-foreground-300 text-sm text-foreground-600 font-medium hover:bg-background-100 hover:border-foreground-400 transition-all cursor-pointer"
                        >
                          {t("business.showAllReviews", { count: reviews.length })}
                          <i className="ri-arrow-down-s-line ml-1"></i>
                        </button>
                      )}
                      {showAllReviews && reviews.length > 4 && (
                        <button
                          onClick={() => setShowAllReviews(false)}
                          className="w-full py-3 mt-2 rounded-xl border border-dashed border-foreground-300 text-sm text-foreground-600 font-medium hover:bg-background-100 hover:border-foreground-400 transition-all cursor-pointer"
                        >
                          {t("business.showFewer")}
                          <i className="ri-arrow-up-s-line ml-1"></i>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl border border-background-200/70 p-8 text-center">
                      <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center rounded-full bg-accent-100">
                        <i className="ri-chat-smile-2-line text-accent-500 text-xl"></i>
                      </div>
                      <p className="text-sm text-foreground-500">{t("business.noReviews")}</p>
                    </div>
                  )}
                </div>

                {/* Write a Review */}
                {!reviewFormOpen ? (
                  <button
                    onClick={() => { setReviewFormOpen(true); setReviewFormSuccess(false); setReviewFormError(""); }}
                    className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl border-2 border-dashed border-foreground-200 text-foreground-600 font-medium hover:border-primary-300 hover:text-primary-500 hover:bg-primary-50/50 transition-all cursor-pointer"
                  >
                    <i className="ri-pencil-line"></i>
                    {t("business.writeReview")}
                  </button>
                ) : (
                  <div className="bg-white rounded-2xl border border-background-200/70 p-5 md:p-6">
                    <div className="flex items-center justify-between mb-5">
                      <h2 className="font-heading text-xl text-foreground-900">{t("business.writeReview")}</h2>
                      <button
                        onClick={() => setReviewFormOpen(false)}
                        aria-label={t("business.closeReviewForm")}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-background-100 text-foreground-400 hover:text-foreground-600 transition-colors cursor-pointer"
                      >
                        <i className="ri-close-line"></i>
                      </button>
                    </div>

                    {reviewFormSuccess ? (
                      <div className="text-center py-8">
                        <div className="w-14 h-14 mx-auto mb-4 flex items-center justify-center rounded-full bg-accent-100">
                          <i className="ri-check-line text-accent-500 text-2xl"></i>
                        </div>
                        <h3 className="font-heading text-lg text-foreground-900 mb-2">{t("business.reviewSubmitted")}</h3>
                        <p className="text-sm text-foreground-500 max-w-sm mx-auto mb-5">
                          {t("business.reviewSuccessDescription")}
                        </p>
                        <button
                          onClick={() => { setReviewFormOpen(false); setReviewFormSuccess(false); setReviewRating(0); }}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors whitespace-nowrap cursor-pointer"
                        >
                          <i className="ri-arrow-left-line"></i>
                          {t("business.backToBusiness")}
                        </button>
                      </div>
                    ) : (
                      <form
                        id="business-review-form"

                        onSubmit={async (e) => {
                          e.preventDefault();
                          const form = e.currentTarget;
                          const honeypotInput = form.querySelector<HTMLInputElement>('input[name="phone_alt"]');
                          if (honeypotInput && honeypotInput.value.trim() !== "") {
                            setReviewFormSuccess(true);
                            setReviewFormError("");
                            return;
                          }
                          if (reviewRating === 0) {
                            setReviewFormError(t("business.selectRatingError"));
                            return;
                          }
                          setReviewFormSubmitting(true);
                          setReviewFormError("");
                          try {
                            const formData = new FormData(form);
                            const content = (formData.get("content") as string) || "";
                            const name = ((formData.get("name") as string) || "").trim();
                            const title = (formData.get("title") as string) || "";
                            const visitType = ((formData.get("visit_type") as string) || "").trim();

                            const newReview = await directoryService.submitReview(
                              business.id,
                              reviewRating,
                              content
                            );

                            if (newReview) {
                              const enriched: BusinessReview = {
                                ...newReview,
                                reviewerName: name || newReview.reviewerName,
                                title: title || newReview.title,
                                visitType: visitType || newReview.visitType,
                              };
                              setReviews((prev) => [enriched, ...prev]);
                            }

                            setReviewFormSuccess(true);
                          } catch {
                            setReviewFormError(t("business.networkError"));
                          } finally {
                            setReviewFormSubmitting(false);
                          }
                        }}
                      >
                        <input type="hidden" name="business_id" value={business.id} />
                        <input type="hidden" name="business_name" value={business.name} />

                        {/* Honeypot - hidden from real users */}
                        <div className="review-form-honeypot">
                          <input type="text" name="phone_alt" tabIndex={-1} autoComplete="off" aria-hidden="true" readOnly />
                        </div>

                        {/* Star Rating */}
                        <div className="mb-5">
                          <label className="block text-sm font-medium text-foreground-700 mb-2">{t("business.yourRating")}</label>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setReviewRating(star)}
                                aria-label={t("business.rateStars", { count: star })}
                                className="w-9 h-9 flex items-center justify-center cursor-pointer transition-colors"
                              >
                                <i
                                  className={`${star <= reviewRating ? "ri-star-fill text-yellow-400" : "ri-star-line text-foreground-300"} text-2xl hover:text-yellow-400 transition-colors`}
                                ></i>
                              </button>
                            ))}
                            {reviewRating > 0 && (
                              <span className="ml-2 text-sm font-medium text-foreground-600">
                                {reviewRating === 5
                                  ? t("business.ratingExcellent")
                                  : reviewRating === 4
                                    ? t("business.ratingVeryGood")
                                    : reviewRating === 3
                                      ? t("business.ratingGood")
                                      : reviewRating === 2
                                        ? t("business.ratingFair")
                                        : t("business.ratingPoor")}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Name + Email */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label htmlFor="review-name" className="block text-sm font-medium text-foreground-700 mb-1.5">{t("public.yourName")}</label>
                            <input
                              id="review-name"
                              name="name"
                              type="text"
                              required
                              placeholder={t("business.namePlaceholder")}
                              className="w-full px-4 py-2.5 rounded-xl border border-background-200 bg-background-50 text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100 transition-colors"
                            />
                          </div>
                          <div>
                            <label htmlFor="review-email" className="block text-sm font-medium text-foreground-700 mb-1.5">{t("business.yourEmail")}</label>
                            <input
                              id="review-email"
                              name="email"
                              type="email"
                              required
                              placeholder={t("business.emailPlaceholder")}
                              className="w-full px-4 py-2.5 rounded-xl border border-background-200 bg-background-50 text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100 transition-colors"
                            />
                          </div>
                        </div>

                        {/* Visit Type */}
                        <div className="mb-4">
                          <label htmlFor="review-visit-type" className="block text-sm font-medium text-foreground-700 mb-1.5">{t("business.visitType")}</label>
                          <select
                            id="review-visit-type"
                            name="visit_type"
                            className="w-full px-4 py-2.5 rounded-xl border border-background-200 bg-background-50 text-sm text-foreground-900 focus:outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100 transition-colors cursor-pointer appearance-none"
                            style={{
                              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                              backgroundRepeat: "no-repeat",
                              backgroundPosition: "right 12px center",
                              paddingRight: "2.5rem",
                            }}
                          >
                            <option value="">{t("business.selectVisitType")}</option>
                            <option value="Couple">{t("business.couple")}</option>
                            <option value="Family">{t("business.family")}</option>
                            <option value="Solo">{t("business.solo")}</option>
                            <option value="Friends">{t("business.friends")}</option>
                            <option value="Business">{t("business.business")}</option>
                          </select>
                        </div>

                        {/* Review Title */}
                        <div className="mb-4">
                          <label htmlFor="review-title" className="block text-sm font-medium text-foreground-700 mb-1.5">{t("business.reviewTitle")}</label>
                          <input
                            id="review-title"
                            name="title"
                            type="text"
                            required
                            placeholder={t("business.reviewTitlePlaceholder")}
                            className="w-full px-4 py-2.5 rounded-xl border border-background-200 bg-background-50 text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100 transition-colors"
                          />
                        </div>

                        {/* Review Content */}
                        <div className="mb-5">
                          <label htmlFor="review-content" className="block text-sm font-medium text-foreground-700 mb-1.5">{t("business.yourReview")}</label>
                          <textarea
                            id="review-content"
                            name="content"
                            required
                            maxLength={500}
                            rows={4}
                            placeholder={t("business.reviewPlaceholder")}
                            className="w-full px-4 py-2.5 rounded-xl border border-background-200 bg-background-50 text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100 transition-colors resize-none"
                          ></textarea>
                          <p className="text-xs text-foreground-400 mt-1">{t("public.maxCharacters")}</p>
                        </div>

                        {/* Error message */}
                        {reviewFormError && (
                          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2">
                            <i className="ri-error-warning-line text-red-500 text-sm mt-0.5 shrink-0"></i>
                            <p className="text-sm text-red-700">{reviewFormError}</p>
                          </div>
                        )}

                        {/* Submit */}
                        <div className="flex items-center gap-3">
                          <button
                            type="submit"
                            disabled={reviewFormSubmitting}
                            className="flex items-center gap-2 px-6 py-3 rounded-full bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap cursor-pointer"
                          >
                            {reviewFormSubmitting ? (
                              <>
                                <i className="ri-loader-4-line animate-spin"></i>
                                {t("business.submittingReview")}
                              </>
                            ) : (
                              <>
                                <i className="ri-send-plane-line"></i>
                                {t("business.submitReview")}
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => setReviewFormOpen(false)}
                            className="px-5 py-3 rounded-full text-sm text-foreground-500 font-medium hover:text-foreground-700 hover:bg-background-100 transition-colors whitespace-nowrap cursor-pointer"
                          >
                            {t("business.cancel")}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>

              {/* Right Sidebar */}
              <div className="w-full lg:w-[360px] shrink-0 space-y-6 self-start lg:sticky lg:top-24">
                {/* Contact Card */}
                <div className="bg-white rounded-2xl border border-background-200/70 p-5">
                  <h3 className="font-heading text-base text-foreground-900 mb-4">{t("business.contactLocation")}</h3>
                  <div className="space-y-3 mb-5">
                    <a
                      href={`tel:${business.phone}`}
                      className="flex items-center gap-3 py-3 px-4 rounded-xl bg-background-50 hover:bg-primary-50 transition-colors cursor-pointer group"
                    >
                      <div className="w-9 h-9 flex items-center justify-center rounded-full bg-primary-100 text-primary-600 group-hover:bg-primary-500 group-hover:text-white transition-colors shrink-0">
                        <i className="ri-phone-line"></i>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-foreground-500">{t("public.phone")}</p>
                        <p className="text-sm font-medium text-foreground-900 truncate">{business.phone}</p>
                      </div>
                    </a>
                    <a
                      href={`mailto:${business.email}`}
                      className="flex items-center gap-3 py-3 px-4 rounded-xl bg-background-50 hover:bg-primary-50 transition-colors cursor-pointer group"
                    >
                      <div className="w-9 h-9 flex items-center justify-center rounded-full bg-primary-100 text-primary-600 group-hover:bg-primary-500 group-hover:text-white transition-colors shrink-0">
                        <i className="ri-mail-line"></i>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-foreground-500">{t("public.email")}</p>
                        <p className="text-sm font-medium text-foreground-900 truncate">{business.email}</p>
                      </div>
                    </a>
                    <a
                      href={business.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 py-3 px-4 rounded-xl bg-background-50 hover:bg-primary-50 transition-colors cursor-pointer group"
                    >
                      <div className="w-9 h-9 flex items-center justify-center rounded-full bg-primary-100 text-primary-600 group-hover:bg-primary-500 group-hover:text-white transition-colors shrink-0">
                        <i className="ri-global-line"></i>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-foreground-500">{t("public.website")}</p>
                        <p className="text-sm font-medium text-foreground-900 truncate">{business.website.replace("https://", "").replace("http://", "").replace(/\/$/, "")}</p>
                      </div>
                    </a>
                  </div>

                  {/* Map */}
                  <div className="rounded-xl overflow-hidden h-[200px] bg-background-100 relative">
                    <iframe
                      src={mapUrl}
                      className="absolute inset-0 w-full h-full border-0"
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title={t("business.mapLocationTitle", { name: business.name })}
                    ></iframe>
                  </div>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(business.name + ", " + business.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 rounded-full border border-foreground-200 text-sm text-foreground-700 font-medium hover:bg-background-100 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <i className="ri-navigation-line"></i>
                    {t("business.getDirections")}
                  </a>
                </div>

                {/* Similar Businesses */}
                {similarBusinesses.length > 0 && (
                  <div className="bg-white rounded-2xl border border-background-200/70 p-5">
                    <h3 className="font-heading text-base text-foreground-900 mb-4">
                      {t("business.similarBusinesses")}
                    </h3>
                    <div className="space-y-3">
                      {similarBusinesses.map((similar) => (
                        <Link
                          key={similar.id}
                          to={`/business/${similar.id}`}
                          className="flex items-start gap-3 py-2 group cursor-pointer"
                        >
                          <img
                            src={similar.image}
                            alt={similar.name}
                            className="w-14 h-14 rounded-lg object-cover object-top shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-semibold text-foreground-900 group-hover:text-primary-500 transition-colors truncate">
                              {similar.name}
                            </h4>
                            <div className="flex items-center gap-1 mt-0.5">
                              <i className="ri-star-fill text-yellow-400 text-[10px]"></i>
                              <span className="text-xs font-medium text-foreground-700">{similar.rating}</span>
                              <span className="text-xs text-foreground-400">({similar.reviewCount})</span>
                            </div>
                            <p className="text-xs text-foreground-500 mt-0.5 truncate">{similar.subcategory} · {getPriceRangeLabel(similar.priceRange)}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                    <Link
                      to="/explore"
                      className="mt-4 flex items-center justify-center gap-1.5 w-full py-2.5 rounded-full border border-foreground-200 text-sm text-foreground-600 font-medium hover:bg-background-100 transition-colors whitespace-nowrap cursor-pointer"
                    >
                      {t("business.viewAllBusinesses")}
                      <i className="ri-arrow-right-line text-sm"></i>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="w-full px-4 md:px-8 lg:px-12 pb-12 md:pb-16 bg-background-50">
          <div className="max-w-7xl mx-auto">
            <div className="bg-gradient-to-r from-primary-500 to-accent-500 rounded-2xl p-8 md:p-10 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 bg-white/5 mb-6">
                <i className="ri-store-2-line text-white/80 text-sm"></i>
                <span className="text-sm font-medium text-white/80">{t("business.discoverMore")}</span>
              </div>
              <h2 className="font-heading text-2xl md:text-3xl text-white mb-3">
                {t("business.readyToExplore")}
              </h2>
              <p className="text-white/60 text-sm md:text-base max-w-lg mx-auto mb-8">
                {t("business.exploreDescription")}
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <Link
                  to="/explore"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-primary-600 text-sm font-medium hover:bg-white/90 transition-colors whitespace-nowrap cursor-pointer"
                >
                  <i className="ri-compass-3-line"></i>
                  {t("business.exploreDirectory")}
                </Link>
                <Link
                  to="/travel-guides"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/30 text-white text-sm font-medium hover:bg-white/10 transition-colors whitespace-nowrap cursor-pointer"
                >
                  <i className="ri-book-open-line"></i>
                  {t("business.travelGuides")}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <ClaimListingModal
        business={business}
        isOpen={claimModalOpen}
        onClose={() => setClaimModalOpen(false)}
      />
      <Footer />
    </>
  );
}

function ReviewCard({ review }: { review: BusinessReview }) {
  return (
    <div className="bg-white rounded-2xl border border-background-200/70 p-5 md:p-6">
      <div className="flex items-start gap-3 mb-3">
        {review.reviewerAvatar && (
          <img
            src={review.reviewerAvatar}
            alt={review.reviewerName || ""}
            className="w-10 h-10 rounded-full object-cover shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              {review.reviewerName && (
                <h4 className="text-sm font-semibold text-foreground-900">{review.reviewerName}</h4>
              )}
              <div className="flex items-center gap-2 mt-0.5">
                <StarRating rating={review.rating} size="sm" />
                {review.date && <span className="text-xs text-foreground-500">{review.date}</span>}
              </div>
            </div>
            {review.visitType && (
              <span className="px-2 py-0.5 rounded-full bg-secondary-100 text-secondary-700 text-xs font-medium whitespace-nowrap">
                {review.visitType}
              </span>
            )}
          </div>
        </div>
      </div>
      {review.title && (
        <h5 className="text-sm font-semibold text-foreground-900 mb-2">{review.title}</h5>
      )}
      <p className="text-sm text-foreground-600 leading-relaxed">{review.content}</p>
    </div>
  );
}
