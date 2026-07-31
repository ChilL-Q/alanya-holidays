import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';
import { ServiceType } from '../types/index';
import { useNavigate } from 'react-router-dom';
import { SEOHead } from '../components/seo/SEOHead';

interface StripeCheckoutItem {
    bookingId: string;
    listingId: string;
    title: string;
    price: number;
    image?: string;
    type: string;
}
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { bookingsService } from '../api-services';
import { supabase } from '../api-services/supabase';
import { getBaseUrl } from '../utils/appUrl';
import { toast } from 'react-hot-toast';

// Modular Components
import { CheckoutSuccessView } from '../components/checkout/CheckoutSuccessView';
import { CheckoutBasket } from '../components/checkout/CheckoutBasket';
import { CheckoutWelcomePack } from '../components/checkout/CheckoutWelcomePack';
import { CheckoutPaymentSection } from '../components/checkout/CheckoutPaymentSection';
import { CheckoutOrderSummary } from '../components/checkout/CheckoutOrderSummary';

export const Checkout: React.FC = () => {
    const { items, total, removeFromCart, addToCart, clearCart } = useCart();
    const { t } = useLanguage();
    const { convertPrice, formatPrice, currency } = useCurrency();
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [isProcessing, setIsProcessing] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank' | 'crypto' | 'cash' | 'swift'>('card');

    const handlePayment = async () => {
        if (!isAuthenticated) {
            toast.error("Please login to complete booking");
            return;
        }

        setIsProcessing(true);

        try {
            const bookingItemsForStripe: StripeCheckoutItem[] = [];
            const wpItem = items.find(i => i.id === 'rec-2');
            let wpHandled = false;

            const bookingItems = items.filter(i => i.id !== 'rec-2');

            for (const item of bookingItems) {
                let bookingStatus: 'confirmed' | 'pending' = 'pending';
                let paymentStatus: 'paid' | 'pending' = 'pending';

                if (paymentMethod === 'card' || paymentMethod === 'cash') {
                    bookingStatus = 'pending';
                    paymentStatus = 'pending';
                }

                let extraMessage = '';
                let bookingTotalPrice = item.price;

                if (!wpHandled && wpItem && (item.type === 'RENTAL' || item.type === 'property')) {
                    extraMessage = `\n\n[EXTRAS]: Includes Welcome Pack (Essentials) - €${wpItem.price}. Please prepare fridge.`;
                    bookingTotalPrice += wpItem.price;
                    wpHandled = true;
                }

                const result = await bookingsService.createBooking({
                    user_id: user!.id,
                    item_id: item.id,
                    type: (item.type === 'RENTAL' || item.type === 'property') ? 'property' : item.type === 'product' ? 'product' : 'service',
                    status: bookingStatus,
                    payment_method: paymentMethod,
                    payment_status: paymentStatus,
                    check_in: item.startDate || item.date || new Date().toISOString(),
                    check_out: item.endDate || item.date || new Date(Date.now() + 86400000).toISOString(),
                    total_price: bookingTotalPrice,
                    guests: item.guests || 1,
                    message: extraMessage
                });

                if (result && result.id && (paymentMethod === 'card' || paymentMethod === 'cash')) {
                    const isDeposit = paymentMethod === 'cash';

                    bookingItemsForStripe.push({
                        bookingId: result.id,
                        listingId: item.id,
                        title: isDeposit ? `Deposit (20%): ${item.title}` : item.title,
                        price: isDeposit ? item.price * 0.2 : item.price,
                        image: item.image,
                        type: item.type === 'RENTAL' ? 'property' : item.type
                    });

                    if (wpHandled && wpItem && (item.type === 'RENTAL' || item.type === 'property')) {
                        bookingItemsForStripe.push({
                            bookingId: result.id,
                            listingId: wpItem.id,
                            title: isDeposit ? `Deposit (20%): ${wpItem.title}` : wpItem.title,
                            price: isDeposit ? wpItem.price * 0.2 : wpItem.price,
                            image: wpItem.image,
                            type: 'welcome_pack'
                        });
                    }
                }
            }

            if ((paymentMethod === 'card' || paymentMethod === 'cash') && bookingItemsForStripe.length > 0) {
                const { data, error } = await supabase.functions.invoke('create-checkout-session', {
                    body: {
                        items: bookingItemsForStripe,
                        userId: user!.id,
                        email: user!.email,
                        origin: getBaseUrl()
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

        } catch (error: unknown) {
            console.error("Booking error:", error);
            const message = error instanceof Error
                ? error.message
                : (error as { message?: string })?.message ?? "Payment failed. Please try again.";
            toast.error(message);
        } finally {
            setIsProcessing(false);
        }
    };

    if (showSuccess) {
        return <CheckoutSuccessView />;
    }

    const convertAndFormat = (amount: number, fromCurrency: 'USD' | 'EUR' = 'EUR') => {
        return formatPrice(convertPrice(amount, fromCurrency));
    };

    const handleAddWelcomePack = () => {
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
    };

    const isWelcomePackAdded = items.some(i => i.id === 'rec-2');

    return (
        <>
        <SEOHead title="Checkout | Alanya Holidays" noIndex />
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-12 pb-24">
            <div className="max-w-4xl mx-auto px-4">
                <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-white mb-8">{t('checkout.title')}</h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-6 animate-fade-up">
                        <CheckoutBasket
                            items={items}
                            removeFromCart={removeFromCart}
                            convertAndFormat={convertAndFormat}
                        />

                        <CheckoutWelcomePack
                            isAdded={isWelcomePackAdded}
                            onAdd={handleAddWelcomePack}
                        />

                        <CheckoutPaymentSection
                            paymentMethod={paymentMethod}
                            setPaymentMethod={setPaymentMethod}
                            total={total}
                            convertAndFormat={convertAndFormat}
                            onPay={handlePayment}
                            isProcessing={isProcessing}
                            isDisabled={items.length === 0}
                        />
                    </div>

                    <div className="md:col-span-1 animate-fade-up">
                        <CheckoutOrderSummary
                            items={items}
                            total={total}
                            currency={currency}
                            convertAndFormat={convertAndFormat}
                        />
                    </div>
                </div>
            </div>
        </div>
        </>
    );
};
