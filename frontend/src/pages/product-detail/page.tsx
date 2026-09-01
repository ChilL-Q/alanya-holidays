import { useState, useEffect, useCallback, useRef, type FormEvent } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "@/pages/home/components/Navbar";
import Footer from "@/pages/home/components/Footer";
import { useCart } from "@/hooks/useCart";
import { useFavorites } from "@/hooks/useFavorites";
import { useToast } from "@/hooks/useToast";
import {
  productsService,
  type ProductDetail,
  type ProductVariant,
  type ProductSku,
} from "@/api-services/products.service";
import { isAbortError } from "@/lib/api-client";
import {
  COFFEE_TOUR_CAFES,
  COFFEE_TOUR_PRODUCT_ID,
} from "./components/types";
import { ProductBreadcrumb } from "./components/ProductBreadcrumb";
import { ProductGallery } from "./components/ProductGallery";
import { ProductInfo } from "./components/ProductInfo";
import { CheckoutForm } from "./components/CheckoutForm";
import { CoffeeTourSection } from "./components/CoffeeTourSection";
import { SendToPhoneModal } from "./components/SendToPhoneModal";
import { useTranslation } from "react-i18next";
import "@/i18n";

export default function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite, favorites } = useFavorites();
  const { showToast, ToastContainer } = useToast();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [skus, setSkus] = useState<ProductSku[]>([]);
  const [selectedSkuId, setSelectedSkuId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

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
    const controller = new AbortController();
    async function fetchProduct() {
      try {
        setLoading(true);
        setError(null);

        const {
          product: fetchedProduct,
          variants: fetchedVariants,
          skus: fetchedSkus,
        } = await productsService.getProductDetails(productId || "", {
          signal: controller.signal,
        });

        if (!fetchedProduct) {
          if (!controller.signal.aborted) setError(t("product.notFound"));
          return;
        }

        if (!controller.signal.aborted) {
          setProduct(fetchedProduct);
          setVariants(fetchedVariants);
          setSkus(fetchedSkus);

          // Auto-select first SKU if variants exist
          if (fetchedSkus.length > 0) {
            setSelectedSkuId(fetchedSkus[0].id);
          }
        }
      } catch (err: unknown) {
        if (isAbortError(err)) return;
        setError(err instanceof Error ? err.message : t("product.loadFailed"));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    if (productId) fetchProduct();
    return () => {
      controller.abort();
    };
  }, [productId, t]);

  const selectedSku = skus.find((s) => s.id === selectedSkuId) || null;
  const hasVariants = variants.length > 0 && skus.length > 0;

  // Current stock & price calculation
  const currentStock =
    hasVariants && selectedSku ? selectedSku.stock : (product?.stock ?? 0);
  const currentPrice =
    hasVariants && selectedSku ? selectedSku.price : (product?.price ?? 0);

  const formatPrice = useCallback(
    (price: number) => {
      if (!product) return "";
      const symbol =
        product.currency === "EUR" ? "€" : product.currency === "USD" ? "$" : product.currency;
      return `${symbol}${price.toFixed(2)}`;
    },
    [product]
  );

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
  const activeImageUrl = mediaImages[activeImageIndex]?.url || mediaImages[0]?.url;

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
      imageUrl: activeImageUrl,
    });
    showToast(
      t("product.addedToCart"),
      quantity > 1
        ? `${quantity}x ${product.name}${displayVariant}`
        : `${product.name}${displayVariant}`,
      "success"
    );
    setQuantity(1);
  }, [product, hasVariants, selectedSku, addToCart, formatPrice, getCategoryIcon, activeImageUrl, showToast, quantity, t]);

  // Print-to-PDF: open a print-optimized tour map in a new window
  const handlePrintMap = useCallback(() => {
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) {
      showToast(t("product.popupBlocked"), t("product.popupHelp"), "error");
      return;
    }

    const stopsHtml = COFFEE_TOUR_CAFES.map((cafe, i) => {
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
            <div class="highlight"><strong>${t("product.mustTry")}</strong> ${cafe.highlight}</div>
          </div>
        </div>`;
    }).join("");

    const html = '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <title>Alanya Coffee Tour — Route Map</title>\n  <style>\n    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }\n    body { font-family: Georgia, "Times New Roman", serif; color: #1a1a1a; line-height: 1.6; max-width: 720px; margin: 0 auto; padding: 36px 28px; }\n    .cover { text-align: center; padding: 48px 0 36px; border-bottom: 2px solid #d4a574; margin-bottom: 40px; }\n    .cover h1 { font-size: 28px; font-weight: 700; letter-spacing: -0.5px; margin-bottom: 10px; color: #5c3d2e; }\n    .cover .subtitle { font-size: 14px; color: #8b7355; }\n    .cover .meta { margin-top: 18px; font-size: 11px; color: #aaa; }\n    .route-summary { background: #faf7f2; border-radius: 10px; padding: 22px 26px; margin-bottom: 40px; }\n    .route-summary h2 { font-size: 16px; color: #5c3d2e; margin-bottom: 10px; }\n    .route-summary p { font-size: 13px; color: #6b5b4f; line-height: 1.7; }\n    .stops-heading { font-size: 18px; color: #5c3d2e; margin-bottom: 24px; padding-bottom: 10px; border-bottom: 1px solid #e8ddd0; }\n    .stop-card { display: flex; gap: 16px; margin-bottom: 28px; padding-bottom: 28px; border-bottom: 1px dashed #e8ddd0; page-break-inside: avoid; }\n    .stop-card:last-child { border-bottom: none; }\n    .stop-num { flex-shrink: 0; width: 38px; height: 38px; border-radius: 50%; background: #5c3d2e; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 700; }\n    .stop-body { flex: 1; min-width: 0; }\n    .stop-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 6px; flex-wrap: wrap; gap: 8px; }\n    .stop-header h3 { font-size: 15px; font-weight: 700; color: #3d2b1f; }\n    .tier-badge { display: inline-block; padding: 2px 10px; border-radius: 20px; font-size: 10px; font-weight: 600; letter-spacing: 0.5px; white-space: nowrap; }\n    .tier-accent { background: #fdf2e9; color: #b87333; border: 1px solid #f0c9a0; }\n    .tier-secondary { background: #f0f4e8; color: #6b8e4e; border: 1px solid #c5d5a8; }\n    .tier-primary { background: #f0eef4; color: #6b5b8e; border: 1px solid #c5b8d5; }\n    .address { font-size: 12px; color: #8b7355; margin-bottom: 8px; }\n    .desc { font-size: 13px; color: #5c4f43; margin-bottom: 10px; }\n    .highlight { font-size: 13px; color: #b87333; background: #fdf8f3; padding: 10px 14px; border-radius: 8px; border-left: 3px solid #d4a574; }\n    .footer-note { margin-top: 44px; padding-top: 24px; border-top: 2px solid #d4a574; }\n    .footer-note h2 { font-size: 15px; color: #5c3d2e; margin-bottom: 8px; }\n    .footer-note p { font-size: 12px; color: #6b5b4f; line-height: 1.7; margin-bottom: 4px; }\n    .footer-note .validity { margin-top: 10px; font-style: italic; color: #aaa; }\n    @media print { body { padding: 0; } .stop-card { page-break-inside: avoid; } }\n  </style>\n</head>\n<body>\n  <div class="cover">\n    <h1>Alanya Coffee Tour &mdash; Route Map</h1>\n    <p class="subtitle">7 hand-picked cafes from the harbor to Mahmutlar</p>\n    <p class="meta">Generated from Alanya Holidays &bull; ' + new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) + '</p>\n  </div>\n\n  <div class="route-summary">\n    <h2>Your Tour at a Glance</h2>\n    <p>Seven hand-picked cafes &mdash; each stop unlocks a complimentary coffee and dessert with your Coffee Tour Gift Card. The route winds from the harbor through the old town, along Kleopatra Beach, and up to Mahmutlar. Pace yourself &mdash; the card is valid for 12 months.</p>\n  </div>\n\n  <h2 class="stops-heading">Tour Stops</h2>\n' + stopsHtml + '\n\n  <div class="footer-note">\n    <h2>How the Tour Works</h2>\n    <p>Each stop on the map is a participating cafe. Show your Coffee Tour Gift Card (digital or printed) at the counter and they&rsquo;ll mark your stop &mdash; one complimentary coffee and one dessert per location. No reservations needed, just walk in and enjoy.</p>\n    <p>The card is valid for 12 months, so you can spread the stops across multiple days or tackle them all in one glorious caffeine-fueled marathon.</p>\n    <p class="validity">Gift Card valid for 12 months from date of purchase &bull; alanyaholidays.com</p>\n  </div>\n</body>\n</html>';

    const localizedHtml = html
      .replaceAll("Alanya Coffee Tour — Route Map", t("product.printTitle"))
      .replaceAll("7 hand-picked cafes from the harbor to Mahmutlar", t("product.printSubtitle"))
      .replaceAll("Generated from Alanya Holidays", t("product.generatedFrom"))
      .replaceAll("Your Tour at a Glance", t("product.atAGlance"))
      .replaceAll("Seven hand-picked cafes &mdash; each stop unlocks a complimentary coffee and dessert with your Coffee Tour Gift Card. The route winds from the harbor through the old town, along Kleopatra Beach, and up to Mahmutlar. Pace yourself &mdash; the card is valid for 12 months.", t("product.printSummary"))
      .replaceAll("Tour Stops", t("product.tourStops"))
      .replaceAll("How the Tour Works", t("product.howItWorks"))
      .replaceAll("Each stop on the map is a participating cafe. Show your Coffee Tour Gift Card (digital or printed) at the counter and they&rsquo;ll mark your stop &mdash; one complimentary coffee and one dessert per location. No reservations needed, just walk in and enjoy.", t("product.worksSummary"))
      .replaceAll("The card is valid for 12 months, so you can spread the stops across multiple days or tackle them all in one glorious caffeine-fueled marathon.", t("product.validitySummary"))
      .replaceAll("Gift Card valid for 12 months from date of purchase &bull; alanyaholidays.com", t("product.validity"));
    printWindow.document.write(localizedHtml);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.addEventListener("afterprint", () => printWindow.close(), { once: true });
    }, 500);
  }, [showToast, t]);

  // Send Tour Map to Phone
  const handleSendToPhone = useCallback(() => {
    const rawPhone = sendPhone.replace(/[\s\-().]/g, "");
    if (!rawPhone || rawPhone.length < 5) {
      showToast(t("product.invalidPhone"), t("product.validPhone"), "error");
      return;
    }

    const fullNumber = sendCountryCode + rawPhone;
    const lines = [
      t("product.sendHeader"),
      t("product.sendSubtitle"),
      "",
    ];

    COFFEE_TOUR_CAFES.forEach((cafe, i) => {
      const tier = i <= 2 ? "[3-Stop]" : i <= 4 ? "[5-Stop]" : "[Full Day]";
      lines.push(`*Stop ${i + 1}: ${cafe.name}* ${tier}`);
      lines.push(`📍 ${cafe.address}`);
      lines.push(`   ${cafe.description}`);
      lines.push(`   ⭐ ${cafe.highlight}`);
      if (i < COFFEE_TOUR_CAFES.length - 1) {
        lines.push(`   🚶 Walk to: ${COFFEE_TOUR_CAFES[i + 1].name}`);
      }
      lines.push("");
    });

    lines.push("---");
    lines.push(t("product.sendGiftCard"));
    lines.push(t("product.sendCoffee"));
    lines.push(t("product.sendValid"));
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
      t("product.tourMapSent"),
      sendMethod === "whatsapp"
        ? t("product.whatsappOpening")
        : t("product.messagingOpening"),
      "success"
    );
  }, [sendPhone, sendCountryCode, sendMethod, showToast, t]);

  // Share Tour
  const handleShareTour = useCallback(async () => {
    const shareUrl = window.location.href;
    const shareTitle = t("product.shareTitle");
    const shareText = t("product.shareText");

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
        showToast(t("product.shared"), t("product.sharedDescription"), "success");
        return;
      } catch {
        // user cancelled or API failed
      }
    }

    const twitterUrl =
      "https://twitter.com/intent/tweet?text=" +
      encodeURIComponent(shareText + " " + shareUrl);

    try {
      await navigator.clipboard.writeText(shareText + " " + shareUrl);
      showToast(
        t("product.linkCopied"),
        t("product.linkCopiedDescription"),
        "success"
      );
      setTimeout(() => window.open(twitterUrl, "_blank", "noopener,noreferrer"), 600);
    } catch {
      window.open(twitterUrl, "_blank", "noopener,noreferrer");
    }
  }, [showToast, t]);

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

      const fullName = ((formData.get("name") as string) || "").trim();
      const email = ((formData.get("email") as string) || "").trim();
      const phoneRaw = ((formData.get("phone") as string) || "").trim();
      const notes = ((formData.get("notes") as string) || "").trim();
      const phone = `${countryCode}.${phoneRaw}`;

      if (!fullName) {
        setCheckoutError(t("product.fullNameRequired"));
        return;
      }
      if (!email) {
        setCheckoutError(t("product.emailRequired"));
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
            ? t("product.confirmWhatsApp")
            : preferredContact === "phone"
              ? "We'll call you shortly to confirm."
              : "We'll email you shortly to confirm.",
          "success"
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : t("product.genericError");
        setCheckoutError(msg);
        showToast(t("product.orderFailed"), msg, "error");
      } finally {
        setCheckoutSubmitting(false);
      }
    },
    [product, quantity, countryCode, preferredContact, currentPrice, selectedSku, showToast, t]
  );

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-background-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-background-200 border-t-accent-500 rounded-full animate-spin"></div>
            <p className="text-foreground-500 text-sm">{t("public.loadingProduct")}</p>
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
            <p className="text-foreground-700 text-sm mb-4">{error || t("product.notFound")}</p>
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
        {/* Breadcrumb Navigation */}
        <ProductBreadcrumb productName={product.name} />

        {/* Product Detail Section */}
        <section className="w-full px-4 md:px-8 lg:px-12 pb-16 md:pb-24 bg-background-50">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-8 md:gap-12">
              <ProductGallery
                productName={product.name}
                mediaImages={mediaImages}
                activeImageIndex={activeImageIndex}
                onSelectImage={setActiveImageIndex}
                categoryIcon={getCategoryIcon()}
              />

              <ProductInfo
                product={product}
                variants={variants}
                skus={skus}
                selectedSkuId={selectedSkuId}
                onSelectSkuId={setSelectedSkuId}
                currentPrice={currentPrice}
                currentStock={currentStock}
                formatPrice={formatPrice}
                quantity={quantity}
                onSetQuantity={setQuantity}
                onAddToCart={handleAddToCart}
                showCheckout={showCheckout}
                onToggleCheckout={() => setShowCheckout(!showCheckout)}
              />
            </div>
          </div>
        </section>

        {/* Inline Checkout Form */}
        {showCheckout && (
          <CheckoutForm
            product={product}
            selectedSku={selectedSku}
            quantity={quantity}
            currentPrice={currentPrice}
            formatPrice={formatPrice}
            countryCode={countryCode}
            onSetCountryCode={setCountryCode}
            preferredContact={preferredContact}
            onSetPreferredContact={setPreferredContact}
            checkoutSubmitting={checkoutSubmitting}
            checkoutSuccess={checkoutSuccess}
            checkoutError={checkoutError}
            onResetCheckout={() => {
              setCheckoutSuccess(false);
              setShowCheckout(false);
            }}
            onSubmit={handleCheckoutSubmit}
            formRef={formRef}
            currentStock={currentStock}
          />
        )}

        {/* Coffee Tour Route Preview — only for Coffee Tour Gift Card */}
        {Number(productId) === COFFEE_TOUR_PRODUCT_ID && (
          <CoffeeTourSection
            productName={product.name}
            currentPrice={currentPrice}
            formatPrice={formatPrice}
            currentStock={currentStock}
            quantity={quantity}
            setQuantity={setQuantity}
            onAddToCart={handleAddToCart}
            favorites={favorites}
            isFavorite={isFavorite}
            toggleFavorite={toggleFavorite}
            onPrintMap={handlePrintMap}
            onOpenSendModal={() => setShowSendModal(true)}
            onShareTour={handleShareTour}
          />
        )}

        {/* Send to Phone Modal */}
        <SendToPhoneModal
          isOpen={showSendModal}
          onClose={() => setShowSendModal(false)}
          sendMethod={sendMethod}
          onSetSendMethod={setSendMethod}
          sendCountryCode={sendCountryCode}
          onSetSendCountryCode={setSendCountryCode}
          sendPhone={sendPhone}
          onSetSendPhone={setSendPhone}
          onSend={handleSendToPhone}
        />
      </main>
      <Footer />
      <ToastContainer />
    </>
  );
}
