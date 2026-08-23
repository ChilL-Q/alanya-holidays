import { eventCategories } from "@/api-services/events.service";

interface EventFiltersProps {
  activeCategory: string | null;
  onCategoryChange: (cat: string | null) => void;
  showFeatured: boolean;
  onFeaturedToggle: (val: boolean) => void;
  showSaved: boolean;
  onSavedToggle: (val: boolean) => void;
}

const categoryIcons: Record<string, string> = {
  "Digital Nomad Events": "ri-macbook-line",
  "Beach Gatherings": "ri-sun-line",
  "Language Exchange Events": "ri-chat-1-line",
  "Hiking Groups": "ri-walk-line",
  "Business Networking": "ri-briefcase-line",
  "Expat Socials": "ri-group-line",
  "Sports Activities": "ri-basketball-line",
  "Traveler Meetups": "ri-suitcase-line",
};

export default function EventFilters({
  activeCategory,
  onCategoryChange,
  showFeatured,
  onFeaturedToggle,
  showSaved,
  onSavedToggle,
}: EventFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide flex-wrap">
        <button
          onClick={() => onCategoryChange(null)}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all shrink-0 ${
            activeCategory === null
              ? "bg-primary-500 text-background-50"
              : "bg-background-100 text-foreground-600 hover:bg-background-200"
          }`}
        >
          <i className="ri-apps-2-line"></i>
          All Events
        </button>

        {eventCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => onCategoryChange(cat === activeCategory ? null : cat)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all shrink-0 ${
              activeCategory === cat
                ? "bg-accent-500 text-background-50"
                : "bg-background-100 text-foreground-600 hover:bg-background-200"
            }`}
          >
            <i className={categoryIcons[cat] || "ri-calendar-event-line"}></i>
            {cat}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 ml-auto shrink-0">
        <button
          onClick={() => onSavedToggle(!showSaved)}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
            showSaved
              ? "bg-primary-100 text-primary-700"
              : "bg-background-100 text-foreground-500"
          }`}
        >
          <i className={`${showSaved ? "ri-bookmark-fill" : "ri-bookmark-line"}`}></i>
          Saved
        </button>
        <button
          onClick={() => onFeaturedToggle(!showFeatured)}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
            showFeatured
              ? "bg-primary-100 text-primary-700"
              : "bg-background-100 text-foreground-500"
          }`}
        >
          <i className={`${showFeatured ? "ri-star-fill" : "ri-star-line"}`}></i>
          Featured
        </button>
      </div>
    </div>
  );
}