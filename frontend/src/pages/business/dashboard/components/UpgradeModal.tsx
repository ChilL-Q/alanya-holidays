import React, { useState } from "react";
import { X, Check, Sparkles, Shield, Rocket, Crown, ArrowRight, CheckCircle2 } from "lucide-react";
import { directoryService, type ListingTier } from "@/api-services/directory.service";

export interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessName?: string;
  currentTier?: string;
}

interface TierPlan {
  id: ListingTier;
  name: string;
  price: string;
  period: string;
  badge?: string;
  badgeColor?: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  highlighted?: boolean;
}

const PLANS: TierPlan[] = [
  {
    id: "voyager",
    name: "Voyager",
    price: "€19",
    period: "per month",
    badge: "Growth",
    badgeColor: "bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800",
    description: "Boost engagement with direct customer contact channels and analytics.",
    icon: <Rocket className="w-5 h-5 text-sky-500" />,
    features: [
      "Priority directory search placement",
      "Direct website & WhatsApp buttons",
      "Social media integration (IG, FB, TripAdvisor)",
      "Promotional video embed (YouTube/Vimeo)",
      "Instant booking redirect button",
      "Up to 50 photo gallery uploads",
      "Full interactive performance analytics",
    ],
  },
  {
    id: "signature",
    name: "Signature",
    price: "€49",
    period: "per month",
    badge: "Most Popular",
    badgeColor: "bg-amber-100 text-amber-900 border-amber-300 font-semibold dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700",
    description: "Premium showcase designed for top-tier establishments and boutique venues.",
    icon: <Crown className="w-5 h-5 text-amber-500" />,
    highlighted: true,
    features: [
      "Top-of-category placement & search boost",
      "Signature Collection evocative trust badge",
      "Promotional banner on Alanya destination guides",
      "All Voyager growth features included",
      "Up to 100 high-res photo gallery",
      "Dedicated merchant priority support",
      "Performance analytics & trend reports",
    ],
  },
  {
    id: "partner",
    name: "Partner",
    price: "€99",
    period: "per month",
    badge: "Enterprise",
    badgeColor: "bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800",
    description: "Comprehensive 360° marketing partnership with multilingual AI reach.",
    icon: <Shield className="w-5 h-5 text-purple-500" />,
    features: [
      "Top Rated Destination Partner trust badge",
      "AI translation & localization (8 languages)",
      "Seasonal editorial campaigns & newsletter inclusion",
      "Dedicated account manager & quarterly reports",
      "Unlimited photos & video showcases",
      "Custom branded business spotlight page",
      "All Signature & Voyager perks included",
    ],
  },
];

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  businessName = "Your Business",
  currentTier = "explorer",
}) => {
  const [selectedTier, setSelectedTier] = useState<ListingTier>("signature");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectTier = async (tier: ListingTier) => {
    setSelectedTier(tier);
    setIsSubmitting(true);
    try {
      await directoryService.sendPaymentInstructions(businessName, tier);
      setSuccessMessage(
        `Upgrade request for ${tier.toUpperCase()} submitted! Payment and activation instructions have been sent to your email.`
      );
    } catch {
      setSuccessMessage(
        `Upgrade request for ${tier.toUpperCase()} noted! Our team will contact you shortly.`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
    >
      <div className="relative w-full max-w-4xl rounded-2xl bg-white dark:bg-slate-900 border border-secondary-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="relative px-6 pt-6 pb-5 border-b border-secondary-100 dark:border-slate-800 flex items-start justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Listing Upgrade & Merchant Growth
            </div>
            <h2
              id="upgrade-modal-title"
              className="text-xl sm:text-2xl font-bold font-display text-secondary-900 dark:text-white"
            >
              Upgrade Your Business Listing: {businessName}
            </h2>
            <p className="text-sm text-secondary-500 dark:text-slate-400">
              Unlock priority placement, direct inquiry buttons, real-time analytics, and trust badges.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-xl text-secondary-400 hover:text-secondary-700 dark:hover:text-white hover:bg-secondary-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {successMessage ? (
            <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-200">
                Upgrade Request Submitted
              </h3>
              <p className="text-sm text-emerald-700 dark:text-emerald-300 max-w-md mx-auto">
                {successMessage}
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all cursor-pointer"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {PLANS.map((plan) => {
                const isCurrent = currentTier?.toLowerCase() === plan.id.toLowerCase();
                return (
                  <div
                    key={plan.id}
                    className={`relative rounded-2xl p-5 sm:p-6 flex flex-col justify-between transition-all ${
                      plan.highlighted
                        ? "bg-gradient-to-b from-amber-500/10 via-white to-white dark:from-amber-500/10 dark:via-slate-900 dark:to-slate-900 border-2 border-amber-400 dark:border-amber-500/60 shadow-xl shadow-amber-500/5"
                        : "bg-white dark:bg-slate-900 border border-secondary-200 dark:border-slate-800 hover:border-secondary-300 dark:hover:border-slate-700 shadow-sm"
                    }`}
                  >
                    {plan.badge && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span
                          className={`inline-block px-3 py-0.5 rounded-full text-xs font-bold border ${plan.badgeColor}`}
                        >
                          {plan.badge}
                        </span>
                      </div>
                    )}

                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-xl bg-secondary-100 dark:bg-slate-800">
                            {plan.icon}
                          </div>
                          <h3 className="font-bold text-lg text-secondary-900 dark:text-white">
                            {plan.name}
                          </h3>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-extrabold font-display text-secondary-900 dark:text-white">
                            {plan.price}
                          </span>
                          <span className="text-xs text-secondary-500 dark:text-slate-400">
                            /{plan.period}
                          </span>
                        </div>
                        <p className="text-xs text-secondary-500 dark:text-slate-400 mt-1.5 min-h-[32px]">
                          {plan.description}
                        </p>
                      </div>

                      <div className="border-t border-secondary-100 dark:border-slate-800 pt-4">
                        <p className="text-xs font-semibold text-secondary-800 dark:text-slate-200 uppercase tracking-wider mb-2.5">
                          Features Included:
                        </p>
                        <ul className="space-y-2 text-xs text-secondary-600 dark:text-slate-300">
                          {plan.features.map((feat, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="pt-6 mt-4 border-t border-secondary-100 dark:border-slate-800">
                      <button
                        type="button"
                        disabled={isSubmitting || isCurrent}
                        onClick={() => handleSelectTier(plan.id)}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          isCurrent
                            ? "bg-secondary-100 dark:bg-slate-800 text-secondary-400 cursor-not-allowed"
                            : plan.highlighted
                            ? "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20"
                            : "bg-secondary-900 hover:bg-secondary-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700"
                        }`}
                      >
                        {isCurrent ? (
                          "Current Tier"
                        ) : isSubmitting && selectedTier === plan.id ? (
                          "Processing..."
                        ) : (
                          <>
                            <span>Choose {plan.name}</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
