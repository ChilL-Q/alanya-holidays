import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import Navbar from "@/pages/home/components/Navbar";
import Footer from "@/pages/home/components/Footer";
import { adminService } from "@/api-services/admin.service";

interface FormState {
  status: "idle" | "loading" | "success" | "error";
  message: string;
}

const conciergeServices = [
  {
    icon: "ri-sailboat-line",
    title: "Bespoke Experiences",
    description: "Private yacht charters, helicopter tours, and custom itineraries designed around your preferences and pace.",
  },
  {
    icon: "ri-restaurant-line",
    title: "Dining & Reservations",
    description: "Priority bookings at Alanya's finest restaurants, private chef arrangements, and curated tasting experiences.",
  },
  {
    icon: "ri-hotel-line",
    title: "Accommodation Guidance",
    description: "Handpicked villa rentals, boutique hotel recommendations, and insider tips on the best neighborhoods to stay.",
  },
  {
    icon: "ri-calendar-check-line",
    title: "Itinerary Planning",
    description: "Day-by-day plans that balance must-see landmarks with hidden local gems only residents know about.",
  },
  {
    icon: "ri-car-line",
    title: "Transfers & Transport",
    description: "Private airport transfers, car rentals, and logistics so you spend less time worrying and more time enjoying.",
  },
  {
    icon: "ri-question-answer-line",
    title: "Local Advice",
    description: "Honest answers about visas, residency, healthcare, and everyday life from people who actually live here.",
  },
];

const faqs = [
  {
    question: "Who is the concierge service for?",
    answer: "Everyone — tourists planning their first Alanya trip, returning visitors looking for something new, expats settling in, and locals who want to discover more of their own backyard. No question is too small or too ambitious.",
  },
  {
    question: "Is there a fee for the concierge service?",
    answer: "Our concierge advice and recommendations are completely free for community members. If you book a paid experience through one of our trusted local partners, standard pricing applies — and we never add hidden markups.",
  },
  {
    question: "How quickly will I get a response?",
    answer: "We aim to reply within 24 hours on weekdays. During peak season (June through September), response times may stretch to 48 hours — but we always prioritise urgent requests like last-minute bookings or travel disruptions.",
  },
  {
    question: "Can you help with group bookings or special events?",
    answer: "Absolutely. Whether it is a wedding party, corporate retreat, birthday celebration, or family reunion, we can coordinate group experiences, private venues, and multi-day itineraries for parties of any size.",
  },
  {
    question: "Do you only cover Alanya, or the wider region too?",
    answer: "While Alanya is our home base and specialty, we cover the entire Antalya coastline — from Side and Manavgat in the east to Kemer and Phaselis in the west. If it is on the Turkish Riviera, we can help.",
  },
];

export default function ContactPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const yachtName = searchParams.get("yacht");
  const yachtCompany = searchParams.get("company");
  const villaName = searchParams.get("villa");
  const tourName = searchParams.get("tour");
  const tastingName = searchParams.get("tasting");
  const spaName = searchParams.get("spa");
  const excursionName = searchParams.get("excursion");
  const jetName = searchParams.get("jet");
  const chefName = searchParams.get("chef");
  const driverName = searchParams.get("driver");
  const shopperName = searchParams.get("shopper");

  const inquiryName = yachtName || villaName || tourName || tastingName || spaName || excursionName || jetName || chefName || driverName || shopperName;
  const inquirySubject = yachtName ? "Yacht Charter"
    : villaName ? "Villa Stay"
    : tourName ? "Helicopter Tour"
    : tastingName ? "Wine Tasting"
    : spaName ? "Hammam & Spa"
    : excursionName ? "Photography Excursion"
    : jetName ? "Private Jet Charter"
    : chefName ? "Personal Chef"
    : driverName ? "Personal Driver"
    : shopperName ? "Personal Shopper"
    : "";

  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: inquirySubject,
    message: inquiryName ? `I am interested in booking the ${inquiryName}. Please send me availability and pricing details.` : "",
    phone_alt: "",
  });
  const [formState, setFormState] = useState<FormState>({ status: "idle", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [preferredContact, setPreferredContact] = useState("email");
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validateField = (name: string, value: string) => {
    if (name === "name" && !value.trim()) return "Please enter your name.";
    if (name === "email") {
      if (!value.trim()) return "Please enter your email address.";
      if (!validateEmail(value.trim())) return "Please enter a valid email address.";
    }
    if (name === "message" && !value.trim()) return "Please enter your message.";
    return "";
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (touched[name]) {
      setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const honeypot = form.phone_alt.trim();
    if (honeypot) {
      setFormState({ status: "success", message: "Thank you for reaching out! We will get back to you within 24 hours." });
      setForm({ name: "", email: "", subject: "", message: "", phone_alt: "" });
      setTimeout(() => setFormState({ status: "idle", message: "" }), 5000);
      return;
    }

    const nameErr = validateField("name", form.name);
    const emailErr = validateField("email", form.email);
    const messageErr = validateField("message", form.message);
    setErrors({ name: nameErr, email: emailErr, message: messageErr });
    setTouched({ name: true, email: true, message: true });
    if (nameErr || emailErr || messageErr) {
      setFormState({ status: "error", message: "Please fix the errors below before sending." });
      return;
    }

    setFormState({ status: "loading", message: "" });

    try {
      // Build enriched message with preferred contact method
      const enrichedMessage = `Preferred contact method: ${preferredContact === "whatsapp" ? "WhatsApp" : preferredContact === "phone_call" ? "Phone Call" : "Email"}\n\n${form.message.trim()}`;

      // Save enquiry via admin/concierge API service
      await adminService.submitEnquiry({
        name: form.name.trim(),
        email: form.email.trim(),
        subject: form.subject.trim() || "Concierge Enquiry",
        message: enrichedMessage,
        enquiry_type: "general",
      });

      // Also submit to form endpoint
      try {
        const payload = new URLSearchParams();
        payload.append("name", form.name.trim());
        payload.append("email", form.email.trim());
        payload.append("subject", form.subject.trim() || "Concierge Enquiry");
        payload.append("message", enrichedMessage);
        payload.append("preferred_contact", preferredContact);

        await fetch("https://readdy.ai/api/form/d9nm2s8bdkpk99j7glkg", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: payload.toString(),
        });
      } catch {
        // Form endpoint failure is non-critical — Supabase already saved it
      }

      navigate("/booking-confirmation", {
        state: {
          name: form.name.trim(),
          email: form.email.trim(),
          subject: form.subject.trim() || "Concierge Enquiry",
          message: form.message.trim(),
          timestamp: new Date().toLocaleString("en-GB", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }),
        },
      });
    } catch (err) {
      setFormState({
        status: "error",
        message: err instanceof Error ? err.message : "Could not send your message. Please try again or email us directly at contact@alanyaholidays.com.",
      });
    }
  };

  const handlePreferredContactChange = (value: string) => {
    setPreferredContact(value);
  };

  useEffect(() => {
    if (yachtName) {
      const companySuffix = yachtCompany ? ` operated by ${yachtCompany}` : "";
      setForm((prev) => ({
        ...prev,
        subject: "Yacht Charter",
        message: `I am interested in chartering the ${yachtName}${companySuffix}. Could you let me know which dates are available this season, recommend the best route for a full-day trip, and confirm whether catering and drinks are included in the price?`,
      }));
    } else if (villaName) {
      setForm((prev) => ({
        ...prev,
        subject: "Villa Stay",
        message: `I am interested in booking the ${villaName}. Could you share availability for my preferred dates, confirm the total guest capacity, and let me know the check-in and check-out times?`,
      }));
    } else if (tourName) {
      setForm((prev) => ({
        ...prev,
        subject: "Helicopter Tour",
        message: `I would like to book the ${tourName}. Please let me know about available departure times, how many passengers can join per flight, and whether hotel transfers are included in the price.`,
      }));
    } else if (tastingName) {
      setForm((prev) => ({
        ...prev,
        subject: "Wine Tasting",
        message: `I am interested in the ${tastingName}. Could you let me know the available dates, the maximum group size, and whether you can accommodate dietary preferences or allergies?`,
      }));
    } else if (spaName) {
      setForm((prev) => ({
        ...prev,
        subject: "Hammam & Spa",
        message: `I would like to book the ${spaName} experience. Please share your available time slots, confirm whether couples bookings are available, and let me know what I should bring with me.`,
      }));
    } else if (excursionName) {
      setForm((prev) => ({
        ...prev,
        subject: "Photography Excursion",
        message: `I am interested in joining the ${excursionName}. Could you share the guide's availability, confirm the best time of day for the shoot, and let me know whether camera equipment is provided or if I should bring my own?`,
      }));
    } else if (jetName) {
      setForm((prev) => ({
        ...prev,
        subject: "Private Jet Charter",
        message: `I am interested in arranging a ${jetName}. Could you let me know which aircraft are available this season, recommend the best routing for my trip, and confirm pricing and scheduling options?`,
      }));
    } else if (chefName) {
      setForm((prev) => ({
        ...prev,
        subject: "Personal Chef",
        message: `I am interested in booking a ${chefName}. Could you share sample menus, confirm availability for my dates, and let me know whether you can accommodate dietary preferences or allergies?`,
      }));
    } else if (driverName) {
      setForm((prev) => ({
        ...prev,
        subject: "Personal Driver",
        message: `I am interested in arranging a ${driverName}. Could you share vehicle options, confirm daily rates and availability, and let me know whether airport pickup and multi-day bookings are available?`,
      }));
    } else if (shopperName) {
      setForm((prev) => ({
        ...prev,
        subject: "Personal Shopper",
        message: `I am interested in booking a ${shopperName}. Could you share the consultant's availability, let me know which shopping districts and artisan workshops they cover, and confirm the hourly rate and minimum booking duration?`,
      }));
    }
  }, [yachtName, yachtCompany, villaName, tourName, tastingName, spaName, excursionName, jetName, chefName, driverName, shopperName]);

  return (
    <>
      <Navbar />
      <main>
        {/* Hero */}
        <section className="relative w-full h-[320px] md:h-[440px] overflow-hidden">
          <img
            src="https://readdy.ai/api/search-image?query=Elegant%20hotel%20lobby%20with%20marble%20reception%20desk%20fresh%20flower%20arrangement%20warm%20ambient%20lighting%20personal%20concierge%20desk%20with%20leather%20chair%20Mediterranean%20coastal%20view%20through%20large%20windows%20sophisticated%20hospitality%20atmosphere%20Alanya%20Turkey%20luxury%20travel%20editorial%20photography&width=1800&height=880&seq=contact-hero-01&orientation=landscape"
            alt="Alanya Holidays Concierge — Contact Us"
            className="absolute inset-0 w-full h-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-foreground-950/55 via-foreground-950/25 to-foreground-950/75"></div>

          <div className="absolute bottom-0 left-0 right-0 w-full px-4 md:px-8 lg:px-12 pb-10 md:pb-14">
            <div className="flex items-center gap-2 mb-4">
              <Link to="/" className="text-white/60 hover:text-white/90 text-sm transition-colors underline underline-offset-2">Home</Link>
              <i className="ri-arrow-right-s-line text-white/40 text-sm"></i>
              <span className="text-white/90 text-sm">Contact Concierge</span>
            </div>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="font-heading text-3xl md:text-5xl text-white mb-2">Contact Our Concierge</h1>
                <p className="text-white/70 text-sm md:text-base max-w-xl">
                  Personalised assistance for your Alanya experience — from travel planning to local recommendations, we are here to help.
                </p>
              </div>
              <div className="flex items-center gap-5 md:gap-8 shrink-0">
                <div className="text-center">
                  <p className="text-white text-xl md:text-2xl font-semibold">&lt; 24h</p>
                  <p className="text-white/50 text-xs">Response Time</p>
                </div>
                <div className="w-px h-8 bg-white/20"></div>
                <div className="text-center">
                  <p className="text-white text-xl md:text-2xl font-semibold">100%</p>
                  <p className="text-white/50 text-xs">Free Advice</p>
                </div>
                <div className="w-px h-8 bg-white/20"></div>
                <div className="text-center">
                  <p className="text-white text-xl md:text-2xl font-semibold">Since '24</p>
                  <p className="text-white/50 text-xs">Trusted</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Inquiry-Linked Badge Banner */}
        {inquiryName && (
          <section className="w-full px-4 md:px-8 lg:px-12 bg-white border-b border-background-200/60">
            <div className="max-w-5xl mx-auto py-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 flex items-center justify-center shrink-0 rounded-xl bg-accent-100">
                    {yachtName ? (
                      <i className="ri-ship-line text-accent-600 text-lg"></i>
                    ) : villaName ? (
                      <i className="ri-home-5-line text-accent-600 text-lg"></i>
                    ) : tourName ? (
                      <i className="ri-flight-takeoff-line text-accent-600 text-lg"></i>
                    ) : tastingName ? (
                      <i className="ri-goblet-line text-accent-600 text-lg"></i>
                    ) : spaName ? (
                      <i className="ri-drop-line text-accent-600 text-lg"></i>
                    ) : excursionName ? (
                      <i className="ri-camera-lens-line text-accent-600 text-lg"></i>
                    ) : jetName ? (
                      <i className="ri-plane-line text-accent-600 text-lg"></i>
                    ) : chefName ? (
                      <i className="ri-restaurant-2-line text-accent-600 text-lg"></i>
                    ) : driverName ? (
                      <i className="ri-steering-2-line text-accent-600 text-lg"></i>
                    ) : shopperName ? (
                      <i className="ri-shopping-bag-3-line text-accent-600 text-lg"></i>
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent-100 text-accent-700 text-xs font-semibold whitespace-nowrap">
                        <i className="ri-links-line text-[10px]"></i>
                        {inquirySubject}
                      </span>
                      <span className="text-sm font-medium text-foreground-900 truncate">
                        You are enquiring about: <strong>{inquiryName}</strong>
                      </span>
                    </div>
                    {yachtCompany && (
                      <p className="text-xs text-foreground-500 mt-0.5 flex items-center gap-1.5 ml-0">
                        <i className="ri-building-line text-[10px]"></i>
                        Operated by {yachtCompany}
                      </p>
                    )}
                  </div>
                </div>
                <Link
                  to="/contact"
                  onClick={() => {
                    setForm({ name: "", email: "", subject: "", message: "", phone_alt: "" });
                  }}
                  className="flex items-center gap-1.5 text-xs text-foreground-400 hover:text-foreground-600 transition-colors shrink-0 whitespace-nowrap"
                >
                  <i className="ri-close-circle-line text-sm"></i>
                  Clear &amp; start fresh
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* How We Can Help */}
        <section className="w-full px-4 md:px-8 lg:px-12 py-16 md:py-24 bg-background-50">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12 md:mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-foreground-200 bg-white mb-6">
                <i className="ri-star-line text-accent-500 text-sm"></i>
                <span className="text-sm font-medium text-foreground-700">How We Can Help</span>
              </div>
              <h2 className="font-heading text-3xl md:text-4xl text-foreground-900 mb-4">
                Your personal guide to the Turkish Riviera
              </h2>
              <p className="text-foreground-500 text-sm md:text-base max-w-xl mx-auto">
                Whatever brings you to Alanya, our concierge team is here to make it seamless, memorable, and stress-free.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
              {conciergeServices.map((svc) => (
                <div
                  key={svc.title}
                  className="bg-white rounded-2xl p-6 md:p-7 border border-background-200/70 hover:border-accent-200/60 transition-all group"
                >
                  <div className="w-11 h-11 flex items-center justify-center rounded-xl bg-accent-100 group-hover:bg-accent-200 transition-colors mb-4">
                    <i className={`${svc.icon} text-accent-600 text-lg`}></i>
                  </div>
                  <h3 className="font-heading text-base text-foreground-900 mb-2">{svc.title}</h3>
                  <p className="text-sm text-foreground-500 leading-relaxed">{svc.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Form + Info Side by Side */}
        <section className="w-full px-4 md:px-8 lg:px-12 py-16 md:py-24 bg-background-100">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 md:gap-10">
              {/* Form Column */}
              <div className="lg:col-span-3">
                <div className="bg-white rounded-2xl p-6 md:p-8 border border-background-200/70">
                  <h2 className="font-heading text-2xl text-foreground-900 mb-1">Send us a message</h2>
                  <p className="text-sm text-foreground-500 mb-6">Tell us what you need and we will get back to you within 24 hours.</p>

                  {/* Inline inquiry badge inside form card */}
                  {inquiryName && (
                    <div className="flex items-center gap-3 p-4 mb-6 rounded-xl bg-accent-50 border border-accent-200/60">
                      <div className="w-10 h-10 flex items-center justify-center shrink-0 rounded-full bg-accent-100">
                        {yachtName ? (
                          <i className="ri-ship-line text-accent-600 text-base"></i>
                        ) : villaName ? (
                          <i className="ri-home-5-line text-accent-600 text-base"></i>
                        ) : tourName ? (
                          <i className="ri-flight-takeoff-line text-accent-600 text-base"></i>
                        ) : tastingName ? (
                          <i className="ri-goblet-line text-accent-600 text-base"></i>
                        ) : spaName ? (
                          <i className="ri-drop-line text-accent-600 text-base"></i>
                        ) : excursionName ? (
                          <i className="ri-camera-lens-line text-accent-600 text-base"></i>
                        ) : jetName ? (
                          <i className="ri-plane-line text-accent-600 text-base"></i>
                        ) : chefName ? (
                          <i className="ri-restaurant-2-line text-accent-600 text-base"></i>
                        ) : driverName ? (
                          <i className="ri-steering-2-line text-accent-600 text-base"></i>
                        ) : shopperName ? (
                          <i className="ri-shopping-bag-3-line text-accent-600 text-base"></i>
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-accent-100 text-accent-700 text-[11px] font-semibold whitespace-nowrap">
                            <i className="ri-links-line text-[9px]"></i>
                            {inquirySubject}
                          </span>
                          <span className="text-sm font-semibold text-foreground-900 truncate">{inquiryName}</span>
                        </div>
                        {yachtCompany && (
                          <p className="text-xs text-foreground-500 mt-0.5 flex items-center gap-1.5">
                            <i className="ri-building-line text-[10px]"></i>
                            {yachtCompany}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <form
                    id="concierge-contact-form"
                    data-readdy-form=""
                    onSubmit={handleSubmit}
                    className="space-y-5"
                  >
                    {/* Honeypot */}
                    <input
                      type="text"
                      name="phone_alt"
                      value={form.phone_alt}
                      onChange={handleChange}
                      tabIndex={-1}
                      autoComplete="off"
                      aria-hidden="true"
                      readOnly
                      className="review-form-honeypot"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label htmlFor="concierge-name" className="block text-sm font-medium text-foreground-700 mb-1.5">
                          Your Name <span className="text-primary-500">*</span>
                        </label>
                        <input
                          id="concierge-name"
                          type="text"
                          name="name"
                          value={form.name}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          required
                          placeholder="Jane Smith"
                          className={`w-full px-4 py-2.5 rounded-lg border text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:ring-2 transition-colors ${
                            errors.name && touched.name
                              ? "border-red-300 bg-red-50/30 focus:border-red-400 focus:ring-red-100"
                              : "border-background-200 bg-background-50 focus:border-primary-300 focus:ring-primary-100"
                          }`}
                        />
                        {errors.name && touched.name && (
                          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                            <i className="ri-error-warning-line text-[10px]"></i>
                            {errors.name}
                          </p>
                        )}
                      </div>
                      <div>
                        <label htmlFor="concierge-email" className="block text-sm font-medium text-foreground-700 mb-1.5">
                          Email Address <span className="text-primary-500">*</span>
                        </label>
                        <input
                          id="concierge-email"
                          type="email"
                          name="email"
                          value={form.email}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          required
                          placeholder="jane@example.com"
                          className={`w-full px-4 py-2.5 rounded-lg border text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:ring-2 transition-colors ${
                            errors.email && touched.email
                              ? "border-red-300 bg-red-50/30 focus:border-red-400 focus:ring-red-100"
                              : "border-background-200 bg-background-50 focus:border-primary-300 focus:ring-primary-100"
                          }`}
                        />
                        {errors.email && touched.email && (
                          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                            <i className="ri-error-warning-line text-[10px]"></i>
                            {errors.email}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="concierge-subject" className="block text-sm font-medium text-foreground-700 mb-1.5">
                        What can we help with?
                      </label>
                      <select
                        id="concierge-subject"
                        name="subject"
                        value={form.subject}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 rounded-lg border border-background-200 bg-background-50 text-sm text-foreground-900 focus:outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100 transition-colors cursor-pointer"
                      >
                        <option value="">Select a topic...</option>
                        <option value="Trip Planning">Trip Planning</option>
                        <option value="Accommodation">Accommodation</option>
                        <option value="Experiences & Tours">Experiences &amp; Tours</option>
                        <option value="Yacht Charter">Yacht Charter</option>
                        <option value="Villa Stay">Villa Stay</option>
                        <option value="Helicopter Tour">Helicopter Tour</option>
                        <option value="Wine Tasting">Wine Tasting</option>
                        <option value="Hammam & Spa">Hammam &amp; Spa</option>
                        <option value="Photography Excursion">Photography Excursion</option>
                        <option value="Dining & Reservations">Dining &amp; Reservations</option>
                        <option value="Transport & Transfers">Transport &amp; Transfers</option>
                        <option value="Private Jet Charter">Private Jet Charter</option>
                        <option value="Personal Chef">Personal Chef</option>
                        <option value="Personal Driver">Personal Driver</option>
                        <option value="Personal Shopper">Personal Shopper</option>
                        <option value="Expat & Relocation">Expat &amp; Relocation</option>
                        <option value="Special Event">Special Event</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    {/* Preferred Contact Method */}
                    <div>
                      <label className="block text-sm font-medium text-foreground-700 mb-2">
                        Preferred contact method
                      </label>
                      <div className="flex flex-wrap gap-3">
                        <label
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                            preferredContact === "email"
                              ? "border-primary-400 bg-primary-50/40"
                              : "border-background-200 bg-white hover:border-primary-200"
                          }`}
                        >
                          <input
                            type="radio"
                            name="preferred_contact"
                            value="email"
                            checked={preferredContact === "email"}
                            onChange={(e) => handlePreferredContactChange(e.target.value)}
                            className="accent-primary-500"
                          />
                          <i className="ri-mail-line text-foreground-500 text-sm"></i>
                          <span className="text-sm text-foreground-700">Email</span>
                        </label>
                        <label
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                            preferredContact === "whatsapp"
                              ? "border-primary-400 bg-primary-50/40"
                              : "border-background-200 bg-white hover:border-primary-200"
                          }`}
                        >
                          <input
                            type="radio"
                            name="preferred_contact"
                            value="whatsapp"
                            checked={preferredContact === "whatsapp"}
                            onChange={(e) => handlePreferredContactChange(e.target.value)}
                            className="accent-primary-500"
                          />
                          <i className="ri-whatsapp-line text-foreground-500 text-sm"></i>
                          <span className="text-sm text-foreground-700">WhatsApp</span>
                        </label>
                        <label
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                            preferredContact === "phone_call"
                              ? "border-primary-400 bg-primary-50/40"
                              : "border-background-200 bg-white hover:border-primary-200"
                          }`}
                        >
                          <input
                            type="radio"
                            name="preferred_contact"
                            value="phone_call"
                            checked={preferredContact === "phone_call"}
                            onChange={(e) => handlePreferredContactChange(e.target.value)}
                            className="accent-primary-500"
                          />
                          <i className="ri-phone-line text-foreground-500 text-sm"></i>
                          <span className="text-sm text-foreground-700">Phone Call</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="concierge-message" className="block text-sm font-medium text-foreground-700 mb-1.5">
                        Your Message <span className="text-primary-500">*</span>
                      </label>
                      <textarea
                        id="concierge-message"
                        name="message"
                        value={form.message}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        required
                        maxLength={500}
                        rows={5}
                        placeholder="Tell us about your trip — dates, group size, what you are interested in, and any special requests..."
                        className={`w-full px-4 py-2.5 rounded-lg border text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:ring-2 transition-colors resize-none ${
                          errors.message && touched.message
                            ? "border-red-300 bg-red-50/30 focus:border-red-400 focus:ring-red-100"
                            : "border-background-200 bg-background-50 focus:border-primary-300 focus:ring-primary-100"
                        }`}
                      ></textarea>
                      {errors.message && touched.message && (
                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                          <i className="ri-error-warning-line text-[10px]"></i>
                          {errors.message}
                        </p>
                      )}
                      <p className="text-xs text-foreground-400 mt-1.5 text-right">
                        {form.message.length}/500 characters
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={formState.status === "loading"}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-500 text-background-50 rounded-full text-sm font-semibold hover:bg-primary-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
                    >
                      {formState.status === "loading" ? (
                        <>
                          <i className="ri-loader-4-line animate-spin"></i>
                          Sending...
                        </>
                      ) : (
                        <>
                          Send Message
                          <i className="ri-send-plane-line"></i>
                        </>
                      )}
                    </button>

                    {/* Status Messages */}
                    {formState.status === "success" && (
                      <div className="flex items-start gap-3 p-4 rounded-xl bg-accent-50 border border-accent-200">
                        <div className="w-8 h-8 flex items-center justify-center rounded-full bg-accent-100 shrink-0 mt-0.5">
                          <i className="ri-check-line text-accent-600"></i>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-accent-800 mb-0.5">Message sent!</p>
                          <p className="text-xs text-accent-700">{formState.message}</p>
                        </div>
                      </div>
                    )}

                    {formState.status === "error" && (
                      <div className="flex items-start gap-3 p-4 rounded-xl bg-primary-50 border border-primary-200">
                        <div className="w-8 h-8 flex items-center justify-center rounded-full bg-primary-100 shrink-0 mt-0.5">
                          <i className="ri-error-warning-line text-primary-600"></i>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-primary-800 mb-0.5">Could not send</p>
                          <p className="text-xs text-primary-700">{formState.message}</p>
                        </div>
                      </div>
                    )}
                  </form>
                </div>
              </div>

              {/* Info Column */}
              <div className="lg:col-span-2 space-y-5">
                {/* Contact Cards */}
                <div className="bg-white rounded-2xl p-6 md:p-7 border border-background-200/70">
                  <h3 className="font-heading text-lg text-foreground-900 mb-5">Reach us directly</h3>

                  <div className="space-y-4">
                    <a
                      href="mailto:contact@alanyaholidays.com"
                      className="flex items-start gap-4 p-4 rounded-xl bg-background-50 hover:bg-accent-50 transition-colors group"
                    >
                      <div className="w-10 h-10 flex items-center justify-center rounded-full bg-accent-100 group-hover:bg-accent-200 transition-colors shrink-0">
                        <i className="ri-mail-line text-accent-600"></i>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground-900 mb-0.5">Email</p>
                        <p className="text-sm text-foreground-500 break-all">contact@alanyaholidays.com</p>
                      </div>
                    </a>

                    <div className="flex items-start gap-4 p-4 rounded-xl bg-background-50">
                      <div className="w-10 h-10 flex items-center justify-center rounded-full bg-secondary-100 shrink-0">
                        <i className="ri-phone-line text-secondary-600"></i>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground-900 mb-0.5">Phone &amp; WhatsApp</p>
                        <p className="text-sm text-foreground-500">+90 242 123 45 67</p>
                        <p className="text-xs text-foreground-400 mt-1">Mon–Fri, 9:00–18:00 (GMT+3)</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 rounded-xl bg-background-50">
                      <div className="w-10 h-10 flex items-center justify-center rounded-full bg-secondary-100 shrink-0">
                        <i className="ri-map-pin-line text-secondary-600"></i>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground-900 mb-0.5">Visit Us</p>
                        <p className="text-sm text-foreground-500">İskele Cd. No:42, Alanya</p>
                        <p className="text-sm text-foreground-500">Antalya 07400, Türkiye</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Links Card */}
                <div className="bg-white rounded-2xl p-6 md:p-7 border border-background-200/70">
                  <h3 className="font-heading text-lg text-foreground-900 mb-4">Quick Links</h3>
                  <div className="space-y-2">
                    <Link
                      to="/travel-guides"
                      className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-background-50 hover:bg-accent-50 transition-colors text-sm text-foreground-700 hover:text-foreground-900 group"
                    >
                      <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-accent-100 shrink-0">
                        <i className="ri-book-open-line text-accent-600 text-sm"></i>
                      </div>
                      Travel Guides
                      <i className="ri-arrow-right-line ml-auto text-foreground-300 group-hover:text-foreground-500"></i>
                    </Link>
                    <Link
                      to="/events"
                      className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-background-50 hover:bg-accent-50 transition-colors text-sm text-foreground-700 hover:text-foreground-900 group"
                    >
                      <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-accent-100 shrink-0">
                        <i className="ri-calendar-event-line text-accent-600 text-sm"></i>
                      </div>
                      Upcoming Events
                      <i className="ri-arrow-right-line ml-auto text-foreground-300 group-hover:text-foreground-500"></i>
                    </Link>
                    <Link
                      to="/explore"
                      className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-background-50 hover:bg-accent-50 transition-colors text-sm text-foreground-700 hover:text-foreground-900 group"
                    >
                      <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-accent-100 shrink-0">
                        <i className="ri-compass-3-line text-accent-600 text-sm"></i>
                      </div>
                      Business Directory
                      <i className="ri-arrow-right-line ml-auto text-foreground-300 group-hover:text-foreground-500"></i>
                    </Link>
                  </div>
                </div>

                {/* Testimonial */}
                <div className="bg-gradient-to-br from-accent-500 to-accent-600 rounded-2xl p-6 md:p-7 text-white">
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <i key={i} className="ri-star-fill text-white/90 text-sm"></i>
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed text-white/90 mb-4 italic">
                    "The concierge team planned our entire 10-day honeymoon — every restaurant, every boat trip, every sunset spot was perfect. We would have missed half of Alanya without them."
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-semibold text-sm">
                      EM
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Emma &amp; Marcus</p>
                      <p className="text-xs text-white/60">London, UK — visited June 2026</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="w-full px-4 md:px-8 lg:px-12 py-16 md:py-24 bg-background-50">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12 md:mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-foreground-200 bg-white mb-6">
                <i className="ri-question-line text-primary-500 text-sm"></i>
                <span className="text-sm font-medium text-foreground-700">Common Questions</span>
              </div>
              <h2 className="font-heading text-3xl md:text-4xl text-foreground-900 mb-4">Frequently Asked</h2>
              <p className="text-foreground-500 text-sm md:text-base max-w-xl mx-auto">
                Quick answers to the questions we hear most often from our community members.
              </p>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, idx) => (
                <details key={idx} className="group bg-white rounded-2xl border border-background-200/70 overflow-hidden">
                  <summary className="flex items-center justify-between px-6 py-4 cursor-pointer list-none">
                    <h4 className="text-sm font-medium text-foreground-900 pr-4">{faq.question}</h4>
                    <div className="w-7 h-7 flex items-center justify-center rounded-full bg-background-100 shrink-0 group-open:bg-accent-100 transition-colors">
                      <i className="ri-add-line text-foreground-500 text-sm group-open:hidden"></i>
                      <i className="ri-subtract-line text-accent-600 text-sm hidden group-open:block"></i>
                    </div>
                  </summary>
                  <div className="px-6 pb-4">
                    <p className="text-sm text-foreground-600 leading-relaxed">{faq.answer}</p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="w-full px-4 md:px-8 lg:px-12 py-16 md:py-20 bg-gradient-to-r from-primary-500 to-primary-600">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-heading text-3xl md:text-4xl text-white mb-4">
              Not sure where to start?
            </h2>
            <p className="text-white/80 text-sm md:text-base mb-8">
              Browse our travel guides for curated itineraries, local tips, and everything you need to fall in love with Alanya — no planning required.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/travel-guides"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary-600 rounded-full text-sm font-semibold hover:bg-white/95 transition-colors whitespace-nowrap"
              >
                Explore Travel Guides
                <i className="ri-arrow-right-line"></i>
              </Link>
              <Link
                to="/community-hub"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white border border-white/30 rounded-full text-sm font-medium hover:bg-white/20 transition-colors whitespace-nowrap"
              >
                Join the Community
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}