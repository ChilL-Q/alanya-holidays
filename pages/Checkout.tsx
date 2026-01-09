import React from 'react';
import { useCart } from '../context/CartContext';
import { Trash2, Shield, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export const Checkout: React.FC = () => {
  const { items, total, removeFromCart, addToCart } = useCart();
  const { t } = useLanguage();
  const rental = items.find(i => i.type === 'RENTAL');

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
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="font-medium text-slate-900">${item.price}</span>
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
                  { id: 'rec-1', type: 'OTHER', title: 'Airport Transfer', price: 45, icon: '🚗', desc: 'S-Class comfort for your arrival' },
                  { id: 'rec-2', type: 'OTHER', title: 'Welcome Pack', price: 30, icon: '🧺', desc: 'Essentials waiting in your fridge' },
                ].map((rec) => {
                  const isInCart = items.some(i => i.id === rec.id);
                  return (
                    <div key={rec.id} className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 hover:border-primary/30 hover:bg-slate-50 transition-all group cursor-pointer" onClick={() => !isInCart && addToCart({ id: rec.id, type: 'OTHER', title: rec.title, price: rec.price, details: 'One-time service' })}>
                      <div className="text-2xl bg-slate-50 w-12 h-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">{rec.icon}</div>
                      <div className="flex-grow">
                        <div className="flex justify-between items-start">
                          <h4 className="font-semibold text-slate-900">{rec.title}</h4>
                          <span className="font-bold text-primary">${rec.price}</span>
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
                disabled={items.length === 0}
                className="w-full bg-teal-700 text-white font-bold py-4 rounded-xl hover:bg-teal-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('checkout.pay')} ${total}
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
                  <span>${total}</span>
                </div>
                <div className="flex justify-between text-sm text-teal-700 font-medium">
                  <span>{t('prop.guest_fee')}</span>
                  <span>$0</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                <span className="font-bold text-lg text-slate-900">{t('prop.total')} (USD)</span>
                <span className="font-bold text-xl text-slate-900">${total}</span>
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