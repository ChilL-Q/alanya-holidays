import { useState, useMemo, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/pages/home/components/Navbar";
import Footer from "@/pages/home/components/Footer";
import PageHeroImage from "@/components/base/PageHeroImage";
import RelatedExperiences from "@/components/feature/RelatedExperiences";
import { conciergeService, yachtTypes, type Yacht } from "@/api-services/concierge.service";
import { formatAmenity } from "@/utils/format-amenity";
import { createInquiryState } from "@/lib/inquiry-confirmation";
import ErrorState from "@/components/base/ErrorState";
import EmptyState from "@/components/base/EmptyState";
import OfferProvenanceNotice from "@/components/feature/OfferProvenanceNotice";
import { useTranslation } from "react-i18next";
import "@/i18n";

const typeIconMap: Record<string, string> = {
  "Gulet": "ri-anchor-line",
  "Motor Yacht": "ri-ship-2-fill",
  "Catamaran": "ri-sailboat-line",
  "Sailing Yacht": "ri-compass-3-line",
  "Luxury Yacht": "ri-vip-crown-line",
};

export default function YachtChartersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [yachts, setYachts] = useState<Yacht[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activeType, setActiveType] = useState("all");
  const [sortBy, setSortBy] = useState<"rating" | "price-low" | "price-high" | "capacity">("rating");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [selectedYacht, setSelectedYacht] = useState<Yacht | null>(null);
  const [charterDate, setCharterDate] = useState("");
  const [dateError, setDateError] = useState("");
  const [charterDuration, setCharterDuration] = useState<"half-day" | "full-day" | "multi-day" | null>(null);

  const loadYachts = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await conciergeService.getYachts();
      setYachts(data);
    } catch {
    setFetchError(t("services.failedLoad", { item: t("services.yachts") }));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadYachts();
  }, [loadYachts]);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  // Validation helpers
  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validateBookingField = (name: string, value: string) => {
    if (name === "name" && !value.trim()) return t("services.validation.fullName");
    if (name === "email") {
      if (!value.trim()) return t("services.validation.emailRequired");
      if (!validateEmail(value.trim())) return t("services.validation.emailInvalid");
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

  // Min date = tomorrow
  const tomorrow = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  }, []);

  const handleDateChange = (value: string) => {
    setCharterDate(value);
    if (value && value < tomorrow) {
      setDateError(t("services.service.pleaseSelectDate"));
    } else {
      setDateError("");
    }
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  };

  const formatShortDate = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };

  const filteredYachts = useMemo(() => {
    let results = yachts;

    if (activeType !== "all") {
      const typeMap: Record<string, string> = {
        "gulet": "Gulet",
        "motor-yacht": "Motor Yacht",
        "catamaran": "Catamaran",
        "sailing-yacht": "Sailing Yacht",
        "luxury-yacht": "Luxury Yacht",
      };
      results = results.filter((y) => y.type === typeMap[activeType]);
    }

    if (sortBy === "rating") {
      results = [...results].sort((a, b) => b.rating - a.rating);
    } else if (sortBy === "price-low") {
      results = [...results].sort((a, b) => a.pricePerDay - b.pricePerDay);
    } else if (sortBy === "price-high") {
      results = [...results].sort((a, b) => b.pricePerDay - a.pricePerDay);
    } else if (sortBy === "capacity") {
      results = [...results].sort((a, b) => b.capacity - a.capacity);
    }

    return results;
  }, [activeType, sortBy, yachts]);

  const sortLabelMap: Record<string, string> = {
    "rating": t("services.topRated"),
    "price-low": t("services.priceLow"),
    "price-high": t("services.priceHigh"),
    "capacity": t("services.mostCapacity"),
  };

  const handleBookingSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");
    setFieldErrors({});
    setTouchedFields({});
    const form = e.currentTarget;
    const formData = new FormData(form);
    const prefContact = (formData.get("preferred_contact") as string) || "email";

    // Validate required fields
    const nameErr = validateBookingField("name", formData.get("name") as string || "");
    const emailErr = validateBookingField("email", formData.get("email") as string || "");
    setFieldErrors({ name: nameErr, email: emailErr });
    setTouchedFields({ name: true, email: true });
    if (nameErr || emailErr) {
      setFormError(t("services.validation.fixErrors"));
      return;
    }

    const bookingName = ((formData.get("name") as string) || "").trim();
    const bookingEmail = ((formData.get("email") as string) || "").trim();
    const bookingPhone = ((formData.get("phone") as string) || "").trim();
    const bookingCountryCode = ((formData.get("country_code") as string) || "").trim();
    const bookingNotes = ((formData.get("notes") as string) || "").trim();
    const experienceType = (formData.get("experience_type") as string) || "Yacht Charter";
    const yachtNameVal = (formData.get("yacht_name") as string) || selectedYacht?.name || "Yacht Charter";
    const dateVal = (formData.get("charter_date") as string) || "";
    const durationVal = (formData.get("duration") as string) || "";
    const confirmationMessage = [
      `Request for ${yachtNameVal}`,
      dateVal ? `Preferred date: ${dateVal}` : null,
      durationVal ? `Duration: ${durationVal}` : null,
      bookingNotes || null,
    ].filter(Boolean).join("\n");
    const confirmationState = createInquiryState({
      name: bookingName,
      email: bookingEmail,
      subject: "Yacht Charter",
      message: confirmationMessage,
    });

    const honeypot = formData.get("website_alt") as string;
    if (honeypot && honeypot.trim() !== "") {
      navigate("/booking-confirmation", { state: confirmationState });
      return;
    }
    setFormSubmitting(true);
    try {
      const result = await conciergeService.submitConciergeEnquiry({
        name: bookingName,
        email: bookingEmail,
        phone: bookingPhone,
        country_code: bookingCountryCode,
        preferred_contact: prefContact,
        experience_type: experienceType,
        item_name: yachtNameVal,
        item_id: selectedYacht?.id,
        dates: dateVal,
        duration: durationVal,
        notes: bookingNotes,
      });

      if (result.success) {
        form.reset();
        navigate("/booking-confirmation", { state: confirmationState });
      } else {
        setFormError(t("services.form.somethingWrong"));
      }
    } catch {
      setFormError(t("services.form.networkError"));
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedYacht(null);
    setCharterDate("");
    setDateError("");
    setCharterDuration(null);
    setFormError("");
    setFormSubmitting(false);
  };

  return (
    <>
      <Navbar />
      <main>
        {/* Hero */}
        <section className="relative w-full h-[340px] md:h-[460px] overflow-hidden">
          <PageHeroImage
            page="yachtCharters"
            alt="Luxury Yacht Charters in Alanya"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-foreground-950/40 via-foreground-950/15 to-foreground-950/65"></div>

          <div className="absolute bottom-0 left-0 right-0 w-full px-4 md:px-8 lg:px-12 pb-10 md:pb-14">
            <div className="flex items-center gap-2 mb-4">
              <Link to="/" className="text-white/60 hover:text-white/90 text-sm transition-colors underline underline-offset-2">{t("services.home")}</Link>
              <i className="ri-arrow-right-s-line text-white/40 text-sm"></i>
              <Link to="/explore" className="text-white/60 hover:text-white/90 text-sm transition-colors underline underline-offset-2">{t("services.explore")}</Link>
              <i className="ri-arrow-right-s-line text-white/40 text-sm"></i>
              <span className="text-white/90 text-sm">{t("services.yacht.breadcrumb")}</span>
            </div>
            <h1 className="font-heading text-3xl md:text-5xl text-white mb-2">{t("services.yacht.title")}</h1>
            <p className="text-white/70 text-sm md:text-base max-w-xl">
              {t("services.yacht.hero")}
            </p>
          </div>
        </section>

        {/* Type Filters */}
        <section className="w-full px-4 md:px-8 lg:px-12 pt-8 pb-4 bg-background-50">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide flex-wrap">
              {yachtTypes.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveType(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                    activeType === cat.id
                      ? "bg-primary-500 text-white"
                      : "bg-white border border-foreground-200 text-foreground-600 hover:border-primary-200 hover:text-foreground-900"
                  }`}
                >
                  <i className={`${cat.icon} text-sm`}></i>
                  {cat.name}
                </button>
              ))}

              <div className="ml-auto relative">
                <button
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-foreground-200 text-sm text-foreground-700 hover:border-foreground-300 transition-colors whitespace-nowrap cursor-pointer"
                >
                  <i className="ri-sort-desc text-sm"></i>
                  {sortLabelMap[sortBy]}
                  <i className={`ri-arrow-down-s-line text-sm transition-transform duration-200 ${showSortDropdown ? "rotate-180" : ""}`}></i>
                </button>

                {showSortDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowSortDropdown(false)}></div>
                    <div className="absolute right-0 top-full mt-2 w-52 rounded-xl bg-white border border-background-200/80 overflow-hidden z-20">
                      {Object.entries(sortLabelMap).map(([key, label]) => (
                        <button
                          key={key}
                          onClick={() => { setSortBy(key as typeof sortBy); setShowSortDropdown(false); }}
                          className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors cursor-pointer ${sortBy === key ? "bg-primary-50 text-primary-700 font-semibold" : "text-foreground-700 hover:bg-background-100"}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Results Header */}
        <section className="w-full px-4 md:px-8 lg:px-12 py-4 bg-background-50">
          <div className="max-w-7xl mx-auto">
            {!isLoading && !fetchError && (
              <div>
                <p className="text-sm text-foreground-500">
                  {filteredYachts.length} {filteredYachts.length === 1 ? "yacht listing" : "yacht listings"}
                </p>
                <OfferProvenanceNotice />
              </div>
            )}
          </div>
        </section>

        {/* Yacht Cards Grid */}
        <section className="w-full px-4 md:px-8 lg:px-12 pb-20 bg-background-50">
          <div className="max-w-7xl mx-auto">
            {fetchError ? (
              <ErrorState
                title={t("services.yacht.unable")}
                message={fetchError}
                onRetry={loadYachts}
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
            ) : filteredYachts.length === 0 ? (
              <EmptyState
                title={t("services.yacht.none")}
                description={t("services.yacht.noneDesc")}
                icon="ri-ship-line"
                action={{
                  label: t("services.resetFilters"),
                  onClick: () => {
                    setActiveType("all");
                    setSortBy("rating");
                  },
                }}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                {filteredYachts.map((yacht) => (
                  <div
                    key={yacht.id}
                    className="bg-white rounded-2xl border border-background-200/70 hover:border-primary-200/60 overflow-hidden group cursor-pointer transition-all"
                    onClick={() => { setSelectedYacht(yacht); setCharterDate(""); setDateError(""); setCharterDuration(null); }}
                  >
                    {/* Image */}
                    <div className="relative w-full h-52 md:h-56 overflow-hidden">
                      <img
                        src={yacht.image}
                        alt={yacht.name}
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                      />
                      {yacht.featured && (
                        <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-accent-500 text-white text-xs font-semibold flex items-center gap-1 whitespace-nowrap">
                          <i className="ri-star-fill text-[10px]"></i>
                          Featured
                        </div>
                      )}
                      <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-foreground-700 text-xs font-medium whitespace-nowrap flex items-center gap-1">
                        <i className={`${typeIconMap[yacht.type] || "ri-ship-line"} text-[11px]`}></i>
                        {yacht.type}
                      </div>
                      <div className="absolute bottom-3 left-3">
                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-foreground-900/70 backdrop-blur-sm text-white text-xs font-medium whitespace-nowrap">
                          <i className="ri-map-pin-line text-[10px]"></i>
                          {yacht.port}
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <h3 className="font-heading text-base text-foreground-900 leading-tight group-hover:text-primary-500 transition-colors">
                          {yacht.name}
                        </h3>
                        <div className="flex items-center gap-1 shrink-0">
                          <i className="ri-star-fill text-yellow-400 text-sm"></i>
                          <span className="text-sm font-semibold text-foreground-900">{yacht.rating}</span>
                          <span className="text-xs text-foreground-500">({yacht.reviewCount})</span>
                        </div>
                      </div>

                      <p className="text-xs text-foreground-400 mb-3 flex items-center gap-1.5">
                        <i className="ri-building-line text-[10px]"></i>
                        {yacht.company}
                      </p>

                      <p className="text-sm text-foreground-500 leading-relaxed mb-4 line-clamp-2">
                        {yacht.description}
                      </p>

                      {/* Specs */}
                      <div className="flex items-center gap-4 mb-4 text-xs text-foreground-500">
                        <div className="flex items-center gap-1.5">
                          <i className="ri-ruler-line text-foreground-400"></i>
                          <span>{yacht.length}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <i className="ri-user-line text-foreground-400"></i>
                          <span>{yacht.capacity} guests</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <i className="ri-hotel-bed-line text-foreground-400"></i>
                          <span>{yacht.cabins} cabins</span>
                        </div>
                      </div>

                      {/* Amenities preview */}
                      <div className="flex flex-wrap gap-1.5 mb-5">
                        {yacht.amenities.slice(0, 4).map((amenity) => (
                          <span key={amenity} className="px-2 py-0.5 rounded-full bg-secondary-100 text-secondary-800 text-xs font-medium whitespace-nowrap">
                            {formatAmenity(amenity)}
                          </span>
                        ))}
                        {yacht.amenities.length > 4 && (
                          <span className="px-2 py-0.5 rounded-full bg-background-100 text-foreground-500 text-xs whitespace-nowrap">
                            +{yacht.amenities.length - 4} more
                          </span>
                        )}
                      </div>

                      {/* Price & Action */}
                      <div className="flex items-center justify-between pt-4 border-t border-background-200/70">
                        <div>
                          <span className="text-lg font-bold text-foreground-900">€{yacht.pricePerDay.toLocaleString()}</span>
                          <span className="text-sm text-foreground-500"> / day</span>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedYacht(yacht); setCharterDate(""); setDateError(""); setCharterDuration(null); }}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors whitespace-nowrap cursor-pointer"
                        >
                          <i className="ri-ship-line text-sm"></i>
                          {t("services.viewDetails")}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Yacht Detail Modal */}
        {selectedYacht && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-foreground-950/60 backdrop-blur-sm" onClick={handleCloseModal}></div>
            <div className="relative bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto z-10">
              {/* Close button */}
              <button
                onClick={handleCloseModal}
                className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm border border-background-200 text-foreground-600 hover:text-foreground-900 transition-all z-20 cursor-pointer"
              >
                <i className="ri-close-line text-lg"></i>
              </button>

              {/* Image */}
              <div className="relative w-full h-56 md:h-72 overflow-hidden rounded-t-2xl">
                <img
                  src={selectedYacht.image}
                  alt={selectedYacht.name}
                  className="w-full h-full object-cover object-top"
                />
                {selectedYacht.featured && (
                  <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-accent-500 text-white text-xs font-semibold flex items-center gap-1 whitespace-nowrap">
                    <i className="ri-star-fill text-[10px]"></i>
                    Featured
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent-100 text-accent-700 text-xs font-medium mb-2">
                      <i className={`${typeIconMap[selectedYacht.type] || "ri-ship-line"} text-[11px]`}></i>
                      {selectedYacht.type}
                    </span>
                    <h2 className="font-heading text-2xl text-foreground-900">{selectedYacht.name}</h2>
                    <p className="text-sm text-foreground-400 mt-0.5 flex items-center gap-1.5">
                      <i className="ri-building-line text-[12px]"></i>
                      Operated by {selectedYacht.company}
                    </p>
                    <Link
                      to={`/contact?yacht=${encodeURIComponent(selectedYacht.name)}&company=${encodeURIComponent(selectedYacht.company)}`}
                      className="inline-flex items-center gap-1.5 mt-2 text-xs text-accent-600 hover:text-accent-700 transition-colors"
                    >
                      <i className="ri-mail-send-line text-[11px]"></i>
                      Contact concierge about this yacht
                    </Link>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 mt-1">
                    <i className="ri-star-fill text-yellow-400 text-base"></i>
                    <span className="text-base font-semibold text-foreground-900">{selectedYacht.rating}</span>
                    <span className="text-sm text-foreground-500">({selectedYacht.reviewCount} {t("services.service.reviews")})</span>
                  </div>
                </div>

                <p className="text-sm text-foreground-600 leading-relaxed mb-6">
                  {selectedYacht.description}
                </p>

                {/* Key Specs Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  <div className="bg-background-100 rounded-xl p-3 text-center">
                    <i className="ri-ruler-line text-foreground-500 text-lg mb-1 block"></i>
                    <p className="text-xs text-foreground-500">{t("services.length")}</p>
                    <p className="font-semibold text-foreground-900 text-sm">{selectedYacht.length}</p>
                  </div>
                  <div className="bg-background-100 rounded-xl p-3 text-center">
                    <i className="ri-team-line text-foreground-500 text-lg mb-1 block"></i>
                    <p className="text-xs text-foreground-500">{t("services.capacity")}</p>
                    <p className="font-semibold text-foreground-900 text-sm">{selectedYacht.capacity} guests</p>
                  </div>
                  <div className="bg-background-100 rounded-xl p-3 text-center">
                    <i className="ri-hotel-bed-line text-foreground-500 text-lg mb-1 block"></i>
                    <p className="text-xs text-foreground-500">{t("services.cabins")}</p>
                    <p className="font-semibold text-foreground-900 text-sm">{selectedYacht.cabins}</p>
                  </div>
                  <div className="bg-background-100 rounded-xl p-3 text-center">
                    <i className="ri-calendar-line text-foreground-500 text-lg mb-1 block"></i>
                    <p className="text-xs text-foreground-500">{t("services.year")}</p>
                    <p className="font-semibold text-foreground-900 text-sm">{selectedYacht.year}</p>
                  </div>
                </div>

                {/* Pricing */}
                <div className="bg-primary-50 rounded-xl p-5 mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs text-foreground-500 mb-0.5">{t("services.fullDayCharter")}</p>
                      <p className="text-2xl font-bold text-foreground-900">€{selectedYacht.pricePerDay.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-foreground-500 mb-0.5">{t("services.halfDayCharter")}</p>
                      <p className="text-lg font-semibold text-foreground-700">€{selectedYacht.halfDayPrice.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-foreground-500">
                    {selectedYacht.crewIncluded ? (
                      <>
                        <i className="ri-checkbox-circle-fill text-green-500"></i>
                        <span>{t("services.crewIncluded")}</span>
                      </>
                    ) : (
                      <>
                        <i className="ri-information-line text-amber-500"></i>
                        <span>{t("services.skipperRequired")}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Amenities */}
                <div className="mb-6">
                  <h4 className="font-heading text-sm font-semibold text-foreground-900 mb-3">{t("services.amenitiesEquipment")}</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedYacht.amenities.map((amenity) => (
                      <span key={amenity} className="px-3 py-1.5 rounded-full bg-secondary-100 text-secondary-800 text-xs font-medium whitespace-nowrap">
                        {formatAmenity(amenity)}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Meet the Crew */}
                {selectedYacht.crew && selectedYacht.crew.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-heading text-sm font-semibold text-foreground-900 mb-3">
                      Meet the {selectedYacht.crew.length === 1 ? "Skipper" : "Crew"}
                    </h4>
                    <div className={`grid gap-4 ${selectedYacht.crew.length === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"}`}>
                      {selectedYacht.crew.map((member, idx) => (
                        <div key={idx} className="flex gap-4 p-4 rounded-xl bg-background-50 border border-background-200/60">
                          <div className="w-16 h-20 shrink-0 rounded-lg overflow-hidden">
                            <img
                              src={member.image}
                              alt={member.name}
                              className="w-full h-full object-cover object-top"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <h5 className="font-heading text-sm font-semibold text-foreground-900 truncate">{member.name}</h5>
                              {member.role === "Captain" && (
                                <span className="shrink-0 px-1.5 py-0.5 rounded bg-accent-100 text-accent-700 text-[10px] font-semibold whitespace-nowrap">
                                  <i className="ri-verified-badge-fill text-[10px] mr-0.5"></i>
                                  Licensed
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-foreground-500 mb-1.5 flex items-center gap-1.5">
                              <i className="ri-briefcase-line text-[10px]"></i>
                              {member.role} · {member.experience}
                            </p>
                            <p className="text-xs text-foreground-600 leading-relaxed line-clamp-3">
                              {member.bio}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Available Routes */}
                <div className="mb-6">
                  <h4 className="font-heading text-sm font-semibold text-foreground-900 mb-3">{t("services.availableRoutes")}</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedYacht.availableRoutes.map((route) => (
                      <span key={route} className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-background-100 border border-background-200 text-foreground-700 text-xs font-medium whitespace-nowrap">
                        <i className="ri-map-pin-line text-foreground-400 text-[11px]"></i>
                        {route}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Date Picker */}
                <div className="mb-6 p-5 rounded-xl bg-background-50 border border-background-200/70">
                  <h4 className="font-heading text-sm font-semibold text-foreground-900 mb-1">{t("services.selectCharterDate")}</h4>
                  <p className="text-xs text-foreground-500 mb-4">{t("services.pickSailDay")}</p>

                  <div className={`relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${charterDate && !dateError ? "border-primary-400 bg-primary-50/40" : dateError ? "border-red-300 bg-red-50/40" : "border-background-200 bg-white"}`}>
                    <div className="w-10 h-10 flex items-center justify-center shrink-0 rounded-full bg-white border border-background-200 text-foreground-500">
                      <i className="ri-calendar-line text-lg"></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <input
                        type="date"
                        value={charterDate}
                        min={tomorrow}
                        onChange={(e) => handleDateChange(e.target.value)}
                        className="w-full bg-transparent text-sm text-foreground-900 font-medium outline-none cursor-pointer [color-scheme:light]"
                      />
                      {!charterDate && (
                        <p className="text-xs text-foreground-400 mt-0.5">{t("services.clickChooseDate")}</p>
                      )}
                      {charterDate && !dateError && (
                        <p className="text-xs text-primary-600 mt-0.5 font-medium flex items-center gap-1">
                          <i className="ri-check-fill text-[10px]"></i>
                          {formatDisplayDate(charterDate)}
                        </p>
                      )}
                      {dateError && (
                        <p className="text-xs text-red-500 mt-0.5 flex items-center gap-1">
                          <i className="ri-error-warning-line text-[10px]"></i>
                          {dateError}
                        </p>
                      )}
                    </div>
                    {charterDate && (
                      <button
                        onClick={() => { setCharterDate(""); setDateError(""); }}
                        className="w-8 h-8 flex items-center justify-center shrink-0 rounded-full hover:bg-background-200 text-foreground-400 hover:text-foreground-600 transition-colors cursor-pointer"
                        title={t("services.clearDate")}
                      >
                        <i className="ri-close-line text-sm"></i>
                      </button>
                    )}
                  </div>
                </div>

                {/* Charter Duration Selector */}
                <div className="mb-6 p-5 rounded-xl bg-background-50 border border-background-200/70">
                  <h4 className="font-heading text-sm font-semibold text-foreground-900 mb-1">{t("services.chooseTripDuration")}</h4>
                  <p className="text-xs text-foreground-500 mb-4">{t("services.tripDurationHelp")}</p>

                  <div className="grid grid-cols-3 gap-3">
                    {/* Half Day */}
                    <button
                      onClick={() => setCharterDuration("half-day")}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        charterDuration === "half-day"
                          ? "border-primary-400 bg-primary-50/40"
                          : "border-background-200 bg-white hover:border-primary-200 hover:bg-primary-50/20"
                      }`}
                    >
                      <div className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
                        charterDuration === "half-day"
                          ? "bg-primary-500 text-white"
                          : "bg-background-100 text-foreground-500"
                      }`}>
                        <i className="ri-sun-line text-lg"></i>
                      </div>
                      <span className={`text-sm font-semibold transition-colors ${
                        charterDuration === "half-day" ? "text-primary-700" : "text-foreground-700"
                      }`}>
                        {t("services.halfDay")}
                      </span>
                      <span className="text-xs text-foreground-500">4 {t("services.service.hours")}</span>
                      <span className={`text-sm font-bold transition-colors ${
                        charterDuration === "half-day" ? "text-primary-600" : "text-foreground-500"
                      }`}>
                        €{selectedYacht.halfDayPrice.toLocaleString()}
                      </span>
                    </button>

                    {/* Full Day */}
                    <button
                      onClick={() => setCharterDuration("full-day")}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        charterDuration === "full-day"
                          ? "border-primary-400 bg-primary-50/40"
                          : "border-background-200 bg-white hover:border-primary-200 hover:bg-primary-50/20"
                      }`}
                    >
                      <div className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
                        charterDuration === "full-day"
                          ? "bg-primary-500 text-white"
                          : "bg-background-100 text-foreground-500"
                      }`}>
                        <i className="ri-sun-fill text-lg"></i>
                      </div>
                      <span className={`text-sm font-semibold transition-colors ${
                        charterDuration === "full-day" ? "text-primary-700" : "text-foreground-700"
                      }`}>
                        {t("services.fullDay")}
                      </span>
                      <span className="text-xs text-foreground-500">8 {t("services.service.hours")}</span>
                      <span className={`text-sm font-bold transition-colors ${
                        charterDuration === "full-day" ? "text-primary-600" : "text-foreground-500"
                      }`}>
                        €{selectedYacht.pricePerDay.toLocaleString()}
                      </span>
                    </button>

                    {/* Multi-Day */}
                    <button
                      onClick={() => setCharterDuration("multi-day")}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        charterDuration === "multi-day"
                          ? "border-primary-400 bg-primary-50/40"
                          : "border-background-200 bg-white hover:border-primary-200 hover:bg-primary-50/20"
                      }`}
                    >
                      <div className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
                        charterDuration === "multi-day"
                          ? "bg-primary-500 text-white"
                          : "bg-background-100 text-foreground-500"
                      }`}>
                        <i className="ri-moon-clear-line text-lg"></i>
                      </div>
                      <span className={`text-sm font-semibold transition-colors ${
                        charterDuration === "multi-day" ? "text-primary-700" : "text-foreground-700"
                      }`}>
                        {t("services.multiDay")}
                      </span>
                      <span className="text-xs text-foreground-500">2+ {t("services.service.days")}</span>
                      <span className={`text-sm font-bold transition-colors ${
                        charterDuration === "multi-day" ? "text-primary-600" : "text-foreground-500"
                      }`}>
                        from €{selectedYacht.pricePerDay.toLocaleString()}/day
                      </span>
                    </button>
                  </div>
                </div>

                {/* Pricing Summary (when duration selected) */}
                {charterDuration && (
                  <div className="mb-6 p-4 rounded-xl bg-accent-50 border border-accent-200/60 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 flex items-center justify-center rounded-full bg-accent-100 text-accent-600">
                        <i className="ri-price-tag-3-line text-lg"></i>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground-900">
                          {charterDuration === "half-day" && `${t("services.halfDay")} · €${selectedYacht.halfDayPrice.toLocaleString()}`}
                          {charterDuration === "full-day" && `${t("services.fullDay")} · €${selectedYacht.pricePerDay.toLocaleString()}`}
                          {charterDuration === "multi-day" && `${t("services.multiDay")} · ${t("services.fromPrice")} €${selectedYacht.pricePerDay.toLocaleString()} / ${t("services.service.days")}`}
                        </p>
                        <p className="text-xs text-foreground-500">
                          {charterDuration === "half-day" && t("services.form.fourHourCharter")}
                          {charterDuration === "full-day" && t("services.form.eightHourCharter")}
                          {charterDuration === "multi-day" && t("services.form.exactPricing")}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setCharterDuration(null)}
                      className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-accent-200/60 text-foreground-400 hover:text-foreground-600 transition-colors cursor-pointer"
                      title={t("services.clearDuration")}
                    >
                      <i className="ri-close-line text-sm"></i>
                    </button>
                  </div>
                )}

                {/* CTA */}
                <form onSubmit={handleBookingSubmit}>
                    <input type="hidden" name="experience_type" value="Yacht Charter" />
                    <input type="hidden" name="yacht_name" value={selectedYacht.name} />
                    <input type="hidden" name="company" value={selectedYacht.company} />
                    {charterDate && !dateError && <input type="hidden" name="charter_date" value={formatDisplayDate(charterDate)} />}
                    {charterDuration && <input type="hidden" name="duration" value={charterDuration === "half-day" ? "Half Day" : charterDuration === "full-day" ? "Full Day" : "Multi-Day"} />}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                      <div>
                        <input name="name" type="text" placeholder={t("services.fullName")} required
                          onBlur={handleBookingFieldBlur}
                          onChange={handleBookingFieldChange}
                          className={`w-full px-3 py-2.5 rounded-xl border text-sm text-foreground-900 placeholder:text-foreground-400 outline-none transition-colors ${
                            fieldErrors.name && touchedFields.name
                              ? "border-red-300 bg-red-50/30 focus:border-red-400"
                              : "border-background-200 bg-white focus:border-primary-400"
                          }`} />
                        {fieldErrors.name && touchedFields.name && (
                          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                            <i className="ri-error-warning-line text-[10px]"></i>
                            {fieldErrors.name}
                          </p>
                        )}
                      </div>
                      <div>
                        <input name="email" type="email" placeholder={t("services.emailAddress")} required
                          onBlur={handleBookingFieldBlur}
                          onChange={handleBookingFieldChange}
                          className={`w-full px-3 py-2.5 rounded-xl border text-sm text-foreground-900 placeholder:text-foreground-400 outline-none transition-colors ${
                            fieldErrors.email && touchedFields.email
                              ? "border-red-300 bg-red-50/30 focus:border-red-400"
                              : "border-background-200 bg-white focus:border-primary-400"
                          }`} />
                        {fieldErrors.email && touchedFields.email && (
                          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                            <i className="ri-error-warning-line text-[10px]"></i>
                            {fieldErrors.email}
                          </p>
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
                      <input name="phone" type="tel" placeholder={t("services.phoneOptional")} className="flex-1 px-3 py-2.5 rounded-xl border border-background-200 bg-white text-sm text-foreground-900 placeholder:text-foreground-400 outline-none focus:border-primary-400 transition-colors" />
                    </div>
                    <div className="mb-3">
                      <p className="text-xs font-medium text-foreground-700 mb-2">{t("services.form.contactMethod")} *</p>
                      <div className="flex flex-wrap gap-3">
                        <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-background-200 bg-white cursor-pointer hover:border-primary-200 transition-colors">
                          <input type="radio" name="preferred_contact" value="phone_call" className="accent-primary-500" />
                          <i className="ri-phone-line text-foreground-500 text-sm"></i>
                          <span className="text-sm text-foreground-700">{t("services.phone")}</span>
                        </label>
                        <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-background-200 bg-white cursor-pointer hover:border-primary-200 transition-colors">
                          <input type="radio" name="preferred_contact" value="whatsapp" className="accent-primary-500" />
                          <i className="ri-whatsapp-line text-foreground-500 text-sm"></i>
                          <span className="text-sm text-foreground-700">{t("services.whatsapp")}</span>
                        </label>
                        <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-background-200 bg-white cursor-pointer hover:border-primary-200 transition-colors">
                          <input type="radio" name="preferred_contact" value="email" defaultChecked className="accent-primary-500" />
                          <i className="ri-mail-line text-foreground-500 text-sm"></i>
                          <span className="text-sm text-foreground-700">{t("services.email")}</span>
                        </label>
                      </div>
                    </div>
                    <textarea name="notes" placeholder={t("services.form.yachtNotes")} maxLength={500} rows={2} className="w-full px-3 py-2.5 rounded-xl border border-background-200 bg-white text-sm text-foreground-900 placeholder:text-foreground-400 outline-none focus:border-primary-400 transition-colors resize-none mb-3"></textarea>
                    <input name="website_alt" type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" readOnly className="booking-offscreen" />
                    {formError && (
                      <p className="text-xs text-red-500 mb-3 flex items-center gap-1">
                        <i className="ri-error-warning-line text-[10px]"></i>
                        {formError}
                      </p>
                    )}
                    <div className="flex items-center gap-3">
                      <button
                        type="submit"
                        disabled={formSubmitting}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-full text-sm font-semibold transition-all whitespace-nowrap cursor-pointer disabled:opacity-60 ${
                          charterDate && !dateError
                            ? "bg-primary-500 text-white hover:bg-primary-600"
                            : "bg-secondary-500 text-white hover:bg-secondary-600"
                        }`}
                      >
                        {formSubmitting ? (
                          <>
                            <i className="ri-loader-4-line animate-spin text-sm"></i>
                            {t("services.form.sending")}
                          </>
                        ) : charterDate && !dateError ? (
                          <>
                            <i className="ri-calendar-check-line text-sm"></i>
                            {charterDuration
                              ? t("services.form.requestCharterDate", { duration: charterDuration === "half-day" ? t("services.halfDay") : charterDuration === "full-day" ? t("services.fullDay") : t("services.multiDay"), date: formatShortDate(charterDate) })
                              : t("services.form.requestAvailabilityDate", { date: formatShortDate(charterDate) })}
                          </>
                        ) : charterDuration ? (
                          <>
                            <i className="ri-calendar-line text-sm"></i>
                            {t("services.form.requestCharter", { duration: charterDuration === "half-day" ? t("services.halfDay") : charterDuration === "full-day" ? t("services.fullDay") : t("services.multiDay") })}
                          </>
                        ) : (
                          <>
                            <i className="ri-calendar-line text-sm"></i>
                            {t("services.form.requestAvailability")}
                          </>
                        )}
                      </button>
                      <button type="button" onClick={handleCloseModal} className="px-5 py-3 rounded-full border border-foreground-200 text-foreground-600 text-sm font-medium hover:bg-background-100 transition-colors whitespace-nowrap cursor-pointer">
                        {t("services.close")}
                      </button>
                    </div>
                  </form>
              </div>
            </div>
          </div>
        )}
        <RelatedExperiences currentPage="yacht-charters" />
      </main>
      <Footer />
    </>
  );
}
