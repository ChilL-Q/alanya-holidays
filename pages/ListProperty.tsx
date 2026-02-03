import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import { db } from '../services';
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
import { useSubmitShortcut } from '../hooks/useSubmitShortcut';
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
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        cleaningFee: '',
        propertyType: '',
        maxGuests: 4,
        bedrooms: 2,
        beds: 2,
        bathrooms: 1,
        location: '',
        address: '',
        rentalLicense: '', // Optional
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
        interactionPreferences: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    useSubmitShortcut(() => {
        if (step === STEPS.length - 1) {
            handleSubmit();
        } else {
            nextStep();
        }
    });

    const nextStep = () => {
        // Validation per step could go here
        if (step === 0 && !formData.propertyType) return toast.error(t('list_prop.error.type'));
        if (step === 1 && !formData.location) return toast.error(t('list_prop.error.location'));
        if (step === 4 && files.length < 1) return toast.error(t('list_prop.error.photo'));
        if (step === 5) {
            if (!formData.title || formData.title.length < 5) return toast.error(t('Title must be at least 5 characters'));
            if (!formData.description || formData.description.length < 20) return toast.error(t('Description must be at least 20 characters'));
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

        if (!formData.price) {
            toast.error(t('list_prop.error.price'));
            return;
        }

        setIsLoading(true);
        try {
            // Upload images first
            const imageUrls: string[] = [];
            for (const file of files) {
                const url = await db.uploadImage(file, 'properties');
                if (url) imageUrls.push(url);
            }

            // Create property
            // Map form data to PropertyDB shape
            await db.createProperty({
                title: formData.title,
                description: formData.description,
                price_per_night: parseFloat(formData.price),
                location: formData.location,
                address: formData.address,
                type: formData.propertyType as any, // 'apartment' | 'villa'
                cleaning_fee: formData.cleaningFee ? parseFloat(formData.cleaningFee) : undefined,
                max_guests: formData.maxGuests,
                bedrooms: formData.bedrooms,
                beds: formData.beds,
                bathrooms: formData.bathrooms,
                amenities: formData.amenities, // Send array of strings directly as per schema
                images: imageUrls,
                host_id: user.id,

                // Hospitality Details
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

                status: 'pending'
            });

            setIsSuccess(true);
            window.scrollTo(0, 0);
        } catch (error) {
            console.error(error);
            toast.error(t('error.generic'));
        } finally {
            setIsLoading(false);
        }
    };

    // Hero Section for non-authenticated users
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20 transition-colors">
                <div className="relative bg-slate-900 text-white py-24 overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80')] bg-cover bg-center opacity-20"></div>
                    <div className="relative max-w-7xl mx-auto px-4 text-center">
                        <h1 className="text-4xl md:text-6xl font-bold mb-6" dangerouslySetInnerHTML={{ __html: t('list.hero.title') }} />
                        <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
                            {t('list.hero.desc')}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button onClick={openRegister} variant="primary" size="lg" className="text-lg px-8">
                                {t('auth.submit.register')}
                            </Button>
                            <Button onClick={openLogin} variant="outline" size="lg" className="text-lg px-8 bg-transparent text-white border-white hover:bg-white/10">
                                {t('auth.submit.login')}
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 py-20">
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                            <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6">
                                <ShieldCheck size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{t('list.benefit.verified.title')}</h3>
                            <p className="text-slate-600 dark:text-slate-400">{t('list.benefit.verified.desc')}</p>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                            <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center text-green-600 dark:text-green-400 mb-6">
                                <TrendingUp size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{t('list.benefit.earnings.title')}</h3>
                            <p className="text-slate-600 dark:text-slate-400">{t('list.benefit.earnings.desc')}</p>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                            <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center text-purple-600 dark:text-purple-400 mb-6">
                                <Settings size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{t('list.benefit.control.title')}</h3>
                            <p className="text-slate-600 dark:text-slate-400">{t('list.benefit.control.desc')}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center px-4 transition-colors">
                <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-slate-100 dark:border-slate-700">
                    <div className="w-24 h-24 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-teal-600 dark:text-teal-400">
                        <CheckCircle size={48} />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">{t('list_prop.success.title')}</h2>
                    <p className="text-slate-600 dark:text-slate-400 mb-8">{t('list_prop.success.desc')}</p>
                    <Button onClick={() => navigate('/')} variant="primary" fullWidth>{t('list_prop.return_home')}</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-10 px-4 transition-colors">
            <div className="max-w-3xl mx-auto">
                <div className="mb-8">
                    <StepsIndicator currentStep={step} totalSteps={STEPS.length} labels={STEPS.map(s => t(s))} />
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden min-h-[500px] flex flex-col">
                    <div className="p-8 flex-grow">
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">

                            {/* Step 0: Type */}
                            {step === 0 && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('list_prop.step1_title')}</h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <button
                                            onClick={() => setFormData({ ...formData, propertyType: 'apartment' })}
                                            className={`p-6 rounded-2xl border-2 text-left transition-all hover:border-teal-600 ${formData.propertyType === 'apartment'
                                                ? 'border-teal-600 bg-teal-50 dark:bg-teal-900/20'
                                                : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                                                }`}
                                        >
                                            <Building2 size={32} className={`mb-4 ${formData.propertyType === 'apartment' ? 'text-teal-600' : 'text-slate-400'}`} />
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('list_prop.type_apt')}</h3>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('list_prop.type_apt_desc')}</p>
                                        </button>

                                        <button
                                            onClick={() => setFormData({ ...formData, propertyType: 'villa' })}
                                            className={`p-6 rounded-2xl border-2 text-left transition-all hover:border-teal-600 ${formData.propertyType === 'villa'
                                                ? 'border-teal-600 bg-teal-50 dark:bg-teal-900/20'
                                                : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                                                }`}
                                        >
                                            <Home size={32} className={`mb-4 ${formData.propertyType === 'villa' ? 'text-teal-600' : 'text-slate-400'}`} />
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('list_prop.type_villa')}</h3>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('list_prop.type_villa_desc')}</p>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Step 1: Location */}
                            {step === 1 && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('list_prop.step2_title')}</h2>
                                    <PropertyLocation formData={formData} handleChange={handleChange} setFormData={setFormData} />
                                </div>
                            )}

                            {/* Step 2: Basics */}
                            {step === 2 && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('list_prop.step3_title')}</h2>
                                    <div className="max-w-md">
                                        <Counter
                                            label={t('prop_form.label_max_guests')} subtitle={t('list_prop.guests_subtitle')}
                                            value={formData.maxGuests} min={1} max={16}
                                            onChange={(v) => setFormData({ ...formData, maxGuests: v })}
                                        />
                                        <Counter
                                            label={t('prop_form.label_bedrooms')}
                                            value={formData.bedrooms} min={0} max={10}
                                            onChange={(v) => setFormData({ ...formData, bedrooms: v })}
                                        />
                                        <Counter
                                            label={t('prop_form.label_beds')}
                                            value={formData.beds} min={1} max={20}
                                            onChange={(v) => setFormData({ ...formData, beds: v })}
                                        />
                                        <Counter
                                            label={t('prop_form.label_bathrooms')}
                                            value={formData.bathrooms} min={1} max={10}
                                            onChange={(v) => setFormData({ ...formData, bathrooms: v })}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Amenities */}
                            {step === 3 && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('list_prop.step4_title')}</h2>
                                    <PropertyAmenities formData={formData} setFormData={setFormData} />
                                </div>
                            )}

                            {/* Step 4: Photos */}
                            {step === 4 && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('list_prop.step5_title')}</h2>
                                    <p className="text-slate-500 dark:text-slate-400">{t('list_prop.photos_desc')}</p>
                                    <PhotoUploader files={files} onChange={setFiles} />
                                </div>
                            )}

                            {/* Step 5: Description */}
                            {step === 5 && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('list_prop.step6_title')}</h2>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('list_prop.create_title')}</label>
                                        <input
                                            name="title"
                                            value={formData.title}
                                            onChange={handleChange}
                                            placeholder={t('prop_form.title')}
                                            maxLength={50}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-600 outline-none font-bold text-lg"
                                        />
                                        <p className="text-right text-xs text-slate-400 mt-1">{formData.title.length}/50</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('list_prop.create_desc')}</label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleChange}
                                            rows={6}
                                            placeholder={t('prop_form.description')}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-600 outline-none resize-none"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Step 6: Pricing & hospitality */}
                            {step === 6 && (
                                <div className="space-y-8">
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">{t('list_prop.step7_title')}</h2>
                                        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{t('list_prop.set_price')}</label>
                                            <div className="relative max-w-xs">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-lg">€</span>
                                                <input
                                                    type="number"
                                                    name="price"
                                                    value={formData.price}
                                                    onChange={handleChange}
                                                    onWheel={(e) => e.currentTarget.blur()}
                                                    className="w-full pl-10 pr-4 py-4 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-0 focus:border-teal-600 outline-none font-bold text-3xl"
                                                />
                                            </div>
                                            <p className="text-sm text-slate-500 mt-2">{t('list_prop.per_night')}</p>
                                        </div>

                                        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 mt-4">
                                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Cleaning Fee (One-time)</label>
                                            <div className="relative max-w-xs">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-lg">€</span>
                                                <input
                                                    type="number"
                                                    name="cleaningFee"
                                                    value={formData.cleaningFee}
                                                    onChange={handleChange}
                                                    onWheel={(e) => e.currentTarget.blur()}
                                                    placeholder="0"
                                                    className="w-full pl-10 pr-4 py-4 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-0 focus:border-teal-600 outline-none font-bold text-xl"
                                                />
                                            </div>
                                            <p className="text-sm text-slate-500 mt-2">Added once per reservation</p>
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
                                    className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 gap-2"
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
    );
};
