import { useState } from "react";
import { useTranslation } from "react-i18next";
import { buildWhatsAppUrl } from "@/config/whatsapp";
import { useFloatingWidgetVisibility } from "./useFloatingWidgetVisibility";
import "@/i18n";

export { WHATSAPP_NUMBER } from "@/config/whatsapp";

export default function WhatsAppFloatingButton() {
  const { t } = useTranslation();
  const [showTooltip, setShowTooltip] = useState(false);
  const isVisible = useFloatingWidgetVisibility();

  if (!isVisible) return null;

  const label = t("floating.whatsappLabel");

  return (
    <div
      data-floating-widget="whatsapp"
      className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-[calc(1rem+env(safe-area-inset-right))] z-40 flex items-center gap-3 sm:bottom-[calc(1.5rem+env(safe-area-inset-bottom))] sm:right-[calc(1.5rem+env(safe-area-inset-right))]"
    >
      {/* Tooltip */}
      <div
        className={`px-4 py-2 rounded-xl bg-white dark:bg-background-800 border border-background-200 dark:border-background-700 shadow-md text-sm font-medium text-foreground-700 dark:text-background-100 whitespace-nowrap transition-all duration-300 ease-out select-none ${
          showTooltip ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2 pointer-events-none"
        }`}
      >
        <span className="flex items-center gap-1.5">
          <i className="ri-whatsapp-line text-green-500 text-base"></i>
          {t("floating.whatsappTooltip")}
        </span>
      </div>

      {/* Button */}
      <a
        href={buildWhatsAppUrl(t("floating.whatsappMessage"))}
        target="_blank"
        rel="noopener noreferrer"
        className="relative w-14 h-14 flex items-center justify-center rounded-full bg-green-500 text-white shadow-lg hover:bg-green-600 hover:scale-105 hover:-translate-y-0.5 active:scale-95 transition-all duration-300 ease-out cursor-pointer"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        aria-label={label}
      >
        <i className="ri-whatsapp-line text-2xl"></i>
        {/* Pulse ring */}
        <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-25"></span>
      </a>
    </div>
  );
}
