import { useState, useMemo, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
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

const priceRangeLabel: Record<string, string> = {
  "$": "Budget",
  "$$": "Moderate",
  "$$$": "Premium",
};

const businessGalleryImages: Record<string, string[]> = {
  "biz-001": [
    "https://readdy.ai/api/search-image?query=Elegant%20rooftop%20restaurant%20terrace%20with%20panoramic%20Mediterranean%20sea%20view%20at%20sunset%20candlelit%20tables%20white%20tablecloths%20Turkish%20lanterns%20warm%20golden%20atmosphere%20Alanya%20castle%20hill%20background%20editorial%20food%20photography%20high%20detail%20luxurious%20ambiance&width=800&height=600&seq=biz-gal-001-2&orientation=landscape",
    "https://readdy.ai/api/search-image?query=Close%20up%20of%20beautifully%20plated%20Ottoman%20Turkish%20fine%20dining%20dish%20with%20grilled%20lamb%20and%20meze%20on%20white%20plate%20elegant%20restaurant%20interior%20warm%20candlelight%20Alanya%20upscale%20dining&width=800&height=600&seq=biz-gal-001-3&orientation=landscape",
  ],
  "biz-002": [
    "https://readdy.ai/api/search-image?query=Luxury%20beach%20club%20with%20white%20sun%20loungers%20turquoise%20sea%20golden%20sand%20palm%20trees%20Mediterranean%20coastline%20sunny%20day%20clear%20blue%20sky%20Alanya%20Cleopatra%20beach%20resort%20lifestyle%20editorial%20photography%20vibrant%20colors&width=800&height=600&seq=biz-gal-002-2&orientation=landscape",
    "https://readdy.ai/api/search-image?query=Wood%20fired%20pizza%20and%20colorful%20frozen%20cocktails%20on%20beachside%20table%20with%20turquoise%20Mediterranean%20sea%20background%20palm%20trees%20sunny%20summer%20day%20Alanya%20beach%20club%20food%20photography&width=800&height=600&seq=biz-gal-002-3&orientation=landscape",
  ],
  "biz-003": [
    "https://readdy.ai/api/search-image?query=Charming%20garden%20courtyard%20cafe%20with%20colorful%20flowers%20hanging%20vines%20rustic%20wooden%20tables%20traditional%20Turkish%20breakfast%20spread%20with%20fresh%20bread%20olives%20honey%20and%20tea%20warm%20morning%20sunlight%20cozy%20atmosphere%20editorial%20photography%20high%20detail&width=800&height=600&seq=biz-gal-003-2&orientation=landscape",
    "https://readdy.ai/api/search-image?query=Handmade%20traditional%20Turkish%20gozleme%20being%20prepared%20by%20village%20women%20in%20rustic%20garden%20setting%20fresh%20spinach%20and%20cheese%20filling%20flour%20dusted%20wooden%20table%20warm%20natural%20light%20Alanya%20cafe&width=800&height=600&seq=biz-gal-003-3&orientation=landscape",
  ],
  "biz-004": [
    "https://readdy.ai/api/search-image?query=Elegant%20boutique%20hotel%20restored%20Ottoman%20mansion%20white%20stone%20exterior%20blue%20shutters%20bougainvillea%20flowers%20rooftop%20infinity%20pool%20overlooking%20Mediterranean%20harbor%20Alanya%20castle%20background%20luxury%20travel%20photography%20warm%20golden%20hour%20light&width=800&height=600&seq=biz-gal-004-2&orientation=landscape",
    "https://readdy.ai/api/search-image?query=Luxurious%20Ottoman%20style%20hotel%20room%20with%20antique%20wooden%20bed%20hand%20painted%20ceiling%20tiles%20traditional%20Turkish%20decor%20balcony%20overlooking%20Alanya%20harbor%20warm%20romantic%20atmosphere%20boutique%20hotel%20interior&width=800&height=600&seq=biz-gal-004-3&orientation=landscape",
  ],
  "biz-005": [
    "https://readdy.ai/api/search-image?query=Luxury%20Mediterranean%20resort%20with%20multiple%20pools%20palm%20trees%20tropical%20gardens%20private%20sandy%20beach%20turquoise%20sea%20white%20buildings%20terracotta%20roofs%20aerial%20view%20sunny%20day%20editorial%20travel%20photography%20grand%20scale&width=800&height=600&seq=biz-gal-005-2&orientation=landscape",
    "https://readdy.ai/api/family-friendly-resort-pool-area-with-water-slides-splash-park-children-playing-parents-relaxing-sun-loungers-palm-trees-mediterranean-resort-alanya-turkey-sunny-day",
  ],
  "biz-006": [
    "https://readdy.ai/api/search-image?query=Traditional%20wooden%20pirate-themed%20boat%20with%20colorful%20flags%20sailing%20on%20crystal%20clear%20turquoise%20Mediterranean%20water%20Alanya%20castle%20and%20rocky%20coastline%20in%20background%20sunny%20summer%20day%20adventure%20tourism%20editorial%20photography%20vibrant%20joyful%20atmosphere&width=800&height=600&seq=biz-gal-006-2&orientation=landscape",
    "https://readdy.ai/api/search-image?query=People%20swimming%20and%20having%20fun%20in%20crystal%20clear%20turquoise%20water%20near%20dramatic%20rocky%20caves%20Alanya%20coastline%20foam%20party%20on%20pirate%20boat%20summer%20adventure%20travel%20photography&width=800&height=600&seq=biz-gal-006-3&orientation=landscape",
  ],
  "biz-007": [
    "https://readdy.ai/api/search-image?query=Off-road%20jeep%20driving%20through%20rugged%20Taurus%20mountains%20pine%20forest%20dusty%20trail%20dramatic%20landscape%20turquoise%20river%20waterfall%20natural%20pool%20adventure%20travel%20photography%20sunny%20day%20outdoor%20exploration%20majestic%20scenery&width=800&height=600&seq=biz-gal-007-2&orientation=landscape",
    "https://readdy.ai/api/search-image?query=Traditional%20Turkish%20nomadic%20Yoruk%20village%20in%20Taurus%20mountains%20stone%20houses%20villagers%20making%20tea%20outdoor%20barbecue%20lunch%20pine%20forest%20Alanya%20region%20cultural%20travel%20photography&width=800&height=600&seq=biz-gal-007-3&orientation=landscape",
  ],
  "biz-008": [
    "https://readdy.ai/api/search-image?query=Luxurious%20traditional%20Turkish%20bath%20interior%20white%20marble%20heated%20stone%20platform%20domed%20ceiling%20with%20star-shaped%20windows%20soft%20steam%20atmospheric%20lighting%20elegant%20spa%20setting%20gold%20accents%20authentic%20Ottoman%20architecture%20editorial%20photography%20serene%20mood&width=800&height=600&seq=biz-gal-008-2&orientation=landscape",
    "https://readdy.ai/api/search-image?query=Traditional%20Turkish%20hammam%20foam%20massage%20ritual%20with%20therapist%20white%20marble%20setting%20soft%20steam%20atmospheric%20lighting%20authentic%20spa%20experience%20Alanya%20Turkey%20wellness%20photography&width=800&height=600&seq=biz-gal-008-3&orientation=landscape",
  ],
  "biz-009": [
    "https://readdy.ai/api/search-image?query=Modern%20bright%20dental%20clinic%20interior%20with%20white%20walls%20clean%20design%20reception%20area%20plants%20comfortable%20seating%20professional%20medical%20environment%20large%20windows%20natural%20light%20welcoming%20atmosphere%20editorial%20photography%20high%20detail&width=800&height=600&seq=biz-gal-009-2&orientation=landscape",
    "https://readdy.ai/api/search-image?query=Modern%20dental%20treatment%20room%20with%20advanced%20equipment%20comfortable%20patient%20chair%203D%20scanner%20technology%20bright%20clean%20medical%20environment%20Alanya%20Turkey%20professional%20dental%20clinic&width=800&height=600&seq=biz-gal-009-3&orientation=landscape",
  ],
  "biz-010": [
    "https://readdy.ai/api/search-image?query=Modern%20real%20estate%20office%20interior%20with%20large%20window%20displaying%20Mediterranean%20sea%20view%20property%20listings%20on%20screens%20professional%20atmosphere%20clean%20design%20comfortable%20seating%20area%20warm%20lighting%20Alanya%20map%20on%20wall%20editorial%20photography&width=800&height=600&seq=biz-gal-010-2&orientation=landscape",
    "https://readdy.ai/api/search-image?query=Luxury%20modern%20apartment%20with%20panoramic%20Mediterranean%20sea%20view%20balcony%20Alanya%20Turkey%20white%20interior%20design%20bright%20natural%20light%20real%20estate%20property%20photography&width=800&height=600&seq=biz-gal-010-3&orientation=landscape",
  ],
  "biz-011": [
    "https://readdy.ai/api/search-image?query=Fleet%20of%20modern%20rental%20cars%20parked%20outside%20clean%20office%20building%20Mediterranean%20palm%20trees%20sunny%20day%20compact%20cars%20and%20SUVs%20professional%20car%20rental%20service%20Alanya%20editorial%20photography&width=800&height=600&seq=biz-gal-011-2&orientation=landscape",
    "https://readdy.ai/api/search-image?query=Open%20top%20convertible%20car%20driving%20along%20scenic%20Mediterranean%20coastal%20highway%20with%20turquoise%20sea%20and%20dramatic%20cliffs%20Alanya%20Antalya%20road%20trip%20travel%20photography%20sunny%20day&width=800&height=600&seq=biz-gal-011-3&orientation=landscape",
  ],
  "biz-012": [
    "https://readdy.ai/api/search-image?query=Elegant%20jewelry%20store%20interior%20with%20glass%20display%20cases%20filled%20with%20gold%20necklaces%20rings%20and%20precious%20stones%20warm%20spotlighting%20luxurious%20atmosphere%20polished%20marble%20floor%20Turkish%20jewelry%20craftsmanship%20editorial%20photography%20rich%20golden%20tones&width=800&height=600&seq=biz-gal-012-2&orientation=landscape",
    "https://readdy.ai/api/search-image?query=Close%20up%20of%20master%20jeweler%20working%20on%20handcrafted%20gold%20necklace%20intricate%20detailed%20work%20Turkish%20jewelry%20craftsmanship%20workshop%20Alanya%20Turkey%20warm%20lighting&width=800&height=600&seq=biz-gal-012-3&orientation=landscape",
  ],
  "biz-013": [
    "https://readdy.ai/api/search-image?query=Beautifully%20lit%20carpet%20shop%20interior%20with%20colorful%20handwoven%20Turkish%20kilims%20and%20silk%20carpets%20hanging%20on%20walls%20and%20stacked%20on%20floor%20traditional%20patterns%20rich%20reds%20blues%20and%20warm%20tones%20authentic%20atmosphere%20editorial%20photography%20cultural%20craftsmanship&width=800&height=600&seq=biz-gal-013-2&orientation=landscape",
    "https://readdy.ai/api/search-image?query=Close%20up%20of%20intricate%20handwoven%20Turkish%20silk%20carpet%20details%20colorful%20geometric%20patterns%20fine%20craftsmanship%20Anatolian%20textile%20art%20warm%20natural%20light&width=800&height=600&seq=biz-gal-013-3&orientation=landscape",
  ],
  "biz-024": [
    "https://readdy.ai/api/search-image?query=Traditional%20Turkish%20kebab%20restaurant%20interior%20with%20wooden%20tables%20charcoal%20grill%20visible%20from%20dining%20area%20freshly%20grilled%20Adana%20kebab%20skewers%20on%20plate%20with%20lava%C5%9F%20bread%20and%20grilled%20vegetables%20warm%20casual%20atmosphere%20authentic%20local%20eatery%20editorial%20food%20photography&width=800&height=600&seq=biz-gal-024-2&orientation=landscape",
    "https://readdy.ai/api/search-image?query=Close%20up%20of%20freshly%20grilled%20Iskender%20kebab%20on%20crispy%20pide%20bread%20topped%20with%20tomato%20sauce%20and%20melted%20butter%20traditional%20Turkish%20restaurant%20Alanya%20steaming%20hot%20authentic%20food%20photography&width=800&height=600&seq=biz-gal-024-3&orientation=landscape",
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
    "https://readdy.ai/api/search-image?query=Beautiful%20Mediterranean%20coastal%20town%20Alanya%20Turkey%20with%20castle%20on%20hill%20turquoise%20sea%20palm%20trees%20sunny%20day%20panoramic%20view%20travel%20photography&width=800&height=600&seq=biz-gal-default-1&orientation=landscape",
    "https://readdy.ai/api/search-image?query=Alanya%20harbor%20with%20yachts%20and%20fishing%20boats%20colorful%20buildings%20Mediterranean%20coast%20sunny%20day%20Turkish%20Riviera%20travel%20photography%20vibrant%20atmosphere&width=800&height=600&seq=biz-gal-default-2&orientation=landscape",
  ];
}

export default function BusinessDetailPage() {
  const { businessId } = useParams<{ businessId: string }>();

  const initialBusiness = businessId ? directoryService.getListingByIdSync(businessId) : null;
  const [business, setBusiness] = useState<Business | null>(initialBusiness);
  const [reviews, setReviews] = useState<BusinessReview[]>([]);
  const [similarBusinesses, setSimilarBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(!initialBusiness);
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

  useEffect(() => {
    if (!businessId) {
      setIsLoading(false);
      return;
    }
    let isMounted = true;
    const loadData = async () => {
      if (!initialBusiness) {
        setIsLoading(true);
      }
      setError(null);
      try {
        const [fetchedBiz, fetchedReviews] = await Promise.all([
          directoryService.getListingById(businessId),
          directoryService.getListingReviews(businessId),
        ]);
        if (isMounted) {
          if (fetchedBiz) {
            setBusiness(fetchedBiz);
            try {
              const similarRes = await directoryService.getListings({
                category: fetchedBiz.category,
                limit: 5,
              });
              if (isMounted && similarRes?.data) {
                setSimilarBusinesses(
                  similarRes.data.filter((b) => b.id !== fetchedBiz.id).slice(0, 4)
                );
              }
            } catch {
              // ignore similar fetch error
            }
          }
          if (fetchedReviews) setReviews(fetchedReviews);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load business details");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, [businessId, initialBusiness]);

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
          <ErrorState message={error} onRetry={() => window.location.reload()} />
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
            <h2 className="font-heading text-2xl text-foreground-900 mb-2">Business not found</h2>
            <p className="text-sm text-foreground-500 max-w-md mx-auto mb-6">
              This business listing might have been removed or the link is incorrect.
            </p>
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors whitespace-nowrap cursor-pointer"
            >
              <i className="ri-arrow-left-line"></i>
              Browse All Businesses
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
                <Link to="/" className="text-white/50 hover:text-white/80 text-xs transition-colors underline underline-offset-2">Home</Link>
                <i className="ri-arrow-right-s-line text-white/30 text-xs"></i>
                <Link to="/explore" className="text-white/50 hover:text-white/80 text-xs transition-colors underline underline-offset-2">Business Directory</Link>
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
                      {priceRangeLabel[business.priceRange] || business.priceRange}
                    </span>
                  </div>
                  <h1 className="font-heading text-3xl md:text-5xl text-white mb-2">{business.name}</h1>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <StarRating rating={business.rating} size="lg" />
                      <span className="text-white font-semibold text-lg">{business.rating}</span>
                    </div>
                    <span className="text-white/60 text-sm">({business.reviewCount} reviews)</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => businessId && toggleFavorite(businessId)}
                    className={`w-11 h-11 flex items-center justify-center rounded-full border backdrop-blur-sm transition-all cursor-pointer ${
                      favorited
                        ? "bg-accent-500/20 border-accent-400/40 text-white"
                        : "bg-white/10 border-white/20 text-white/70 hover:text-white hover:border-white/40 hover:bg-white/20"
                    }`}
                    title={favorited ? "Remove from favorites" : "Save to favorites"}
                  >
                    <i className={`${favorited ? "ri-heart-fill" : "ri-heart-line"} text-lg`}></i>
                  </button>
                  <a
                    href={`tel:${business.phone}`}
                    className="flex items-center gap-2 px-5 py-3 rounded-full bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <i className="ri-phone-line"></i>
                    Call Now
                  </a>
                  <a
                    href={business.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-5 py-3 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-medium hover:bg-white/30 transition-colors whitespace-nowrap cursor-pointer border border-white/20"
                  >
                    <i className="ri-external-link-line"></i>
                    Visit Website
                  </a>
                  <button
                    type="button"
                    onClick={() => setClaimModalOpen(true)}
                    className="flex items-center gap-2 px-5 py-3 rounded-full bg-accent-500 text-white text-sm font-medium hover:bg-accent-600 transition-colors whitespace-nowrap cursor-pointer shadow-sm"
                    title="Claim this listing as the verified owner"
                  >
                    <i className="ri-shield-user-fill"></i>
                    Claim Listing
                  </button>
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
                  <p className="text-[11px] font-medium text-foreground-400 uppercase tracking-wide mb-0.5">Address</p>
                  <p className="text-sm text-foreground-900 font-medium leading-snug truncate">{business.address}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <i className="ri-time-line text-foreground-400 text-sm mt-0.5 shrink-0"></i>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-foreground-400 uppercase tracking-wide mb-0.5">Hours</p>
                  <p className="text-sm text-foreground-900 font-medium leading-snug truncate">{business.openingHours}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <i className="ri-phone-line text-foreground-400 text-sm mt-0.5 shrink-0"></i>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-foreground-400 uppercase tracking-wide mb-0.5">Phone</p>
                  <a href={`tel:${business.phone}`} className="text-sm text-foreground-900 font-medium hover:text-primary-500 transition-colors truncate cursor-pointer">{business.phone}</a>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <i className="ri-money-dollar-circle-line text-foreground-400 text-sm mt-0.5 shrink-0"></i>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-foreground-400 uppercase tracking-wide mb-0.5">Price Range</p>
                  <p className="text-sm text-foreground-900 font-medium leading-snug">{priceRangeLabel[business.priceRange] || business.priceRange}</p>
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
                  <h2 className="font-heading text-xl md:text-2xl text-foreground-900 mb-4">About {business.name}</h2>
                  <p className="text-sm md:text-base text-foreground-600 leading-relaxed">
                    {business.description}
                  </p>
                </div>

                {/* Tags */}
                <div>
                  <h3 className="font-heading text-sm uppercase tracking-wider text-foreground-400 mb-3">
                    Highlights
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
                  <h2 className="font-heading text-xl md:text-2xl text-foreground-900 mb-4">Photos</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="rounded-xl overflow-hidden aspect-[4/3]">
                      <img
                        src={business.image}
                        alt={`${business.name} - Photo 1`}
                        className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="rounded-xl overflow-hidden aspect-[4/3]">
                      <img
                        src={galleryExtras[0]}
                        alt={`${business.name} - Photo 2`}
                        className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="rounded-xl overflow-hidden aspect-[4/3]">
                      <img
                        src={galleryExtras[1]}
                        alt={`${business.name} - Photo 3`}
                        className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Reviews */}
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="font-heading text-xl md:text-2xl text-foreground-900">Reviews</h2>
                    <span className="text-sm text-foreground-500">{reviewStats.total} reviews</span>
                  </div>

                  {/* Review Summary */}
                  <div className="bg-white rounded-2xl border border-background-200/70 p-5 md:p-6 mb-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8">
                      <div className="text-center">
                        <div className="text-4xl md:text-5xl font-heading font-bold text-foreground-900 mb-1">
                          {reviewStats.average.toFixed(1)}
                        </div>
                        <StarRating rating={reviewStats.average} size="sm" />
                        <p className="text-xs text-foreground-500 mt-1">{reviewStats.total} reviews</p>
                      </div>
                      <div className="flex-1 w-full space-y-1.5">
                        {[5, 4, 3, 2, 1].map((star) => {
                          const count = reviewStats.distribution[star - 1];
                          const pct = reviewStats.total > 0 ? (count / reviewStats.total) * 100 : 0;
                          return (
                            <div key={star} className="flex items-center gap-2">
                              <span className="text-xs text-foreground-500 w-8 whitespace-nowrap">{star} star</span>
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
                          Show all {reviews.length} reviews
                          <i className="ri-arrow-down-s-line ml-1"></i>
                        </button>
                      )}
                      {showAllReviews && reviews.length > 4 && (
                        <button
                          onClick={() => setShowAllReviews(false)}
                          className="w-full py-3 mt-2 rounded-xl border border-dashed border-foreground-300 text-sm text-foreground-600 font-medium hover:bg-background-100 hover:border-foreground-400 transition-all cursor-pointer"
                        >
                          Show fewer
                          <i className="ri-arrow-up-s-line ml-1"></i>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl border border-background-200/70 p-8 text-center">
                      <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center rounded-full bg-accent-100">
                        <i className="ri-chat-smile-2-line text-accent-500 text-xl"></i>
                      </div>
                      <p className="text-sm text-foreground-500">No reviews yet. Be the first to review!</p>
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
                    Write a Review
                  </button>
                ) : (
                  <div className="bg-white rounded-2xl border border-background-200/70 p-5 md:p-6">
                    <div className="flex items-center justify-between mb-5">
                      <h2 className="font-heading text-xl text-foreground-900">Write a Review</h2>
                      <button
                        onClick={() => setReviewFormOpen(false)}
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
                        <h3 className="font-heading text-lg text-foreground-900 mb-2">Review submitted!</h3>
                        <p className="text-sm text-foreground-500 max-w-sm mx-auto mb-5">
                          Thank you for sharing your experience. Your review helps other travelers discover great businesses in Alanya.
                        </p>
                        <button
                          onClick={() => { setReviewFormOpen(false); setReviewFormSuccess(false); setReviewRating(0); }}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors whitespace-nowrap cursor-pointer"
                        >
                          <i className="ri-arrow-left-line"></i>
                          Back to Business
                        </button>
                      </div>
                    ) : (
                      <form
                        id="business-review-form"
                        data-readdy-form
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
                            setReviewFormError("Please select a rating.");
                            return;
                          }
                          setReviewFormSubmitting(true);
                          setReviewFormError("");
                          try {
                            const formData = new FormData(form);
                            const content = (formData.get("content") as string) || "";
                            const name = (formData.get("name") as string) || "Traveler";
                            const title = (formData.get("title") as string) || "";
                            const visitType = (formData.get("visit_type") as string) || "Traveler";

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
                            setReviewFormError("Network error. Please check your connection and try again.");
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
                          <label className="block text-sm font-medium text-foreground-700 mb-2">Your Rating</label>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setReviewRating(star)}
                                className="w-9 h-9 flex items-center justify-center cursor-pointer transition-colors"
                              >
                                <i
                                  className={`${star <= reviewRating ? "ri-star-fill text-yellow-400" : "ri-star-line text-foreground-300"} text-2xl hover:text-yellow-400 transition-colors`}
                                ></i>
                              </button>
                            ))}
                            {reviewRating > 0 && (
                              <span className="ml-2 text-sm font-medium text-foreground-600">
                                {reviewRating === 5 ? "Excellent!" : reviewRating === 4 ? "Very Good" : reviewRating === 3 ? "Good" : reviewRating === 2 ? "Fair" : "Poor"}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Name + Email */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label htmlFor="review-name" className="block text-sm font-medium text-foreground-700 mb-1.5">Your Name</label>
                            <input
                              id="review-name"
                              name="name"
                              type="text"
                              required
                              placeholder="John Doe"
                              className="w-full px-4 py-2.5 rounded-xl border border-background-200 bg-background-50 text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100 transition-colors"
                            />
                          </div>
                          <div>
                            <label htmlFor="review-email" className="block text-sm font-medium text-foreground-700 mb-1.5">Your Email</label>
                            <input
                              id="review-email"
                              name="email"
                              type="email"
                              required
                              placeholder="john@example.com"
                              className="w-full px-4 py-2.5 rounded-xl border border-background-200 bg-background-50 text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100 transition-colors"
                            />
                          </div>
                        </div>

                        {/* Visit Type */}
                        <div className="mb-4">
                          <label htmlFor="review-visit-type" className="block text-sm font-medium text-foreground-700 mb-1.5">Visit Type</label>
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
                            <option value="">Select visit type</option>
                            <option value="Couple">Couple</option>
                            <option value="Family">Family</option>
                            <option value="Solo">Solo</option>
                            <option value="Friends">Friends</option>
                            <option value="Business">Business</option>
                          </select>
                        </div>

                        {/* Review Title */}
                        <div className="mb-4">
                          <label htmlFor="review-title" className="block text-sm font-medium text-foreground-700 mb-1.5">Review Title</label>
                          <input
                            id="review-title"
                            name="title"
                            type="text"
                            required
                            placeholder="Sum up your experience in a few words"
                            className="w-full px-4 py-2.5 rounded-xl border border-background-200 bg-background-50 text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100 transition-colors"
                          />
                        </div>

                        {/* Review Content */}
                        <div className="mb-5">
                          <label htmlFor="review-content" className="block text-sm font-medium text-foreground-700 mb-1.5">Your Review</label>
                          <textarea
                            id="review-content"
                            name="content"
                            required
                            maxLength={500}
                            rows={4}
                            placeholder="Tell others about your experience — what did you love? Any tips for future visitors?"
                            className="w-full px-4 py-2.5 rounded-xl border border-background-200 bg-background-50 text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100 transition-colors resize-none"
                          ></textarea>
                          <p className="text-xs text-foreground-400 mt-1">Maximum 500 characters</p>
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
                                Submitting...
                              </>
                            ) : (
                              <>
                                <i className="ri-send-plane-line"></i>
                                Submit Review
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => setReviewFormOpen(false)}
                            className="px-5 py-3 rounded-full text-sm text-foreground-500 font-medium hover:text-foreground-700 hover:bg-background-100 transition-colors whitespace-nowrap cursor-pointer"
                          >
                            Cancel
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
                  <h3 className="font-heading text-base text-foreground-900 mb-4">Contact & Location</h3>
                  <div className="space-y-3 mb-5">
                    <a
                      href={`tel:${business.phone}`}
                      className="flex items-center gap-3 py-3 px-4 rounded-xl bg-background-50 hover:bg-primary-50 transition-colors cursor-pointer group"
                    >
                      <div className="w-9 h-9 flex items-center justify-center rounded-full bg-primary-100 text-primary-600 group-hover:bg-primary-500 group-hover:text-white transition-colors shrink-0">
                        <i className="ri-phone-line"></i>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-foreground-500">Phone</p>
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
                        <p className="text-xs text-foreground-500">Email</p>
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
                        <p className="text-xs text-foreground-500">Website</p>
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
                      title={`${business.name} Map Location`}
                    ></iframe>
                  </div>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(business.name + ", " + business.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 rounded-full border border-foreground-200 text-sm text-foreground-700 font-medium hover:bg-background-100 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <i className="ri-navigation-line"></i>
                    Get Directions
                  </a>
                </div>

                {/* Similar Businesses */}
                {similarBusinesses.length > 0 && (
                  <div className="bg-white rounded-2xl border border-background-200/70 p-5">
                    <h3 className="font-heading text-base text-foreground-900 mb-4">
                      Similar {businessCategories.find((c) => c.id === business.category)?.name || "Businesses"}
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
                            <p className="text-xs text-foreground-500 mt-0.5 truncate">{similar.subcategory} · {priceRangeLabel[similar.priceRange] || similar.priceRange}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                    <Link
                      to="/explore"
                      className="mt-4 flex items-center justify-center gap-1.5 w-full py-2.5 rounded-full border border-foreground-200 text-sm text-foreground-600 font-medium hover:bg-background-100 transition-colors whitespace-nowrap cursor-pointer"
                    >
                      View All Businesses
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
                <span className="text-sm font-medium text-white/80">Discover more in Alanya</span>
              </div>
              <h2 className="font-heading text-2xl md:text-3xl text-white mb-3">
                Ready to Explore Alanya?
              </h2>
              <p className="text-white/60 text-sm md:text-base max-w-lg mx-auto mb-8">
                Browse all restaurants, hotels, tours, and services. Plan your perfect Mediterranean getaway with the Alanya Holidays directory.
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <Link
                  to="/explore"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-primary-600 text-sm font-medium hover:bg-white/90 transition-colors whitespace-nowrap cursor-pointer"
                >
                  <i className="ri-compass-3-line"></i>
                  Explore Directory
                </Link>
                <Link
                  to="/travel-guides"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/30 text-white text-sm font-medium hover:bg-white/10 transition-colors whitespace-nowrap cursor-pointer"
                >
                  <i className="ri-book-open-line"></i>
                  Travel Guides
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
        <img
          src={review.reviewerAvatar}
          alt={review.reviewerName}
          className="w-10 h-10 rounded-full object-cover shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <h4 className="text-sm font-semibold text-foreground-900">{review.reviewerName}</h4>
              <div className="flex items-center gap-2 mt-0.5">
                <StarRating rating={review.rating} size="sm" />
                <span className="text-xs text-foreground-500">{review.date}</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-secondary-100 text-secondary-700 text-xs font-medium whitespace-nowrap">
              {review.visitType}
            </span>
          </div>
        </div>
      </div>
      <h5 className="text-sm font-semibold text-foreground-900 mb-2">{review.title}</h5>
      <p className="text-sm text-foreground-600 leading-relaxed">{review.content}</p>
    </div>
  );
}