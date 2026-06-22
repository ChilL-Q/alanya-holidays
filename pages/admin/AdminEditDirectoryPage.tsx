import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../api-services';
import { supabase } from '../../api-services/supabase';
import { ArrowLeft, Save, Sparkles, Check } from 'lucide-react';
import { useSaveShortcut } from '../../hooks/useSaveShortcut';
import { parseVideoEmbed } from '../../utils/videoEmbed';
import toast from 'react-hot-toast';
import { DirectoryListingDB, DirectoryListingCreateInput, LocationDB } from '../../types/models';
import { slugify } from '../../utils/slugify';

import { BasicDetailsForm } from '../../components/admin/directory/BasicDetailsForm';
import { ContactLocationForm } from '../../components/admin/directory/ContactLocationForm';
import { DetailsFeaturesForm } from '../../components/admin/directory/DetailsFeaturesForm';
import { DirectoryGallery } from '../../components/admin/directory/DirectoryGallery';
import { SettingsSidebar } from '../../components/admin/directory/SettingsSidebar';
import { listingDescriptionsSchema } from '../../utils/listingDescriptionSchema';

export const AdminEditDirectoryPage: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditing = id && id !== 'new';

    const [files, setFiles] = useState<File[]>([]);
    const [existingImages, setExistingImages] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);

    // Array inputs
    const [languages, setLanguages] = useState<string[]>(['']);
    const [certifications, setCertifications] = useState<string[]>(['']);

    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        short_description: '',
        category_id: 'medical',
        location: '',
        website: '',
        whatsapp: '',
        google_map_url: '',
        video_url: '',
        price_level: 2,
        reviews_average: 0.0,
        reviews_count: 0,
        is_featured: false,
        is_verified: false,
        tier: 'explorer' as DirectoryListingDB['tier'],
        newsletter_featured: false,
    });

    const DESC_LANGS = ['en', 'tr', 'ru', 'ar'] as const;
    type DescLang = typeof DESC_LANGS[number];

    const [descriptions, setDescriptions] = useState<Record<DescLang, string>>({
        en: '', tr: '', ru: '', ar: ''
    });
    const [activeDescLang, setActiveDescLang] = useState<DescLang>('en');

    const [generatingDescription, setGeneratingDescription] = useState(false);
    const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([]);
    const [availableLocations, setAvailableLocations] = useState<LocationDB[]>([]);

    const [showRestoreBanner, setShowRestoreBanner] = useState(false);
    const [savedDraft, setSavedDraft] = useState<any>(null);

    const loadListing = useCallback(async () => {
        try {
            const listing = await db.getDirectoryListing(id!);
            if (listing) {
                setFormData({
                    name: listing.name,
                    slug: listing.slug || '',
                    short_description: listing.short_description,
                    category_id: listing.category_id,
                    location: listing.location,
                    website: listing.website || '',
                    whatsapp: listing.whatsapp || '',
                    google_map_url: listing.google_map_url || '',
                    video_url: listing.video_url || '',
                    price_level: listing.price_level || 2,
                    reviews_average: listing.reviews_average || 0,
                    reviews_count: listing.reviews_count || 0,
                    is_featured: listing.is_featured || false,
                    is_verified: listing.is_verified || false,
                    tier: listing.tier || 'explorer',
                    newsletter_featured: listing.newsletter_featured || false,
                });
                setExistingImages(listing.gallery || []);
                setLanguages(listing.languages_spoken?.length ? listing.languages_spoken : ['']);
                setCertifications(listing.certifications?.length ? listing.certifications : ['']);
                setDescriptions({
                    en: listing.descriptions?.en ?? '',
                    tr: listing.descriptions?.tr ?? '',
                    ru: listing.descriptions?.ru ?? '',
                    ar: listing.descriptions?.ar ?? '',
                });
                setSelectedLocationIds(
                    listing.listing_locations?.map(ll => ll.location_id) ?? []
                );

                // Check for draft edit listing
                const draftStr = localStorage.getItem(`draft_admin_directory_listing_${id}`);
                if (draftStr) {
                    try {
                        const parsed = JSON.parse(draftStr);
                        if (parsed && typeof parsed === 'object') {
                            setSavedDraft(parsed);
                            setShowRestoreBanner(true);
                        }
                    } catch (e) {
                        console.error('Failed to parse draft:', e);
                    }
                }
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to load listing');
            navigate('/admin/directory');
        }
    }, [id, navigate]);

    useEffect(() => {
        if (isEditing) {
            loadListing();
        }
    }, [isEditing, loadListing]);

    useEffect(() => {
        if (!isEditing) {
            const draftStr = localStorage.getItem('draft_admin_directory_listing_new');
            if (draftStr) {
                try {
                    const parsed = JSON.parse(draftStr);
                    if (parsed && typeof parsed === 'object') {
                        setSavedDraft(parsed);
                        setShowRestoreBanner(true);
                    }
                } catch (e) {
                    console.error('Failed to parse draft:', e);
                }
            }
        }
    }, [isEditing]);

    useEffect(() => {
        const draftKey = isEditing ? `draft_admin_directory_listing_${id}` : 'draft_admin_directory_listing_new';
        const hasContent = formData.name.trim().length > 0 || formData.short_description.trim().length > 0;
        if (hasContent) {
            localStorage.setItem(draftKey, JSON.stringify({
                formData,
                descriptions,
                languages,
                certifications,
                selectedLocationIds,
                updatedAt: new Date().toISOString()
            }));
        }
    }, [formData, descriptions, languages, certifications, selectedLocationIds, id, isEditing]);

    const handleRestoreDraft = () => {
        if (savedDraft) {
            if (savedDraft.formData) setFormData(savedDraft.formData);
            if (savedDraft.descriptions) setDescriptions(savedDraft.descriptions);
            if (savedDraft.languages) setLanguages(savedDraft.languages);
            if (savedDraft.certifications) setCertifications(savedDraft.certifications);
            if (savedDraft.selectedLocationIds) setSelectedLocationIds(savedDraft.selectedLocationIds);
            toast.success('Unsaved progress restored!');
        }
        setShowRestoreBanner(false);
    };

    const handleDiscardDraft = () => {
        const draftKey = isEditing ? `draft_admin_directory_listing_${id}` : 'draft_admin_directory_listing_new';
        localStorage.removeItem(draftKey);
        setShowRestoreBanner(false);
        toast.success('Draft discarded');
    };

    useEffect(() => {
        db.getLocations()
            .then(setAvailableLocations)
            .catch(err => console.error('Failed to load locations:', err));
    }, []);

    // Auto-generate slug from name when creating a new listing
    useEffect(() => {
        if (!isEditing && formData.name && !formData.slug) {
            setFormData(prev => ({ ...prev, slug: slugify(prev.name) }));
        }
    }, [formData.name, isEditing]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const buildDescriptionPrompt = (listing: typeof formData) => {
        return `Generate SEO-friendly business descriptions for "${listing.name}", a ${listing.category_id} business in ${listing.location || 'Alanya'}, Turkey.
Current description: "${listing.short_description || 'None provided'}".

Return ONLY valid JSON with exactly these keys: en, tr, ru, ar. Each value: 1-2 professional sentences (~150 characters), travel-focused and SEO-optimized.
Example: {"en": "...", "tr": "...", "ru": "...", "ar": "..."}`;
    };

    const handleGenerateDescription = async () => {
        if (formData.tier !== 'signature') return;
        setGeneratingDescription(true);
        try {
            const { data, error } = await supabase.functions.invoke('ai-proxy', {
                body: { userQuestion: buildDescriptionPrompt(formData), mode: 'structured' }
            });
            if (error) throw error;

            const raw = data?.answer;
            if (!raw || typeof raw !== 'string') {
                throw new Error('Empty response from AI');
            }

            let parsed: unknown;
            try {
                parsed = JSON.parse(raw);
            } catch {
                throw new Error('AI returned invalid JSON. Please try again.');
            }

            const validation = listingDescriptionsSchema.safeParse(parsed);
            if (!validation.success) {
                console.error('AI response validation failed:', validation.error.flatten());
                throw new Error('AI response format was unexpected. Please try again.');
            }

            const next: Record<DescLang, string> = {
                en: validation.data.en?.trim() ?? '',
                tr: validation.data.tr?.trim() ?? '',
                ru: validation.data.ru?.trim() ?? '',
                ar: validation.data.ar?.trim() ?? '',
            };

            setDescriptions(next);

            // EN also updates the main Short Description field for backward compatibility
            if (next.en) {
                setFormData(prev => ({ ...prev, short_description: next.en }));
            }

            toast.success('Descriptions generated in 4 languages!');
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to generate descriptions';
            console.error('AI generation failed:', err);
            toast.error(message);
        } finally {
            setGeneratingDescription(false);
        }
    };

    const handleArrayChange = (index: number, value: string, type: 'language' | 'certification') => {
        const setFunc = type === 'language' ? setLanguages : setCertifications;
        const array = type === 'language' ? languages : certifications;
        const newArray = [...array];
        newArray[index] = value;
        setFunc(newArray);
    };

    const handleAddArrayItem = (type: 'language' | 'certification') => {
        const setFunc = type === 'language' ? setLanguages : setCertifications;
        setFunc(prev => [...prev, '']);
    };

    const handleRemoveArrayItem = (index: number, type: 'language' | 'certification') => {
        const setFunc = type === 'language' ? setLanguages : setCertifications;
        setFunc(prev => prev.filter((_, i) => i !== index));
    };

    const removeExistingImage = (index: number) => {
        setExistingImages(existingImages.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setSubmitting(true);

        try {
            let uploadedUrls: string[] = [];
            if (files.length > 0) {
                uploadedUrls = await Promise.all(
                    files.map(file => db.uploadImage(file, 'directory'))
                );
            }

            const finalImages = [...existingImages, ...uploadedUrls];

            const listingData: DirectoryListingCreateInput = {
                name: formData.name,
                slug: formData.slug || undefined,
                short_description: formData.short_description,
                category_id: formData.category_id,
                location: formData.location,
                website: formData.website || undefined,
                whatsapp: formData.whatsapp || undefined,
                google_map_url: formData.google_map_url || undefined,
                video_url: formData.video_url || undefined,
                price_level: Number(formData.price_level) as 1 | 2 | 3 | 4,
                reviews_average: Number(formData.reviews_average),
                reviews_count: Number(formData.reviews_count),
                is_featured: formData.is_featured,
                is_verified: formData.is_verified,
                tier: formData.tier,
                newsletter_featured: formData.newsletter_featured,
                gallery: finalImages,
                languages_spoken: languages.filter(l => l.trim() !== ''),
                certifications: certifications.filter(c => c.trim() !== ''),
                descriptions: {
                    en: descriptions.en || formData.short_description,
                    tr: descriptions.tr,
                    ru: descriptions.ru,
                    ar: descriptions.ar,
                },
            };

            if (isEditing) {
                const effectiveLocationIds = formData.tier === 'signature' ? selectedLocationIds : [];
                await db.updateDirectoryListing(id!, listingData, effectiveLocationIds);
                toast.success('Listing updated successfully');
            } else {
                const effectiveLocationIds = formData.tier === 'signature' ? selectedLocationIds : [];
                await db.createDirectoryListing(listingData, effectiveLocationIds);
                toast.success('Listing created successfully');
            }
            const draftKey = isEditing ? `draft_admin_directory_listing_${id}` : 'draft_admin_directory_listing_new';
            localStorage.removeItem(draftKey);

            navigate('/admin/directory');
        } catch (error: unknown) {
            console.error('Save Listing Error:', error);
            const message = error instanceof Error ? error.message : 'Failed to save listing';
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    useSaveShortcut(handleSubmit);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20 overflow-x-hidden">
            <div className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/50">
                <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/admin/directory')}
                            className="p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                            {isEditing ? 'Edit Listing' : 'New Listing'}
                        </h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => handleSubmit()}
                            disabled={submitting}
                            className="flex items-center gap-2 bg-teal-600 dark:bg-cyan-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-sm disabled:opacity-50"
                        >
                            <Save size={18} />
                            <span>{submitting ? 'Saving...' : 'Save'}</span>
                        </button>
                    </div>
                </div>
            </div>

            <main className="max-w-5xl mx-auto px-4 py-8">
                {showRestoreBanner && (
                    <div className="mb-8 bg-teal-50/80 dark:bg-teal-900/20 backdrop-blur-md border border-teal-200 dark:border-teal-800/50 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="flex items-start gap-3 w-full sm:w-auto text-left">
                            <div className="p-2 bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400 rounded-xl">
                                <Sparkles size={20} />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Unsaved draft found</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    We saved your progress from {savedDraft && savedDraft.updatedAt ? new Date(savedDraft.updatedAt).toLocaleString() : 'recently'}.
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
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Main Info */}
                    <div className="lg:col-span-2 space-y-6">
                        <BasicDetailsForm
                            name={formData.name}
                            slug={formData.slug}
                            description={formData.short_description}
                            onChange={handleChange}
                        />

                        {formData.tier === 'signature' && (
                            <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800/50">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Multilingual Descriptions</h3>
                                    <button
                                        onClick={handleGenerateDescription}
                                        disabled={generatingDescription}
                                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg font-medium transition-all shadow-sm disabled:opacity-50 text-xs"
                                    >
                                        {generatingDescription ? (
                                            <span className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-white" />
                                        ) : (
                                            <Sparkles size={14} />
                                        )}
                                        {generatingDescription ? 'Generating...' : 'Generate AI'}
                                    </button>
                                </div>

                                <div className="flex gap-2 mb-3">
                                    {DESC_LANGS.map((lang) => (
                                        <button
                                            key={lang}
                                            type="button"
                                            onClick={() => setActiveDescLang(lang)}
                                            className={`relative px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                                activeDescLang === lang
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                            }`}
                                        >
                                            {lang.toUpperCase()}
                                            {descriptions[lang] && (
                                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                                                    <Check size={8} className="text-white" />
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>

                                <textarea
                                    name="listing-description"
                                    rows={3}
                                    value={descriptions[activeDescLang]}
                                    onChange={(e) => setDescriptions(prev => ({ ...prev, [activeDescLang]: e.target.value }))}
                                    dir={activeDescLang === 'ar' ? 'rtl' : 'ltr'}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white resize-none text-sm"
                                    placeholder={`Description in ${activeDescLang.toUpperCase()}...`}
                                />

                                <p className="mt-2 text-xs text-slate-500">
                                    {activeDescLang === 'en' && 'English also updates the main Short Description field.'}
                                </p>
                            </div>
                        )}

                        <ContactLocationForm
                            location={formData.location}
                            googleMapUrl={formData.google_map_url}
                            website={formData.website}
                            whatsapp={formData.whatsapp}
                            onChange={handleChange}
                            availableLocations={availableLocations}
                            selectedLocationIds={selectedLocationIds}
                            onLocationIdsChange={setSelectedLocationIds}
                            tier={formData.tier}
                        />

                        <DetailsFeaturesForm
                            languages={languages}
                            certifications={certifications}
                            onArrayChange={handleArrayChange}
                            onAddArrayItem={handleAddArrayItem}
                            onRemoveArrayItem={handleRemoveArrayItem}
                        />

                        <DirectoryGallery
                            existingImages={existingImages}
                            onRemoveExisting={removeExistingImage}
                            files={files}
                            onFilesChange={setFiles}
                            maxFiles={formData.tier === 'explorer' ? 5 : formData.tier === 'voyager' ? 50 : 100}
                        />

                        <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800/50">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Video</h2>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Video URL (YouTube or Vimeo)
                            </label>
                            <input
                                type="url"
                                name="video_url"
                                value={formData.video_url}
                                onChange={handleChange}
                                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white"
                                placeholder="https://youtube.com/watch?v=..."
                            />
                            {formData.video_url && !parseVideoEmbed(formData.video_url) && (
                                <p className="mt-2 text-xs text-red-500">Please enter a valid YouTube or Vimeo URL.</p>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Status & Settings */}
                    <div className="space-y-6">
                        <SettingsSidebar
                            categoryId={formData.category_id}
                            isFeatured={formData.is_featured}
                            isVerified={formData.is_verified}
                            tier={formData.tier}
                            priceLevel={formData.price_level}
                            reviewsAverage={formData.reviews_average}
                            reviewsCount={formData.reviews_count}
                            newsletterFeatured={formData.newsletter_featured}
                            onChange={handleChange}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
};
