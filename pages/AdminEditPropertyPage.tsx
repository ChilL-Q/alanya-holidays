import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/db';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    Camera,
    XCircle,
    Home,
    MapPin,
    ArrowLeft
} from 'lucide-react';

export const AdminEditPropertyPage: React.FC = () => {
    const { t } = useLanguage();
    const { isAuthenticated, user, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();

    const [files, setFiles] = useState<File[]>([]);
    const [existingImages, setExistingImages] = useState<string[]>([]);

    const [formData, setFormData] = useState({
        title: '',
        name: '',
        email: '',
        phone: '',
        propertyType: 'apartment',
        location: '',
        address: '',
        price: '',
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
        beds: '1'
    });
    const [isLoading, setIsLoading] = useState(false);

    // Fetch property data
    useEffect(() => {
        if (id) {
            const fetchProp = async () => {
                try {
                    const data = await db.getProperty(id);
                    if (data) {
                        setFormData(prev => ({
                            ...prev,
                            title: data.title,
                            description: data.description,
                            price: data.price_per_night.toString(),
                            location: data.location,
                            address: data.address || '',
                            propertyType: data.type || 'apartment',
                            amenities: data.amenities || [],
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
                            beds: (data.beds ?? 1).toString()
                        }));
                        setExistingImages(data.images || []);
                    }
                } catch (error) {
                    console.error('Error fetching property:', error);
                    toast.error('Failed to load property');
                }
            };
            fetchProp();
        }
    }, [id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

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
                beds: Number(formData.beds)
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

    // Protected by AdminRoute wrapper in App.tsx
    if (authLoading) return null;
    if (!isAuthenticated || user?.role !== 'admin') return null;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <button
                    onClick={() => navigate('/admin')}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white mb-6 transition-colors"
                >
                    <ArrowLeft size={20} />
                    Back to Admin
                </button>

                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                    <div className="p-8 border-b border-slate-100 dark:border-slate-700">
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Edit Property</h1>
                        <p className="text-slate-500 mt-1">Update property details and images</p>
                    </div>

                    <div className="p-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Title
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
                                        Price (€/night)
                                    </label>
                                    <input
                                        type="number"
                                        name="price"
                                        required
                                        min="1"
                                        value={formData.price}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Type
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
                                        Max Guests
                                    </label>
                                    <input
                                        type="number"
                                        name="maxGuests"
                                        required
                                        min="1"
                                        value={formData.maxGuests}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Beds
                                    </label>
                                    <input
                                        type="number"
                                        name="beds"
                                        required
                                        min="1"
                                        value={formData.beds}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Location (Area)
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="location"
                                        required
                                        value={formData.location}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all"
                                    />
                                    <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Full Address
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
                                    Amenities
                                </label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {[
                                        'Wifi', 'Air conditioning', 'Kitchen', 'Washer', 'Free parking on premises',
                                        'Pool', 'TV', 'Heating', 'Essentials', 'Hot water',
                                        'Refrigerator', 'Dishwasher', 'Microwave', 'Stove',
                                        'Patio or balcony', 'BBQ grill', 'Private entrance', 'Waterfront',
                                        'Smoke alarm', 'Hair dryer', 'Iron', 'Shampoo'
                                    ].map(am => (
                                        <label key={am} className="flex items-center gap-2 cursor-pointer p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={(formData.amenities as string[] || []).includes(am)}
                                                onChange={(e) => {
                                                    const current = (formData.amenities as string[]) || [];
                                                    if (e.target.checked) {
                                                        setFormData(prev => ({ ...prev, amenities: [...current, am] }));
                                                    } else {
                                                        setFormData(prev => ({ ...prev, amenities: current.filter(a => a !== am) }));
                                                    }
                                                }}
                                                className="w-4 h-4 text-accent rounded focus:ring-accent border-gray-300"
                                            />
                                            <span className="text-sm text-slate-700 dark:text-slate-300">{am}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Hospitality & Guest Guide Section */}
                            <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                    Hospitality & Guest Guide
                                    <span className="text-xs font-normal text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full ml-auto">Visible only after booking</span>
                                </h3>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Check-in Time</label>
                                        <input
                                            type="text"
                                            name="checkInTime"
                                            placeholder="e.g. 3:00 PM"
                                            value={formData.checkInTime}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Checkout Time</label>
                                        <input
                                            type="text"
                                            name="checkOutTime"
                                            placeholder="e.g. 11:00 AM"
                                            value={formData.checkOutTime}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Check-in Method</label>
                                        <input
                                            type="text"
                                            name="checkInMethod"
                                            placeholder="e.g. Lockbox, Keypad, In-person..."
                                            value={formData.checkInMethod}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Wifi Details</label>
                                        <textarea
                                            name="wifiDetails"
                                            placeholder="Network Name and Password"
                                            rows={2}
                                            value={formData.wifiDetails}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all resize-none"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Arrival Guide</label>
                                        <textarea
                                            name="arrivalGuide"
                                            placeholder="Instructions for when guests arrive"
                                            rows={3}
                                            value={formData.arrivalGuide}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all resize-none"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Directions</label>
                                        <textarea
                                            name="directions"
                                            placeholder="How to get to the property"
                                            rows={2}
                                            value={formData.directions}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all resize-none"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">House Manual</label>
                                        <textarea
                                            name="houseManual"
                                            placeholder="How to use appliances, AC, pool etc."
                                            rows={3}
                                            value={formData.houseManual}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all resize-none"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">House Rules</label>
                                        <textarea
                                            name="houseRules"
                                            placeholder="No smoking, no parties, etc."
                                            rows={3}
                                            value={formData.houseRules}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all resize-none"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Checkout Instructions</label>
                                        <textarea
                                            name="checkoutInstructions"
                                            placeholder="What to do before leaving (trash, keys, etc.)"
                                            rows={2}
                                            value={formData.checkoutInstructions}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all resize-none"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Guidebooks</label>
                                        <textarea
                                            name="guidebooks"
                                            placeholder="Local recommendations (restaurants, sights)"
                                            rows={2}
                                            value={formData.guidebooks}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all resize-none"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Interaction Preferences</label>
                                        <textarea
                                            name="interactionPreferences"
                                            placeholder="How you prefer to interact with guests"
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
                                    Property Images
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
                                    <p className="text-sm font-medium text-slate-900 dark:text-white">Click to upload new photos</p>
                                    <p className="text-xs text-slate-500 mt-1">PNG, JPG up to 5MB</p>

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
                                    Description
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
                                {isLoading ? 'Saving Changes...' : 'Save Changes'}
                            </button>
                        </form>
                    </div>
                </div >
            </div >
        </div >
    );
};
