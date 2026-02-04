import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, MapPin, User, Users, BedDouble, ShieldCheck, CheckCircle, Camera, DoorOpen, Bath, LogIn, MessageCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { ServiceType } from '../types/index';
import { useLanguage } from '../context/LanguageContext';
import { Map } from '../components/ui/Map';
import { useLightbox } from '../context/LightboxContext';
import { useChat } from '../context/ChatContext';
import { ChatWindow } from '../components/chat/ChatWindow';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { db } from '../services';
import { Property, Amenity } from '../types/models';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { enGB, ru, tr } from 'date-fns/locale';
import { ReviewsSection } from '../components/reviews/ReviewsSection';
import toast from 'react-hot-toast';
import { Modal } from '../components/ui/Modal';

interface PropertyDetailsData extends Property {
  // Extending Property from models.ts ensuring consistency.
  address?: string;
  host?: any; // Using any or UserProfile to avoid deep type issues for now, or import UserProfile
  host_id?: string;
  hostAvatar?: string | null;
}

// Custom Masked Input Component
// Basic Input for DatePicker
const DateInput = React.forwardRef<HTMLInputElement, any>((props, ref) => (
  <input
    {...props}
    ref={ref}
    className={props.className}
    placeholder={props.placeholder}
  />
));





// Fallback for Main image if broken
const MAIN_FALLBACK = 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&auto=format&fit=crop';

export const PropertyDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { t } = useLanguage();
  const { openLightbox } = useLightbox();
  const { startConversation } = useChat();
  const { convertPrice, formatPrice } = useCurrency();
  const [showChat, setShowChat] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const [property, setProperty] = useState<PropertyDetailsData | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [hasBooking, setHasBooking] = useState(false);
  const [nights, setNights] = useState(5);
  const { user, isAuthenticated } = useAuth();
  const { language } = useLanguage();

  const [blockedDates, setBlockedDates] = useState<Date[]>([]);
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [crossSellServices, setCrossSellServices] = useState<any[]>([]);

  useEffect(() => {
    const fetchProperty = async () => {
      if (!id) return;
      try {
        const data = await db.getProperty(id);
        if (data) {
          // Normalize data structure
          const normalizedData: PropertyDetailsData = {
            ...data,
            title: data.title || 'Property Details',
            description: data.description || '',
            images: Array.isArray(data.images) ? data.images : [],
            amenities: Array.isArray(data.amenities)
              ? data.amenities.map((a: any) => {
                if (typeof a === 'object' && a !== null) {
                  return a.label || a.name || a.title || JSON.stringify(a);
                }
                return String(a);
              })
              : [],
            pricePerNight: Number(data.price_per_night) || 0,
            guests: data.max_guests || 2,
            bedrooms: data.bedrooms || 1,
            beds: data.beds || 1,
            bathrooms: data.bathrooms || 1,
            host_id: data.host_id,
            hostName: data.host?.full_name || ((data as any).profiles ? ((data as any).profiles.full_name || (data as any).profiles.username) : 'Alanya Holidays'),
            hostAvatar: data.host?.avatar_url || ((data as any).profiles ? (data as any).profiles.avatar_url : null),
            rating: data.rating || 5.0,
            reviewsCount: data.reviews_count || 0,
            cleaning_fee: Number(data.cleaning_fee) || 0
          } as unknown as PropertyDetailsData;

          setProperty(normalizedData);

          // Fetch blocked dates
          const unavailable = await db.getUnavailableDates(normalizedData.id);
          if (unavailable) {
            setBlockedDates(unavailable.map((d: string) => new Date(d)));
          }

          // Fetch review count
          const reviewCount = await db.getReviewCount(normalizedData.id);
          setProperty(prev => prev ? { ...prev, reviewsCount: reviewCount } : null);

          // Check for booking
          if (isAuthenticated && user) {
            const bookings = await db.getBookings(user.id);
            const activeBooking = bookings?.find((b: any) =>
              b.item_id === normalizedData.id &&
              (b.status === 'confirmed' || b.payment_status === 'paid')
            );
            if (activeBooking) {
              setHasBooking(true);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching property:', error);
        toast.error('Failed to load property details');
      } finally {
        setLoading(false);
      }
    };
    fetchProperty();
  }, [id, isAuthenticated, user]);

  useEffect(() => {
    const fetchCrossSell = async () => {
      try {
        const { data: transfers } = await db.getServices('transfer', 1, 5);
        const { data: tours } = await db.getServices('tour', 1, 5);
        const combined = [...(transfers || []), ...(tours || [])].slice(0, 3);
        setCrossSellServices(combined);
      } catch (e) {
        console.error("Error fetching cross-sell services", e);
      }
    };
    fetchCrossSell();
  }, []);

  useEffect(() => {
    if (checkIn && checkOut) {
      const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setNights(diffDays > 0 ? diffDays : 0);
    }
  }, [checkIn, checkOut]);

  if (loading) {
    return (
      <div className="p-20 text-center flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
        <div className="text-slate-500">Loading property details...</div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="p-20 text-center text-slate-500">
        <h2 className="text-xl font-bold mb-2">Property not found</h2>
        <p>The property with ID {id} could not be loaded.</p>
        <button onClick={() => window.history.back()} className="mt-4 text-teal-600 underline">Go Back</button>
      </div>
    );
  }

  const totalPrice = (property?.pricePerNight || 0) * nights;

  // Helper for consistent price display
  // Robust Data Normalization
  const displayPrice = (amount: number) => {
    const converted = convertPrice(amount || 0, 'EUR');
    return formatPrice(converted);
  };

  const handleBook = () => {
    addToCart({
      id: property.id,
      type: 'property',
      title: property.title,
      price: totalPrice + (property.cleaning_fee || 0),
      image: property.images?.[0],
      details: `${nights} nights`,
      startDate: checkIn ? `${checkIn.getFullYear()}-${String(checkIn.getMonth() + 1).padStart(2, '0')}-${String(checkIn.getDate()).padStart(2, '0')}` : undefined,
      endDate: checkOut ? `${checkOut.getFullYear()}-${String(checkOut.getMonth() + 1).padStart(2, '0')}-${String(checkOut.getDate()).padStart(2, '0')}` : undefined,
      guests: Number(document.querySelector<HTMLSelectElement>('#guests-select')?.value || 1),
      cleaningFee: property.cleaning_fee || 0,
      pricePerNight: property.pricePerNight || 0,
      nights: nights
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
      image: service.images?.[0],
      details: service.type === ServiceType.TRANSFER ? service.vehicleType : service.duration,
      startDate: checkIn ? `${checkIn.getFullYear()}-${String(checkIn.getMonth() + 1).padStart(2, '0')}-${String(checkIn.getDate()).padStart(2, '0')}` : undefined,
      endDate: checkOut ? `${checkOut.getFullYear()}-${String(checkOut.getMonth() + 1).padStart(2, '0')}-${String(checkOut.getDate()).padStart(2, '0')}` : undefined,
      date: checkIn ? `${checkIn.getFullYear()}-${String(checkIn.getMonth() + 1).padStart(2, '0')}-${String(checkIn.getDate()).padStart(2, '0')}` : undefined
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 transition-colors">
      {/* Gallery Grid - Dynamic Layout */}
      <div className={`grid gap-2 h-[300px] md:h-[500px] relative animate-fade-in text-white overflow-hidden ${(property?.images?.length || 0) === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'
        }`}>

        {/* Left: Main Image */}
        <div
          className="relative h-full w-full overflow-hidden group cursor-zoom-in"
          onClick={() => openLightbox(property?.images || [], 0)}
        >
          <img
            src={(property?.images?.[0] && !imageErrors[0]) ? property.images[0] : MAIN_FALLBACK}
            className="w-full h-full object-cover block transition-transform duration-700 group-hover:scale-105"
            alt="Main"
            onError={() => setImageErrors(prev => ({ ...prev, 0: true }))}
          />
          {/* Gradient for Desktop Overlay visibility */}
          <div className="hidden md:block absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>

          {/* Desktop Glassmorphism Title Card */}
          <div
            className="hidden md:block absolute bottom-6 left-6 max-w-lg cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white/65 dark:bg-slate-900/65 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-white/20">
              <h1 className="text-3xl font-serif font-bold text-primary dark:text-white mb-2 leading-tight">
                {property?.title || 'Unknown Property'}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-slate-600 dark:text-slate-300 text-sm font-medium">
                <span className="flex items-center gap-1.5"><MapPin size={16} className="text-accent" /> {property?.address || property?.location || 'No location'}</span>
                <span className="flex items-center gap-1.5"><Star size={16} className="fill-orange-400 text-orange-400" /> {(property?.reviewsCount || 0) > 0 ? `${(property?.rating || 5.0).toFixed(1)} (${property?.reviewsCount} reviews)` : <span className="text-sm font-bold bg-teal-600 text-white px-2 py-0.5 rounded-md">New</span>}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Grid of Extra Images (Hide if only 1 image) */}
        {(property?.images?.length || 0) > 1 && (
          <div className={`hidden md:grid gap-2 h-full overflow-hidden ${(property?.images?.length === 2) ? 'grid-cols-1' :
            (property?.images?.length === 3) ? 'grid-cols-1 grid-rows-2' :
              'grid-cols-2 grid-rows-2'
            }`}>
            {property?.images?.slice(1, 5).map((img, i) => {
              const imgIndex = i + 1;
              const isLast = i === (Math.min(4, (property?.images?.length || 0) - 1) - 1);
              const remainingCount = Math.max(0, (property?.images?.length || 0) - 5);

              return (
                <div
                  key={i}
                  className="relative overflow-hidden group h-full w-full cursor-zoom-in bg-slate-200 dark:bg-slate-800"
                  onClick={() => openLightbox(property?.images || [], imgIndex)}
                >
                  <img
                    src={img}
                    className="w-full h-full object-cover block transition-transform duration-700 group-hover:scale-105"
                    alt={`Gallery ${i}`}
                    onError={() => setImageErrors(prev => ({ ...prev, [imgIndex]: true }))}
                  />
                  {isLast && remainingCount > 0 && (
                    <div className="absolute inset-0 flex items-center justify-center transition-colors z-10 text-white font-medium cursor-pointer">
                      <div className="w-full h-full bg-black/50 hover:bg-black/60 flex items-center justify-center text-lg">
                        +{remainingCount} more
                      </div>
                    </div>
                  )}
                  {isLast && remainingCount === 0 && i === 3 && (
                    <div className="absolute inset-0 flex items-center justify-center transition-colors z-10 text-white font-medium cursor-pointer opacity-0 group-hover:opacity-100">
                      <div className="w-full h-full bg-black/20 flex items-center justify-center gap-2">
                        <Camera size={20} />
                        {t('prop.view_photos')}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Mobile "View Photos" button overlay */}
        <div className="md:hidden absolute bottom-4 right-4 z-10">
          <button
            onClick={() => openLightbox(property?.images || [], 0)}
            className="bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2"
          >
            <Camera size={14} />
            {property?.images?.length || 0} Photos
          </button>
        </div>
      </div>

      {/* Mobile Title Section (Below Image) */}
      <div className="md:hidden px-4 py-5 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 rounded-b-3xl shadow-sm mb-2">
        <h1 className="text-2xl font-serif font-bold text-slate-900 dark:text-white mb-2 leading-tight">
          {property?.title || 'Unknown Property'}
        </h1>
        <div className="flex flex-col gap-2 text-slate-600 dark:text-slate-400 text-sm">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5"><MapPin size={16} className="text-accent shrink-0" /> <span className="truncate">{property?.address || property?.location || 'No location'}</span></span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-medium"><Star size={16} className="fill-orange-400 text-orange-400" /> {(property?.reviewsCount || 0) > 0 ? `${(property?.rating || 5.0).toFixed(1)}` : 'New'}</span>
            <span className="text-slate-300">•</span>
            <span className="underline decoration-slate-300 decoration-1 underline-offset-2">{property?.reviewsCount || 0} reviews</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 mt-2 grid grid-cols-1 lg:grid-cols-3 gap-12">

        {/* Left Column: Info */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-2">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center gap-2">
              <Users size={24} className="text-accent" />
              <span className="text-sm font-bold text-slate-900 dark:text-white">{property?.guests || 1} Guests</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center gap-2">
              <DoorOpen size={24} className="text-accent" />
              <span className="text-sm font-bold text-slate-900 dark:text-white">{property?.bedrooms || 1} Bedrooms</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center gap-2">
              <BedDouble size={24} className="text-accent" />
              <span className="text-sm font-bold text-slate-900 dark:text-white">{property?.beds || 1} Beds</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center gap-2">
              <Bath size={24} className="text-accent" />
              <span className="text-sm font-bold text-slate-900 dark:text-white">{property?.bathrooms || 1} Baths</span>
            </div>
          </div>

          <div className="py-6 border-y border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center sm:justify-between gap-6 px-2 sm:px-0">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 overflow-hidden shrink-0">
                {property?.hostAvatar ? (
                  <img src={property.hostAvatar} alt={property.hostName} className="w-full h-full object-cover" />
                ) : (
                  <User size={24} />
                )}
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">{t('prop.hosted_by')} {property?.hostName || 'Alanya Holidays'}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{t('prop.verified_host')} • {t('prop.superhost')}</p>
                {property?.host && (property.host.email || property.host.phone) && (
                  <div className="mt-1 text-xs text-slate-400 flex flex-col gap-0.5">
                    {property.host.email && <span>{property.host.email}</span>}
                    {property.host.phone && <span>{property.host.phone}</span>}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  setShowLoginModal(true);
                  return;
                }
                if (property?.host_id) {
                  startConversation(property.id, property.host_id);
                  setShowChat(true);
                }
              }}
              className="flex items-center justify-center gap-2 px-8 py-3 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 z-10 ring-2 ring-transparent hover:ring-slate-900 dark:hover:ring-white ring-offset-2"
            >
              <MessageCircle size={20} />
              Contact Host
            </button>
          </div>

          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{t('prop.about')}</h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{property?.description || 'No description provided.'}</p>
          </div>

          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{t('prop.offers')}</h3>
            <div className="grid grid-cols-2 gap-4">
              {(property?.amenities || []).map((am: string, i: number) => (
                <div key={i} className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 text-xs">
                    <CheckCircle size={16} />
                  </div>
                  {t(am)}
                </div>
              ))}
            </div>
          </div>

          {/* Hospitality Guide */}
          {hasBooking && (
            <div className="bg-teal-50 dark:bg-teal-900/10 rounded-2xl p-8 border border-teal-100 dark:border-teal-800 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-900 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Hospitality Guide</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    Detailed guide containing check-in instructions, Wi-Fi passwords, and house rules.
                  </p>
                </div>
              </div>
            </div>
          )}

          {property?.id && <ReviewsSection propertyId={property.id} />}

        </div>

        {/* Right Column: Booking Card */}
        <div className="relative z-30">
          <div
            className="sticky top-24 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-end mb-6">
              <div>
                <span className="text-2xl font-bold text-slate-900 dark:text-white">{displayPrice(property?.pricePerNight || 0)}</span>
                <span className="text-slate-500 dark:text-slate-400 text-sm"> {t('featured.night')}</span>
              </div>
              <div
                className="flex items-center gap-1 text-xs font-semibold text-slate-900 dark:text-white underline cursor-pointer"
                onClick={() => {
                  document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                {(property?.reviewsCount || 0) > 0 ? (
                  <span className="flex items-center gap-1"><Star size={12} className="fill-slate-900 dark:fill-white" /> {property.reviewsCount} {t('prop.reviews')}</span>
                ) : (
                  <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-500">New Listing</span>
                )}
              </div>
            </div>

            <div className="border border-slate-200 dark:border-slate-700 rounded-xl mb-4 overflow-hidden">
              {/* Dates and guests inputs */}
              <div className="grid grid-cols-2 border-b border-slate-200 dark:border-slate-700">
                <div className="p-3 border-r border-slate-200 dark:border-slate-700">
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">{t('prop.checkin')}</label>
                  <DatePicker selected={checkIn} onChange={setCheckIn} selectsStart startDate={checkIn} endDate={checkOut} minDate={new Date()} excludeDates={blockedDates} placeholderText={t('date_format')} dateFormat="dd.MM.yyyy" customInput={<DateInput className="w-full text-sm font-medium bg-transparent outline-none dark:text-slate-200 placeholder-slate-400" />} />
                </div>
                <div className="p-3">
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">{t('prop.checkout')}</label>
                  <DatePicker selected={checkOut} onChange={setCheckOut} selectsEnd startDate={checkIn} endDate={checkOut} minDate={checkIn || new Date()} excludeDates={blockedDates} placeholderText={t('date_format')} dateFormat="dd.MM.yyyy" customInput={<DateInput className="w-full text-sm font-medium bg-transparent outline-none dark:text-slate-200 placeholder-slate-400" />} />
                </div>
              </div>
              <div className="p-3">
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">{t('prop.guests_label')}</label>
                <select id="guests-select" className="w-full text-sm font-medium bg-transparent outline-none dark:text-slate-200 dark:bg-slate-900">
                  {Array.from({ length: Number(property?.guests || 1) }, (_, i) => i + 1).map((num) => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>
            </div>

            <button onClick={handleBook} className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-teal-700/20">{t('prop.reserve')}</button>
            <p className="text-center text-xs text-slate-400 mt-3">{t('prop.no_charge')}</p>

            {/* Price breakdown */}
            <div className="mt-6 space-y-3">
              <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400"><span>{displayPrice(property?.pricePerNight || 0)} x {nights} nights</span><span>{displayPrice(totalPrice)}</span></div>
              {(property?.cleaning_fee || 0) > 0 && (
                <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400"><span>{t('prop.cleaning_fee')}</span><span>{displayPrice(property?.cleaning_fee || 0)}</span></div>
              )}
              <div className="flex justify-between font-bold text-slate-900 dark:text-white mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                <span>{t('prop.total')}</span>
                <span>{displayPrice(totalPrice + (property?.cleaning_fee || 0))}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cross-Sell Section */}
      <section id="cross-sell" className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-16 animate-fade-up">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">{t('cross.title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {crossSellServices.map(service => (
              <div key={service.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full">
                {/* Image Section */}
                <div className="h-48 overflow-hidden relative shrink-0">
                  <img
                    src={service.images?.[0] || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=500&auto=format&fit=crop'}
                    alt={service.title}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                  <div className="absolute top-3 left-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm z-10">
                    {service.type === 'tour' ? 'Tour' : 'Transfer'}
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-5 flex flex-col gap-3 flex-1">
                  <div className="min-h-[3rem]">
                    <h4 className="font-bold text-lg text-slate-900 dark:text-white leading-tight line-clamp-2">{service.title}</h4>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <span className="flex-1 truncate">{service.duration || 'Flexible duration'}</span>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between mt-auto">
                    <div className="flex flex-col">
                      <span className="text-xs text-slate-400 font-medium">From</span>
                      <span className="font-bold text-lg text-slate-900 dark:text-white">{displayPrice(service.price)}</span>
                    </div>
                    <button
                      onClick={() => navigate(`/book-tour?id=${service.id}`)}
                      className="px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-sm hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors shadow-sm"
                    >
                      {t('request_details')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Login Required Modal */}
      <Modal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} title="Login Required">
        <div className="flex flex-col gap-6 py-2">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 mb-4">
              <User size={32} />
            </div>
            <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
              {t('prop.login_to_contact') || 'Please log in to contact the host.'}
            </p>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowLoginModal(false)}
              className="px-5 py-2.5 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setShowLoginModal(false);
                document.dispatchEvent(new CustomEvent('open-login'));
              }}
              className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-lg shadow-teal-600/20 transition-all"
            >
              <LogIn size={18} />
              Log In
            </button>
          </div>
        </div>
      </Modal>

      {showChat && createPortal(<ChatWindow className="z-[100]" />, document.body)}
    </div>
  );
};

export default PropertyDetails;