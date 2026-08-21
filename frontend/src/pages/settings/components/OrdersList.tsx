import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Package, Calendar, AlertCircle, RefreshCw, ChevronRight } from "lucide-react";
import { ordersService, type OrderDetailsResponse, type OrderItem } from "@/api-services/orders.service";

export function OrdersList() {
  const [orders, setOrders] = useState<OrderDetailsResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ordersService.getMyOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      console.error("Failed to load user orders:", err);
      setError("Unable to load orders. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  const getStatusBadge = (status?: string) => {
    const s = (status || "pending").toLowerCase();
    switch (s) {
      case "completed":
      case "delivered":
      case "paid":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Completed
          </span>
        );
      case "pending":
      case "processing":
      case "in_transit":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Pending
          </span>
        );
      case "cancelled":
      case "refunded":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            {status || "Placed"}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div data-testid="orders-loading-skeleton" className="space-y-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-6 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-5 bg-slate-200 rounded w-1/4" />
              <div className="h-6 bg-slate-200 rounded-full w-20" />
            </div>
            <div className="h-4 bg-slate-200 rounded w-1/2" />
            <div className="h-10 bg-slate-200 rounded w-full" />
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
          onClick={() => void fetchOrders()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold hover:bg-rose-100/50 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="py-12 px-4 text-center rounded-2xl bg-slate-50/50 border border-dashed border-slate-200">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">No orders placed yet</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
          Explore our curated Alanya boutique selection, gourmet hampers, and exclusive vouchers.
        </p>
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium text-sm transition-all shadow-xs"
        >
          Browse Shop & Gifts
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => {
        const orderId = String(order.id || order.order_id || "ORD");
        const formattedDate = order.created_at
          ? new Date(order.created_at).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })
          : "Recently";

        const itemsList = Array.isArray(order.items)
          ? (order.items as Array<OrderItem | Record<string, unknown>>)
          : [];

        const totalPrice = order.total_price ?? order.subtotal ?? 0;
        const currency = order.currency || "EUR";

        return (
          <div
            key={orderId}
            className="p-6 bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:border-amber-300/80 transition-all space-y-4"
          >
            {/* Header: Order ID, Date, Status */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-700 font-semibold text-xs">
                  <Package className="w-4 h-4 inline mr-1" />
                  {orderId}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Calendar className="w-3.5 h-3.5" />
                  {formattedDate}
                </div>
              </div>
              <div>{getStatusBadge(order.status)}</div>
            </div>

            {/* Items Summary */}
            <div className="space-y-2">
              {itemsList.map((item, idx) => {
                const itemName =
                  (item as OrderItem).productName ||
                  (item as { name?: string }).name ||
                  `Item #${idx + 1}`;
                const quantity = (item as OrderItem).quantity || 1;
                const unitPrice = (item as OrderItem).unitPrice ?? (item as OrderItem).price;

                return (
                  <div key={idx} className="flex justify-between items-center text-sm py-1 text-slate-700">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-slate-100 text-slate-600 text-xs font-semibold flex items-center justify-center">
                        {quantity}x
                      </span>
                      <span className="font-medium">{itemName}</span>
                    </div>
                    {unitPrice !== undefined && (
                      <span className="text-slate-600 text-xs font-mono">
                        {typeof unitPrice === "number" ? `${unitPrice.toFixed(2)} ${currency}` : `${unitPrice} ${currency}`}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer: Recipient and Total */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
              <div className="text-xs text-slate-500">
                {order.recipient_name && <span>Recipient: <strong className="text-slate-700">{order.recipient_name}</strong></span>}
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 mr-2">Total Amount:</span>
                <span className="font-bold text-slate-900 font-mono text-base">
                  {typeof totalPrice === "number" ? `${totalPrice.toFixed(2)} ${currency}` : `${totalPrice} ${currency}`}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
