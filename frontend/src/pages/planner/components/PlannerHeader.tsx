import React from "react";

interface PlannerHeaderProps {
  plansCount: number;
  isSyncing: boolean;
  onOpenCreateModal: () => void;
  onOpenAiModal: (tab: "generate" | "chat") => void;
}

export const PlannerHeader: React.FC<PlannerHeaderProps> = ({
  plansCount,
  isSyncing,
  onOpenCreateModal,
  onOpenAiModal,
}) => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-accent-900 text-white py-14 px-4 sm:px-6 lg:px-8 rounded-3xl mb-10 shadow-xl border border-white/10">
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold uppercase tracking-wider text-accent-200 mb-5">
          <i className="ri-compass-3-line text-sm"></i>
          <span>Personal Holiday Architect</span>
        </div>

        <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4 text-white">
          Plan Your Dream Alanya Holiday
        </h1>
        <p className="text-sm sm:text-base text-white/80 max-w-2xl mx-auto mb-8 font-normal leading-relaxed">
          Craft custom day-by-day itineraries, generate AI recommendations for castles, beaches, and mountain rivers, or copy hand-crafted templates from the community.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3.5">
          <button
            onClick={onOpenCreateModal}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-accent-500 hover:bg-accent-600 text-white font-medium text-sm transition-all shadow-md hover:shadow-lg cursor-pointer transform active:scale-95"
          >
            <i className="ri-add-line text-base"></i>
            <span>Create Custom Plan</span>
          </button>

          <button
            onClick={() => onOpenAiModal("generate")}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/15 hover:bg-white/25 text-white font-medium text-sm transition-all backdrop-blur-sm border border-white/30 cursor-pointer transform active:scale-95"
          >
            <i className="ri-sparkling-2-line text-accent-300 text-base"></i>
            <span>AI Trip Planner</span>
          </button>

          <button
            onClick={() => onOpenAiModal("chat")}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white/90 font-medium text-sm transition-all backdrop-blur-sm border border-white/20 cursor-pointer transform active:scale-95"
          >
            <i className="ri-chat-voice-line text-base"></i>
            <span>Ask Local Concierge</span>
          </button>
        </div>

        {/* Live sync & stats badge */}
        <div className="mt-8 flex items-center justify-center gap-6 text-xs text-white/70">
          <span className="flex items-center gap-1.5">
            <i className="ri-folder-shared-line text-accent-300"></i>
            {plansCount} {plansCount === 1 ? "Saved Itinerary" : "Saved Itineraries"}
          </span>
          <span className="flex items-center gap-1.5">
            <i className={`ri-cloud-line ${isSyncing ? "animate-pulse text-amber-300" : "text-emerald-300"}`}></i>
            {isSyncing ? "Syncing with cloud..." : "Cloud synced"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PlannerHeader;
