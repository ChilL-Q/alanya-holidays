import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Compass, Calendar, Users, MapPin, AlertCircle, RefreshCw, ChevronRight, XCircle, CheckCircle2, Clock } from "lucide-react";
import { bookingsService, type BookingItem } from "@/api-services/bookings.service";

export function BookingsList() {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await bookingsService.getUserBookings();
      setBookings(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      console.error("Failed to load user bookings:", err);
      setError("Unable to load bookings. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchBookings();
  }, [fetchBookings]);

  const handleCancelBooking = async (bookingId: string) => {
    if (typeof window !== "undefined" && typeof window.confirm === "function") {
      try {
        const confirmed = window.confirm("Are you sure you want to cancel this booking?");
        if (!confirmed) return;
      } catch {
        // window.confirm not supported or mocked
      }
    }

    setCancellingId(bookingId);
    setActionMessage(null);
    try {
      const res = await bookingsService.cancelBooking(bookingId);
      if (res.success) {
        setActionMessage({ text: res.message || "Booking successfully cancelled.", type: "success" });
        setBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? { ...b, status: "cancelled" } : b))
        );
      } else {
        setActionMessage({ text: res.message || "Could not cancel booking.", type: "error" });
      }
    } catch (err: unknown) {
      console.error("Cancel booking error:", err);
      setActionMessage({ text: "An error occurred while cancelling the booking.", type: "error" });
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadge = (status?: string) => {
    const s = (status || "pending").toLowerCase();
    switch (s) {
      case "confirmed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Confirmed
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            Pending Review
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <XCircle className="w-3.5 h-3.5 text-slate-500" />
            Cancelled
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            Completed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            {status || "Active"}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div data-testid="bookings-loading-skeleton" className="space-y-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-6 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-5 bg-slate-200 rounded w-1/3" />
              <div className="h-6 bg-slate-200 rounded-full w-24" />
            </div>
            <div className="h-4 bg-slate-200 rounded w-1/2" />
            <div className="h-12 bg-slate-200 rounded w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-rose-800">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
        <button
          onClick={() => void fetchBookings()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold hover:bg-rose-100/50 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </button>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="py-12 px-4 text-center rounded-2xl bg-slate-50/50 border border-dashed border-slate-200">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center mx-auto mb-4">
          <Compass className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">No bookings or inquiries found</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
          You haven't reserved any luxury villas, yacht charters, or VIP concierge experiences yet.
        </p>
        <Link
          to="/explore"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-all shadow-xs"
        >
          Explore Villas & Experiences
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {actionMessage && (
        <div
          className={`p-4 rounded-xl text-sm font-medium border flex items-center justify-between ${
            actionMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          <span>{actionMessage.text}</span>
          <button
            onClick={() => setActionMessage(null)}
            className="text-xs underline cursor-pointer ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {bookings.map((booking) => {
        const title =
          booking.itemTitle ||
          booking.property?.title ||
          booking.service?.title ||
          `Reservation #${booking.id}`;

        const location = booking.property?.location;
        const isCancellable =
          booking.status === "pending" || booking.status === "confirmed";

        const formatDate = (d?: string) => {
          if (!d) return "—";
          try {
            return new Date(d).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            });
          } catch {
            return d;
          }
        };

        return (
          <div
            key={booking.id}
            className="p-6 bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:border-indigo-300/80 transition-all space-y-4"
          >
            {/* Header: Title, Type Badge, Status */}
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                    {booking.item_type || "Booking"}
                  </span>
                  <h4 className="font-bold text-base text-slate-900">{title}</h4>
                </div>
                {location && (
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {location}
                  </p>
                )}
              </div>
              <div>{getStatusBadge(booking.status)}</div>
            </div>

            {/* Dates, Guests & Price */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm py-1 bg-slate-50/60 p-3 rounded-lg border border-slate-100">
              <div className="flex items-center gap-2 text-slate-700">
                <Calendar className="w-4 h-4 text-indigo-500 shrink-0" />
                <div>
                  <div className="text-[11px] text-slate-400 uppercase font-semibold">Stay Period</div>
                  <div className="text-xs font-medium">
                    {formatDate(booking.check_in)} — {formatDate(booking.check_out)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-slate-700">
                <Users className="w-4 h-4 text-indigo-500 shrink-0" />
                <div>
                  <div className="text-[11px] text-slate-400 uppercase font-semibold">Party Size</div>
                  <div className="text-xs font-medium">
                    {booking.guests ? `${booking.guests} Guests` : "1 Guest"}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-start sm:justify-end gap-2 text-slate-700">
                <div className="text-left sm:text-right">
                  <div className="text-[11px] text-slate-400 uppercase font-semibold">Total Price</div>
                  <div className="text-sm font-bold text-slate-900 font-mono">
                    {booking.total_price ? `${booking.total_price.toFixed(2)} EUR` : "—"}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            {isCancellable && (
              <div className="flex justify-end pt-1">
                <button
                  data-testid={`cancel-booking-${booking.id}`}
                  disabled={cancellingId === booking.id}
                  onClick={() => void handleCancelBooking(booking.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  {cancellingId === booking.id ? "Cancelling..." : "Cancel Reservation"}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
