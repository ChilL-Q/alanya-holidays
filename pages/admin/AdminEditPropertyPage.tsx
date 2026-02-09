import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../api-services';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    Camera,
    XCircle,
    Home,
    MapPin,
    ArrowLeft,
    Calendar,
    Settings
} from 'lucide-react';
import { AMENITIES_LIST } from '../../data/constants';
import { AvailabilityCalendar } from '../../components/host/AvailabilityCalendar';
import { ICalManager } from '../../components/host/ICalManager';
import { useSaveShortcut } from '../../hooks/useSaveShortcut';

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
        bathrooms: '1'
    });
    const [isLoading, setIsLoading] = useState(false);

    // Fetch property data
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
                    // Hospitality Details
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
                    bathrooms: (data.bathrooms ?? 1).toString()
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
            // Upload new images
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
                max_guests: Number(formData.maxGuests),
                beds: Number(formData.beds),
                bedrooms: Number(formData.bedrooms),
                bathrooms: Number(formData.bathrooms)
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

    // Protected by AdminRoute wrapper in App.tsx for admin routes
    // For host routes, we handle check here or in HostRoute (if it exists)
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

                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                    <div className="p-8 border-b border-slate-100 dark:border-slate-700">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('admin_prop.edit_title')}</h1>
                                <p className="text-slate-500 mt-1">{t('admin_prop.edit_subtitle')}</p>
                            </div>

                            {/* Tabs */}
                            <div className="flex bg-slate-100 dark:bg-slate-700/50 p-1 rounded-lg">
                                <button
                                    onClick={() => setActiveTab('details')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'details' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                                >
                                    <Settings size={16} />
                                    {t('admin_prop.tab_details')}
                                </button>
                                <button
                                    onClick={() => setActiveTab('calendar')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'calendar' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
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
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            {t('prop_form.label_title')}
                                        </label>
                                        <input
                                            type="text"
                                            name="title"
                                            required
                                            value={formData.title}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            {t('prop_form.label_price')}
                                        </label>
                                        <input
                                            type="number"
                                            name="price"
                                            required
                                            min="1"
                                            value={formData.price}
                                            onChange={handleChange}
                                            onWheel={(e) => e.currentTarget.blur()}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Cleaning Fee (One-time)
                                        </label>
                                        <input
                                            type="number"
                                            name="cleaningFee"
                                            min="0"
                                            value={formData.cleaningFee}
                                            onChange={handleChange}
                                            onWheel={(e) => e.currentTarget.blur()}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            {t('prop_form.label_type')}
                                        </label>
                                        <div className="relative">
                                            <select
                                                name="propertyType"
                                                value={formData.propertyType}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all appearance-none"
                                            >
                                                <option value="apartment">Apartment</option>
                                                <option value="villa">Villa</option>
                                            </select>
                                            <Home className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            {t('prop_form.label_max_guests')}
                                        </label>
                                        <input
                                            type="number"
                                            name="maxGuests"
                                            required
                                            min="1"
                                            value={formData.maxGuests}
                                            onChange={handleChange}
                                            onWheel={(e) => e.currentTarget.blur()}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            {t('prop_form.label_beds')}
                                        </label>
                                        <input
                                            type="number"
                                            name="beds"
                                            required
                                            min="1"
                                            value={formData.beds}
                                            onChange={handleChange}
                                            onWheel={(e) => e.currentTarget.blur()}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            {t('prop_form.label_bedrooms')}
                                        </label>
                                        <input
                                            type="number"
                                            name="bedrooms"
                                            required
                                            min="0"
                                            value={formData.bedrooms}
                                            onChange={handleChange}
                                            onWheel={(e) => e.currentTarget.blur()}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            {t('prop_form.label_bathrooms')}
                                        </label>
                                        <input
                                            type="number"
                                            name="bathrooms"
                                            required
                                            min="0"
                                            value={formData.bathrooms}
                                            onChange={handleChange}
                                            onWheel={(e) => e.currentTarget.blur()}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all"
                                        />
                                    </div>
                                </div>



                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        {t('prop_form.label_address')}
                                    </label>
                                    <input
                                        type="text"
                                        name="address"
                                        required
                                        value={formData.address}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">
                                        {t('prop_form.label_amenities')}
                                    </label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {AMENITIES_LIST.map(am => (
                                            <label key={am.label} className="flex items-center gap-2 cursor-pointer p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={(formData.amenities as string[] || []).includes(am.label)}
                                                    onChange={(e) => {
                                                        const current = (formData.amenities as string[]) || [];
                                                        if (e.target.checked) {
                                                            setFormData(prev => ({ ...prev, amenities: [...current, am.label] }));
                                                        } else {
                                                            setFormData(prev => ({ ...prev, amenities: current.filter(a => a !== am.label) }));
                                                        }
                                                    }}
                                                    className="w-4 h-4 text-accent rounded focus:ring-accent border-gray-300"
                                                />
                                                <span className="text-sm text-slate-700 dark:text-slate-300">{t(am.label)}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Hospitality & Guest Guide Section */}
                                <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                        {t('prop_form.section_hospitality')}
                                        <span className="text-xs font-normal text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full ml-auto">{t('prop_form.visible_after_booking')}</span>
                                    </h3>
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('prop_form.label_checkin')}</label>
                                            <input
                                                type="text"
                                                name="checkInTime"
                                                placeholder={t('prop_form.checkin_time')}
                                                value={formData.checkInTime}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('prop_form.label_checkout')}</label>
                                            <input
                                                type="text"
                                                name="checkOutTime"
                                                placeholder={t('prop_form.checkout_time')}
                                                value={formData.checkOutTime}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('prop_form.label_method')}</label>
                                            <input
                                                type="text"
                                                name="checkInMethod"
                                                placeholder={t('prop_form.checkin_method')}
                                                value={formData.checkInMethod}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('prop_form.label_wifi')}</label>
                                            <textarea
                                                name="wifiDetails"
                                                placeholder={t('prop_form.wifi')}
                                                rows={2}
                                                value={formData.wifiDetails}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all resize-none"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('prop_form.label_arrival')}</label>
                                            <textarea
                                                name="arrivalGuide"
                                                placeholder={t('prop_form.arrival')}
                                                rows={3}
                                                value={formData.arrivalGuide}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all resize-none"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('prop_form.label_directions')}</label>
                                            <textarea
                                                name="directions"
                                                placeholder={t('prop_form.directions')}
                                                rows={2}
                                                value={formData.directions}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all resize-none"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('prop_form.label_manual')}</label>
                                            <textarea
                                                name="houseManual"
                                                placeholder={t('prop_form.house_manual')}
                                                rows={3}
                                                value={formData.houseManual}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all resize-none"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('prop_form.label_rules')}</label>
                                            <textarea
                                                name="houseRules"
                                                placeholder={t('prop_form.house_rules')}
                                                rows={3}
                                                value={formData.houseRules}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all resize-none"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('prop_form.label_checkout_instr')}</label>
                                            <textarea
                                                name="checkoutInstructions"
                                                placeholder={t('prop_form.checkout_instr')}
                                                rows={2}
                                                value={formData.checkoutInstructions}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all resize-none"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('prop_form.label_guidebooks')}</label>
                                            <textarea
                                                name="guidebooks"
                                                placeholder={t('prop_form.recommendations')}
                                                rows={2}
                                                value={formData.guidebooks}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all resize-none"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('prop_form.label_interaction')}</label>
                                            <textarea
                                                name="interactionPreferences"
                                                placeholder={t('prop_form.interaction')}
                                                rows={2}
                                                value={formData.interactionPreferences}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all resize-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        {t('admin_prop.upload_title')}
                                    </label>
                                    <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl p-8 text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer relative">
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            onChange={(e) => {
                                                if (e.target.files) {
                                                    setFiles(Array.from(e.target.files));
                                                }
                                            }}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        <div className="w-12 h-12 bg-teal-50 dark:bg-teal-900/30 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Camera size={24} />
                                        </div>
                                        <p className="text-sm font-medium text-slate-900 dark:text-white">{t('admin_prop.upload_text')}</p>
                                        <p className="text-xs text-slate-500 mt-1">{t('admin_prop.upload_hint')}</p>

                                        {(existingImages.length > 0 || files.length > 0) && (
                                            <div className="mt-4 flex flex-wrap gap-2 justify-center">
                                                {existingImages.map((img, i) => (
                                                    <div key={`existing-${i}`} className="relative group w-20 h-20 rounded-lg overflow-hidden border border-slate-200">
                                                        <img src={img} className="w-full h-full object-cover" />
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                e.preventDefault();
                                                                setExistingImages(prev => prev.filter((_, idx) => idx !== i));
                                                            }}
                                                            className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <XCircle size={12} />
                                                        </button>
                                                    </div>
                                                ))}
                                                {files.map((f, i) => (
                                                    <span key={i} className="flex items-center justify-center w-20 h-20 text-xs bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded text-slate-600 dark:text-slate-300 overflow-hidden break-words text-center">
                                                        {f.name}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        {t('prop_form.label_desc')}
                                    </label>
                                    <textarea
                                        name="description"
                                        rows={4}
                                        required
                                        value={formData.description}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all resize-none"
                                    ></textarea>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-accent hover:bg-accent-hover text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-accent/30 text-lg disabled:opacity-50 disabled:cursor-wait"
                                >
                                    {isLoading ? t('admin_prop.save_loading') : t('admin_prop.save')}
                                </button>
                            </form>
                        )}
                    </div>
                </div >
            </div >
        </div >
    );
};
