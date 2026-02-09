import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';
import { ServiceType } from '../types/index';
import { Trash2, Shield, CreditCard, CheckCircle, Smartphone, Banknote, Bitcoin, Copy } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../api-services';
import { supabase } from '../api-services/supabase';

export const Checkout: React.FC = () => {
  const { items, total, removeFromCart, addToCart, clearCart } = useCart();
  const { t } = useLanguage();
  const { convertPrice, formatPrice, currency, rates } = useCurrency();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank' | 'crypto' | 'cash' | 'swift'>('card');
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePayment = async () => {
    if (!isAuthenticated) {
      alert("Please login to complete booking");
      return;
    }

    setIsProcessing(true);

    try {
      const bookingItemsForStripe: any[] = [];
      const wpItem = items.find(i => i.id === 'rec-2');
      let wpHandled = false;

      // Filter out the Welcome Pack from main iteration to avoid creating a standalone booking for it
      const bookingItems = items.filter(i => i.id !== 'rec-2');

      // Create bookings in DB
      for (const item of bookingItems) {
        let bookingStatus: 'confirmed' | 'pending' = 'pending';
        let paymentStatus: 'paid' | 'pending' = 'pending';

        // Payment status logic
        if (paymentMethod === 'card' || paymentMethod === 'cash') {
          // Deposit or Card: Pending until webhook
          bookingStatus = 'pending';
          paymentStatus = 'pending';
        }

        // Merge Welcome Pack into the FIRST property booking found
        let extraMessage = '';
        let bookingTotalPrice = item.price;

        if (!wpHandled && wpItem && (item.type === 'RENTAL' || item.type === 'property')) {
          extraMessage = `\n\n[EXTRAS]: Includes Welcome Pack (Essentials) - €${wpItem.price}. Please prepare fridge.`;
          // Note: We don't increase bookingTotalPrice here for the DB record if we rely on Stripe to sum it up,
          // BUT for the database to reflect the total value of the "Booking + Extras", we SHOULD add it.
          // However, separating it is cleaner for reporting. 
          // Let's keep the booking price as the property price, but rely on the message for the host.
          // OR: Add to price so the 'Total' in dashboard matches.
          bookingTotalPrice += wpItem.price;
          wpHandled = true;
        }

        const result = await db.createBooking({
          user_id: user!.id,
          item_id: item.id,
          type: (item.type === 'RENTAL' || item.type === 'property') ? 'property' : 'service',
          status: bookingStatus,
          payment_method: paymentMethod,
          payment_status: paymentStatus,
          check_in: item.startDate || item.date || new Date().toISOString(),
          check_out: item.endDate || item.date || new Date(Date.now() + 86400000).toISOString(),
          total_price: bookingTotalPrice,
          guests: item.guests || 1,
          message: extraMessage // Pass the extra info
        });

        if (result && result.id && (paymentMethod === 'card' || paymentMethod === 'cash')) {
          const isDeposit = paymentMethod === 'cash';

          // Add Main Item to Stripe
          bookingItemsForStripe.push({
            bookingId: result.id,
            listingId: item.id,
            title: isDeposit ? `Deposit (20%): ${item.title}` : item.title,
            price: isDeposit ? item.price * 0.2 : item.price,
            image: item.image
          });

          // If we handled WP here, add it as a line item to Stripe too
          if (wpHandled && wpItem && (item.type === 'RENTAL' || item.type === 'property')) {
            // For Welcome Pack, we likely want full payment even if Deposit? 
            // Let's assume Welcome Pack is 100% due or follows the same rule. 
            // Usually extras are paid in full or part of deposit. Let's keep it simple: It's part of the total.
            bookingItemsForStripe.push({
              bookingId: result.id, // Link to same booking
              listingId: wpItem.id,
              title: isDeposit ? `Deposit (20%): ${wpItem.title}` : wpItem.title,
              price: isDeposit ? wpItem.price * 0.2 : wpItem.price,
              image: wpItem.image
            });
          }
        }
      }

      // If Card or Cash payment, redirect to Stripe
      if ((paymentMethod === 'card' || paymentMethod === 'cash') && bookingItemsForStripe.length > 0) {
        const { data, error } = await supabase.functions.invoke('create-checkout-session', {
          body: {
            items: bookingItemsForStripe,
            userId: user!.id,
            email: user!.email,
            origin: window.location.origin
          }
        });

        if (error) throw error;
        if (data?.url) {
          window.location.href = data.url;
          return;
        }
      }

      clearCart();
      setShowSuccess(true);
      setTimeout(() => {
        navigate('/profile');
      }, 3000);

    } catch (error: any) {
      console.error("Booking error:", error);
      alert(error.message || "Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl text-center max-w-md animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{t('checkout.success_title') || 'Booking Confirmed!'}</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">{t('checkout.success_desc') || 'Your adventure in Alanya awaits. Redirecting to your dashboard...'}</p>
          <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
            <div className="bg-green-500 h-full w-full animate-[progress_3s_linear]" />
          </div>
        </div>
      </div>
    );
  }

  const convertAndFormat = (amount: number, fromCurrency: 'USD' | 'EUR' = 'EUR') => {
    return formatPrice(convertPrice(amount, fromCurrency));
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-12 pb-24">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-white mb-8">{t('checkout.title')}</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Order Details */}
          <div className="md:col-span-2 space-y-6 animate-fade-up">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{t('checkout.basket')}</h2>

              {items.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-slate-500 dark:text-slate-400 mb-4">{t('checkout.empty')}</p>
                  <Link to="/" className="text-teal-700 dark:text-teal-400 font-medium underline">{t('checkout.start')}</Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start border-b border-slate-100 dark:border-slate-700 pb-6 last:border-0 last:pb-0">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${item.type === 'RENTAL' || item.type === 'property'
                            ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-400'
                            : 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400'
                            }`}>
                            {item.type === 'property' ? 'STAY' : item.type}
                          </span>
                        </div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">{item.title}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{item.details}</p>
                        {(item.startDate || item.date) && (
                          <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                            {item.startDate ? (
                              // Simple formatter for ISO strings to YYYY-MM-DD or similar
                              `${new Date(item.startDate).toLocaleDateString()} - ${new Date(item.endDate!).toLocaleDateString()}`
                            ) : item.date}
                            {item.guests ? ` • ${item.guests} Guests` : ''}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="font-medium text-slate-900 dark:text-white">{convertAndFormat(item.price, 'EUR')}</span>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Welcome Pack Special Offer */}
            {/* Welcome Pack Special Offer */}
            <div className="bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 rounded-xl shadow-sm border border-teal-100 dark:border-teal-800/50 p-4 flex flex-col sm:flex-row items-center gap-4">
              <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center text-2xl shadow-sm shrink-0">
                🧺
              </div>
              <div className="flex-grow text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{t('checkout.welcome_pack_title') || 'Arrive in Comfort'}</h3>
                  <span className="font-bold text-teal-700 dark:text-teal-400 text-sm">€30</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 max-w-lg leading-relaxed">
                  {t('checkout.welcome_pack_desc') || 'Don\'t worry about shopping immediately. We\'ll stock your fridge with essentials: bread, water, milk, eggs, cheese, and seasonal fruit.'}
                </p>
              </div>
              <button
                onClick={() => {
                  const wpId = 'rec-2';
                  const isInCart = items.some(i => i.id === wpId);
                  if (!isInCart) {
                    addToCart({
                      id: wpId,
                      type: ServiceType.OTHER,
                      title: 'Welcome Pack',
                      price: 30,
                      image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&h=200&fit=crop',
                      details: 'Fridge essentials'
                    });
                  }
                }}
                disabled={items.some(i => i.id === 'rec-2')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm whitespace-nowrap ${items.some(i => i.id === 'rec-2')
                  ? 'bg-green-100 text-green-700 cursor-default'
                  : 'bg-teal-600 hover:bg-teal-700 text-white hover:shadow-md active:scale-95'}`}
              >
                {items.some(i => i.id === 'rec-2') ? (t('checkout.added') || 'Added') : (t('checkout.add_welcome') || 'Add')}
              </button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{t('checkout.payment')}</h2>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition ${paymentMethod === 'card'
                    ? 'border-teal-600 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                >
                  <CreditCard className={paymentMethod === 'card' ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 dark:text-slate-400'} />
                  <span className={`text-sm font-bold ${paymentMethod === 'card' ? 'text-teal-700 dark:text-teal-400' : 'text-slate-600 dark:text-slate-300'}`}>{t('checkout.method.card')}</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition ${paymentMethod === 'cash'
                    ? 'border-teal-600 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                >
                  <Banknote className={paymentMethod === 'cash' ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 dark:text-slate-400'} />
                  <span className={`text-sm font-bold ${paymentMethod === 'cash' ? 'text-teal-700 dark:text-teal-400' : 'text-slate-600 dark:text-slate-300'}`}>{t('checkout.method.cash')}</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('bank')}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition ${paymentMethod === 'bank'
                    ? 'border-teal-600 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                >
                  <Shield className={paymentMethod === 'bank' ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 dark:text-slate-400'} />
                  <span className={`text-sm font-bold ${paymentMethod === 'bank' ? 'text-teal-700 dark:text-teal-400' : 'text-slate-600 dark:text-slate-300'}`}>{t('checkout.method.bank')}</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('crypto')}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition ${paymentMethod === 'crypto'
                    ? 'border-teal-600 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                >
                  <Bitcoin className={paymentMethod === 'crypto' ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 dark:text-slate-400'} />
                  <span className={`text-sm font-bold ${paymentMethod === 'crypto' ? 'text-teal-700 dark:text-teal-400' : 'text-slate-600 dark:text-slate-300'}`}>{t('checkout.method.crypto')}</span>
                </button>
                <div className="col-span-2 sm:col-span-1">
                  <button
                    onClick={() => setPaymentMethod('swift')}
                    className={`w-full p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition ${paymentMethod === 'swift'
                      ? 'border-teal-600 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                  >
                    <Banknote className={paymentMethod === 'swift' ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 dark:text-slate-400'} />
                    <span className={`text-sm font-bold ${paymentMethod === 'swift' ? 'text-teal-700 dark:text-teal-400' : 'text-slate-600 dark:text-slate-300'}`}>{t('checkout.method.swift')}</span>
                  </button>
                </div>
              </div>

              {paymentMethod === 'card' && (
                <div className="flex items-center gap-4 p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-700/50 mb-4 animate-in fade-in slide-in-from-top-2">
                  <CreditCard className="text-slate-400" />
                  <span className="text-slate-500 dark:text-slate-400 text-sm">You will be redirected to Stripe for secure payment</span>
                </div>
              )}

              {paymentMethod === 'cash' && (
                <div className="p-4 border border-orange-200 dark:border-orange-900/50 rounded-lg bg-orange-50 dark:bg-orange-900/20 mb-4 animate-in fade-in slide-in-from-top-2">
                  <p className="text-sm text-orange-800 dark:text-orange-300 font-medium mb-1">20% Non-refundable Deposit Required</p>
                  <p className="text-xs text-orange-600 dark:text-orange-400">
                    To secure your reservation with Cash on Arrival, we require a 20% deposit now via secure online payment. The remaining balance will be paid in cash upon arrival.
                  </p>
                </div>
              )}

              {paymentMethod === 'bank' && (
                <div className="p-4 border border-teal-100 dark:border-teal-900/50 rounded-lg bg-teal-50 dark:bg-teal-900/20 mb-4 animate-in fade-in slide-in-from-top-2">
                  <p className="text-sm text-teal-800 dark:text-teal-300 font-medium mb-2">{t('checkout.method.bank_desc')}</p>
                  <div className="flex items-center justify-between text-xs bg-white dark:bg-slate-900 p-3 rounded border border-teal-100 dark:border-teal-900">
                    <code className="text-slate-600 dark:text-slate-300 font-mono">TR00 0000 0000 0000 0000</code>
                    <button onClick={() => copyToClipboard('TR00 0000 0000 0000 0000')} className="text-teal-600 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 flex items-center gap-1">
                      <Copy size={14} /> {copied ? 'Copied' : t('checkout.copy')}
                    </button>
                  </div>
                </div>
              )}

              {paymentMethod === 'crypto' && (
                <div className="p-4 border border-indigo-100 dark:border-indigo-900/50 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 mb-4 animate-in fade-in slide-in-from-top-2">
                  <p className="text-sm text-indigo-800 dark:text-indigo-300 font-medium mb-2">{t('checkout.method.crypto_desc')}</p>
                  <div className="flex items-center justify-between text-xs bg-white dark:bg-slate-900 p-3 rounded border border-indigo-100 dark:border-indigo-900">
                    <code className="text-slate-600 dark:text-slate-300 font-mono truncate max-w-[200px]">TTrsS...</code>
                    <button onClick={() => copyToClipboard('TTrsSkD...')} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-1">
                      <Copy size={14} /> {copied ? 'Copied' : t('checkout.copy')}
                    </button>
                  </div>
                </div>
              )}
              {paymentMethod === 'swift' && (
                <div className="p-4 border border-blue-100 dark:border-blue-900/50 rounded-lg bg-blue-50 dark:bg-blue-900/20 mb-4 animate-in fade-in slide-in-from-top-2">
                  <p className="text-sm text-blue-800 dark:text-blue-300 font-medium mb-2">{t('checkout.method.swift_desc')}</p>
                  <div className="space-y-2 text-xs bg-white dark:bg-slate-900 p-3 rounded border border-blue-100 dark:border-blue-900">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">{t('checkout.bank_name')}</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Garanti Bank</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">{t('checkout.swift_bic')}</span>
                      <div className="flex items-center gap-2">
                        <code className="font-mono text-slate-700 dark:text-slate-300">GATRTRI2</code>
                        <button onClick={() => copyToClipboard('GATRTRI2')} className="text-blue-600 hover:text-blue-700"><Copy size={12} /></button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">{t('checkout.iban')}</span>
                      <div className="flex items-center gap-2">
                        <code className="font-mono text-slate-700 dark:text-slate-300">TR00 1234 5678 9000 0000 0000 00</code>
                        <button onClick={() => copyToClipboard('TR00 1234 5678 9000 0000 0000 00')} className="text-blue-600 hover:text-blue-700"><Copy size={12} /></button>
                      </div>
                    </div>
                    <p className="pt-2 text-[10px] text-slate-400 italic">{t('checkout.swift_ref')}</p>
                  </div>
                </div>
              )}
              <button
                onClick={handlePayment}
                disabled={items.length === 0 || isProcessing}
                data-testid="pay-button"
                className="w-full bg-teal-700 dark:bg-teal-600 text-white font-bold py-4 rounded-xl border-2 border-transparent hover:border-teal-500 dark:hover:border-teal-400 hover:bg-teal-800 dark:hover:bg-teal-700 shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>Processing...</>
                ) : (
                  <>
                    {paymentMethod === 'cash' ? `Pay Deposit ${convertAndFormat(total * 0.2)}` : `${t('checkout.pay')} ${convertAndFormat(total)}`}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Sidebar Summary */}
          <div className="md:col-span-1 animate-fade-up delay-200 opacity-0 fill-mode-forwards">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 p-6 sticky top-24">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-6">{t('checkout.price_details')}</h3>

              <div className="space-y-3 mb-6">
                {items.map((item, idx) => {
                  const itemCleaningFee = item.cleaningFee || 0;
                  const itemTotal = item.price;
                  // If it's a property with a cleaning fee, the rental part is total - cleaning
                  const rentalPrice = item.type === 'property' || item.type === 'RENTAL' ? (itemTotal - itemCleaningFee) : itemTotal;

                  return (
                    <div key={idx} className="flex flex-col gap-2 border-b border-slate-100 dark:border-slate-700 pb-3 last:border-0 last:pb-0">
                      {/* Base Item Price / Rental Price */}
                      <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                        <span>
                          {item.type === 'property' || item.type === 'RENTAL'
                            ? `${convertAndFormat((item.pricePerNight || 0), 'EUR')} x ${item.nights || 0} ${t('featured.night') || 'nights'}`
                            : item.title
                          }
                        </span>
                        <span>{convertAndFormat(rentalPrice)}</span>
                      </div>

                      {/* Cleaning Fee Line for this item */}
                      {(item.type === 'property' || item.type === 'RENTAL') && itemCleaningFee > 0 && (
                        <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                          <div className="flex flex-col">
                            <span>{t('checkout.cleaning_fee') || 'Cleaning Fee'}</span>
                            <span className="text-[10px] text-slate-400">({t('checkout.set_by_host') || 'set by host'})</span>
                          </div>
                          <span>{convertAndFormat(itemCleaningFee)}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-700">
                <span className="font-bold text-lg text-slate-900 dark:text-white">{t('prop.total')} ({currency})</span>
                <span className="font-bold text-xl text-slate-900 dark:text-white">
                  {convertAndFormat(total)}
                </span>
              </div>

              <div className="mt-6 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg flex gap-3 items-start">
                <Shield className="text-teal-700 dark:text-teal-400 shrink-0" size={18} />
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight">
                  <span className="font-bold text-slate-700 dark:text-slate-300">{t('checkout.free_cancel')}</span> {t('checkout.free_cancel_desc')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};