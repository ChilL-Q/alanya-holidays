import { useState, useMemo, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/pages/home/components/Navbar";
import Footer from "@/pages/home/components/Footer";
import RelatedExperiences from "@/components/feature/RelatedExperiences";
import { conciergeService, jetTypes, type PrivateJet } from "@/api-services/concierge.service";
import { formatAmenity } from "@/utils/format-amenity";
import ErrorState from "@/components/base/ErrorState";
import EmptyState from "@/components/base/EmptyState";

const typeIconMap: Record<string, string> = {
  "Light Jet": "ri-flight-takeoff-line",
  "Midsize Jet": "ri-flight-land-line",
  "Heavy Jet": "ri-rocket-line",
  "VIP Airliner": "ri-vip-crown-line",
};

export default function PrivateJetsPage() {
  const [privateJets, setPrivateJets] = useState<PrivateJet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activeType, setActiveType] = useState("all");
  const [sortBy, setSortBy] = useState<"rating" | "price-low" | "price-high" | "range">("rating");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [selectedJet, setSelectedJet] = useState<PrivateJet | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [contactMethod, setContactMethod] = useState("email");
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  const loadJets = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await conciergeService.getPrivateJets();
      setPrivateJets(data);
    } catch {
      setFetchError("Failed to load private jet listings. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJets();
  }, [loadJets]);

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validateBookingField = (name: string, value: string) => {
    if (name === "name" && !value.trim()) return "Please enter your full name.";
    if (name === "email") {
      if (!value.trim()) return "Please enter your email address.";
      if (!validateEmail(value.trim())) return "Please enter a valid email address.";
    }
    return "";
  };
  const handleBookingFieldBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTouchedFields((prev) => ({ ...prev, [name]: true }));
    setFieldErrors((prev) => ({ ...prev, [name]: validateBookingField(name, value) }));
  };
  const handleBookingFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (touchedFields[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: validateBookingField(name, value) }));
    }
  };

  const filteredJets = useMemo(() => {
    let results = privateJets;
    if (activeType !== "all") {
      const typeMap: Record<string, string> = {
        "light-jet": "Light Jet",
        "midsize-jet": "Midsize Jet",
        "heavy-jet": "Heavy Jet",
        "vip-airliner": "VIP Airliner",
      };
      results = results.filter((j) => j.type === typeMap[activeType]);
    }
    if (sortBy === "rating") results = [...results].sort((a, b) => b.rating - a.rating);
    else if (sortBy === "price-low") results = [...results].sort((a, b) => a.pricePerHour - b.pricePerHour);
    else if (sortBy === "price-high") results = [...results].sort((a, b) => b.pricePerHour - a.pricePerHour);
    else if (sortBy === "range") {
      results = [...results].sort((a, b) => {
        const aR = parseInt(a.range.replace(/,/g, ""));
        const bR = parseInt(b.range.replace(/,/g, ""));
        return bR - aR;
      });
    }
    return results;
  }, [activeType, sortBy, privateJets]);

  const sortLabelMap: Record<string, string> = {
    rating: "Top Rated",
    "price-low": "Price: Low to High",
    "price-high": "Price: High to Low",
    range: "Longest Range",
  };

  const handleBookingSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");
    setFieldErrors({});
    setTouchedFields({});
    const form = e.currentTarget;
    const formData = new FormData(form);
    const prefContact = (formData.get("preferred_contact") as string) || "email";
    setContactMethod(prefContact);

    const nameErr = validateBookingField("name", formData.get("name") as string || "");
    const emailErr = validateBookingField("email", formData.get("email") as string || "");
    setFieldErrors({ name: nameErr, email: emailErr });
    setTouchedFields({ name: true, email: true });
    if (nameErr || emailErr) {
      setFormError("Please fix the errors below before sending.");
      return;
    }

    const honeypot = formData.get("website_alt") as string;
    if (honeypot && honeypot.trim() !== "") {
      setFormSuccess(true);
      return;
    }
    setFormSubmitting(true);
    try {
      const bookingName = (formData.get("name") as string || "").trim();
      const bookingEmail = (formData.get("email") as string || "").trim();
      const bookingPhone = (formData.get("phone") as string || "").trim();
      const bookingCountryCode = (formData.get("country_code") as string || "").trim();
      const bookingNotes = (formData.get("notes") as string || "").trim();
      const jetName = (formData.get("jet_name") as string || selectedJet?.name || "");

      const result = await conciergeService.submitConciergeEnquiry({
        name: bookingName,
        email: bookingEmail,
        phone: bookingPhone,
        country_code: bookingCountryCode,
        preferred_contact: prefContact,
        experience_type: "Private Jet Charter",
        item_name: jetName,
        item_id: selectedJet?.id,
        notes: bookingNotes,
        form_endpoint: "https://readdy.ai/api/form/d9r4h76e3oq4jqumtegg",
      });

      if (result.success) {
        setFormSuccess(true);
        form.reset();
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    } catch {
      setFormError("Network error. Please check your connection and try again.");
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <main>
        <section className="relative w-full h-[340px] md:h-[460px] overflow-hidden">
          <img
            src="https://readdy.ai/api/search-image?query=Luxury%20private%20jet%20interior%20with%20cream%20leather%20seats%20polished%20wood%20trim%20and%20ambient%20golden%20lighting%20aircraft%20parked%20on%20tarmac%20at%20dusk%20modern%20terminal%20building%20in%20background%20with%20runway%20lights%20twinkling%20warm%20sunset%20sky%20premium%20aviation%20lifestyle%20photography%20opulent%20atmosphere%20high%20detail&width=1800&height=920&seq=jet-hero-01&orientation=landscape"
            alt="Private Jet Charters"
            className="absolute inset-0 w-full h-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-foreground-950/40 via-foreground-950/20 to-foreground-950/65"></div>
          <div className="absolute bottom-0 left-0 right-0 w-full px-4 md:px-8 lg:px-12 pb-10 md:pb-14">
            <div className="flex items-center gap-2 mb-4">
              <Link to="/" className="text-white/60 hover:text-white/90 text-sm transition-colors underline underline-offset-2">Home</Link>
              <i className="ri-arrow-right-s-line text-white/40 text-sm"></i>
              <Link to="/explore" className="text-white/60 hover:text-white/90 text-sm transition-colors underline underline-offset-2">Explore</Link>
              <i className="ri-arrow-right-s-line text-white/40 text-sm"></i>
              <span className="text-white/90 text-sm">Private Jets</span>
            </div>
            <h1 className="font-heading text-3xl md:text-5xl text-white mb-2">Private Jet Charters</h1>
            <p className="text-white/70 text-sm md:text-base max-w-xl">
              Skip the terminal and fly on your schedule. Light jets for quick hops, heavy jets for intercontinental journeys — all departing from Antalya or Gazipaşa.
            </p>
          </div>
        </section>

        <section className="w-full px-4 md:px-8 lg:px-12 pt-8 pb-4 bg-background-50">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide flex-wrap">
              {jetTypes.map((s) => (
                <button key={s.id} onClick={() => setActiveType(s.id)} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${activeType === s.id ? "bg-primary-500 text-white" : "bg-white border border-foreground-200 text-foreground-600 hover:border-primary-200 hover:text-foreground-900"}`}>
                  <i className={`${s.icon} text-sm`}></i>{s.name}
                </button>
              ))}
              <div className="ml-auto relative">
                <button onClick={() => setShowSortDropdown(!showSortDropdown)} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-foreground-200 text-sm text-foreground-700 hover:border-foreground-300 transition-colors whitespace-nowrap cursor-pointer">
                  <i className="ri-sort-desc text-sm"></i>{sortLabelMap[sortBy]}
                  <i className={`ri-arrow-down-s-line text-sm transition-transform duration-200 ${showSortDropdown ? "rotate-180" : ""}`}></i>
                </button>
                {showSortDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowSortDropdown(false)}></div>
                    <div className="absolute right-0 top-full mt-2 w-52 rounded-xl bg-white border border-background-200/80 overflow-hidden z-20">
                      {Object.entries(sortLabelMap).map(([key, label]) => (
                        <button key={key} onClick={() => { setSortBy(key as typeof sortBy); setShowSortDropdown(false); }} className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors cursor-pointer ${sortBy === key ? "bg-primary-50 text-primary-700 font-semibold" : "text-foreground-700 hover:bg-background-100"}`}>{label}</button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="w-full px-4 md:px-8 lg:px-12 py-4 bg-background-50">
          <div className="max-w-7xl mx-auto">
            {!isLoading && !fetchError && (
              <p className="text-sm text-foreground-500">{filteredJets.length} {filteredJets.length === 1 ? "aircraft" : "aircraft"} available</p>
            )}
          </div>
        </section>

        <section className="w-full px-4 md:px-8 lg:px-12 pb-20 bg-background-50">
          <div className="max-w-7xl mx-auto">
            {fetchError ? (
              <ErrorState
                title="Unable to load private jets"
                message={fetchError}
                onRetry={loadJets}
              />
            ) : isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="bg-white rounded-2xl border border-background-200/70 overflow-hidden animate-pulse">
                    <div className="w-full h-52 md:h-56 bg-background-200" />
                    <div className="p-5 space-y-3">
                      <div className="h-5 bg-background-200 rounded w-3/4" />
                      <div className="h-3 bg-background-100 rounded w-1/2" />
                      <div className="h-10 bg-background-100 rounded w-full" />
                      <div className="h-8 bg-background-200 rounded w-full pt-4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredJets.length === 0 ? (
              <EmptyState
                title="No private jets found"
                description="Try selecting a different aircraft category or clear your filters."
                icon="ri-plane-line"
                action={{
                  label: "Reset Filters",
                  onClick: () => {
                    setActiveType("all");
                    setSortBy("rating");
                  },
                }}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                {filteredJets.map((jet) => (
                  <div key={jet.id} onClick={() => setSelectedJet(jet)} className="bg-white rounded-2xl border border-background-200/70 hover:border-primary-200/60 overflow-hidden group cursor-pointer transition-all">
                    <div className="relative w-full h-52 md:h-56 overflow-hidden">
                      <img src={jet.image} alt={jet.name} className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500" />
                      {jet.featured && (
                        <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-accent-500 text-white text-xs font-semibold flex items-center gap-1 whitespace-nowrap">
                          <i className="ri-star-fill text-[10px]"></i>Featured
                        </div>
                      )}
                      <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-foreground-700 text-xs font-medium whitespace-nowrap flex items-center gap-1">
                        <i className={`${typeIconMap[jet.type] || "ri-plane-line"} text-[11px]`}></i>{jet.type}
                      </div>
                      <div className="absolute bottom-3 left-3">
                        <span className="px-2.5 py-1 rounded-full bg-foreground-900/70 backdrop-blur-sm text-white text-xs font-medium whitespace-nowrap flex items-center gap-1">
                          <i className="ri-pin-distance-line text-[10px]"></i>{jet.range}
                        </span>
                      </div>
                    </div>
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="font-heading text-base text-foreground-900 leading-tight group-hover:text-primary-500 transition-colors">{jet.name}</h3>
                        <div className="flex items-center gap-1 shrink-0">
                          <i className="ri-star-fill text-yellow-400 text-sm"></i>
                          <span className="text-sm font-semibold text-foreground-900">{jet.rating}</span>
                          <span className="text-xs text-foreground-500">({jet.reviewCount})</span>
                        </div>
                      </div>
                      <p className="text-sm text-foreground-500 leading-relaxed mb-4 line-clamp-2">{jet.description}</p>
                      <div className="flex items-center gap-3 mb-4 text-xs text-foreground-500">
                        <span className="flex items-center gap-1"><i className="ri-building-line text-foreground-400"></i>{jet.company}</span>
                        <span className="flex items-center gap-1"><i className="ri-user-line text-foreground-400"></i>{jet.capacity} pax</span>
                        <span className="flex items-center gap-1"><i className="ri-speed-up-line text-foreground-400"></i>{jet.speed}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-5">
                        {jet.amenities.slice(0, 3).map((a) => (
                          <span key={a} className="px-2 py-0.5 rounded-full bg-secondary-100 text-secondary-800 text-xs font-medium whitespace-nowrap">{formatAmenity(a)}</span>
                        ))}
                        {jet.amenities.length > 3 && <span className="px-2 py-0.5 rounded-full bg-background-100 text-foreground-500 text-xs whitespace-nowrap">+{jet.amenities.length - 3}</span>}
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-background-200/70">
                        <div>
                          <span className="text-lg font-bold text-foreground-900">€{jet.pricePerHour.toLocaleString()}</span>
                          <span className="text-sm text-foreground-500"> / hour</span>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); setSelectedJet(jet); }} className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors whitespace-nowrap cursor-pointer">
                          <i className="ri-plane-line text-sm"></i>View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {selectedJet && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-foreground-950/60 backdrop-blur-sm" onClick={() => setSelectedJet(null)}></div>
            <div className="relative bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto z-10">
              <button onClick={() => setSelectedJet(null)} className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm border border-background-200 text-foreground-600 hover:text-foreground-900 transition-all z-20 cursor-pointer">
                <i className="ri-close-line text-lg"></i>
              </button>
              <div className="relative w-full h-56 md:h-72 overflow-hidden rounded-t-2xl">
                <img src={selectedJet.image} alt={selectedJet.name} className="w-full h-full object-cover object-top" />
                {selectedJet.featured && (
                  <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-accent-500 text-white text-xs font-semibold flex items-center gap-1 whitespace-nowrap">
                    <i className="ri-star-fill text-[10px]"></i>Featured
                  </div>
                )}
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent-100 text-accent-700 text-xs font-medium mb-2">
                      <i className={`${typeIconMap[selectedJet.type] || "ri-plane-line"} text-[11px]`}></i>{selectedJet.type}
                    </span>
                    <h2 className="font-heading text-2xl text-foreground-900">{selectedJet.name}</h2>
                    <p className="text-sm text-foreground-400 mt-0.5 flex items-center gap-1.5">
                      <i className="ri-building-line text-[12px]"></i>Operated by {selectedJet.company}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 mt-1">
                    <i className="ri-star-fill text-yellow-400 text-base"></i>
                    <span className="text-base font-semibold text-foreground-900">{selectedJet.rating}</span>
                    <span className="text-sm text-foreground-500">({selectedJet.reviewCount} reviews)</span>
                  </div>
                </div>
                <p className="text-sm text-foreground-600 leading-relaxed mb-6">{selectedJet.description}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  <div className="bg-background-100 rounded-xl p-3 text-center">
                    <i className="ri-user-line text-foreground-500 text-lg mb-1 block"></i>
                    <p className="text-xs text-foreground-500">Capacity</p>
                    <p className="font-semibold text-foreground-900 text-sm">{selectedJet.capacity} pax</p>
                  </div>
                  <div className="bg-background-100 rounded-xl p-3 text-center">
                    <i className="ri-pin-distance-line text-foreground-500 text-lg mb-1 block"></i>
                    <p className="text-xs text-foreground-500">Range</p>
                    <p className="font-semibold text-foreground-900 text-sm">{selectedJet.range}</p>
                  </div>
                  <div className="bg-background-100 rounded-xl p-3 text-center">
                    <i className="ri-speed-up-line text-foreground-500 text-lg mb-1 block"></i>
                    <p className="text-xs text-foreground-500">Speed</p>
                    <p className="font-semibold text-foreground-900 text-sm">{selectedJet.speed}</p>
                  </div>
                  <div className="bg-background-100 rounded-xl p-3 text-center">
                    <i className="ri-time-line text-foreground-500 text-lg mb-1 block"></i>
                    <p className="text-xs text-foreground-500">Min Hours</p>
                    <p className="font-semibold text-foreground-900 text-sm">{selectedJet.minHours}h</p>
                  </div>
                </div>
                <div className="bg-primary-50 rounded-xl p-5 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-foreground-500 mb-0.5">Per Flight Hour</p>
                      <p className="text-2xl font-bold text-foreground-900">€{selectedJet.pricePerHour.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-foreground-500 mb-0.5">Base</p>
                      <span className="px-3 py-1 rounded-full bg-accent-100 text-accent-700 text-xs font-semibold whitespace-nowrap">{selectedJet.base}</span>
                    </div>
                  </div>
                </div>
                <div className="mb-6">
                  <h4 className="font-heading text-sm font-semibold text-foreground-900 mb-3">Amenities</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedJet.amenities.map((a) => (
                      <span key={a} className="px-3 py-1.5 rounded-full bg-secondary-100 text-secondary-800 text-xs font-medium whitespace-nowrap">{formatAmenity(a)}</span>
                    ))}
                  </div>
                </div>
                {formSuccess ? (
                  <div className="flex items-center gap-3">
                    <div className="flex-1 flex items-center gap-3 p-3 rounded-xl bg-green-50 border border-green-200">
                      <i className="ri-check-line text-green-600 text-lg shrink-0"></i>
                      <span className="text-sm font-medium text-green-700">
                        {contactMethod === 'whatsapp' ? <>Enquiry sent! We'll WhatsApp you soon.</> : contactMethod === 'phone_call' ? <>Enquiry sent! We'll call you soon.</> : <>Enquiry sent! We'll email you soon.</>}
                      </span>
                    </div>
                    <button onClick={() => setSelectedJet(null)} className="px-5 py-3 rounded-full border border-foreground-200 text-foreground-600 text-sm font-medium hover:bg-background-100 transition-colors whitespace-nowrap cursor-pointer">Close</button>
                  </div>
                ) : (
                  <form onSubmit={handleBookingSubmit} data-readdy-form>
                    <input type="hidden" name="experience_type" value="Private Jet Charter" />
                    <input type="hidden" name="jet_name" value={selectedJet.name} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                      <div>
                        <input name="name" type="text" placeholder="Your full name" required onBlur={handleBookingFieldBlur} onChange={handleBookingFieldChange} className={`w-full px-3 py-2.5 rounded-xl border text-sm text-foreground-900 placeholder:text-foreground-400 outline-none transition-colors ${fieldErrors.name && touchedFields.name ? "border-red-300 bg-red-50/30 focus:border-red-400" : "border-background-200 bg-white focus:border-primary-400"}`} />
                        {fieldErrors.name && touchedFields.name && (
                          <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><i className="ri-error-warning-line text-[10px]"></i>{fieldErrors.name}</p>
                        )}
                      </div>
                      <div>
                        <input name="email" type="email" placeholder="Your email address" required onBlur={handleBookingFieldBlur} onChange={handleBookingFieldChange} className={`w-full px-3 py-2.5 rounded-xl border text-sm text-foreground-900 placeholder:text-foreground-400 outline-none transition-colors ${fieldErrors.email && touchedFields.email ? "border-red-300 bg-red-50/30 focus:border-red-400" : "border-background-200 bg-white focus:border-primary-400"}`} />
                        {fieldErrors.email && touchedFields.email && (
                          <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><i className="ri-error-warning-line text-[10px]"></i>{fieldErrors.email}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 mb-3">
                      <select name="country_code" defaultValue="+90" className="px-2.5 py-2.5 rounded-xl border border-background-200 bg-white text-sm text-foreground-900 outline-none focus:border-primary-400 transition-colors cursor-pointer appearance-none" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center", paddingRight: "28px" }}>
                        <option value="+90">🇹🇷 +90</option>
                        <option value="+44">🇬🇧 +44</option>
                        <option value="+1">🇺🇸 +1</option>
                        <option value="+49">🇩🇪 +49</option>
                        <option value="+33">🇫🇷 +33</option>
                        <option value="+7">🇷🇺 +7</option>
                        <option value="+31">🇳🇱 +31</option>
                        <option value="+46">🇸🇪 +46</option>
                        <option value="+47">🇳🇴 +47</option>
                        <option value="+45">🇩🇰 +45</option>
                        <option value="+358">🇫🇮 +358</option>
                        <option value="+380">🇺🇦 +380</option>
                        <option value="+966">🇸🇦 +966</option>
                        <option value="+971">🇦🇪 +971</option>
                        <option value="+974">🇶🇦 +974</option>
                        <option value="+39">🇮🇹 +39</option>
                        <option value="+34">🇪🇸 +34</option>
                        <option value="+30">🇬🇷 +30</option>
                        <option value="+48">🇵🇱 +48</option>
                        <option value="+40">🇷🇴 +40</option>
                      </select>
                      <input name="phone" type="tel" placeholder="Your phone number (optional)" className="flex-1 px-3 py-2.5 rounded-xl border border-background-200 bg-white text-sm text-foreground-900 placeholder:text-foreground-400 outline-none focus:border-primary-400 transition-colors" />
                    </div>
                    <div className="mb-3">
                      <p className="text-xs font-medium text-foreground-700 mb-2">Preferred contact method</p>
                      <div className="flex flex-wrap gap-3">
                        <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-background-200 bg-white cursor-pointer hover:border-primary-200 transition-colors">
                          <input type="radio" name="preferred_contact" value="phone_call" className="accent-primary-500" />
                          <i className="ri-phone-line text-foreground-500 text-sm"></i>
                          <span className="text-sm text-foreground-700">Phone Call</span>
                        </label>
                        <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-background-200 bg-white cursor-pointer hover:border-primary-200 transition-colors">
                          <input type="radio" name="preferred_contact" value="whatsapp" className="accent-primary-500" />
                          <i className="ri-whatsapp-line text-foreground-500 text-sm"></i>
                          <span className="text-sm text-foreground-700">WhatsApp</span>
                        </label>
                        <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-background-200 bg-white cursor-pointer hover:border-primary-200 transition-colors">
                          <input type="radio" name="preferred_contact" value="email" defaultChecked className="accent-primary-500" />
                          <i className="ri-mail-line text-foreground-500 text-sm"></i>
                          <span className="text-sm text-foreground-700">Email</span>
                        </label>
                      </div>
                    </div>
                    <textarea name="notes" placeholder="Preferred dates, destinations, number of passengers, or special requests? (optional)" maxLength={500} rows={2} className="w-full px-3 py-2.5 rounded-xl border border-background-200 bg-white text-sm text-foreground-900 placeholder:text-foreground-400 outline-none focus:border-primary-400 transition-colors resize-none mb-3"></textarea>
                    <input name="website_alt" type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" readOnly className="booking-offscreen" />
                    {formError && (
                      <p className="text-xs text-red-500 mb-3 flex items-center gap-1"><i className="ri-error-warning-line text-[10px]"></i>{formError}</p>
                    )}
                    <div className="flex items-center gap-3">
                      <button type="submit" disabled={formSubmitting} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 transition-colors whitespace-nowrap cursor-pointer disabled:opacity-60">
                        {formSubmitting ? (<><i className="ri-loader-4-line animate-spin text-sm"></i>Sending...</>) : (<><i className="ri-calendar-check-line text-sm"></i>Enquire Now</>)}
                      </button>
                      <button type="button" onClick={() => setSelectedJet(null)} className="px-5 py-3 rounded-full border border-foreground-200 text-foreground-600 text-sm font-medium hover:bg-background-100 transition-colors whitespace-nowrap cursor-pointer">Close</button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
        <RelatedExperiences currentPage="private-jets" />
      </main>
      <Footer />
    </>
  );
}