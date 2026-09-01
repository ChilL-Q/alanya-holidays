import { useState, useMemo, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/pages/home/components/Navbar";
import Footer from "@/pages/home/components/Footer";
import PageHeroImage from "@/components/base/PageHeroImage";
import { propertiesService, villaLocations, type Villa, type PropertyItem } from "@/api-services/properties.service";
import { conciergeService } from "@/api-services/concierge.service";
import RelatedExperiences from "@/components/feature/RelatedExperiences";
import { formatAmenity } from "@/utils/format-amenity";
import { createInquiryState } from "@/lib/inquiry-confirmation";
import ErrorState from "@/components/base/ErrorState";
import EmptyState from "@/components/base/EmptyState";
import OfferProvenanceNotice from "@/components/feature/OfferProvenanceNotice";
import { useTranslation } from "react-i18next";
import "@/i18n";

export default function VillaStaysPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [allVillas, setAllVillas] = useState<Villa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activeLocation, setActiveLocation] = useState("all");
  const [sortBy, setSortBy] = useState<"rating" | "price-low" | "price-high" | "guests">("rating");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [selectedVilla, setSelectedVilla] = useState<Villa | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const loadVillas = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const res = await propertiesService.getProperties({ type: "villa" });
      const data: PropertyItem[] = res.data;
      if (Array.isArray(data)) {
        const mapped: Villa[] = data.map((p) => ({
          id: p.id,
          name: p.title || p.name || "Villa",
          location: p.location || "Alanya Center",
          bedrooms: p.bedrooms ?? 0,
          bathrooms: p.bathrooms ?? 0,
          maxGuests: p.maxGuests ?? p.max_guests ?? 0,
          pricePerNight: p.pricePerNight ?? p.price_per_night ?? 0,
          currency: p.currency || "EUR",
          hasPool: p.hasPool ?? p.has_pool ?? false,
          hasSeaView: p.hasSeaView ?? p.has_sea_view ?? false,
          image: p.image || p.image_url || (Array.isArray(p.images) && p.images[0]) || "https://images.unsplash.com/photo-1580587771525-78b9dba3b914",
          description: p.description || "",
          amenities: p.amenities || [],
          rating: p.rating ?? 0,
          reviewCount: p.reviewCount ?? p.review_count ?? 0,
          featured: !!p.featured,
          minStay: p.minStay ?? p.min_stay ?? 0,
          distanceToBeach: p.distanceToBeach || p.distance_to_beach || "",
        }));
        setAllVillas(mapped);
      }
    } catch {
      setAllVillas([]);
      setFetchError("Live villa listings could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVillas();
  }, [loadVillas]);

  const filteredVillas = useMemo(() => {
    let results = allVillas;
    if (activeLocation !== "all") {
      const locMap: Record<string, string> = {
        "alanya-center": "Alanya Center",
        "mahmutlar": "Mahmutlar",
        "kargicak": "Kargıcak",
        "konakli": "Konaklı",
        "tosmur": "Tosmur",
      };
      results = results.filter((v) => v.location === locMap[activeLocation]);
    }
    if (sortBy === "rating") results = [...results].sort((a, b) => b.rating - a.rating);
    else if (sortBy === "price-low") results = [...results].sort((a, b) => a.pricePerNight - b.pricePerNight);
    else if (sortBy === "price-high") results = [...results].sort((a, b) => b.pricePerNight - a.pricePerNight);
    else if (sortBy === "guests") results = [...results].sort((a, b) => b.maxGuests - a.maxGuests);
    return results;
  }, [allVillas, activeLocation, sortBy]);

  const sortLabelMap: Record<string, string> = {
    "rating": t("services.topRated"), "price-low": t("services.priceLow"), "price-high": t("services.priceHigh"), "guests": t("services.mostCapacity"),
  };

  const handleBookingSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");
    const form = e.currentTarget;
    const formData = new FormData(form);
    const prefContact = (formData.get("preferred_contact") as string) || "email";
    const bookingName = ((formData.get("name") as string) || "").trim();
    const bookingEmail = ((formData.get("email") as string) || "").trim();
    const bookingPhone = ((formData.get("phone") as string) || "").trim();
    const bookingCountryCode = ((formData.get("country_code") as string) || "").trim();
    const bookingNotes = ((formData.get("notes") as string) || "").trim();
    const confirmationState = createInquiryState({
      name: bookingName,
      email: bookingEmail,
      subject: "Villa Stay",
      message: bookingNotes || `Enquiry for ${selectedVilla?.name ?? "Villa Stay"}`,
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
        experience_type: "Villa Stay",
        item_name: selectedVilla?.name,
        item_id: selectedVilla?.id,
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

  return (
    <>
      <Navbar />
      <main>
        <section className="relative w-full h-[340px] md:h-[460px] overflow-hidden">
          <PageHeroImage
            page="villaStays"
            alt="Boutique Villa Stays in Alanya"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-foreground-950/40 via-foreground-950/15 to-foreground-950/65"></div>
          <div className="absolute bottom-0 left-0 right-0 w-full px-4 md:px-8 lg:px-12 pb-10 md:pb-14">
            <div className="flex items-center gap-2 mb-4">
              <Link to="/" className="text-white/60 hover:text-white/90 text-sm transition-colors underline underline-offset-2">{t("services.home")}</Link>
              <i className="ri-arrow-right-s-line text-white/40 text-sm"></i>
              <Link to="/explore" className="text-white/60 hover:text-white/90 text-sm transition-colors underline underline-offset-2">{t("services.explore")}</Link>
              <i className="ri-arrow-right-s-line text-white/40 text-sm"></i>
              <span className="text-white/90 text-sm">{t("services.villa.breadcrumb")}</span>
            </div>
            <h1 className="font-heading text-3xl md:text-5xl text-white mb-2">{t("services.villa.title")}</h1>
            <p className="text-white/70 text-sm md:text-base max-w-xl">
              {t("services.villa.hero")}
            </p>
          </div>
        </section>

        <section className="w-full px-4 md:px-8 lg:px-12 pt-8 pb-4 bg-background-50">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide flex-wrap">
              {villaLocations.map((loc) => (
                <button
                  key={loc.id}
                  onClick={() => setActiveLocation(loc.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                    activeLocation === loc.id ? "bg-primary-500 text-white" : "bg-white border border-foreground-200 text-foreground-600 hover:border-primary-200 hover:text-foreground-900"
                  }`}
                >
                  <i className={`${loc.icon} text-sm`}></i>
                  {loc.name}
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
                        <button key={key} onClick={() => { setSortBy(key as typeof sortBy); setShowSortDropdown(false); }} className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors cursor-pointer ${sortBy === key ? "bg-primary-50 text-primary-700 font-semibold" : "text-foreground-700 hover:bg-background-100"}`}>
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

        <section className="w-full px-4 md:px-8 lg:px-12 py-4 bg-background-50">
          <div className="max-w-7xl mx-auto">
            {!isLoading && !fetchError && (
              <div>
                <p className="text-sm text-foreground-500">{filteredVillas.length} {filteredVillas.length === 1 ? "villa listing" : "villa listings"}</p>
                <OfferProvenanceNotice />
              </div>
            )}
          </div>
        </section>

        <section className="w-full px-4 md:px-8 lg:px-12 pb-20 bg-background-50">
          <div className="max-w-7xl mx-auto">
            {fetchError ? (
              <ErrorState
                title={t("services.villa.unable")}
                message={fetchError}
                onRetry={loadVillas}
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
            ) : filteredVillas.length === 0 ? (
              <EmptyState
                title={t("services.villa.none")}
                description={t("services.villa.noneDesc")}
                icon="ri-home-4-line"
                action={{
                  label: t("services.resetFilters"),
                  onClick: () => {
                    setActiveLocation("all");
                    setSortBy("rating");
                  },
                }}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                {filteredVillas.map((villa) => (
                  <div key={villa.id} onClick={() => setSelectedVilla(villa)} className="bg-white rounded-2xl border border-background-200/70 hover:border-primary-200/60 overflow-hidden group cursor-pointer transition-all">
                    <div className="relative w-full h-52 md:h-56 overflow-hidden">
                      <img src={villa.image} alt={villa.name} className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500" />
                      {villa.featured && (
                        <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-accent-500 text-white text-xs font-semibold flex items-center gap-1 whitespace-nowrap">
                          <i className="ri-star-fill text-[10px]"></i>{t("services.featured")}
                        </div>
                      )}
                      <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-foreground-700 text-xs font-medium whitespace-nowrap flex items-center gap-1">
                        <i className="ri-map-pin-line text-[11px]"></i>{villa.location}
                      </div>
                      <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                        {villa.hasPool && <span className="px-2 py-0.5 rounded-full bg-foreground-900/70 backdrop-blur-sm text-white text-[11px] font-medium whitespace-nowrap flex items-center gap-1"><i className="ri-drop-line text-[9px]"></i>{t("services.service.pool")}</span>}
                        {villa.hasSeaView && <span className="px-2 py-0.5 rounded-full bg-foreground-900/70 backdrop-blur-sm text-white text-[11px] font-medium whitespace-nowrap flex items-center gap-1"><i className="ri-eye-line text-[9px]"></i>{t("services.service.seaView")}</span>}
                      </div>
                    </div>
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="font-heading text-base text-foreground-900 leading-tight group-hover:text-primary-500 transition-colors">{villa.name}</h3>
                        {villa.rating > 0 && villa.reviewCount > 0 && (
                        <div className="flex items-center gap-1 shrink-0" aria-label={`${villa.rating} from ${villa.reviewCount} reviews`}>
                          <i className="ri-star-fill text-yellow-400 text-sm"></i>
                          <span className="text-sm font-semibold text-foreground-900">{villa.rating}</span>
                          <span className="text-xs text-foreground-500">({villa.reviewCount})</span>
                        </div>
                        )}
                      </div>
                      <p className="text-sm text-foreground-500 leading-relaxed mb-4 line-clamp-2">{villa.description}</p>
                      <div className="flex items-center gap-4 mb-4 text-xs text-foreground-500">
                        <div className="flex items-center gap-1.5"><i className="ri-hotel-bed-line text-foreground-400"></i><span>{villa.bedrooms} BR</span></div>
                        <div className="flex items-center gap-1.5"><i className="ri-user-line text-foreground-400"></i><span>{villa.maxGuests} guests</span></div>
                        <div className="flex items-center gap-1.5"><i className="ri-walk-line text-foreground-400"></i><span>{villa.distanceToBeach}</span></div>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-5">
                        {villa.amenities.slice(0, 4).map((a) => (
                          <span key={a} className="px-2 py-0.5 rounded-full bg-secondary-100 text-secondary-800 text-xs font-medium whitespace-nowrap">{formatAmenity(a)}</span>
                        ))}
                        {villa.amenities.length > 4 && <span className="px-2 py-0.5 rounded-full bg-background-100 text-foreground-500 text-xs whitespace-nowrap">+{villa.amenities.length - 4} more</span>}
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-background-200/70">
                        <div>
                          {villa.pricePerNight > 0 ? (
                            <><span className="text-lg font-bold text-foreground-900">€{villa.pricePerNight}</span>
                            <span className="text-sm text-foreground-500"> / {t("services.perNight")}</span></>
                          ) : (
                            <span className="text-sm font-medium text-foreground-700">{t("services.form.exactPricing")}</span>
                          )}
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); setSelectedVilla(villa); }} className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors whitespace-nowrap cursor-pointer">
                          <i className="ri-hotel-line text-sm"></i>{t("services.viewDetails")}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {selectedVilla && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-foreground-950/60 backdrop-blur-sm" onClick={() => setSelectedVilla(null)}></div>
            <div className="relative bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto z-10">
              <button onClick={() => setSelectedVilla(null)} className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm border border-background-200 text-foreground-600 hover:text-foreground-900 transition-all z-20 cursor-pointer">
                <i className="ri-close-line text-lg"></i>
              </button>
              <div className="relative w-full h-56 md:h-72 overflow-hidden rounded-t-2xl">
                <img src={selectedVilla.image} alt={selectedVilla.name} className="w-full h-full object-cover object-top" />
                {selectedVilla.featured && (
                  <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-accent-500 text-white text-xs font-semibold flex items-center gap-1 whitespace-nowrap">
                    <i className="ri-star-fill text-[10px]"></i>{t("services.featured")}
                  </div>
                )}
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent-100 text-accent-700 text-xs font-medium mb-2">
                      <i className="ri-map-pin-line text-[11px]"></i>{selectedVilla.location}
                    </span>
                    <h2 className="font-heading text-2xl text-foreground-900">{selectedVilla.name}</h2>
                  </div>
                  {selectedVilla.rating > 0 && selectedVilla.reviewCount > 0 && (
                  <div className="flex items-center gap-1 shrink-0 mt-1" aria-label={`${selectedVilla.rating} from ${selectedVilla.reviewCount} reviews`}>
                    <i className="ri-star-fill text-yellow-400 text-base"></i>
                    <span className="text-base font-semibold text-foreground-900">{selectedVilla.rating}</span>
                    <span className="text-sm text-foreground-500">({selectedVilla.reviewCount} {t("services.service.reviews")})</span>
                  </div>
                  )}
                </div>
                <p className="text-sm text-foreground-600 leading-relaxed mb-6">{selectedVilla.description}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  <div className="bg-background-100 rounded-xl p-3 text-center">
                    <i className="ri-hotel-bed-line text-foreground-500 text-lg mb-1 block"></i>
                    <p className="text-xs text-foreground-500">{t("services.service.bedrooms")}</p>
                    <p className="font-semibold text-foreground-900 text-sm">{selectedVilla.bedrooms}</p>
                  </div>
                  <div className="bg-background-100 rounded-xl p-3 text-center">
                    <i className="ri-drop-line text-foreground-500 text-lg mb-1 block"></i>
                    <p className="text-xs text-foreground-500">{t("services.service.bathrooms")}</p>
                    <p className="font-semibold text-foreground-900 text-sm">{selectedVilla.bathrooms}</p>
                  </div>
                  <div className="bg-background-100 rounded-xl p-3 text-center">
                    <i className="ri-team-line text-foreground-500 text-lg mb-1 block"></i>
                    <p className="text-xs text-foreground-500">{t("services.service.maxGuests")}</p>
                    <p className="font-semibold text-foreground-900 text-sm">{selectedVilla.maxGuests}</p>
                  </div>
                  <div className="bg-background-100 rounded-xl p-3 text-center">
                    <i className="ri-walk-line text-foreground-500 text-lg mb-1 block"></i>
                    <p className="text-xs text-foreground-500">{t("services.service.beach")}</p>
                    <p className="font-semibold text-foreground-900 text-sm">{selectedVilla.distanceToBeach}</p>
                  </div>
                </div>
                <div className="bg-primary-50 rounded-xl p-5 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      {selectedVilla.pricePerNight > 0 ? (
                        <><p className="text-xs text-foreground-500 mb-0.5">{t("services.perNight")}</p>
                        <p className="text-2xl font-bold text-foreground-900">€{selectedVilla.pricePerNight.toLocaleString()}</p></>
                      ) : (
                        <p className="text-sm font-medium text-foreground-700">{t("services.form.exactPricing")}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-foreground-500">
                      <i className="ri-calendar-check-line"></i>
                      <span>{t("services.service.minStay", { count: selectedVilla.minStay })}</span>
                    </div>
                  </div>
                </div>
                <div className="mb-6">
                  <h4 className="font-heading text-sm font-semibold text-foreground-900 mb-3">{t("services.amenities")}</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedVilla.amenities.map((a) => (
                      <span key={a} className="px-3 py-1.5 rounded-full bg-secondary-100 text-secondary-800 text-xs font-medium whitespace-nowrap">{formatAmenity(a)}</span>
                    ))}
                  </div>
                </div>
                <form onSubmit={handleBookingSubmit}>
                    <input type="hidden" name="experience_type" value="Villa Stay" />
                    <input type="hidden" name="villa_name" value={selectedVilla.name} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                      <input name="name" type="text" placeholder={t("services.fullName")} required className="w-full px-3 py-2.5 rounded-xl border border-background-200 bg-white text-sm text-foreground-900 placeholder:text-foreground-400 outline-none focus:border-primary-400 transition-colors" />
                      <input name="email" type="email" placeholder={t("services.emailAddress")} required className="w-full px-3 py-2.5 rounded-xl border border-background-200 bg-white text-sm text-foreground-900 placeholder:text-foreground-400 outline-none focus:border-primary-400 transition-colors" />
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
                    <textarea name="notes" placeholder={t("services.form.villaNotes")} maxLength={500} rows={2} className="w-full px-3 py-2.5 rounded-xl border border-background-200 bg-white text-sm text-foreground-900 placeholder:text-foreground-400 outline-none focus:border-primary-400 transition-colors resize-none mb-3"></textarea>
                    <input name="website_alt" type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" readOnly className="booking-offscreen" />
                    {formError && (
                      <p className="text-xs text-red-500 mb-3 flex items-center gap-1">
                        <i className="ri-error-warning-line text-[10px]"></i>
                        {formError}
                      </p>
                    )}
                    <div className="flex items-center gap-3">
                      <button type="submit" disabled={formSubmitting} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 transition-colors whitespace-nowrap cursor-pointer disabled:opacity-60">
                        {formSubmitting ? (
                          <>
                            <i className="ri-loader-4-line animate-spin text-sm"></i>
                            {t("services.form.sending")}
                          </>
                        ) : (
                          <>
                            <i className="ri-calendar-check-line text-sm"></i>
                            Request Availability
                          </>
                        )}
                      </button>
                      <button type="button" onClick={() => setSelectedVilla(null)} className="px-5 py-3 rounded-full border border-foreground-200 text-foreground-600 text-sm font-medium hover:bg-background-100 transition-colors whitespace-nowrap cursor-pointer">{t("services.close")}</button>
                    </div>
                  </form>
              </div>
            </div>
          </div>
        )}
        <RelatedExperiences currentPage="villa-stays" />
      </main>
      <Footer />
    </>
  );
}
