import { useState, useMemo, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "@/pages/home/components/Navbar";
import Footer from "@/pages/home/components/Footer";
import { usePlanner, type Plan, type PlanItem } from "@/hooks/usePlanner";
import { useSharedPlans, type SharedPlan } from "@/hooks/useSharedPlans";
import { itineraryTemplates as suggestedPlans } from "@/domain/itinerary-templates";
import { directoryService, type Business } from "@/api-services/directory.service";
import { eventsService, type ForumEvent } from "@/api-services/events.service";
import AddItemModal from "./components/AddItemModal";
import AiPlannerAssistantModal from "./components/AiPlannerAssistantModal";
import { PlannerHeader } from "./components/PlannerHeader";
import { SuggestedTemplatesSection } from "./components/SuggestedTemplatesSection";
import { CommunityTemplatesSection } from "./components/CommunityTemplatesSection";
import { PlanTimelineView } from "./components/PlanTimelineView";
import {
  CreatePlanModal,
  EditPlanModal,
  SharePlanModal,
  DeleteConfirmModal,
  PrintPlanModal,
} from "./components/PlanModals";
import { type GenerateItineraryResult } from "@/api-services/ai-guide.service";
import { useTranslation } from "react-i18next";
import "@/i18n";

type ViewMode = "list" | "detail";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getBusinessUrl(id: string): string {
  return `/business/${id}`;
}

function getEventUrl(_id: string): string {
  return `/events`;
}

export default function PlannerPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const planIdFromUrl = searchParams.get("plan") || "";
  const quickstartId = searchParams.get("quickstart") || "";

  const quickstartApplied = useRef(false);

  const {
    plans,
    isSyncing,
    createPlan,
    updatePlan,
    deletePlan,
    duplicatePlan,
    addItem,
    updateItem,
    removeItem,
    reorderItems,
    getPlan,
    getDayLabels,
  } = usePlanner();

  const {
    sharedPlans,
    sharePlan,
    unsharePlan,
    incrementCopyCount,
    isPlanShared,
  } = useSharedPlans();

  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiModalTab, setAiModalTab] = useState<"generate" | "chat">("generate");
  const [activeDay, setActiveDay] = useState("Day 1");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [businessesList, setBusinessesList] = useState<Business[]>([]);
  const [eventsList, setEventsList] = useState<ForumEvent[]>([]);

  useEffect(() => {
    let isMounted = true;
    directoryService.getListings({ limit: 100 }).then((res) => {
      if (isMounted && res.data) setBusinessesList(res.data);
    }).catch(() => {});
    eventsService.getEvents().then((evts) => {
      if (isMounted && evts) setEventsList(evts);
    }).catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  function getBusinessName(id: string): string {
    return businessesList.find((b) => b.id === id)?.name || "Alanya Venue";
  }

  function getEventName(id: string): string {
    return eventsList.find((e) => e.id === id)?.title || "Community Event";
  }

  // Suggested plans category filter
  const [activeCategory, setActiveCategory] = useState<string>("All");

  // Community templates sort
  const [communitySort, setCommunitySort] = useState<"recent" | "popular">("recent");

  // Create plan form state
  const [newPlanName, setNewPlanName] = useState("");
  const [newPlanDescription, setNewPlanDescription] = useState("");

  // Edit plan form state
  const [editPlanName, setEditPlanName] = useState("");
  const [editPlanDescription, setEditPlanDescription] = useState("");

  // Share author name
  const [shareAuthorName, setShareAuthorName] = useState<string>(() => {
    try {
      return localStorage.getItem("alanya-share-author") || "Alanya Traveler";
    } catch {
      return "Alanya Traveler";
    }
  });

  // Auto-copy suggested plan when coming from Quick Start button
  useEffect(() => {
    if (!quickstartId || quickstartApplied.current) return;
    const suggested = suggestedPlans.find((sp) => sp.id === quickstartId);
    if (!suggested) return;
    quickstartApplied.current = true;
    const plan = createPlan(suggested.name, suggested.description);
    suggested.items.forEach((item) => {
      addItem(plan.id, item);
    });
    setSelectedPlanId(plan.id);
    setViewMode("detail");
    const labels = getDayLabels(plan.id);
    if (labels.length > 0) setActiveDay(labels[0]);

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("quickstart");
    setSearchParams(nextParams, { replace: true });
  }, [quickstartId, searchParams, setSearchParams, createPlan, addItem, getDayLabels]);

  // Navigate to plan from URL param
  useEffect(() => {
    if (planIdFromUrl) {
      const plan = getPlan(planIdFromUrl);
      if (plan) {
        setSelectedPlanId(planIdFromUrl);
        setViewMode("detail");
        const labels = getDayLabels(planIdFromUrl);
        if (labels.length > 0) setActiveDay(labels[0]);
      }
    }
  }, [planIdFromUrl, getPlan, getDayLabels]);

  const selectedPlan = useMemo(
    () => (selectedPlanId ? getPlan(selectedPlanId) : null),
    [selectedPlanId, getPlan],
  );

  const dayLabels = useMemo(
    () => (selectedPlanId ? getDayLabels(selectedPlanId) : ["Day 1"]),
    [selectedPlanId, getDayLabels],
  );

  // Reset active day when switching plans
  useEffect(() => {
    if (selectedPlanId && dayLabels.length > 0 && !dayLabels.includes(activeDay)) {
      setActiveDay(dayLabels[0]);
    }
  }, [selectedPlanId, dayLabels, activeDay]);

  function showToast(message: string) {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  }

  function handleCreatePlan() {
    if (!newPlanName.trim()) return;
    const plan = createPlan(newPlanName.trim(), newPlanDescription.trim());
    setNewPlanName("");
    setNewPlanDescription("");
    setShowCreateModal(false);
    setSelectedPlanId(plan.id);
    setViewMode("detail");
    setActiveDay("Day 1");
  }

  function handleEditPlan() {
    if (!editPlanName.trim() || !selectedPlan) return;
    updatePlan(selectedPlan.id, { name: editPlanName.trim(), description: editPlanDescription.trim() });
    setShowEditModal(false);
  }

  function openEditModal() {
    if (!selectedPlan) return;
    setEditPlanName(selectedPlan.name);
    setEditPlanDescription(selectedPlan.description);
    setShowEditModal(true);
  }

  function handleDeletePlan() {
    if (!selectedPlan) return;
    deletePlan(selectedPlan.id);
    setShowDeleteConfirm(false);
    setSelectedPlanId("");
    setViewMode("list");
  }

  function handleDuplicatePlan() {
    if (!selectedPlan) return;
    const dup = duplicatePlan(selectedPlan.id);
    if (dup) {
      setSelectedPlanId(dup.id);
      const labels = getDayLabels(dup.id);
      if (labels.length > 0) setActiveDay(labels[0]);
    }
  }

  function handleCopySuggestedPlan(suggestedPlanId: string) {
    const suggested = suggestedPlans.find((sp) => sp.id === suggestedPlanId);
    if (!suggested) return;
    const plan = createPlan(suggested.name, suggested.description);
    suggested.items.forEach((item) => {
      addItem(plan.id, item);
    });
    setSelectedPlanId(plan.id);
    setViewMode("detail");
    const labels = getDayLabels(plan.id);
    if (labels.length > 0) setActiveDay(labels[0]);
  }

  function handleCreatePlanFromAi(result: GenerateItineraryResult) {
    const plan = createPlan(result.title, result.description);
    let orderCounter = 1;
    result.days.forEach((day) => {
      day.items.forEach((item) => {
        addItem(plan.id, {
          type: "custom",
          customName: item.name,
          customDescription: item.description,
          dayLabel: day.dayLabel,
          timeSlot: item.timeSlot,
          subcategory: item.subcategory || day.theme || "AI Recommendation",
          notes: item.notes || "",
          completed: false,
          order: orderCounter++,
        });
      });
    });
    setSelectedPlanId(plan.id);
    setViewMode("detail");
    const labels = getDayLabels(plan.id);
    if (labels.length > 0) setActiveDay(labels[0]);
    showToast(`✨ Generated ${result.days.length}-day AI itinerary!`);
  }

  function handleAddAiActivity(activity: {
    name: string;
    description: string;
    timeSlot: string;
    dayLabel: string;
    subcategory?: string;
    notes?: string;
  }) {
    if (!selectedPlan) return;
    const currentDayItems = selectedPlan.items.filter((i) => i.dayLabel === activity.dayLabel);
    addItem(selectedPlan.id, {
      type: "custom",
      customName: activity.name,
      customDescription: activity.description,
      dayLabel: activity.dayLabel,
      timeSlot: activity.timeSlot,
      subcategory: activity.subcategory || "AI Suggestion",
      notes: activity.notes || "",
      completed: false,
      order: currentDayItems.length + 1,
    });
    showToast(`Added "${activity.name}" to ${activity.dayLabel}`);
  }

  function handleAddItem(item: Omit<PlanItem, "id">) {
    if (!selectedPlan) return;
    addItem(selectedPlan.id, item);
    const labels = getDayLabels(selectedPlan.id);
    if (labels.length > 0 && !labels.includes(activeDay)) {
      setActiveDay(labels[labels.length - 1]);
    }
  }

  function handleDayLabelChange(newLabel: string) {
    if (!dayLabels.includes(newLabel)) {
      setActiveDay(newLabel);
    }
  }

  function handleToggleComplete(itemId: string) {
    if (!selectedPlan) return;
    const item = selectedPlan.items.find((i) => i.id === itemId);
    if (item) {
      updateItem(selectedPlan.id, itemId, { completed: !item.completed });
    }
  }

  function handleUpdateItemNotes(itemId: string, notes: string) {
    if (!selectedPlan) return;
    updateItem(selectedPlan.id, itemId, { notes });
  }

  function handleReorder(reorderedItems: PlanItem[]) {
    if (!selectedPlan) return;
    reorderItems(selectedPlan.id, reorderedItems);
  }

  function handlePrint() {
    window.print();
  }

  function handleSharePlan() {
    if (!selectedPlan || selectedPlan.items.length === 0) return;
    setShowShareModal(true);
  }

  function handleConfirmShare() {
    if (!selectedPlan || selectedPlan.items.length === 0) return;
    if (isPlanShared(selectedPlan.id)) return;
    const name = shareAuthorName.trim() || "Alanya Traveler";
    sharePlan(selectedPlan, name);
    try {
      localStorage.setItem("alanya-share-author", name);
    } catch {
      // ignore
    }
    setShowShareModal(false);
    showToast("Plan shared to the community! Others can now copy it as a template.");
  }

  function handleUnsharePlan() {
    if (!selectedPlan) return;
    const shareId = isPlanShared(selectedPlan.id);
    if (shareId) {
      unsharePlan(shareId);
      showToast("Plan removed from community templates.");
    }
  }

  function handleCopySharedPlan(shared: SharedPlan) {
    const plan = createPlan(shared.name, shared.description);
    shared.items.forEach((item) => {
      addItem(plan.id, item);
    });
    incrementCopyCount(shared.shareId);
    setSelectedPlanId(plan.id);
    setViewMode("detail");
    const labels = getDayLabels(plan.id);
    if (labels.length > 0) setActiveDay(labels[0]);
  }

  function getCompletionStats(plan: Plan) {
    const total = plan.items.length;
    const completed = plan.items.filter((i) => i.completed).length;
    return { total, completed };
  }

  function getItemDisplayInfo(item: PlanItem) {
    if (item.type === "business") {
      return {
        name: getBusinessName(item.referenceId || ""),
        url: getBusinessUrl(item.referenceId || ""),
        subcategory: item.subcategory || "Business",
      };
    }
    if (item.type === "event") {
      return {
        name: getEventName(item.referenceId || ""),
        url: getEventUrl(item.referenceId || ""),
        subcategory: item.subcategory || "Event",
      };
    }
    return {
      name: item.customName || "Custom Activity",
      url: null,
      subcategory: item.customDescription || "Custom",
    };
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background-50">
        {/* Navigation Breadcrumb Bar */}
        <section className="w-full px-4 md:px-8 lg:px-12 pt-28 md:pt-32 pb-4 bg-background-50">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <Link
                to="/"
                className="text-foreground-400 hover:text-foreground-600 text-xs transition-colors underline underline-offset-2"
              >
                {t("nav.home", "Home")}
              </Link>
              <i className="ri-arrow-right-s-line text-foreground-300 text-xs"></i>
              <span className="text-foreground-600 text-xs">{t("public.myPlanner", "My Planner")}</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1 className="font-heading text-2xl md:text-3xl text-foreground-900 mb-1">
                  {viewMode === "detail" && selectedPlan ? selectedPlan.name : t("public.myPlanner", "My Planner")}
                </h1>
                <p className="text-sm text-foreground-500">
                  {viewMode === "detail" && selectedPlan
                    ? `${selectedPlan.items.length} items · ${dayLabels.length} ${dayLabels.length === 1 ? "day" : "days"}`
                    : `${plans.length} ${plans.length === 1 ? "plan" : "plans"} · Organize your Alanya adventures`}
                </p>
              </div>

              {/* Action Buttons Top Bar */}
              <div className="flex items-center gap-2.5 flex-wrap">
                {viewMode === "detail" && selectedPlan ? (
                  <>
                    <button
                      onClick={() => {
                        setAiModalTab("chat");
                        setShowAiModal(true);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 text-white text-sm font-medium hover:opacity-95 shadow-xs transition-all whitespace-nowrap cursor-pointer"
                    >
                      <i className="ri-sparkling-fill text-sm"></i>
                      {t("public.askAi", "Ask AI Concierge")}
                    </button>
                    <button
                      onClick={() => setShowAddItemModal(true)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors whitespace-nowrap cursor-pointer shadow-xs"
                    >
                      <i className="ri-add-line text-sm"></i>
                      {t("public.addItem", "Add Item")}
                    </button>
                    <button
                      onClick={() => setShowPrintModal(true)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-foreground-200 text-sm text-foreground-700 font-medium hover:bg-background-100 transition-colors whitespace-nowrap cursor-pointer bg-white"
                    >
                      <i className="ri-printer-line text-sm"></i>
                      {t("common.print", "Print")}
                    </button>
                    <button
                      onClick={openEditModal}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-foreground-200 text-sm text-foreground-700 font-medium hover:bg-background-100 transition-colors whitespace-nowrap cursor-pointer bg-white"
                    >
                      <i className="ri-edit-line text-sm"></i>
                      {t("public.edit", "Edit")}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedPlanId("");
                        setViewMode("list");
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-foreground-200 text-sm text-foreground-700 font-medium hover:bg-background-100 transition-colors whitespace-nowrap cursor-pointer bg-white"
                    >
                      <i className="ri-arrow-left-line text-sm"></i>
                      {t("public.allPlans", "All Plans")}
                    </button>
                    {selectedPlan.items.length > 0 && !isPlanShared(selectedPlan.id) && (
                      <button
                        onClick={handleSharePlan}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-accent-500 text-white text-sm font-medium hover:bg-accent-600 transition-colors whitespace-nowrap cursor-pointer shadow-xs"
                      >
                        <i className="ri-share-forward-line text-sm"></i>
                        {t("public.shareTemplate", "Share as Template")}
                      </button>
                    )}
                    {isPlanShared(selectedPlan.id) && (
                      <button
                        onClick={handleUnsharePlan}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-accent-300 bg-accent-50 text-sm text-accent-700 font-medium hover:bg-accent-100 transition-colors whitespace-nowrap cursor-pointer"
                      >
                        <i className="ri-share-forward-line text-sm"></i>
                        {t("public.shared", "Shared")}
                        <span className="text-accent-500 ml-1 text-xs">({t("public.clickUnshare", "click to unshare")})</span>
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setAiModalTab("generate");
                        setShowAiModal(true);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-primary-500 via-primary-600 to-accent-500 text-white text-sm font-medium hover:opacity-95 shadow-sm shadow-primary-500/20 transition-all whitespace-nowrap cursor-pointer"
                    >
                      <i className="ri-sparkling-fill text-sm"></i>
                      {t("public.generateItinerary", "Generate AI Itinerary")}
                    </button>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-foreground-200 bg-white text-foreground-800 text-sm font-medium hover:bg-background-100 transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <i className="ri-add-line text-sm"></i>
                      {t("public.newPlan", "New Plan")}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Main Content Area */}
        <section className="w-full px-4 md:px-8 lg:px-12 pb-20 bg-background-50">
          <div className="max-w-7xl mx-auto">
            {viewMode === "list" ? (
              <>
                <PlannerHeader
                  plansCount={plans.length}
                  isSyncing={isSyncing}
                  onOpenCreateModal={() => setShowCreateModal(true)}
                  onOpenAiModal={(tab) => {
                    setAiModalTab(tab);
                    setShowAiModal(true);
                  }}
                />

                <SuggestedTemplatesSection
                  suggestedPlans={suggestedPlans}
                  activeCategory={activeCategory}
                  onSelectCategory={setActiveCategory}
                  onCopyPlan={handleCopySuggestedPlan}
                />

                <CommunityTemplatesSection
                  sharedPlans={sharedPlans}
                  communitySort={communitySort}
                  onSortChange={setCommunitySort}
                  onCopyPlan={handleCopySharedPlan}
                />

                {/* My Saved Plans Grid */}
                {plans.length === 0 ? (
                  <div className="max-w-lg mx-auto text-center py-16 bg-white rounded-3xl border border-background-200 p-8 shadow-xs">
                    <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center rounded-full bg-accent-100">
                      <i className="ri-calendar-todo-line text-accent-500 text-2xl"></i>
                    </div>
                    <h2 className="font-heading text-xl text-foreground-900 mb-2">{t("public.noPlans", "No plans yet")}</h2>
                    <p className="text-sm text-foreground-500 max-w-sm mx-auto mb-6">
                      {t("public.createPlanDescription", "Create your first plan to organize the businesses, events, and activities you are interested in.")}
                    </p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors whitespace-nowrap cursor-pointer shadow-xs"
                    >
                      <i className="ri-add-line"></i>
                      {t("public.createFirstPlan", "Create Your First Plan")}
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-heading text-lg font-semibold text-foreground-900">{t("public.myItineraries", "My Itineraries")}</h2>
                      <span className="text-xs text-foreground-500">
                        {plans.length} {plans.length === 1 ? "saved plan" : "saved plans"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {plans.map((plan) => {
                        const stats = getCompletionStats(plan);
                        return (
                          <div
                            key={plan.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => {
                              setSelectedPlanId(plan.id);
                              setViewMode("detail");
                              const labels = getDayLabels(plan.id);
                              if (labels.length > 0) setActiveDay(labels[0]);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                setSelectedPlanId(plan.id);
                                setViewMode("detail");
                                const labels = getDayLabels(plan.id);
                                if (labels.length > 0) setActiveDay(labels[0]);
                              }
                            }}
                            className="bg-white rounded-2xl border border-background-200/70 p-5 text-left hover:border-primary-300 hover:shadow-md transition-all cursor-pointer group flex flex-col"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="w-10 h-10 rounded-xl bg-accent-100 flex items-center justify-center shrink-0 group-hover:bg-accent-200 transition-colors">
                                <i className="ri-calendar-todo-line text-accent-500 text-lg"></i>
                              </div>
                              {plan.items.length > 0 && (
                                <span className="text-xs text-foreground-400 whitespace-nowrap">
                                  Updated {formatDate(plan.updatedAt)}
                                </span>
                              )}
                            </div>
                            <h3 className="font-heading text-base font-semibold text-foreground-900 mb-1 group-hover:text-primary-500 transition-colors">
                              {plan.name}
                            </h3>
                            {plan.description && (
                              <p className="text-xs text-foreground-500 line-clamp-2 mb-3">{plan.description}</p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-foreground-500 mt-auto pt-3">
                              <span className="flex items-center gap-1">
                                <i className="ri-list-check text-foreground-400"></i>
                                {plan.items.length} {plan.items.length === 1 ? "item" : "items"}
                              </span>
                              <span className="flex items-center gap-1">
                                <i className="ri-calendar-line text-foreground-400"></i>
                                {getDayLabels(plan.id).length} {getDayLabels(plan.id).length === 1 ? "day" : "days"}
                              </span>
                              {stats.total > 0 && stats.completed > 0 && (
                                <span className="flex items-center gap-1 ml-auto text-accent-600 font-medium">
                                  <i className="ri-check-double-line"></i>
                                  {stats.completed}/{stats.total} done
                                </span>
                              )}
                            </div>
                            {stats.total > 0 && (
                              <div className="mt-3 w-full h-1 rounded-full bg-background-100 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-accent-500 transition-all duration-500"
                                  style={{ width: `${(stats.completed / stats.total) * 100}%` }}
                                ></div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            ) : (
              selectedPlan && (
                <PlanTimelineView
                  plan={selectedPlan}
                  dayLabels={dayLabels}
                  activeDay={activeDay}
                  onSelectDay={setActiveDay}
                  editingItemId={editingItemId}
                  onSetEditingItemId={setEditingItemId}
                  getItemDisplayInfo={getItemDisplayInfo}
                  onToggleComplete={handleToggleComplete}
                  onUpdateNotes={handleUpdateItemNotes}
                  onRemoveItem={(itemId) => removeItem(selectedPlan.id, itemId)}
                  onReorderItems={handleReorder}
                  onOpenAddItemModal={() => setShowAddItemModal(true)}
                  onOpenAiModal={(tab) => {
                    setAiModalTab(tab);
                    setShowAiModal(true);
                  }}
                />
              )
            )}
          </div>
        </section>

        {/* Isolated Dialog Modals */}
        <CreatePlanModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          planName={newPlanName}
          onPlanNameChange={setNewPlanName}
          planDescription={newPlanDescription}
          onPlanDescriptionChange={setNewPlanDescription}
          onCreate={handleCreatePlan}
        />

        <EditPlanModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          selectedPlan={selectedPlan}
          editPlanName={editPlanName}
          onEditPlanNameChange={setEditPlanName}
          editPlanDescription={editPlanDescription}
          onEditPlanDescriptionChange={setEditPlanDescription}
          onSave={handleEditPlan}
          onDeleteRequest={() => setShowDeleteConfirm(true)}
          onDuplicate={() => {
            handleDuplicatePlan();
            setShowEditModal(false);
            showToast("Plan duplicated!");
          }}
        />

        <SharePlanModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          selectedPlan={selectedPlan}
          shareAuthorName={shareAuthorName}
          onShareAuthorNameChange={setShareAuthorName}
          onConfirmShare={handleConfirmShare}
        />

        <DeleteConfirmModal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          selectedPlan={selectedPlan}
          onConfirmDelete={handleDeletePlan}
        />

        <PrintPlanModal
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          selectedPlan={selectedPlan}
          dayLabels={dayLabels}
          getItemDisplayInfo={getItemDisplayInfo}
          onPrint={handlePrint}
        />

        {/* Add Item Modal */}
        <AddItemModal
          isOpen={showAddItemModal}
          onClose={() => setShowAddItemModal(false)}
          onAdd={handleAddItem}
          dayLabels={dayLabels}
          currentDayLabel={activeDay}
          onDayLabelChange={handleDayLabelChange}
        />

        {/* AI Planner Assistant Modal */}
        <AiPlannerAssistantModal
          isOpen={showAiModal}
          onClose={() => setShowAiModal(false)}
          activePlan={selectedPlan}
          dayLabels={dayLabels}
          currentDayLabel={activeDay}
          onCreatePlanWithItinerary={handleCreatePlanFromAi}
          onAddActivityToPlan={selectedPlan ? handleAddAiActivity : undefined}
          initialTab={aiModalTab}
        />

        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center gap-2 px-4 py-3 rounded-full bg-foreground-900 text-white text-sm font-medium shadow-lg">
              <i className="ri-check-line text-accent-400 text-sm"></i>
              {toastMessage}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
