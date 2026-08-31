import { Link } from "react-router-dom";
import Navbar from "@/pages/home/components/Navbar";
import Footer from "@/pages/home/components/Footer";
import { useTranslation } from "react-i18next";
import "@/i18n";

export default function TermsPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-background-50 flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="bg-background-100 border-b border-background-200/70">
        <div className="w-full px-4 md:px-8 lg:px-12 pt-28 md:pt-32 pb-10 md:pb-14">
          <nav className="flex items-center gap-1.5 text-xs md:text-sm text-foreground-400 mb-4 flex-wrap">
            <Link to="/" className="hover:text-primary-500 transition-colors flex items-center gap-1">
              <i className="ri-home-4-line"></i>
              {t("services.home")}
            </Link>
            <i className="ri-arrow-right-s-line text-foreground-300"></i>
            <span className="text-foreground-600">{t("services.terms.breadcrumb")}</span>
          </nav>
          <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl text-foreground-900 mb-3">
            {t("services.terms.title")}
          </h1>
          <p className="text-sm md:text-base text-foreground-500 max-w-2xl">
            {t("services.legal.lastUpdated")}
          </p>
        </div>
      </section>

      {/* Content */}
      <main className="flex-1 w-full px-4 md:px-8 lg:px-12 py-10 md:py-14">
        <div className="max-w-3xl mx-auto space-y-10">
          {/* Acceptance */}
          <section>
            <h2 className="font-heading text-xl md:text-2xl text-foreground-900 mb-4">{t("services.legal.acceptance")}</h2>
            <p className="text-sm md:text-base text-foreground-600 leading-relaxed">
              {t("services.terms.acceptanceDesc")}
            </p>
          </section>

          {/* Community Guidelines */}
          <section>
            <h2 className="font-heading text-xl md:text-2xl text-foreground-900 mb-4">{t("services.legal.communityGuidelines")}</h2>
            <p className="text-sm md:text-base text-foreground-600 leading-relaxed mb-5">
              {t("services.terms.guidelinesDesc")}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { icon: "ri-heart-line", title: "services.terms.respect", desc: "services.terms.respectDesc" },
                { icon: "ri-lightbulb-line", title: "services.terms.helpful", desc: "services.terms.helpfulDesc" },
                { icon: "ri-shield-check-line", title: "services.terms.honest", desc: "services.terms.honestDesc" },
                { icon: "ri-global-line", title: "services.terms.inclusive", desc: "services.terms.inclusiveDesc" },
              ].map((item, i) => (
                <div key={i} className="bg-background-50 rounded-xl border border-background-200/70 p-5">
                  <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-primary-100 mb-3">
                    <i className={`${item.icon} text-primary-500`}></i>
                  </div>
                  <h3 className="font-heading text-base text-foreground-800 mb-1.5">{t(item.title)}</h3>
                  <p className="text-sm text-foreground-500 leading-relaxed">{t(item.desc)}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Prohibited Content */}
          <section>
            <h2 className="font-heading text-xl md:text-2xl text-foreground-900 mb-4">{t("services.legal.prohibitedContent")}</h2>
            <p className="text-sm md:text-base text-foreground-600 leading-relaxed mb-4">
              {t("services.terms.prohibitedDesc")}
            </p>
            <ul className="space-y-3">
              {[
                "services.terms.prohibitedOne",
                "services.terms.prohibitedTwo",
                "services.terms.prohibitedThree",
                "services.terms.prohibitedFour",
                "services.terms.prohibitedFive",
                "services.terms.prohibitedSix",
                "services.terms.prohibitedSeven",
                "services.terms.prohibitedEight",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm md:text-base text-foreground-600">
                  <i className="ri-close-circle-line text-red-500 mt-0.5 shrink-0"></i>
                  <span>{t(item)}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* User Accounts */}
          <section>
            <h2 className="font-heading text-xl md:text-2xl text-foreground-900 mb-4">{t("services.legal.userAccounts")}</h2>
            <div className="space-y-4">
              <div className="bg-background-50 rounded-xl border border-background-200/70 p-5">
                <h3 className="font-heading text-base text-foreground-800 mb-2">{t("services.terms.accountResponsibility")}</h3>
                <p className="text-sm text-foreground-500 leading-relaxed">
                  {t("services.terms.accountResponsibilityDesc")}
                </p>
              </div>
              <div className="bg-background-50 rounded-xl border border-background-200/70 p-5">
                <h3 className="font-heading text-base text-foreground-800 mb-2">{t("services.terms.termination")}</h3>
                <p className="text-sm text-foreground-500 leading-relaxed">
                  {t("services.terms.terminationDesc")}
                </p>
              </div>
            </div>
          </section>

          {/* Content Ownership */}
          <section>
            <h2 className="font-heading text-xl md:text-2xl text-foreground-900 mb-4">{t("services.legal.contentOwnership")}</h2>
            <p className="text-sm md:text-base text-foreground-600 leading-relaxed mb-4">
              {t("services.terms.contentDescOne")}
            </p>
            <p className="text-sm md:text-base text-foreground-600 leading-relaxed">
              {t("services.terms.contentDescTwo")}
            </p>
          </section>

          {/* Marketplace & Transactions */}
          <section>
            <h2 className="font-heading text-xl md:text-2xl text-foreground-900 mb-4">{t("services.legal.marketplace")}</h2>
            <p className="text-sm md:text-base text-foreground-600 leading-relaxed">
              {t("services.terms.marketplaceDesc")}
            </p>
          </section>

          {/* Disclaimer */}
          <section>
            <h2 className="font-heading text-xl md:text-2xl text-foreground-900 mb-4">{t("services.legal.disclaimer")}</h2>
            <p className="text-sm md:text-base text-foreground-600 leading-relaxed">
              {t("services.terms.disclaimerDesc")}
            </p>
          </section>

          {/* Limitation */}
          <section>
            <h2 className="font-heading text-xl md:text-2xl text-foreground-900 mb-4">{t("services.legal.liability")}</h2>
            <p className="text-sm md:text-base text-foreground-600 leading-relaxed">
              {t("services.terms.liabilityDesc")}
            </p>
          </section>

          {/* Governing Law */}
          <section>
            <h2 className="font-heading text-xl md:text-2xl text-foreground-900 mb-4">{t("services.legal.governingLaw")}</h2>
            <p className="text-sm md:text-base text-foreground-600 leading-relaxed">
              {t("services.terms.governingDesc")}
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="font-heading text-xl md:text-2xl text-foreground-900 mb-4">{t("services.legal.contact")}</h2>
            <p className="text-sm md:text-base text-foreground-600 leading-relaxed mb-4">
              {t("services.terms.contactDesc")}
            </p>
            <div className="bg-background-50 rounded-xl border border-background-200/70 p-5 space-y-3">
              <div className="flex items-center gap-3 text-sm text-foreground-600">
                <i className="ri-mail-line text-primary-500"></i>
                <span>legal@alanyaforum.com</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-foreground-600">
                <i className="ri-map-pin-line text-primary-500"></i>
                <span>{t("services.legal.location")}</span>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
