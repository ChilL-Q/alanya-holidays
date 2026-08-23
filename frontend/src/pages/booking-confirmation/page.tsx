import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Navbar from "@/pages/home/components/Navbar";
import Footer from "@/pages/home/components/Footer";
import type { InquiryState } from "@/lib/inquiry-confirmation";

const subjectIcons: Record<string, string> = {
  "Yacht Charter": "ri-sailboat-line",
  "Villa Stay": "ri-hotel-line",
  "Luxury Experience": "ri-vip-crown-line",
  "Helicopter Tour": "ri-flight-takeoff-line",
  "Wine Tasting": "ri-goblet-line",
  "Hammam & Spa": "ri-heart-pulse-line",
  "Photography Excursion": "ri-camera-lens-line",
};

const subjectLinks: Record<string, { label: string; to: string }> = {
  "Yacht Charter": { label: "Explore more yachts", to: "/yacht-charters" },
  "Villa Stay": { label: "Browse more villas", to: "/villa-stays" },
  "Luxury Experience": { label: "Explore experiences", to: "/explore" },
  "Helicopter Tour": { label: "See more tours", to: "/helicopter-tours" },
  "Wine Tasting": { label: "Discover more tastings", to: "/wine-tastings" },
  "Hammam & Spa": { label: "View more spa experiences", to: "/hammam-spa" },
  "Photography Excursion": { label: "Find more excursions", to: "/photography-excursions" },
};

export default function BookingConfirmationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const inquiry = (location.state as InquiryState) || null;

  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!inquiry) {
      navigate("/contact", { replace: true });
      return;
    }
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, [inquiry, navigate]);

  if (!inquiry) return null;

  const icon = subjectIcons[inquiry.subject] || "ri-question-answer-line";
  const relatedLink = subjectLinks[inquiry.subject];

  const messageLabel = inquiry.subject
    ? `Your ${inquiry.subject} enquiry`
    : "Your enquiry";

  const timelineSteps = [
    {
      icon: "ri-mail-check-line",
      title: "Confirmation sent",
      description: `A copy of your enquiry has been sent to ${inquiry.email}. Check your inbox for reference.`,
      time: "Instantly",
    },
    {
      icon: "ri-user-star-line",
      title: "Concierge assigned",
      description: "One of our Alanya-based concierge specialists will personally review your request and prepare a tailored response.",
      time: "Within 6 hours",
    },
    {
      icon: "ri-message-3-line",
      title: "Personalised reply",
      description: "You will receive a detailed email with availability, pricing, and recommendations specific to your enquiry — nothing generic, nothing automated.",
      time: "Within 24 hours",
    },
  ];

  return (
    <>
      <Navbar />
      <main>
        {/* Success Hero */}
        <section className="relative w-full min-h-[420px] md:min-h-[500px] flex items-center justify-center overflow-hidden bg-background-50">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-accent-100/40"></div>
            <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] rounded-full bg-primary-100/30"></div>
            <div className="absolute bottom-1/4 right-1/4 w-[250px] h-[250px] rounded-full bg-secondary-100/30"></div>
          </div>

          <div className={`relative z-10 text-center px-4 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-full bg-accent-500">
                <i className="ri-check-line text-white text-3xl md:text-4xl"></i>
              </div>
            </div>

            <h1 className="font-heading text-3xl md:text-5xl text-foreground-900 mb-3">
              {messageLabel} has been sent
            </h1>
            <p className="text-foreground-500 text-sm md:text-base max-w-lg mx-auto mb-2">
              Thank you, {inquiry.name}. Our concierge team will review your request and get back to you with a personalised response.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-background-200/70 mt-3">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-sm text-foreground-600">
                Expected response: <strong className="text-foreground-900">under 24 hours</strong>
              </span>
            </div>
          </div>
        </section>

        {/* Inquiry Summary */}
        <section className={`w-full px-4 md:px-8 lg:px-12 py-12 md:py-16 bg-background-50 transition-all duration-700 delay-200 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl border border-background-200/70 overflow-hidden">
              {/* Header */}
              <div className="px-6 md:px-8 py-5 border-b border-background-200/70 flex items-center gap-4">
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-accent-100 shrink-0">
                  <i className={`${icon} text-accent-600`}></i>
                </div>
                <div>
                  <p className="text-xs text-foreground-400 uppercase tracking-wide">Enquiry Summary</p>
                  <p className="text-sm font-semibold text-foreground-900">{inquiry.subject || "General Enquiry"}</p>
                </div>
              </div>

              {/* Details */}
              <div className="px-6 md:px-8 py-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-foreground-400 mb-1">Your Name</p>
                    <p className="text-sm font-medium text-foreground-900">{inquiry.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-foreground-400 mb-1">Email Address</p>
                    <p className="text-sm font-medium text-foreground-900">{inquiry.email}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-foreground-400 mb-1">Your Message</p>
                  <div className="bg-background-50 rounded-xl p-4 border border-background-200/60">
                    <p className="text-sm text-foreground-700 leading-relaxed whitespace-pre-wrap">{inquiry.message}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-foreground-400">
                  <i className="ri-time-line"></i>
                  <span>Submitted on {inquiry.timestamp}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* What Happens Next Timeline */}
        <section className={`w-full px-4 md:px-8 lg:px-12 py-12 md:py-16 bg-background-100 transition-all duration-700 delay-400 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-10 md:mb-12">
              <h2 className="font-heading text-2xl md:text-3xl text-foreground-900 mb-3">What happens next</h2>
              <p className="text-sm text-foreground-500 max-w-md mx-auto">
                Here is what to expect while our concierge team prepares your personalised response.
              </p>
            </div>

            <div className="space-y-1">
              {timelineSteps.map((step, idx) => (
                <div key={step.title} className="flex gap-4">
                  {/* Timeline line + dot */}
                  <div className="flex flex-col items-center shrink-0">
                    <div className="w-10 h-10 flex items-center justify-center rounded-full bg-white border-2 border-accent-200 z-10">
                      <i className={`${step.icon} text-accent-600 text-sm`}></i>
                    </div>
                    {idx < timelineSteps.length - 1 && (
                      <div className="w-0.5 flex-1 bg-accent-200 my-1"></div>
                    )}
                  </div>

                  {/* Content */}
                  <div className={`pb-8 ${idx === timelineSteps.length - 1 ? "pb-0" : ""}`}>
                    <div className="bg-white rounded-xl p-5 border border-background-200/70">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-heading text-sm font-semibold text-foreground-900">{step.title}</h3>
                        <span className="text-xs text-foreground-400 bg-background-100 px-2.5 py-1 rounded-full whitespace-nowrap">{step.time}</span>
                      </div>
                      <p className="text-sm text-foreground-500 leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Next Steps CTAs */}
        <section className={`w-full px-4 md:px-8 lg:px-12 py-12 md:py-16 bg-background-50 transition-all duration-700 delay-600 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-heading text-2xl md:text-3xl text-foreground-900 mb-6">While you wait</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {relatedLink && (
                <Link
                  to={relatedLink.to}
                  className="flex items-center gap-4 p-5 rounded-2xl bg-white border border-background-200/70 hover:border-accent-200/60 transition-all group text-left"
                >
                  <div className="w-11 h-11 flex items-center justify-center rounded-xl bg-accent-100 group-hover:bg-accent-200 transition-colors shrink-0">
                    <i className={`${icon} text-accent-600 text-lg`}></i>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground-900 group-hover:text-accent-700 transition-colors">{relatedLink.label}</p>
                    <p className="text-xs text-foreground-500">Continue planning your trip</p>
                  </div>
                  <i className="ri-arrow-right-line ml-auto text-foreground-300 group-hover:text-foreground-500"></i>
                </Link>
              )}

              <Link
                to="/travel-guides"
                className="flex items-center gap-4 p-5 rounded-2xl bg-white border border-background-200/70 hover:border-accent-200/60 transition-all group text-left"
              >
                <div className="w-11 h-11 flex items-center justify-center rounded-xl bg-secondary-100 group-hover:bg-secondary-200 transition-colors shrink-0">
                  <i className="ri-book-open-line text-secondary-600 text-lg"></i>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground-900 group-hover:text-accent-700 transition-colors">Travel Guides</p>
                  <p className="text-xs text-foreground-500">Curated itineraries &amp; local tips</p>
                </div>
                <i className="ri-arrow-right-line ml-auto text-foreground-300 group-hover:text-foreground-500"></i>
              </Link>
            </div>

            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 transition-colors whitespace-nowrap"
            >
              <i className="ri-home-line"></i>
              Back to Home
            </Link>
          </div>
        </section>

        {/* Direct Contact Fallback */}
        <section className="w-full px-4 md:px-8 lg:px-12 py-12 md:py-16 bg-background-100">
          <div className="max-w-xl mx-auto text-center">
            <p className="text-sm text-foreground-400 mb-4">Need to reach us sooner?</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="mailto:contact@alanyaholidays.com"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-background-200 text-sm text-foreground-700 hover:border-foreground-300 transition-colors whitespace-nowrap"
              >
                <i className="ri-mail-line"></i>
                contact@alanyaholidays.com
              </a>
              <span className="text-sm text-foreground-500">or call +90 242 123 45 67</span>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}