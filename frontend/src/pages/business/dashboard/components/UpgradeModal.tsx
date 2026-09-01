import React, { useState } from "react";
import { X, Sparkles, Rocket, MessageCircle, CheckCircle2, Loader2 } from "lucide-react";
import {
  billingService,
  type SubscriptionPlan,
} from "@/api-services/billing.service";
import { WHATSAPP_NUMBER } from "@/config/whatsapp";

export interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessName?: string;
  currentTier?: string;
}

interface PlanCard {
  id: "voyager" | "custom";
  name: string;
  monthlyPrice: string;
  annualPrice: string;
  badge?: string;
  badgeColor?: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  highlighted?: boolean;
}

const CUSTOM_WHATSAPP_MESSAGE = encodeURIComponent(
  "Hi! I'm interested in the Custom plan (~$100/mo) for my business on Alanya Holidays. Please share the details."
);

const PLANS: PlanCard[] = [
  {
    id: "voyager",
    name: "Voyager",
    monthlyPrice: "€19",
    annualPrice: "€190",
    badge: "Growth",
    badgeColor:
      "bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800",
    description:
      "Boost engagement with direct customer contact channels and analytics.",
    icon: <Rocket className="w-5 h-5 text-sky-500" />,
    highlighted: true,
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
    id: "custom",
    name: "Custom",
    monthlyPrice: "~$100",
    annualPrice: "~$100",
    badge: "Enterprise",
    badgeColor:
      "bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800",
    description:
      "Comprehensive 360° marketing partnership with multilingual AI reach.",
    icon: <MessageCircle className="w-5 h-5 text-purple-500" />,
    features: [
      "Top Rated Destination Partner trust badge",
      "AI translation & localization (8 languages)",
      "Seasonal editorial campaigns & newsletter inclusion",
      "Dedicated account manager & quarterly reports",
      "Unlimited photos & video showcases",
      "Custom branded business spotlight page",
    ],
  },
];

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  businessName = "Your Business",
  currentTier = "explorer",
}) => {
  const [billingPeriod, setBillingPeriod] =
    useState<SubscriptionPlan>("monthly");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubscribeVoyager = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const { url } = await billingService.createSubscriptionCheckout(
        billingPeriod
      );
      window.location.href = url;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      setErrorMessage(
        message.includes("already has an active subscription")
          ? "You already have an active subscription. Manage it from Settings → Billing."
          : message
      );
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
      <div className="relative w-full max-w-3xl rounded-2xl bg-white dark:bg-slate-900 border border-secondary-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="relative px-6 pt-6 pb-5 border-b border-secondary-100 dark:border-slate-800 flex items-start justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Membership & Growth
            </div>
            <h2
              id="upgrade-modal-title"
              className="text-xl sm:text-2xl font-bold font-display text-secondary-900 dark:text-white"
            >
              Choose a Plan for {businessName}
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
        <div className="p-6 space-y-5">
          {errorMessage && (
            <div
              role="alert"
              className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm"
            >
              {errorMessage}
            </div>
          )}

          {/* Billing period toggle (applies to self-serve plan) */}
          <div className="flex items-center justify-center gap-2">
            {(["monthly", "annual"] as SubscriptionPlan[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setBillingPeriod(p)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors cursor-pointer border ${
                  billingPeriod === p
                    ? "bg-primary-500 text-white border-primary-500"
                    : "bg-white dark:bg-slate-900 text-secondary-600 dark:text-slate-300 border-secondary-200 dark:border-slate-700 hover:border-primary-300"
                }`}
              >
                {p}
                {p === "annual" && (
                  <span className="ml-1.5 text-[10px] opacity-80">2 months free</span>
                )}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PLANS.map((plan) => {
              const isCurrent =
                currentTier?.toLowerCase() === plan.id.toLowerCase();
              const isSelfServe = plan.id === "voyager";
              const price = isSelfServe
                ? billingPeriod === "annual"
                  ? plan.annualPrice
                  : plan.monthlyPrice
                : plan.monthlyPrice;

              return (
                <div
                  key={plan.id}
                  className={`rounded-2xl border p-5 flex flex-col gap-4 ${
                    plan.highlighted
                      ? "border-primary-400 dark:border-primary-500/60 shadow-md"
                      : "border-secondary-200 dark:border-slate-700"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">{plan.icon}</div>
                    {plan.badge && (
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${plan.badgeColor}`}
                      >
                        {plan.badge}
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-bold font-display text-secondary-900 dark:text-white">
                      {plan.name}
                      {isCurrent && (
                        <span className="ml-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 align-middle">
                          Current
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-secondary-500 dark:text-slate-400 mt-1">
                      {plan.description}
                    </p>
                  </div>

                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-bold text-secondary-900 dark:text-white">
                      {price}
                    </span>
                    <span className="text-sm text-secondary-500">
                      / month
                    </span>
                  </div>

                  <ul className="text-sm text-secondary-700 dark:text-slate-300 space-y-2 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  {isSelfServe ? (
                    <button
                      type="button"
                      disabled={isSubmitting || isCurrent}
                      onClick={handleSubscribeVoyager}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary-500 hover:bg-primary-600 disabled:opacity-60 text-white transition-all cursor-pointer"
                    >
                      {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                      Subscribe{billingPeriod === "annual" ? " — €190/year" : ""}
                    </button>
                  ) : (
                    <a
                      href={`https://wa.me/${WHATSAPP_NUMBER}?text=${CUSTOM_WHATSAPP_MESSAGE}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-purple-600 hover:bg-purple-500 text-white transition-all cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Contact us on WhatsApp
                    </a>
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-xs text-secondary-400 dark:text-slate-500 text-center">
            Cancel anytime — access continues until the end of your billing period.
          </p>
        </div>
      </div>
    </div>
  );
};
