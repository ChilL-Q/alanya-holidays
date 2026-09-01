import React, { useState, useEffect } from "react";
import {
  directoryService,
  type SubmitClaimPayload,
  type Business,
} from "@/api-services/directory.service";
import { logger } from "@/lib/logger";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import "@/i18n";

export interface ClaimListingModalProps {
  business: Business | null;
  isOpen: boolean;
  onClose: () => void;
  onClaimSubmitted?: (payload: SubmitClaimPayload) => void;
}

export default function ClaimListingModal({
  business,
  isOpen,
  onClose,
  onClaimSubmitted,
}: ClaimListingModalProps) {
  const { t } = useTranslation();
  const [claimantName, setClaimantName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("Owner");
  const [whatsapp, setWhatsapp] = useState("");
  const [notes, setNotes] = useState("");
  const [agreed, setAgreed] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Reset state when opening/closing or changing business
  useEffect(() => {
    if (isOpen && business) {
      setClaimantName("");
      setEmail("");
      setPhone(business.phone || "");
      setRole("Owner");
      setWhatsapp("");
      setNotes("");
      setAgreed(false);
      setErrors({});
      setSubmitted(false);
      setSubmitError(null);
    }
  }, [isOpen, business]);

  if (!isOpen || !business) {
    return null;
  }

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {};

    if (!claimantName.trim()) {
      nextErrors.claimantName = t("public.claimantNameRequired");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      nextErrors.email = t("public.officialEmailRequired");
    }

    if (!phone.trim()) {
      nextErrors.phone = t("public.contactPhoneRequired");
    }

    if (!role.trim()) {
      nextErrors.role = t("public.businessRoleRequired");
    }

    if (!agreed) {
      nextErrors.agreed = t("public.authorizedRepresentativeRequired");
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const payload: SubmitClaimPayload = {
      listing_id: business.id,
      business_name: business.name,
      claimant_name: claimantName.trim(),
      full_name: claimantName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      contact_phone: phone.trim(),
      role: role.trim(),
      role_title: role.trim(),
      whatsapp: whatsapp.trim() || undefined,
      additional_notes: notes.trim() || undefined,
      notes: notes.trim() || undefined,
      verification_method: "email_and_document",
    };

    try {
      await directoryService.submitClaim(payload);
      setSubmitted(true);
      onClaimSubmitted?.(payload);
    } catch (err) {
      logger.error("Claim submission failed:", err);
      const errorMessage =
        err instanceof Error ? err.message : t("public.claimSubmitError");
      setSubmitError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="claim-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-background-200/80 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-background-100 bg-background-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary-500/10 flex items-center justify-center text-primary-600">
              <i className="ri-shield-user-fill text-xl" />
            </div>
            <div>
              <h2 id="claim-modal-title" className="font-heading text-lg sm:text-xl font-bold text-foreground-900">
                {t("public.claimListing")}
              </h2>
              <p className="text-xs text-foreground-500">
                {t("public.verifyOwnership")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-background-100 text-foreground-500 hover:bg-background-200 hover:text-foreground-800 flex items-center justify-center transition-colors cursor-pointer"
            aria-label={t("common.close")}
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        {/* Modal Body */}
        {submitted ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl shadow-sm">
              <i className="ri-checkbox-circle-fill" />
            </div>
            <h3 className="font-heading text-2xl font-bold text-foreground-900 mb-2">
              {t("public.claimSubmitted")}
            </h3>
            <p className="text-sm text-foreground-600 max-w-md mx-auto mb-6 leading-relaxed">
              {t("public.claimReceived", { name: business.name })}
            </p>
            <div className="bg-background-50 rounded-2xl p-4 max-w-md mx-auto mb-6 text-left border border-background-200/70">
              <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-foreground-700">
                <i className="ri-information-fill text-primary-500 text-sm" />
                {t("public.whatHappensNext")}
              </div>
              <ul className="text-xs text-foreground-600 space-y-1.5 list-disc pl-5">
                <li>{t("public.claimReviewTime")}</li>
                <li>{t("public.claimConfirmation", { email })}</li>
                <li>{t("public.claimApprovalControl")}</li>
              </ul>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-full bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 transition-colors shadow-sm cursor-pointer"
            >
              {t("common.done")}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
            {submitError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                {submitError}
              </div>
            )}

            {/* Business Snapshot Card */}
            <div className="p-4 rounded-2xl bg-background-50 border border-background-200/80 flex items-start gap-4">
              <img
                src={business.image}
                alt={business.name}
                className="w-16 h-16 rounded-xl object-cover shrink-0 border border-background-200"
              />
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-primary-600">
                  {t("public.targetListing")}
                </span>
                <h4 className="font-heading text-base font-bold text-foreground-900 truncate">
                  {business.name}
                </h4>
                <p className="text-xs text-foreground-500 truncate flex items-center gap-1 mt-0.5">
                  <i className="ri-map-pin-line text-foreground-400" />
                  {business.address}
                </p>
              </div>
            </div>

            {/* Form Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="claimant-name" className="block text-xs font-semibold text-foreground-700 mb-1.5">
                  {t("public.fullName")} <span className="text-red-500">*</span>
                </label>
                <input
                  id="claimant-name"
                  type="text"
                  value={claimantName}
                  onChange={(e) => setClaimantName(e.target.value)}
                  placeholder={t("public.claimNamePlaceholder")}
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-white border text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${
                    errors.claimantName ? "border-red-400" : "border-foreground-200 focus:border-primary-500"
                  }`}
                />
                {errors.claimantName && (
                  <p className="text-[11px] text-red-500 mt-1">{errors.claimantName}</p>
                )}
              </div>

              <div>
                <label htmlFor="claimant-role" className="block text-xs font-semibold text-foreground-700 mb-1.5">
                  {t("public.yourRole")} <span className="text-red-500">*</span>
                </label>
                <select
                  id="claimant-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-white border text-sm text-foreground-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${
                    errors.role ? "border-red-400" : "border-foreground-200 focus:border-primary-500"
                  }`}
                >
                  <option value="Owner">{t("public.businessOwner")}</option>
                  <option value="General Manager">{t("public.generalManager")}</option>
                  <option value="Marketing Director">{t("public.marketingDirector")}</option>
                  <option value="Authorized Agent">{t("public.authorizedAgent")}</option>
                  <option value="Other">{t("public.other")}</option>
                </select>
                {errors.role && (
                  <p className="text-[11px] text-red-500 mt-1">{errors.role}</p>
                )}
              </div>

              <div>
                <label htmlFor="claimant-email" className="block text-xs font-semibold text-foreground-700 mb-1.5">
                  {t("public.officialBusinessEmail")} <span className="text-red-500">*</span>
                </label>
                <input
                  id="claimant-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("public.businessEmailPlaceholder")}
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-white border text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${
                    errors.email ? "border-red-400" : "border-foreground-200 focus:border-primary-500"
                  }`}
                />
                {errors.email && (
                  <p className="text-[11px] text-red-500 mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="claimant-phone" className="block text-xs font-semibold text-foreground-700 mb-1.5">
                  {t("public.contactPhone")} <span className="text-red-500">*</span>
                </label>
                <input
                  id="claimant-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t("public.phonePlaceholder")}
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-white border text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${
                    errors.phone ? "border-red-400" : "border-foreground-200 focus:border-primary-500"
                  }`}
                />
                {errors.phone && (
                  <p className="text-[11px] text-red-500 mt-1">{errors.phone}</p>
                )}
              </div>
            </div>

            {/* Pre-filled Business Info Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="business-name" className="block text-xs font-semibold text-foreground-700 mb-1.5">
                  {t("public.businessName")}
                </label>
                <input
                  id="business-name"
                  type="text"
                  defaultValue={business.name}
                  readOnly
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background-100/70 border border-foreground-200 text-sm text-foreground-600 cursor-not-allowed"
                />
              </div>

              <div>
                <label htmlFor="business-address" className="block text-xs font-semibold text-foreground-700 mb-1.5">
                  {t("public.registeredAddress")}
                </label>
                <input
                  id="business-address"
                  type="text"
                  defaultValue={business.address}
                  readOnly
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background-100/70 border border-foreground-200 text-sm text-foreground-600 cursor-not-allowed"
                />
              </div>
            </div>

            {/* Optional Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="claimant-whatsapp" className="block text-xs font-semibold text-foreground-700 mb-1.5">
                  {t("public.whatsappOptional")}
                </label>
                <input
                  id="claimant-whatsapp"
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder={t("public.phonePlaceholder")}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-foreground-200 text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label htmlFor="claimant-website" className="block text-xs font-semibold text-foreground-700 mb-1.5">
                  {t("public.businessWebsiteOptional")}
                </label>
                <input
                  id="claimant-website"
                  type="url"
                  defaultValue={business.website}
                  readOnly
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background-100/70 border border-foreground-200 text-sm text-foreground-600 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label htmlFor="claimant-notes" className="block text-xs font-semibold text-foreground-700 mb-1.5">
                {t("public.verificationNotes")}
              </label>
              <textarea
                id="claimant-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t("public.verificationPlaceholder")}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-foreground-200 text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-500 resize-none"
              />
            </div>

            {/* Legal Agreement */}
            <div>
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-primary-500 focus:ring-primary-400 border-foreground-300"
                />
                <span className="text-xs text-foreground-600 leading-snug">
                  {t("public.authorizedConfirmation")}
                </span>
              </label>
              {errors.agreed && (
                <p className="text-[11px] text-red-500 mt-1">{errors.agreed}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-background-100">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-full border border-foreground-200 text-foreground-700 text-xs sm:text-sm font-medium hover:bg-background-50 transition-colors cursor-pointer"
              >
                {t("common.cancel")}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary-500 text-white text-xs sm:text-sm font-semibold hover:bg-primary-600 disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <i className="ri-loader-4-line animate-spin text-sm" />
                    {t("public.sending")}
                  </>
                ) : (
                  <>
                    <i className="ri-shield-check-fill text-sm" />
                    {t("public.submitClaim")}
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
