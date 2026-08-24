import { useState, useRef } from "react";
import { adminService } from "@/api-services/admin.service";

const COUNTRY_CODES = [
  { code: "+90", flag: "🇹🇷", country: "Turkey" },
  { code: "+44", flag: "🇬🇧", country: "UK" },
  { code: "+1", flag: "🇺🇸", country: "US/Canada" },
  { code: "+49", flag: "🇩🇪", country: "Germany" },
  { code: "+33", flag: "🇫🇷", country: "France" },
  { code: "+7", flag: "🇷🇺", country: "Russia" },
  { code: "+31", flag: "🇳🇱", country: "Netherlands" },
  { code: "+46", flag: "🇸🇪", country: "Sweden" },
  { code: "+47", flag: "🇳🇴", country: "Norway" },
  { code: "+45", flag: "🇩🇰", country: "Denmark" },
  { code: "+358", flag: "🇫🇮", country: "Finland" },
  { code: "+380", flag: "🇺🇦", country: "Ukraine" },
  { code: "+966", flag: "🇸🇦", country: "Saudi Arabia" },
  { code: "+971", flag: "🇦🇪", country: "UAE" },
  { code: "+974", flag: "🇶🇦", country: "Qatar" },
  { code: "+39", flag: "🇮🇹", country: "Italy" },
  { code: "+34", flag: "🇪🇸", country: "Spain" },
  { code: "+30", flag: "🇬🇷", country: "Greece" },
  { code: "+48", flag: "🇵🇱", country: "Poland" },
  { code: "+40", flag: "🇷🇴", country: "Romania" },
];

const PRODUCT_CATEGORIES = [
  "Clothing & Apparel",
  "Home Decor & Ceramics",
  "Turkish Delight & Food",
  "Textiles & Towels",
  "Leather Goods",
  "Jewelry & Accessories",
  "Gift Items",
  "Travel Experiences",
  "Something Else — Describe Below",
];

const CATEGORY_BUDGET_CONFIG: Record<string, { label: string; ranges: string[] }> = {
  "Clothing & Apparel": {
    label: "Clothing & Apparel",
    ranges: ["$100 – $300", "$300 – $800", "$800 – $1,500", "$1,500 – $3,000", "$3,000+", "Not Sure / Flexible"],
  },
  "Home Decor & Ceramics": {
    label: "Home Decor & Ceramics",
    ranges: ["$100 – $300", "$300 – $800", "$800 – $1,500", "$1,500 – $3,000", "$3,000+", "Not Sure / Flexible"],
  },
  "Turkish Delight & Food": {
    label: "Turkish Delight & Food",
    ranges: ["$50 – $150", "$150 – $400", "$400 – $800", "$800 – $1,500", "$1,500+", "Not Sure / Flexible"],
  },
  "Textiles & Towels": {
    label: "Textiles & Towels",
    ranges: ["$50 – $200", "$200 – $500", "$500 – $1,000", "$1,000 – $2,000", "$2,000+", "Not Sure / Flexible"],
  },
  "Leather Goods": {
    label: "Leather Goods",
    ranges: ["$200 – $500", "$500 – $1,200", "$1,200 – $2,500", "$2,500 – $5,000", "$5,000+", "Not Sure / Flexible"],
  },
  "Jewelry & Accessories": {
    label: "Jewelry & Accessories",
    ranges: ["$150 – $500", "$500 – $1,500", "$1,500 – $3,000", "$3,000 – $6,000", "$6,000+", "Not Sure / Flexible"],
  },
  "Gift Items": {
    label: "Gift Items",
    ranges: ["$50 – $150", "$150 – $400", "$400 – $800", "$800 – $1,500", "$1,500+", "Not Sure / Flexible"],
  },
  "Travel Experiences": {
    label: "Travel Experiences",
    ranges: ["$500 – $1,500", "$1,500 – $3,000", "$3,000 – $6,000", "$6,000 – $12,000", "$12,000+", "Not Sure / Flexible"],
  },
  "Something Else — Describe Below": {
    label: "Something Else",
    ranges: ["Under $100", "$100 – $500", "$500 – $1,000", "$1,000 – $3,000", "$3,000+", "Not Sure / Flexible"],
  },
};

const DEFAULT_BUDGETS = ["Under $100", "$100 – $500", "$500 – $1,000", "$1,000 – $3,000", "$3,000+", "Not Sure / Flexible"];

const CONTACT_METHODS = [
  { value: "whatsapp", label: "WhatsApp", icon: "ri-whatsapp-line" },
  { value: "email", label: "Email", icon: "ri-mail-line" },
  { value: "phone", label: "Phone Call", icon: "ri-phone-line" },
];

const TIMELINES = [
  "ASAP — Within 24 Hours",
  "This Week",
  "This Month",
  "Flexible — No Rush",
];

export default function PersonalShopperForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("+90");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState("");
  const [budget, setBudget] = useState("");
  const [contactMethod, setContactMethod] = useState("whatsapp");
  const [timeline, setTimeline] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setCategory("");
    setBudget("");
    setContactMethod("whatsapp");
    setTimeline("");
    setDetails("");
  };

  const budgetOptions = category && CATEGORY_BUDGET_CONFIG[category]
    ? CATEGORY_BUDGET_CONFIG[category].ranges
    : DEFAULT_BUDGETS;

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCategory(e.target.value);
    setBudget("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;

    const form = e.currentTarget;
    const formData = new FormData(form);

    // Honeypot check
    const honeypotVal = (formData.get("phone_alt") as string || "").trim();
    if (honeypotVal) {
      setStatus({ type: "success", message: "Your enquiry has been submitted! We'll get back to you shortly." });
      resetForm();
      return;
    }

    setSubmitting(true);
    setStatus(null);

    const phoneFull = phone.trim() ? `${countryCode} ${phone.trim()}` : "";
    const subject = `Personal Shopper Request — ${category || "General Enquiry"}`;
    const messageBody = [
      `What They're Looking For: ${category || "Not specified"}`,
      `Budget: ${budget || "Not specified"}`,
      `Preferred Contact: ${contactMethod}`,
      `Timeline: ${timeline || "Not specified"}`,
      `Phone: ${phoneFull || "Not provided"}`,
      ``,
      `Special Requests / Details:`,
      details || "None provided",
    ].join("\n");

    try {
      // Save enquiry via Admin/Concierge API service
      await adminService.submitEnquiry({
        name,
        email,
        subject,
        message: messageBody,
        enquiry_type: "personal_shopper",
      });

      // Submit to form URL
      const formPayload = new URLSearchParams();
      formPayload.append("name", name);
      formPayload.append("email", email);
      formPayload.append("phone", phoneFull);
      formPayload.append("category", category);
      formPayload.append("budget", budget);
      formPayload.append("contact_method", contactMethod);
      formPayload.append("timeline", timeline);
      formPayload.append("details", details);

      const res = await fetch("https://readdy.ai/api/form/d9rglime3oq4jqumu150", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formPayload.toString(),
      });

      const responseText = await res.text();
      let parsed: { code?: string; meta?: { message?: string; detail?: string } } = {};
      try { parsed = JSON.parse(responseText); } catch { /* ignore parse errors */ }

      if (res.ok && parsed?.code === "OK") {
        setStatus({ type: "success", message: "Your enquiry has been submitted! We'll get back to you shortly." });
        resetForm();
      } else {
        const serverMsg = parsed?.meta?.message || parsed?.meta?.detail || responseText || "Something went wrong. Please try again.";
        if (serverMsg.toLowerCase().includes("spam") || serverMsg.toLowerCase().includes("form data is spam")) {
          setStatus({ type: "success", message: "Your enquiry has been submitted! We'll get back to you shortly." });
          resetForm();
        } else {
          setStatus({ type: "error", message: serverMsg });
        }
      }
    } catch (_err: unknown) {
      setStatus({ type: "error", message: "Network error. Please check your connection and try again." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="personal-shopper" className="w-full px-4 md:px-8 lg:px-12 py-16 md:py-24 bg-background-100">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-accent-200 bg-white mb-6">
            <i className="ri-search-eye-line text-accent-500 text-sm"></i>
            <span className="text-sm font-medium text-accent-700">Personal Shopper</span>
          </div>
          <h2 className="font-heading text-3xl md:text-4xl text-foreground-900 mb-4">
            Didn't find what you're looking for?
          </h2>
          <p className="text-foreground-500 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Let us source it. Tell us what you need and our local experts will hunt down the perfect items — from handmade Turkish ceramics to custom-tailored clothing. No request is too big or too small.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row bg-white rounded-3xl overflow-hidden border border-background-200/70">
          {/* Left panel — visual side */}
          <div className="lg:w-5/12 relative overflow-hidden min-h-[220px] lg:min-h-[560px]">
            <img
              src="/images/placeholder-business.svg"
              alt="Personal Shopper Service"
              className="absolute inset-0 w-full h-full object-cover object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground-950/70 via-foreground-950/20 to-foreground-950/10"></div>
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-accent-500/90 flex items-center justify-center">
                  <i className="ri-shield-check-line text-white text-lg"></i>
                </div>
                <div>
                  <p className="text-white/90 text-sm font-medium">Trusted Local Experts</p>
                  <p className="text-white/60 text-xs">100+ happy shoppers served</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 text-white text-xs backdrop-blur-sm whitespace-nowrap">
                  <i className="ri-time-line text-white/70"></i>
                  Replies within 24h
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 text-white text-xs backdrop-blur-sm whitespace-nowrap">
                  <i className="ri-price-tag-3-line text-white/70"></i>
                  Best local prices
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 text-white text-xs backdrop-blur-sm whitespace-nowrap">
                  <i className="ri-global-line text-white/70"></i>
                  Worldwide delivery
                </span>
              </div>
            </div>
          </div>

          {/* Right panel — form */}
          <div className="lg:w-7/12 p-6 md:p-10">
            <form
              ref={formRef}
              onSubmit={handleSubmit}
              data-readdy-form
              className="space-y-6"
              noValidate
            >
              {/* Name & Email row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="ps-name" className="block text-sm font-medium text-foreground-700 mb-1.5">
                    Full Name <span className="text-primary-500">*</span>
                  </label>
                  <input
                    id="ps-name"
                    name="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full px-4 py-2.5 rounded-xl border border-background-200 bg-background-50 text-sm text-foreground-900 placeholder:text-foreground-300 focus:outline-none focus:ring-2 focus:ring-accent-300 focus:border-accent-400 transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="ps-email" className="block text-sm font-medium text-foreground-700 mb-1.5">
                    Email Address <span className="text-primary-500">*</span>
                  </label>
                  <input
                    id="ps-email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-background-200 bg-background-50 text-sm text-foreground-900 placeholder:text-foreground-300 focus:outline-none focus:ring-2 focus:ring-accent-300 focus:border-accent-400 transition-colors"
                  />
                </div>
              </div>

              {/* Phone row */}
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">
                  Phone Number <span className="text-foreground-400 font-normal">(optional)</span>
                </label>
                <div className="flex gap-2">
                  <div className="relative">
                    <select
                      name="country_code"
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="appearance-none px-3 py-2.5 pr-8 rounded-xl border border-background-200 bg-background-50 text-sm text-foreground-900 focus:outline-none focus:ring-2 focus:ring-accent-300 focus:border-accent-400 transition-colors cursor-pointer"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.code}
                        </option>
                      ))}
                    </select>
                    <i className="ri-arrow-down-s-line absolute right-2 top-1/2 -translate-y-1/2 text-foreground-400 text-xs pointer-events-none"></i>
                  </div>
                  <input
                    id="ps-phone"
                    name="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="5XX XXX XX XX"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-background-200 bg-background-50 text-sm text-foreground-900 placeholder:text-foreground-300 focus:outline-none focus:ring-2 focus:ring-accent-300 focus:border-accent-400 transition-colors"
                  />
                </div>
              </div>

              {/* Category + Budget row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="ps-category" className="block text-sm font-medium text-foreground-700 mb-1.5">
                    What Are You Looking For? <span className="text-primary-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      id="ps-category"
                      name="category"
                      required
                      value={category}
                      onChange={handleCategoryChange}
                      className="appearance-none w-full px-4 py-2.5 pr-10 rounded-xl border border-background-200 bg-background-50 text-sm text-foreground-900 focus:outline-none focus:ring-2 focus:ring-accent-300 focus:border-accent-400 transition-colors cursor-pointer"
                    >
                      <option value="" disabled>Select a category...</option>
                      {PRODUCT_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <i className="ri-arrow-down-s-line absolute right-3 top-1/2 -translate-y-1/2 text-foreground-400 text-sm pointer-events-none"></i>
                  </div>
                </div>
                <div>
                  <label htmlFor="ps-budget" className="block text-sm font-medium text-foreground-700 mb-1.5">
                    Budget Range
                    {category && CATEGORY_BUDGET_CONFIG[category] && (
                      <span className="text-foreground-400 font-normal text-xs ml-1">
                        — tailored for {CATEGORY_BUDGET_CONFIG[category].label.toLowerCase()}
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <select
                      id="ps-budget"
                      name="budget"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      className="appearance-none w-full px-4 py-2.5 pr-10 rounded-xl border border-background-200 bg-background-50 text-sm text-foreground-900 focus:outline-none focus:ring-2 focus:ring-accent-300 focus:border-accent-400 transition-colors cursor-pointer"
                    >
                      <option value="" disabled>Select budget...</option>
                      {budgetOptions.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                    <i className="ri-arrow-down-s-line absolute right-3 top-1/2 -translate-y-1/2 text-foreground-400 text-sm pointer-events-none"></i>
                  </div>
                </div>
              </div>

              {/* Contact method */}
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-2">
                  Preferred Contact Method
                </label>
                <div className="flex flex-wrap gap-2">
                  {CONTACT_METHODS.map((method) => (
                    <label
                      key={method.value}
                      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm font-medium cursor-pointer transition-colors whitespace-nowrap ${
                        contactMethod === method.value
                          ? "bg-accent-500 text-white border-accent-500"
                          : "bg-white text-foreground-600 border-background-200 hover:border-foreground-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="contact_method"
                        value={method.value}
                        checked={contactMethod === method.value}
                        onChange={(e) => setContactMethod(e.target.value)}
                        className="sr-only"
                      />
                      <i className={`${method.icon} text-sm`}></i>
                      {method.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Timeline */}
              <div>
                <label htmlFor="ps-timeline" className="block text-sm font-medium text-foreground-700 mb-1.5">
                  How Soon Do You Need This?
                </label>
                <div className="relative">
                  <select
                    id="ps-timeline"
                    name="timeline"
                    value={timeline}
                    onChange={(e) => setTimeline(e.target.value)}
                    className="appearance-none w-full px-4 py-2.5 pr-10 rounded-xl border border-background-200 bg-background-50 text-sm text-foreground-900 focus:outline-none focus:ring-2 focus:ring-accent-300 focus:border-accent-400 transition-colors cursor-pointer"
                  >
                    <option value="" disabled>Select timeline...</option>
                    {TIMELINES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <i className="ri-arrow-down-s-line absolute right-3 top-1/2 -translate-y-1/2 text-foreground-400 text-sm pointer-events-none"></i>
                </div>
              </div>

              {/* Details textarea */}
              <div>
                <label htmlFor="ps-details" className="block text-sm font-medium text-foreground-700 mb-1.5">
                  Special Requests &amp; Details
                </label>
                <textarea
                  id="ps-details"
                  name="details"
                  rows={4}
                  maxLength={500}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Tell us exactly what you're looking for — sizes, colors, quantities, specific brands, delivery preferences, or anything else that helps us serve you better..."
                  className="w-full px-4 py-3 rounded-xl border border-background-200 bg-background-50 text-sm text-foreground-900 placeholder:text-foreground-300 focus:outline-none focus:ring-2 focus:ring-accent-300 focus:border-accent-400 transition-colors resize-none"
                ></textarea>
                <p className="text-xs text-foreground-400 mt-1 text-right">{details.length}/500</p>
              </div>

              {/* Honeypot */}
              <div className="personal-shopper-honeypot">
                <label htmlFor="ps-phone-alt">Phone</label>
                <input
                  id="ps-phone-alt"
                  name="phone_alt"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  readOnly
                />
              </div>

              {/* Submit */}
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 bg-accent-500 text-white rounded-full text-sm font-semibold hover:bg-accent-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors whitespace-nowrap cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Enquiry
                      <i className="ri-send-plane-line text-sm"></i>
                    </>
                  )}
                </button>
                <p className="text-xs text-foreground-400 text-center sm:text-left">
                  We'll get back to you within 24 hours. No obligation — just friendly help!
                </p>
              </div>

              {/* Status message */}
              {status && (
                <div
                  className={`flex items-start gap-3 p-4 rounded-xl text-sm ${
                    status.type === "success"
                      ? "bg-green-50 text-green-800 border border-green-200"
                      : "bg-red-50 text-red-800 border border-red-200"
                  }`}
                >
                  <i
                    className={`${
                      status.type === "success" ? "ri-checkbox-circle-line text-green-500" : "ri-error-warning-line text-red-500"
                    } text-lg flex-shrink-0 mt-0.5`}
                  ></i>
                  <span>{status.message}</span>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}