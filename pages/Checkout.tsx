import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';
import { ServiceType } from '../types/index';
import { Trash2, Shield, CreditCard, CheckCircle, Smartphone, Banknote, Bitcoin, Copy } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../services';
import { supabase } from '../services/supabase';

export const Checkout: React.FC = () => {
  const { items, total, removeFromCart, addToCart, clearCart } = useCart();
  const { t } = useLanguage();
  const { convertPrice, formatPrice, currency, rates } = useCurrency();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank' | 'crypto' | 'cash'>('card');
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePayment = async () => {
    if (!isAuthenticated) {
      // In a real app, open login modal here
      // For now, redirect to login or show alert
      alert("Please login to complete booking");
      return;
    }

    setIsProcessing(true);

    try {
      // Simulate payment delay? No, proceed to creation
      // await new Promise(resolve => setTimeout(resolve, 2000));

      const bookingItemsForStripe: any[] = [];

      // Create bookings in DB
      for (const item of items) {
        // Determine status based on payment method
        let bookingStatus: 'confirmed' | 'pending' = 'pending';
        let paymentStatus: 'paid' | 'pending' = 'pending';

        if (paymentMethod === 'card') {
          // For card, we set to pending until Stripe confirms via webhook
          bookingStatus = 'pending';
          paymentStatus = 'pending';
        } else if (paymentMethod === 'cash') {
          bookingStatus = 'confirmed'; // Instant confirmation for cash on arrival
          paymentStatus = 'pending';
        } else {
          // Bank / Crypto need verification
          bookingStatus = 'pending';
          paymentStatus = 'pending';
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
          total_price: item.price,
          guests: item.guests || 1
        });

        if (result && result.id && paymentMethod === 'card') {
          bookingItemsForStripe.push({
            bookingId: result.id,
            listingId: item.id,
            title: item.title,
            price: item.price,
            image: item.image
          });
        }
      }

      // If Card payment, redirect to Stripe
      if (paymentMethod === 'card' && bookingItemsForStripe.length > 0) {
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
          return; // Halt execution for redirect
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
      if (paymentMethod !== 'card') {
        setIsProcessing(false);
      }
      // If card, we leave processing true until redirect happens or error caught
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

            {/* Recommended Extras */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{t('checkout.recommended')}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { id: 'rec-1', type: ServiceType.OTHER, title: 'Airport Transfer', price: 45, currency: 'EUR', icon: '🚗', desc: 'S-Class comfort for your arrival', image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=200&h=200&fit=crop' },
                  { id: 'rec-2', type: ServiceType.OTHER, title: 'Welcome Pack', price: 30, currency: 'EUR', icon: '🧺', desc: 'Essentials waiting in your fridge', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&h=200&fit=crop' },
                ].map((rec) => {
                  const isInCart = items.some(i => i.id === rec.id);
                  return (
                    <div
                      key={rec.id}
                      className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-primary/30 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all group cursor-pointer"
                      onClick={() => {
                        if (!isInCart) {
                          // Base currency is EUR, no conversion needed for cart
                          addToCart({
                            id: rec.id,
                            type: ServiceType.OTHER,
                            title: rec.title,
                            price: rec.price,
                            image: rec.image,
                            details: 'One-time service'
                          });
                        }
                      }}
                    >
                      <div className="text-2xl bg-slate-50 dark:bg-slate-700 w-12 h-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">{rec.icon}</div>
                      <div className="flex-grow">
                        <div className="flex justify-between items-start">
                          <h4 className="font-semibold text-slate-900 dark:text-white">{rec.title}</h4>
                          <span className="font-bold text-primary dark:text-teal-400">{formatPrice(convertPrice(rec.price, 'EUR'))}</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{rec.desc}</p>
                        <button
                          disabled={isInCart}
                          className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 w-full justify-center ${isInCart
                            ? 'bg-green-100 text-green-700'
                            : 'bg-primary text-white hover:bg-primary-dark'
                            }`}
                        >
                          {isInCart ? 'Added to Cart' : 'Add to Order'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
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
              </div>

              {paymentMethod === 'card' && (
                <div className="flex items-center gap-4 p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-700/50 mb-4 animate-in fade-in slide-in-from-top-2">
                  <CreditCard className="text-slate-400" />
                  <span className="text-slate-500 dark:text-slate-400 text-sm">You will be redirected to Stripe for secure payment</span>
                </div>
              )}

              {paymentMethod === 'cash' && (
                <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-700/50 mb-4 animate-in fade-in slide-in-from-top-2">
                  <p className="text-sm text-slate-600 dark:text-slate-300 font-medium mb-1">{t('checkout.method.cash')}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t('checkout.method.cash_desc')}</p>
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
              <button
                onClick={handlePayment}
                disabled={items.length === 0 || isProcessing}
                data-testid="pay-button"
                className="w-full bg-teal-700 dark:bg-teal-600 text-white font-bold py-4 rounded-xl border-2 border-transparent hover:border-teal-500 dark:hover:border-teal-400 hover:bg-teal-800 dark:hover:bg-teal-700 shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>Processing...</>
                ) : (
                  <>{t('checkout.pay')} {convertAndFormat(total)}</>
                )}
              </button>
            </div>
          </div>

          {/* Sidebar Summary */}
          <div className="md:col-span-1 animate-fade-up delay-200 opacity-0 fill-mode-forwards">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 p-6 sticky top-24">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-6">{t('checkout.price_details')}</h3>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                  <span>{t('checkout.subtotal')}</span>
                  <span>{convertAndFormat(total)}</span>
                </div>
                <div className="flex justify-between text-sm text-teal-700 dark:text-teal-400 font-medium">
                  <span>{t('prop.guest_fee')}</span>
                  <span>{convertAndFormat(0)}</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-700">
                <span className="font-bold text-lg text-slate-900 dark:text-white">{t('prop.total')} ({currency})</span>
                <span className="font-bold text-xl text-slate-900 dark:text-white">{convertAndFormat(total)}</span>
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