import React, { useState, useId } from "react";
import {
  Shield,
  Key,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  Check,
  Info,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";

export interface SecurityTabProps {
  onPasswordUpdated?: () => void;
}

export const SecurityTab: React.FC<SecurityTabProps> = ({ onPasswordUpdated }) => {
  const { t } = useTranslation();
  const { updatePassword } = useAuth();

  const newPasswordId = useId();
  const confirmPasswordId = useId();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Password validation criteria
  const hasMinLength = newPassword.length >= 8;
  const hasMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!newPassword) {
      setError(t("settings.enterPassword", { defaultValue: "Please enter a new password." }));
      return;
    }

    if (newPassword.length < 8) {
      setError(t("settings.passwordLength", { defaultValue: "Password must be at least 8 characters long." }));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t("settings.passwordMismatch", { defaultValue: "Passwords do not match. Please verify both fields." }));
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await updatePassword(newPassword);

      if (result.error) {
        setError(result.error.message || t("settings.passwordUpdateError", { defaultValue: "Failed to update password. Please try again." }));
        return;
      }

      setSuccess(t("settings.passwordChanged", { defaultValue: "Your password has been changed successfully. You can now use your new password to sign in." }));
      setNewPassword("");
      setConfirmPassword("");
      if (onPasswordUpdated) {
        onPasswordUpdated();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="tabpanel"
      id="tabpanel-security"
      aria-labelledby="tab-security"
      className="space-y-8"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Password Form (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200/80 space-y-6">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{t("settings.changePassword")}</h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  Update your credentials to keep your Alanya Holidays account secure
                </p>
              </div>
            </div>

            {/* Success Alert */}
            {success && (
              <div
                role="status"
                className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 shadow-sm animate-fadeIn"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold">{t("settings.success")}</p>
                  <p className="text-xs sm:text-sm text-emerald-700 mt-0.5">{success}</p>
                </div>
              </div>
            )}

            {/* Error Alert */}
            {error && (
              <div
                role="alert"
                className="flex items-start gap-3 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 shadow-sm animate-fadeIn"
              >
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold">{t("settings.passwordError")}</p>
                  <p className="text-xs sm:text-sm text-rose-700 mt-0.5">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* New Password */}
              <div className="space-y-2">
                <label
                  htmlFor={newPasswordId}
                  className="block text-sm font-medium text-slate-700"
                >
                  New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id={newPasswordId}
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t("settings.passwordPlaceholder", { defaultValue: "Enter at least 8 characters" })}
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    aria-label={t("settings.togglePassword", { defaultValue: "Toggle new password visibility" })}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label
                  htmlFor={confirmPasswordId}
                  className="block text-sm font-medium text-slate-700"
                >
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id={confirmPasswordId}
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t("settings.confirmPasswordPlaceholder", { defaultValue: "Re-enter your new password" })}
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={t("settings.toggleConfirmPassword", { defaultValue: "Toggle confirm password visibility" })}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Password Requirements Checklist */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
                <p className="text-xs font-semibold text-slate-700">{t("settings.passwordChecklist")}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center ${
                        hasMinLength
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-200 text-slate-400"
                      }`}
                    >
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                    <span className={hasMinLength ? "text-emerald-700 font-medium" : "text-slate-500"}>
                      At least 8 characters
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center ${
                        hasMatch
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-200 text-slate-400"
                      }`}
                    >
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                    <span className={hasMatch ? "text-emerald-700 font-medium" : "text-slate-500"}>
                      Passwords match
                    </span>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-sm font-semibold shadow-md shadow-amber-500/20 hover:shadow-lg transition-all cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>{t("settings.updatingPassword")}</span>
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 text-white" />
                      <span>{t("settings.updatePassword")}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Security Recommendations Sidebar (1 col) */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-md border border-white/10 space-y-4">
            <div className="flex items-center gap-2 text-amber-300">
              <Shield className="w-5 h-5" />
              <h3 className="font-semibold text-sm">{t("settings.securityRecommendations")}</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              To safeguard your luxury bookings, saved properties, and payment details:
            </p>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                <span>{t("settings.uniquePassword")}</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                <span>{t("settings.passwordMix")}</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                <span>{t("settings.neverShare")}</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 flex items-start gap-3">
            <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-slate-900">{t("settings.recoverAccount")}</h4>
              <p className="text-xs text-slate-500">
                If you encounter any issues accessing your profile, please contact our 24/7 concierge support.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
