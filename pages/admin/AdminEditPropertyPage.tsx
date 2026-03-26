import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../api-services';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Calendar, Settings } from 'lucide-react';

import { AvailabilityCalendar } from '../../components/host/AvailabilityCalendar';
import { ICalManager } from '../../components/host/ICalManager';
import { useSaveShortcut } from '../../hooks/useSaveShortcut';

import { PropertyBasicDetailsForm } from '../../components/admin/property/PropertyBasicDetailsForm';
import { PropertyHospitalityForm } from '../../components/admin/property/PropertyHospitalityForm';
import { PropertyAmenitiesForm } from '../../components/admin/property/PropertyAmenitiesForm';
import { PropertyMediaForm } from '../../components/admin/property/PropertyMediaForm';

export const AdminEditPropertyPage: React.FC = () => {
    const { t } = useLanguage();
    const { isAuthenticated, user, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();

    const [files, setFiles] = useState<File[]>([]);
    const [existingImages, setExistingImages] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<'details' | 'calendar'>('details');
    const [icalData, setIcalData] = useState<{ url?: string; lastSynced?: string }>({});

    const [formData, setFormData] = useState({
        title: '',
        name: '',
        email: '',
        phone: '',
        propertyType: 'apartment',
        location: '',
        address: '',
        price: '',
        cleaningFee: '',
        description: '',
        imageUrl: '',
        amenities: [] as string[],
        // Hospitality Details
        arrivalGuide: '',
        checkInTime: '',
        checkOutTime: '',
        directions: '',
        checkInMethod: '',
        wifiDetails: '',
        houseManual: '',
        houseRules: '',
        checkoutInstructions: '',
        guidebooks: '',
        interactionPreferences: '',
        maxGuests: '2',
        beds: '1',
        bedrooms: '1',
        isPromoted: false,
        bathrooms: '1'
    });
    const [isLoading, setIsLoading] = useState(false);

    const fetchProp = async () => {
        if (!id) return;
        try {
            const data = await db.getProperty(id);
            if (data) {
                setFormData(prev => ({
                    ...prev,
                    title: data.title,
                    description: data.description,
                    price: data.price_per_night.toString(),
                    cleaningFee: (data.cleaning_fee || 0).toString(),
                    location: data.location,
                    address: data.address || '',
                    propertyType: data.type || 'apartment',
                    amenities: (data.amenities || []).map((a: any) => typeof a === 'string' ? a : a.label),
                    name: data.host?.full_name || '',
                    email: '',
                    arrivalGuide: data.arrival_guide || '',
                    checkInTime: data.check_in_time || '',
                    checkOutTime: data.check_out_time || '',
                    directions: data.directions || '',
                    checkInMethod: data.check_in_method || '',
                    wifiDetails: data.wifi_details || '',
                    houseManual: data.house_manual || '',
                    houseRules: data.house_rules || '',
                    checkoutInstructions: data.checkout_instructions || '',
                    guidebooks: data.guidebooks || '',
                    interactionPreferences: data.interaction_preferences || '',
                    maxGuests: (data.max_guests ?? 2).toString(),
                    beds: (data.beds ?? 1).toString(),
                    bedrooms: (data.bedrooms ?? 1).toString(),
                    bathrooms: (data.bathrooms ?? 1).toString(),
                    isPromoted: data.is_promoted || false
                }));
                setExistingImages(data.images || []);
                setIcalData({
                    url: data.ical_url,
                    lastSynced: data.last_synced_at
                });
            }
        } catch (error) {
            console.error('Error fetching property:', error);
            toast.error('Failed to load property');
        }
    };

    useEffect(() => {
        fetchProp();
    }, [id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleAmenitiesChange = (updatedAmenities: string[]) => {
        setFormData({ ...formData, amenities: updatedAmenities });
    };

    const handleRemoveExistingImage = (index: number) => {
        setExistingImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (!isAuthenticated || !user) {
            toast.error(t('list.error.auth'));
            return;
        }

        if (files.length === 0 && existingImages.length === 0) {
            toast.error('Please have at least one image');
            return;
        }

        setIsLoading(true);

        try {
            const newUploadedUrls = [];
            for (const file of files) {
                const url = await db.uploadPropertyImage(file);
                newUploadedUrls.push(url);
            }

            const finalImages = [...existingImages, ...newUploadedUrls];

            const propertyData = {
                title: formData.title,
                description: formData.description,
                price_per_night: Number(formData.price),
                cleaning_fee: Number(formData.cleaningFee),
                location: formData.location,
                address: formData.address,
                type: formData.propertyType as 'villa' | 'apartment',
                amenities: formData.amenities,
                images: finalImages,
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
                max_guests: Number(formData.maxGuests),
                beds: Number(formData.beds),
                bedrooms: Number(formData.bedrooms),
                bathrooms: Number(formData.bathrooms),
                is_promoted: formData.isPromoted
            };

            if (id) {
                await db.updateProperty(id, propertyData);
                toast.success('Property updated successfully');
                navigate('/admin');
            }
        } catch (error) {
            console.error('Error updating property:', error);
            toast.error('Error updating property');
        } finally {
            setIsLoading(false);
        }
    };

    useSaveShortcut(handleSubmit);

    if (authLoading) return null;
    if (!isAuthenticated) return null;
    if (user?.role !== 'admin' && user?.role !== 'host') return null;

    const backLink = user?.role === 'admin' ? '/admin/properties' : '/host/properties';
    const backText = user?.role === 'admin' ? 'Back to Admin, Properties' : 'Back to My Listings';

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <button
                    onClick={() => navigate(backLink)}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white mb-6 transition-colors"
                >
                    <ArrowLeft size={20} />
                    {backText}
                </button>

                <div className="bg-white dark:bg-slate-800/80 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800/50 overflow-hidden">
                    <div className="p-8 border-b border-slate-100 dark:border-slate-800/50">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('admin_prop.edit_title')}</h1>
                                <p className="text-slate-500 mt-1">{t('admin_prop.edit_subtitle')}</p>
                            </div>

                            <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-lg">
                                <button
                                    onClick={() => setActiveTab('details')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'details' ? 'bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                                >
                                    <Settings size={16} />
                                    {t('admin_prop.tab_details')}
                                </button>
                                <button
                                    onClick={() => setActiveTab('calendar')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'calendar' ? 'bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                                >
                                    <Calendar size={16} />
                                    {t('admin_prop.tab_calendar')}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="p-8">
                        {activeTab === 'calendar' ? (
                            <div className="space-y-8 animate-fade-in">
                                {id && (
                                    <>
                                        <AvailabilityCalendar propertyId={id} />
                                        <ICalManager
                                            propertyId={id}
                                            existingIcalUrl={icalData.url}
                                            lastSyncedAt={icalData.lastSynced}
                                            onUpdate={fetchProp}
                                        />
                                    </>
                                )}
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
                                
                                <PropertyBasicDetailsForm formData={formData} onChange={handleChange} />
                                
                                <PropertyAmenitiesForm amenities={formData.amenities} onChange={handleAmenitiesChange} />

                                <PropertyHospitalityForm formData={formData} onChange={handleChange} />

                                <PropertyMediaForm
                                    existingImages={existingImages}
                                    onRemoveExisting={handleRemoveExistingImage}
                                    files={files}
                                    onFilesChange={setFiles}
                                />

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-accent dark:bg-amber-600 hover:bg-accent hover:opacity-90 dark:bg-amber-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-accent/30 text-lg disabled:opacity-50 disabled:cursor-wait"
                                >
                                    {isLoading ? t('admin_prop.save_loading') : t('admin_prop.save')}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
