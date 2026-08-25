import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { adminService } from "@/api-services/admin.service";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [submitStatus, setSubmitStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleNewsletterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSubmitStatus("loading");
    if (timerRef.current) clearTimeout(timerRef.current);

    try {
      await adminService.submitEnquiry({
        name: "Newsletter Subscriber",
        email: email.trim(),
        subject: "Newsletter Subscription",
        message: `Newsletter subscription request from ${email.trim()}`,
        enquiry_type: "newsletter",
      });
      setSubmitStatus("success");
      setEmail("");
      timerRef.current = setTimeout(() => setSubmitStatus("idle"), 4000);
    } catch {
      setSubmitStatus("error");
      timerRef.current = setTimeout(() => setSubmitStatus("idle"), 4000);
    }
  };

  const footerLinks = {
    explore: [
      { label: "Travel & Vacation", href: "/category/travel-vacation" },
      { label: "Beaches & Nature", href: "/category/beaches-nature" },
      { label: "Food & Nightlife", href: "/category/food-nightlife" },
      { label: "Things to Do", href: "/category/things-to-do" },
      { label: "Expats & Nomads", href: "/category/expats-nomads" },
      { label: "Real Estate", href: "/category/real-estate" },
    ],
    community: [
      { label: "Start a Discussion", href: "/new-thread" },
      { label: "Events", href: "/events" },
      { label: "Marketplace", href: "/category/marketplace" },
      { label: "Support", href: "/help" },
    ],
  };

  return (
    <footer className="bg-foreground-900 rounded-t-2xl mx-2 md:mx-4 mt-8">
      <div className="w-full px-6 md:px-10 lg:px-16 py-12 md:py-16">
        {/* Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 mb-12">
          {/* Left - Brand */}
          <div className="md:col-span-1">
            <h3 className="font-heading text-3xl md:text-4xl text-white mb-4">
              Alanya Holidays
            </h3>
            <p className="text-white/60 text-sm leading-relaxed mb-8">
              The community for travelers, expats, and locals. Discover,
              connect, and share your Alanya story.
            </p>
            {/* Newsletter */}
            <form
              onSubmit={handleNewsletterSubmit}
              className="space-y-3"
            >
              <p className="text-white/80 text-sm font-medium">
                Stay updated
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  name="email"
                  placeholder="Your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1 bg-transparent border-b border-white/30 text-white placeholder:text-white/40 text-sm py-2 focus:outline-none focus:border-white/60"
                />
              </div>
              <button
                type="submit"
                disabled={submitStatus === "loading"}
                className="inline-flex items-center gap-2 px-5 py-2 bg-white text-foreground-900 rounded-full text-sm font-medium hover:bg-white/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
              >
                {submitStatus === "loading" ? (
                  <>
                    <i className="ri-loader-4-line animate-spin"></i>
                    Subscribing...
                  </>
                ) : (
                  <>
                    Subscribe
                    <i className="ri-arrow-right-line"></i>
                  </>
                )}
              </button>

              {/* Status Messages */}
              {submitStatus === "success" && (
                <p className="text-green-400 text-xs flex items-center gap-1">
                  <i className="ri-check-line"></i>
                  You're subscribed! Check your inbox.
                </p>
              )}
              {submitStatus === "error" && (
                <p className="text-red-400 text-xs flex items-center gap-1">
                  <i className="ri-error-warning-line"></i>
                  Something went wrong. Please try again.
                </p>
              )}
            </form>
          </div>

          {/* Middle - Explore */}
          <div>
            <h4 className="text-white/80 text-sm font-semibold uppercase tracking-wider mb-4">
              Explore
            </h4>
            <ul className="space-y-3">
              {footerLinks.explore.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-white/60 text-sm hover:text-white transition-colors underline underline-offset-2"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Right - Community & Stats */}
          <div>
            <h4 className="text-white/80 text-sm font-semibold uppercase tracking-wider mb-4">
              Community
            </h4>
            <ul className="space-y-3 mb-8">
              {footerLinks.community.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-white/60 text-sm hover:text-white transition-colors underline underline-offset-2"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <h4 className="text-white/80 text-sm font-semibold uppercase tracking-wider mb-4">
              Contact
            </h4>
            <p className="text-white/60 text-sm">
              contact@alanyaholidays.com
            </p>
            <p className="text-white/60 text-sm">
              Alanya, Antalya, Türkiye
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Social */}
          <div className="flex items-center gap-4">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/60 hover:text-white transition-colors"
            >
              <i className="ri-instagram-line text-lg"></i>
            </a>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/60 hover:text-white transition-colors"
            >
              <i className="ri-facebook-line text-lg"></i>
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/60 hover:text-white transition-colors"
            >
              <i className="ri-twitter-x-line text-lg"></i>
            </a>
          </div>

          {/* Copyright */}
          <p className="text-white/40 text-xs text-center">
            © 2026 Alanya Holidays. All rights reserved.
          </p>

          {/* Legal */}
          <div className="flex items-center gap-4">
            <Link
              to="/privacy"
              className="text-white/60 text-xs hover:text-white transition-colors underline"
            >
              Privacy
            </Link>
            <Link
              to="/terms"
              className="text-white/60 text-xs hover:text-white transition-colors underline"
            >
              Terms
            </Link>
            <Link
              to="/admin"
              className="text-white/60 text-xs hover:text-white transition-colors underline"
            >
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}