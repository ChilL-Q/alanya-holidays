import { useTranslation } from "react-i18next";

export default function WelcomeSection() {
  const { t } = useTranslation();
  return (
    <section className="py-20 md:py-28 bg-background-50">
      <div className="w-full px-4 md:px-8 lg:px-12 max-w-4xl mx-auto text-center">
        {/* Label */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-foreground-200 bg-white mb-8">
          <i className="ri-heart-3-line text-primary-500 text-sm"></i>
          <span className="text-sm font-medium text-foreground-700">
            {t("home.welcomeLabel", "Welcome to the Community")}
          </span>
        </div>

        {/* Heading */}
        <h2 className="font-heading text-3xl md:text-5xl lg:text-6xl text-foreground-900 leading-tight mb-6">
          {t("home.welcomeHeading", "Share your stories, find hidden gems, and make real connections in Alanya")}
        </h2>

        {/* Description */}
        <p className="text-foreground-600 text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
          {t("home.welcomeDescription", "Whether you are planning your first visit, living here as an expat, or born and raised in Antalya — this is your space to ask questions, share discoveries, and meet like-minded people.")}
        </p>
      </div>
    </section>
  );
}
