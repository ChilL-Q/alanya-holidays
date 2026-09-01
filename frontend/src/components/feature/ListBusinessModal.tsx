import React, { useState, useEffect, useRef } from "react";
import {
  directoryService,
  businessCategories,
  type ListingTier,
  type CreateListingInput,
} from "@/api-services/directory.service";
import { useListingDraft } from "@/hooks/useListingDraft";
import { logger } from "@/lib/logger";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import "@/i18n";

export interface ListBusinessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onListingCreated?: (listing: CreateListingInput) => void;
  onDraftSaved?: (draft: Partial<CreateListingInput>, draftId?: string) => void;
  draftId?: string;
  initialData?: Partial<CreateListingInput>;
  userId?: string | null;
}

interface TierInfo {
  id: ListingTier;
  name: string;
  price: string;
  billing: string;
  badge?: string;
  badgeColor?: string;
  description: string;
  features: string[];
  maxPhotos: number;
  highlighted?: boolean;
}

const TIERS: TierInfo[] = [
  {
    id: "explorer",
    name: "Explorer",
    price: "€0",
    billing: "Free Forever",
    description: "Standard business listing to establish your presence on Alanya Holidays.",
    maxPhotos: 5,
    features: [
      "Standard directory placement",
      "Core contact info (Phone, Email, Address)",
      "Basic business description",
      "Up to 5 photo uploads",
      "Customer reviews & ratings",
    ],
  },
  {
    id: "voyager",
    name: "Voyager",
    price: "€19",
    billing: "per month",
    badge: "Growth",
    badgeColor: "bg-sky-100 text-sky-800 border-sky-200",
    description: "Boost engagement with direct customer contact channels and analytics.",
    maxPhotos: 50,
    highlighted: true,
    features: [
      "Priority directory search placement",
      "Direct website & WhatsApp links",
      "Social media integration (IG, FB, TripAdvisor)",
      "Promotional video embed (YouTube/Vimeo)",
      "Direct Instant Booking link",
      "Up to 50 photo gallery uploads",
      "Full interactive performance analytics",
    ],
  },
  {
    id: "partner",
    name: "Custom",
    price: "~$100",
    billing: "per month",
    badge: "Enterprise",
    badgeColor: "bg-purple-100 text-purple-900 border-purple-300",
    description: "Comprehensive 360° marketing partnership with multilingual AI reach.",
    maxPhotos: 100,
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

export default function ListBusinessModal({
  isOpen,
  onClose,
  onListingCreated,
  onDraftSaved,
  draftId: propDraftId,
  initialData: propInitialData,
  userId,
}: ListBusinessModalProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<"tier" | "form" | "confirmed">(() => {
    if (propInitialData || propDraftId) return "form";
    return "tier";
  });

  const {
    draft,
    draftId: activeDraftId,
    isSaving: isDraftSaving,
    lastSavedAt,
    hasLocalDraft,
    localDraftSummary,
    updateField,
    restoreLocalDraft,
    discardLocalDraft,
    clearDraft,
    saveToCloud,
  } = useListingDraft({
    userId,
    initialDraftId: propDraftId,
    initialData: propInitialData,
    debounceMs: 500,
  });

  const [selectedTier, setSelectedTier] = useState<ListingTier>(() => {
    return (draft.tier as ListingTier) || propInitialData?.tier || "explorer";
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftNotice, setDraftNotice] = useState<string | null>(null);
  const [copiedBank, setCopiedBank] = useState(false);
  const [refCode] = useState(() => `ALN-${Math.floor(100000 + Math.random() * 900000)}`);
  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bankTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
      if (bankTimerRef.current) clearTimeout(bankTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (propInitialData || propDraftId) {
        setStep("form");
        if (propInitialData?.tier) {
          setSelectedTier(propInitialData.tier);
        }
      }
    }
  }, [isOpen, propInitialData, propDraftId]);

  if (!isOpen) return null;

  const currentTierObj = TIERS.find((t) => t.id === selectedTier) || TIERS[0];
  const isPaid = selectedTier !== "explorer";

  const handleSelectTier = (tierId: ListingTier) => {
    setSelectedTier(tierId);
    updateField("tier", tierId);
    setStep("form");
  };

  const validateForm = (): boolean => {
    const nextErrors: Record<string, string> = {};

    const nameVal = (draft.name || "").trim();
    const catVal = draft.category || "";
    const descVal = (draft.description || "").trim();
    const addrVal = (draft.address || "").trim();
    const phoneVal = (draft.phone || "").trim();
    const emailVal = (draft.email || "").trim();

    if (!nameVal) nextErrors.name = "Business name is required";
    if (!catVal) nextErrors.category = "Please select a category";
    if (!descVal) nextErrors.description = "Business description is required";
    if (!addrVal) nextErrors.address = "Address is required";
    if (!phoneVal) nextErrors.phone = "Contact phone is required";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailVal || !emailRegex.test(emailVal)) {
      nextErrors.email = "Valid business email is required";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSaveDraft = async () => {
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    try {
      const saved = await saveToCloud();
      setDraftNotice("Draft saved successfully to your account & device.");
      onDraftSaved?.(draft, saved?.id || activeDraftId || undefined);
      noticeTimerRef.current = setTimeout(() => setDraftNotice(null), 4000);
    } catch (err) {
      logger.warn("Failed to save cloud draft, saved locally:", err);
      setDraftNotice("Draft saved locally on this device.");
      onDraftSaved?.(draft, activeDraftId || undefined);
      noticeTimerRef.current = setTimeout(() => setDraftNotice(null), 4000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    const inputPayload: CreateListingInput = {
      name: (draft.name || "").trim(),
      category: draft.category || "restaurants",
      subcategory: (draft.subcategory || "").trim() || undefined,
      description: (draft.description || "").trim(),
      address: (draft.address || "").trim(),
      phone: (draft.phone || "").trim(),
      email: (draft.email || "").trim(),
      website: (draft.website || "").trim() || undefined,
      tier: selectedTier,
      price_level: draft.price_level || "$$",
      social_links: isPaid
        ? {
            whatsapp: (draft.social_links?.whatsapp || "").trim() || undefined,
            instagram: (draft.social_links?.instagram || "").trim() || undefined,
            facebook: (draft.social_links?.facebook || "").trim() || undefined,
            tripadvisor: (draft.social_links?.tripadvisor || "").trim() || undefined,
          }
        : undefined,
      video_url: isPaid && (draft.video_url || "").trim() ? (draft.video_url || "").trim() : undefined,
      booking_url: isPaid && (draft.booking_url || "").trim() ? (draft.booking_url || "").trim() : undefined,
      images: Array.isArray(draft.images) && draft.images.length > 0 ? draft.images : [],
    };

    try {
      if (activeDraftId) {
        await directoryService.publishDraft(activeDraftId, inputPayload);
      } else {
        await directoryService.createListing(inputPayload);
      }

      clearDraft();
      onListingCreated?.(inputPayload);
      setStep("confirmed");
    } catch (err) {
      logger.error("Failed to submit business listing:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to submit business listing. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyBank = () => {
    if (bankTimerRef.current) clearTimeout(bankTimerRef.current);
    const text = `Bank: Ziraat Bankası\nAccount: Alanya Holidays Turizm Ltd. Şti.\nIBAN: TR89 0001 0000 1234 5678 9012 34\nSWIFT: TCZBTR2A\nReference: ${refCode}\nAmount: ${currentTierObj.price}`;
    navigator.clipboard?.writeText(text);
    setCopiedBank(true);
    bankTimerRef.current = setTimeout(() => setCopiedBank(false), 3000);
  };

  const handleClose = () => {
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    if (bankTimerRef.current) clearTimeout(bankTimerRef.current);
    setStep(propInitialData || propDraftId ? "form" : "tier");
    setErrors({});
    setDraftNotice(null);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="list-business-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
    >
      <div
        className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-background-200/80 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-background-100 bg-background-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary-500/10 flex items-center justify-center text-primary-600">
              <i className="ri-store-3-fill text-xl" />
            </div>
            <div>
              <h2 id="list-business-title" className="font-heading text-lg sm:text-xl font-bold text-foreground-900">
                {step === "tier"
                  ? t("listing.chooseTier")
                  : step === "form"
                  ? `List Your Business (${currentTierObj.name} Tier)`
                  : t("listing.confirmation")}
              </h2>
              <p className="text-xs text-foreground-500">
                {step === "tier"
                  ? t("listing.tierDescription")
                  : step === "form"
                  ? "Fill in your profile details or save as draft anytime"
                  : t("listing.confirmationDescription")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-9 h-9 rounded-full bg-background-100 text-foreground-500 hover:bg-background-200 hover:text-foreground-800 flex items-center justify-center transition-colors cursor-pointer"
            aria-label={t("public.close")}
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="max-h-[80vh] overflow-y-auto p-6 sm:p-8">
          {/* STEP 1: TIER SELECTION */}
          {step === "tier" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {TIERS.map((tier) => (
                  <div
                    key={tier.id}
                    className={`rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 border relative ${
                      tier.id === "voyager"
                        ? "border-sky-400 bg-sky-50/20 shadow-md ring-2 ring-sky-400/20"
                        : tier.id === "partner"
                        ? "border-purple-200 bg-purple-50/10 hover:border-purple-300 hover:shadow-sm"
                        : "border-background-200 bg-white hover:border-primary-300 hover:shadow-sm"
                    }`}
                  >
                    {tier.badge && (
                      <span
                        className={`absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-xs ${tier.badgeColor}`}
                      >
                        {tier.badge}
                      </span>
                    )}

                    <div>
                      <h3 className="font-heading text-lg font-bold text-foreground-900 mb-1">
                        {tier.name}
                      </h3>
                      <div className="flex items-baseline gap-1 mb-2">
                        <span className="text-2xl font-extrabold text-foreground-900">{tier.price}</span>
                        <span className="text-xs text-foreground-500">{tier.billing}</span>
                      </div>
                      <p className="text-xs text-foreground-600 mb-4 leading-relaxed">
                        {tier.description}
                      </p>

                      <ul className="space-y-2 mb-6 border-t border-background-100 pt-3">
                        {tier.features.map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-foreground-700">
                            <i className="ri-checkbox-circle-fill text-emerald-500 text-sm shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      type="button"
                      data-testid={`select-tier-${tier.id}`}
                      onClick={() => handleSelectTier(tier.id)}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm ${
                        tier.id === "voyager"
                          ? "bg-sky-500 text-white hover:bg-sky-600"
                          : tier.id === "partner"
                          ? "bg-purple-600 text-white hover:bg-purple-700"
                          : "bg-foreground-900 text-white hover:bg-foreground-800"
                      }`}
                    >
                      {t("listing.selectTier", { name: tier.name })}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: DYNAMIC ADAPTIVE FORM WITH DRAFT PERSISTENCE */}
          {step === "form" && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Draft Recovery Banner */}
              {hasLocalDraft && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2.5 text-xs text-amber-900">
                    <i className="ri-draft-line text-base text-amber-600 shrink-0" />
                    <span>
                      <strong>{t("listing.unsavedDraft")}</strong> "{localDraftSummary?.name || t("listing.untitledDraft")}" {t("listing.previousSession")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={restoreLocalDraft}
                      className="px-3.5 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition-colors cursor-pointer"
                    >
                      {t("listing.resumeDraft")}
                    </button>
                    <button
                      type="button"
                      onClick={discardLocalDraft}
                      className="px-3.5 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-900 text-xs font-medium hover:bg-amber-100 transition-colors cursor-pointer"
                    >
                      {t("listing.discard")}
                    </button>
                  </div>
                </div>
              )}

              {/* Draft Saved Feedback Alert */}
              {draftNotice && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 animate-in fade-in">
                  <i className="ri-checkbox-circle-fill text-emerald-600" />
                  <span>{draftNotice}</span>
                </div>
              )}

              {/* Tier Banner & Switcher */}
              <div className="p-4 rounded-2xl bg-background-50 border border-background-200 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full bg-primary-100 text-primary-800 text-xs font-bold uppercase tracking-wider">
                    {t("listing.tierName", { name: currentTierObj.name })}
                  </span>
                  <span className="text-sm font-semibold text-foreground-900">
                    {currentTierObj.price} / {currentTierObj.billing}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {lastSavedAt && (
                    <span className="text-[11px] text-foreground-400 hidden sm:inline">
                      {t("listing.autosaved", { time: new Date(lastSavedAt).toLocaleTimeString() })}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setStep("tier")}
                    className="text-xs text-primary-600 font-semibold hover:underline cursor-pointer"
                  >
                    {t("listing.changeTier")}
                  </button>
                </div>
              </div>

              {/* Core Info */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground-500">
                  {t("listing.coreInformation")}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="biz-name" className="block text-xs font-semibold text-foreground-700 mb-1.5">
                      {t("listing.businessName")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="biz-name"
                      type="text"
                      value={draft.name || ""}
                      onChange={(e) => updateField("name", e.target.value)}
                      placeholder={t("listing.namePlaceholder")}
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-white border text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${
                        errors.name ? "border-red-400" : "border-foreground-200 focus:border-primary-500"
                      }`}
                    />
                    {errors.name && <p className="text-[11px] text-red-500 mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <label htmlFor="biz-category" className="block text-xs font-semibold text-foreground-700 mb-1.5">
                      {t("listing.category")} <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="biz-category"
                      value={draft.category || "restaurants"}
                      onChange={(e) => updateField("category", e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-foreground-200 text-sm text-foreground-900 focus:outline-none focus:border-primary-500"
                    >
                      {businessCategories.filter((c) => c.id !== "all").map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="biz-subcategory" className="block text-xs font-semibold text-foreground-700 mb-1.5">
                      {t("listing.subcategory")}
                    </label>
                    <input
                      id="biz-subcategory"
                      type="text"
                      value={draft.subcategory || ""}
                      onChange={(e) => updateField("subcategory", e.target.value)}
                      placeholder={t("listing.categoryPlaceholder")}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-foreground-200 text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="biz-price" className="block text-xs font-semibold text-foreground-700 mb-1.5">
                      {t("listing.priceRange")}
                    </label>
                    <select
                      id="biz-price"
                      value={draft.price_level || "$$"}
                      onChange={(e) => updateField("price_level", e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-foreground-200 text-sm text-foreground-900 focus:outline-none focus:border-primary-500"
                    >
                      <option value="$">$ (Budget Friendly)</option>
                      <option value="$$">$$ (Moderate)</option>
                      <option value="$$$">$$$ (Premium / Luxury)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="biz-description" className="block text-xs font-semibold text-foreground-700 mb-1.5">
                    {t("listing.businessDescription")} <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="biz-description"
                    rows={3}
                    maxLength={isPaid ? 2000 : 500}
                    value={draft.description || ""}
                    onChange={(e) => updateField("description", e.target.value)}
                    placeholder={t("listing.descriptionPlaceholder")}
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-white border text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${
                      errors.description ? "border-red-400" : "border-foreground-200 focus:border-primary-500"
                    }`}
                  />
                  <div className="flex items-center justify-between text-[11px] text-foreground-400 mt-1">
                    <span>{errors.description && <span className="text-red-500">{errors.description}</span>}</span>
                    <span>
                      {(draft.description || "").length}/{isPaid ? "2000" : "500"} chars
                    </span>
                  </div>
                </div>
              </div>

              {/* Location & Contact */}
              <div className="space-y-4 pt-4 border-t border-background-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground-500">
                  2. Location & Contact Info
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="biz-address" className="block text-xs font-semibold text-foreground-700 mb-1.5">
                      {t("listing.address")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="biz-address"
                      type="text"
                      value={draft.address || ""}
                      onChange={(e) => updateField("address", e.target.value)}
                      placeholder={t("listing.addressPlaceholder")}
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-white border text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${
                        errors.address ? "border-red-400" : "border-foreground-200 focus:border-primary-500"
                      }`}
                    />
                    {errors.address && <p className="text-[11px] text-red-500 mt-1">{errors.address}</p>}
                  </div>

                  <div>
                    <label htmlFor="biz-phone" className="block text-xs font-semibold text-foreground-700 mb-1.5">
                      {t("listing.contactPhone")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="biz-phone"
                      type="tel"
                      value={draft.phone || ""}
                      onChange={(e) => updateField("phone", e.target.value)}
                      placeholder={t("listing.phonePlaceholder")}
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-white border text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${
                        errors.phone ? "border-red-400" : "border-foreground-200 focus:border-primary-500"
                      }`}
                    />
                    {errors.phone && <p className="text-[11px] text-red-500 mt-1">{errors.phone}</p>}
                  </div>

                  <div>
                    <label htmlFor="biz-email" className="block text-xs font-semibold text-foreground-700 mb-1.5">
                      {t("listing.businessEmail")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="biz-email"
                      type="email"
                      value={draft.email || ""}
                      onChange={(e) => updateField("email", e.target.value)}
                      placeholder={t("listing.emailPlaceholder")}
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-white border text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${
                        errors.email ? "border-red-400" : "border-foreground-200 focus:border-primary-500"
                      }`}
                    />
                    {errors.email && <p className="text-[11px] text-red-500 mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <label htmlFor="biz-photo" className="block text-xs font-semibold text-foreground-700 mb-1.5">
                      {t("listing.coverPhotoUrl", { count: currentTierObj.maxPhotos })}
                    </label>
                    <input
                      id="biz-photo"
                      type="url"
                      value={draft.images?.[0] || ""}
                      onChange={(e) =>
                        updateField("images", e.target.value.trim() ? [e.target.value.trim()] : [])
                      }
                        placeholder={t("listing.imagePlaceholder")}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-foreground-200 text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-500"
                    />
                  </div>
                </div>
              </div>

              {/* PAID TIER ADAPTIVE FIELDS */}
              {isPaid && (
                <div className="space-y-4 pt-4 border-t border-background-100">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-primary-600 flex items-center gap-1.5">
                      <i className="ri-vip-diamond-fill text-sm text-amber-500" />
                      3. Unlocked Growth & Media Features
                    </h4>
                    <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      {t("listing.paidTierUnlocked")}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="biz-website" className="block text-xs font-semibold text-foreground-700 mb-1.5">
                        {t("listing.websiteUrl")}
                      </label>
                      <input
                        id="biz-website"
                        type="url"
                        value={draft.website || ""}
                        onChange={(e) => updateField("website", e.target.value)}
                        placeholder={t("listing.websitePlaceholder")}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-foreground-200 text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="biz-whatsapp" className="block text-xs font-semibold text-foreground-700 mb-1.5">
                        {t("listing.whatsappNumber")}
                      </label>
                      <input
                        id="biz-whatsapp"
                        type="tel"
                        value={draft.social_links?.whatsapp || ""}
                        onChange={(e) =>
                          updateField("social_links", {
                            ...draft.social_links,
                            whatsapp: e.target.value,
                          })
                        }
                        placeholder={t("listing.whatsappPlaceholder")}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-foreground-200 text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="biz-instagram" className="block text-xs font-semibold text-foreground-700 mb-1.5">
                        {t("listing.instagramUrl")}
                      </label>
                      <input
                        id="biz-instagram"
                        type="url"
                        value={draft.social_links?.instagram || ""}
                        onChange={(e) =>
                          updateField("social_links", {
                            ...draft.social_links,
                            instagram: e.target.value,
                          })
                        }
                        placeholder={t("listing.instagramPlaceholder")}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-foreground-200 text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="biz-facebook" className="block text-xs font-semibold text-foreground-700 mb-1.5">
                        {t("listing.facebookUrl")}
                      </label>
                      <input
                        id="biz-facebook"
                        type="url"
                        value={draft.social_links?.facebook || ""}
                        onChange={(e) =>
                          updateField("social_links", {
                            ...draft.social_links,
                            facebook: e.target.value,
                          })
                        }
                        placeholder={t("listing.facebookPlaceholder")}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-foreground-200 text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="biz-video" className="block text-xs font-semibold text-foreground-700 mb-1.5">
                        {t("listing.promotionalVideoUrl")}
                      </label>
                      <input
                        id="biz-video"
                        type="url"
                        value={draft.video_url || ""}
                        onChange={(e) => updateField("video_url", e.target.value)}
                        placeholder={t("listing.youtubePlaceholder")}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-foreground-200 text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="biz-booking" className="block text-xs font-semibold text-foreground-700 mb-1.5">
                        {t("listing.instantBookingUrl")}
                      </label>
                      <input
                        id="biz-booking"
                        type="url"
                        value={draft.booking_url || ""}
                        onChange={(e) => updateField("booking_url", e.target.value)}
                        placeholder={t("listing.bookingPlaceholder")}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-foreground-200 text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center justify-between gap-3 pt-4 border-t border-background-100 flex-wrap">
                <button
                  type="button"
                  onClick={() => setStep("tier")}
                  className="px-5 py-2.5 rounded-full border border-foreground-200 text-foreground-700 text-xs sm:text-sm font-medium hover:bg-background-50 transition-colors cursor-pointer"
                >
                  {t("listing.back")}
                </button>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    disabled={isDraftSaving || isSubmitting}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-primary-300 bg-primary-50 text-primary-700 text-xs sm:text-sm font-semibold hover:bg-primary-100 disabled:opacity-50 transition-colors shadow-2xs cursor-pointer"
                  >
                    <i className={isDraftSaving ? "ri-loader-4-line animate-spin text-sm" : "ri-draft-line text-sm"} />
                    {isDraftSaving ? t("listing.savingDraft") : t("listing.saveDraft")}
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting || isDraftSaving}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary-500 text-white text-xs sm:text-sm font-semibold hover:bg-primary-600 disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <i className="ri-loader-4-line animate-spin text-sm" />
                        {t("listing.submitting")}
                      </>
                    ) : (
                      <>
                        <i className="ri-send-plane-fill text-sm" />
                        {t("listing.submitListing")}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* STEP 3: POST-SUBMISSION CONFIRMATION POPUPS */}
          {step === "confirmed" && (
            <div className="p-4 sm:p-6 text-center">
              {/* FREE TIER POPUP */}
              {!isPaid ? (
                <div>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl shadow-sm">
                    <i className="ri-checkbox-circle-fill" />
                  </div>
                  <h3 className="font-heading text-2xl font-bold text-foreground-900 mb-2">
                    {t("listing.thankYou")}
                  </h3>
                  <p className="text-sm text-foreground-600 max-w-lg mx-auto mb-6 leading-relaxed">
                    {t("listing.thankYouDescription")}
                  </p>
                  <div className="bg-background-50 rounded-2xl p-4 max-w-md mx-auto mb-6 text-left border border-background-200">
                    <div className="flex items-center justify-between text-xs text-foreground-700 mb-1.5">
                    <span className="font-medium">{t("listing.business")}:</span>
                      <span className="font-bold text-foreground-900">{draft.name || t("listing.yourBusiness")}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-foreground-700 mb-1.5">
                    <span className="font-medium">{t("listing.tier")}:</span>
                      <span className="font-semibold text-primary-600">{t("listing.explorerFree")}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-foreground-700">
                    <span className="font-medium">{t("listing.status")}:</span>
                      <span className="font-semibold text-amber-600">{t("listing.pendingReview")}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-8 py-2.5 rounded-full bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 transition-colors shadow-sm cursor-pointer"
                  >
                    {t("listing.done")}
                  </button>
                </div>
              ) : (
                /* PAID TIER BANK PAYMENT POPUP */
                <div>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-3xl shadow-sm">
                    <i className="ri-bank-card-fill" />
                  </div>
                  <h3 className="font-heading text-2xl font-bold text-foreground-900 mb-2">
                    {t("listing.paymentConfirmation")}
                  </h3>
                  <p className="text-sm text-foreground-600 max-w-lg mx-auto mb-6 leading-relaxed">
                    {t("listing.paymentDescription")}
                  </p>

                  {/* Bank Transfer Details Box */}
                  <div className="bg-background-50 rounded-2xl p-5 max-w-lg mx-auto mb-6 text-left border border-background-200/80 shadow-xs">
                    <div className="flex items-center justify-between border-b border-background-200/70 pb-3 mb-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-foreground-700 flex items-center gap-1.5">
                        <i className="ri-building-4-fill text-primary-500 text-sm" />
                        {t("listing.bankTransferInstructions")}
                      </h4>
                      <span className="text-xs font-extrabold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md">
                        {t("listing.amount", { amount: currentTierObj.price })}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-foreground-500">{t("listing.bankName")}:</span>
                        <span className="font-semibold text-foreground-900">Ziraat Bankası</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-foreground-500">{t("listing.accountHolder")}:</span>
                        <span className="font-semibold text-foreground-900">Alanya Holidays Turizm Ltd. Şti.</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-foreground-500">{t("listing.iban")}:</span>
                        <span className="font-mono font-bold text-foreground-900 select-all">
                          TR89 0001 0000 1234 5678 9012 34
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-foreground-500">{t("listing.swift")}:</span>
                        <span className="font-mono font-semibold text-foreground-900">TCZBTR2A</span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-background-200/60">
                        <span className="text-foreground-500">{t("listing.paymentReference")}:</span>
                        <span className="font-mono font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded border border-primary-200 select-all">
                          {refCode}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-3 flex-wrap">
                    <button
                      type="button"
                      onClick={handleCopyBank}
                      className="flex items-center gap-1.5 px-5 py-2.5 rounded-full border border-foreground-200 bg-white text-foreground-800 text-xs sm:text-sm font-semibold hover:bg-background-50 transition-colors shadow-xs cursor-pointer"
                    >
                      <i className={copiedBank ? "ri-check-line text-emerald-600" : "ri-file-copy-line"} />
                      {copiedBank ? t("listing.bankDetailsCopied") : t("listing.copyBankDetails")}
                    </button>
                    <button
                      type="button"
                      onClick={handleClose}
                      className="px-6 py-2.5 rounded-full bg-primary-500 text-white text-xs sm:text-sm font-semibold hover:bg-primary-600 transition-colors shadow-sm cursor-pointer"
                    >
                      {t("listing.notedDetails")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { ListBusinessModal };
