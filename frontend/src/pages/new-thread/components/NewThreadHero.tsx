import { Link } from "react-router-dom";
import PageHeroImage from "@/components/base/PageHeroImage";
import { useTranslation } from "react-i18next";
import "@/i18n";

export default function NewThreadHero() {
  const { t } = useTranslation();
  return (
    <section className="relative w-full pt-20 md:pt-24 pb-8 md:pb-12 px-4 md:px-8 lg:px-12">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background-100 to-background-50" />
      <div className="absolute inset-0">
        <PageHeroImage
          page="newThread"
          alt=""
          className="w-full h-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background-50/80 via-background-50/50 to-background-50" />
      </div>

      <div className="relative max-w-3xl mx-auto text-center">
        {/* Breadcrumb */}
        <div className="flex items-center justify-center gap-2 text-xs text-foreground-500 mb-4">
          <Link to="/" className="hover:text-primary-500 transition-colors">
            {t("public.home")}
          </Link>
          <i className="ri-arrow-right-s-line"></i>
          <span className="text-foreground-700">{t("public.startDiscussion")}</span>
        </div>

        <h1 className="font-heading text-2xl md:text-4xl text-foreground-900 mb-3">
          {t("public.newDiscussion")}
        </h1>
        <p className="text-sm md:text-base text-foreground-600 max-w-xl mx-auto">
          {t("public.newDiscussionDescription")}
        </p>
      </div>
    </section>
  );
}
