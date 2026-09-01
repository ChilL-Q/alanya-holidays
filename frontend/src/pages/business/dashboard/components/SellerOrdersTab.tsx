import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import {
  ShoppingBag,
  Truck,
  CheckCircle2,
  XCircle,
  Banknote,
  Clock,
  AlertCircle,
  Loader2,
  User,
  Mail,
} from "lucide-react";
import {
  ordersService,
  type SellerOrder,
  type SellerOrderStatus,
} from "@/api-services/orders.service";
import { logger } from "@/lib/logger";

const STATUS_BADGES: Record<string, { cls: string; label: string }> = {
  pending_payment: {
    cls: "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800",
    label: "merchant.awaitingPayment",
  },
  paid: {
    cls: "bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border-sky-300 dark:border-sky-800",
    label: "merchant.paid",
  },
  shipped: {
    cls: "bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800",
    label: "merchant.shipped",
  },
  completed: {
    cls: "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800",
    label: "merchant.completed",
  },
  cancelled: {
    cls: "bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800",
    label: "merchant.cancelled",
  },
};

// Which fulfillment action the seller can take next, per current status.
const NEXT_ACTIONS: Record<string, Array<{ status: SellerOrderStatus; label: string; icon: React.ReactNode; cls: string }>> = {
  pending_payment: [
    {
      status: "paid",
      label: "merchant.markPaid",
      icon: <Banknote className="w-3.5 h-3.5" />,
      cls: "bg-sky-500 hover:bg-sky-400 text-white",
    },
    {
      status: "cancelled",
      label: "merchant.cancelOrder",
      icon: <XCircle className="w-3.5 h-3.5" />,
      cls: "bg-secondary-100 hover:bg-secondary-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-secondary-800 dark:text-slate-200",
    },
  ],
  paid: [
    {
      status: "shipped",
      label: "merchant.markShipped",
      icon: <Truck className="w-3.5 h-3.5" />,
      cls: "bg-indigo-500 hover:bg-indigo-400 text-white",
    },
    {
      status: "cancelled",
      label: "merchant.cancelOrder",
      icon: <XCircle className="w-3.5 h-3.5" />,
      cls: "bg-secondary-100 hover:bg-secondary-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-secondary-800 dark:text-slate-200",
    },
  ],
  shipped: [
    {
      status: "completed",
      label: "merchant.markCompleted",
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      cls: "bg-emerald-500 hover:bg-emerald-400 text-white",
    },
  ],
};

export const SellerOrdersTab: React.FC = () => {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingOrderId, setActingOrderId] = useState<string | number | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setOrders(await ordersService.getSellerOrders());
    } catch (err) {
      logger.error("Failed to load seller orders:", err);
      setError(i18n.t("merchant.ordersLoadFailed"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const handleStatusChange = async (orderId: SellerOrder["id"], status: SellerOrderStatus) => {
    setActingOrderId(orderId);
    try {
      const result = await ordersService.updateSellerOrderStatus(orderId, status);
      if (result.success) {
        setOrders((prev) =>
          prev.map((order) => (order.id === orderId ? { ...order, status } : order))
        );
      } else {
        setError(result.message || t("merchant.orderUpdateFailed"));
      }
    } catch (err) {
      logger.error("Failed to update order status:", err);
      setError(t("merchant.orderUpdateFailed"));
    } finally {
      setActingOrderId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-secondary-200 dark:border-slate-800 animate-pulse space-y-3"
          >
            <div className="h-5 bg-secondary-200 dark:bg-slate-800 rounded-md w-1/3" />
            <div className="h-4 bg-secondary-100 dark:bg-slate-800/60 rounded-md w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (orders.length === 0 && !error) {
    return (
      <div className="p-8 sm:p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-secondary-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <div className="max-w-md mx-auto space-y-1.5">
          <h3 className="text-lg font-bold text-secondary-900 dark:text-white">{t("merchant.noOrders")}</h3>
          <p className="text-xs sm:text-sm text-secondary-500 dark:text-slate-400">
            When buyers purchase your products, their orders will appear here for you to fulfill.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-sm text-rose-800 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-4">
        {orders.map((order) => {
          const statusKey = order.status?.toLowerCase() || "pending_payment";
          const badge =
            STATUS_BADGES[statusKey] ||
            STATUS_BADGES.pending_payment;
          const actions = NEXT_ACTIONS[statusKey] || [];
          const items = order.items || [];
          const total = items.reduce((sum, item) => sum + Number(item.subtotal ?? 0), 0);
          const recipientName =
            typeof order.recipient?.name === "string" ? order.recipient.name : null;
          const recipientEmail =
            typeof order.recipient?.email === "string" ? order.recipient.email : null;
          const isActing = actingOrderId === order.id;

          return (
            <div
              key={String(order.id)}
              className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-secondary-200 dark:border-slate-800 shadow-sm space-y-4"
            >
              {/* Order header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-secondary-900 dark:text-white">
                    Order #{order.id}
                  </h3>
                  <p className="text-xs text-secondary-500 dark:text-slate-400">
                    {order.created_at &&
                      new Date(order.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    {" · "}
                    {items.length} item{items.length === 1 ? "" : "s"}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border w-fit ${badge.cls}`}
                >
                  {statusKey === "pending_payment" ? (
                    <Clock className="w-3.5 h-3.5" />
                  ) : statusKey === "completed" ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : statusKey === "cancelled" ? (
                    <XCircle className="w-3.5 h-3.5" />
                  ) : (
                    <Truck className="w-3.5 h-3.5" />
                  )}
                  {t(badge.label)}
                </span>
              </div>

              {/* Line items */}
              <div className="rounded-xl border border-secondary-100 dark:border-slate-800 divide-y divide-secondary-100 dark:divide-slate-800">
                {items.map((item, idx) => (
                  <div
                    key={String(item.id ?? idx)}
                    className="flex items-center justify-between gap-3 px-4 py-2.5 text-xs sm:text-sm"
                  >
                    <span className="text-secondary-700 dark:text-slate-300 truncate">
                      {item.product_name || t("merchant.productFallback")}{" "}
                      {item.quantity && item.quantity > 1 && (
                        <span className="text-secondary-400">× {item.quantity}</span>
                      )}
                      {item.sku_label && (
                        <span className="text-secondary-400"> · {item.sku_label}</span>
                      )}
                    </span>
                    <span className="font-semibold text-secondary-900 dark:text-white shrink-0">
                      €{Number(item.subtotal ?? 0).toFixed(2)}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between gap-3 px-4 py-2.5 text-xs sm:text-sm bg-secondary-50/60 dark:bg-slate-950/40 rounded-b-xl">
                  <span className="font-semibold text-secondary-700 dark:text-slate-300">{t("merchant.total")}</span>
                  <span className="font-bold text-secondary-900 dark:text-white">
                    {order.currency || "EUR"} {total.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Recipient */}
              {(recipientName || recipientEmail) && (
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-secondary-600 dark:text-slate-400">
                  {recipientName && (
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-secondary-400" />
                      {recipientName}
                    </span>
                  )}
                  {recipientEmail && (
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-secondary-400" />
                      {recipientEmail}
                    </span>
                  )}
                </div>
              )}

              {/* Fulfillment actions */}
              {actions.length > 0 && (
                <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-secondary-100 dark:border-slate-800">
                  {actions.map((action) => (
                    <button
                      key={action.status}
                      type="button"
                      disabled={isActing}
                      onClick={() => handleStatusChange(order.id, action.status)}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer ${action.cls}`}
                    >
                      {isActing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : action.icon}
                      {t(action.label)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
