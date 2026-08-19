import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/pages/home/components/Navbar";
import Footer from "@/pages/home/components/Footer";
import { adminService, type ConciergeEnquiry } from "@/api-services/admin.service";

type StatusFilter = "all" | "new" | "responded" | "archived";
type EnquiryTypeFilter = string;

const statusConfig: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  new: { label: "New", bg: "bg-accent-100", text: "text-accent-800", dot: "bg-accent-500" },
  responded: { label: "Responded", bg: "bg-primary-100", text: "text-primary-800", dot: "bg-primary-500" },
  archived: { label: "Archived", bg: "bg-secondary-100", text: "text-secondary-800", dot: "bg-secondary-500" },
};

const enquiryTypeConfig: Record<string, { label: string; icon: string; bg: string; text: string }> = {
  private_jet: { label: "Private Jet", icon: "ri-plane-line", bg: "bg-sky-100", text: "text-sky-700" },
  personal_chef: { label: "Personal Chef", icon: "ri-restaurant-2-line", bg: "bg-orange-100", text: "text-orange-700" },
  personal_driver: { label: "Personal Driver", icon: "ri-steering-2-line", bg: "bg-emerald-100", text: "text-emerald-700" },
  personal_shopper: { label: "Personal Shopper", icon: "ri-shopping-bag-3-line", bg: "bg-pink-100", text: "text-pink-700" },
  golf_vacation: { label: "Golf Vacation", icon: "ri-golf-ball-line", bg: "bg-lime-100", text: "text-lime-700" },
  yacht_charter: { label: "Yacht Charter", icon: "ri-sailboat-line", bg: "bg-cyan-100", text: "text-cyan-700" },
  wine_tasting: { label: "Wine Tasting", icon: "ri-goblet-line", bg: "bg-rose-100", text: "text-rose-700" },
  hammam_spa: { label: "Hammam & Spa", icon: "ri-drop-line", bg: "bg-teal-100", text: "text-teal-700" },
  general: { label: "General", icon: "ri-question-line", bg: "bg-secondary-100", text: "text-secondary-700" },
};

const subjectIcons: Record<string, string> = {
  "Yacht Charter": "ri-sailboat-line",
  "Villa Stay": "ri-home-4-line",
  "Helicopter Tour": "ri-flight-takeoff-line",
  "Wine Tasting": "ri-goblet-line",
  "Hammam & Spa": "ri-drop-line",
  "Photography Excursion": "ri-camera-lens-line",
  "Trip Planning": "ri-map-pin-line",
  "Dining & Reservations": "ri-restaurant-line",
  "Transport & Transfers": "ri-car-line",
  "Accommodation": "ri-hotel-line",
  "Special Event": "ri-calendar-check-line",
  "Expat & Relocation": "ri-suitcase-line",
};

function getRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function getFullDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminDashboardPage() {
  const [enquiries, setEnquiries] = useState<ConciergeEnquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [enquiryTypeFilter, setEnquiryTypeFilter] = useState<EnquiryTypeFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchEnquiries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getEnquiries();
      setEnquiries(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load enquiries");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEnquiries();
  }, [fetchEnquiries]);

  const filtered = useMemo(() => {
    let list = enquiries;
    if (statusFilter !== "all") {
      list = list.filter((e) => e.status === statusFilter);
    }
    if (enquiryTypeFilter !== "all") {
      list = list.filter((e) => e.enquiry_type === enquiryTypeFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q) ||
          e.subject.toLowerCase().includes(q) ||
          e.message.toLowerCase().includes(q) ||
          String(e.id).includes(q),
      );
    }
    return list;
  }, [statusFilter, enquiryTypeFilter, searchQuery, enquiries]);

  const stats = useMemo(() => {
    const total = enquiries.length;
    const newCount = enquiries.filter((e) => e.status === "new").length;
    const respondedCount = enquiries.filter((e) => e.status === "responded").length;
    const archivedCount = enquiries.filter((e) => e.status === "archived").length;
    return { total, newCount, respondedCount, archivedCount };
  }, [enquiries]);

  const typeStats = useMemo(() => {
    const map: Record<string, number> = {};
    enquiries.forEach((e) => {
      const key = e.enquiry_type || "general";
      map[key] = (map[key] || 0) + 1;
    });
    return map;
  }, [enquiries]);

  const handleStatusChange = async (id: number, newStatus: string) => {
    setEnquiries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: newStatus } : e)),
    );

    const success = await adminService.updateEnquiryStatus(id, newStatus);
    if (!success) {
      fetchEnquiries();
    }
  };

  const handleAssign = async (id: number, assignedTo: string) => {
    setEnquiries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, assigned_to: assignedTo } : e)),
    );

    const success = await adminService.assignEnquiry(id, assignedTo || null);
    if (!success) {
      fetchEnquiries();
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const clearAllFilters = () => {
    setStatusFilter("all");
    setEnquiryTypeFilter("all");
    setSearchQuery("");
  };

  const hasActiveFilters = statusFilter !== "all" || enquiryTypeFilter !== "all" || searchQuery !== "";

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 md:pt-28">
        {/* Admin Header Bar */}
        <section className="w-full bg-white border-b border-background-200/70">
          <div className="w-full px-4 md:px-8 lg:px-12 py-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary-100">
                  <i className="ri-dashboard-3-line text-primary-600 text-lg"></i>
                </div>
                <div>
                  <h1 className="font-heading text-2xl text-foreground-900">Concierge Dashboard</h1>
                  <p className="text-xs text-foreground-500 mt-0.5">Review and manage incoming enquiries — live from the database</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  to="/insights"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-background-200 text-sm text-foreground-600 hover:bg-background-50 transition-colors whitespace-nowrap"
                >
                  <i className="ri-line-chart-line text-sm"></i>
                  Insights
                </Link>
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-background-200 text-sm text-foreground-600 hover:bg-background-50 transition-colors whitespace-nowrap"
                >
                  <i className="ri-external-link-line text-sm"></i>
                  View Contact Form
                </Link>
                <button
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500 text-background-50 text-sm font-semibold hover:bg-primary-600 transition-colors whitespace-nowrap cursor-pointer"
                  onClick={fetchEnquiries}
                  disabled={loading}
                >
                  <i className={`text-sm ${loading ? "ri-loader-4-line animate-spin" : "ri-refresh-line"}`}></i>
                  {loading ? "Loading..." : "Refresh"}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Row */}
        <section className="w-full px-4 md:px-8 lg:px-12 py-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <button
              onClick={() => setStatusFilter("all")}
              className={`text-left rounded-2xl p-5 border transition-all cursor-pointer ${
                statusFilter === "all" && enquiryTypeFilter === "all"
                  ? "border-foreground-300 bg-white"
                  : "border-background-200/70 bg-white hover:border-foreground-200"
              }`}
            >
              <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-background-100 mb-3">
                <i className="ri-inbox-line text-foreground-600 text-base"></i>
              </div>
              <p className="text-2xl font-semibold text-foreground-900">{stats.total}</p>
              <p className="text-xs text-foreground-500 mt-0.5">Total Enquiries</p>
            </button>

            <button
              onClick={() => { setStatusFilter("new"); setEnquiryTypeFilter("all"); }}
              className={`text-left rounded-2xl p-5 border transition-all cursor-pointer ${
                statusFilter === "new"
                  ? "border-accent-300 bg-accent-50/60"
                  : "border-background-200/70 bg-white hover:border-accent-200"
              }`}
            >
              <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-accent-100 mb-3">
                <i className="ri-mail-unread-line text-accent-600 text-base"></i>
              </div>
              <p className="text-2xl font-semibold text-foreground-900">{stats.newCount}</p>
              <p className="text-xs text-foreground-500 mt-0.5">New</p>
            </button>

            <button
              onClick={() => { setStatusFilter("responded"); setEnquiryTypeFilter("all"); }}
              className={`text-left rounded-2xl p-5 border transition-all cursor-pointer ${
                statusFilter === "responded"
                  ? "border-primary-300 bg-primary-50/60"
                  : "border-background-200/70 bg-white hover:border-primary-200"
              }`}
            >
              <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-primary-100 mb-3">
                <i className="ri-mail-check-line text-primary-600 text-base"></i>
              </div>
              <p className="text-2xl font-semibold text-foreground-900">{stats.respondedCount}</p>
              <p className="text-xs text-foreground-500 mt-0.5">Responded</p>
            </button>

            <button
              onClick={() => { setStatusFilter("archived"); setEnquiryTypeFilter("all"); }}
              className={`text-left rounded-2xl p-5 border transition-all cursor-pointer ${
                statusFilter === "archived"
                  ? "border-secondary-300 bg-secondary-50/60"
                  : "border-background-200/70 bg-white hover:border-secondary-200"
              }`}
            >
              <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-secondary-100 mb-3">
                <i className="ri-archive-line text-secondary-600 text-base"></i>
              </div>
              <p className="text-2xl font-semibold text-foreground-900">{stats.archivedCount}</p>
              <p className="text-xs text-foreground-500 mt-0.5">Archived</p>
            </button>
          </div>
        </section>

        {/* Search + Filter Bar */}
        <section className="w-full px-4 md:px-8 lg:px-12 pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 w-full max-w-md">
              <i className="ri-search-line absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-400 text-sm"></i>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, subject, or message..."
                className="w-full pl-10 pr-4 py-2.5 rounded-full border border-background-200 bg-white text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-background-200 text-foreground-500 hover:bg-background-300 transition-colors cursor-pointer"
                >
                  <i className="ri-close-line text-xs"></i>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {(["all", "new", "responded", "archived"] as StatusFilter[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-4 py-2 rounded-full text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    statusFilter === s
                      ? "bg-foreground-900 text-background-50"
                      : "bg-background-100 text-foreground-600 hover:bg-background-200"
                  }`}
                >
                  {s === "all" ? "All" : statusConfig[s].label}
                </button>
              ))}
            </div>
          </div>

          {/* Enquiry Type Filter Pills */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-foreground-400 mr-1 whitespace-nowrap">Category:</span>
            <button
              onClick={() => setEnquiryTypeFilter("all")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                enquiryTypeFilter === "all"
                  ? "bg-foreground-900 text-background-50"
                  : "bg-background-100 text-foreground-600 hover:bg-background-200"
              }`}
            >
              All Types
            </button>
            {Object.entries(enquiryTypeConfig).map(([key, cfg]) => {
              const count = typeStats[key] || 0;
              return (
                <button
                  key={key}
                  onClick={() => setEnquiryTypeFilter(enquiryTypeFilter === key ? "all" : key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    enquiryTypeFilter === key
                      ? `${cfg.bg} ${cfg.text}`
                      : "bg-background-100 text-foreground-600 hover:bg-background-200"
                  }`}
                >
                  <i className={`${cfg.icon} text-xs`}></i>
                  {cfg.label}
                  <span className={`ml-0.5 text-[10px] opacity-60 ${enquiryTypeFilter === key ? "" : "text-foreground-400"}`}>
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-2 text-xs text-foreground-400 flex items-center gap-2">
            <span>Showing {filtered.length} of {enquiries.length} enquiries</span>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-primary-600 hover:text-primary-700 underline cursor-pointer"
              >
                Clear all filters
              </button>
            )}
          </div>
        </section>

        {/* Enquiries Table */}
        <section className="w-full px-4 md:px-8 lg:px-12 pb-16 md:pb-24">
          {loading ? (
            <div className="bg-white rounded-2xl border border-background-200/70 p-12 text-center">
              <i className="ri-loader-4-line animate-spin text-foreground-400 text-3xl mb-4 block"></i>
              <p className="text-sm text-foreground-500">Loading enquiries...</p>
            </div>
          ) : error ? (
            <div className="bg-white rounded-2xl border border-background-200/70 p-12 text-center">
              <div className="w-16 h-16 mx-auto flex items-center justify-center rounded-full bg-primary-100 mb-4">
                <i className="ri-error-warning-line text-primary-600 text-2xl"></i>
              </div>
              <h3 className="font-heading text-lg text-foreground-800 mb-1">Could not load enquiries</h3>
              <p className="text-sm text-foreground-500 mb-4 max-w-md mx-auto">{error}</p>
              <button
                onClick={fetchEnquiries}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary-500 text-background-50 text-sm font-semibold hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="ri-refresh-line"></i>
                Retry
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-background-200/70 p-12 text-center">
              <div className="w-16 h-16 mx-auto flex items-center justify-center rounded-full bg-background-100 mb-4">
                <i className="ri-inbox-line text-foreground-400 text-2xl"></i>
              </div>
              <h3 className="font-heading text-lg text-foreground-800 mb-1">No enquiries found</h3>
              <p className="text-sm text-foreground-500">
                {hasActiveFilters
                  ? "No results match the current filters. Try adjusting or clearing them."
                  : "No enquiries match the current filter."}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-background-100 text-foreground-700 text-sm font-medium hover:bg-background-200 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-close-line"></i>
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-background-200/70 overflow-hidden">
              {/* Table Header */}
              <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3.5 border-b border-background-200/50 bg-background-50/70 text-xs font-medium text-foreground-500 uppercase tracking-wider">
                <div className="col-span-3">Guest</div>
                <div className="col-span-2">Subject</div>
                <div className="col-span-1">Type</div>
                <div className="col-span-2">Received</div>
                <div className="col-span-2">Assigned To</div>
                <div className="col-span-1">Status</div>
                <div className="col-span-1"></div>
              </div>

              {/* Table Rows */}
              <div className="divide-y divide-background-100/70">
                {filtered.map((enquiry) => {
                  const isExpanded = expandedId === enquiry.id;
                  const cfg = statusConfig[enquiry.status] || statusConfig.new;
                  const typeKey = enquiry.enquiry_type || "general";
                  const typeCfg = enquiryTypeConfig[typeKey] || enquiryTypeConfig.general;

                  return (
                    <div key={enquiry.id}>
                      <div
                        onClick={() => toggleExpand(enquiry.id)}
                        className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 px-6 py-4 hover:bg-background-50/60 transition-colors cursor-pointer items-center"
                      >
                        {/* Guest */}
                        <div className="md:col-span-3 flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 flex items-center justify-center rounded-full bg-primary-100 text-primary-700 text-xs font-semibold shrink-0">
                            {enquiry.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground-900 truncate">{enquiry.name}</p>
                            <p className="text-xs text-foreground-500 truncate">{enquiry.email}</p>
                          </div>
                        </div>

                        {/* Subject */}
                        <div className="md:col-span-2 flex items-center gap-2">
                          <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-secondary-100 shrink-0">
                            <i className={`${subjectIcons[enquiry.subject] || "ri-question-line"} text-secondary-600 text-xs`}></i>
                          </div>
                          <span className="text-sm text-foreground-700 truncate">{enquiry.subject}</span>
                        </div>

                        {/* Enquiry Type Badge */}
                        <div className="md:col-span-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${typeCfg.bg} ${typeCfg.text} whitespace-nowrap`}>
                            <i className={`${typeCfg.icon} text-[10px]`}></i>
                            {typeCfg.label}
                          </span>
                        </div>

                        {/* Received */}
                        <div className="md:col-span-2">
                          <span className="text-sm text-foreground-600" title={getFullDate(enquiry.created_at)}>
                            {getRelativeTime(enquiry.created_at)}
                          </span>
                          <span className="hidden md:block text-xs text-foreground-400">#{enquiry.id}</span>
                        </div>

                        {/* Assigned */}
                        <div className="md:col-span-2">
                          {enquiry.assigned_to ? (
                            <span className="text-sm text-foreground-700">{enquiry.assigned_to}</span>
                          ) : (
                            <span className="text-xs text-foreground-400 italic">Unassigned</span>
                          )}
                        </div>

                        {/* Status */}
                        <div className="md:col-span-1">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}></span>
                            {cfg.label}
                          </span>
                        </div>

                        {/* Expand Cue */}
                        <div className="md:col-span-1 flex justify-end">
                          <i
                            className={`ri-arrow-down-s-line text-foreground-400 transition-transform duration-200 ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                          ></i>
                        </div>
                      </div>

                      {/* Expanded Message */}
                      {isExpanded && (
                        <div className="px-6 pb-4 bg-background-50/50">
                          <div className="pl-0 md:pl-12">
                            <div className="bg-white rounded-xl border border-background-200/70 p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${typeCfg.bg} ${typeCfg.text}`}>
                                  <i className={`${typeCfg.icon} text-[10px]`}></i>
                                  {typeCfg.label}
                                </span>
                              </div>
                              <p className="text-xs font-medium text-foreground-500 mb-2 uppercase tracking-wider">Message</p>
                              <p className="text-sm text-foreground-800 leading-relaxed whitespace-pre-wrap">{enquiry.message}</p>
                              <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-background-100">
                                {enquiry.status === "new" && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStatusChange(enquiry.id, "responded");
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent-100 text-accent-700 text-xs font-medium hover:bg-accent-200 transition-colors cursor-pointer whitespace-nowrap"
                                  >
                                    <i className="ri-reply-line"></i>
                                    Mark Responded
                                  </button>
                                )}
                                {enquiry.status !== "archived" && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStatusChange(enquiry.id, "archived");
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary-100 text-secondary-700 text-xs font-medium hover:bg-secondary-200 transition-colors cursor-pointer whitespace-nowrap"
                                  >
                                    <i className="ri-archive-line"></i>
                                    Archive
                                  </button>
                                )}
                                {enquiry.status === "archived" && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStatusChange(enquiry.id, "new");
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent-100 text-accent-700 text-xs font-medium hover:bg-accent-200 transition-colors cursor-pointer whitespace-nowrap"
                                  >
                                    <i className="ri-inbox-unarchive-line"></i>
                                    Unarchive
                                  </button>
                                )}
                                {!enquiry.assigned_to && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const name = window.prompt("Assign to which team member?");
                                      if (name && name.trim()) {
                                        handleAssign(enquiry.id, name.trim());
                                      }
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background-100 text-foreground-600 text-xs font-medium hover:bg-background-200 transition-colors cursor-pointer whitespace-nowrap"
                                  >
                                    <i className="ri-user-add-line"></i>
                                    Assign
                                  </button>
                                )}
                                {enquiry.assigned_to && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAssign(enquiry.id, "");
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background-100 text-foreground-600 text-xs font-medium hover:bg-background-200 transition-colors cursor-pointer whitespace-nowrap"
                                  >
                                    <i className="ri-user-unfollow-line"></i>
                                    Unassign
                                  </button>
                                )}
                                <span className="ml-auto text-xs text-foreground-400">
                                  {getFullDate(enquiry.created_at)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}