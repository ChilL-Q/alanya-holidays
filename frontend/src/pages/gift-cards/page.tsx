import { useState, useCallback, useRef, useEffect } from "react";
import Navbar from "@/pages/home/components/Navbar";
import Footer from "@/pages/home/components/Footer";
import ToastContainer, { createToast, type ToastData } from "@/components/base/Toast";
import { useCart } from "@/hooks/useCart";
import { Money } from "@/domain/money.vo";
import {
  GIFT_CARD_COLLECTIONS,
  type GiftCardCollection,
  type GiftCardTier,
} from "./data/giftCardsData";
import GiftCardHero from "./components/GiftCardHero";
import GiftCardGrid from "./components/GiftCardGrid";
import RedemptionGuide from "./components/RedemptionGuide";
import GiftCardFaq from "./components/GiftCardFaq";

export default function GiftCardsPage() {
  const { addToCart } = useCart();
  const [selectedCategory, setSelectedCategory] = useState<string>("All Experiences");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const toastTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    document.title = "Gift Cards Hub | Alanya Holidays";
    window.scrollTo(0, 0);

    const timers = toastTimersRef.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = toastTimersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      toastTimersRef.current.delete(id);
    }
  }, []);

  const showToast = useCallback(
    (productName: string, subMessage?: string) => {
      const toast = createToast("Added to cart", `${productName}${subMessage ? ` (${subMessage})` : ""}`, "success");
      setToasts((prev) => [...prev, toast]);
      const timer = setTimeout(() => dismissToast(toast.id), 3500);
      toastTimersRef.current.set(toast.id, timer);
    },
    [dismissToast],
  );

  const handleAddToCart = useCallback(
    (collection: GiftCardCollection, tier: GiftCardTier) => {
      addToCart({
        name: collection.title,
        variantLabel: tier.name,
        price: Money.fromDecimal(tier.price, "EUR"),
        icon: collection.icon,
        productId: collection.productId,
        skuId: tier.id,
        skuLabel: tier.name,
        quantity: 1,
      });

      showToast(`${collection.title} - ${tier.name}`, tier.money.format());
    },
    [addToCart, showToast],
  );

  const handleResetFilters = useCallback(() => {
    setSelectedCategory("All Experiences");
    setSearchQuery("");
  }, []);

  return (
    <div className="min-h-screen bg-background-50 flex flex-col">
      <Navbar />

      <main className="flex-1">
        <GiftCardHero
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <GiftCardGrid
          collections={GIFT_CARD_COLLECTIONS}
          selectedCategory={selectedCategory}
          searchQuery={searchQuery}
          onAddToCart={handleAddToCart}
          onResetFilters={handleResetFilters}
        />

        <RedemptionGuide />

        <GiftCardFaq />
      </main>

      <Footer />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
