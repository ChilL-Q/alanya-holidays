import React, { type FormEvent, type RefObject } from "react";
import { Link } from "react-router-dom";
import type { ProductDetail, ProductSku } from "./types";
import { COUNTRY_CODES } from "./types";

interface CheckoutFormProps {
  product: ProductDetail;
  selectedSku: ProductSku | null;
  quantity: number;
  currentPrice: number;
  formatPrice: (price: number) => string;
  countryCode: string;
  onSetCountryCode: (code: string) => void;
  preferredContact: string;
  onSetPreferredContact: (method: string) => void;
  checkoutSubmitting: boolean;
  checkoutSuccess: boolean;
  checkoutError: string | null;
  onResetCheckout: () => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  formRef: RefObject<HTMLFormElement | null>;
  currentStock: number;
}

export function CheckoutForm({
  product,
  selectedSku,
  quantity,
  currentPrice,
  formatPrice,
  countryCode,
  onSetCountryCode,
  preferredContact,
  onSetPreferredContact,
  checkoutSubmitting,
  checkoutSuccess,
  checkoutError,
  onResetCheckout,
  onSubmit,
  formRef,
  currentStock,
}: CheckoutFormProps) {
  return (
    <section className="w-full px-4 md:px-8 lg:px-12 pb-16 md:pb-24 bg-background-100">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-background-200/70 p-6 md:p-8">
          {checkoutSuccess ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 flex items-center justify-center rounded-full bg-green-100 mx-auto mb-5">
                <i className="ri-check-line text-green-600 text-2xl"></i>
              </div>
              <h3 className="font-heading text-xl text-foreground-900 mb-2">Order confirmed!</h3>
              <p className="text-foreground-500 text-sm mb-2">
                Thank you for your order —{" "}
                <strong>
                  {product.name}
                  {selectedSku ? ` (${selectedSku.label})` : ""}
                </strong>{" "}
                (x{quantity}) for <strong>{formatPrice(currentPrice * quantity)}</strong>.
              </p>
              <p className="text-foreground-600 text-sm font-medium">
                {preferredContact === "whatsapp"
                  ? "We'll WhatsApp you shortly with confirmation and delivery details."
                  : preferredContact === "phone"
                    ? "We'll give you a call shortly with confirmation and delivery details."
                    : "We'll email you shortly with confirmation and delivery details."}
              </p>
              <div className="flex items-center justify-center gap-3 mt-6 flex-wrap">
                <button
                  onClick={onResetCheckout}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-background-200 text-foreground-700 rounded-full text-sm font-medium hover:bg-background-300 transition-colors whitespace-nowrap cursor-pointer"
                >
                  <i className="ri-arrow-left-line"></i>
                  Back to Product
                </button>
                <Link
                  to="/shop"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 text-background-50 rounded-full text-sm font-medium hover:bg-primary-600 transition-colors whitespace-nowrap cursor-pointer"
                >
                  <i className="ri-store-2-line"></i>
                  Continue Shopping
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-accent-100">
                  <i className="ri-shopping-bag-3-line text-accent-600 text-lg"></i>
                </div>
                <div>
                  <h3 className="font-heading text-lg text-foreground-900">Checkout</h3>
                  <p className="text-xs text-foreground-500">
                    {product.name}
                    {selectedSku ? ` (${selectedSku.label})` : ""} — {quantity}x{" "}
                    {formatPrice(currentPrice)} = {formatPrice(currentPrice * quantity)}
                  </p>
                </div>
              </div>

              {checkoutError && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 mb-5">
                  <i className="ri-error-warning-line text-red-500 text-sm mt-0.5 shrink-0"></i>
                  <p className="text-sm text-red-700">{checkoutError}</p>
                </div>
              )}

              <form ref={formRef} onSubmit={onSubmit} className="space-y-5">
                {/* Honeypot */}
                <input
                  type="text"
                  name="website_alt"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  readOnly
                  className="absolute opacity-0 pointer-events-none"
                />

                {/* Full Name */}
                <div>
                  <label
                    htmlFor="checkout-name"
                    className="block text-sm font-medium text-foreground-700 mb-1.5"
                  >
                    Full Name *
                  </label>
                  <input
                    id="checkout-name"
                    name="name"
                    type="text"
                    required
                    placeholder="Your full name"
                    className="w-full px-4 py-2.5 rounded-xl border border-background-300 bg-white text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-colors"
                  />
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="checkout-email"
                    className="block text-sm font-medium text-foreground-700 mb-1.5"
                  >
                    Email *
                  </label>
                  <input
                    id="checkout-email"
                    name="email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-background-300 bg-white text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-colors"
                  />
                </div>

                {/* Phone with Country Code */}
                <div>
                  <label
                    htmlFor="checkout-phone"
                    className="block text-sm font-medium text-foreground-700 mb-1.5"
                  >
                    Phone
                  </label>
                  <div className="flex gap-2">
                    <div className="relative">
                      <select
                        value={countryCode}
                        onChange={(e) => onSetCountryCode(e.target.value)}
                        className="appearance-none pl-3 pr-8 py-2.5 rounded-xl border border-background-300 bg-white text-sm text-foreground-900 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-colors cursor-pointer"
                      >
                        {COUNTRY_CODES.map((cc) => (
                          <option key={cc.code} value={cc.code}>
                            {cc.flag} {cc.code}
                          </option>
                        ))}
                      </select>
                      <i className="ri-arrow-down-s-line absolute right-2 top-1/2 -translate-y-1/2 text-foreground-400 text-xs pointer-events-none"></i>
                    </div>
                    <input
                      id="checkout-phone"
                      name="phone"
                      type="tel"
                      placeholder="Phone number"
                      className="flex-1 px-4 py-2.5 rounded-xl border border-background-300 bg-white text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-colors"
                    />
                  </div>
                </div>

                {/* Preferred Contact Method */}
                <div>
                  <label className="block text-sm font-medium text-foreground-700 mb-2">
                    Preferred contact method
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: "whatsapp", icon: "ri-whatsapp-line", label: "WhatsApp" },
                      { value: "phone", icon: "ri-phone-line", label: "Phone Call" },
                      { value: "email", icon: "ri-mail-line", label: "Email" },
                    ].map((opt) => (
                      <label
                        key={opt.value}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                          preferredContact === opt.value
                            ? "bg-primary-500 text-background-50 border-primary-500"
                            : "bg-white text-foreground-600 border-background-300 hover:border-foreground-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="contact_method"
                          value={opt.value}
                          checked={preferredContact === opt.value}
                          onChange={() => onSetPreferredContact(opt.value)}
                          className="sr-only"
                        />
                        <i className={`${opt.icon} text-sm`}></i>
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Order Notes */}
                <div>
                  <label
                    htmlFor="checkout-notes"
                    className="block text-sm font-medium text-foreground-700 mb-1.5"
                  >
                    Order Notes{" "}
                    <span className="text-foreground-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    id="checkout-notes"
                    name="notes"
                    rows={3}
                    maxLength={500}
                    placeholder="Any special requests or delivery instructions..."
                    className="w-full px-4 py-2.5 rounded-xl border border-background-300 bg-white text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-colors resize-none"
                  ></textarea>
                  <p className="text-xs text-foreground-400 mt-1">Max 500 characters</p>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={checkoutSubmitting || currentStock <= 0}
                  className="w-full py-3 bg-accent-500 text-background-50 dark:text-foreground-950 rounded-full text-sm font-semibold hover:bg-accent-600 transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {checkoutSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-background-50/40 border-t-background-50 rounded-full animate-spin"></div>
                      Placing order...
                    </>
                  ) : (
                    <>
                      <i className="ri-check-double-line"></i>
                      Place Order — {formatPrice(currentPrice * quantity)}
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
