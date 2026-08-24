import { useState, FormEvent } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { loginSchema } from "@/lib/validation/auth.schemas";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSocialSubmitting, setIsSocialSubmitting] = useState(false);
  const [error, setError] = useState("");

  const { signIn, signInWithOAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = (location.state as { from?: { pathname: string } })?.from?.pathname || "/";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    const validation = loginSchema.safeParse({
      email,
      password,
      rememberMe,
    });

    if (!validation.success) {
      setError(validation.error.issues[0]?.message || "Please fill in all fields.");
      return;
    }

    const cleanEmail = validation.data.email;

    setIsSubmitting(true);

    try {
      const { error: authError } = await signIn(cleanEmail, password);
      if (authError) {
        setError(authError.message || "Failed to sign in. Please check your credentials.");
        return;
      }

      navigate(redirectPath, { replace: true });
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

  return (
    <main className="min-h-screen bg-background-50">
      {/* Hero */}
      <section className="relative w-full h-[220px] md:h-[280px] overflow-hidden">
        <img
          src="/images/placeholder-business.svg"
          alt="Alanya Sunset"
          className="absolute inset-0 w-full h-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-foreground-950/50 via-foreground-950/25 to-foreground-950/70"></div>

        <div className="absolute bottom-0 left-0 right-0 w-full px-4 md:px-8 lg:px-12 pb-8">
          <div className="flex items-center gap-2 mb-3">
            <Link to="/" className="text-white/60 hover:text-white/90 text-sm transition-colors underline underline-offset-2">
              Home
            </Link>
            <i className="ri-arrow-right-s-line text-white/40 text-sm"></i>
            <span className="text-white/90 text-sm">Sign In</span>
          </div>
          <h1 className="font-heading text-3xl md:text-4xl text-white">Welcome Back</h1>
          <p className="text-white/65 text-sm md:text-base mt-1 max-w-md">
            Sign in to continue your journey with the Alanya community
          </p>
        </div>
      </section>

      {/* Form Section */}
      <section className="w-full max-w-md mx-auto px-4 -mt-8 relative z-10 pb-20">
        <div className="bg-background-50 rounded-2xl p-6 md:p-8 border border-background-200/70">
          {/* Tab Switcher */}
          <div className="flex items-center justify-center mb-8">
            <div className="inline-flex items-center bg-background-100 rounded-full px-1 py-1">
              <span className="px-6 py-2 rounded-full text-sm font-medium bg-background-50 text-foreground-900 cursor-pointer">
                Sign In
              </span>
              <Link
                to="/register"
                className="px-6 py-2 rounded-full text-sm font-medium text-foreground-500 hover:text-foreground-700 transition-colors cursor-pointer"
              >
                Register
              </Link>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-accent-100/70 border border-accent-300/50 mb-5">
              <i className="ri-error-warning-line text-accent-600 text-sm"></i>
              <p className="text-sm text-accent-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-foreground-700 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                  <i className="ri-mail-line text-foreground-400 text-sm"></i>
                </div>
                <input
                  id="login-email"
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
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className="block text-sm font-medium text-foreground-700">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-primary-500 hover:text-primary-600 transition-colors cursor-pointer"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                  <i className="ri-lock-line text-foreground-400 text-sm"></i>
                </div>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
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
            </div>

            {/* Remember Me */}
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-foreground-300 text-primary-500 focus:ring-primary-300 cursor-pointer"
              />
              <span className="text-sm text-foreground-600">Remember me</span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting || isSocialSubmitting}
              className="w-full h-11 flex items-center justify-center gap-2 rounded-full bg-primary-500 text-background-50 text-sm font-medium hover:bg-primary-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
            >
              {isSubmitting ? (
                <>
                  <i className="ri-loader-4-line animate-spin text-sm"></i>
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-background-200"></div>
            <span className="text-xs text-foreground-400">or continue with</span>
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

          {/* Register Link */}
          <p className="text-center text-sm text-foreground-500 mt-6">
            Don&apos;t have an account?{" "}
            <Link to="/register" className="text-primary-500 hover:text-primary-600 font-medium transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}