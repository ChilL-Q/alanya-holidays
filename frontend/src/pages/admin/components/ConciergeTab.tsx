import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  adminService,
  type ConciergeEnquiry,
} from "@/api-services/admin.service";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";

type StatusFilter = "all" | "new" | "responded" | "archived";
type EnquiryTypeFilter = string;

interface ConciergeTabProps {
  onEnquiriesCountUpdate?: (counts: { total: number; newCount: number }) => void;
}

const statusConfig: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  new: {
    label: "New",
    bg: "bg-accent-100 dark:bg-accent-950/80 border-accent-200 dark:border-accent-800",
    text: "text-accent-800 dark:text-accent-300",
    dot: "bg-accent-500",
  },
  responded: {
    label: "Responded",
    bg: "bg-primary-100 dark:bg-primary-950/80 border-primary-200 dark:border-primary-800",
    text: "text-primary-800 dark:text-primary-300",
    dot: "bg-primary-500",
  },
  archived: {
    label: "Archived",
    bg: "bg-secondary-100 dark:bg-slate-800 border-secondary-200 dark:border-slate-700",
    text: "text-secondary-800 dark:text-slate-300",
    dot: "bg-secondary-500",
  },
};

const enquiryTypeConfig: Record<string, { label: string; icon: string; bg: string; text: string }> = {
  private_jet: { label: "Private Jet", icon: "ri-plane-line", bg: "bg-sky-100 dark:bg-sky-950/80", text: "text-sky-700 dark:text-sky-300" },
  personal_chef: { label: "Personal Chef", icon: "ri-restaurant-2-line", bg: "bg-orange-100 dark:bg-orange-950/80", text: "text-orange-700 dark:text-orange-300" },
  personal_driver: { label: "Personal Driver", icon: "ri-steering-2-line", bg: "bg-emerald-100 dark:bg-emerald-950/80", text: "text-emerald-700 dark:text-emerald-300" },
  personal_shopper: { label: "Personal Shopper", icon: "ri-shopping-bag-3-line", bg: "bg-pink-100 dark:bg-pink-950/80", text: "text-pink-700 dark:text-pink-300" },
  golf_vacation: { label: "Golf Vacation", icon: "ri-golf-ball-line", bg: "bg-lime-100 dark:bg-lime-950/80", text: "text-lime-700 dark:text-lime-300" },
  yacht_charter: { label: "Yacht Charter", icon: "ri-sailboat-line", bg: "bg-cyan-100 dark:bg-cyan-950/80", text: "text-cyan-700 dark:text-cyan-300" },
  wine_tasting: { label: "Wine Tasting", icon: "ri-goblet-line", bg: "bg-rose-100 dark:bg-rose-950/80", text: "text-rose-700 dark:text-rose-300" },
  hammam_spa: { label: "Hammam & Spa", icon: "ri-drop-line", bg: "bg-teal-100 dark:bg-teal-950/80", text: "text-teal-700 dark:text-teal-300" },
  general: { label: "General", icon: "ri-question-line", bg: "bg-secondary-100 dark:bg-slate-800", text: "text-secondary-700 dark:text-slate-300" },
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

export default function ConciergeTab({
  onEnquiriesCountUpdate,
}: ConciergeTabProps) {
  const [enquiries, setEnquiries] = useState<ConciergeEnquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [enquiryTypeFilter, setEnquiryTypeFilter] = useState<EnquiryTypeFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const onEnquiriesCountUpdateRef = React.useRef(onEnquiriesCountUpdate);
  useEffect(() => {
    onEnquiriesCountUpdateRef.current = onEnquiriesCountUpdate;
  }, [onEnquiriesCountUpdate]);

  const fetchEnquiries = useCallback(async (background = false) => {
    if (!background) setLoading(true);
    setError(null);
    try {
      const data = await adminService.getEnquiries({ throwOnError: true });
      setEnquiries(data || []);
      if (onEnquiriesCountUpdateRef.current) {
        const newCount = (data || []).filter((e) => e.status === "new").length;
        onEnquiriesCountUpdateRef.current({ total: data?.length || 0, newCount });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load enquiries");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchEnquiries();
  }, [fetchEnquiries]);

  useAutoRefresh(() => fetchEnquiries(true), { intervalMs: 15000 });

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
          (e.subject && e.subject.toLowerCase().includes(q)) ||
          e.message.toLowerCase().includes(q) ||
          String(e.id).includes(q)
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
      prev.map((e) => (e.id === id ? { ...e, status: newStatus } : e))
    );

    const success = await adminService.updateEnquiryStatus(id, newStatus);
    if (!success) {
      fetchEnquiries();
    }
  };

  const handleAssign = async (id: number, assignedTo: string) => {
    setEnquiries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, assigned_to: assignedTo } : e))
    );

    const success = await adminService.assignEnquiry(
      id,
      assignedTo === "unassigned" ? null : assignedTo
    );
    if (!success) {
      fetchEnquiries();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Stat Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <button
          type="button"
          onClick={() => setStatusFilter("all")}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === "all"
              ? "bg-secondary-900 text-white dark:bg-slate-100 dark:text-slate-900 border-secondary-900 dark:border-slate-100 shadow-md"
              : "bg-white dark:bg-slate-900 text-secondary-800 dark:text-slate-200 border-secondary-200 dark:border-slate-800 hover:border-secondary-300 dark:hover:border-slate-700"
          }`}
        >
          <div className="text-2xl font-bold">{stats.total}</div>
          <div
            className={`text-xs mt-1 ${
              statusFilter === "all"
                ? "text-secondary-300 dark:text-slate-700"
                : "text-secondary-500 dark:text-slate-400"
            }`}
          >
            Total Enquiries
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("new")}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === "new"
              ? "bg-accent-600 text-white border-accent-600 shadow-md"
              : "bg-white dark:bg-slate-900 text-secondary-800 dark:text-slate-200 border-secondary-200 dark:border-slate-800 hover:border-accent-300"
          }`}
        >
          <div className="text-2xl font-bold flex items-center justify-between">
            <span>{stats.newCount}</span>
            <span className="w-2.5 h-2.5 rounded-full bg-accent-500" />
          </div>
          <div
            className={`text-xs mt-1 ${
              statusFilter === "new" ? "text-accent-100" : "text-secondary-500 dark:text-slate-400"
            }`}
          >
            New / Unresolved
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("responded")}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === "responded"
              ? "bg-primary-600 text-white border-primary-600 shadow-md"
              : "bg-white dark:bg-slate-900 text-secondary-800 dark:text-slate-200 border-secondary-200 dark:border-slate-800 hover:border-primary-300"
          }`}
        >
          <div className="text-2xl font-bold flex items-center justify-between">
            <span>{stats.respondedCount}</span>
            <span className="w-2.5 h-2.5 rounded-full bg-primary-500" />
          </div>
          <div
            className={`text-xs mt-1 ${
              statusFilter === "responded" ? "text-primary-100" : "text-secondary-500 dark:text-slate-400"
            }`}
          >
            Responded
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("archived")}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === "archived"
              ? "bg-secondary-700 dark:bg-slate-700 text-white border-secondary-700 dark:border-slate-700 shadow-md"
              : "bg-white dark:bg-slate-900 text-secondary-800 dark:text-slate-200 border-secondary-200 dark:border-slate-800 hover:border-secondary-300 dark:hover:border-slate-700"
          }`}
        >
          <div className="text-2xl font-bold">{stats.archivedCount}</div>
          <div
            className={`text-xs mt-1 ${
              statusFilter === "archived" ? "text-secondary-300" : "text-secondary-500 dark:text-slate-400"
            }`}
          >
            Archived
          </div>
        </button>
      </div>

      {/* Filter Bar & Category Pills */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-xs border border-secondary-200/80 dark:border-slate-800 space-y-4 transition-colors">
        <div className="relative">
          <i className="ri-search-line absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary-400 dark:text-slate-500 text-base" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by client name, email, subject, or message content..."
            className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-secondary-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-secondary-900 dark:text-white placeholder:text-secondary-400 dark:placeholder:text-slate-500 focus:border-accent-500 focus:ring-2 focus:ring-accent-100 dark:focus:ring-accent-950 outline-none transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600 dark:text-slate-500 dark:hover:text-slate-300 text-base p-1 cursor-pointer"
            >
              <i className="ri-close-circle-fill" />
            </button>
          )}
        </div>

        {/* Enquiry Type Filters */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          <button
            type="button"
            onClick={() => setEnquiryTypeFilter("all")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              enquiryTypeFilter === "all"
                ? "bg-secondary-900 text-white dark:bg-slate-100 dark:text-slate-900"
                : "bg-secondary-100 dark:bg-slate-800 text-secondary-600 dark:text-slate-300 hover:bg-secondary-200 dark:hover:bg-slate-700"
            }`}
          >
            All Services ({stats.total})
          </button>
          {Object.entries(enquiryTypeConfig).map(([key, cfg]) => {
            const count = typeStats[key] || 0;
            if (count === 0 && enquiryTypeFilter !== key) return null;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setEnquiryTypeFilter(key)}
                className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors cursor-pointer ${
                  enquiryTypeFilter === key
                    ? "bg-secondary-900 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold"
                    : "bg-secondary-100 dark:bg-slate-800 text-secondary-600 dark:text-slate-300 hover:bg-secondary-200 dark:hover:bg-slate-700"
                }`}
              >
                <i className={cfg.icon} />
                <span>{cfg.label}</span>
                <span className="opacity-75">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-800 dark:text-rose-200 text-sm flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <i className="ri-error-warning-line text-lg text-rose-600" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={fetchEnquiries}
            className="text-xs font-semibold text-rose-700 dark:text-rose-300 underline hover:no-underline cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Enquiries List */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-secondary-200/80 dark:border-slate-800 p-6 space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="animate-pulse space-y-2">
              <div className="h-4 bg-secondary-100 dark:bg-slate-800 rounded-md w-1/4" />
              <div className="h-3 bg-secondary-100 dark:bg-slate-800 rounded-md w-3/4" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-secondary-200/80 dark:border-slate-800 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-secondary-100 dark:bg-slate-800 text-secondary-400 dark:text-slate-500 flex items-center justify-center text-3xl mx-auto mb-3">
            <i className="ri-inbox-line" />
          </div>
          <h3 className="text-base font-bold text-secondary-800 dark:text-white">
            No enquiries found
          </h3>
          <p className="text-sm text-secondary-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
            No concierge requests match your selected filters.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-secondary-200/80 dark:border-slate-800 shadow-xs divide-y divide-secondary-100 dark:divide-slate-800 overflow-hidden transition-colors">
          {filtered.map((enquiry) => {
            const isExpanded = expandedId === enquiry.id;
            const status = statusConfig[enquiry.status] || statusConfig.new;
            const typeConfig =
              enquiryTypeConfig[enquiry.enquiry_type || "general"] ||
              enquiryTypeConfig.general;
            const icon =
              subjectIcons[enquiry.subject || ""] ||
              typeConfig.icon ||
              "ri-customer-service-2-line";

            return (
              <div
                key={enquiry.id}
                className={`transition-colors ${
                  isExpanded
                    ? "bg-secondary-50/70 dark:bg-slate-800/60"
                    : "hover:bg-secondary-50/40 dark:hover:bg-slate-800/40"
                }`}
              >
                {/* Header Row */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : enquiry.id)}
                  className="p-5 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start space-x-3.5 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-secondary-100 dark:bg-slate-800 text-secondary-600 dark:text-slate-300 flex items-center justify-center text-lg flex-shrink-0">
                      <i className={icon} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-secondary-900 dark:text-white truncate">
                          {enquiry.name}
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${status.bg} ${status.text}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full mr-1.5 ${status.dot}`}
                          />
                          {status.label}
                        </span>
                        <span
                          className={`hidden sm:inline-block px-2 py-0.5 rounded-md text-xs font-medium ${typeConfig.bg} ${typeConfig.text}`}
                        >
                          {typeConfig.label}
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-secondary-700 dark:text-slate-200 truncate mt-0.5">
                        {enquiry.subject || "Concierge Request"}
                      </div>
                      <div className="text-xs text-secondary-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                        {enquiry.message}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 text-xs text-secondary-400 dark:text-slate-500 pl-13 sm:pl-0">
                    <span>{getRelativeTime(enquiry.created_at)}</span>
                    <i
                      className={`ri-arrow-${
                        isExpanded ? "up" : "down"
                      }-s-line text-lg text-secondary-400 dark:text-slate-500`}
                    />
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-secondary-100/80 dark:border-slate-800 bg-secondary-50/50 dark:bg-slate-950/40 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-secondary-200 dark:border-slate-800">
                        <span className="text-secondary-400 dark:text-slate-500 block font-medium">Email</span>
                        <a
                          href={`mailto:${enquiry.email}`}
                          className="text-accent-600 dark:text-accent-400 font-semibold hover:underline truncate block"
                        >
                          {enquiry.email}
                        </a>
                      </div>

                      {enquiry.phone && (
                        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-secondary-200 dark:border-slate-800">
                          <span className="text-secondary-400 dark:text-slate-500 block font-medium">Phone</span>
                          <a
                            href={`tel:${enquiry.phone}`}
                            className="text-secondary-900 dark:text-white font-semibold hover:underline"
                          >
                            {enquiry.phone}
                          </a>
                        </div>
                      )}

                      {enquiry.dates && (
                        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-secondary-200 dark:border-slate-800">
                          <span className="text-secondary-400 dark:text-slate-500 block font-medium">Dates / Schedule</span>
                          <span className="text-secondary-900 dark:text-white font-semibold">
                            {enquiry.dates}
                          </span>
                        </div>
                      )}

                      {enquiry.party_size && (
                        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-secondary-200 dark:border-slate-800">
                          <span className="text-secondary-400 dark:text-slate-500 block font-medium">Party Size</span>
                          <span className="text-secondary-900 dark:text-white font-semibold">
                            {enquiry.party_size} Guests
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Full Message */}
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-secondary-200 dark:border-slate-800 space-y-1.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-secondary-400 dark:text-slate-500 block">
                        Message Content
                      </span>
                      <p className="text-sm text-secondary-800 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                        {enquiry.message}
                      </p>
                    </div>

                    {/* Actions Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <div className="flex items-center space-x-2 text-xs">
                        <span className="font-semibold text-secondary-600 dark:text-slate-300">Assign To:</span>
                        <select
                          value={enquiry.assigned_to || "unassigned"}
                          onChange={(e) => handleAssign(enquiry.id, e.target.value)}
                          className="px-2.5 py-1 rounded-lg border border-secondary-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-secondary-800 dark:text-slate-200 outline-none"
                        >
                          <option value="unassigned">Unassigned</option>
                          <option value="VIP Concierge Team">VIP Concierge Team</option>
                          <option value="Lead Travel Specialist">Lead Travel Specialist</option>
                          <option value="Operations Desk">Operations Desk</option>
                        </select>
                      </div>

                      <div className="flex items-center space-x-2">
                        {enquiry.status !== "new" && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(enquiry.id, "new")}
                            className="px-3 py-1 text-xs font-medium text-secondary-600 dark:text-slate-300 hover:bg-secondary-200 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          >
                            Mark New
                          </button>
                        )}
                        {enquiry.status !== "responded" && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(enquiry.id, "responded")}
                            className="px-3 py-1 text-xs font-semibold text-primary-700 dark:text-primary-300 bg-primary-100 dark:bg-primary-950/60 hover:bg-primary-200 dark:hover:bg-primary-900/60 rounded-lg transition-colors cursor-pointer"
                          >
                            Mark Responded
                          </button>
                        )}
                        {enquiry.status !== "archived" && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(enquiry.id, "archived")}
                            className="px-3 py-1 text-xs font-medium text-secondary-500 dark:text-slate-400 hover:bg-secondary-200 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          >
                            Archive
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="text-2xs text-secondary-400 dark:text-slate-500 text-right">
                      Submitted on {getFullDate(enquiry.created_at)}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
