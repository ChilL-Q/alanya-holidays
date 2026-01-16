import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import { db } from '../services/db';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    ShieldCheck,
    TrendingUp,
    Settings,
    CheckCircle,
    Lock,
    Home,
    Building2,
    ArrowLeft,
    ArrowRight,
    Save
} from 'lucide-react';
import { Button, buttonVariants, buttonBase } from '../components/ui/Button';
import { cn } from '../utils/cn';
import { AMENITIES_LIST } from '../data/constants';

// UI Components
import { StepsIndicator } from '../components/ui/StepsIndicator';
import { Counter } from '../components/ui/Counter';
import { PhotoUploader } from '../components/ui/PhotoUploader';

// Form Components (Reused)
import { PropertyLocation } from '../components/property-form/PropertyLocation';
import { PropertyAmenities } from '../components/property-form/PropertyAmenities';
import { PropertyHospitality } from '../components/property-form/PropertyHospitality';

const STEPS = [
    'Property Type',
    'Location',
    'Basics',
    'Amenities',
    'Photos',
    'Description',
    'Pricing & Rules'
];

export const ListProperty: React.FC = () => {
    const { t } = useLanguage();
    const { isAuthenticated, user } = useAuth();
    const { openRegister, openLogin } = useModal();
    const navigate = useNavigate();

    const [step, setStep] = useState(0);
    const [files, setFiles] = useState<File[]>([]);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Initial Form State
    const [formData, setFormData] = useState({
        // Type
        propertyType: 'apartment', // 'apartment' | 'villa' | 'hotel'
        rentalType: 'entire', // 'entire' | 'room' (Future proofing)
        // Description
        title: '',
        description: '',
        // Contact (Auto-filled)
        name: user?.name || '',
        email: user?.email || '',
        phone: '',
        // Location
        location: '',
        address: '',
        latitude: null as number | null,
        longitude: null as number | null,
        // Pricing
        price: '',
        // Details
        maxGuests: 2,
        bedrooms: 1,
        bathrooms: 1,
        beds: 1,
        amenities: [] as string[],
        rentalLicense: '',
        // Hospitality Details
        arrivalGuide: '',
        checkInTime: '14:00',
        checkOutTime: '11:00',
        directions: '',
        checkInMethod: '',
        wifiDetails: '',
        houseManual: '',
        houseRules: '',
        checkoutInstructions: '',
        guidebooks: '',
        interactionPreferences: '',
        icalUrl: '',
    });

    useEffect(() => {
        if (user && !formData.name) {
            setFormData(prev => ({
                ...prev,
                name: user.name || '',
                email: user.email || ''
            }));
        }
    }, [user, formData.name]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const nextStep = () => {
        // Validation per step could go here
        if (step === 0 && !formData.propertyType) return toast.error('Please select a property type');
        if (step === 1 && !formData.location) return toast.error('Please enter a location area');
        if (step === 4 && files.length < 1) return toast.error('Please upload at least 1 photo');
        if (step === 5 && !formData.title) return toast.error('Please enter a title');

        if (step < STEPS.length - 1) {
            setStep(step + 1);
            window.scrollTo(0, 0);
        }
    };

    const prevStep = () => {
        if (step > 0) {
            setStep(step - 1);
            window.scrollTo(0, 0);
        }
    };

    const handleSubmit = async () => {
        if (!isAuthenticated || !user) {
            toast.error(t('list.error.auth'));
            return;
        }

        if (!formData.price) {
            toast.error('Please enter a price');
            return;
        }

        setIsLoading(true);

        try {
            // Upload images
            const uploadedUrls = [];
            for (const file of files) {
                const url = await db.uploadPropertyImage(file);
                uploadedUrls.push(url);
            }

            await db.createProperty({
                title: formData.title,
                description: formData.description,
                price_per_night: Number(formData.price),
                location: formData.location,
                address: formData.address,
                latitude: formData.latitude || undefined,
                longitude: formData.longitude || undefined,
                type: formData.propertyType as 'villa' | 'apartment',
                host_id: user.id,
                rental_license: formData.rentalLicense,
                amenities: formData.amenities.map(label => {
                    const found = AMENITIES_LIST.find(a => a.label === label);
                    return found || { icon: 'box', label };
                }),
                images: uploadedUrls,
                // Hospitality Details
                arrival_guide: formData.arrivalGuide,
                check_in_time: formData.checkInTime,
                check_out_time: formData.checkOutTime,
                directions: formData.directions,
                check_in_method: formData.checkInMethod,
                wifi_details: formData.wifiDetails,
                house_manual: formData.houseManual,
                house_rules: formData.houseRules,
                checkout_instructions: formData.checkoutInstructions,
                guidebooks: formData.guidebooks,
                interaction_preferences: formData.interactionPreferences,
                ical_url: formData.icalUrl,
                max_guests: Number(formData.maxGuests),
                bedrooms: Number(formData.bedrooms),
                bathrooms: Number(formData.bathrooms),
                beds: Number(formData.beds)
            });

            toast.success(t('list.success'));
            setIsSubmitted(true);
        } catch (error: any) {
            console.error('Error listing property:', error);
            toast.error(t('list.error.submit'));
        } finally {
            setIsLoading(false);
        }
    };

    // Hero / Landing for Guests
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-white dark:bg-slate-900 pb-20">
                <div className="relative h-[60vh] min-h-[500px] flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0">
                        <img
                            src="https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=2671&auto=format&fit=crop"
                            alt="Alanya Luxury Property"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-900/50 to-slate-900/90"></div>
                    </div>
                    <div className="relative z-10 max-w-4xl mx-auto px-4 text-center animate-page-enter">
                        <h1 className="text-4xl md:text-6xl font-serif text-white mb-6 leading-tight" dangerouslySetInnerHTML={{ __html: t('list.hero.title') }} />
                        <p className="text-xl text-slate-200 mb-8 max-w-2xl mx-auto font-light">{t('list.hero.subtitle')}</p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button onClick={openRegister} variant="accent" size="lg" className="gap-2 shadow-lg shadow-accent/30">{t('auth.submit.register')}</Button>
                            <Button onClick={openLogin} variant="outline" size="lg" className="text-white border-white hover:bg-white hover:text-slate-900 font-medium">{t('auth.submit.login')}</Button>
                        </div>
                    </div>
                </div>
                {/* Benefits Grid - Keep existing simplified */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-20">
                    <div className="grid md:grid-cols-3 gap-8 mb-20">
                        {/* ... Simplified Benefits ... */}
                        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700">
                            <ShieldCheck size={32} className="text-teal-600 mb-4" />
                            <h3 className="text-xl font-bold dark:text-white mb-2">{t('list.benefit.verified.title')}</h3>
                            <p className="text-slate-600 dark:text-slate-400">{t('list.benefit.verified.desc')}</p>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700">
                            <Settings size={32} className="text-teal-600 mb-4" />
                            <h3 className="text-xl font-bold dark:text-white mb-2">{t('list.benefit.management.title')}</h3>
                            <p className="text-slate-600 dark:text-slate-400">{t('list.benefit.management.desc')}</p>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700">
                            <TrendingUp size={32} className="text-teal-600 mb-4" />
                            <h3 className="text-xl font-bold dark:text-white mb-2">{t('list.benefit.revenue.title')}</h3>
                            <p className="text-slate-600 dark:text-slate-400">{t('list.benefit.revenue.desc')}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-12 text-center border border-slate-100 dark:border-slate-700">
                    <div className="w-24 h-24 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-teal-600 dark:text-teal-400">
                        <CheckCircle size={48} />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Application Received!</h2>
                    <p className="text-slate-600 dark:text-slate-400 mb-8">Your property has been submitted. Our team will verify it within 24 hours.</p>
                    <Button onClick={() => navigate('/')} variant="primary" fullWidth>Return Home</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-10 px-4 transition-colors">
            <div className="max-w-3xl mx-auto">
                <div className="mb-8">
                    <StepsIndicator currentStep={step} totalSteps={STEPS.length} labels={STEPS} />
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden min-h-[500px] flex flex-col">
                    <div className="p-8 flex-grow">
                        {/* Step Content */}
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">

                            {/* Step 0: Type */}
                            {step === 0 && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">What kind of place will you host?</h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <button
                                            onClick={() => setFormData({ ...formData, propertyType: 'apartment' })}
                                            className={`p-6 rounded-2xl border-2 text-left transition-all ${formData.propertyType === 'apartment'
                                                    ? 'border-teal-600 bg-teal-50 dark:bg-teal-900/20 ring-1 ring-teal-600'
                                                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                                }`}
                                        >
                                            <Building2 size={32} className={`mb-4 ${formData.propertyType === 'apartment' ? 'text-teal-600' : 'text-slate-400'}`} />
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Apartment</h3>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">A flat in a multi-unit building or complex.</p>
                                        </button>

                                        <button
                                            onClick={() => setFormData({ ...formData, propertyType: 'villa' })}
                                            className={`p-6 rounded-2xl border-2 text-left transition-all ${formData.propertyType === 'villa'
                                                    ? 'border-teal-600 bg-teal-50 dark:bg-teal-900/20 ring-1 ring-teal-600'
                                                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                                }`}
                                        >
                                            <Home size={32} className={`mb-4 ${formData.propertyType === 'villa' ? 'text-teal-600' : 'text-slate-400'}`} />
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Villa</h3>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">A private house, often with outdoor space.</p>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Step 1: Location */}
                            {step === 1 && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Where is your place located?</h2>
                                    <PropertyLocation formData={formData} handleChange={handleChange} setFormData={setFormData} />
                                </div>
                            )}

                            {/* Step 2: Basics */}
                            {step === 2 && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Share some basics about your place</h2>
                                    <div className="max-w-md">
                                        <Counter
                                            label="Guests" subtitle="How many guests can stay?"
                                            value={formData.maxGuests} min={1} max={16}
                                            onChange={(v) => setFormData({ ...formData, maxGuests: v })}
                                        />
                                        <Counter
                                            label="Bedrooms"
                                            value={formData.bedrooms} min={0} max={10}
                                            onChange={(v) => setFormData({ ...formData, bedrooms: v })}
                                        />
                                        <Counter
                                            label="Beds"
                                            value={formData.beds} min={1} max={20}
                                            onChange={(v) => setFormData({ ...formData, beds: v })}
                                        />
                                        <Counter
                                            label="Bathrooms"
                                            value={formData.bathrooms} min={1} max={10}
                                            onChange={(v) => setFormData({ ...formData, bathrooms: v })}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Amenities */}
                            {step === 3 && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">What does your place offer?</h2>
                                    <PropertyAmenities formData={formData} setFormData={setFormData} />
                                </div>
                            )}

                            {/* Step 4: Photos */}
                            {step === 4 && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Add some photos of your place</h2>
                                    <p className="text-slate-500 dark:text-slate-400">You'll need at least 1 photo to get started. You can add more later.</p>
                                    <PhotoUploader files={files} onChange={setFiles} />
                                </div>
                            )}

                            {/* Step 5: Description */}
                            {step === 5 && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Now, let's describe your place</h2>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Create a title</label>
                                        <input
                                            name="title"
                                            value={formData.title}
                                            onChange={handleChange}
                                            placeholder="e.g. Modern Villa with Sea View"
                                            maxLength={50}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-600 outline-none font-bold text-lg"
                                        />
                                        <p className="text-right text-xs text-slate-400 mt-1">{formData.title.length}/50</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Create a description</label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleChange}
                                            rows={6}
                                            placeholder="Share what makes your place special..."
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-600 outline-none resize-none"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Step 6: Pricing & hospitality */}
                            {step === 6 && (
                                <div className="space-y-8">
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Price & Rules</h2>
                                        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Now, set your price</label>
                                            <div className="relative max-w-xs">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-lg">€</span>
                                                <input
                                                    type="number"
                                                    name="price"
                                                    value={formData.price}
                                                    onChange={handleChange}
                                                    className="w-full pl-10 pr-4 py-4 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-0 focus:border-teal-600 outline-none font-bold text-3xl"
                                                />
                                            </div>
                                            <p className="text-sm text-slate-500 mt-2">Per night</p>
                                        </div>
                                    </div>

                                    <PropertyHospitality formData={formData} handleChange={handleChange} />
                                </div>
                            )}

                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex justify-between items-center">
                        <button
                            onClick={prevStep}
                            disabled={step === 0}
                            className={`flex items-center gap-2 font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors ${step === 0 ? 'opacity-0 pointer-events-none' : ''}`}
                        >
                            <ArrowLeft size={18} />
                            Back
                        </button>

                        <div className="flex gap-4">
                            {step === STEPS.length - 1 ? (
                                <Button
                                    onClick={handleSubmit}
                                    isLoading={isLoading}
                                    variant="accent"
                                    size="lg"
                                    className="px-8"
                                >
                                    Publish Listing
                                </Button>
                            ) : (
                                <Button
                                    onClick={nextStep}
                                    variant="secondary"
                                    size="lg"
                                    className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 gap-2"
                                >
                                    Next
                                    <ArrowRight size={18} />
                                </Button>
                            )}
                        </div>
                    </div>
                    {/* Progress Bar fixed bottom mobile? (Optional, skipping for now as StepsIndicator has it) */}
                </div>
            </div>
        </div>
    );
};
