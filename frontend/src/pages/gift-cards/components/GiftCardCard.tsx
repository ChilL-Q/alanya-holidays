import { useState, useMemo } from "react";
import type {
  GiftCardCollection,
  GiftCardTier,
  BadgeVariant,
} from "../data/giftCardsData";

interface GiftCardCardProps {
  collection: GiftCardCollection;
  onAddToCart: (collection: GiftCardCollection, tier: GiftCardTier) => void;
}

const badgeColorMap: Record<BadgeVariant, string> = {
  accent: "bg-accent-500 text-white shadow-xs",
  primary: "bg-primary-600 text-white shadow-xs",
  secondary: "bg-indigo-600 text-white shadow-xs",
  gold: "bg-amber-500 text-slate-950 font-semibold shadow-xs",
};

export default function GiftCardCard({
  collection,
  onAddToCart,
}: GiftCardCardProps) {
  // Default to recommended tier or first tier
  const defaultTierId = useMemo(() => {
    const rec = collection.tiers.find((t) => t.recommended);
    return rec ? rec.id : collection.tiers[0]?.id || "";
  }, [collection]);

  const [selectedTierId, setSelectedTierId] = useState<string>(defaultTierId);

  const selectedTier = useMemo(() => {
    return (
      collection.tiers.find((t) => t.id === selectedTierId) ||
      collection.tiers[0]
    );
  }, [collection, selectedTierId]);

  const handleAdd = () => {
    if (selectedTier) {
      onAddToCart(collection, selectedTier);
    }
  };

  return (
    <article
      data-testid={`gift-card-${collection.id}`}
      className="group flex flex-col bg-background-50 rounded-2xl border border-background-200/80 shadow-xs hover:shadow-xl transition-all duration-300 overflow-hidden"
    >
      {/* Top Image & Badges */}
      <div className="relative w-full h-52 sm:h-56 overflow-hidden bg-background-100">
        <img
          src={collection.imageUrl}
          alt={collection.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs tracking-wide uppercase ${
              badgeColorMap[collection.badgeType] || badgeColorMap.primary
            }`}
          >
            {collection.badge}
          </span>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-black/60 text-white backdrop-blur-md flex items-center gap-1">
            <i className="ri-star-fill text-amber-400"></i>
            {collection.rating.toFixed(1)}
            <span className="text-white/60 font-normal">
              ({collection.reviewsCount})
            </span>
          </span>
        </div>

        {/* Bottom Image Overlay Details */}
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white">
          <div>
            <span className="text-xs uppercase tracking-wider text-white/80 font-medium flex items-center gap-1.5 mb-0.5">
              <i className={`${collection.icon} text-primary-300`}></i>
              {collection.category}
            </span>
            <h3 className="font-heading text-xl font-bold text-white leading-tight drop-shadow-xs">
              {collection.title}
            </h3>
          </div>
        </div>
      </div>

      {/* Body Content */}
      <div className="flex-1 p-5 flex flex-col">
        <p className="text-xs font-medium text-primary-600 mb-2 italic">
          "{collection.tagline}"
        </p>
        <p className="text-sm text-foreground-600 line-clamp-2 mb-4 leading-relaxed">
          {collection.description}
        </p>

        {/* Tier Selector */}
        <div className="mb-4">
          <label className="block text-xs font-semibold uppercase tracking-wider text-foreground-500 mb-2">
            Select Experience Tier
          </label>
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-background-100 rounded-xl border border-background-200">
            {collection.tiers.map((tier) => {
              const isSelected = tier.id === selectedTierId;
              return (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => setSelectedTierId(tier.id)}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg text-center transition-all cursor-pointer ${
                    isSelected
                      ? "bg-white text-primary-700 font-semibold shadow-xs border border-primary-200"
                      : "text-foreground-600 hover:text-foreground-900 hover:bg-white/50"
                  }`}
                  aria-pressed={isSelected}
                  aria-label={`${tier.name} tier for ${tier.money.format()}`}
                >
                  <span className="text-xs truncate w-full">
                    {tier.name}
                  </span>
                  <span className="text-xs font-bold mt-0.5 text-foreground-900">
                    {tier.money.format()}
                  </span>
                  {tier.recommended && (
                    <span className="text-[9px] px-1 rounded-full bg-primary-100 text-primary-700 font-semibold mt-0.5">
                      Popular
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Tier Inclusions / Perks */}
        {selectedTier && (
          <div className="p-3.5 rounded-xl bg-background-100/70 border border-background-200 mb-5">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold text-foreground-900">
                {selectedTier.name} Inclusions:
              </span>
              <span className="text-xs font-semibold text-primary-600">
                {selectedTier.money.format()}
              </span>
            </div>
            <p className="text-xs text-foreground-500 mb-2.5">
              {selectedTier.description}
            </p>
            <ul className="space-y-1.5">
              {selectedTier.perks.map((perk, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-xs text-foreground-700"
                >
                  <i className="ri-check-line text-emerald-600 font-bold shrink-0 mt-0.5"></i>
                  <span>{perk}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Card Footer & Add to Cart */}
        <div className="mt-auto pt-4 border-t border-background-200 flex items-center justify-between gap-3">
          <div>
            <span className="block text-[11px] uppercase tracking-wider text-foreground-400 font-medium">
              Total Price
            </span>
            <span className="text-xl font-heading font-bold text-foreground-900">
              {selectedTier?.money.format() || "—"}
            </span>
            <span className="block text-[10px] text-foreground-500">
              {collection.validity}
            </span>
          </div>

          <button
            type="button"
            onClick={handleAdd}
            aria-label={`Add ${collection.title} - ${selectedTier?.name} to cart`}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 active:scale-95 text-white text-sm font-semibold shadow-sm shadow-primary-500/25 transition-all cursor-pointer"
          >
            <i className="ri-shopping-cart-2-line text-base"></i>
            <span>Add to Cart</span>
          </button>
        </div>
      </div>
    </article>
  );
}
