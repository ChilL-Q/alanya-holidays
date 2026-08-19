import { useCart } from "@/hooks/useCart";
import { useNavigate } from "react-router-dom";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { items, removeFromCart, updateQuantity, clearCart, totalItems } = useCart();
  const navigate = useNavigate();

  const handleCheckout = () => {
    onClose();
    navigate("/checkout");
  };

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-foreground-950/40 z-40 transition-opacity cursor-pointer"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Shopping Cart"
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-background-50 z-50 transform transition-transform duration-300 ease-out flex flex-col ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-background-200/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-primary-100">
              <i className="ri-shopping-cart-2-line text-primary-600 text-lg"></i>
            </div>
            <div>
              <h3 className="font-heading text-base text-foreground-900">Your Cart</h3>
              <p className="text-xs text-foreground-500">{totalItems} {totalItems === 1 ? "item" : "items"}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close cart"
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-background-100 transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-foreground-500 text-lg"></i>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-background-100 mb-4">
                <i className="ri-shopping-cart-line text-foreground-300 text-2xl"></i>
              </div>
              <p className="text-foreground-600 text-sm font-medium mb-1">Your cart is empty</p>
              <p className="text-xs text-foreground-400 max-w-xs">
                Browse the shop and add some community goodies — memberships, merch, event kits, and more.
              </p>
              <button
                onClick={onClose}
                className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary-500 text-background-50 text-sm font-medium hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="ri-store-2-line"></i>
                Browse Shop
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.productName}
                  className="flex items-start gap-3 p-4 rounded-xl bg-background-50 border border-background-200/70"
                >
                  <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-secondary-100 shrink-0">
                    <i className={`${item.icon} text-secondary-600 text-lg`}></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-foreground-900 leading-snug mb-1">
                      {item.productName}
                    </h4>
                    <p className="text-sm font-semibold text-primary-600 mb-2">{item.price}</p>
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
          <div className="px-5 py-4 border-t border-background-200/70 space-y-3 shrink-0">
            <button
              onClick={handleCheckout}
              className="w-full py-3 bg-accent-500 text-background-50 dark:text-foreground-950 rounded-full text-sm font-semibold hover:bg-accent-600 transition-colors whitespace-nowrap cursor-pointer flex items-center justify-center gap-2"
            >
              <i className="ri-gift-line"></i>
              Proceed to Checkout
            </button>
            <button
              onClick={clearCart}
              className="w-full py-2 text-sm text-foreground-500 hover:text-foreground-700 transition-colors cursor-pointer"
            >
              Clear Cart
            </button>
          </div>
        )}
      </div>
    </>
  );
}