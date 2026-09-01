import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useCart } from "@/hooks/useCart";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "@/i18n";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { t } = useTranslation();
  const { items, removeFromCart, updateQuantity, clearCart, totalItems, subtotalMoney } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  // Auto-close on route change (e.g. going to /checkout)
  useEffect(() => {
    if (open) {
      onClose();
    }
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Body scroll lock & Escape key handling
  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  const handleCheckout = () => {
    onClose();
    navigate("/checkout");
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-foreground-950/50 backdrop-blur-xs z-[99] transition-opacity cursor-pointer animate-in fade-in duration-200"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
        data-floating-ui-obstruction={open ? "true" : undefined}
        aria-label={t("public.shoppingCart")}
        className={`fixed inset-y-0 right-0 h-dvh w-full max-w-md bg-background-50 z-[100] shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${
          open ? "translate-x-0" : "translate-x-full pointer-events-none"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-background-200/70 shrink-0 bg-background-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-950/60">
              <i className="ri-shopping-cart-2-line text-primary-600 dark:text-primary-400 text-lg"></i>
            </div>
            <div>
              <h3 className="font-heading text-base text-foreground-900">{t("public.cart")}</h3>
              <p className="text-xs text-foreground-500">
                {totalItems} {totalItems === 1 ? t("public.item") : t("public.items")}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={t("public.closeCart")}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-background-100 transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-foreground-500 text-lg"></i>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 overscroll-contain">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-background-100 mb-4">
                <i className="ri-shopping-cart-line text-foreground-300 text-2xl"></i>
              </div>
              <p className="text-foreground-600 text-sm font-medium mb-1">{t("public.cartEmpty")}</p>
              <p className="text-xs text-foreground-400 max-w-xs">
                {t("public.cartEmptyDescription")}
              </p>
              <button
                onClick={() => {
                  onClose();
                  navigate("/shop");
                }}
                className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary-500 text-background-50 text-sm font-medium hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="ri-store-2-line"></i>
                {t("public.browseShop")}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.productName}
                  className="flex items-start gap-3 p-4 rounded-xl bg-background-50 border border-background-200/70 shadow-xs"
                >
                  <div className="relative w-10 h-10 flex items-center justify-center rounded-lg bg-secondary-100 dark:bg-secondary-950/50 shrink-0 overflow-hidden">
                    <i className={`${item.icon} text-secondary-600 dark:text-secondary-400 text-lg`}></i>
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.productName}
                        className="absolute inset-0 w-full h-full object-cover bg-background-100"
                        onError={(event) => {
                          event.currentTarget.hidden = true;
                        }}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-foreground-900 leading-snug mb-1">
                      {item.productName}
                    </h4>
                    <p className="text-sm font-semibold text-primary-600 dark:text-primary-400 mb-2">
                      {item.price}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.productName, item.quantity - 1)}
                        aria-label={`Decrease quantity of ${item.productName}`}
                        className="w-7 h-7 flex items-center justify-center rounded-full border border-background-300 text-foreground-500 hover:bg-background-100 transition-colors cursor-pointer"
                      >
                        <i className="ri-subtract-line text-xs"></i>
                      </button>
                      <span className="text-sm font-medium text-foreground-900 w-6 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.productName, item.quantity + 1)}
                        aria-label={`Increase quantity of ${item.productName}`}
                        className="w-7 h-7 flex items-center justify-center rounded-full border border-background-300 text-foreground-500 hover:bg-background-100 transition-colors cursor-pointer"
                      >
                        <i className="ri-add-line text-xs"></i>
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.productName)}
                    aria-label={`Remove ${item.productName} from cart`}
                    className="w-7 h-7 flex items-center justify-center rounded-full text-foreground-300 hover:text-foreground-600 hover:bg-accent-100 transition-colors cursor-pointer shrink-0 mt-0.5"
                  >
                    <i className="ri-delete-bin-line text-sm"></i>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-5 py-4 border-t border-background-200/70 space-y-3 shrink-0 bg-background-50">
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground-500">{t("public.subtotal")}</span>
              <span className="text-foreground-900 font-bold">
                {subtotalMoney ? subtotalMoney.format() : ""}
              </span>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full py-3 bg-accent-500 text-background-50 dark:text-foreground-950 rounded-full text-sm font-semibold hover:bg-accent-600 transition-colors whitespace-nowrap cursor-pointer flex items-center justify-center gap-2 shadow-xs"
            >
              <i className="ri-gift-line"></i>
              {t("public.proceedCheckout")}
            </button>
            <button
              onClick={clearCart}
              className="w-full py-2 text-sm text-foreground-500 hover:text-foreground-700 transition-colors cursor-pointer"
            >
              {t("public.clearCart")}
            </button>
          </div>
        )}
      </div>
    </>,
    document.body
  );
}
