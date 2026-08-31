import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/pages/home/components/Navbar";
import Footer from "@/pages/home/components/Footer";
import { adminService } from "@/api-services/admin.service";
import { useTranslation } from "react-i18next";

const faqItems = [
  {
    q: "public.help.faq.start.q",
    a: "public.help.faq.start.a",
  },
  {
    q: "public.help.faq.browse.q",
    a: "public.help.faq.browse.a",
  },
  {
    q: "public.help.faq.account.q",
    a: "public.help.faq.account.a",
  },
  {
    q: "public.help.faq.guidelines.q",
    a: "public.help.faq.guidelines.a",
  },
  {
    q: "public.help.faq.report.q",
    a: "public.help.faq.report.a",
  },
  {
    q: "public.help.faq.edit.q",
    a: "public.help.faq.edit.a",
  },
  {
    q: "public.help.faq.events.q",
    a: "public.help.faq.events.a",
  },
  {
    q: "public.help.faq.marketplace.q",
    a: "public.help.faq.marketplace.a",
  },
  {
    q: "public.help.faq.badge.q",
    a: "public.help.faq.badge.a",
  },
  {
    q: "public.help.faq.password.q",
    a: "public.help.faq.password.a",
  },
];

const forumGuides = [
  {
    icon: "ri-edit-line",
    title: "public.help.guide.posts.title",
    desc: "public.help.guide.posts.desc",
  },
  {
    icon: "ri-search-line",
    title: "public.help.guide.search.title",
    desc: "public.help.guide.search.desc",
  },
  {
    icon: "ri-image-line",
    title: "public.help.guide.photos.title",
    desc: "public.help.guide.photos.desc",
  },
  {
    icon: "ri-notification-3-line",
    title: "public.help.guide.updated.title",
    desc: "public.help.guide.updated.desc",
  },
  {
    icon: "ri-user-star-line",
    title: "public.help.guide.reputation.title",
    desc: "public.help.guide.reputation.desc",
  },
  {
    icon: "ri-chat-smile-2-line",
    title: "public.help.guide.member.title",
    desc: "public.help.guide.member.desc",
  },
];

export default function HelpPage() {
  const { t } = useTranslation();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [formStatus, setFormStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormStatus("submitting");

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      await adminService.submitEnquiry({
        name: String(formData.get("name") || "").trim(),
        email: String(formData.get("email") || "").trim(),
        subject: String(formData.get("subject") || "").trim() || "Support Request",
        message: String(formData.get("message") || "").trim(),
        enquiry_type: "support",
      });
      setFormStatus("success");
      form.reset();
      setTimeout(() => setFormStatus("idle"), 4000);
    } catch {
      setFormStatus("error");
      setTimeout(() => setFormStatus("idle"), 4000);
    }
  };

  return (
    <div className="min-h-screen bg-background-50 flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="bg-background-100 border-b border-background-200/70">
        <div className="w-full px-4 md:px-8 lg:px-12 pt-28 md:pt-32 pb-10 md:pb-14">
          <nav className="flex items-center gap-1.5 text-xs md:text-sm text-foreground-400 mb-4 flex-wrap">
            <Link to="/" className="hover:text-primary-500 transition-colors flex items-center gap-1">
              <i className="ri-home-4-line"></i>
              {t("nav.home")}
            </Link>
            <i className="ri-arrow-right-s-line text-foreground-300"></i>
            <span className="text-foreground-600">{t("public.help.title")}</span>
          </nav>
          <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl text-foreground-900 mb-3">
            {t("public.help.title")}
          </h1>
          <p className="text-sm md:text-base text-foreground-500 max-w-2xl">
            {t("public.help.description")}
          </p>
        </div>
      </section>

      <main className="flex-1 w-full">
        {/* Quick links */}
        <section className="w-full px-4 md:px-8 lg:px-12 py-10 md:py-14">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
            {[
              { icon: "ri-user-add-line", label: t("public.help.createAccount"), href: "/register" },
              { icon: "ri-edit-line", label: t("public.help.startDiscussion"), href: "/new-thread" },
              { icon: "ri-calendar-event-line", label: t("public.help.browseEvents"), href: "/events" },
              { icon: "ri-stack-line", label: t("public.help.allCategories"), href: "/categories" },
              { icon: "ri-information-line", label: t("public.help.aboutUs"), href: "/about" },
            ].map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className="flex flex-col items-center gap-2 p-4 md:p-5 bg-background-50 rounded-xl border border-background-200/70 hover:border-primary-200/60 hover:bg-primary-50/50 transition-all group cursor-pointer"
              >
                <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-background-100 group-hover:bg-primary-100 transition-colors">
                  <i className={`${link.icon} text-foreground-600 group-hover:text-primary-500 transition-colors text-lg`}></i>
                </div>
                <span className="text-xs md:text-sm font-medium text-foreground-700 text-center whitespace-nowrap">
                  {link.label}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="w-full px-4 md:px-8 lg:px-12 py-10 md:py-14 bg-background-100">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-2 mb-2">
              <i className="ri-question-answer-line text-primary-500 text-lg"></i>
              <span className="text-sm font-semibold text-primary-500 uppercase tracking-wider">
                {t("public.help.gotQuestions")}
              </span>
            </div>
            <h2 className="font-heading text-2xl md:text-3xl text-foreground-900 mb-8">
              {t("public.help.faqTitle")}
            </h2>

            <div className="space-y-3">
              {faqItems.map((item, i) => (
                <div
                  key={i}
                  className="bg-background-50 rounded-xl border border-background-200/70 overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left cursor-pointer"
                  >
                    <span className="font-heading text-sm md:text-base text-foreground-800 pr-4">
                      {t(item.q)}
                    </span>
                    <div className={`w-6 h-6 flex items-center justify-center shrink-0 rounded-full bg-background-100 transition-transform duration-200 ${openFaq === i ? "rotate-45" : ""}`}>
                      <i className="ri-add-line text-foreground-500 text-sm"></i>
                    </div>
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      openFaq === i ? "max-h-96 pb-4" : "max-h-0"
                    }`}
                  >
                    <p className="px-5 text-sm text-foreground-500 leading-relaxed">
                      {t(item.a)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Forum How-To Guides */}
        <section className="w-full px-4 md:px-8 lg:px-12 py-10 md:py-14">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-2 mb-2">
              <i className="ri-book-open-line text-accent-500 text-lg"></i>
              <span className="text-sm font-semibold text-accent-500 uppercase tracking-wider">
                {t("public.help.newHere")}
              </span>
            </div>
            <h2 className="font-heading text-2xl md:text-3xl text-foreground-900 mb-8">
              {t("public.help.guidesTitle")}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {forumGuides.map((guide, i) => (
                <div key={i} className="bg-background-50 rounded-xl border border-background-200/70 p-5 hover:border-primary-200/60 transition-all">
                  <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-accent-100 mb-4">
                    <i className={`${guide.icon} text-accent-500`}></i>
                  </div>
                  <h3 className="font-heading text-base text-foreground-800 mb-2">
                    {t(guide.title)}
                  </h3>
                  <p className="text-sm text-foreground-500 leading-relaxed">
                    {t(guide.desc)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Form */}
        <section className="w-full px-4 md:px-8 lg:px-12 py-10 md:py-14 bg-background-100">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-2 mb-2">
              <i className="ri-mail-send-line text-primary-500 text-lg"></i>
              <span className="text-sm font-semibold text-primary-500 uppercase tracking-wider">
                {t("public.help.stillNeedHelp")}
              </span>
            </div>
            <h2 className="font-heading text-2xl md:text-3xl text-foreground-900 mb-2">
              {t("public.help.contactTeam")}
            </h2>
            <p className="text-sm text-foreground-500 mb-8">
              {t("public.help.contactDescription")}
            </p>

            <form
              onSubmit={handleFormSubmit}

              className="bg-background-50 rounded-xl border border-background-200/70 p-6 md:p-8 space-y-5"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-xs font-medium text-foreground-600 mb-1.5">
                    {t("public.yourName")}
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    placeholder={t("public.help.namePlaceholder")}
                    className="w-full bg-background-100 border border-background-200/70 rounded-lg px-4 py-2.5 text-sm text-foreground-800 placeholder:text-foreground-300 focus:outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100/60 transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-xs font-medium text-foreground-600 mb-1.5">
                    {t("public.emailAddress")}
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    placeholder={t("public.help.emailPlaceholder")}
                    className="w-full bg-background-100 border border-background-200/70 rounded-lg px-4 py-2.5 text-sm text-foreground-800 placeholder:text-foreground-300 focus:outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100/60 transition-all"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="subject" className="block text-xs font-medium text-foreground-600 mb-1.5">
                  {t("public.help.subject")}
                </label>
                <select
                  id="subject"
                  name="subject"
                  required
                  className="w-full bg-background-100 border border-background-200/70 rounded-lg px-4 py-2.5 text-sm text-foreground-800 focus:outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100/60 transition-all appearance-none cursor-pointer"
                >
                  <option value="">{t("public.help.selectTopic")}</option>
                  <option value="account">{t("public.help.accountHelp")}</option>
                  <option value="technical">{t("public.help.technicalIssue")}</option>
                  <option value="report">{t("public.help.reportContent")}</option>
                  <option value="suggestion">{t("public.help.suggestion")}</option>
                  <option value="event">{t("public.help.eventQuestion")}</option>
                  <option value="other">{t("public.help.other")}</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-xs font-medium text-foreground-600 mb-1.5">
                  {t("public.yourMessage")}
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={5}
                  maxLength={500}
                  placeholder={t("public.help.messagePlaceholder")}
                  className="w-full bg-background-100 border border-background-200/70 rounded-lg px-4 py-3 text-sm text-foreground-800 placeholder:text-foreground-300 focus:outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100/60 resize-none transition-all"
                />
                <p className="text-[10px] text-foreground-300 mt-1">{t("public.help.maxCharacters")}</p>
              </div>

              {/* Status messages */}
              {formStatus === "success" && (
                <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                  <i className="ri-check-line"></i>
                  {t("public.help.success")}
                </div>
              )}
              {formStatus === "error" && (
                <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <i className="ri-error-warning-line"></i>
                  {t("public.help.error")}
                </div>
              )}

              <button
                type="submit"
                disabled={formStatus === "submitting"}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-500 text-background-50 rounded-full text-sm font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer whitespace-nowrap"
              >
                {formStatus === "submitting" ? (
                  <>
                    <i className="ri-loader-4-line animate-spin"></i>
                    {t("public.sending")}
                  </>
                ) : (
                  <>
                    {t("public.help.sendMessage")}
                    <i className="ri-send-plane-line"></i>
                  </>
                )}
              </button>
            </form>

            {/* Alternative contact */}
            <div className="mt-8 p-5 bg-background-50 rounded-xl border border-background-200/70 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-primary-100">
                  <i className="ri-mail-line text-primary-500"></i>
                </div>
                <div>
                  <p className="text-xs text-foreground-400">{t("public.help.emailDirect")}</p>
                  <p className="text-sm font-medium text-foreground-700">hello@alanyaforum.com</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-accent-100">
                  <i className="ri-discord-line text-accent-500"></i>
                </div>
                <div>
                  <p className="text-xs text-foreground-400">{t("public.help.joinConversation")}</p>
                  <p className="text-sm font-medium text-foreground-700">{t("public.help.discord")}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
