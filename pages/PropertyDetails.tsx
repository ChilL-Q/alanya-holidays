import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, MapPin, User, Users, BedDouble, ShieldCheck, CheckCircle, Car, Camera, ArrowRight, DoorOpen, Bath, LogIn } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { ServiceType } from '../types/index';
import { useLanguage } from '../context/LanguageContext';
import { Map } from '../components/ui/Map';
import { useLightbox } from '../context/LightboxContext';
import { useChat } from '../context/ChatContext';
import { ChatWindow } from '../components/chat/ChatWindow';
import { MessageCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { db } from '../services';
import { Property, Amenity } from '../types/models';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { enGB, ru, tr } from 'date-fns/locale';
import { IMaskInput } from 'react-imask';
import { ReviewsSection } from '../components/reviews/ReviewsSection';
import toast from 'react-hot-toast';
import { Modal } from '../components/ui/Modal';

interface PropertyDetailsData extends Property {
  // Extending Property from models.ts ensuring consistency.
  address?: string;
  host?: any; // Using any or UserProfile to avoid deep type issues for now, or import UserProfile
  host_id?: string;
}

// Custom Masked Input Component
const DateInputMask = React.forwardRef<HTMLInputElement, any>((props, ref) => (
  <IMaskInput
    {...props}
    mask="00.00.0000"
    definitions={{
      '0': /[0-9]/
    }}
    inputRef={ref}
    overwrite
  />
));

// CURATED FALLBACK IMAGES
const PREMIUM_GRID_IMAGES = [
  'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&auto=format&fit=crop', // Modern Kitchen
  'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&auto=format&fit=crop', // Bright Living Room
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop', // Master Bedroom
  'https://images.unsplash.com/photo-1613545325278-f24b0cae1224?w=800&auto=format&fit=crop', // Elegant Interior
];

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
          let normalizedData: PropertyDetailsData = {
            id: data.id,
            title: data.title,
            description: data.description,
            location: data.location,
            address: data.address || '',
            latitude: data.latitude,
            longitude: data.longitude,
            pricePerNight: data.price_per_night,
            images: data.images,
            image: data.images[0],
            rating: data.rating || 0,
            reviewsCount: data.reviews_count || 0,
            guests: data.max_guests || 0,
            bedrooms: data.bedrooms || 0,
            beds: data.beds || 0,
            bathrooms: data.bathrooms || 0,
            hostName: data.host?.full_name || 'Alanya Holidays',
            amenities: Array.isArray(data.amenities)
              ? data.amenities.map((a: string | Amenity) => typeof a === 'string' ? { label: a, icon: 'CheckCircle' } : a)
              : [],
            host: data.host,
            type: data.type
          } as unknown as PropertyDetailsData;

          // Manually ensuring all required Property fields are present if needed
          // The casting above handles the transition from DB type to UI type

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
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-slate-500">Loading property details...</div>
      </div>
    );
  }

  if (!property) {
    return <div className="p-20 text-center text-slate-500">Property not found</div>;
  }

  const totalPrice = (property.pricePerNight || 0) * nights;

  // Helper for consistent price display
  const displayPrice = (amount: number) => formatPrice(convertPrice(amount, 'EUR'));

  const handleBook = () => {
    addToCart({
      id: property.id,
      type: 'property',
      title: property.title,
      price: totalPrice,
      image: property.images?.[0],
      details: `${nights} nights`,
      startDate: checkIn ? `${checkIn.getFullYear()}-${String(checkIn.getMonth() + 1).padStart(2, '0')}-${String(checkIn.getDate()).padStart(2, '0')}` : undefined,
      endDate: checkOut ? `${checkOut.getFullYear()}-${String(checkOut.getMonth() + 1).padStart(2, '0')}-${String(checkOut.getDate()).padStart(2, '0')}` : undefined,
      guests: Number(document.querySelector<HTMLSelectElement>('#guests-select')?.value || 1)
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
      {/* Gallery Grid - Force 2 cols on md+ with strict Height Enforcement */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 h-[400px] md:h-[500px] relative animate-fade-in text-white overflow-hidden">

        {/* Left: Main Image */}
        <div
          className="relative h-full w-full overflow-hidden group cursor-zoom-in"
          onClick={() => openLightbox(property.images, 0)}
        >
          <img
            src={(property.images?.[0] && !imageErrors[0]) ? property.images[0] : MAIN_FALLBACK}
            className="w-full h-full object-cover block transition-transform duration-700 group-hover:scale-105"
            alt="Main"
            onError={() => setImageErrors(prev => ({ ...prev, 0: true }))}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>

          {/* Glassmorphism Title Card */}
          <div
            className="absolute bottom-4 left-4 right-4 md:bottom-6 md:left-6 md:right-auto max-w-lg cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white/65 dark:bg-slate-900/65 backdrop-blur-md p-4 md:p-6 rounded-2xl shadow-xl border border-white/20">
              <h1 className="text-2xl md:text-3xl font-serif font-bold text-primary dark:text-white mb-2 leading-tight">
                {property.title}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-slate-600 dark:text-slate-300 text-sm font-medium">
                <span className="flex items-center gap-1.5"><MapPin size={16} className="text-accent" /> {property.address || property.location}</span>
                <span className="flex items-center gap-1.5"><Star size={16} className="fill-orange-400 text-orange-400" /> {property.reviewsCount > 0 ? `${(property.rating || 5.0).toFixed(1)} (${property.reviewsCount} reviews)` : <span className="text-sm font-bold bg-teal-600 text-white px-2 py-0.5 rounded-md">New</span>}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Grid of 4 images */}
        <div className="grid grid-cols-2 grid-rows-2 gap-2 h-full overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => {
            const imgIndex = i + 1;
            const isLast = i === 3;
            // Mixed Source: Real images prioritized, Premium fallback if missing
            const realImg = property.images?.[imgIndex];
            const displaySrc = (realImg && !imageErrors[imgIndex]) ? realImg : PREMIUM_GRID_IMAGES[i];

            // Allow clicking to open lightbox even if using fallback (it will just show what's available)
            const remainingCount = Math.max(0, (property.images?.length || 0) - 5);

            return (
              <div
                key={i}
                className="relative overflow-hidden group h-full cursor-zoom-in bg-slate-200 dark:bg-slate-800"
                onClick={() => openLightbox(property.images, imgIndex)}
              >
                <img
                  src={displaySrc}
                  className="w-full h-full object-cover block transition-transform duration-700 group-hover:scale-105"
                  alt={`Gallery ${i}`}
                  onError={() => setImageErrors(prev => ({ ...prev, [imgIndex]: true }))}
                />

                {/* Overlay for Last Image */}
                {isLast && (
                  <div className="absolute inset-0 flex items-center justify-center transition-colors z-10 text-white font-medium cursor-pointer">
                    {remainingCount > 0 ? (
                      <div className="w-full h-full bg-black/50 hover:bg-black/60 flex items-center justify-center text-lg">
                        +{remainingCount} more
                      </div>
                    ) : (
                      <div className="w-full h-full bg-black/30 hover:bg-black/50 flex items-center justify-center gap-2">
                        <Camera size={20} />
                        {t('prop.view_photos')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 mt-2 grid grid-cols-1 lg:grid-cols-3 gap-12">

        {/* Left Column: Info */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-2">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center gap-2">
              <Users size={24} className="text-accent" />
              <span className="text-sm font-bold text-slate-900 dark:text-white">{property.guests} Guests</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center gap-2">
              <DoorOpen size={24} className="text-accent" />
              <span className="text-sm font-bold text-slate-900 dark:text-white">{property.bedrooms} Bedrooms</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center gap-2">
              <BedDouble size={24} className="text-accent" />
              <span className="text-sm font-bold text-slate-900 dark:text-white">{property.beds} Beds</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center gap-2">
              <Bath size={24} className="text-accent" />
              <span className="text-sm font-bold text-slate-900 dark:text-white">{property.bathrooms} Baths</span>
            </div>
          </div>

          <div className="py-4 border-y border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400">
                <User size={24} />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">{t('prop.hosted_by')} {property.hostName}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{t('prop.verified_host')} • {t('prop.superhost')}</p>
                {property.host && (property.host.email || property.host.phone) && (
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
                  setShowLoginModal(true); // Show manual modal 
                  return;
                }
                if (property.host_id) {
                  startConversation(property.id, property.host_id);
                  setShowChat(true);
                }
              }}
              className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-medium rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 shrink-0 ml-auto z-10 ring-2 ring-transparent hover:ring-slate-900 dark:hover:ring-white ring-offset-2"
            >
              <MessageCircle size={18} />
              Contact Host
            </button>
          </div>

          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{t('prop.about')}</h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{property.description || 'No description provided.'}</p>
          </div>

          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{t('prop.offers')}</h3>
            <div className="grid grid-cols-2 gap-4">
              {property.amenities.map((am: Amenity, i: number) => (
                <div key={i} className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 text-xs">
                    <CheckCircle size={16} />
                  </div>
                  {t(am.label)}
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

          {/* Reviews Section Integration */}
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
                <span className="text-2xl font-bold text-slate-900 dark:text-white">{displayPrice(property.pricePerNight)}</span>
                <span className="text-slate-500 dark:text-slate-400 text-sm"> {t('featured.night')}</span>
              </div>
              <div
                className="flex items-center gap-1 text-xs font-semibold text-slate-900 dark:text-white underline cursor-pointer"
                onClick={() => {
                  document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                {property.reviewsCount > 0 ? (
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
                  <DatePicker selected={checkIn} onChange={setCheckIn} selectsStart startDate={checkIn} endDate={checkOut} minDate={new Date()} excludeDates={blockedDates} placeholderText={t('date_format')} dateFormat="dd.MM.yyyy" customInput={<DateInputMask className="w-full text-sm font-medium bg-transparent outline-none dark:text-slate-200 placeholder-slate-400" />} />
                </div>
                <div className="p-3">
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">{t('prop.checkout')}</label>
                  <DatePicker selected={checkOut} onChange={setCheckOut} selectsEnd startDate={checkIn} endDate={checkOut} minDate={checkIn || new Date()} excludeDates={blockedDates} placeholderText={t('date_format')} dateFormat="dd.MM.yyyy" customInput={<DateInputMask className="w-full text-sm font-medium bg-transparent outline-none dark:text-slate-200 placeholder-slate-400" />} />
                </div>
              </div>
              <div className="p-3">
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">{t('prop.guests_label')}</label>
                <select id="guests-select" className="w-full text-sm font-medium bg-transparent outline-none dark:text-slate-200 dark:bg-slate-900">
                  {Array.from({ length: property.guests || 1 }, (_, i) => i + 1).map((num) => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>
            </div>

            <button onClick={handleBook} className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-teal-700/20">{t('prop.reserve')}</button>
            <p className="text-center text-xs text-slate-400 mt-3">{t('prop.no_charge')}</p>

            {/* Price breakdown */}
            <div className="mt-6 space-y-3">
              <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400"><span>{displayPrice(property.pricePerNight)} x {nights} nights</span><span>{displayPrice(totalPrice)}</span></div>
              <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400"><span>{t('prop.cleaning_fee')}</span><span>{displayPrice(40)}</span></div>
              <div className="flex justify-between font-bold text-slate-900 dark:text-white mt-4 pt-4 border-t border-slate-200 dark:border-slate-800"><span>{t('prop.total')}</span><span>{displayPrice(totalPrice + 40)}</span></div>
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
              <div key={service.id} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                <h4 className="font-bold mb-2">{service.title}</h4>
                <button onClick={() => handleAddService(service)} className="text-teal-600 font-semibold">{t('cross.add')}</button>
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