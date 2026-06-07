import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../api-services';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { CAR_DESCRIPTIONS, DEFAULT_DESCRIPTION } from '../data/cars';
import { AddServiceCategoryStep, ServiceCategory } from '../components/host/services/AddServiceCategoryStep';
import { AddServiceFormStep } from '../components/host/services/AddServiceFormStep';
import { AddServiceSuccessStep } from '../components/host/services/AddServiceSuccessStep';
import { SEOHead } from '../components/seo/SEOHead';

type ServiceType = 'car' | 'bike' | 'transfer' | 'tour' | 'visa' | 'esim' | 'wellness' | 'creative';

interface ItineraryItem {
    time: string;
    description: string;
}

export const AddService: React.FC = () => {
    const { t } = useLanguage();
    const { user } = useAuth();

    // Steps: 0 = Category, 1 = Details, 2 = Success
    const [step, setStep] = useState(0);
    const [category, setCategory] = useState<ServiceCategory>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        type: 'car' as ServiceType,
        // Transportation Specific
        vehicleType: 'sedan',
        brand: '',
        model: '',
        year: new Date().getFullYear().toString(),
        transmission: 'automatic',
        fuel: 'petrol',
        seats: '4',
        modelSelection: 'popular', // 'popular' | 'custom'
        // Adventure Specific
        subcategory: 'water',
        duration: '',
        difficulty: 'medium',
        groupSize: '',
        included: '',
        languages: '',
        requirements: '',
        // Health & Wellness Specific
        whatsapp: '',
        // Availability
        availableFrom: '',
        availableTo: '',
        // Payment
        payOnArrival: false,
        promotionPrice: '',
        promotionDescription: ''
    });

    const [files, setFiles] = useState<File[]>([]);
    const [itinerary, setItinerary] = useState<ItineraryItem[]>([{ time: '09:00', description: 'Start' }]);

    // Auto-fill description when popular model changes
    useEffect(() => {
        if (formData.modelSelection === 'popular' && formData.brand && formData.model) {
            const key = `${formData.brand} ${formData.model}`;
            const desc = CAR_DESCRIPTIONS[key] || DEFAULT_DESCRIPTION;
            setFormData(prev => ({ ...prev, description: desc }));
        }
    }, [formData.brand, formData.model, formData.modelSelection]);

    const handleCategorySelect = (cat: ServiceCategory) => {
        setCategory(cat);
        setFormData(prev => ({
            ...prev,
            type: cat === 'transportation' ? 'car' : (cat === 'adventure' ? 'tour' : (cat === 'health' ? 'wellness' : 'creative'))
        }));
        setStep(1);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsSubmitting(true);

        try {
            let uploadedUrls: string[] = [];
            if (files.length > 0) {
                uploadedUrls = await Promise.all(
                    files.map(file => db.uploadImage(file, 'services'))
                );
            }

            // Construct features object based on category
            let features: Record<string, unknown> = {};

            if (category === 'transportation') {
                features = {
                    vehicleType: formData.vehicleType,
                    brand: formData.brand,
                    model: formData.model,
                    year: formData.year,
                    transmission: formData.transmission,
                    fuel: formData.fuel,
                    seats: formData.seats
                };
            } else if (category === 'adventure') {
                features = {
                    subcategory: formData.subcategory,
                    duration: formData.duration,
                    difficulty: formData.difficulty,
                    groupSize: formData.groupSize,
                    included: formData.included,
                    languages: formData.languages,
                    requirements: formData.requirements,
                    itinerary: itinerary.filter(i => i.description)
                };
            } else if (category === 'health' || category === 'creative') {
                features = {
                    whatsapp: formData.whatsapp,
                    subcategory: formData.subcategory
                };
            }

            // Availability
            if (formData.availableFrom) features.availableFrom = formData.availableFrom;
            if (formData.availableTo) features.availableTo = formData.availableTo;

            // Common features
            features.payOnArrival = formData.payOnArrival;

            await db.createService({
                title: formData.title,
                description: formData.description || DEFAULT_DESCRIPTION,
                price: Number(formData.price),
                type: formData.type,
                provider_id: user.id,
                features: features,
                images: uploadedUrls,
                is_promoted: !!formData.promotionPrice,
                promotion_price: formData.promotionPrice ? parseFloat(formData.promotionPrice) : undefined,
                promotion_description: formData.promotionDescription
            });
            setStep(2);
        } catch (error) {
            console.error(error);
            toast.error('Failed to list service');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (step === 2) {
        return <AddServiceSuccessStep onReset={() => { setStep(0); setCategory(null); }} />;
    }

    return (
        <>
        <SEOHead title="Add Service | Alanya Holidays" noIndex />
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    {step > 0 && (
                        <button onClick={() => setStep(step - 1)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800/90 rounded-full transition-all duration-300 active:scale-90">
                            <ArrowLeft size={24} className="text-slate-600 dark:text-slate-400" />
                        </button>
                    )}
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{t('add_service.title')}</h1>
                        <p className="text-slate-500 dark:text-slate-400">{t('add_service.subtitle')}</p>
                    </div>
                </div>

                {step === 0 ? (
                    <AddServiceCategoryStep onSelect={handleCategorySelect} />
                ) : (
                    <AddServiceFormStep
                        category={category}
                        formData={formData}
                        handleChange={handleChange}
                        setFormData={setFormData}
                        files={files}
                        setFiles={setFiles}
                        itinerary={itinerary}
                        setItinerary={setItinerary}
                        onSubmit={handleSubmit}
                        isSubmitting={isSubmitting}
                    />
                )}
            </div>
        </div>
        </>
    );
};
