import { useState, useEffect, useCallback, useRef, type FormEvent } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "@/pages/home/components/Navbar";
import Footer from "@/pages/home/components/Footer";
import { useCart } from "@/hooks/useCart";
import { useFavorites } from "@/hooks/useFavorites";
import ToastContainer, { createToast, type ToastData } from "@/components/base/Toast";
import { productsService } from "@/api-services/products.service";

interface ProductDetail {
  id: number;
  name: string;
  description: string;
  price: number;
  currency: string;
  stock: number;
  media: { url: string; type: string }[];
  product_categories: { id: number; name: string } | null;
}

interface ProductVariant {
  id: number;
  product_id: number;
  name: string;
  options: string[];
  sort_order: number;
}

interface ProductSku {
  id: number;
  product_id: number;
  label: string;
  options: string[];
  price: number;
  stock: number;
}

// ===== Coffee Tour Cafe Data =====
interface CafeStop {
  name: string;
  address: string;
  lat: number;
  lng: number;
  description: string;
  highlight: string;
  icon: string;
  imageUrl: string;
}

const COFFEE_TOUR_CAFES: CafeStop[] = [
  {
    name: "Craft Coffee Alanya",
    address: "İskele Cd. No:14, Alanya Harbor",
    lat: 36.5453,
    lng: 31.9982,
    description: "The tour kicks off at Alanya's original specialty coffee house — a sun-drenched corner spot right by the marina with views of bobbing yachts and the Red Tower.",
    highlight: "Try their signature Turkish espresso blend — a bold double shot with cardamom and a square of lokum on the side.",
    icon: "ri-ship-line",
    imageUrl: "https://readdy.ai/api/search-image?query=A%20close%20up%20editorial%20food%20photography%20of%20a%20traditional%20Turkish%20espresso%20served%20in%20a%20small%20copper%20handled%20cup%20with%20a%20thick%20layer%20of%20crema%2C%20accompanied%20by%20a%20square%20of%20pistachio%20Turkish%20delight%20lokum%20on%20a%20small%20ceramic%20plate%2C%20soft%20morning%20sunlight%20streaming%20through%20a%20window%20overlooking%20Alanya%20harbor%20with%20distant%20yachts%20and%20the%20Red%20Tower%2C%20warm%20golden%20tones%2C%20shallow%20depth%20of%20field%2C%20rustic%20wooden%20table%2C%20elegant%20composition%2C%20high%20detail%2C%20inviting%20and%20warm%20atmosphere&width=800&height=400&seq=coffee-tour-cafe-01&orientation=landscape",
  },
  {
    name: "Sweet Story Patisserie",
    address: "Atatürk Blv. No:88, Alanya Center",
    lat: 36.5440,
    lng: 31.9925,
    description: "A pastel-hued patisserie tucked into a quiet side street. Glass counters overflow with éclairs, baklava, and their legendary chocolate soufflé — baked fresh every hour.",
    highlight: "The chocolate soufflé is non-negotiable. Pair it with their single-origin Ethiopian pour-over for the perfect contrast.",
    icon: "ri-cake-2-line",
    imageUrl: "https://readdy.ai/api/search-image?query=A%20decadent%20chocolate%20souffle%20freshly%20baked%20in%20a%20white%20ramekin%20with%20a%20crackled%20top%20dusted%20with%20powdered%20sugar%2C%20alongside%20a%20glass%20carafe%20of%20single%20origin%20Ethiopian%20pour%20over%20coffee%20with%20a%20steaming%20ceramic%20cup%2C%20background%20shows%20a%20pastel%20hued%20French%20patisserie%20counter%20filled%20with%20glossy%20eclairs%20and%20baklava%2C%20soft%20diffused%20natural%20window%20light%2C%20editorial%20dessert%20photography%2C%20rich%20brown%20and%20cream%20tones%2C%20mouthwatering%20detail%2C%20elegant%20composition&width=800&height=400&seq=coffee-tour-cafe-02&orientation=landscape",
  },
  {
    name: "Liman Kahvecisi",
    address: "Rıhtım Cd. No:3, Alanya Harbor East",
    lat: 36.5428,
    lng: 31.9968,
    description: "An old-school Turkish coffee house that has been serving fishermen and sailors for over 40 years. Sand-brewed coffee, mosaic tables, and walls covered in black-and-white photos of old Alanya.",
    highlight: "Order the 'dibek kahvesi' — stone-ground coffee brewed in hot sand, served with a glass of cold water and a sliver of rose lokum.",
    icon: "ri-ancient-gate-line",
    imageUrl: "https://readdy.ai/api/search-image?query=An%20atmospheric%20close%20up%20of%20traditional%20Turkish%20sand%20brewed%20coffee%20also%20known%20as%20dibek%20kahvesi%2C%20a%20small%20copper%20cezve%20nestled%20in%20hot%20dark%20sand%20with%20bubbles%20forming%20at%20the%20rim%2C%20served%20in%20an%20ornate%20fincan%20on%20a%20mosaic%20patterned%20table%2C%20a%20sliver%20of%20rose%20flavored%20Turkish%20delight%20on%20the%20side%2C%20black%20and%20white%20vintage%20photographs%20of%20old%20Alanya%20visible%20on%20the%20wall%20behind%2C%20warm%20amber%20and%20copper%20tones%2C%20nostalgic%20and%20intimate%20mood%2C%20editorial%20travel%20photography%2C%20rich%20textures&width=800&height=400&seq=coffee-tour-cafe-03&orientation=landscape",
  },
  {
    name: "Keyf-i Kahve",
    address: "Damlataş Cd. No:42, Damlataş",
    lat: 36.5415,
    lng: 32.0015,
    description: "Nestled at the foot of the Damlataş Cave, this garden cafe is shaded by citrus trees. The air smells of orange blossom and freshly ground beans — it's effortlessly romantic.",
    highlight: "Their cold brew orange tonic is a summer revelation — citrusy, effervescent, and dangerously refreshing after a walk up to the castle.",
    icon: "ri-plant-line",
    imageUrl: "https://readdy.ai/api/search-image?query=A%20refreshing%20tall%20glass%20of%20cold%20brew%20coffee%20mixed%20with%20orange%20tonic%20filled%20with%20ice%20cubes%20and%20garnished%20with%20a%20fresh%20orange%20slice%20and%20a%20sprig%20of%20mint%2C%20condensation%20on%20the%20glass%2C%20set%20on%20a%20rustic%20wooden%20table%20in%20a%20garden%20shaded%20by%20citrus%20trees%20with%20dappled%20sunlight%20filtering%20through%20the%20leaves%2C%20blurred%20green%20foliage%20background%2C%20bright%20summer%20vibe%2C%20vibrant%20orange%20and%20amber%20tones%2C%20editorial%20beverage%20photography%2C%20crisp%20and%20inviting%2C%20high%20detail&width=800&height=400&seq=coffee-tour-cafe-04&orientation=landscape",
  },
  {
    name: "Kahve Dünyası Alanya",
    address: "Keykubat Blv. No:156, Kleopatra",
    lat: 36.5475,
    lng: 31.9878,
    description: "A sleek, modern coffee bar a stone's throw from Kleopatra Beach. Floor-to-ceiling windows flood the space with light, and the terrace has unobstructed sea views.",
    highlight: "The flat white here rivals anything you'd find in Melbourne — velvety microfoam and a rich double ristretto base. Grab a seat on the terrace.",
    icon: "ri-water-flash-line",
    imageUrl: "https://readdy.ai/api/search-image?query=A%20perfectly%20crafted%20flat%20white%20coffee%20in%20a%20sleek%20white%20ceramic%20cup%20with%20intricate%20latte%20art%20on%20top%20of%20velvety%20microfoam%2C%20placed%20on%20a%20marble%20table%20by%20a%20floor%20to%20ceiling%20window%20with%20an%20unobstructed%20view%20of%20the%20turquoise%20Mediterranean%20Sea%20and%20Kleopatra%20Beach%2C%20modern%20minimalist%20cafe%20interior%20with%20warm%20wood%20accents%2C%20bright%20natural%20daylight%20flooding%20the%20space%2C%20clean%20and%20airy%20composition%2C%20editorial%20coffee%20photography%2C%20serene%20blue%20and%20white%20tones%2C%20high%20end%20aesthetic&width=800&height=400&seq=coffee-tour-cafe-05&orientation=landscape",
  },
  {
    name: "Nazar Bahçe & Coffee",
    address: "Oba Mah. Çevre Yolu No:22, Oba",
    lat: 36.5512,
    lng: 32.0105,
    description: "A hidden garden oasis in the Oba district. String lights crisscross above olive trees, vintage kilims cover the benches, and the Turkish coffee is brewed the way grandmothers do it — slow and with intention.",
    highlight: "Come for the coffee, stay for the homemade 'cevizli sucuk' — walnut-stuffed grape molasses rolls sliced thin and served alongside your brew.",
    icon: "ri-tree-line",
    imageUrl: "https://readdy.ai/api/search-image?query=A%20traditional%20Turkish%20coffee%20served%20in%20an%20ornate%20hand%20painted%20fincan%20on%20a%20small%20copper%20tray%2C%20accompanied%20by%20thinly%20sliced%20homemade%20cevizli%20sucuk%20which%20are%20walnut%20stuffed%20grape%20molasses%20rolls%20arranged%20beautifully%20on%20a%20rustic%20wooden%20cutting%20board%2C%20set%20in%20a%20magical%20garden%20oasis%20under%20olive%20trees%20with%20string%20lights%20softly%20glowing%20overhead%2C%20vintage%20Turkish%20kilim%20textiles%20on%20wooden%20benches%2C%20warm%20golden%20hour%20light%2C%20bohemian%20and%20romantic%20atmosphere%2C%20rich%20earthy%20tones%2C%20editorial%20food%20and%20travel%20photography%2C%20enchanting%20detail&width=800&height=400&seq=coffee-tour-cafe-06&orientation=landscape",
  },
  {
    name: "Roastery Alanya",
    address: "Barbaros Cd. No:67, Mahmutlar",
    lat: 36.5355,
    lng: 32.0188,
    description: "The final stop — a working micro-roastery where green beans from Brazil, Ethiopia, and Colombia are roasted on-site in a vintage Probat drum. The smell alone is worth the trip.",
    highlight: "Book a 15-minute cupping session (included with the gift card) and taste three single-origin roasts side by side — the perfect grand finale.",
    icon: "ri-fire-line",
    imageUrl: "https://readdy.ai/api/search-image?query=A%20professional%20coffee%20cupping%20session%20featuring%20three%20small%20white%20ceramic%20bowls%20each%20filled%20with%20different%20single%20origin%20roasted%20coffees%20from%20Brazil%20Ethiopia%20and%20Colombia%2C%20cupping%20spoons%20resting%20beside%20each%20bowl%2C%20a%20vintage%20copper%20Probat%20drum%20coffee%20roaster%20visible%20in%20the%20warm%20softly%20lit%20background%20of%20a%20working%20micro%20roastery%2C%20burlap%20sacks%20of%20green%20coffee%20beans%20stacked%20nearby%2C%20steam%20rising%20gently%2C%20industrial%20yet%20cozy%20atmosphere%2C%20rich%20browns%20and%20warm%20metallics%2C%20editorial%20specialty%20coffee%20photography%2C%20artisanal%20craftsmanship%20vibe%2C%20high%20detail%20and%20texture&width=800&height=400&seq=coffee-tour-cafe-07&orientation=landscape",
  },
];

const COFFEE_TOUR_PRODUCT_ID = 100013;

const COUNTRY_CODES = [
  { code: "+90", flag: "🇹🇷", country: "Turkey" },
  { code: "+44", flag: "🇬🇧", country: "UK" },
  { code: "+1", flag: "🇺🇸", country: "US / Canada" },
  { code: "+49", flag: "🇩🇪", country: "Germany" },
  { code: "+33", flag: "🇫🇷", country: "France" },
  { code: "+7", flag: "🇷🇺", country: "Russia" },
  { code: "+31", flag: "🇳🇱", country: "Netherlands" },
  { code: "+46", flag: "🇸🇪", country: "Sweden" },
  { code: "+47", flag: "🇳🇴", country: "Norway" },
  { code: "+45", flag: "🇩🇰", country: "Denmark" },
  { code: "+358", flag: "🇫🇮", country: "Finland" },
  { code: "+380", flag: "🇺🇦", country: "Ukraine" },
  { code: "+966", flag: "🇸🇦", country: "Saudi Arabia" },
  { code: "+971", flag: "🇦🇪", country: "UAE" },
  { code: "+974", flag: "🇶🇦", country: "Qatar" },
  { code: "+39", flag: "🇮🇹", country: "Italy" },
  { code: "+34", flag: "🇪🇸", country: "Spain" },
  { code: "+30", flag: "🇬🇷", country: "Greece" },
  { code: "+48", flag: "🇵🇱", country: "Poland" },
  { code: "+40", flag: "🇷🇴", country: "Romania" },
];

// ===== Walking Distance Helper =====
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c * 1000; // meters
}

function getWalkingEstimate(lat1: number, lng1: number, lat2: number, lng2: number): string {
  const distanceM = haversineDistance(lat1, lng1, lat2, lng2);
  const walkSpeedMperMin = 83; // ~5 km/h
  const minutes = Math.round(distanceM / walkSpeedMperMin);
  if (minutes < 1) return "<1 min walk";
  return `~${minutes} min walk`;
}

function getTotalWalkTime(cafes: CafeStop[]): { totalMinutes: number; label: string } {
  let totalM = 0;
  for (let i = 0; i < cafes.length - 1; i++) {
    totalM += Math.round(haversineDistance(cafes[i].lat, cafes[i].lng, cafes[i + 1].lat, cafes[i + 1].lng) / 83);
  }
  if (totalM < 60) return { totalMinutes: totalM, label: `~${totalM} min` };
  const hrs = Math.floor(totalM / 60);
  const mins = totalM % 60;
  if (mins === 0) return { totalMinutes: totalM, label: `~${hrs}h` };
  return { totalMinutes: totalM, label: `~${hrs}h ${mins}m` };
}

// ===== Tour Photo Carousel =====
function TourPhotoCarousel({ cafes }: { cafes: CafeStop[] }) {
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
    el.scrollBy({ left: dir === "left" ? -(cardWidth + gap) : cardWidth + gap, behavior: "smooth" });
  };

  return (
    <div className="relative mb-10">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-accent-100">
          <i className="ri-gallery-line text-accent-600 text-sm"></i>
        </div>
        <h3 className="font-heading text-lg text-foreground-900">Coffee &amp; Dessert Pairings</h3>
        <span className="text-xs text-foreground-400 bg-background-200/70 px-2.5 py-0.5 rounded-full">7 photos</span>
      </div>

      <div className="relative group">
        {/* Left Arrow */}
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm border border-background-200 shadow-sm text-foreground-700 hover:bg-white hover:text-foreground-900 transition-all cursor-pointer opacity-0 group-hover:opacity-100"
            aria-label="Previous images"
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
                  <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap ${tierColorClass}`}>
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
            aria-label="Next images"
          >
            <i className="ri-arrow-right-s-line text-lg"></i>
          </button>
        )}
      </div>
    </div>
  );
}

// ===== Tour Add to Cart Bar =====
function TourAddToCartBar({
  productName,
  currentPrice,
  formatPrice,
  currentStock,
  quantity,
  setQuantity,
  onAddToCart,
}: {
  productName: string;
  currentPrice: number;
  formatPrice: (p: number) => string;
  currentStock: number;
  quantity: number;
  setQuantity: (q: number | ((prev: number) => number)) => void;
  onAddToCart: () => void;
}) {
  return (
    <div className="mt-8 p-5 md:p-6 rounded-2xl bg-white border-2 border-accent-300/60 shadow-sm">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-foreground-400 uppercase tracking-wider mb-1">Ready to explore?</p>
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
              onClick={() => setQuantity((q: number) => Math.min(currentStock > 0 ? currentStock : 99, q + 1))}
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

export default function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite, favorites } = useFavorites();

  const favoritedCafes = COFFEE_TOUR_CAFES.filter((cafe) => favorites.has(`coffee-tour-${cafe.name}`));
  const totalWalkTime = getTotalWalkTime(COFFEE_TOUR_CAFES);

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [skus, setSkus] = useState<ProductSku[]>([]);
  const [selectedSkuId, setSelectedSkuId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const toastTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Checkout form state
  const [showCheckout, setShowCheckout] = useState(false);
  const [countryCode, setCountryCode] = useState("+90");
  const [preferredContact, setPreferredContact] = useState("whatsapp");
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Send to Phone modal state
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendPhone, setSendPhone] = useState("");
  const [sendCountryCode, setSendCountryCode] = useState("+90");
  const [sendMethod, setSendMethod] = useState<"whatsapp" | "sms">("whatsapp");

  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchProduct() {
      try {
        setLoading(true);
        setError(null);

        const { product: fetchedProduct, variants: fetchedVariants, skus: fetchedSkus } =
          await productsService.getProductDetails(productId || "");

        if (!fetchedProduct) {
          if (!cancelled) setError("Product not found.");
          return;
        }

        if (!cancelled) {
          setProduct(fetchedProduct as unknown as ProductDetail);
          setVariants(fetchedVariants as unknown as ProductVariant[]);
          setSkus(fetchedSkus as unknown as ProductSku[]);

          // Auto-select first SKU if variants exist
          if (fetchedSkus.length > 0) {
            setSelectedSkuId(fetchedSkus[0].id);
          }
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load product");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (productId) fetchProduct();
    return () => { cancelled = true; };
  }, [productId]);

  const selectedSku = skus.find((s) => s.id === selectedSkuId) || null;
  const hasVariants = variants.length > 0 && skus.length > 0;

  // Current stock: from SKU if variants exist, otherwise from product
  const currentStock = hasVariants && selectedSku ? selectedSku.stock : (product?.stock ?? 0);

  // Current price: from SKU if variants exist, otherwise from product
  const currentPrice = hasVariants && selectedSku ? selectedSku.price : (product?.price ?? 0);

  const formatPrice = useCallback((price: number) => {
    if (!product) return "";
    const symbol = product.currency === "EUR" ? "€" : product.currency === "USD" ? "$" : product.currency;
    return `${symbol}${price.toFixed(2)}`;
  }, [product]);

  const getCategoryIcon = useCallback(() => {
    const catName = product?.product_categories?.name || "";
    if (catName === "Turkish Home & Decor") return "ri-home-smile-line";
    if (catName === "Turkish Textiles") return "ri-t-shirt-line";
    if (catName === "Food & Treats") return "ri-cake-line";
    if (catName === "AlanyaHolidays Merch") return "ri-vip-crown-line";
    if (catName === "Books & Learning") return "ri-book-open-line";
    if (catName === "Travel Essentials") return "ri-suitcase-line";
    if (catName === "Gift Cards") return "ri-gift-line";
    return "ri-store-2-line";
  }, [product?.product_categories?.name]);

  const mediaImages = product?.media?.filter((m) => m.type === "image" && m.url) || [];

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = toastTimersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      toastTimersRef.current.delete(id);
    }
  }, []);

  const showToast = useCallback(
    (title: string, msg: string, type: "success" | "error" = "success") => {
      const toast = createToast(title, msg, type);
      setToasts((prev) => [...prev, toast]);
      const timer = setTimeout(() => dismissToast(toast.id), 4500);
      toastTimersRef.current.set(toast.id, timer);
    },
    [dismissToast],
  );

  // Reset quantity when SKU or product changes
  useEffect(() => {
    setQuantity(1);
  }, [selectedSkuId, productId]);

  const handleAddToCart = useCallback(() => {
    if (!product) return;
    const price = hasVariants && selectedSku ? selectedSku.price : product.price;
    const label = hasVariants && selectedSku ? selectedSku.label : undefined;
    const displayVariant = label ? ` - ${label}` : "";
    addToCart({
      name: product.name,
      price: formatPrice(price),
      icon: getCategoryIcon(),
      variantLabel: label,
    });
    showToast(
      "Added to cart",
      quantity > 1
        ? `${quantity}x ${product.name}${displayVariant}`
        : `${product.name}${displayVariant}`,
    );
    setQuantity(1);
  }, [product, hasVariants, selectedSku, addToCart, formatPrice, getCategoryIcon, showToast, quantity]);

  // Print-to-PDF: open a print-optimized tour map in a new window
  const handlePrintMap = useCallback(() => {
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) {
      showToast("Popup blocked", "Please allow popups for this site to download the tour map.", "error");
      return;
    }

    const stopsHtml = COFFEE_TOUR_CAFES.map(
      (cafe, i) => {
        const tier = i <= 2 ? "3-Stop Tour" : i <= 4 ? "5-Stop Tour" : "Full Day Tour";
        const tierClass = i <= 2 ? "tier-accent" : i <= 4 ? "tier-secondary" : "tier-primary";
        return `
        <div class="stop-card">
          <div class="stop-num">${i + 1}</div>
          <div class="stop-body">
            <div class="stop-header">
              <h3>${cafe.name}</h3>
              <span class="tier-badge ${tierClass}">${tier}</span>
            </div>
            <p class="address">${cafe.address}</p>
            <p class="desc">${cafe.description}</p>
            <div class="highlight"><strong>Must try:</strong> ${cafe.highlight}</div>
          </div>
        </div>`;
      },
    ).join("");

    const html = '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <title>Alanya Coffee Tour — Route Map</title>\n  <style>\n    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }\n    body { font-family: Georgia, "Times New Roman", serif; color: #1a1a1a; line-height: 1.6; max-width: 720px; margin: 0 auto; padding: 36px 28px; }\n    .cover { text-align: center; padding: 48px 0 36px; border-bottom: 2px solid #d4a574; margin-bottom: 40px; }\n    .cover h1 { font-size: 28px; font-weight: 700; letter-spacing: -0.5px; margin-bottom: 10px; color: #5c3d2e; }\n    .cover .subtitle { font-size: 14px; color: #8b7355; }\n    .cover .meta { margin-top: 18px; font-size: 11px; color: #aaa; }\n    .route-summary { background: #faf7f2; border-radius: 10px; padding: 22px 26px; margin-bottom: 40px; }\n    .route-summary h2 { font-size: 16px; color: #5c3d2e; margin-bottom: 10px; }\n    .route-summary p { font-size: 13px; color: #6b5b4f; line-height: 1.7; }\n    .stops-heading { font-size: 18px; color: #5c3d2e; margin-bottom: 24px; padding-bottom: 10px; border-bottom: 1px solid #e8ddd0; }\n    .stop-card { display: flex; gap: 16px; margin-bottom: 28px; padding-bottom: 28px; border-bottom: 1px dashed #e8ddd0; page-break-inside: avoid; }\n    .stop-card:last-child { border-bottom: none; }\n    .stop-num { flex-shrink: 0; width: 38px; height: 38px; border-radius: 50%; background: #5c3d2e; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 700; }\n    .stop-body { flex: 1; min-width: 0; }\n    .stop-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 6px; flex-wrap: wrap; gap: 8px; }\n    .stop-header h3 { font-size: 15px; font-weight: 700; color: #3d2b1f; }\n    .tier-badge { display: inline-block; padding: 2px 10px; border-radius: 20px; font-size: 10px; font-weight: 600; letter-spacing: 0.5px; white-space: nowrap; }\n    .tier-accent { background: #fdf2e9; color: #b87333; border: 1px solid #f0c9a0; }\n    .tier-secondary { background: #f0f4e8; color: #6b8e4e; border: 1px solid #c5d5a8; }\n    .tier-primary { background: #f0eef4; color: #6b5b8e; border: 1px solid #c5b8d5; }\n    .address { font-size: 12px; color: #8b7355; margin-bottom: 8px; }\n    .desc { font-size: 13px; color: #5c4f43; margin-bottom: 10px; }\n    .highlight { font-size: 13px; color: #b87333; background: #fdf8f3; padding: 10px 14px; border-radius: 8px; border-left: 3px solid #d4a574; }\n    .footer-note { margin-top: 44px; padding-top: 24px; border-top: 2px solid #d4a574; }\n    .footer-note h2 { font-size: 15px; color: #5c3d2e; margin-bottom: 8px; }\n    .footer-note p { font-size: 12px; color: #6b5b4f; line-height: 1.7; margin-bottom: 4px; }\n    .footer-note .validity { margin-top: 10px; font-style: italic; color: #aaa; }\n    @media print { body { padding: 0; } .stop-card { page-break-inside: avoid; } }\n  </style>\n</head>\n<body>\n  <div class="cover">\n    <h1>Alanya Coffee Tour &mdash; Route Map</h1>\n    <p class="subtitle">7 hand-picked cafes from the harbor to Mahmutlar</p>\n    <p class="meta">Generated from Alanya Holidays &bull; ' + new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) + '</p>\n  </div>\n\n  <div class="route-summary">\n    <h2>Your Tour at a Glance</h2>\n    <p>Seven hand-picked cafes &mdash; each stop unlocks a complimentary coffee and dessert with your Coffee Tour Gift Card. The route winds from the harbor through the old town, along Kleopatra Beach, and up to Mahmutlar. Pace yourself &mdash; the card is valid for 12 months.</p>\n  </div>\n\n  <h2 class="stops-heading">Tour Stops</h2>\n' + stopsHtml + '\n\n  <div class="footer-note">\n    <h2>How the Tour Works</h2>\n    <p>Each stop on the map is a participating cafe. Show your Coffee Tour Gift Card (digital or printed) at the counter and they&rsquo;ll mark your stop &mdash; one complimentary coffee and one dessert per location. No reservations needed, just walk in and enjoy.</p>\n    <p>The card is valid for 12 months, so you can spread the stops across multiple days or tackle them all in one glorious caffeine-fueled marathon.</p>\n    <p class="validity">Gift Card valid for 12 months from date of purchase &bull; alanyaholidays.com</p>\n  </div>\n</body>\n</html>';

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.addEventListener("afterprint", () => printWindow.close(), { once: true });
    }, 500);
  }, [showToast]);

  // Send Tour Map to Phone: generate route text and open WhatsApp/SMS
  const handleSendToPhone = useCallback(() => {
    const rawPhone = sendPhone.replace(/[\s\-().]/g, "");
    if (!rawPhone || rawPhone.length < 5) {
      showToast("Invalid phone number", "Please enter a valid phone number.", "error");
      return;
    }

    const fullNumber = sendCountryCode + rawPhone;

    // Build the tour route text
    const lines = [
      "☕ *Alanya Coffee Tour — Route Map*",
      "_7 hand-picked cafes from the harbor to Mahmutlar_",
      "",
    ];

    COFFEE_TOUR_CAFES.forEach((cafe, i) => {
      const tier = i <= 2 ? "[3-Stop]" : i <= 4 ? "[5-Stop]" : "[Full Day]";
      lines.push(`*Stop ${i + 1}: ${cafe.name}* ${tier}`);
      lines.push(`📍 ${cafe.address}`);
      lines.push(`   ${cafe.description}`);
      lines.push(`   ⭐ ${cafe.highlight}`);
      if (i < COFFEE_TOUR_CAFES.length - 1) {
        lines.push(
          `   🚶 Walk to: ${COFFEE_TOUR_CAFES[i + 1].name}`,
        );
      }
      lines.push("");
    });

    lines.push("---");
    lines.push("🎫 Show your Coffee Tour Gift Card at each stop.");
    lines.push("☕ 1 complimentary coffee + 1 dessert per cafe.");
    lines.push("📅 Valid for 12 months — pace yourself!");
    lines.push("🌐 alanyaholidays.com");

    const message = lines.join("\n");

    if (sendMethod === "whatsapp") {
      const waUrl = `https://wa.me/${fullNumber}?text=${encodeURIComponent(message)}`;
      window.open(waUrl, "_blank", "noopener,noreferrer");
    } else {
      const smsUrl = `sms:${fullNumber}?body=${encodeURIComponent(message)}`;
      window.open(smsUrl, "_self");
    }

    setShowSendModal(false);
    setSendPhone("");
    showToast(
      "Tour map sent!",
      sendMethod === "whatsapp"
        ? "WhatsApp is opening with your route — just hit send."
        : "Your messaging app is opening with the full route.",
      "success",
    );
  }, [sendPhone, sendCountryCode, sendMethod, showToast]);

  // Share Tour: use Web Share API if available, fallback to clipboard + Twitter intent
  const handleShareTour = useCallback(async () => {
    const shareUrl = window.location.href;
    const shareTitle = "Alanya Coffee Tour — 7 Hand-Picked Cafes";
    const shareText =
      "I found this amazing Coffee Tour Gift Card for Alanya! ☕ 7 hand-picked cafes from the harbor to Mahmutlar, each stop unlocks a complimentary coffee & dessert. Valid for 12 months — pace yourself!";

    // Try Web Share API first (mobile)
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
        showToast("Shared!", "Thanks for spreading the word about the Coffee Tour.", "success");
        return;
      } catch {
        // user cancelled or API failed — fall through to fallback
      }
    }

    // Desktop fallback: show options
    const twitterUrl =
      "https://twitter.com/intent/tweet?text=" +
      encodeURIComponent(shareText + " " + shareUrl);

    try {
      await navigator.clipboard.writeText(shareText + " " + shareUrl);
      showToast(
        "Link copied!",
        "Tour link copied to clipboard. Opening X/Twitter to share — or paste it anywhere you like.",
        "success",
      );
      setTimeout(() => window.open(twitterUrl, "_blank", "noopener,noreferrer"), 600);
    } catch {
      window.open(twitterUrl, "_blank", "noopener,noreferrer");
    }
  }, [showToast]);

  const handleCheckoutSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!product) return;

      const form = e.currentTarget;
      const formData = new FormData(form);

      // Honeypot check
      const honeypot = formData.get("website_alt") as string;
      if (honeypot && honeypot.trim() !== "") {
        setCheckoutSuccess(true);
        setCheckoutError(null);
        return;
      }

      const fullName = (formData.get("name") as string || "").trim();
      const email = (formData.get("email") as string || "").trim();
      const phoneRaw = (formData.get("phone") as string || "").trim();
      const notes = (formData.get("notes") as string || "").trim();
      const phone = `${countryCode}.${phoneRaw}`;

      if (!fullName) {
        setCheckoutError("Please enter your full name.");
        return;
      }
      if (!email) {
        setCheckoutError("Please enter your email address.");
        return;
      }

      setCheckoutSubmitting(true);
      setCheckoutError(null);

      try {
        const finalPrice = currentPrice;
        const subtotal = finalPrice * quantity;

        await productsService.createProductOrder({
          currency: product.currency,
          subtotal,
          customerNotes: notes || null,
          recipient: {
            name: fullName,
            email,
            phone,
            contact_method: preferredContact as "whatsapp" | "phone_call" | "email",
          },
          items: [
            {
              productId: product.id,
              productName: selectedSku ? `${product.name} - ${selectedSku.label}` : product.name,
              skuId: selectedSku ? String(selectedSku.id) : null,
              skuLabel: selectedSku ? selectedSku.label : null,
              quantity,
              unitPrice: product.price,
              finalPrice,
              subtotal,
            },
          ],
        });

        setCheckoutSuccess(true);
        setCheckoutError(null);
        showToast(
          "Order placed!",
          preferredContact === "whatsapp"
            ? "We'll WhatsApp you shortly to confirm."
            : preferredContact === "phone"
              ? "We'll call you shortly to confirm."
              : "We'll email you shortly to confirm.",
          "success",
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
        setCheckoutError(msg);
        showToast("Order failed", msg, "error");
      } finally {
        setCheckoutSubmitting(false);
      }
    },
    [product, quantity, countryCode, preferredContact, currentPrice, selectedSku, showToast],
  );

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-background-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-background-200 border-t-accent-500 rounded-full animate-spin"></div>
            <p className="text-foreground-500 text-sm">Loading product...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !product) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-background-50 flex items-center justify-center">
          <div className="text-center py-20 px-4">
            <div className="w-14 h-14 flex items-center justify-center rounded-full bg-red-100 mx-auto mb-4">
              <i className="ri-error-warning-line text-red-500 text-2xl"></i>
            </div>
            <p className="text-foreground-700 text-sm mb-4">{error || "Product not found."}</p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-background-200 text-foreground-700 rounded-full text-sm font-medium hover:bg-background-300 transition-colors whitespace-nowrap cursor-pointer"
              >
                <i className="ri-arrow-left-line"></i>
                Go Back
              </button>
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 text-background-50 rounded-full text-sm font-medium hover:bg-primary-600 transition-colors whitespace-nowrap cursor-pointer"
              >
                <i className="ri-store-2-line"></i>
                Back to Shop
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main>
        {/* Breadcrumb */}
        <section className="w-full px-4 md:px-8 lg:px-12 pt-24 md:pt-28 pb-6 bg-background-50">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-2 text-sm">
              <Link to="/" className="text-foreground-400 hover:text-foreground-600 transition-colors underline underline-offset-2">
                Home
              </Link>
              <i className="ri-arrow-right-s-line text-foreground-300 text-xs"></i>
              <Link to="/shop" className="text-foreground-400 hover:text-foreground-600 transition-colors underline underline-offset-2">
                Shop
              </Link>
              <i className="ri-arrow-right-s-line text-foreground-300 text-xs"></i>
              <span className="text-foreground-700 truncate max-w-[200px]">{product.name}</span>
            </div>
          </div>
        </section>

        {/* Product Detail */}
        <section className="w-full px-4 md:px-8 lg:px-12 pb-16 md:pb-24 bg-background-50">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-8 md:gap-12">
              {/* Image Gallery */}
              <div className="w-full lg:w-1/2">
                <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-background-100 border border-background-200/70 mb-4">
                  {mediaImages.length > 0 ? (
                    <img
                      src={mediaImages[activeImageIndex]?.url}
                      alt={product.name}
                      className="w-full h-full object-cover object-top"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <i className={`${getCategoryIcon()} text-foreground-300 text-6xl`}></i>
                    </div>
                  )}
                </div>

                {mediaImages.length > 1 && (
                  <div className="flex gap-3 overflow-x-auto pb-1">
                    {mediaImages.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImageIndex(idx)}
                        className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                          idx === activeImageIndex
                            ? "border-primary-500 ring-2 ring-primary-200"
                            : "border-background-200 hover:border-foreground-300"
                        }`}
                      >
                        <img
                          src={img.url}
                          alt={`${product.name} view ${idx + 1}`}
                          className="w-full h-full object-cover object-top"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="w-full lg:w-1/2 flex flex-col">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full bg-accent-100 text-accent-700 text-xs font-medium whitespace-nowrap">
                    {product.product_categories?.name || "General"}
                  </span>
                  {currentStock > 0 ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium whitespace-nowrap">
                      In Stock
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium whitespace-nowrap">
                      Out of Stock
                    </span>
                  )}
                  {hasVariants && (
                    <span className="px-2.5 py-0.5 rounded-full bg-secondary-100 text-secondary-700 text-xs font-medium whitespace-nowrap">
                      {variants.length} {variants.length === 1 ? "option" : "options"}
                    </span>
                  )}
                </div>

                <h1 className="font-heading text-2xl md:text-3xl text-foreground-900 mb-4 leading-tight">
                  {product.name}
                </h1>

                <div className="text-3xl font-bold text-primary-600 mb-6">
                  {formatPrice(currentPrice)}
                </div>

                {/* Variant Pickers */}
                {hasVariants && (
                  <div className="mb-8 space-y-4">
                    {variants.map((variant) => (
                      <div key={variant.id}>
                        <label className="block text-sm font-medium text-foreground-700 mb-2">
                          {variant.name}
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {variant.options.map((option) => {
                            // Find the SKU matching this option
                            const matchingSku = skus.find(
                              (s) => s.options && s.options.includes(option),
                            );
                            const isSelected = matchingSku && matchingSku.id === selectedSkuId;
                            const isOutOfStock = matchingSku && matchingSku.stock <= 0;

                            return (
                              <button
                                key={option}
                                onClick={() => {
                                  if (matchingSku && matchingSku.stock > 0) {
                                    setSelectedSkuId(matchingSku.id);
                                  }
                                }}
                                disabled={isOutOfStock}
                                title={isOutOfStock ? "Out of stock" : matchingSku ? `${matchingSku.stock} in stock` : ""}
                                className={`px-4 py-2.5 rounded-full border text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                                  isSelected
                                    ? "bg-primary-500 text-background-50 border-primary-500"
                                    : isOutOfStock
                                      ? "bg-background-100 text-foreground-300 border-background-200 line-through cursor-not-allowed"
                                      : "bg-white text-foreground-700 border-background-200 hover:border-foreground-300 hover:text-foreground-900"
                                }`}
                              >
                                {option}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                    {selectedSku && (
                      <p className="text-xs text-foreground-400 flex items-center gap-1">
                        <i className="ri-information-line"></i>
                        Selected: <strong className="text-foreground-600">{selectedSku.label}</strong>
                        {selectedSku.stock <= 5 && selectedSku.stock > 0 && (
                          <span className="text-amber-600 ml-1">
                            — Only {selectedSku.stock} left
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                )}

                <div className="prose prose-sm max-w-none text-foreground-600 leading-relaxed mb-8">
                  {product.description.split("\n").map((para, i) => (
                    <p key={i} className="mb-3 last:mb-0">{para}</p>
                  ))}
                </div>

                {/* Quantity & Add to Cart */}
                <div className="pt-6 border-t border-background-200/70">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                    <div className="flex items-center gap-0 border border-background-300 rounded-full overflow-hidden bg-white self-start">
                      <button
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        disabled={quantity <= 1}
                        className="w-10 h-10 flex items-center justify-center text-foreground-600 hover:bg-background-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <i className="ri-subtract-line"></i>
                      </button>
                      <span className="w-12 text-center text-sm font-semibold text-foreground-900 select-none">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity((q) => Math.min(currentStock > 0 ? currentStock : 99, q + 1))}
                        disabled={currentStock > 0 && quantity >= currentStock}
                        className="w-10 h-10 flex items-center justify-center text-foreground-600 hover:bg-background-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <i className="ri-add-line"></i>
                      </button>
                    </div>

                    <button
                      onClick={handleAddToCart}
                      disabled={currentStock <= 0}
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-500 text-background-50 rounded-full text-sm font-semibold hover:bg-primary-600 transition-colors whitespace-nowrap cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <i className="ri-shopping-cart-line"></i>
                      {currentStock <= 0 ? "Out of Stock" : "Add to Cart"}
                    </button>

                    <button
                      onClick={() => setShowCheckout(!showCheckout)}
                      disabled={currentStock <= 0}
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-accent-500 text-background-50 dark:text-foreground-950 rounded-full text-sm font-semibold hover:bg-accent-600 transition-colors whitespace-nowrap cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <i className="ri-flashlight-line"></i>
                      {showCheckout ? "Hide Checkout" : "Buy Now"}
                    </button>
                  </div>

                  {currentStock > 0 && currentStock <= 10 && (
                    <p className="text-xs text-amber-600 mt-3 flex items-center gap-1">
                      <i className="ri-alert-line"></i>
                      Only {currentStock} left in stock
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Checkout Form */}
        {showCheckout && (
          <section className="w-full px-4 md:px-8 lg:px-12 pb-16 md:pb-24 bg-background-100">
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-2xl border border-background-200/70 p-6 md:p-8">
                {checkoutSuccess ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 flex items-center justify-center rounded-full bg-green-100 mx-auto mb-5">
                      <i className="ri-check-line text-green-600 text-2xl"></i>
                    </div>
                    <h3 className="font-heading text-xl text-foreground-900 mb-2">Order confirmed!</h3>
                    <p className="text-foreground-500 text-sm mb-2">
                      Thank you for your order — <strong>{product.name}{selectedSku ? ` (${selectedSku.label})` : ""}</strong> (x{quantity}) for <strong>{formatPrice(currentPrice * quantity)}</strong>.
                    </p>
                    <p className="text-foreground-600 text-sm font-medium">
                      {preferredContact === "whatsapp"
                        ? "We'll WhatsApp you shortly with confirmation and delivery details."
                        : preferredContact === "phone"
                          ? "We'll give you a call shortly with confirmation and delivery details."
                          : "We'll email you shortly with confirmation and delivery details."}
                    </p>
                    <div className="flex items-center justify-center gap-3 mt-6 flex-wrap">
                      <button
                        onClick={() => {
                          setCheckoutSuccess(false);
                          setShowCheckout(false);
                        }}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-background-200 text-foreground-700 rounded-full text-sm font-medium hover:bg-background-300 transition-colors whitespace-nowrap cursor-pointer"
                      >
                        <i className="ri-arrow-left-line"></i>
                        Back to Product
                      </button>
                      <Link
                        to="/shop"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 text-background-50 rounded-full text-sm font-medium hover:bg-primary-600 transition-colors whitespace-nowrap cursor-pointer"
                      >
                        <i className="ri-store-2-line"></i>
                        Continue Shopping
                      </Link>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-accent-100">
                        <i className="ri-shopping-bag-3-line text-accent-600 text-lg"></i>
                      </div>
                      <div>
                        <h3 className="font-heading text-lg text-foreground-900">Checkout</h3>
                        <p className="text-xs text-foreground-500">
                          {product.name}{selectedSku ? ` (${selectedSku.label})` : ""} — {quantity}x {formatPrice(currentPrice)} = {formatPrice(currentPrice * quantity)}
                        </p>
                      </div>
                    </div>

                    {checkoutError && (
                      <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 mb-5">
                        <i className="ri-error-warning-line text-red-500 text-sm mt-0.5 shrink-0"></i>
                        <p className="text-sm text-red-700">{checkoutError}</p>
                      </div>
                    )}

                    <form ref={formRef} onSubmit={handleCheckoutSubmit} className="space-y-5">
                      {/* Honeypot */}
                      <input
                        type="text"
                        name="website_alt"
                        tabIndex={-1}
                        autoComplete="off"
                        aria-hidden="true"
                        readOnly
                        className="absolute opacity-0 pointer-events-none"
                      />

                      {/* Full Name */}
                      <div>
                        <label htmlFor="checkout-name" className="block text-sm font-medium text-foreground-700 mb-1.5">
                          Full Name *
                        </label>
                        <input
                          id="checkout-name"
                          name="name"
                          type="text"
                          required
                          placeholder="Your full name"
                          className="w-full px-4 py-2.5 rounded-xl border border-background-300 bg-white text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-colors"
                        />
                      </div>

                      {/* Email */}
                      <div>
                        <label htmlFor="checkout-email" className="block text-sm font-medium text-foreground-700 mb-1.5">
                          Email *
                        </label>
                        <input
                          id="checkout-email"
                          name="email"
                          type="email"
                          required
                          placeholder="you@example.com"
                          className="w-full px-4 py-2.5 rounded-xl border border-background-300 bg-white text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-colors"
                        />
                      </div>

                      {/* Phone with Country Code */}
                      <div>
                        <label htmlFor="checkout-phone" className="block text-sm font-medium text-foreground-700 mb-1.5">
                          Phone
                        </label>
                        <div className="flex gap-2">
                          <div className="relative">
                            <select
                              value={countryCode}
                              onChange={(e) => setCountryCode(e.target.value)}
                              className="appearance-none pl-3 pr-8 py-2.5 rounded-xl border border-background-300 bg-white text-sm text-foreground-900 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-colors cursor-pointer"
                            >
                              {COUNTRY_CODES.map((cc) => (
                                <option key={cc.code} value={cc.code}>
                                  {cc.flag} {cc.code}
                                </option>
                              ))}
                            </select>
                            <i className="ri-arrow-down-s-line absolute right-2 top-1/2 -translate-y-1/2 text-foreground-400 text-xs pointer-events-none"></i>
                          </div>
                          <input
                            id="checkout-phone"
                            name="phone"
                            type="tel"
                            placeholder="Phone number"
                            className="flex-1 px-4 py-2.5 rounded-xl border border-background-300 bg-white text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-colors"
                          />
                        </div>
                      </div>

                      {/* Preferred Contact Method */}
                      <div>
                        <label className="block text-sm font-medium text-foreground-700 mb-2">
                          Preferred contact method
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { value: "whatsapp", icon: "ri-whatsapp-line", label: "WhatsApp" },
                            { value: "phone", icon: "ri-phone-line", label: "Phone Call" },
                            { value: "email", icon: "ri-mail-line", label: "Email" },
                          ].map((opt) => (
                            <label
                              key={opt.value}
                              className={`flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                                preferredContact === opt.value
                                  ? "bg-primary-500 text-background-50 border-primary-500"
                                  : "bg-white text-foreground-600 border-background-300 hover:border-foreground-300"
                              }`}
                            >
                              <input
                                type="radio"
                                name="contact_method"
                                value={opt.value}
                                checked={preferredContact === opt.value}
                                onChange={() => setPreferredContact(opt.value)}
                                className="sr-only"
                              />
                              <i className={`${opt.icon} text-sm`}></i>
                              {opt.label}
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Order Notes */}
                      <div>
                        <label htmlFor="checkout-notes" className="block text-sm font-medium text-foreground-700 mb-1.5">
                          Order Notes <span className="text-foreground-400 font-normal">(optional)</span>
                        </label>
                        <textarea
                          id="checkout-notes"
                          name="notes"
                          rows={3}
                          maxLength={500}
                          placeholder="Any special requests or delivery instructions..."
                          className="w-full px-4 py-2.5 rounded-xl border border-background-300 bg-white text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-colors resize-none"
                        ></textarea>
                        <p className="text-xs text-foreground-400 mt-1">Max 500 characters</p>
                      </div>

                      {/* Submit */}
                      <button
                        type="submit"
                        disabled={checkoutSubmitting || currentStock <= 0}
                        className="w-full py-3 bg-accent-500 text-background-50 dark:text-foreground-950 rounded-full text-sm font-semibold hover:bg-accent-600 transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {checkoutSubmitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-background-50/40 border-t-background-50 rounded-full animate-spin"></div>
                            Placing order...
                          </>
                        ) : (
                          <>
                            <i className="ri-check-double-line"></i>
                            Place Order — {formatPrice(currentPrice * quantity)}
                          </>
                        )}
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Coffee Tour Route Preview — only for Coffee Tour Gift Card */}
        {Number(productId) === COFFEE_TOUR_PRODUCT_ID && (
          <section className="w-full px-4 md:px-8 lg:px-12 py-16 md:py-24 bg-background-100">
            <div className="max-w-5xl mx-auto">
              {/* Section Header */}
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-foreground-200 bg-white mb-6">
                  <i className="ri-map-pin-line text-accent-500 text-sm"></i>
                  <span className="text-sm font-medium text-foreground-700">Tour Route Preview</span>
                </div>
                <h2 className="font-heading text-3xl md:text-4xl text-foreground-900 mb-4">
                  Your Coffee Journey Through Alanya
                </h2>
                <p className="text-foreground-500 text-sm md:text-base max-w-2xl mx-auto leading-relaxed mb-6">
                  Seven hand-picked cafes — each stop unlocks a complimentary coffee and dessert. The route winds from the harbor through the old town, along Kleopatra Beach, and up to Mahmutlar. Pace yourself.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 mb-6">
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-background-200/70 shadow-sm">
                    <span className="w-7 h-7 flex items-center justify-center rounded-full bg-accent-100">
                      <i className="ri-walk-line text-accent-600 text-sm"></i>
                    </span>
                    <span className="text-sm font-semibold text-foreground-900 whitespace-nowrap">{totalWalkTime.label}</span>
                    <span className="text-xs text-foreground-400 whitespace-nowrap">total walking</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-background-200/70 shadow-sm">
                    <span className="w-7 h-7 flex items-center justify-center rounded-full bg-accent-100">
                      <i className="ri-map-pin-2-line text-accent-600 text-sm"></i>
                    </span>
                    <span className="text-sm font-semibold text-foreground-900">7</span>
                    <span className="text-xs text-foreground-400 whitespace-nowrap">cafe stops</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-background-200/70 shadow-sm">
                    <span className="w-7 h-7 flex items-center justify-center rounded-full bg-accent-100">
                      <i className="ri-route-line text-accent-600 text-sm"></i>
                    </span>
                    <span className="text-sm font-semibold text-foreground-900">Harbor → Mahmutlar</span>
                    <span className="text-xs text-foreground-400 whitespace-nowrap">route</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => handlePrintMap()}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-foreground-300 rounded-full text-sm font-semibold text-foreground-700 hover:bg-foreground-50 hover:border-foreground-400 hover:text-foreground-900 transition-all hover:scale-[1.02] whitespace-nowrap cursor-pointer"
                  >
                    <i className="ri-file-pdf-2-line text-lg"></i>
                    Download Tour Map PDF
                  </button>
                  <button
                    onClick={() => setShowSendModal(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent-500 text-background-50 dark:text-foreground-950 border-2 border-accent-500 rounded-full text-sm font-semibold hover:bg-accent-600 hover:border-accent-600 transition-all hover:scale-[1.02] whitespace-nowrap cursor-pointer"
                  >
                    <i className="ri-smartphone-line text-lg"></i>
                    Send Tour Map to My Phone
                  </button>
                  <button
                    onClick={() => handleShareTour()}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-foreground-300 rounded-full text-sm font-semibold text-foreground-700 hover:bg-foreground-50 hover:border-foreground-400 hover:text-foreground-900 transition-all hover:scale-[1.02] whitespace-nowrap cursor-pointer"
                  >
                    <i className="ri-share-forward-line text-lg"></i>
                    Share This Tour
                  </button>
                </div>
              </div>

              {/* === My Favorite Cafes === */}
              {favoritedCafes.length > 0 && (
                <div className="mb-10">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-100">
                        <i className="ri-heart-fill text-red-500 text-sm"></i>
                      </div>
                      <h3 className="font-heading text-lg text-foreground-900">My Favorite Cafes</h3>
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
                            title="Remove from favorites"
                          >
                            <i className="ri-heart-fill text-sm"></i>
                          </button>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* === Pairing Photo Carousel === */}
              <TourPhotoCarousel cafes={COFFEE_TOUR_CAFES} />

              {/* === Add to Cart CTA (top) === */}
              <TourAddToCartBar
                productName={product.name}
                currentPrice={currentPrice}
                formatPrice={formatPrice}
                currentStock={currentStock}
                quantity={quantity}
                setQuantity={setQuantity}
                onAddToCart={handleAddToCart}
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
                    title="Coffee Tour Alanya — Cafe Locations"
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
                    <>
                      <div
                        id={`stop-${index}`}
                        key={cafe.name}
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
                              title={isFavorite(`coffee-tour-${cafe.name}`) ? "Remove from favorites" : "Save to favorites"}
                            >
                              <i
                                className={`text-sm ${isFavorite(`coffee-tour-${cafe.name}`) ? "ri-heart-fill" : "ri-heart-line"}`}
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
                                src={`https://maps.google.com/maps?q=${encodeURIComponent(cafe.name + " " + cafe.address)}&z=16&output=embed`}
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
                        const walkTime = getWalkingEstimate(cafe.lat, cafe.lng, COFFEE_TOUR_CAFES[index + 1].lat, COFFEE_TOUR_CAFES[index + 1].lng);
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
                    </>
                  );
                })}
              </div>

              {/* Bottom note */}
              <div className="mt-12 p-5 rounded-2xl bg-white border border-accent-200/60 flex items-start gap-4">
                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-accent-100 shrink-0">
                  <i className="ri-information-line text-accent-600 text-lg"></i>
                </div>
                <div>
                  <h4 className="font-heading text-sm text-foreground-900 mb-1">How the tour works</h4>
                  <p className="text-sm text-foreground-500 leading-relaxed">
                    Each stop on the map is a participating cafe. Show your Coffee Tour Gift Card (digital or printed) at the counter and they'll mark your stop — one complimentary coffee and one dessert per location. No reservations needed, just walk in and enjoy. The card is valid for 12 months, so you can spread the stops across multiple days or tackle them all in one glorious caffeine-fueled marathon.
                  </p>
                </div>
              </div>

              {/* === Add to Cart CTA (bottom) === */}
              <TourAddToCartBar
                productName={product.name}
                currentPrice={currentPrice}
                formatPrice={formatPrice}
                currentStock={currentStock}
                quantity={quantity}
                setQuantity={setQuantity}
                onAddToCart={handleAddToCart}
              />
            </div>
          </section>
        )}

        {/* Send to Phone Modal */}
        {showSendModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowSendModal(false)}
            ></div>

            {/* Modal Card */}
            <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-lg border border-background-200/70 p-6 md:p-8 animate-in">
              {/* Close button */}
              <button
                onClick={() => setShowSendModal(false)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-background-100 text-foreground-400 hover:bg-background-200 hover:text-foreground-600 transition-colors cursor-pointer"
              >
                <i className="ri-close-line"></i>
              </button>

              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-accent-100">
                  <i className="ri-smartphone-line text-accent-600 text-lg"></i>
                </div>
                <div>
                  <h3 className="font-heading text-lg text-foreground-900">Send to My Phone</h3>
                  <p className="text-xs text-foreground-500">
                    Get the full tour route delivered to your phone
                  </p>
                </div>
              </div>

              {/* Method Picker */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-foreground-700 mb-2">
                  Send via
                </label>
                <div className="flex gap-2">
                  {[
                    { value: "whatsapp", icon: "ri-whatsapp-line", label: "WhatsApp" },
                    { value: "sms", icon: "ri-chat-1-line", label: "Text Message" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setSendMethod(opt.value as "whatsapp" | "sms")}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                        sendMethod === opt.value
                          ? "bg-accent-500 text-background-50 border-accent-500"
                          : "bg-white text-foreground-600 border-background-300 hover:border-foreground-300"
                      }`}
                    >
                      <i className={`${opt.icon} text-sm`}></i>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Phone Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground-700 mb-2">
                  Your phone number
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-shrink-0">
                    <select
                      value={sendCountryCode}
                      onChange={(e) => setSendCountryCode(e.target.value)}
                      className="appearance-none pl-3 pr-8 py-2.5 rounded-xl border border-background-300 bg-white text-sm text-foreground-900 focus:outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-100 transition-colors cursor-pointer"
                    >
                      {COUNTRY_CODES.map((cc) => (
                        <option key={cc.code} value={cc.code}>
                          {cc.flag} {cc.code}
                        </option>
                      ))}
                    </select>
                    <i className="ri-arrow-down-s-line absolute right-2 top-1/2 -translate-y-1/2 text-foreground-400 text-xs pointer-events-none"></i>
                  </div>
                  <input
                    type="tel"
                    value={sendPhone}
                    onChange={(e) => setSendPhone(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSendToPhone();
                    }}
                    placeholder="Phone number"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-background-300 bg-white text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-100 transition-colors"
                    autoFocus
                  />
                </div>
                <p className="text-xs text-foreground-400 mt-2 flex items-center gap-1">
                  <i className="ri-information-line text-[11px]"></i>
                  We'll open {sendMethod === "whatsapp" ? "WhatsApp" : "your messaging app"} with the full tour route pre-filled
                </p>
              </div>

              {/* Preview of what's being sent */}
              <div className="mb-6 p-4 rounded-xl bg-background-100 border border-background-200/50">
                <p className="text-xs text-foreground-400 uppercase tracking-wider mb-2">You'll receive</p>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">
                    <i className="ri-checkbox-circle-fill text-accent-500 text-sm"></i>
                  </span>
                  <p className="text-sm text-foreground-700 leading-relaxed">
                    All 7 cafe stops with addresses, must-try highlights, and walking directions — formatted for easy reading on your phone.
                  </p>
                </div>
                <div className="flex items-start gap-2 mt-2">
                  <span className="w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">
                    <i className="ri-checkbox-circle-fill text-accent-500 text-sm"></i>
                  </span>
                  <p className="text-sm text-foreground-700 leading-relaxed">
                    Works offline — once it's in your chat, you can reference it anywhere without data.
                  </p>
                </div>
              </div>

              {/* Action */}
              <button
                onClick={handleSendToPhone}
                className="w-full py-3 bg-accent-500 text-background-50 dark:text-foreground-950 rounded-full text-sm font-semibold hover:bg-accent-600 transition-colors whitespace-nowrap cursor-pointer flex items-center justify-center gap-2"
              >
                <i className={`${sendMethod === "whatsapp" ? "ri-whatsapp-line" : "ri-chat-1-line"}`}></i>
                {sendMethod === "whatsapp" ? "Open in WhatsApp" : "Open Text Message"}
              </button>
            </div>
          </div>
        )}
      </main>
      <Footer />
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}