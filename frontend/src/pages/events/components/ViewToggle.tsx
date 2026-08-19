interface ViewToggleProps {
  mode: "list" | "map";
  onChange: (mode: "list" | "map") => void;
}

export default function ViewToggle({ mode, onChange }: ViewToggleProps) {
  return (
    <div className="inline-flex items-center bg-background-100 rounded-full p-1">
      <button
        onClick={() => onChange("list")}
        className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
          mode === "list"
            ? "bg-white text-foreground-900 shadow-sm"
            : "text-foreground-500 hover:text-foreground-700"
        }`}
      >
        <i className="ri-list-check text-sm"></i>
        List
      </button>
      <button
        onClick={() => onChange("map")}
        className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
          mode === "map"
            ? "bg-white text-foreground-900 shadow-sm"
            : "text-foreground-500 hover:text-foreground-700"
        }`}
      >
        <i className="ri-map-pin-line text-sm"></i>
        Map
      </button>
    </div>
  );
}