import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function RegisterPage() {
  const [name, setName] = useState("");
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

    const cleanName = name.trim();
    const cleanEmail = email.trim();

    if (!cleanName || !cleanEmail || !password.trim() || !confirmPassword.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { user, session, error: authError } = await signUp({
        email: cleanEmail,
        password,
        fullName: cleanName,
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
        navigate("/", { replace: true });
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
          <img
            src="https://readdy.ai/api/search-image?query=Warm%20golden%20morning%20light%20over%20Alanya%20coastline%20with%20Mediterranean%20Sea%20sparkling%20beneath%20hillside%20castle%20community%20gathering%20at%20waterfront%20cafe%20terrace%20vibrant%20atmosphere%20welcoming%20Turkish%20coastal%20town%20artistic%20painterly%20style&width=1800&height=560&seq=register-hero-01&orientation=landscape"
            alt="Alanya Morning"
            className="absolute inset-0 w-full h-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-foreground-950/50 via-foreground-950/25 to-foreground-950/70"></div>

          <div className="absolute bottom-0 left-0 right-0 w-full px-4 md:px-8 lg:px-12 pb-8">
            <div className="flex items-center gap-2 mb-3">
              <Link to="/" className="text-white/60 hover:text-white/90 text-sm transition-colors underline underline-offset-2">
                Home
              </Link>
              <i className="ri-arrow-right-s-line text-white/40 text-sm"></i>
              <span className="text-white/90 text-sm">Register</span>
            </div>
            <h1 className="font-heading text-3xl md:text-4xl text-white">Check Your Inbox</h1>
            <p className="text-white/65 text-sm md:text-base mt-1 max-w-md">
              We&apos;ve sent a confirmation link to finalize your registration
            </p>
          </div>
        </section>

        <section className="w-full max-w-md mx-auto px-4 -mt-8 relative z-10 pb-20">
          <div className="bg-background-50 rounded-2xl p-6 md:p-8 border border-background-200/70 text-center">
            <div className="w-16 h-16 mx-auto mb-5 flex items-center justify-center rounded-full bg-primary-100">
              <i className="ri-mail-check-line text-2xl text-primary-600"></i>
            </div>
            <h2 className="font-heading text-xl text-foreground-900 mb-2">Confirm your email</h2>
            <p className="text-sm text-foreground-500 mb-2">
              We have sent a verification link to:
            </p>
            <p className="text-sm font-medium text-foreground-800 mb-6">{email}</p>
            <p className="text-xs text-foreground-400 mb-6 leading-relaxed">
              Please click the link in that email to activate your account. If you don&apos;t see it, check your spam or junk folder.
            </p>
            <Link
              to="/login"
              className="block w-full h-11 flex items-center justify-center rounded-full bg-primary-500 text-background-50 text-sm font-medium hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap"
            >
              Go to Sign In
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
        <img
          src="https://readdy.ai/api/search-image?query=Warm%20golden%20morning%20light%20over%20Alanya%20coastline%20with%20Mediterranean%20Sea%20sparkling%20beneath%20hillside%20castle%20community%20gathering%20at%20waterfront%20cafe%20terrace%20vibrant%20atmosphere%20welcoming%20Turkish%20coastal%20town%20artistic%20painterly%20style&width=1800&height=560&seq=register-hero-01&orientation=landscape"
          alt="Alanya Morning"
          className="absolute inset-0 w-full h-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-foreground-950/50 via-foreground-950/25 to-foreground-950/70"></div>

        <div className="absolute bottom-0 left-0 right-0 w-full px-4 md:px-8 lg:px-12 pb-8">
          <div className="flex items-center gap-2 mb-3">
            <Link to="/" className="text-white/60 hover:text-white/90 text-sm transition-colors underline underline-offset-2">
              Home
            </Link>
            <i className="ri-arrow-right-s-line text-white/40 text-sm"></i>
            <span className="text-white/90 text-sm">Register</span>
          </div>
          <h1 className="font-heading text-3xl md:text-4xl text-white">Join the Community</h1>
          <p className="text-white/65 text-sm md:text-base mt-1 max-w-md">
            Create your account and start connecting with locals and expats in Alanya
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
                className="px-6 py-2 rounded-full text-sm font-medium text-foreground-500 hover:text-foreground-700 transition-colors cursor-pointer"
              >
                Sign In
              </Link>
              <span className="px-6 py-2 rounded-full text-sm font-medium bg-background-50 text-foreground-900 cursor-pointer">
                Register
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
                Full name
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
                  placeholder="Your full name"
                  className="w-full h-11 pl-10 pr-4 rounded-lg bg-background-50 border border-background-200 text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="register-email" className="block text-sm font-medium text-foreground-700 mb-1.5">
                Email address
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
                  placeholder="you@example.com"
                  className="w-full h-11 pl-10 pr-4 rounded-lg bg-background-50 border border-background-200 text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="register-password" className="block text-sm font-medium text-foreground-700 mb-1.5">
                Password
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
                  placeholder="At least 8 characters"
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
                Must be at least 8 characters
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="register-confirm-password" className="block text-sm font-medium text-foreground-700 mb-1.5">
                Confirm password
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
                  placeholder="Re-enter your password"
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
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-background-200"></div>
            <span className="text-xs text-foreground-400">or sign up with</span>
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

          {/* Login Link */}
          <p className="text-center text-sm text-foreground-500 mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-primary-500 hover:text-primary-600 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}