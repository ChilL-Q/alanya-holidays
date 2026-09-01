interface ViewToggleProps {
  mode: "list" | "map";
  onChange: (mode: "list" | "map") => void;
}

export default function ViewToggle({ mode, onChange }: ViewToggleProps) {
  const { t } = useTranslation();
  return (
    <div className="inline-flex items-center bg-background-100 rounded-full p-1" role="group" aria-label={t("events.viewMode", "Event view mode")}>
      <button
        type="button"
        onClick={() => onChange("list")}
        aria-pressed={mode === "list"}
        aria-label={t("events.listView", "Show events as a list")}
        className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
          mode === "list"
            ? "bg-white text-foreground-900 shadow-sm"
            : "text-foreground-500 hover:text-foreground-700"
        }`}
      >
        <i className="ri-list-check text-sm"></i>
        {t("events.list", "List")}
      </button>
      <button
        type="button"
        onClick={() => onChange("map")}
        aria-pressed={mode === "map"}
        aria-label={t("events.mapView", "Show events on a map")}
        className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
          mode === "map"
            ? "bg-white text-foreground-900 shadow-sm"
            : "text-foreground-500 hover:text-foreground-700"
        }`}
      >
        <i className="ri-map-pin-line text-sm"></i>
        {t("events.map", "Map")}
      </button>
    </div>
  );
}
import { useTranslation } from "react-i18next";
import "@/i18n";
