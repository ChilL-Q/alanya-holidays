import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  businessRegistrationSchema,
  registerSchema,
} from "@/lib/validation/auth.schemas";
import PageHeroImage from "@/components/base/PageHeroImage";
import { useTranslation } from "react-i18next";

export type RegistrationVariant = "regular" | "business";

interface RegistrationPageProps {
  variant?: RegistrationVariant;
}

export default function RegistrationPage({ variant = "regular" }: RegistrationPageProps) {
  const { t } = useTranslation();
  const isBusiness = variant === "business";
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessAccountType, setBusinessAccountType] = useState("seller");
  const [contactPhone, setContactPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSocialSubmitting, setIsSocialSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  const { signUp, signInWithOAuth } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    const validation = registerSchema.safeParse({
      name,
      email,
      password,
      confirmPassword,
    });

    if (!validation.success) {
      setError(validation.error.issues[0]?.message || "Please fill in all fields.");
      return;
    }

    const { name: cleanName, email: cleanEmail } = validation.data;
    const businessValidation = isBusiness
      ? businessRegistrationSchema.safeParse({
          businessName,
          accountType: businessAccountType,
          contactPhone,
          website,
        })
      : null;

    if (businessValidation && !businessValidation.success) {
      setError(businessValidation.error.issues[0]?.message || "Please check your business details.");
      return;
    }

    setIsSubmitting(true);

    try {
      const businessDetails = businessValidation?.success
        ? businessValidation.data
        : null;
      const metadata = businessDetails
        ? {
            registration_path: "business",
            company_name: businessDetails.businessName,
            business_name: businessDetails.businessName,
            account_type: businessDetails.accountType,
            contact_email: cleanEmail,
            ...(businessDetails.contactPhone ? { contact_phone: businessDetails.contactPhone } : {}),
            ...(businessDetails.website ? { website: businessDetails.website } : {}),
          }
        : undefined;
      const basePath = import.meta.env.BASE_URL.replace(/\/+$/, "");
      const emailRedirectTo = isBusiness && typeof window !== "undefined"
        ? `${window.location.origin}${basePath}/business/dashboard`
        : undefined;

      const { user, session, error: authError } = await signUp({
        email: cleanEmail,
        password,
        fullName: cleanName,
        ...(metadata ? { metadata } : {}),
        ...(emailRedirectTo ? { emailRedirectTo } : {}),
      });

      if (authError) {
        setError(authError.message || "Failed to create account. Please try again.");
        return;
      }

      if (user && !session) {
        // Email confirmation is required by Supabase project settings
        setNeedsConfirmation(true);
      } else {
        // Auto-logged in
        navigate(isBusiness ? "/business/dashboard" : "/", { replace: true });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOAuth = async (provider: "google" | "facebook") => {
    setError("");
    setIsSocialSubmitting(true);
    try {
      const { error: authError } = await signInWithOAuth(provider);
      if (authError) {
        setError(authError.message || `Failed to sign in with ${provider}.`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : `Failed to sign in with ${provider}.`;
      setError(message);
    } finally {
      setIsSocialSubmitting(false);
    }
  };

  if (needsConfirmation) {
    return (
      <main className="min-h-screen bg-background-50">
        <section className="relative w-full h-[220px] md:h-[280px] overflow-hidden">
          <PageHeroImage
            page="register"
            alt="Alanya Morning"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-foreground-950/50 via-foreground-950/25 to-foreground-950/70"></div>

          <div className="absolute bottom-0 left-0 right-0 w-full px-4 md:px-8 lg:px-12 pb-8">
            <div className="flex items-center gap-2 mb-3">
              <Link to="/" className="text-white/60 hover:text-white/90 text-sm transition-colors underline underline-offset-2">
                {t("nav.home", "Home")}
              </Link>
              <i className="ri-arrow-right-s-line text-white/40 text-sm"></i>
              <span className="text-white/90 text-sm">{isBusiness ? t("auth.businessRegistration", "Business Registration") : t("nav.register", "Register")}</span>
            </div>
            <h1 className="font-heading text-3xl md:text-4xl text-white">{t("auth.checkYourInbox", "Check Your Inbox")}</h1>
            <p className="text-white/65 text-sm md:text-base mt-1 max-w-md">
              {isBusiness
                ? t("auth.businessConfirmation", "We’ve sent a confirmation link to continue setting up your business account")
                : t("auth.registrationConfirmation", "We’ve sent a confirmation link to finalize your registration")}
            </p>
          </div>
        </section>

        <section className="w-full max-w-md mx-auto px-4 -mt-8 relative z-10 pb-20">
          <div className="bg-background-50 rounded-2xl p-6 md:p-8 border border-background-200/70 text-center">
            <div className="w-16 h-16 mx-auto mb-5 flex items-center justify-center rounded-full bg-primary-100">
              <i className="ri-mail-check-line text-2xl text-primary-600"></i>
            </div>
            <h2 className="font-heading text-xl text-foreground-900 mb-2">
              {isBusiness ? t("auth.confirmBusinessEmail", "Confirm your business account email") : t("auth.confirmEmail", "Confirm your email")}
            </h2>
            <p className="text-sm text-foreground-500 mb-2">
              {t("auth.verificationLinkSent", "We have sent a verification link to:")}
            </p>
            <p className="text-sm font-medium text-foreground-800 mb-6">{email}</p>
            <p className="text-xs text-foreground-400 mb-6 leading-relaxed">
              {t("auth.verificationHelp", "Please click the link in that email to activate your account. If you don't see it, check your spam or junk folder.")}
            </p>
            <Link
              to="/login"
              state={isBusiness ? { from: { pathname: "/business/dashboard" } } : undefined}
              className="w-full h-11 flex items-center justify-center rounded-full bg-primary-500 text-background-50 text-sm font-medium hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap"
            >
              {t("auth.goToSignIn", "Go to Sign In")}
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background-50">
      {/* Hero */}
      <section className="relative w-full h-[220px] md:h-[280px] overflow-hidden">
        <PageHeroImage
          page="register"
          alt="Alanya Morning"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-foreground-950/50 via-foreground-950/25 to-foreground-950/70"></div>

        <div className="absolute bottom-0 left-0 right-0 w-full px-4 md:px-8 lg:px-12 pb-8">
          <div className="flex items-center gap-2 mb-3">
            <Link to="/" className="text-white/60 hover:text-white/90 text-sm transition-colors underline underline-offset-2">
              {t("nav.home", "Home")}
            </Link>
            <i className="ri-arrow-right-s-line text-white/40 text-sm"></i>
            <span className="text-white/90 text-sm">{isBusiness ? t("auth.businessRegistration", "Business Registration") : t("nav.register", "Register")}</span>
          </div>
          <h1 className="font-heading text-3xl md:text-4xl text-white">
            {isBusiness ? t("auth.createBusinessAccount", "Create Your Business Account") : t("auth.joinCommunity", "Join the Community")}
          </h1>
          <p className="text-white/65 text-sm md:text-base mt-1 max-w-md">
            {isBusiness
              ? t("auth.businessSubtitle", "Join the Alanya Holidays merchant community and manage your business")
              : t("auth.registerSubtitle", "Create your account and start connecting with locals and expats in Alanya")}
          </p>
        </div>
      </section>

      {/* Form Section */}
      <section className="w-full max-w-md mx-auto px-4 -mt-8 relative z-10 pb-20">
        <div className="bg-background-50 rounded-2xl p-6 md:p-8 border border-background-200/70">
          {/* Tab Switcher */}
          <div className="flex items-center justify-center mb-8">
            <div className="inline-flex items-center bg-background-100 rounded-full px-1 py-1">
              <Link
                to="/login"
                state={isBusiness ? { from: { pathname: "/business/dashboard" } } : undefined}
                className="px-6 py-2 rounded-full text-sm font-medium text-foreground-500 hover:text-foreground-700 transition-colors cursor-pointer"
              >
                {t("nav.signIn", "Sign In")}
              </Link>
              <span className="px-6 py-2 rounded-full text-sm font-medium bg-background-50 text-foreground-900 cursor-pointer">
                {t("nav.register", "Register")}
              </span>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-accent-100/70 border border-accent-300/50 mb-5">
              <i className="ri-error-warning-line text-accent-600 text-sm"></i>
              <p className="text-sm text-accent-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label htmlFor="register-name" className="block text-sm font-medium text-foreground-700 mb-1.5">
                {isBusiness ? t("auth.representativeName", "Representative full name") : t("auth.fullName", "Full name")}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                  <i className="ri-user-line text-foreground-400 text-sm"></i>
                </div>
                <input
                  id="register-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={isBusiness ? t("auth.representativeName") : t("auth.fullNamePlaceholder")}
                  className="w-full h-11 pl-10 pr-4 rounded-lg bg-background-50 border border-background-200 text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                />
              </div>
            </div>

            {isBusiness && (
              <>
                <div>
                  <label htmlFor="register-business-name" className="block text-sm font-medium text-foreground-700 mb-1.5">
                    {t("auth.businessName", "Business name")}
                  </label>
                  <input id="register-business-name" required value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder={t("auth.businessNamePlaceholder")} className="w-full h-11 px-4 rounded-lg bg-background-50 border border-background-200 text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all" />
                </div>
                <div>
                    <label htmlFor="register-account-type" className="block text-sm font-medium text-foreground-700 mb-1.5">{t("auth.accountType", "Account type")}</label>
                  <select id="register-account-type" required value={businessAccountType} onChange={(e) => setBusinessAccountType(e.target.value)} className="w-full h-11 px-4 rounded-lg bg-background-50 border border-background-200 text-sm text-foreground-900 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all">
                    <option value="seller">{t("auth.seller", "Seller")}</option>
                    <option value="service_provider">{t("auth.serviceProvider", "Service provider")}</option>
                    <option value="property_host">{t("auth.propertyHost", "Property host")}</option>
                    <option value="directory_owner">{t("auth.directoryOwner", "Directory owner")}</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="register-contact-phone" className="block text-sm font-medium text-foreground-700 mb-1.5">{t("auth.contactPhone", "Contact phone")} <span className="text-foreground-400">{t("auth.optional", "(optional)")}</span></label>
                  <input id="register-contact-phone" type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder={t("auth.phonePlaceholder")} className="w-full h-11 px-4 rounded-lg bg-background-50 border border-background-200 text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all" />
                </div>
                <div>
                  <label htmlFor="register-website" className="block text-sm font-medium text-foreground-700 mb-1.5">{t("auth.website", "Website")} <span className="text-foreground-400">{t("auth.optional", "(optional)")}</span></label>
                  <input id="register-website" type="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder={t("auth.websitePlaceholder")} className="w-full h-11 px-4 rounded-lg bg-background-50 border border-background-200 text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all" />
                </div>
              </>
            )}

            {/* Email */}
            <div>
              <label htmlFor="register-email" className="block text-sm font-medium text-foreground-700 mb-1.5">
                {t("auth.email", "Email address")}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                  <i className="ri-mail-line text-foreground-400 text-sm"></i>
                </div>
                <input
                  id="register-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("auth.emailPlaceholder")}
                  className="w-full h-11 pl-10 pr-4 rounded-lg bg-background-50 border border-background-200 text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="register-password" className="block text-sm font-medium text-foreground-700 mb-1.5">
                {t("auth.password", "Password")}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                  <i className="ri-lock-line text-foreground-400 text-sm"></i>
                </div>
                <input
                  id="register-password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("auth.passwordRequirementPlaceholder")}
                  className="w-full h-11 pl-10 pr-11 rounded-lg bg-background-50 border border-background-200 text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <i
                    className={`text-foreground-400 hover:text-foreground-600 text-sm transition-colors ${
                      showPassword ? "ri-eye-off-line" : "ri-eye-line"
                    }`}
                  ></i>
                </button>
              </div>
              <p className="text-xs text-foreground-400 mt-1.5">
                {t("auth.passwordRequirement", "Must be at least 8 characters")}
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="register-confirm-password" className="block text-sm font-medium text-foreground-700 mb-1.5">
                {t("auth.confirmPassword", "Confirm password")}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                  <i className="ri-lock-line text-foreground-400 text-sm"></i>
                </div>
                <input
                  id="register-confirm-password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t("auth.confirmPasswordPlaceholder")}
                  className="w-full h-11 pl-10 pr-4 rounded-lg bg-background-50 border border-background-200 text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting || isSocialSubmitting}
              className="w-full h-11 flex items-center justify-center gap-2 rounded-full bg-primary-500 text-background-50 text-sm font-medium hover:bg-primary-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
            >
              {isSubmitting ? (
                <>
                  <i className="ri-loader-4-line animate-spin text-sm"></i>
                  {t("auth.creatingAccount", "Creating account...")}
                </>
              ) : (
                isBusiness ? t("auth.createBusinessAccount", "Create Business Account") : t("auth.registerBtn", "Create Account")
              )}
            </button>
          </form>

          {!isBusiness && (
            <>
          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-background-200"></div>
            <span className="text-xs text-foreground-400">{t("auth.orSignUpWith", "or sign up with")}</span>
            <div className="flex-1 h-px bg-background-200"></div>
          </div>

          {/* Social Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              disabled={isSubmitting || isSocialSubmitting}
              onClick={() => handleOAuth("google")}
              className="flex-1 flex items-center justify-center gap-2 h-11 rounded-full border border-background-200 text-sm font-medium text-foreground-700 hover:bg-background-100 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-60"
            >
              <i className="ri-google-fill text-foreground-700"></i>
              Google
            </button>
            <button
              type="button"
              disabled={isSubmitting || isSocialSubmitting}
              onClick={() => handleOAuth("facebook")}
              className="flex-1 flex items-center justify-center gap-2 h-11 rounded-full border border-background-200 text-sm font-medium text-foreground-700 hover:bg-background-100 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-60"
            >
              <i className="ri-facebook-fill text-foreground-700"></i>
              Facebook
            </button>
          </div>
            </>
          )}

          {/* Login Link */}
          <p className="text-center text-sm text-foreground-500 mt-6">
            {t("auth.alreadyHaveAccount", "Already have an account?")} {" "}
            <Link
              to="/login"
              state={isBusiness ? { from: { pathname: "/business/dashboard" } } : undefined}
              className="text-primary-500 hover:text-primary-600 font-medium transition-colors">
              {t("nav.signIn", "Sign in")}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
