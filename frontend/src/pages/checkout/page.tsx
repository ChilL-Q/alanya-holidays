import { useState, useRef, useCallback, useMemo, type FormEvent } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/pages/home/components/Navbar";
import Footer from "@/pages/home/components/Footer";
import PageHeroImage from "@/components/base/PageHeroImage";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/useToast";
import { Money } from "@/domain/money.vo";
import { ordersService } from "@/api-services/orders.service";
import { checkoutSchema } from "@/lib/validation/checkout.schemas";
import { useTranslation } from "react-i18next";
import "@/i18n";

export default function CheckoutPage() {
  const { t } = useTranslation();
  const { items, clearCart, totalItems, subtotalMoney } = useCart();
  const { showToast, ToastContainer } = useToast();

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successOrderId, setSuccessOrderId] = useState<number | string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [senderName, setSenderName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [giftMessage, setGiftMessage] = useState("");
  const [companyAlt, setCompanyAlt] = useState("");

  const formRef = useRef<HTMLFormElement>(null);

  // Compute subtotal via Money VO
  const computedSubtotalMoney = useMemo(() => {
    if (subtotalMoney && !subtotalMoney.isZero()) return subtotalMoney;
    if (items.length === 0) return Money.zero("EUR");
    const currency = items[0].moneyPrice?.currency || "EUR";
    return items.reduce((sum, item) => {
      const itemMoney = item.moneyPrice || Money.parse(item.price, currency);
      return sum.add(itemMoney.multiply(item.quantity));
    }, Money.zero(currency));
  }, [items, subtotalMoney]);

  const subtotal = computedSubtotalMoney.toDatabaseDecimal();

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (items.length === 0) return;

      const form = e.currentTarget;
      const getVal = (name: string, stateFallback: string): string => {
        try {
          const el = form?.elements?.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | null;
          if (el && typeof el.value === "string" && el.value.trim() !== "") {
            return el.value.trim();
          }
          const fd = new FormData(form);
          const fdVal = fd.get(name);
          if (typeof fdVal === "string" && fdVal.trim() !== "") {
            return fdVal.trim();
          }
        } catch {
          // ignore
        }
        return stateFallback.trim();
      };

      // Honeypot check
      const honeypot = getVal("company_alt", companyAlt);
      if (honeypot !== "") {
        setSuccess(true);
        setSuccessOrderId(null);
        setCheckoutError(null);
        return;
      }

      const recName = getVal("recipient_name", recipientName);
      const recEmail = getVal("recipient_email", recipientEmail);
      const recPhone = getVal("recipient_phone", recipientPhone);
      const sndName = getVal("sender_name", senderName);
      const sndEmail = getVal("email", senderEmail);
      const gftMessage = getVal("gift_message", giftMessage);

      const validationResult = checkoutSchema.safeParse({
        recipientName: recName,
        recipientEmail: recEmail,
        recipientPhone: recPhone,
        senderName: sndName,
        senderEmail: sndEmail,
        giftMessage: gftMessage,
      });

      if (!validationResult.success) {
        const firstError = validationResult.error.issues[0]?.message || t("checkout.formInvalid");
        setCheckoutError(firstError);
        return;
      }

      setSubmitting(true);
      setCheckoutError(null);

      try {
        const orderResult = await ordersService.createOrder({
          recipientName: recName,
          recipientEmail: recEmail,
          recipientPhone: recPhone,
          contactMethod: "email",
          senderName: sndName,
          senderEmail: sndEmail,
          giftMessage: gftMessage || undefined,
          subtotal,
          currency: computedSubtotalMoney.currency,
          items: items.map((item, idx) => {
            const itemMoney = item.moneyPrice || Money.parse(item.price, computedSubtotalMoney.currency);
            return {
              productId: item.productId || item.id || `gift-item-${idx + 1}`,
              productName: item.productName,
              skuId: item.skuId,
              skuLabel: item.skuLabel,
              quantity: item.quantity,
              price: item.price,
              unitPrice: itemMoney.toDatabaseDecimal(),
              finalPrice: itemMoney.toDatabaseDecimal(),
              subtotal: itemMoney.multiply(item.quantity).toDatabaseDecimal(),
            };
          }),
        });

        if (orderResult.success) {
          setSuccess(true);
          setSuccessOrderId(orderResult.orderId);
          setCheckoutError(null);
          clearCart();
          showToast(
            t("checkout.orderSuccessToast"),
            t("checkout.orderSuccessMessage", { recipient: recName, senderEmail: sndEmail }),
            "success",
          );
        } else {
          throw new Error(t("checkout.placeOrderFailed"));
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : t("checkout.genericError");
        setCheckoutError(msg);
        showToast(t("checkout.orderFailed"), msg, "error");
      } finally {
        setSubmitting(false);
      }
    },
    [
      items,
      subtotal,
      computedSubtotalMoney,
      clearCart,
      showToast,
      recipientName,
      recipientEmail,
      recipientPhone,
      senderName,
      senderEmail,
      giftMessage,
      companyAlt,
      t,
    ],
  );

  return (
    <div className="min-h-screen bg-background-50">
      <Navbar />

      {/* Hero */}
      <section className="relative w-full h-[220px] md:h-[280px] overflow-hidden">
        <PageHeroImage
          page="checkout"
          alt={t("checkout.title")}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-foreground-950/50 via-foreground-950/25 to-foreground-950/70"></div>

        <div className="absolute bottom-0 left-0 right-0 w-full px-4 md:px-8 lg:px-12 pb-8 md:pb-10">
          <div className="flex items-center gap-2 mb-3">
            <Link
              to="/"
              className="text-white/60 hover:text-white/90 text-sm transition-colors underline underline-offset-2"
            >
              {t("checkout.home")}
            </Link>
            <i className="ri-arrow-right-s-line text-white/40 text-sm"></i>
            <Link
              to="/shop"
              className="text-white/60 hover:text-white/90 text-sm transition-colors underline underline-offset-2"
            >
              {t("checkout.shop")}
            </Link>
            <i className="ri-arrow-right-s-line text-white/40 text-sm"></i>
            <span className="text-white/90 text-sm">{t("checkout.title")}</span>
          </div>
          <h1 className="font-heading text-3xl md:text-4xl text-white mb-1">{t("checkout.title")}</h1>
          <p className="text-white/70 text-sm md:text-base">{t("checkout.description")}</p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 md:py-20 bg-background-50">
        <div className="w-full px-4 md:px-8 lg:px-12 max-w-4xl mx-auto">
          {success ? (
            /* Success State */
            <div className="bg-white rounded-2xl border border-background-200/70 p-8 md:p-12 text-center">
              <div className="w-20 h-20 flex items-center justify-center rounded-full bg-green-100 mx-auto mb-6">
                <i className="ri-check-line text-green-600 text-3xl"></i>
              </div>
              <h2 className="font-heading text-2xl md:text-3xl text-foreground-900 mb-3">{t("checkout.orderConfirmed")}</h2>
              <p className="text-foreground-500 text-sm md:text-base max-w-md mx-auto mb-2">
                {t("checkout.orderPlaced", { orderId: successOrderId })}
              </p>
              <p className="text-foreground-400 text-sm mb-8">
                {t("checkout.confirmationEmail")}
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <Link
                  to="/shop"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-background-50 rounded-full text-sm font-medium hover:bg-primary-600 transition-colors whitespace-nowrap cursor-pointer"
                >
                  <i className="ri-store-2-line"></i>
                  {t("checkout.continueShopping")}
                </Link>
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 px-6 py-3 border border-foreground-200 text-foreground-700 rounded-full text-sm font-medium hover:bg-background-100 transition-colors whitespace-nowrap cursor-pointer"
                >
                  <i className="ri-home-line"></i>
                  {t("checkout.backHome")}
                </Link>
              </div>
            </div>
          ) : items.length === 0 ? (
            <div className="bg-white rounded-2xl border border-background-200/70 p-8 md:p-12 text-center">
              <div className="w-20 h-20 flex items-center justify-center rounded-full bg-secondary-100 mx-auto mb-6">
                <i className="ri-shopping-bag-3-line text-secondary-600 text-3xl"></i>
              </div>
              <h2 className="font-heading text-2xl md:text-3xl text-foreground-900 mb-3">
                {t("checkout.emptyTitle")}
              </h2>
              <p className="text-foreground-500 text-sm md:text-base max-w-md mx-auto mb-8">
                {t("checkout.emptyDescription")}
              </p>
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-background-50 rounded-full text-sm font-medium hover:bg-primary-600 transition-colors whitespace-nowrap cursor-pointer"
              >
                <i className="ri-store-2-line"></i>
                {t("checkout.browseShop")}
              </Link>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Order Summary */}
              <div className="w-full lg:w-5/12 order-2 lg:order-1">
                <div className="bg-white rounded-2xl border border-background-200/70 p-5 md:p-6 sticky top-24">
                  <div className="flex items-center gap-2.5 mb-5">
                    <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-secondary-100">
                      <i className="ri-shopping-bag-3-line text-secondary-600 text-lg"></i>
                    </div>
                    <div>
                      <h3 className="font-heading text-base text-foreground-900">{t("checkout.orderSummary")}</h3>
                      <p className="text-xs text-foreground-500">{t("checkout.itemCount", { count: totalItems })}</p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-5 max-h-[360px] overflow-y-auto">
                    {items.map((item) => {
                      const itemMoney = item.moneyPrice || Money.parse(item.price, computedSubtotalMoney.currency);
                      const lineTotal = itemMoney.multiply(item.quantity);
                      return (
                        <div
                          key={item.productName}
                          className="flex items-start gap-3 p-3 rounded-xl bg-background-50 border border-background-100"
                        >
                          <div className="relative w-9 h-9 flex items-center justify-center rounded-lg bg-secondary-100 shrink-0 overflow-hidden">
                            <i className={`${item.icon} text-secondary-600 text-base`}></i>
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
                            <h4 className="text-sm font-medium text-foreground-900 leading-snug mb-0.5">
                              {item.productName}
                            </h4>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-foreground-500">
                                {item.quantity}x {item.price}
                              </span>
                              <span className="text-sm font-semibold text-foreground-900 whitespace-nowrap">
                                {lineTotal.format()}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="border-t border-background-200 pt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground-500">{t("checkout.subtotal")}</span>
                      <span className="text-foreground-900 font-medium">{computedSubtotalMoney.format()}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground-400">{t("checkout.shipping")}</span>
                      <span className="text-green-600 font-medium">{t("checkout.free")}</span>
                    </div>
                    <div className="border-t border-background-200 pt-2 flex items-center justify-between">
                      <span className="text-base font-semibold text-foreground-900">{t("checkout.total")}</span>
                      <span className="text-lg font-bold text-primary-600">{computedSubtotalMoney.format()}</span>
                    </div>
                  </div>

                  <Link
                    to="/shop"
                    className="mt-5 inline-flex items-center gap-1.5 text-sm text-foreground-500 hover:text-foreground-700 transition-colors"
                  >
                    <i className="ri-arrow-left-line text-xs"></i>
                    {t("checkout.backShop")}
                  </Link>
                </div>
              </div>

              {/* Checkout Form */}
              <div className="w-full lg:w-7/12 order-1 lg:order-2">
                <div className="bg-white rounded-2xl border border-background-200/70 p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-accent-100">
                      <i className="ri-gift-line text-accent-600 text-lg"></i>
                    </div>
                    <div>
                      <h3 className="font-heading text-lg text-foreground-900">{t("checkout.giftDetails")}</h3>
                      <p className="text-xs text-foreground-500">{t("checkout.giftDetailsDescription")}</p>
                    </div>
                  </div>

                  {checkoutError && (
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 mb-5">
                      <i className="ri-error-warning-line text-red-500 text-sm mt-0.5 shrink-0"></i>
                      <p className="text-sm text-red-700">{checkoutError}</p>
                    </div>
                  )}

                  <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
                    {/* Honeypot */}
                    <input
                      type="text"
                      name="company_alt"
                      value={companyAlt}
                      onChange={(e) => setCompanyAlt(e.target.value)}
                      tabIndex={-1}
                      autoComplete="off"
                      aria-hidden="true"
                      className="absolute opacity-0 pointer-events-none"
                    />

                    {/* Recipient Section */}
                    <div className="bg-accent-50/50 rounded-xl p-4 border border-accent-100">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-7 h-7 flex items-center justify-center rounded-full bg-accent-500 text-background-50 dark:text-foreground-950">
                          <i className="ri-user-heart-line text-xs"></i>
                        </div>
                        <span className="text-sm font-semibold text-foreground-800">{t("checkout.recipientQuestion")}</span>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label htmlFor="recipient-name" className="block text-sm font-medium text-foreground-700 mb-1.5">
                            {t("checkout.recipientName")} *
                          </label>
                          <input
                            id="recipient-name"
                            name="recipient_name"
                            type="text"
                            required
                            value={recipientName}
                            onChange={(e) => setRecipientName(e.target.value)}
                            placeholder={t("checkout.recipientPlaceholder")}
                            className="w-full px-4 py-2.5 rounded-xl border border-background-300 bg-white text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-100 transition-colors"
                          />
                        </div>

                        <div>
                          <label htmlFor="recipient-email" className="block text-sm font-medium text-foreground-700 mb-1.5">
                            {t("checkout.recipientEmail")} *
                          </label>
                          <input
                            id="recipient-email"
                            name="recipient_email"
                            type="email"
                            required
                            value={recipientEmail}
                            onChange={(e) => setRecipientEmail(e.target.value)}
                            placeholder={t("checkout.recipientEmailPlaceholder")}
                            className="w-full px-4 py-2.5 rounded-xl border border-background-300 bg-white text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-100 transition-colors"
                          />
                          <p className="text-xs text-foreground-400 mt-1">{t("checkout.recipientEmailHelp")}</p>
                        </div>

                        <div>
                          <label htmlFor="recipient-phone" className="block text-sm font-medium text-foreground-700 mb-1.5">
                            {t("checkout.recipientPhone")} *
                          </label>
                          <input
                            id="recipient-phone"
                            name="recipient_phone"
                            type="tel"
                            required
                            value={recipientPhone}
                            onChange={(e) => setRecipientPhone(e.target.value)}
                            placeholder={t("checkout.phonePlaceholder")}
                            className="w-full px-4 py-2.5 rounded-xl border border-background-300 bg-white text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-100 transition-colors"
                          />
                          <p className="text-xs text-foreground-400 mt-1">{t("checkout.phoneHelp")}</p>
                        </div>
                      </div>
                    </div>

                    {/* Sender Section */}
                    <div className="bg-background-50 rounded-xl p-4 border border-background-200">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-7 h-7 flex items-center justify-center rounded-full bg-primary-500 text-background-50">
                          <i className="ri-user-line text-xs"></i>
                        </div>
                        <span className="text-sm font-semibold text-foreground-800">{t("checkout.yourDetails")}</span>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label htmlFor="sender-name" className="block text-sm font-medium text-foreground-700 mb-1.5">
                            {t("checkout.senderName")} *
                          </label>
                          <input
                            id="sender-name"
                            name="sender_name"
                            type="text"
                            required
                            value={senderName}
                            onChange={(e) => setSenderName(e.target.value)}
                            placeholder={t("checkout.namePlaceholder")}
                            className="w-full px-4 py-2.5 rounded-xl border border-background-300 bg-white text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-colors"
                          />
                        </div>

                        <div>
                          <label htmlFor="sender-email" className="block text-sm font-medium text-foreground-700 mb-1.5">
                            {t("checkout.senderEmail")} *
                          </label>
                          <input
                            id="sender-email"
                            name="email"
                            type="email"
                            required
                            value={senderEmail}
                            onChange={(e) => setSenderEmail(e.target.value)}
                            placeholder={t("auth.emailPlaceholder")}
                            className="w-full px-4 py-2.5 rounded-xl border border-background-300 bg-white text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-colors"
                          />
                          <p className="text-xs text-foreground-400 mt-1">{t("checkout.emailHelp")}</p>
                        </div>
                      </div>
                    </div>

                    {/* Gift Message */}
                    <div>
                      <label htmlFor="gift-message" className="block text-sm font-medium text-foreground-700 mb-1.5">
                        {t("checkout.giftMessage")} <span className="text-foreground-400 font-normal">({t("public.optional")})</span>
                      </label>
                      <textarea
                        id="gift-message"
                        name="gift_message"
                        rows={3}
                        maxLength={300}
                        value={giftMessage}
                        onChange={(e) => setGiftMessage(e.target.value)}
                        placeholder={t("checkout.giftMessagePlaceholder")}
                        className="w-full px-4 py-2.5 rounded-xl border border-background-300 bg-white text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-colors resize-none"
                      ></textarea>
                      <p className="text-xs text-foreground-400 mt-1">{t("checkout.giftMessageHelp")}</p>
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={submitting || items.length === 0}
                      className="w-full py-3.5 bg-accent-500 text-background-50 dark:text-foreground-950 rounded-full text-base font-semibold hover:bg-accent-600 transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-background-50/40 border-t-background-50 rounded-full animate-spin"></div>
                          {t("checkout.placingOrder")}
                        </>
                      ) : (
                        <>
                          <i className="ri-gift-line"></i>
                          {t("checkout.sendGift", { total: computedSubtotalMoney.format() })}
                        </>
                      )}
                    </button>

                    <p className="text-xs text-center text-foreground-400">
                      {t("checkout.agreementPrefix")}{" "}
                      <Link to="/terms" className="underline hover:text-foreground-600">{t("checkout.terms")}</Link> {t("checkout.and")} {" "}
                      <Link to="/privacy" className="underline hover:text-foreground-600">{t("checkout.privacy")}</Link>.
                    </p>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
      <ToastContainer />
    </div>
  );
}
