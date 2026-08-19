import { useState, useMemo } from "react";
import { businesses } from "@/mocks/businesses";
import { events } from "@/mocks/events";
import { aiGuideService, type ItineraryActivity } from "@/api-services/ai-guide.service";

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: {
    type: "business" | "event" | "custom";
    referenceId?: string;
    customName?: string;
    customDescription?: string;
    image?: string;
    subcategory?: string;
    dayLabel: string;
    timeSlot: string;
    notes: string;
    completed: boolean;
    order: number;
  }) => void;
  dayLabels: string[];
  currentDayLabel: string;
  onDayLabelChange: (label: string) => void;
}

const TIME_SLOTS = [
  "Morning (8AM - 12PM)",
  "Afternoon (12PM - 5PM)",
  "Evening (5PM - 9PM)",
  "Night (9PM+)",
  "All Day",
  "Flexible",
];

type SourceTab = "favorites" | "browse" | "events" | "custom" | "ai";

function getFavoritedBusinessIds(): string[] {
  try {
    const raw = localStorage.getItem("alanya_favorites");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter((id: unknown): id is string => typeof id === "string");
    }
  } catch {
    // ignore
  }
  return [];
}

const QUICK_AI_SUGGESTIONS: ItineraryActivity[] = [
  {
    name: "Alanya Teleferik Cable Car & Castle",
    description: "Scenic 5-min cable car from Cleopatra beach up to the medieval castle fortress.",
    timeSlot: "Morning (8AM - 12PM)",
    subcategory: "Sightseeing",
    notes: "Best morning light for photography.",
  },
  {
    name: "Dim Çayı Riverside Lunch & Swim",
    description: "Relax on floating pergolas above cool mountain waters and enjoy fresh trout.",
    timeSlot: "Afternoon (12PM - 5PM)",
    subcategory: "Dining & Nature",
    notes: "Super refreshing on warm sunny days.",
  },
  {
    name: "Sunset at Kızıl Kule (Red Tower) Harbor",
    description: "Walk the historic 13th-century harbor promenade and Seljuk shipyard.",
    timeSlot: "Evening (5PM - 9PM)",
    subcategory: "Historical",
    notes: "Golden hour sunset over castle walls.",
  },
  {
    name: "Sapadere Canyon Walk & Waterfalls",
    description: "Suspended wooden walkways along emerald canyon pools in the Taurus foothills.",
    timeSlot: "Morning (8AM - 12PM)",
    subcategory: "Adventure",
    notes: "Pack swimwear and water shoes.",
  },
  {
    name: "Traditional Turkish Hammam & Spa",
    description: "Authentic Turkish bath ritual with kese scrub, foam massage, and oils.",
    timeSlot: "Afternoon (12PM - 5PM)",
    subcategory: "Wellness",
    notes: "Allow 90 mins for full relaxation.",
  },
  {
    name: "Tandem Paragliding over Cleopatra Beach",
    description: "Fly from 800m Taurus mountain heights and glide to Cleopatra Beach.",
    timeSlot: "Morning (8AM - 12PM)",
    subcategory: "Adventure",
    notes: "GoPro video usually included.",
  },
];

export default function AddItemModal({
  isOpen,
  onClose,
  onAdd,
  dayLabels,
  currentDayLabel,
  onDayLabelChange,
}: AddItemModalProps) {
  const [sourceTab, setSourceTab] = useState<SourceTab>("favorites");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDay, setSelectedDay] = useState(currentDayLabel);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("Flexible");
  const [itemNotes, setItemNotes] = useState("");
  const [customName, setCustomName] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [newDayLabel, setNewDayLabel] = useState("");

  // AI prompt state
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponseText, setAiResponseText] = useState<string | null>(null);

  const favoriteIds = useMemo(() => getFavoritedBusinessIds(), []);
  const favoriteBusinesses = useMemo(
    () => businesses.filter((b) => favoriteIds.includes(b.id)),
    [favoriteIds],
  );

  const filteredBusinesses = useMemo(() => {
    if (!searchQuery.trim()) return businesses.slice(0, 20);
    const q = searchQuery.toLowerCase();
    return businesses
      .filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.subcategory.toLowerCase().includes(q) ||
          b.tags.some((t) => t.toLowerCase().includes(q)),
      )
      .slice(0, 20);
  }, [searchQuery]);

  const filteredEvents = useMemo(() => {
    const now = new Date();
    const upcoming = events.filter((e) => new Date(e.date) >= now);
    if (!searchQuery.trim()) return upcoming.slice(0, 20);
    const q = searchQuery.toLowerCase();
    return upcoming
      .filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.location.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q),
      )
      .slice(0, 20);
  }, [searchQuery]);

  function handleAddBusiness(biz: (typeof businesses)[number]) {
    onAdd({
      type: "business",
      referenceId: biz.id,
      image: biz.image,
      subcategory: biz.subcategory,
      dayLabel: selectedDay,
      timeSlot: selectedTimeSlot,
      notes: itemNotes,
      completed: false,
      order: 0,
    });
    resetForm();
    onClose();
  }

  function handleAddEvent(evt: (typeof events)[number]) {
    onAdd({
      type: "event",
      referenceId: evt.id,
      image: evt.image,
      subcategory: evt.category,
      dayLabel: selectedDay,
      timeSlot: selectedTimeSlot,
      notes: itemNotes,
      completed: false,
      order: 0,
    });
    resetForm();
    onClose();
  }

  function handleAddCustom() {
    if (!customName.trim()) return;
    onAdd({
      type: "custom",
      customName: customName.trim(),
      customDescription: customDescription.trim(),
      dayLabel: selectedDay,
      timeSlot: selectedTimeSlot,
      notes: itemNotes,
      completed: false,
      order: 0,
    });
    resetForm();
    onClose();
  }

  function handleAddAiSuggestion(sug: ItineraryActivity) {
    onAdd({
      type: "custom",
      customName: sug.name,
      customDescription: sug.description,
      dayLabel: selectedDay,
      timeSlot: sug.timeSlot || selectedTimeSlot,
      subcategory: sug.subcategory || "AI Suggestion",
      notes: sug.notes || itemNotes,
      completed: false,
      order: 0,
    });
    resetForm();
    onClose();
  }

  async function handleAskAiForIdeas() {
    if (!aiPrompt.trim() || aiLoading) return;
    setAiLoading(true);
    setAiResponseText(null);
    try {
      const res = await aiGuideService.askGuide({
        userQuestion: `Recommend 3 specific activities or places in Alanya for ${aiPrompt.trim()}. Keep each recommendation concise with name and quick description.`,
      });
      setAiResponseText(res.answer);
    } catch {
      setAiResponseText(aiGuideService.getCuratedFallback({ userQuestion: aiPrompt }));
    } finally {
      setAiLoading(false);
    }
  }

  function handleAddNewDay() {
    const trimmed = newDayLabel.trim();
    if (!trimmed) return;
    onDayLabelChange(trimmed);
    setSelectedDay(trimmed);
    setNewDayLabel("");
  }

  function resetForm() {
    setSearchQuery("");
    setSelectedTimeSlot("Flexible");
    setItemNotes("");
    setCustomName("");
    setCustomDescription("");
    setAiPrompt("");
    setAiResponseText(null);
  }

  if (!isOpen) return null;

  const tabs: { key: SourceTab; label: string; icon: string; count?: number }[] = [
    { key: "ai", label: "AI Suggestions", icon: "ri-sparkling-fill" },
    { key: "favorites", label: "Favorites", icon: "ri-heart-line", count: favoriteBusinesses.length },
    { key: "browse", label: "Browse", icon: "ri-store-2-line" },
    { key: "events", label: "Events", icon: "ri-calendar-event-line", count: filteredEvents.length },
    { key: "custom", label: "Custom", icon: "ri-edit-line" },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-12 pb-8 overflow-y-auto" onClick={onClose}>
      <div
        className="bg-white rounded-2xl max-w-2xl w-full mx-4 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-background-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center">
              <i className="ri-add-line text-primary-500"></i>
            </div>
            <div>
              <h3 className="font-heading text-base font-semibold text-foreground-900">Add to Plan</h3>
              <p className="text-xs text-foreground-500">Choose what to add to your itinerary</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center border border-foreground-200 text-foreground-400 hover:text-foreground-600 hover:bg-background-100 transition-colors cursor-pointer"
          >
            <i className="ri-close-line"></i>
          </button>
        </div>

        {/* Day & Time selectors */}
        <div className="px-6 py-4 bg-background-50 border-b border-background-200">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Day selector */}
            <div className="flex-1">
              <label className="block text-xs font-semibold text-foreground-500 uppercase tracking-wider mb-2">
                Day
              </label>
              <div className="flex flex-wrap gap-1.5">
                {dayLabels.map((label) => (
                  <button
                    key={label}
                    onClick={() => setSelectedDay(label)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                      selectedDay === label
                        ? "bg-primary-500 text-white"
                        : "bg-background-100 text-foreground-600 hover:bg-background-200"
                    }`}
                  >
                    {label}
                  </button>
                ))}
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={newDayLabel}
                    onChange={(e) => setNewDayLabel(e.target.value)}
                    placeholder="New day..."
                    className="w-24 px-2.5 py-1.5 text-xs rounded-full border border-background-200 bg-white focus:outline-none focus:border-primary-300 text-foreground-700 placeholder:text-foreground-300"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddNewDay();
                    }}
                  />
                  <button
                    onClick={handleAddNewDay}
                    disabled={!newDayLabel.trim()}
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shrink-0"
                  >
                    <i className="ri-add-line text-xs"></i>
                  </button>
                </div>
              </div>
            </div>

            {/* Time slot selector */}
            <div className="flex-1">
              <label className="block text-xs font-semibold text-foreground-500 uppercase tracking-wider mb-2">
                Time Slot
              </label>
              <select
                value={selectedTimeSlot}
                onChange={(e) => setSelectedTimeSlot(e.target.value)}
                className="w-full px-3 py-1.5 text-sm rounded-lg border border-background-200 bg-white text-foreground-700 focus:outline-none focus:border-primary-300 cursor-pointer"
              >
                {TIME_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Source tabs */}
        <div className="px-6 pt-4">
          <div className="flex gap-1 bg-background-100 rounded-full p-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSourceTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  sourceTab === tab.key
                    ? "bg-white text-foreground-900 shadow-xs"
                    : "text-foreground-500 hover:text-foreground-700"
                }`}
              >
                <i className={`${tab.icon} ${tab.key === "ai" ? "text-primary-500" : ""} text-sm`}></i>
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                    sourceTab === tab.key
                      ? "bg-primary-100 text-primary-700"
                      : "bg-background-200 text-foreground-500"
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Search (for browse & events tabs) */}
        {(sourceTab === "browse" || sourceTab === "events") && (
          <div className="px-6 pt-4">
            <div className="relative">
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-foreground-400 text-sm"></i>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={sourceTab === "browse" ? "Search businesses by name, category, or tag..." : "Search events..."}
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-background-200 bg-background-50 focus:outline-none focus:border-primary-300 text-foreground-700 placeholder:text-foreground-300"
              />
            </div>
          </div>
        )}

        {/* Items list */}
        <div className="px-6 py-4 max-h-[380px] overflow-y-auto">
          {/* AI Suggestions Tab */}
          {sourceTab === "ai" && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Ask Gemini: e.g. romantic sunset spot, quiet beach..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAskAiForIdeas();
                  }}
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-background-200 bg-background-50 focus:outline-none focus:border-primary-300 text-foreground-700 placeholder:text-foreground-400"
                />
                <button
                  onClick={handleAskAiForIdeas}
                  disabled={!aiPrompt.trim() || aiLoading}
                  className="px-4 py-2 rounded-xl bg-primary-500 text-white text-xs font-semibold hover:bg-primary-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1"
                >
                  {aiLoading ? (
                    <i className="ri-loader-4-line animate-spin"></i>
                  ) : (
                    <i className="ri-sparkling-fill"></i>
                  )}
                  Ask AI
                </button>
              </div>

              {aiResponseText && (
                <div className="p-3 rounded-xl bg-primary-50/70 border border-primary-100 text-xs text-foreground-800 leading-relaxed whitespace-pre-wrap">
                  {aiResponseText}
                </div>
              )}

              <div>
                <p className="text-[11px] font-semibold text-foreground-400 uppercase tracking-wider mb-2">
                  Top Recommended Alanya Highlights
                </p>
                <div className="space-y-2">
                  {QUICK_AI_SUGGESTIONS.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-background-200 hover:border-primary-300 hover:bg-primary-50/30 transition-all flex items-start justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-foreground-900">{item.name}</h4>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary-100 text-secondary-700 font-medium">
                            {item.timeSlot}
                          </span>
                        </div>
                        <p className="text-xs text-foreground-500 mt-1 line-clamp-2">{item.description}</p>
                        {item.notes && (
                          <p className="text-[10px] text-accent-700 mt-1 italic">
                            💡 {item.notes}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleAddAiSuggestion(item)}
                        className="px-3 py-1.5 rounded-lg bg-primary-500 text-white text-xs font-semibold hover:bg-primary-600 transition-colors whitespace-nowrap cursor-pointer shrink-0"
                      >
                        + Add
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Favorites tab */}
          {sourceTab === "favorites" && (
            <>
              {favoriteBusinesses.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-14 h-14 mx-auto mb-3 flex items-center justify-center rounded-full bg-accent-100">
                    <i className="ri-heart-line text-accent-500 text-xl"></i>
                  </div>
                  <p className="text-sm text-foreground-600 font-medium mb-1">No favorites yet</p>
                  <p className="text-xs text-foreground-400">
                    Heart businesses from the <a href="/explore" className="text-primary-500 underline cursor-pointer">directory</a> to add them here
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {favoriteBusinesses.map((biz) => (
                    <button
                      key={biz.id}
                      onClick={() => handleAddBusiness(biz)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border border-background-200 hover:border-primary-300 hover:bg-primary-50/50 transition-colors text-left cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-background-100">
                        <img src={biz.image} alt={biz.name} className="w-full h-full object-cover object-top" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground-900 truncate">{biz.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-foreground-500">{biz.subcategory}</span>
                          <span className="flex items-center gap-0.5 text-xs text-yellow-500">
                            <i className="ri-star-fill text-[10px]"></i>
                            {biz.rating}
                          </span>
                        </div>
                      </div>
                      <i className="ri-add-circle-line text-foreground-300 text-lg shrink-0"></i>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Browse tab */}
          {sourceTab === "browse" && (
            <div className="space-y-2">
              {filteredBusinesses.map((biz) => (
                <button
                  key={biz.id}
                  onClick={() => handleAddBusiness(biz)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-background-200 hover:border-primary-300 hover:bg-primary-50/50 transition-colors text-left cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-background-100">
                    <img src={biz.image} alt={biz.name} className="w-full h-full object-cover object-top" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground-900 truncate">{biz.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-foreground-500">{biz.subcategory}</span>
                      <span className="flex items-center gap-0.5 text-xs text-yellow-500">
                        <i className="ri-star-fill text-[10px]"></i>
                        {biz.rating}
                      </span>
                    </div>
                  </div>
                  <i className="ri-add-circle-line text-foreground-300 text-lg shrink-0"></i>
                </button>
              ))}
              {filteredBusinesses.length === 0 && (
                <div className="text-center py-10">
                  <p className="text-sm text-foreground-500">No businesses found</p>
                </div>
              )}
            </div>
          )}

          {/* Events tab */}
          {sourceTab === "events" && (
            <div className="space-y-2">
              {filteredEvents.map((evt) => (
                <button
                  key={evt.id}
                  onClick={() => handleAddEvent(evt)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-background-200 hover:border-primary-300 hover:bg-primary-50/50 transition-colors text-left cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-background-100">
                    <img src={evt.image} alt={evt.title} className="w-full h-full object-cover object-top" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground-900 truncate">{evt.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-foreground-500">{evt.date}</span>
                      <span className="text-xs text-foreground-500">{evt.time}</span>
                    </div>
                  </div>
                  <i className="ri-add-circle-line text-foreground-300 text-lg shrink-0"></i>
                </button>
              ))}
              {filteredEvents.length === 0 && (
                <div className="text-center py-10">
                  <p className="text-sm text-foreground-500">No upcoming events found</p>
                </div>
              )}
            </div>
          )}

          {/* Custom tab */}
          {sourceTab === "custom" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground-500 uppercase tracking-wider mb-1.5">
                  Activity Name *
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g., Morning swim at the beach, Visit the bazaar..."
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-background-200 bg-white focus:outline-none focus:border-primary-300 text-foreground-700 placeholder:text-foreground-300"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground-500 uppercase tracking-wider mb-1.5">
                  Description (optional)
                </label>
                <textarea
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  placeholder="Add any details about this activity..."
                  rows={3}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-background-200 bg-white focus:outline-none focus:border-primary-300 text-foreground-700 placeholder:text-foreground-300 resize-y"
                ></textarea>
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground-500 uppercase tracking-wider mb-1.5">
                  Notes (optional)
                </label>
                <textarea
                  value={itemNotes}
                  onChange={(e) => setItemNotes(e.target.value)}
                  placeholder="Personal notes for this activity..."
                  rows={2}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-background-200 bg-white focus:outline-none focus:border-primary-300 text-foreground-700 placeholder:text-foreground-300 resize-y"
                ></textarea>
              </div>
              <button
                onClick={handleAddCustom}
                disabled={!customName.trim()}
                className="w-full py-2.5 rounded-full bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="ri-add-line mr-1.5"></i>
                Add Custom Activity
              </button>
            </div>
          )}

          {/* Notes field for non-custom tabs */}
          {sourceTab !== "custom" && sourceTab !== "ai" && (
            <div className="mt-4 pt-4 border-t border-background-200">
              <label className="block text-xs font-semibold text-foreground-500 uppercase tracking-wider mb-1.5">
                Personal Notes (optional)
              </label>
              <textarea
                value={itemNotes}
                onChange={(e) => setItemNotes(e.target.value)}
                placeholder="Why you want to go, who to bring, what to remember..."
                rows={2}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-background-200 bg-white focus:outline-none focus:border-primary-300 text-foreground-700 placeholder:text-foreground-300 resize-y"
              ></textarea>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}