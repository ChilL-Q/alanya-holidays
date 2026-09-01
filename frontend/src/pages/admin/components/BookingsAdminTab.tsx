import React, { useCallback, useEffect, useState } from "react";
import { adminService, type AdminBookingItem } from "@/api-services/admin.service";
import { logger } from "@/lib/logger";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { useTranslation } from "react-i18next";
import "@/i18n";

const STATUS_FILTERS = ["all", "pending", "confirmed", "completed", "cancelled", "rejected"] as const;

const STATUS_BADGES: Record<string, string> = {
  pending: "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800",
  confirmed: "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800",
  completed: "bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border-sky-300 dark:border-sky-800",
  cancelled: "bg-secondary-100 dark:bg-slate-800 text-secondary-600 dark:text-slate-400 border-secondary-200 dark:border-slate-700",
  rejected: "bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800",
};

const PAYOUT_STATUSES = ["pending", "processing", "paid", "failed", "hold"] as const;

const BookingsAdminTab: React.FC<{ onCountUpdate?: (c: { total: number; pending: number }) => void }> = ({
  onCountUpdate,
}) => {
  const { t } = useTranslation();
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>("all");
  const [bookings, setBookings] = useState<AdminBookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);

  const loadBookings = useCallback(
    async (filter: string, background = false) => {
      if (!background) setLoading(true);
      setError(null);
      try {
        const res = await adminService.getAdminBookings(
          filter === "all" ? undefined : filter,
          { throwOnError: true }
        );
        setBookings(res);
        if (!onCountUpdate) return;
        const source =
          filter === "all"
            ? res
            : await adminService.getAdminBookings(undefined, { throwOnError: true });
        onCountUpdate({ total: source.length, pending: source.filter((b) => b.status === "pending").length });
      } catch (err) {
        logger.error("Failed to load admin bookings:", err);
        setError(t("adminQueue.bookingsError"));
      } finally {
        setLoading(false);
      }
    },
    [onCountUpdate, t]
  );

  useEffect(() => {
    void loadBookings(statusFilter);
  }, [statusFilter, loadBookings]);

  useAutoRefresh(() => loadBookings(statusFilter, true), { intervalMs: 20000 });

  const act = async (id: string, action: () => Promise<boolean>) => {
    setActingId(id);
    setError(null);
    try {
      if (await action()) {
        await loadBookings(statusFilter);
      } else {
        setError("Booking update failed. Please try again.");
      }
    } catch (err) {
      logger.error("Failed to update booking:", err);
      setError("Booking update failed. Please try again.");
    } finally {
      setActingId(null);
    }
  };

  const handlePayoutChange = async (id: string, payoutStatus: string) => {
    setActingId(id);
    setError(null);
    try {
      if (await adminService.updatePayoutStatus(id, payoutStatus)) {
        setBookings((prev) =>
          prev.map((b) => (b.id === id ? { ...b, payout_status: payoutStatus } : b))
        );
      } else {
        setError("Booking payout update failed. Please try again.");
      }
    } catch (err) {
      logger.error("Failed to update booking payout:", err);
      setError("Booking payout update failed. Please try again.");
    } finally {
      setActingId(null);
    }
  };

  const itemTitle = (b: AdminBookingItem) =>
    b.itemTitle || b.property?.title || b.service?.title || `${b.item_type || t("adminQueue.item")} · ${b.item_id || "?"}`;

  return (
    <div className="space-y-5">
      {/* Status filters */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors cursor-pointer border ${
              statusFilter === s
                ? "bg-accent-600 text-white border-accent-600"
                : "bg-white dark:bg-slate-900 text-secondary-600 dark:text-slate-400 border-secondary-200 dark:border-slate-700 hover:border-accent-300"
            }`}
          >
            {s === "all" ? t("adminQueue.all") : t(`adminQueue.status.${s}`)}
          </button>
        ))}
      </div>

      {error && (
        <div role="alert" className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-sm text-rose-800 dark:text-rose-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-secondary-200 dark:border-slate-800 animate-pulse">
              <div className="h-4 bg-secondary-200 dark:bg-slate-800 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="p-10 text-center rounded-2xl bg-white dark:bg-slate-900 border border-secondary-200/80 dark:border-slate-800 text-sm text-secondary-500 dark:text-slate-400">
          {t("adminQueue.noBookings")}
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => {
            const st = booking.status?.toLowerCase() || "pending";
            const payout = booking.payout_status?.toLowerCase();
            const isActing = actingId === booking.id;

            return (
              <div
                key={booking.id}
                className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-secondary-200 dark:border-slate-800 shadow-sm space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm sm:text-base text-secondary-900 dark:text-white truncate">
                      {itemTitle(booking)}
                    </h3>
                    <p className="text-xs text-secondary-500 dark:text-slate-400 mt-0.5">
                      {new Date(booking.check_in).toLocaleDateString()} →{" "}
                      {new Date(booking.check_out).toLocaleDateString()}
                      {booking.guests ? ` · ${booking.guests} ${t("adminQueue.guests")}` : ""}
                      {booking.user?.full_name ? ` · ${booking.user.full_name}` : ""}
                      {booking.user?.email ? ` (${booking.user.email})` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${STATUS_BADGES[st] || STATUS_BADGES.pending}`}>
                      {t(`adminQueue.status.${st}`)}
                    </span>
                    <span className="font-bold text-sm text-secondary-900 dark:text-white">
                      €{Number(booking.total_price ?? 0).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-secondary-100 dark:border-slate-800">
                  {st === "pending" && (
                    <>
                      <button
                        type="button"
                        disabled={isActing}
                        onClick={() => act(booking.id, () => adminService.updateBookingStatus(booking.id, "confirmed"))}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-white transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {t("adminQueue.confirm")}
                      </button>
                      <button
                        type="button"
                        disabled={isActing}
                        onClick={() => act(booking.id, () => adminService.updateBookingStatus(booking.id, "rejected", "Rejected by admin"))}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500 hover:bg-rose-400 text-white transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {t("adminQueue.reject")}
                      </button>
                    </>
                  )}
                  {st === "confirmed" && (
                    <>
                      <button
                        type="button"
                        disabled={isActing}
                        onClick={() => act(booking.id, () => adminService.updateBookingStatus(booking.id, "completed"))}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-white transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {t("adminQueue.markCompleted")}
                      </button>
                      <button
                        type="button"
                        disabled={isActing}
                        onClick={() => act(booking.id, () => adminService.updateBookingStatus(booking.id, "cancelled", "Cancelled by admin"))}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-secondary-100 dark:bg-slate-800 hover:bg-secondary-200 dark:hover:bg-slate-700 text-secondary-800 dark:text-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {t("adminQueue.cancel")}
                      </button>
                    </>
                  )}
                  <label className="ml-auto flex items-center gap-1.5 text-xs text-secondary-500 dark:text-slate-400">
                    {t("adminQueue.payout")}
                    <select
                      value={payout || ""}
                      disabled={isActing}
                      onChange={(e) => handlePayoutChange(booking.id, e.target.value)}
                      className="px-2 py-1 rounded-lg border border-secondary-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-secondary-900 dark:text-white outline-none focus:border-accent-400"
                    >
                      {!payout && <option value="">—</option>}
                      {PAYOUT_STATUSES.map((ps) => (
                        <option key={ps} value={ps}>
                          {t(`adminQueue.status.${ps}`)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BookingsAdminTab;
