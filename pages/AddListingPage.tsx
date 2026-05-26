import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, MapPin, Globe, MessageCircle, Link as LinkIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { SEOHead } from '../components/seo/SEOHead';
import { StepsIndicator } from '../components/ui/StepsIndicator';
import { PhotoUploader } from '../components/ui/PhotoUploader';
import { db } from '../api-services';
import { useLanguage } from '../context/LanguageContext';

interface FormData {
    name: string;
    category_id: string;
    short_description: string;
    location: string;
    website: string;
    whatsapp: string;
    google_map_url: string;
}

const CATEGORIES = [
    { id: 'medical', label: 'Medical Tourism' },
    { id: 'accommodations', label: 'Hotels & Accommodations' },
    { id: 'tours', label: 'Tours & Activities' },
    { id: 'transport', label: 'Transport & Car Rental' },
    { id: 'restaurants', label: 'Restaurants' },
    { id: 'cafes', label: 'Cafes & Bars' },
    { id: 'nature', label: 'Nature & Attractions' },
    { id: 'spa-hamam', label: 'Spa & Hamam' },
    { id: 'hair-beauty', label: 'Hair & Beauty' },
    { id: 'real-estate', label: 'Real Estate' },
    { id: 'visa', label: 'Residency & Legal' },
    { id: 'shopping', label: 'Shopping' },
];

const TIER_LIMITS: Record<string, number> = {
    explorer: 5,
    voyager: 50,
    signature: 100,
    partner: 100,
};

export const AddListingPage: React.FC = () => {
    const { t: _t } = useLanguage();
    const [searchParams] = useSearchParams();
    const subscribed = searchParams.get('subscribed') === 'true';

    const [step, setStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [tierLimit, setTierLimit] = useState(5);
    const [tier, setTier] = useState<'explorer' | 'voyager' | 'signature' | 'partner'>('explorer');

    const [formData, setFormData] = useState<FormData>({
        name: '',
        category_id: '',
        short_description: '',
        location: '',
        website: '',
        whatsapp: '',
        google_map_url: '',
    });
    const [gallery, setGallery] = useState<File[]>([]);

    // Detect subscription tier on mount
    useEffect(() => {
        db.getPremiumStatus()
            .then((status) => {
                const detectedTier = status.tier ?? 'explorer';
                setTier(detectedTier);
                setTierLimit(TIER_LIMITS[detectedTier] ?? 5);
            })
            .catch(() => {
                setTier('explorer');
                setTierLimit(5);
            });
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const canProceedToStep2 =
        formData.name.trim().length >= 2 &&
        formData.category_id !== '' &&
        formData.short_description.trim().length >= 10 &&
        formData.location.trim().length >= 2;

    const handleNext = () => {
        if (!canProceedToStep2) {
            toast.error('Please fill in all required fields correctly');
            return;
        }
        setStep(1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleBack = () => {
        setStep(0);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async () => {
        if (gallery.length > tierLimit) {
            toast.error(`Maximum ${tierLimit} photos allowed for your tier`);
            return;
        }

        setIsSubmitting(true);
        try {
            const uploadedUrls =
                gallery.length > 0
                    ? await Promise.all(gallery.map((file) => db.uploadImage(file, 'directory')))
                    : [];

            await db.createDirectoryListing({
                name: formData.name.trim(),
                category_id: formData.category_id,
                short_description: formData.short_description.trim(),
                location: formData.location.trim(),
                website: formData.website.trim() || undefined,
                whatsapp: formData.whatsapp.trim() || undefined,
                google_map_url: formData.google_map_url.trim() || undefined,
                gallery: uploadedUrls,
                tier,
                is_featured: false,
                is_verified: false,
                base_score: 0,
            });

            setSubmitted(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            console.error('Failed to create listing:', err);
            toast.error(err instanceof Error ? err.message : 'Failed to create listing');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <>
                <SEOHead title="Listing Submitted" description="Your business listing has been submitted for review." />
                <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-4">
                    <div className="max-w-xl mx-auto text-center">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
                            Listing Submitted!
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-8">
                            Your listing is under review — we&apos;ll notify you when it&apos;s approved.
                        </p>
                        <Link
                            to="/"
                            className="inline-flex items-center justify-center px-6 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors"
                        >
                            Back to Home
                        </Link>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <SEOHead
                title="Add Your Business Listing"
                description="Create a free or premium directory listing on Alanya Holidays."
            />
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4">
                <div className="max-w-3xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-8">
                        {step > 0 && (
                            <button
                                onClick={handleBack}
                                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-all"
                            >
                                <ArrowLeft size={24} className="text-slate-600 dark:text-slate-400" />
                            </button>
                        )}
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Add Your Business</h1>
                            <p className="text-slate-500 dark:text-slate-400">
                                Create your directory listing and reach thousands of travelers.
                            </p>
                        </div>
                    </div>

                    {/* Subscription confirmation banner */}
                    {subscribed && (
                        <div className="mb-8 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-xl p-4 flex items-start gap-3">
                            <CheckCircle size={20} className="text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-semibold text-green-800 dark:text-green-300">
                                    Subscription confirmed!
                                </p>
                                <p className="text-sm text-green-700 dark:text-green-400">
                                    Complete your listing below to get featured.
                                </p>
                            </div>
                        </div>
                    )}

                    <StepsIndicator
                        currentStep={step}
                        totalSteps={2}
                        labels={['Business Info', 'Contact & Media']}
                    />

                    <div className="mt-10">
                        {step === 0 ? (
                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm p-6 md:p-8 space-y-6">
                                {/* Business Name */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                                        Business Name <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="e.g. Alanya Seaside Cafe"
                                        maxLength={200}
                                        required
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                                    />
                                </div>

                                {/* Category */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                                        Category <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <select
                                            name="category_id"
                                            value={formData.category_id}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white appearance-none focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all cursor-pointer"
                                        >
                                            <option value="">Select a category</option>
                                            {CATEGORIES.map((cat) => (
                                                <option key={cat.id} value={cat.id}>
                                                    {cat.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Short Description */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                                        Short Description <span className="text-rose-500">*</span>
                                    </label>
                                    <textarea
                                        name="short_description"
                                        value={formData.short_description}
                                        onChange={handleChange}
                                        placeholder="Describe what your business offers in a few sentences..."
                                        maxLength={500}
                                        rows={4}
                                        required
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all resize-none"
                                    />
                                    <p className="text-xs text-slate-400 mt-1">
                                        {formData.short_description.length}/500 characters
                                    </p>
                                </div>

                                {/* Location */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                                        Location <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <MapPin
                                            size={18}
                                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                                        />
                                        <input
                                            type="text"
                                            name="location"
                                            value={formData.location}
                                            onChange={handleChange}
                                            placeholder="e.g. Alanya City Center, Mahmutlar, Oba"
                                            maxLength={200}
                                            required
                                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={handleNext}
                                    disabled={!canProceedToStep2}
                                    className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                                        canProceedToStep2
                                            ? 'bg-teal-600 text-white hover:bg-teal-700 shadow-md hover:shadow-lg'
                                            : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                    }`}
                                >
                                    Next: Contact & Media
                                </button>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm p-6 md:p-8 space-y-6">
                                {/* Website */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                                        Website
                                    </label>
                                    <div className="relative">
                                        <Globe
                                            size={18}
                                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                                        />
                                        <input
                                            type="url"
                                            name="website"
                                            value={formData.website}
                                            onChange={handleChange}
                                            placeholder="https://..."
                                            maxLength={500}
                                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                {/* WhatsApp */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                                        WhatsApp Number
                                    </label>
                                    <div className="relative">
                                        <MessageCircle
                                            size={18}
                                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                                        />
                                        <input
                                            type="text"
                                            name="whatsapp"
                                            value={formData.whatsapp}
                                            onChange={handleChange}
                                            placeholder="+90 555 123 4567"
                                            maxLength={50}
                                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Google Maps URL */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                                        Google Maps URL
                                    </label>
                                    <div className="relative">
                                        <LinkIcon
                                            size={18}
                                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                                        />
                                        <input
                                            type="url"
                                            name="google_map_url"
                                            value={formData.google_map_url}
                                            onChange={handleChange}
                                            placeholder="https://maps.google.com/..."
                                            maxLength={500}
                                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Photos */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                                        Photos
                                    </label>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                                        Upload up to {tierLimit} photos for your listing. First photo will be used as cover.
                                    </p>
                                    <PhotoUploader files={gallery} onChange={setGallery} maxFiles={tierLimit} />
                                </div>

                                {/* Tier badge */}
                                {tier !== 'explorer' && (
                                    <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800/50 rounded-xl p-3 flex items-center gap-2">
                                        <CheckCircle size={16} className="text-teal-600 dark:text-teal-400 shrink-0" />
                                        <span className="text-sm text-teal-800 dark:text-teal-300 font-medium capitalize">
                                            {tier} tier — up to {tierLimit} photos
                                        </span>
                                    </div>
                                )}

                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={handleBack}
                                        className="flex-1 py-3.5 rounded-xl font-semibold text-sm bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting}
                                        className="flex-1 py-3.5 rounded-xl font-semibold text-sm bg-teal-600 text-white hover:bg-teal-700 shadow-md hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? 'Submitting...' : 'Submit Listing'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};
