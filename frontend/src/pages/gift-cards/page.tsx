import { useState, useCallback, useEffect } from "react";
import Navbar from "@/pages/home/components/Navbar";
import Footer from "@/pages/home/components/Footer";
import { useToast } from "@/hooks/useToast";
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
  const { showToast, ToastContainer } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>("All Experiences");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    document.title = "Gift Cards Hub | Alanya Holidays";
    window.scrollTo(0, 0);
  }, []);

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

      showToast("Added to cart", `${collection.title} - ${tier.name}`, "success");
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

      <ToastContainer />
    </div>
  );
}
