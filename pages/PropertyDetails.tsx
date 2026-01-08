import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, MapPin, User, ShieldCheck, CheckCircle, Car, Camera, ArrowRight } from 'lucide-react';
import { MOCK_PROPERTIES, CROSS_SELL_SERVICES } from '../constants';
import { useCart } from '../context/CartContext';
import { TripAssistant } from '../components/TripAssistant';
import { ServiceType } from '../types';
import { useLanguage } from '../context/LanguageContext';

export const PropertyDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { t } = useLanguage();
  const property = MOCK_PROPERTIES.find(p => p.id === id);
  const [nights, setNights] = useState(5); // Default mock value

  if (!property) {
    return <div className="p-20 text-center">Property not found</div>;
  }

  const totalPrice = property.pricePerNight * nights;

  const handleBook = () => {
    addToCart({
      id: property.id,
      type: ServiceType.RENTAL,
      title: property.title,
      price: totalPrice,
      details: `${nights} nights`
    });
    // Scroll to cross-sell or navigate
    const crossSellSection = document.getElementById('cross-sell');
    if (crossSellSection) crossSellSection.scrollIntoView({ behavior: 'smooth' });
  };

  const handleAddService = (service: any) => {
    addToCart({
      id: service.id,
      type: service.type,
      title: service.title,
      price: service.price,
      details: service.type === ServiceType.TRANSFER ? service.vehicleType : service.duration
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 transition-colors">
      {/* Gallery Grid - Simplified */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 h-[400px] md:h-[500px]">
        <img src={property.images[0]} className="w-full h-full object-cover" alt="Main" />
        <div className="hidden md:grid grid-cols-2 gap-2">
          {property.images.slice(1, 3).map((img, i) => (
            <img key={i} src={img} className="w-full h-full object-cover" alt={`Gallery ${i}`} />
          ))}
          <div className="relative bg-slate-900">
            <img src={property.images[0]} className="w-full h-full object-cover opacity-60" alt="More" />
            <div className="absolute inset-0 flex items-center justify-center text-white font-medium cursor-pointer hover:underline">
              {t('prop.view_photos')}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-12">

        {/* Left Column: Info */}
        <div className="lg:col-span-2 space-y-8">
          <div>
            <div className="flex justify-between items-start">
              <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-white">{property.title}</h1>
            </div>
            <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400 mt-2 text-sm">
              <span className="flex items-center gap-1"><MapPin size={16} /> {property.location}</span>
              <span className="flex items-center gap-1"><Star size={16} className="fill-current text-yellow-500" /> {property.rating} ({property.reviewsCount} {t('prop.reviews')})</span>
            </div>
          </div>

          <div className="py-6 border-y border-slate-200 dark:border-slate-800 flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400">
              <User size={24} />
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">{t('prop.hosted_by')} {property.hostName}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{t('prop.superhost')} • 3 Years hosting</p>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{t('prop.about')}</h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{property.description}</p>
          </div>

          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{t('prop.offers')}</h3>
            <div className="grid grid-cols-2 gap-4">
              {property.amenities.map((am, i) => (
                <div key={i} className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 text-xs">
                    {/* Simplified icon logic for prototype */}
                    <CheckCircle size={16} />
                  </div>
                  {am.label}
                </div>
              ))}
            </div>
          </div>

          {/* AI Feature Component */}
          <TripAssistant propertyName={property.title} location={property.location} />
        </div>

        {/* Right Column: Booking Card */}
        <div className="relative">
          <div className="sticky top-24 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 p-6">
            <div className="flex justify-between items-end mb-6">
              <div>
                <span className="text-2xl font-bold text-slate-900 dark:text-white">${property.pricePerNight}</span>
                <span className="text-slate-500 dark:text-slate-400 text-sm"> {t('featured.night')}</span>
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-slate-900 dark:text-white underline cursor-pointer">
                {property.reviewsCount} {t('prop.reviews')}
              </div>
            </div>

            <div className="border border-slate-200 dark:border-slate-700 rounded-xl mb-4 overflow-hidden">
              <div className="grid grid-cols-2 border-b border-slate-200 dark:border-slate-700">
                <div className="p-3 border-r border-slate-200 dark:border-slate-700">
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">{t('prop.checkin')}</label>
                  <div className="text-sm font-medium dark:text-slate-200">Oct 14, 2023</div>
                </div>
                <div className="p-3">
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">{t('prop.checkout')}</label>
                  <div className="text-sm font-medium dark:text-slate-200">Oct 19, 2023</div>
                </div>
              </div>
              <div className="p-3">
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">{t('prop.guests_label')}</label>
                <select className="w-full text-sm font-medium bg-transparent outline-none dark:text-slate-200 dark:bg-slate-900">
                  <option>2 Guests</option>
                  <option>3 Guests</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleBook}
              className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold py-3.5 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-teal-700/20"
            >
              {t('prop.reserve')}
            </button>

            <p className="text-center text-xs text-slate-400 mt-3">{t('prop.no_charge')}</p>

            <div className="mt-6 space-y-3">
              <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                <span className="underline">${property.pricePerNight} x {nights} nights</span>
                <span>${totalPrice}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                <span className="underline">{t('prop.cleaning_fee')}</span>
                <span>$40</span>
              </div>
              <div className="flex justify-between text-sm text-teal-700 dark:text-teal-400 font-medium bg-teal-50 dark:bg-teal-900/30 p-2 rounded-lg">
                <span>{t('prop.guest_fee')}</span>
                <span>$0</span>
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800 mt-4 pt-4 flex justify-between font-bold text-slate-900 dark:text-white">
              <span>{t('prop.total')}</span>
              <span>${totalPrice + 40}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cross-Sell Section */}
      <section id="cross-sell" className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-teal-100 dark:bg-teal-900/50 text-teal-800 dark:text-teal-300 rounded-lg">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('cross.title')}</h2>
              <p className="text-slate-500 dark:text-slate-400">{t('cross.subtitle')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {CROSS_SELL_SERVICES.map(service => (
              <div key={service.id} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:shadow-lg transition bg-slate-50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-900 group">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-white dark:bg-slate-700 rounded-lg border border-slate-100 dark:border-slate-600 flex items-center justify-center text-teal-700 dark:text-teal-300 shadow-sm">
                    {service.type === ServiceType.TRANSFER ? <Car size={24} /> : <Camera size={24} />}
                  </div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-700 px-2 py-1 rounded border border-slate-200 dark:border-slate-600">${service.price}</span>
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-1">{service.title}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">{service.description}</p>
                <button
                  onClick={() => handleAddService(service)}
                  className="w-full py-2 border-2 border-slate-200 text-slate-700 font-semibold rounded-lg hover:border-teal-700 hover:text-teal-700 transition flex items-center justify-center gap-2 group-hover:bg-teal-50"
                >
                  {t('cross.add')} <ArrowRight size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};