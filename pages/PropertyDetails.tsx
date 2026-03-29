import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { useChat } from '../context/ChatContext';
import { ChatWindow } from '../components/chat/ChatWindow';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { db } from '../api-services';
import "react-datepicker/dist/react-datepicker.css";
import { ReviewsSection } from '../components/reviews/ReviewsSection';
import toast from 'react-hot-toast';
import { Modal } from '../components/ui/Modal';
import { User, LogIn } from 'lucide-react';

// Modular Components
import { PropertyGallery } from '../components/properties/details/PropertyGallery';
import { PropertyHeader } from '../components/properties/details/PropertyHeader';
import { PropertyInfoBar } from '../components/properties/details/PropertyInfoBar';
import { PropertyHostCard } from '../components/properties/details/PropertyHostCard';
import { PropertyDescription } from '../components/properties/details/PropertyDescription';
import { PropertyAmenitiesList } from '../components/properties/details/PropertyAmenitiesList';
import { PropertyHospitalityGuide } from '../components/properties/details/PropertyHospitalityGuide';
import { PropertyBookingCard } from '../components/properties/details/PropertyBookingCard';
import { PropertyCrossSell } from '../components/properties/details/PropertyCrossSell';
import { Property } from '../types/models';

interface PropertyDetailsData extends Property {
    address?: string;
    host?: any;
    host_id?: string;
    hostAvatar?: string | null;
}

export const PropertyDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { t } = useLanguage();
    const { startConversation } = useChat();
    const { convertPrice, formatPrice } = useCurrency();
    const [showChat, setShowChat] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);

    const [property, setProperty] = useState<PropertyDetailsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [hasBooking, setHasBooking] = useState(false);
    const [nights, setNights] = useState(5);
    const { user, isAuthenticated } = useAuth();

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
                    const unavailable = await db.getUnavailableDates(normalizedData.id);
                    if (unavailable) {
                        setBlockedDates(unavailable.map((d: string) => new Date(d)));
                    }
                    const reviewCount = await db.getReviewCount(normalizedData.id);
                    setProperty(prev => prev ? { ...prev, reviewsCount: reviewCount } : null);

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
                const { data: cars } = await db.getServices('car', 1, 10);
                const { data: bikes } = await db.getServices('bike', 1, 10);
                const rentals = [...(cars || []), ...(bikes || [])];
                const randomRental = rentals.length > 0 ? rentals[Math.floor(Math.random() * rentals.length)] : null;

                const { data: tours } = await db.getServices('tour', 1, 10);
                const randomTour = (tours && tours.length > 0) ? tours[Math.floor(Math.random() * tours.length)] : null;

                const { data: visas } = await db.getServices('visa', 1, 10);
                const { data: esims } = await db.getServices('esim', 1, 10);
                const consulting = [...(visas || []), ...(esims || [])];
                const randomConsulting = consulting.length > 0 ? consulting[Math.floor(Math.random() * consulting.length)] : null;

                const selected = [randomRental, randomTour, randomConsulting].filter(Boolean);
                const selectedIds = new Set(selected.map(s => s.id));
                const allPool = [...rentals, ...(tours || []), ...consulting].filter(s => !selectedIds.has(s.id));

                while (selected.length < 3 && allPool.length > 0) {
                    const randomIndex = Math.floor(Math.random() * allPool.length);
                    selected.push(allPool[randomIndex]);
                    allPool.splice(randomIndex, 1);
                }
                setCrossSellServices(selected);
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
                <button onClick={() => window.history.back()} className="mt-4 text-teal-600 dark:text-cyan-400 underline">Go Back</button>
            </div>
        );
    }

    const displayPrice = (amount: number) => {
        const converted = convertPrice(amount || 0, 'EUR');
        return formatPrice(converted);
    };

    const handleBook = () => {
        addToCart({
            id: property.id,
            type: 'property',
            title: property.title,
            price: (property.pricePerNight * nights) + (property.cleaning_fee || 0),
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

    const handleContactHost = () => {
        if (!isAuthenticated) {
            setShowLoginModal(true);
            return;
        }
        if (property?.host_id) {
            startConversation(property.id, property.host_id);
            setShowChat(true);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 transition-colors">
            <PropertyGallery
                images={property.images || []}
                title={property.title}
                location={property.address || property.location || 'No location'}
                rating={property.rating || 5.0}
                reviewsCount={property.reviewsCount || 0}
            />

            <PropertyHeader
                title={property.title}
                location={property.address || property.location || 'No location'}
                rating={property.rating || 5.0}
                reviewsCount={property.reviewsCount || 0}
            />

            <div className="max-w-7xl mx-auto px-4 py-8 mt-2 grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-4">
                    <PropertyInfoBar
                        guests={property.guests}
                        bedrooms={property.bedrooms}
                        beds={property.beds}
                        bathrooms={property.bathrooms}
                    />

                    <PropertyHostCard
                        hostName={property.hostName}
                        hostAvatar={property.hostAvatar}
                        onContact={handleContactHost}
                    />

                    <PropertyDescription description={property.description} />

                    <PropertyAmenitiesList amenities={property.amenities} />

                    {hasBooking && <PropertyHospitalityGuide />}

                    {property.id && <ReviewsSection propertyId={property.id} />}
                </div>

                <PropertyBookingCard
                    pricePerNight={property.pricePerNight}
                    reviewsCount={property.reviewsCount}
                    rating={property.rating}
                    checkIn={checkIn}
                    checkOut={checkOut}
                    setCheckIn={setCheckIn}
                    setCheckOut={setCheckOut}
                    blockedDates={blockedDates}
                    guestsCount={1}
                    maxGuests={property.guests}
                    onBook={handleBook}
                    nights={nights}
                    cleaningFee={property.cleaning_fee || 0}
                    displayPrice={displayPrice}
                />
            </div>

            <PropertyCrossSell
                services={crossSellServices}
                onNavigate={(id) => navigate(`/book-tour/${id}`)}
                displayPrice={displayPrice}
            />

            <Modal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} title="Login Required">
                <div className="flex flex-col gap-6 py-2">
                    <div className="text-center">
                        <div className="mx-auto w-16 h-16 bg-slate-100 dark:bg-slate-800/80 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 mb-4">
                            <User size={32} />
                        </div>
                        <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
                            {t('prop.login_to_contact') || 'Please log in to contact the host.'}
                        </p>
                    </div>
                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={() => setShowLoginModal(false)}
                            className="px-5 py-2.5 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-100 dark:hover:bg-slate-800/90 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                setShowLoginModal(false);
                                document.dispatchEvent(new CustomEvent('open-login'));
                            }}
                            className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 dark:bg-cyan-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-lg shadow-teal-600/20 transition-all"
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
