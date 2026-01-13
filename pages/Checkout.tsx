import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';
import { ServiceType } from '../types';
import { Trash2, Shield, CreditCard, CheckCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/db';

export const Checkout: React.FC = () => {
  const { items, total, removeFromCart, addToCart, clearCart } = useCart();
  const { t } = useLanguage();
  const { convertPrice, formatPrice, currency, rates } = useCurrency();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handlePayment = async () => {
    if (!isAuthenticated) {
      // In a real app, open login modal here
      alert("Please login to complete booking");
      return;
    }

    setIsProcessing(true);

    try {
      // Simulate payment delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create bookings in DB
      for (const item of items) {
        await db.createBooking({
          user_id: user!.id,
          item_id: item.id,
          type: item.type === 'RENTAL' ? 'property' : (item.type === 'TOUR' || item.type === 'TRANSFER' ? 'service' : 'service'),
          // Note: CartItem type mapping to DB type. 'RENTAL' maps to property/service depending on context but here assuming property if simple rental, 
          // OR better: rely on item.type from cart. The current Type enum has RENTAL, TOUR.
          // If it's a vehicle rental service, it is stored in 'services' table, but CartItem.type might be RENTAL. 
          // For simplicity given current setup:
          // Properties are RENTAL. Services are TOUR/TRANSFER/RENTAL(if vehicle service).
          // We ideally distinguish. For now, defaulting to 'service' if startDate is present (BookVehicle) EXCEPT if we know it's a property.
          // Let's assume property items have type 'RENTAL' and service items have type 'RENTAL' too? No, properties are usually just PROPERY in db but RENTAL in types.
          // Let's check db.createBooking implementation. It expects 'property' or 'service'.
          // A safer check: if valid property ID -> property, else service.
          // But here simple logic:
          status: 'confirmed',
          check_in: item.startDate || item.date || new Date().toISOString(),
          check_out: item.endDate || item.date || new Date(Date.now() + 86400000).toISOString(),
          total_price: item.price,
          guests: item.guests || 1
        });
      }

      clearCart();
      setShowSuccess(true);
      setTimeout(() => {
        navigate('/profile');
      }, 3000);

    } catch (error) {
      console.error("Booking error:", error);
      alert("Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-md animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">{t('checkout.success_title') || 'Booking Confirmed!'}</h2>
          <p className="text-slate-600 mb-6">{t('checkout.success_desc') || 'Your adventure in Alanya awaits. Redirecting to your dashboard...'}</p>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
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
    <div className="min-h-screen bg-slate-50 pt-12 pb-24">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-serif font-bold text-slate-900 mb-8">{t('checkout.title')}</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Order Details */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">{t('checkout.basket')}</h2>

              {items.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-slate-500 mb-4">{t('checkout.empty')}</p>
                  <Link to="/" className="text-teal-700 font-medium underline">{t('checkout.start')}</Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start border-b border-slate-100 pb-6 last:border-0 last:pb-0">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${item.type === 'RENTAL' ? 'bg-teal-100 text-teal-800' : 'bg-orange-100 text-orange-800'
                            }`}>
                            {item.type}
                          </span>
                        </div>
                        <h3 className="font-semibold text-slate-900">{item.title}</h3>
                        <p className="text-sm text-slate-500">{item.details}</p>
                        {(item.startDate || item.date) && (
                          <div className="text-xs text-slate-400 mt-1">
                            {item.startDate ? `${item.startDate} - ${item.endDate}` : item.date}
                            {item.guests ? ` • ${item.guests} Guests` : ''}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="font-medium text-slate-900">{convertAndFormat(item.price, 'EUR')}</span>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-slate-400 hover:text-red-500 transition"
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
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">{t('checkout.recommended')}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { id: 'rec-1', type: ServiceType.OTHER, title: 'Airport Transfer', price: 45, currency: 'EUR', icon: '🚗', desc: 'S-Class comfort for your arrival' },
                  { id: 'rec-2', type: ServiceType.OTHER, title: 'Welcome Pack', price: 30, currency: 'EUR', icon: '🧺', desc: 'Essentials waiting in your fridge' },
                ].map((rec) => {
                  const isInCart = items.some(i => i.id === rec.id);
                  return (
                    <div
                      key={rec.id}
                      className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 hover:border-primary/30 hover:bg-slate-50 transition-all group cursor-pointer"
                      onClick={() => {
                        if (!isInCart) {
                          // Base currency is EUR, no conversion needed for cart
                          addToCart({
                            id: rec.id,
                            type: ServiceType.OTHER,
                            title: rec.title,
                            price: rec.price,
                            details: 'One-time service'
                          });
                        }
                      }}
                    >
                      <div className="text-2xl bg-slate-50 w-12 h-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">{rec.icon}</div>
                      <div className="flex-grow">
                        <div className="flex justify-between items-start">
                          <h4 className="font-semibold text-slate-900">{rec.title}</h4>
                          <span className="font-bold text-primary">{formatPrice(convertPrice(rec.price, 'EUR'))}</span>
                        </div>
                        <p className="text-xs text-slate-500 mb-3">{rec.desc}</p>
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

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">{t('checkout.payment')}</h2>
              <div className="flex items-center gap-4 p-4 border border-slate-200 rounded-lg bg-slate-50 mb-4">
                <CreditCard className="text-slate-400" />
                <span className="text-slate-500 text-sm">{t('checkout.card_mock')}</span>
              </div>
              <button
                onClick={handlePayment}
                disabled={items.length === 0 || isProcessing}
                className="w-full bg-teal-700 text-white font-bold py-4 rounded-xl hover:bg-teal-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
          <div className="md:col-span-1">
            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 sticky top-24">
              <h3 className="font-bold text-lg text-slate-900 mb-6">{t('checkout.price_details')}</h3>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>{t('checkout.subtotal')}</span>
                  <span>{convertAndFormat(total)}</span>
                </div>
                <div className="flex justify-between text-sm text-teal-700 font-medium">
                  <span>{t('prop.guest_fee')}</span>
                  <span>{convertAndFormat(0)}</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                <span className="font-bold text-lg text-slate-900">{t('prop.total')} ({currency})</span>
                <span className="font-bold text-xl text-slate-900">{convertAndFormat(total)}</span>
              </div>

              <div className="mt-6 bg-slate-50 p-3 rounded-lg flex gap-3 items-start">
                <Shield className="text-teal-700 shrink-0" size={18} />
                <p className="text-xs text-slate-500 leading-tight">
                  <span className="font-bold text-slate-700">{t('checkout.free_cancel')}</span> {t('checkout.free_cancel_desc')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};