import { useState, FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { forgotPasswordSchema } from "@/lib/validation/auth.schemas";
import PageHeroImage from "@/components/base/PageHeroImage";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const { resetPassword } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    const validation = forgotPasswordSchema.safeParse({ email });
    if (!validation.success) {
      setError(validation.error.issues[0]?.message || "Please enter your email address.");
      return;
    }

    const cleanEmail = validation.data.email;

    setIsSubmitting(true);

    try {
      const { error: authError } = await resetPassword(cleanEmail);
      if (authError) {
        setError(authError.message || "Failed to send reset link. Please try again.");
        return;
      }
      setSent(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (sent) {
    return (
      <main className="min-h-screen bg-background-50">
        {/* Hero */}
        <section className="relative w-full h-[220px] md:h-[280px] overflow-hidden">
          <PageHeroImage
            page="forgotPassword"
            alt="Alanya Serene Sunset"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-foreground-950/50 via-foreground-950/25 to-foreground-950/70"></div>

          <div className="absolute bottom-0 left-0 right-0 w-full px-4 md:px-8 lg:px-12 pb-8">
            <div className="flex items-center gap-2 mb-3">
              <Link to="/" className="text-white/60 hover:text-white/90 text-sm transition-colors underline underline-offset-2">
                Home
              </Link>
              <i className="ri-arrow-right-s-line text-white/40 text-sm"></i>
              <span className="text-white/90 text-sm">Reset Password</span>
            </div>
            <h1 className="font-heading text-3xl md:text-4xl text-white">Check Your Email</h1>
            <p className="text-white/65 text-sm md:text-base mt-1 max-w-md">
              If an account exists, we&apos;ve sent a reset link
            </p>
          </div>
        </section>

        {/* Success State */}
        <section className="w-full max-w-md mx-auto px-4 -mt-8 relative z-10 pb-20">
          <div className="bg-background-50 rounded-2xl p-6 md:p-8 border border-background-200/70 text-center">
            <div className="w-16 h-16 mx-auto mb-5 flex items-center justify-center rounded-full bg-accent-100">
              <i className="ri-mail-send-line text-2xl text-accent-600"></i>
            </div>

            <h2 className="font-heading text-xl text-foreground-900 mb-2">Reset link sent</h2>
            <p className="text-sm text-foreground-500 mb-2">
              We&apos;ve sent a password reset link to
            </p>
            <p className="text-sm font-medium text-foreground-800 mb-6">{email}</p>
            <p className="text-xs text-foreground-400 mb-6 leading-relaxed">
              Didn&apos;t get it? Check your spam folder or try a different email.
              The link expires in 30 minutes.
            </p>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => { setSent(false); setEmail(""); }}
                className="w-full h-11 flex items-center justify-center gap-2 rounded-full border border-background-200 text-sm font-medium text-foreground-700 hover:bg-background-100 transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="ri-arrow-left-line text-sm"></i>
                Try a different email
              </button>
              <Link
                to="/login"
                className="w-full h-11 flex items-center justify-center rounded-full bg-primary-500 text-background-50 text-sm font-medium hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap"
              >
                Back to Sign In
              </Link>
            </div>
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
          page="forgotPassword"
          alt="Alanya Serene Sunset"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-foreground-950/50 via-foreground-950/25 to-foreground-950/70"></div>

        <div className="absolute bottom-0 left-0 right-0 w-full px-4 md:px-8 lg:px-12 pb-8">
          <div className="flex items-center gap-2 mb-3">
            <Link to="/" className="text-white/60 hover:text-white/90 text-sm transition-colors underline underline-offset-2">
              Home
            </Link>
            <i className="ri-arrow-right-s-line text-white/40 text-sm"></i>
            <span className="text-white/90 text-sm">Reset Password</span>
          </div>
          <h1 className="font-heading text-3xl md:text-4xl text-white">Forgot Password?</h1>
          <p className="text-white/65 text-sm md:text-base mt-1 max-w-md">
            No worries — enter your email and we&apos;ll send you a reset link
          </p>
        </div>
      </section>

      {/* Form Section */}
      <section className="w-full max-w-md mx-auto px-4 -mt-8 relative z-10 pb-20">
        <div className="bg-background-50 rounded-2xl p-6 md:p-8 border border-background-200/70">
          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto mb-4 flex items-center justify-center rounded-full bg-accent-100">
              <i className="ri-key-2-line text-xl text-accent-600"></i>
            </div>
            <h2 className="font-heading text-xl text-foreground-900 mb-1">Reset your password</h2>
            <p className="text-sm text-foreground-500">
              Enter the email associated with your account and we&apos;ll send you a link to reset your password.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-accent-100/70 border border-accent-300/50 mb-5">
              <i className="ri-error-warning-line text-accent-600 text-sm"></i>
              <p className="text-sm text-accent-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="reset-email" className="block text-sm font-medium text-foreground-700 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                  <i className="ri-mail-line text-foreground-400 text-sm"></i>
                </div>
                <input
                  id="reset-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full h-11 pl-10 pr-4 rounded-lg bg-background-50 border border-background-200 text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 flex items-center justify-center gap-2 rounded-full bg-primary-500 text-background-50 text-sm font-medium hover:bg-primary-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
            >
              {isSubmitting ? (
                <>
                  <i className="ri-loader-4-line animate-spin text-sm"></i>
                  Sending link...
                </>
              ) : (
                "Send Reset Link"
              )}
            </button>
          </form>

          <div className="text-center mt-6">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm text-foreground-500 hover:text-foreground-700 transition-colors"
            >
              <i className="ri-arrow-left-line text-sm"></i>
              Back to Sign In
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}