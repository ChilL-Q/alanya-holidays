import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import { db } from '../api-services';
import { useNavigate } from 'react-router-dom';
import { PropertyFormData, PropertyDB } from '../types/models';
import toast from 'react-hot-toast';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { useSubmitShortcut } from '../hooks/useSubmitShortcut';
import { Button } from '../components/ui/Button';
import { SEOHead } from '../components/seo/SEOHead';

// UI Components
import { StepsIndicator } from '../components/ui/StepsIndicator';

// Modular Components
import { ListPropertyHero } from '../components/host/properties/ListPropertyHero';
import { ListPropertySuccess } from '../components/host/properties/ListPropertySuccess';
import { PropertyTypeStep } from '../components/host/properties/steps/PropertyTypeStep';
import { PropertyLocation } from '../components/host/properties/steps/PropertyLocation';
import { PropertyBasicsStep } from '../components/host/properties/steps/PropertyBasicsStep';
import { PropertyAmenities } from '../components/host/properties/steps/PropertyAmenities';
import { PropertyPhotosStep } from '../components/host/properties/steps/PropertyPhotosStep';
import { PropertyDescriptionStep } from '../components/host/properties/steps/PropertyDescriptionStep';
import { PropertyPricingStep } from '../components/host/properties/steps/PropertyPricingStep';

const STEPS = [
    'list_prop.steps.type',
    'list_prop.steps.location',
    'list_prop.steps.basics',
    'list_prop.steps.amenities',
    'list_prop.steps.photos',
    'list_prop.steps.desc',
    'list_prop.steps.pricing'
];

export const ListProperty: React.FC = () => {
    const { t } = useLanguage();
    const { isAuthenticated, user } = useAuth();
    const { openRegister, openLogin } = useModal();
    const navigate = useNavigate();

    const [step, setStep] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // Form Data
    const [files, setFiles] = useState<File[]>([]);
    const [formData, setFormData] = useState<PropertyFormData>({
        title: '',
        description: '',
        price: '',
        cleaningFee: '',
        type: '',
        propertyType: '',
        maxGuests: 4,
        bedrooms: 2,
        beds: 2,
        bathrooms: 1,
        location: '',
        address: '',
        latitude: null,
        longitude: null,
        rentalLicense: '',
        pricePerNight: 0,
        amenities: [] as string[],
        // Hospitality details
        checkInTime: '',
        checkOutTime: '',
        checkInMethod: '',
        wifiDetails: '',
        arrivalGuide: '',
        houseManual: '',
        houseRules: '',
        checkoutInstructions: '',
        guidebooks: '',
        interactionPreferences: '',
        promotionPrice: undefined,
        promotionDescription: '',
        icalUrl: ''
    });
    const [showRestoreBanner, setShowRestoreBanner] = useState(false);
    const [savedDraft, setSavedDraft] = useState<PropertyFormData | null>(null);

    // Load draft on mount
    React.useEffect(() => {
        const draftStr = localStorage.getItem('draft_property_listing');
        if (draftStr) {
            try {
                const parsed = JSON.parse(draftStr);
                if (parsed && typeof parsed === 'object') {
                    const hasContent = Object.entries(parsed).some(
                        ([key, val]) =>
                            key !== 'updatedAt' &&
                            ((typeof val === 'string' && val.trim().length > 0) ||
                                (typeof val === 'number' && val > 0) ||
                                (Array.isArray(val) && val.length > 0))
                    );
                    if (hasContent) {
                        setSavedDraft(parsed);
                        setShowRestoreBanner(true);
                    }
                }
            } catch (e) {
                console.error('Failed to parse draft:', e);
            }
        }
    }, []);

    // Save draft on formData change
    React.useEffect(() => {
        const hasContent = Object.entries(formData).some(
            ([key, val]) =>
                key !== 'maxGuests' &&
                key !== 'bedrooms' &&
                key !== 'beds' &&
                key !== 'bathrooms' &&
                key !== 'pricePerNight' &&
                ((typeof val === 'string' && val.trim().length > 0) ||
                    (typeof val === 'number' && val > 0) ||
                    (Array.isArray(val) && val.length > 0))
        );
        if (hasContent) {
            localStorage.setItem(
                'draft_property_listing',
                JSON.stringify({
                    ...formData,
                    updatedAt: new Date().toISOString(),
                })
            );
        }
    }, [formData]);

    const handleRestoreDraft = () => {
        if (savedDraft) {
            const { updatedAt: _, ...rest } = savedDraft as any;
            setFormData(rest);
            toast.success('Unsaved progress restored!');
        }
        setShowRestoreBanner(false);
    };

    const handleDiscardDraft = () => {
        localStorage.removeItem('draft_property_listing');
        setShowRestoreBanner(false);
        toast.success('Draft discarded');
    };
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const nextStep = () => {
        if (step === 0 && !formData.propertyType) return toast.error(t('list_prop.error.type'));
        if (step === 1 && !formData.location) return toast.error(t('list_prop.error.location'));
        if (step === 4 && files.length < 1) return toast.error(t('list_prop.error.photo'));
        if (step === 5) {
            if (!formData.title || formData.title.length < 5) return toast.error(t('Title must be at least 5 characters'));
        }

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
        if (!user) return toast.error(t('auth.required'));
        if (!formData.price) return toast.error(t('list_prop.error.price'));

        setIsLoading(true);
        try {
            const imageUrls: string[] = [];
            for (const file of files) {
                const url = await db.uploadImage(file, 'properties');
                if (url) imageUrls.push(url);
            }

            await db.createProperty({
                title: formData.title,
                description: formData.description,
                price_per_night: parseFloat(String(formData.price || 0)),
                location: formData.location,
                address: formData.address,
                type: formData.propertyType as PropertyDB['type'],
                cleaning_fee: formData.cleaningFee ? parseFloat(String(formData.cleaningFee)) : undefined,
                max_guests: formData.maxGuests,
                bedrooms: formData.bedrooms,
                beds: formData.beds,
                bathrooms: formData.bathrooms,
                amenities: formData.amenities,
                images: imageUrls,
                host_id: user.id,
                check_in_time: formData.checkInTime,
                check_out_time: formData.checkOutTime,
                check_in_method: formData.checkInMethod,
                wifi_details: formData.wifiDetails,
                arrival_guide: formData.arrivalGuide,
                house_manual: formData.houseManual,
                house_rules: formData.houseRules,
                checkout_instructions: formData.checkoutInstructions,
                guidebooks: formData.guidebooks,
                interaction_preferences: formData.interactionPreferences,
                is_promoted: !!formData.promotionPrice,
                promotion_price: formData.promotionPrice ? parseFloat(String(formData.promotionPrice)) : undefined,
                promotion_description: formData.promotionDescription,
                status: 'pending'
            });

            localStorage.removeItem('draft_property_listing');
            setIsSuccess(true);
            window.scrollTo(0, 0);
        } catch (error) {
            console.error(error);
            toast.error(t('error.generic'));
        } finally {
            setIsLoading(false);
        }
    };

    useSubmitShortcut(() => {
        if (step === STEPS.length - 1) {
            handleSubmit();
        } else {
            nextStep();
        }
    });

    if (!isAuthenticated) {
        return <ListPropertyHero onRegister={openRegister} onLogin={openLogin} />;
    }

    if (isSuccess) {
        return <ListPropertySuccess onReturnHome={() => navigate('/')} />;
    }

    const renderStep = () => {
        switch (step) {
            case 0: return <PropertyTypeStep propertyType={formData.propertyType} onChange={(type) => setFormData({ ...formData, propertyType: type })} />;
            case 1: return <PropertyLocation formData={formData} handleChange={handleChange} setFormData={setFormData} />;
            case 2: return <PropertyBasicsStep formData={formData} setFormData={setFormData} />;
            case 3: return <PropertyAmenities formData={formData} setFormData={setFormData} />;
            case 4: return <PropertyPhotosStep files={files} setFiles={setFiles} />;
            case 5: return <PropertyDescriptionStep formData={formData} handleChange={handleChange} />;
            case 6: return <PropertyPricingStep formData={formData} handleChange={handleChange} />;
            default: return null;
        }
    };

    return (
        <>
        <SEOHead
            title="List Your Property | Alanya Holidays"
            description="List your property on Alanya Holidays and reach thousands of travelers. Easy setup, zero fees."
            keywords={['list property alanya', 'rent property alanya', 'alanya property listing']}
            noIndex
        />
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-10 px-4 transition-colors">
            <div className="max-w-3xl mx-auto">
                {showRestoreBanner && (
                    <div className="mb-8 bg-teal-50/80 dark:bg-teal-900/20 backdrop-blur-md border border-teal-200 dark:border-teal-800/50 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="flex items-start gap-3 w-full sm:w-auto text-left">
                            <div className="p-2 bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400 rounded-xl">
                                <Sparkles size={20} />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Unsaved draft found</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    We saved your progress from {savedDraft && (savedDraft as any).updatedAt ? new Date((savedDraft as any).updatedAt).toLocaleString() : 'recently'}.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                            <button
                                type="button"
                                onClick={handleDiscardDraft}
                                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                            >
                                Discard
                            </button>
                            <button
                                type="button"
                                onClick={handleRestoreDraft}
                                className="px-4 py-2 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-xl transition-all shadow-md shadow-teal-600/10 active:scale-95"
                            >
                                Restore Draft
                            </button>
                        </div>
                    </div>
                )}
                <div className="mb-8">
                    <StepsIndicator currentStep={step} totalSteps={STEPS.length} labels={STEPS.map(s => t(s))} />
                </div>

                <div className="bg-white dark:bg-slate-800/80 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800/50 overflow-hidden min-h-[500px] flex flex-col">
                    <div className="p-8 flex-grow">
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {renderStep()}
                        </div>
                    </div>

                    <div className="p-6 border-t border-slate-100 dark:border-slate-800/50 bg-white dark:bg-slate-800/80 flex justify-between items-center">
                        <button
                            onClick={prevStep}
                            disabled={step === 0}
                            className={`flex items-center gap-2 font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors ${step === 0 ? 'opacity-0 pointer-events-none' : ''}`}
                        >
                            <ArrowLeft size={18} />
                            {t('list_prop.back')}
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
                                    {t('list_prop.publish')}
                                </Button>
                            ) : (
                                <Button
                                    onClick={nextStep}
                                    variant="secondary"
                                    size="lg"
                                    className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-white dark:hover:bg-slate-200 gap-2"
                                >
                                    {t('list_prop.next')}
                                    <ArrowRight size={18} />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </>
    );
};
