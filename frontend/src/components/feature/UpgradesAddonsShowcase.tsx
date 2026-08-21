import React, { useState } from "react";

export interface AddonItem {
  id: string;
  name: string;
  price: string;
  billing: string;
  icon: string;
  badge?: string;
  impactStat: string;
  description: string;
  benefits: string[];
}

export const UPGRADE_ADDONS: AddonItem[] = [
  {
    id: "instant-booking",
    name: "Instant Booking Integration",
    price: "€29/mo",
    billing: "Billed monthly",
    icon: "ri-calendar-check-fill",
    badge: "High Conversion",
    impactStat: "+45% direct bookings",
    description: "Enable direct reservation widgets directly on your listing card and business page.",
    benefits: [
      "Real-time reservation requests",
      "Direct WhatsApp / booking calendar link",
      "No per-booking commissions",
    ],
  },
  {
    id: "verified-traveller-badge",
    name: "Verified Traveller Trust Badge",
    price: "€15/mo",
    billing: "Billed monthly",
    icon: "ri-shield-check-fill",
    badge: "Trust Booster",
    impactStat: "+35% customer trust",
    description: "Official inspection and authenticity seal verified by Alanya Holidays team.",
    benefits: [
      "Verified Experience badge on search & map",
      "Priority in traveler recommendations",
      "Official certificate of quality",
    ],
  },
  {
    id: "seasonal-campaigns",
    name: "Seasonal Campaign Placements",
    price: "€49/campaign",
    billing: "Per seasonal run",
    icon: "ri-sun-fill",
    badge: "Seasonal Peak",
    impactStat: "3x search impressions",
    description: "Featured top spotlight in seasonal guides (Summer Riviera, Autumn Castle, Winter Spa).",
    benefits: [
      "Prominent guide banner placement",
      "Weekly newsletter feature to 15,000+ travelers",
      "Targeted destination promotion",
    ],
  },
  {
    id: "sponsored-articles",
    name: "Sponsored Editorial Articles",
    price: "€79/article",
    billing: "One-time publication",
    icon: "ri-article-fill",
    badge: "SEO Power",
    impactStat: "Permanent Google rank",
    description: "Dedicated storytelling article and interview published in the official Alanya Travel Blog.",
    benefits: [
      "Professional editorial copy & photoshoot",
      "Permanent high-authority backlink",
      "Social media spotlight on Instagram & Facebook",
    ],
  },
  {
    id: "ai-translation",
    name: "AI Translation & Localization",
    price: "€19/mo",
    billing: "Billed monthly",
    icon: "ri-translate-2",
    badge: "Global Reach",
    impactStat: "Reach 8+ languages",
    description: "Automatic high-accuracy localization for Turkish, Russian, German, English, Arabic, and more.",
    benefits: [
      "Dynamic translated listing copy & menus",
      "Multi-language review summaries",
      "Higher discovery for international tourists",
    ],
  },
];

export interface UpgradesAddonsShowcaseProps {
  onUpgradeSelect?: (addon: AddonItem) => void;
  className?: string;
}

export default function UpgradesAddonsShowcase({
  onUpgradeSelect,
  className = "",
}: UpgradesAddonsShowcaseProps) {
  const [selectedAddonId, setSelectedAddonId] = useState<string | null>(null);

  const handleSelect = (addon: AddonItem) => {
    setSelectedAddonId(addon.id);
    onUpgradeSelect?.(addon);
  };

  return (
    <section className={`w-full py-12 md:py-16 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-100 text-primary-800 text-xs font-bold uppercase tracking-wider mb-3">
            <i className="ri-rocket-fill text-primary-600" />
            Growth Acceleration
          </div>
          <h2 className="font-heading text-2xl md:text-4xl font-extrabold text-foreground-900 mb-3">
            Upgrades & Add-Ons Showcase
          </h2>
          <p className="text-sm md:text-base text-foreground-600 leading-relaxed">
            Supercharge your business reach, build high trust, and convert more tourists into paying customers with specialized modular power-ups.
          </p>
        </div>

        {/* Addon Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {UPGRADE_ADDONS.map((addon) => {
            const isSelected = selectedAddonId === addon.id;
            return (
              <div
                key={addon.id}
                className={`bg-white rounded-3xl p-6 border transition-all duration-300 flex flex-col justify-between relative shadow-xs hover:shadow-lg ${
                  isSelected
                    ? "border-primary-500 ring-2 ring-primary-300"
                    : "border-background-200 hover:border-primary-300"
                }`}
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center text-2xl">
                      <i className={addon.icon} />
                    </div>
                    {addon.badge && (
                      <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-[11px] font-bold">
                        {addon.badge}
                      </span>
                    )}
                  </div>

                  {/* Title & Price */}
                  <h3 className="font-heading text-lg font-bold text-foreground-900 mb-1">
                    {addon.name}
                  </h3>
                  <div className="flex items-baseline gap-1.5 mb-3">
                    <span className="text-2xl font-extrabold text-foreground-900">{addon.price}</span>
                    <span className="text-xs text-foreground-500 font-medium">({addon.billing})</span>
                  </div>

                  {/* Impact Stat */}
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold mb-4 border border-emerald-200/60">
                    <i className="ri-line-chart-fill text-emerald-600" />
                    <span>{addon.impactStat}</span>
                  </div>

                  <p className="text-xs text-foreground-600 leading-relaxed mb-4">
                    {addon.description}
                  </p>

                  {/* Benefits */}
                  <ul className="space-y-2 mb-6 border-t border-background-100 pt-4">
                    {addon.benefits.map((b, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-foreground-700">
                        <i className="ri-check-line text-primary-500 font-bold text-sm shrink-0" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Select / Upgrade Button */}
                <button
                  type="button"
                  data-testid={`addon-select-${addon.id}`}
                  onClick={() => handleSelect(addon)}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm ${
                    isSelected
                      ? "bg-emerald-600 text-white"
                      : "bg-foreground-900 text-white hover:bg-primary-600"
                  }`}
                >
                  {isSelected ? "Selected" : "Select Add-On"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
