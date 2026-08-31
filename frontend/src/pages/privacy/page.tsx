import { Link } from "react-router-dom";
import Navbar from "@/pages/home/components/Navbar";
import Footer from "@/pages/home/components/Footer";
import { useTranslation } from "react-i18next";
import "@/i18n";

export default function PrivacyPage() {
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
            <span className="text-foreground-600">{t("services.privacy.breadcrumb")}</span>
          </nav>
          <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl text-foreground-900 mb-3">
            {t("services.privacy.title")}
          </h1>
          <p className="text-sm md:text-base text-foreground-500 max-w-2xl">
            {t("services.legal.lastUpdated")}
          </p>
        </div>
      </section>

      {/* Content */}
      <main className="flex-1 w-full px-4 md:px-8 lg:px-12 py-10 md:py-14">
        <div className="max-w-3xl mx-auto space-y-10">
          {/* Intro */}
          <section>
            <h2 className="font-heading text-xl md:text-2xl text-foreground-900 mb-4">{t("services.privacy.introTitle")}</h2>
            <p className="text-sm md:text-base text-foreground-600 leading-relaxed mb-4">
              {t("services.privacy.introOne")}
            </p>
            <p className="text-sm md:text-base text-foreground-600 leading-relaxed">
              {t("services.privacy.introTwo")}
            </p>
          </section>

          {/* Information We Collect */}
          <section>
            <h2 className="font-heading text-xl md:text-2xl text-foreground-900 mb-4">{t("services.legal.dataCollection")}</h2>

            <div className="space-y-6">
              <div className="bg-background-50 rounded-xl border border-background-200/70 p-5">
                <h3 className="font-heading text-base text-foreground-800 mb-2 flex items-center gap-2">
                  <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary-100">
                    <i className="ri-user-line text-primary-500"></i>
                  </div>
                  {t("services.privacy.personal")}
                </h3>
                <p className="text-sm text-foreground-500 leading-relaxed">
                  {t("services.privacy.personalDesc")}
                </p>
              </div>

              <div className="bg-background-50 rounded-xl border border-background-200/70 p-5">
                <h3 className="font-heading text-base text-foreground-800 mb-2 flex items-center gap-2">
                  <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-secondary-100">
                    <i className="ri-computer-line text-secondary-500"></i>
                  </div>
                  {t("services.privacy.usage")}
                </h3>
                <p className="text-sm text-foreground-500 leading-relaxed">
                  {t("services.privacy.usageDesc")}
                </p>
              </div>

              <div className="bg-background-50 rounded-xl border border-background-200/70 p-5">
                <h3 className="font-heading text-base text-foreground-800 mb-2 flex items-center gap-2">
                  <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-accent-100">
                    <i className="ri-instance-line text-accent-500"></i>
                  </div>
                  {t("services.privacy.cookies")}
                </h3>
                <p className="text-sm text-foreground-500 leading-relaxed">
                  {t("services.privacy.cookiesDesc")}
                </p>
              </div>
            </div>
          </section>

          {/* How We Use Information */}
          <section>
            <h2 className="font-heading text-xl md:text-2xl text-foreground-900 mb-4">{t("services.legal.howUse")}</h2>
            <ul className="space-y-3">
              {[
                "services.privacy.useOne",
                "services.privacy.useTwo",
                "services.privacy.useThree",
                "services.privacy.useFour",
                "services.privacy.useFive",
                "services.privacy.useSix",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm md:text-base text-foreground-600">
                  <i className="ri-check-line text-primary-500 mt-0.5 shrink-0"></i>
                  <span>{t(item)}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Data Sharing */}
          <section>
            <h2 className="font-heading text-xl md:text-2xl text-foreground-900 mb-4">{t("services.legal.dataSharing")}</h2>
            <p className="text-sm md:text-base text-foreground-600 leading-relaxed mb-4">
              {t("services.privacy.sharingIntro")}
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3 text-sm text-foreground-600">
                <div className="w-6 h-6 flex items-center justify-center rounded-full bg-background-100 shrink-0 mt-0.5">
                  <i className="ri-group-line text-foreground-500 text-xs"></i>
                </div>
                <div>
                  <strong className="text-foreground-800">{t("services.privacy.publicContent")}:</strong> {t("services.privacy.publicContentDesc")}
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm text-foreground-600">
                <div className="w-6 h-6 flex items-center justify-center rounded-full bg-background-100 shrink-0 mt-0.5">
                  <i className="ri-shield-check-line text-foreground-500 text-xs"></i>
                </div>
                <div>
                  <strong className="text-foreground-800">{t("services.privacy.providers")}:</strong> {t("services.privacy.providersDesc")}
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm text-foreground-600">
                <div className="w-6 h-6 flex items-center justify-center rounded-full bg-background-100 shrink-0 mt-0.5">
                  <i className="ri-scales-line text-foreground-500 text-xs"></i>
                </div>
                <div>
                  <strong className="text-foreground-800">{t("services.privacy.compliance")}:</strong> {t("services.privacy.complianceDesc")}
                </div>
              </div>
            </div>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="font-heading text-xl md:text-2xl text-foreground-900 mb-4">{t("services.legal.rights")}</h2>
            <p className="text-sm md:text-base text-foreground-600 leading-relaxed mb-4">
              {t("services.privacy.rightsIntro")}
            </p>
            <ul className="space-y-3">
              {[
                "services.privacy.rightOne",
                "services.privacy.rightTwo",
                "services.privacy.rightThree",
                "services.privacy.rightFour",
                "services.privacy.rightFive",
                "services.privacy.rightSix",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm md:text-base text-foreground-600">
                  <i className="ri-arrow-right-s-line text-accent-500 mt-0.5 shrink-0"></i>
                  <span>{t(item)}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Data Security */}
          <section>
            <h2 className="font-heading text-xl md:text-2xl text-foreground-900 mb-4">{t("services.legal.security")}</h2>
            <p className="text-sm md:text-base text-foreground-600 leading-relaxed">
              {t("services.privacy.securityDesc")}
            </p>
          </section>

          {/* Children */}
          <section>
            <h2 className="font-heading text-xl md:text-2xl text-foreground-900 mb-4">{t("services.legal.children")}</h2>
            <p className="text-sm md:text-base text-foreground-600 leading-relaxed">
              {t("services.privacy.childrenDesc")}
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="font-heading text-xl md:text-2xl text-foreground-900 mb-4">{t("services.legal.contactUs")}</h2>
            <p className="text-sm md:text-base text-foreground-600 leading-relaxed mb-4">
              {t("services.privacy.contactDesc")}
            </p>
            <div className="bg-background-50 rounded-xl border border-background-200/70 p-5 space-y-3">
              <div className="flex items-center gap-3 text-sm text-foreground-600">
                <i className="ri-mail-line text-primary-500"></i>
                <span>privacy@alanyaforum.com</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-foreground-600">
                <i className="ri-map-pin-line text-primary-500"></i>
                <span>{t("services.legal.location")}</span>
              </div>
            </div>
          </section>

          {/* Updates */}
          <section>
            <h2 className="font-heading text-xl md:text-2xl text-foreground-900 mb-4">{t("services.legal.updates")}</h2>
            <p className="text-sm md:text-base text-foreground-600 leading-relaxed">
              {t("services.privacy.changesDesc")}
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
