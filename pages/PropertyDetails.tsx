import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, MapPin, User, Users, BedDouble, ShieldCheck, CheckCircle, Car, Camera, ArrowRight } from 'lucide-react';
import { CROSS_SELL_SERVICES } from '../constants';
import { useCart } from '../context/CartContext';
import { ServiceType } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useLightbox } from '../context/LightboxContext';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/db';

export const PropertyDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { t } = useLanguage();
  const { openLightbox } = useLightbox();
  const { setChatContext } = useChat();

  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasBooking, setHasBooking] = useState(false);
  const [nights, setNights] = useState(5);
  const { user, isAuthenticated } = useAuth();

  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');

  useEffect(() => {
    const fetchProperty = async () => {
      if (!id) return;
      try {
        const data = await db.getProperty(id);
        if (data) {
          // Normalize data structure
          setProperty({
            ...data,
            pricePerNight: data.price_per_night, // Map DB snake_case to CamelCase
            hostName: data.host?.full_name || 'Alanya Holidays',
            reviewsCount: data.reviews_count || 0,
            amenities: Array.isArray(data.amenities)
              ? data.amenities.map((a: any) => typeof a === 'string' ? { label: a } : a)
              : []
          });

          // Check for booking if logged in
          if (isAuthenticated && user) {
            const bookings = await db.getBookings(user.id);
            const activeBooking = bookings.find((b: any) =>
              b.item_id === id &&
              (b.status === 'confirmed' || b.status === 'completed')
            );
            if (activeBooking) {
              setHasBooking(true);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching property:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProperty();
  }, [id]);

  useEffect(() => {
    if (checkIn && checkOut) {
      const start = new Date(checkIn);
      const end = new Date(checkOut);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setNights(diffDays > 0 ? diffDays : 0);
    }
  }, [checkIn, checkOut]);

  useEffect(() => {
    if (property) {
      setChatContext({
        propertyName: property.title,
        location: property.location
      });
    }
    return () => setChatContext(null);
  }, [property, setChatContext]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-slate-500">Loading property details...</div>
      </div>
    );
  }

  if (!property) {
    return <div className="p-20 text-center text-slate-500">Property not found</div>;
  }

  const totalPrice = (property.pricePerNight || 0) * nights;

  const handleBook = () => {
    addToCart({
      id: property.id,
      type: ServiceType.RENTAL,
      title: property.title,
      price: totalPrice,
      details: `${nights} nights`
    });
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 h-[400px] md:h-[500px] relative">
        <div
          className="relative h-full w-full overflow-hidden group cursor-zoom-in"
          onClick={() => openLightbox(property.images, 0)}
        >
          <img src={property.images?.[0] || 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&auto=format&fit=crop'} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Main" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>

          {/* Glassmorphism Title Card */}
          <div
            className="absolute bottom-6 left-6 max-w-lg cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white/65 dark:bg-slate-900/65 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-white/20">
              <h1 className="text-2xl md:text-3xl font-serif font-bold text-primary dark:text-white mb-2 leading-tight">
                {property.title}
              </h1>
              <div className="flex items-center gap-4 text-slate-600 dark:text-slate-300 text-sm font-medium">
                <span className="flex items-center gap-1.5"><MapPin size={16} className="text-accent" /> {property.address || property.location}</span>
                <span className="flex items-center gap-1.5"><Star size={16} className="fill-orange-400 text-orange-400" /> {property.rating || 5.0} ({property.reviewsCount} reviews)</span>
                <span className="flex items-center gap-1.5"><Users size={16} className="text-accent" /> Up to {property.max_guests || 2} guests</span>
                <span className="flex items-center gap-1.5"><BedDouble size={16} className="text-accent" /> {property.beds || 1} beds</span>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden md:grid grid-cols-2 gap-2">
          {property.images && property.images.length > 1 ? property.images.slice(1, 3).map((img: string, i: number) => (
            <div
              key={i}
              className="relative overflow-hidden group h-full cursor-zoom-in"
              onClick={() => openLightbox(property.images, i + 1)}
            >
              <img src={img} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={`Gallery ${i}`} />
            </div>
          )) : (
            <div className="bg-slate-200 h-full w-full"></div>
          )}
          <div
            className="relative bg-slate-900 overflow-hidden group cursor-zoom-in"
            onClick={() => openLightbox(property.images, 0)}
          >
            <img src={property.images?.[0]} className="w-full h-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-105" alt="More" />
            <div className="absolute inset-0 flex items-center justify-center text-white font-medium cursor-pointer hover:underline z-10">
              {t('prop.view_photos')}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-12">

        {/* Left Column: Info */}
        <div className="lg:col-span-2 space-y-8">
          <div>
            {/* Title moved to Hero Image */}
          </div>

          <div className="py-6 border-y border-slate-200 dark:border-slate-800 flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400">
              <User size={24} />
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">{t('prop.hosted_by')} {property.hostName}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{t('prop.superhost')} • Verified Host</p>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{t('prop.about')}</h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{property.description || 'No description provided.'}</p>
          </div>

          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{t('prop.offers')}</h3>
            <div className="grid grid-cols-2 gap-4">
              {property.amenities.map((am: any, i: number) => (
                <div key={i} className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 text-xs">
                    <CheckCircle size={16} />
                  </div>
                  {am.label}
                </div>
              ))}
            </div>
          </div>

          {/* Hospitality Guide (Conditional) */}
          {hasBooking && (
            <div className="bg-teal-50 dark:bg-teal-900/10 rounded-2xl p-8 border border-teal-100 dark:border-teal-800 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-500 text-white rounded-lg shadow-lg">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Guest Hospitality Guide</h3>
                  <p className="text-sm text-teal-700 dark:text-teal-400 font-medium">Exclusive information for your stay</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Check-in Info */}
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <CheckCircle size={18} className="text-teal-500" />
                    Check-in & Checkout
                  </h4>
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1 font-medium">Arrival Time</p>
                    <p className="text-slate-900 dark:text-white font-semibold">{property.check_in_time || 'Check property rules'}</p>
                    <hr className="my-3 border-slate-100 dark:border-slate-700" />
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1 font-medium">Checkout Time</p>
                    <p className="text-slate-900 dark:text-white font-semibold">{property.check_out_time || 'Check property rules'}</p>
                    <hr className="my-3 border-slate-100 dark:border-slate-700" />
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1 font-medium">Check-in Method</p>
                    <p className="text-slate-900 dark:text-white font-semibold">{property.check_in_method || 'Contact Host'}</p>
                  </div>
                </div>

                {/* Wifi Details */}
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <CheckCircle size={18} className="text-teal-500" />
                    Wifi & Internet
                  </h4>
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 h-full">
                    <p className="text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                      {property.wifi_details || 'Will be provided on arrival'}
                    </p>
                  </div>
                </div>

                {/* Arrival & Directions */}
                <div className="md:col-span-2 space-y-4">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <MapPin size={18} className="text-teal-500" />
                    Arrival Guide & Directions
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-100 dark:border-slate-700">
                      <p className="text-xs font-bold text-slate-400 uppercase mb-2">Directions</p>
                      <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{property.directions || 'Follow GPS to address below'}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-100 dark:border-slate-700">
                      <p className="text-xs font-bold text-slate-400 uppercase mb-2">Arrival Instructions</p>
                      <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{property.arrival_guide || 'No specific instructions.'}</p>
                    </div>
                  </div>
                </div>

                {/* House Rules & Manual */}
                <div className="md:col-span-2 space-y-4 pt-4 border-t border-teal-100 dark:border-teal-800">
                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <h5 className="font-bold text-slate-900 dark:text-white mb-3 text-sm">House Rules</h5>
                      <p className="text-slate-600 dark:text-slate-400 text-sm whitespace-pre-line leading-relaxed">
                        {property.house_rules || 'Standard rules apply.'}
                      </p>
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-900 dark:text-white mb-3 text-sm">House Manual</h5>
                      <p className="text-slate-600 dark:text-slate-400 text-sm whitespace-pre-line leading-relaxed">
                        {property.house_manual || 'Will be available in the property.'}
                      </p>
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-900 dark:text-white mb-3 text-sm">Checkout Instructions</h5>
                      <p className="text-slate-600 dark:text-slate-400 text-sm whitespace-pre-line leading-relaxed">
                        {property.checkout_instructions || 'Please leave keys as found.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Local Guide & Interaction */}
                <div className="md:col-span-2 grid md:grid-cols-2 gap-6 pt-4">
                  <div className="bg-teal-500/5 dark:bg-teal-400/5 p-4 rounded-xl border border-teal-200/50 dark:border-teal-800/50">
                    <h5 className="font-bold text-slate-900 dark:text-white mb-2 text-sm flex items-center gap-2">
                      Interaction Preferences
                    </h5>
                    <p className="text-slate-600 dark:text-slate-400 text-sm italic">"{property.interaction_preferences || 'Available via text/app'}"</p>
                  </div>
                  {property.guidebooks && (
                    <div className="bg-teal-500/5 dark:bg-teal-400/5 p-4 rounded-xl border border-teal-200/50 dark:border-teal-800/50">
                      <h5 className="font-bold text-slate-900 dark:text-white mb-2 text-sm">Host Recommendations</h5>
                      <p className="text-slate-600 dark:text-slate-400 text-sm">{property.guidebooks}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Booking Card */}
        <div className="relative z-30">
          <div
            className="sticky top-24 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 p-6"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
          >
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
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full text-sm font-medium bg-transparent outline-none dark:text-slate-200"
                  />
                </div>
                <div className="p-3">
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">{t('prop.checkout')}</label>
                  <input
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full text-sm font-medium bg-transparent outline-none dark:text-slate-200"
                  />
                </div>
              </div>
              <div className="p-3">
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">{t('prop.guests_label')}</label>
                <select className="w-full text-sm font-medium bg-transparent outline-none dark:text-slate-200 dark:bg-slate-900">
                  <option>1 Guest</option>
                  <option>2 Guests</option>
                  <option>3 Guests</option>
                  <option>4 Guests</option>
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