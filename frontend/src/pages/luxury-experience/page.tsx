import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/pages/home/components/Navbar";
import Footer from "@/pages/home/components/Footer";
import PageHeroImage from "@/components/base/PageHeroImage";
import { conciergeService } from "@/api-services/concierge.service";
import { createInquiryState } from "@/lib/inquiry-confirmation";
import { useTranslation } from "react-i18next";
import "@/i18n";

function formatViews(views: number): string {
  if (views >= 1000) return `${(views / 1000).toFixed(1)}k`;
  return String(views);
}

export default function LuxuryExperiencePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const experiences = conciergeService.getLuxuryExperiences();
  const maxViews = Math.max(...experiences.map((e) => e.weeklyViews));
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const handleConciergeSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
    const experienceInterest = (formData.get("experience_interest") as string) || "General Concierge Request";
    const confirmationState = createInquiryState({
      name: bookingName,
      email: bookingEmail,
      subject: experienceInterest === "General Concierge Request" ? "Luxury Experience" : experienceInterest,
      message: bookingNotes || "General concierge request for a bespoke luxury experience.",
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
        experience_type: experienceInterest,
        notes: bookingNotes,
      });

      if (result.success) {
        form.reset();
        navigate("/booking-confirmation", { state: confirmationState });
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
        <section className="relative w-full h-[320px] md:h-[420px] overflow-hidden">
          <PageHeroImage
            page="luxuryExperience"
            alt="Luxury Experiences in Alanya"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-foreground-950/45 via-foreground-950/20 to-foreground-950/70"></div>

          <div className="absolute bottom-0 left-0 right-0 w-full px-4 md:px-8 lg:px-12 pb-10 md:pb-14">
            <div className="flex items-center gap-2 mb-4">
              <Link to="/" className="text-white/60 hover:text-white/90 text-sm transition-colors underline underline-offset-2">{t("nav.home")}</Link>
              <i className="ri-arrow-right-s-line text-white/40 text-sm"></i>
              <span className="text-white/90 text-sm">{t("public.luxuryExperience")}</span>
            </div>
            <h1 className="font-heading text-3xl md:text-5xl text-white mb-2">{t("public.luxuryExperience")}</h1>
            <p className="text-white/70 text-sm md:text-base max-w-xl">
              {t("public.luxuryDescription")}
            </p>
          </div>
        </section>

        <section className="w-full px-4 md:px-8 lg:px-12 py-16 md:py-24 bg-background-50">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-foreground-200 bg-white mb-6">
                <i className="ri-star-line text-accent-500 text-sm"></i>
                <span className="text-sm font-medium text-foreground-700">{t("public.premiumSelection")}</span>
              </div>
              <h2 className="font-heading text-3xl md:text-4xl text-foreground-900 mb-4">{t("public.handpicked")}</h2>
              <p className="text-foreground-500 text-sm md:text-base max-w-xl mx-auto">
                {t("public.handpickedDescription")}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
              {experiences.map((exp) => {
                const isTrending = exp.weeklyViews === maxViews;
                return (
                <button
                  key={exp.title}
                  onClick={() => navigate(exp.categoryLink)}
                  className={`text-left bg-white rounded-2xl p-6 md:p-7 border hover:shadow-lg hover:-translate-y-1 transition-all group cursor-pointer relative overflow-hidden ${isTrending ? 'border-primary-200/70 ring-1 ring-primary-100/60' : 'border-background-200/70 hover:border-primary-200/60'}`}
                >
                  {isTrending && (
                    <div className="absolute top-0 right-0">
                      <div className="flex items-center gap-1.5 bg-primary-500 text-background-50 dark:text-foreground-950 rounded-bl-xl rounded-tr-xl px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap shadow-sm">
                        <i className="ri-fire-line text-sm"></i>
                        {t("public.mostPopular")}
                      </div>
                    </div>
                  )}
                  <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-accent-100 group-hover:bg-accent-200 transition-colors mb-4">
                    <i className={`${exp.icon} text-accent-600 text-xl`}></i>
                  </div>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full bg-accent-100 text-accent-700 text-xs font-medium whitespace-nowrap">{exp.tag}</span>
                    <span className="text-sm font-semibold text-primary-600 whitespace-nowrap">{exp.price}</span>
                  </div>
                  <h3 className="font-heading text-base text-foreground-900 mb-2 group-hover:text-primary-600 transition-colors">{exp.title}</h3>
                  <p className="text-sm text-foreground-500 leading-relaxed mb-3">{exp.description}</p>
                  <div className="flex items-center gap-1.5 text-xs text-foreground-400">
                    <i className="ri-eye-line"></i>
                    <span>{formatViews(exp.weeklyViews)} {t("public.viewsThisWeek")}</span>
                    {isTrending && (
                      <span className="flex items-center gap-0.5 text-primary-500 font-medium">
                        <span className="inline-block w-1 h-1 rounded-full bg-primary-400"></span>
                        {t("public.trendingOne")}
                      </span>
                    )}
                  </div>
                </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="w-full px-4 md:px-8 lg:px-12 py-16 md:py-20 bg-background-100">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-foreground-200 bg-white mb-6">
              <i className="ri-chat-smile-2-line text-primary-500 text-sm"></i>
              <span className="text-sm font-medium text-foreground-700">{t("public.personalConcierge")}</span>
            </div>
            <h2 className="font-heading text-2xl md:text-3xl text-foreground-900 mb-4">{t("public.bespoke")}</h2>
            <p className="text-foreground-500 text-sm md:text-base mb-8">
              {t("public.customExperience")}
            </p>
            <form onSubmit={handleConciergeSubmit} className="max-w-md mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <input name="name" type="text" placeholder={t("public.fullName")} required className="w-full px-4 py-3 rounded-xl border border-background-200 bg-white text-sm text-foreground-900 placeholder:text-foreground-400 outline-none focus:border-primary-400 transition-colors" />
                  <input name="email" type="email" placeholder={t("public.conciergeEmail")} required className="w-full px-4 py-3 rounded-xl border border-background-200 bg-white text-sm text-foreground-900 placeholder:text-foreground-400 outline-none focus:border-primary-400 transition-colors" />
                </div>
                <div className="flex gap-2 mb-3">
                  <select name="country_code" defaultValue="+90" className="px-2.5 py-3 rounded-xl border border-background-200 bg-white text-sm text-foreground-900 outline-none focus:border-primary-400 transition-colors cursor-pointer appearance-none" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center", paddingRight: "28px" }}>
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
                  <input name="phone" type="tel" placeholder={t("public.phoneOptional")} className="flex-1 px-4 py-3 rounded-xl border border-background-200 bg-white text-sm text-foreground-900 placeholder:text-foreground-400 outline-none focus:border-primary-400 transition-colors" />
                </div>
                <div className="mb-3">
                  <p className="text-xs font-medium text-foreground-700 mb-2">{t("public.preferredContact")}</p>
                  <div className="flex flex-wrap gap-3 justify-center">
                    <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-background-200 bg-white cursor-pointer hover:border-primary-200 transition-colors">
                      <input type="radio" name="preferred_contact" value="phone_call" className="accent-primary-500" />
                      <i className="ri-phone-line text-foreground-500 text-sm"></i>
                      <span className="text-sm text-foreground-700">{t("public.phoneCall")}</span>
                    </label>
                    <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-background-200 bg-white cursor-pointer hover:border-primary-200 transition-colors">
                      <input type="radio" name="preferred_contact" value="whatsapp" className="accent-primary-500" />
                      <i className="ri-whatsapp-line text-foreground-500 text-sm"></i>
                      <span className="text-sm text-foreground-700">{t("public.whatsapp")}</span>
                    </label>
                    <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-background-200 bg-white cursor-pointer hover:border-primary-200 transition-colors">
                      <input type="radio" name="preferred_contact" value="email" defaultChecked className="accent-primary-500" />
                      <i className="ri-mail-line text-foreground-500 text-sm"></i>
                      <span className="text-sm text-foreground-700">{t("public.email")}</span>
                    </label>
                  </div>
                </div>
                <textarea name="notes" placeholder={t("public.conciergeNotes")} maxLength={500} rows={3} className="w-full px-4 py-3 rounded-xl border border-background-200 bg-white text-sm text-foreground-900 placeholder:text-foreground-400 outline-none focus:border-primary-400 transition-colors resize-none mb-3"></textarea>
                <input name="website_alt" type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" readOnly className="booking-offscreen" />
                {formError && (
                  <p className="text-xs text-red-500 mb-3 flex items-center justify-center gap-1">
                    <i className="ri-error-warning-line text-[10px]"></i>
                    {formError}
                  </p>
                )}
                <button type="submit" disabled={formSubmitting} className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-background-50 dark:text-foreground-950 rounded-full text-sm font-semibold hover:bg-primary-600 transition-colors whitespace-nowrap cursor-pointer disabled:opacity-60">
                  {formSubmitting ? (
                    <>
                      <i className="ri-loader-4-line animate-spin text-sm"></i>
                      {t("public.sending")}
                    </>
                  ) : (
                    <>
                      {t("public.contactConcierge")}
                      <i className="ri-arrow-right-line"></i>
                    </>
                  )}
                </button>
              </form>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
