import { useState } from "react";
import { FAQ_ITEMS } from "../data/giftCardsData";
import { useTranslation } from "react-i18next";
import "@/i18n";

export default function GiftCardFaq() {
  const { t } = useTranslation();
  const [openId, setOpenId] = useState<string | null>(FAQ_ITEMS[0]?.id || null);

  const toggleItem = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-primary-100 text-primary-700 mb-3">
          <i className="ri-questionnaire-line text-sm"></i>
          {t("services.gifts.faq")}
        </span>
        <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground-900 mb-4">
          {t("services.gifts.faqTitle")}
        </h2>
        <p className="text-foreground-600 text-base">
          {t("services.gifts.faqDescription")}
        </p>
      </div>

      {/* Accordion List */}
      <div className="space-y-4">
        {FAQ_ITEMS.map((item) => {
          const isOpen = openId === item.id;
          return (
            <div
              key={item.id}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                isOpen
                  ? "bg-background-50 border-primary-300 shadow-sm"
                  : "bg-background-50/70 border-background-200 hover:border-background-300"
              }`}
            >
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`faq-answer-${item.id}`}
                id={`faq-button-${item.id}`}
                onClick={() => toggleItem(item.id)}
                className="w-full flex items-center justify-between p-5 text-left gap-4 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <span className="text-[10px] sm:text-xs font-semibold px-2.5 py-0.5 rounded-md bg-background-200 text-foreground-600 uppercase tracking-wider w-fit">
                    {item.category}
                  </span>
                  <span className="text-base sm:text-lg font-heading font-bold text-foreground-900">
                    {item.question}
                  </span>
                </div>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ${
                    isOpen
                      ? "bg-primary-100 text-primary-700 rotate-180"
                      : "bg-background-200 text-foreground-500"
                  }`}
                >
                  <i className="ri-arrow-down-s-line text-lg"></i>
                </div>
              </button>

              {isOpen && (
                <div
                  id={`faq-answer-${item.id}`}
                  role="region"
                  aria-labelledby={`faq-button-${item.id}`}
                  className="px-5 pb-5 pt-1 text-sm sm:text-base text-foreground-600 leading-relaxed border-t border-background-100"
                >
                  {item.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Support Callout */}
      <div className="mt-12 text-center p-6 rounded-2xl bg-background-100 border border-background-200">
        <p className="text-sm text-foreground-700 font-medium mb-2">
          {t("services.gifts.customRequest")}
        </p>
        <a
          href="/contact"
          className="inline-flex items-center gap-2 text-sm font-bold text-primary-600 hover:text-primary-700 transition-colors"
        >
          <span>{t("services.gifts.contactConcierge")}</span>
          <i className="ri-arrow-right-line"></i>
        </a>
      </div>
    </section>
  );
}
