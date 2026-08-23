import { useState } from "react";
import {
  aiGuideService,
  type GenerateItineraryResult,
  type ChatMessageDto,
} from "@/api-services/ai-guide.service";
import { type Plan } from "@/hooks/usePlanner";
import { logger } from "@/lib/logger";

interface AiPlannerAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePlan?: Plan | null;
  dayLabels?: string[];
  currentDayLabel?: string;
  onCreatePlanWithItinerary: (result: GenerateItineraryResult) => void;
  onAddActivityToPlan?: (activity: {
    name: string;
    description: string;
    timeSlot: string;
    dayLabel: string;
    subcategory?: string;
    notes?: string;
  }) => void;
  initialTab?: "generate" | "chat";
}

const DISTRICT_OPTIONS = [
  "All Alanya",
  "Kleopatra & Damlataş",
  "Center & Castle",
  "Oba & Tosmur",
  "Mahmutlar & Kargıcak",
  "Dim River & Mountains",
  "Side & Manavgat",
  "Avsallar & Konaklı",
];

const INTEREST_OPTIONS = [
  { id: "beach", label: "🏖️ Beaches & Sun", query: "Beaches, crystal-clear sea, beach clubs" },
  { id: "history", label: "🏰 History & Culture", query: "Alanya Castle, Red Tower, ancient ruins, museums" },
  { id: "nature", label: "🌲 Canyons & Nature", query: "Sapadere Canyon, Dim River, Dim Cave, mountains" },
  { id: "food", label: "🍽️ Food & Dining", query: "Turkish breakfast, seafood, authentic kebabs, Turkish tea" },
  { id: "adventure", label: "⚡ Thrills & Adventure", query: "Paragliding, quad safari, scuba diving, boat tours" },
  { id: "wellness", label: "💆 Hammam & Spa", query: "Turkish bath, massage, wellness relaxation" },
  { id: "family", label: "👨‍👩‍👧 Family Friendly", query: "Kid-friendly beaches, parks, pirate boats, easy walks" },
  { id: "nightlife", label: "🍸 Sunset & Lounge", query: "Rooftop cocktail lounges, harbor dining, sunset viewpoints" },
];

const STARTER_QUESTIONS = [
  "What is the best 1-day itinerary for first-timers?",
  "How can I spend a relaxing afternoon at Dim River?",
  "Where are the most romantic sunset spots around Alanya Castle?",
  "What are the best outdoor activities for families with kids?",
];

export default function AiPlannerAssistantModal({
  isOpen,
  onClose,
  activePlan,
  dayLabels = ["Day 1"],
  currentDayLabel = "Day 1",
  onCreatePlanWithItinerary,
  onAddActivityToPlan,
  initialTab = "generate",
}: AiPlannerAssistantModalProps) {
  const [activeTab, setActiveTab] = useState<"generate" | "chat">(initialTab);

  // Generator form state
  const [days, setDays] = useState<number>(3);
  const [selectedDistrict, setSelectedDistrict] = useState<string>("All Alanya");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    "beach",
    "history",
    "food",
  ]);
  const [pace, setPace] = useState<"relaxed" | "moderate" | "packed">("moderate");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<GenerateItineraryResult | null>(null);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessageDto[]>([
    {
      role: "model",
      content:
        "Merhaba! I am your AI Holiday Concierge for Alanya Holidays. Ask me anything about beaches, castle explorations, boat trips, local restaurants, or transit tips across Alanya and the Turkish Riviera.",
    },
  ]);
  const [inputQuestion, setInputQuestion] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [selectedChatDay, setSelectedChatDay] = useState<string>(currentDayLabel);

  if (!isOpen) return null;

  function toggleInterest(id: string) {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  }

  async function handleGenerateItinerary() {
    setIsGenerating(true);
    setGeneratedResult(null);

    const interestQueries = selectedInterests.map(
      (id) => INTEREST_OPTIONS.find((opt) => opt.id === id)?.query || id,
    );

    try {
      const result = await aiGuideService.generateItinerary({
        days,
        district: selectedDistrict === "All Alanya" ? "Alanya" : selectedDistrict,
        interests: interestQueries,
        pace,
      });
      setGeneratedResult(result);
    } catch (err) {
      logger.error("Itinerary generation error:", err);
      // aiGuideService handles fallbacks internally
      const fallback = aiGuideService.getCuratedItineraryFallback({
        days,
        district: selectedDistrict,
      });
      setGeneratedResult(fallback);
    } finally {
      setIsGenerating(false);
    }
  }

  function handleApplyFullPlan() {
    if (!generatedResult) return;
    onCreatePlanWithItinerary(generatedResult);
    onClose();
  }

  function handleAppendToActivePlan() {
    if (!generatedResult || !onAddActivityToPlan || !activePlan) return;
    generatedResult.days.forEach((day) => {
      day.items.forEach((item) => {
        onAddActivityToPlan({
          name: item.name,
          description: item.description,
          timeSlot: item.timeSlot,
          dayLabel: day.dayLabel,
          subcategory: item.subcategory || day.theme || "AI Recommendation",
          notes: item.notes || "",
        });
      });
    });
    onClose();
  }

  async function handleSendChatMessage(textToSend?: string) {
    const question = (textToSend || inputQuestion).trim();
    if (!question || isAsking) return;

    const newHistory: ChatMessageDto[] = [
      ...chatMessages,
      { role: "user", content: question },
    ];
    setChatMessages(newHistory);
    setInputQuestion("");
    setIsAsking(true);

    try {
      const response = await aiGuideService.askGuide({
        userQuestion: question,
        location: selectedDistrict !== "All Alanya" ? selectedDistrict : "Alanya",
        history: newHistory.filter((m, idx) => idx > 0), // exclude greeting from API history
      });

      setChatMessages((prev) => [
        ...prev,
        { role: "model", content: response.answer },
      ]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "model",
          content: aiGuideService.getCuratedFallback({ userQuestion: question }),
        },
      ]);
    } finally {
      setIsAsking(false);
    }
  }

  function handleAddChatMessageAsActivity(content: string) {
    if (!onAddActivityToPlan) return;
    // Extract first line as title or summarize
    const lines = content.split("\n").map((l) => l.trim()).filter(Boolean);
    const firstLine = lines[0]?.replace(/^[#*•\s\d.-]+/, "").slice(0, 50) || "AI Concierge Tip";
    const restText = lines.slice(1).join(" ").slice(0, 180);

    onAddActivityToPlan({
      name: firstLine,
      description: restText || firstLine,
      timeSlot: "Flexible",
      dayLabel: selectedChatDay,
      subcategory: "AI Recommendation",
      notes: "Saved from AI Concierge",
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center pt-8 pb-8 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-3xl w-full mx-4 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-background-200 bg-gradient-to-r from-primary-50 via-white to-secondary-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-md shadow-primary-500/20 text-white">
              <i className="ri-sparkling-fill text-lg"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading text-base font-bold text-foreground-900">
                  Gemini AI Holiday Guide
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 text-[10px] font-semibold tracking-wide uppercase">
                  AI Concierge
                </span>
              </div>
              <p className="text-xs text-foreground-500">
                Instant smart itinerary planning & local Alanya knowledge
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center border border-foreground-200 text-foreground-400 hover:text-foreground-700 hover:bg-background-100 transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-lg"></i>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-4 pb-2 border-b border-background-200 shrink-0">
          <div className="flex gap-2 bg-background-100 rounded-2xl p-1">
            <button
              onClick={() => setActiveTab("generate")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "generate"
                  ? "bg-white text-foreground-900 shadow-xs"
                  : "text-foreground-500 hover:text-foreground-700"
              }`}
            >
              <i className="ri-magic-line text-sm text-primary-500"></i>
              Generate AI Itinerary
            </button>
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "chat"
                  ? "bg-white text-foreground-900 shadow-xs"
                  : "text-foreground-500 hover:text-foreground-700"
              }`}
            >
              <i className="ri-chat-smile-2-line text-sm text-accent-500"></i>
              Ask AI Concierge
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: GENERATE ITINERARY */}
          {activeTab === "generate" && (
            <div className="space-y-6">
              {/* If no result generated yet, show form */}
              {!generatedResult && !isGenerating && (
                <>
                  {/* Duration */}
                  <div>
                    <label className="block text-xs font-semibold text-foreground-700 uppercase tracking-wider mb-2">
                      Trip Duration
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[1, 2, 3, 4, 5, 7].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setDays(num)}
                          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            days === num
                              ? "bg-primary-500 text-white shadow-sm shadow-primary-500/30"
                              : "bg-background-100 text-foreground-600 hover:bg-background-200"
                          }`}
                        >
                          {num} {num === 1 ? "Day" : "Days"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* District / Region */}
                  <div>
                    <label className="block text-xs font-semibold text-foreground-700 uppercase tracking-wider mb-2">
                      Target District / Area
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {DISTRICT_OPTIONS.map((dist) => (
                        <button
                          key={dist}
                          type="button"
                          onClick={() => setSelectedDistrict(dist)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                            selectedDistrict === dist
                              ? "bg-foreground-900 text-white"
                              : "bg-background-50 border border-background-200 text-foreground-600 hover:border-foreground-400"
                          }`}
                        >
                          {dist}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Interests */}
                  <div>
                    <label className="block text-xs font-semibold text-foreground-700 uppercase tracking-wider mb-2">
                      What are you interested in?
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {INTEREST_OPTIONS.map((item) => {
                        const isSelected = selectedInterests.includes(item.id);
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => toggleInterest(item.id)}
                            className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all cursor-pointer flex items-center justify-between ${
                              isSelected
                                ? "border-primary-500 bg-primary-50/50 text-primary-900"
                                : "border-background-200 bg-white text-foreground-600 hover:border-background-300"
                            }`}
                          >
                            <span>{item.label}</span>
                            {isSelected && (
                              <i className="ri-check-line text-primary-600 text-sm"></i>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Pace */}
                  <div>
                    <label className="block text-xs font-semibold text-foreground-700 uppercase tracking-wider mb-2">
                      Travel Pace
                    </label>
                    <div className="flex gap-2">
                      {(["relaxed", "moderate", "packed"] as const).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPace(p)}
                          className={`flex-1 py-2 px-3 rounded-xl border text-xs font-medium capitalize transition-all cursor-pointer ${
                            pace === p
                              ? "border-accent-500 bg-accent-50 text-accent-800 font-semibold"
                              : "border-background-200 text-foreground-600 hover:bg-background-50"
                          }`}
                        >
                          {p === "relaxed" && "🌴 Relaxed (1-2 stops/day)"}
                          {p === "moderate" && "⚖️ Balanced (2-3 stops/day)"}
                          {p === "packed" && "🚀 Action-packed (4+ stops/day)"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Generate Trigger */}
                  <div className="pt-4">
                    <button
                      onClick={handleGenerateItinerary}
                      className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-primary-500 via-primary-600 to-accent-500 text-white font-semibold text-sm shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/35 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <i className="ri-sparkling-fill text-base"></i>
                      Generate {days}-Day Itinerary with Gemini AI
                    </button>
                  </div>
                </>
              )}

              {/* Generating Loading State */}
              {isGenerating && (
                <div className="py-16 text-center space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-primary-400 to-accent-400 flex items-center justify-center text-white shadow-xl animate-pulse">
                    <i className="ri-sparkling-fill text-3xl animate-spin"></i>
                  </div>
                  <div>
                    <h4 className="font-heading text-lg font-bold text-foreground-900">
                      Crafting your {days}-day Alanya journey...
                    </h4>
                    <p className="text-xs text-foreground-500 max-w-sm mx-auto mt-1">
                      Gemini AI is analyzing local spots, travel distances, and highlights for{" "}
                      {selectedDistrict}.
                    </p>
                  </div>
                </div>
              )}

              {/* Generated Result Preview */}
              {generatedResult && !isGenerating && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-primary-50 to-secondary-50 border border-primary-100">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="text-[11px] font-bold text-primary-600 uppercase tracking-wider">
                          ✨ AI Suggested Plan
                        </span>
                        <h4 className="font-heading text-lg font-bold text-foreground-900 mt-0.5">
                          {generatedResult.title}
                        </h4>
                        <p className="text-xs text-foreground-600 mt-1 leading-relaxed">
                          {generatedResult.description}
                        </p>
                      </div>
                      <button
                        onClick={() => setGeneratedResult(null)}
                        className="text-xs text-foreground-500 hover:text-foreground-800 underline whitespace-nowrap cursor-pointer"
                      >
                        Adjust Options
                      </button>
                    </div>
                  </div>

                  {/* Day breakdown */}
                  <div className="space-y-4">
                    {generatedResult.days.map((day) => (
                      <div
                        key={day.dayLabel}
                        className="rounded-2xl border border-background-200 overflow-hidden bg-white shadow-xs"
                      >
                        <div className="px-4 py-3 bg-background-50 border-b border-background-200 flex items-center justify-between">
                          <span className="font-heading text-sm font-bold text-foreground-900">
                            {day.dayLabel}
                          </span>
                          {day.theme && (
                            <span className="text-xs text-primary-600 font-medium">
                              {day.theme}
                            </span>
                          )}
                        </div>
                        <div className="p-4 space-y-3">
                          {day.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex items-start gap-3 pb-3 last:pb-0 border-b last:border-0 border-background-100"
                            >
                              <div className="w-2 h-2 rounded-full bg-primary-500 mt-1.5 shrink-0"></div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h5 className="text-xs font-semibold text-foreground-900">
                                    {item.name}
                                  </h5>
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary-100 text-secondary-700 font-medium">
                                    {item.timeSlot}
                                  </span>
                                  {item.subcategory && (
                                    <span className="text-[10px] text-foreground-400">
                                      · {item.subcategory}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-foreground-500 mt-0.5 leading-relaxed">
                                  {item.description}
                                </p>
                                {item.notes && (
                                  <p className="text-[11px] text-accent-700 mt-1 italic flex items-center gap-1">
                                    <i className="ri-lightbulb-line"></i>
                                    {item.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      onClick={handleApplyFullPlan}
                      className="flex-1 py-3 px-5 rounded-2xl bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 shadow-md shadow-primary-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <i className="ri-folder-add-line"></i>
                      Save as New Plan ({generatedResult.days.length} Days)
                    </button>

                    {activePlan && onAddActivityToPlan && (
                      <button
                        onClick={handleAppendToActivePlan}
                        className="py-3 px-5 rounded-2xl border border-accent-300 bg-accent-50 text-accent-700 text-sm font-semibold hover:bg-accent-100 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <i className="ri-add-circle-line"></i>
                        Add into "{activePlan.name}"
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ASK AI CONCIERGE (CHAT) */}
          {activeTab === "chat" && (
            <div className="flex flex-col h-[500px]">
              {/* Day selector target if plan active */}
              {onAddActivityToPlan && dayLabels.length > 0 && (
                <div className="mb-3 px-3 py-2 bg-background-50 rounded-xl flex items-center justify-between text-xs text-foreground-600 shrink-0">
                  <span className="font-medium">Target day when adding activities:</span>
                  <select
                    value={selectedChatDay}
                    onChange={(e) => setSelectedChatDay(e.target.value)}
                    className="px-2 py-1 rounded-lg border border-background-200 bg-white text-foreground-800 text-xs font-semibold focus:outline-none focus:border-primary-300"
                  >
                    {dayLabels.map((lbl) => (
                      <option key={lbl} value={lbl}>
                        {lbl}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Chat message stream */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {chatMessages.map((msg, index) => {
                  const isModel = msg.role === "model";
                  return (
                    <div
                      key={index}
                      className={`flex gap-3 ${isModel ? "items-start" : "items-start flex-row-reverse"}`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs ${
                          isModel
                            ? "bg-gradient-to-br from-primary-500 to-accent-500 text-white"
                            : "bg-foreground-800 text-white"
                        }`}
                      >
                        <i className={isModel ? "ri-sparkling-fill" : "ri-user-line"}></i>
                      </div>
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                          isModel
                            ? "bg-background-50 border border-background-200 text-foreground-800"
                            : "bg-primary-500 text-white font-normal"
                        }`}
                      >
                        <div className="whitespace-pre-wrap">{msg.content}</div>

                        {/* If model and not initial welcome, give option to add as plan activity */}
                        {isModel && index > 0 && onAddActivityToPlan && (
                          <div className="mt-3 pt-2 border-t border-background-200/80 flex items-center justify-between">
                            <span className="text-[10px] text-foreground-400">
                              Like this recommendation?
                            </span>
                            <button
                              onClick={() => handleAddChatMessageAsActivity(msg.content)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-primary-200 text-primary-600 hover:bg-primary-50 text-[11px] font-semibold transition-colors cursor-pointer"
                            >
                              <i className="ri-add-line"></i>
                              Add to {selectedChatDay}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {isAsking && (
                  <div className="flex gap-3 items-center text-xs text-foreground-500 italic py-2">
                    <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center shrink-0 animate-pulse">
                      <i className="ri-sparkling-fill"></i>
                    </div>
                    <span>Gemini AI Concierge is thinking...</span>
                  </div>
                )}
              </div>

              {/* Starter chips */}
              {chatMessages.length <= 2 && (
                <div className="py-2 overflow-x-auto shrink-0 flex gap-2">
                  {STARTER_QUESTIONS.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendChatMessage(q)}
                      className="px-3 py-1.5 rounded-full border border-primary-200 bg-primary-50/50 text-primary-700 text-[11px] font-medium hover:bg-primary-100 transition-colors whitespace-nowrap cursor-pointer"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {/* Input row */}
              <div className="pt-3 border-t border-background-200 shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendChatMessage();
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={inputQuestion}
                    onChange={(e) => setInputQuestion(e.target.value)}
                    placeholder="Ask about spots, beaches, food, transit..."
                    className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-background-200 bg-background-50 focus:outline-none focus:border-primary-300 text-foreground-800 placeholder:text-foreground-400"
                    disabled={isAsking}
                  />
                  <button
                    type="submit"
                    disabled={!inputQuestion.trim() || isAsking}
                    className="px-5 py-2.5 rounded-xl bg-primary-500 text-white text-xs font-semibold hover:bg-primary-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <i className="ri-send-plane-fill"></i>
                    <span>Send</span>
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
