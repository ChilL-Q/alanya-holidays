import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import { db } from '../services/db'; // Static import
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    ShieldCheck,
    TrendingUp,
    Settings,
    CheckCircle,
    XCircle,
    Building2,
    MapPin,
    Home,
    Lock,
    Image as ImageIcon,
    Camera,
    Info
} from 'lucide-react';
// ...
export const ListProperty: React.FC = () => {
    const { t } = useLanguage();
    const { isAuthenticated, user } = useAuth();
    const { openRegister, openLogin } = useModal();
    const navigate = useNavigate();
    const [files, setFiles] = useState<File[]>([]);

    const [formData, setFormData] = useState({
        title: '',
        name: user?.name || '',
        email: user?.email || '',
        phone: '',
        propertyType: 'apartment',
        location: '',
        address: '',
        price: '',
        description: '',
        imageUrl: '',
        rentalLicense: '',
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
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const setLoading = setIsLoading;

    React.useEffect(() => {
        if (user && !formData.name) {
            setFormData(prev => ({
                ...prev,
                name: user.name || '',
                email: user.email || ''
            }));
        }
    }, [user, formData.name]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isAuthenticated || !user) {
            toast.error(t('list.error.auth'));
            return;
        }

        if (files.length === 0) {
            toast.error('Please upload at least one image');
            return;
        }

        setLoading(true);

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
                type: formData.propertyType as 'villa' | 'apartment',
                host_id: user.id,
                rental_license: formData.rentalLicense,
                amenities: formData.amenities,
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
                max_guests: Number(formData.maxGuests),
                beds: Number(formData.beds)
            });

            toast.success(t('list.success'));
            setIsSubmitted(true);
        } catch (error: any) {
            console.error('Error listing/updating property:', error);
            if (error.message) console.error('Error Message:', error.message);
            if (error.details) console.error('Error Details:', error.details);
            if (error.hint) console.error('Error Hint:', error.hint);
            toast.error(t('list.error.submit'));
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="min-h-screen bg-white dark:bg-slate-900 pb-20">
            {/* Hero Section */}
            <div className="relative h-[60vh] min-h-[500px] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0">
                    <img
                        src="https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=2671&auto=format&fit=crop"
                        alt="Alanya Luxury Property"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-900/50 to-slate-900/90"></div>
                </div>

                <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
                    <h1
                        className="text-4xl md:text-6xl font-serif text-white mb-6 leading-tight"
                        dangerouslySetInnerHTML={{ __html: t('list.hero.title') }}
                    />
                    <p className="text-xl text-slate-200 mb-8 max-w-2xl mx-auto font-light">
                        {t('list.hero.subtitle')}
                    </p>
                    <a
                        href="#application-form"
                        className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-white px-8 py-4 rounded-full text-lg font-medium transition-all transform hover:scale-105 shadow-lg hover:shadow-accent/30"
                    >
                        {isAuthenticated ? t('list.hero.cta') : t('list.hero.cta.guest')}
                    </a>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-20">
                {/* Benefits Grid */}
                <div className="grid md:grid-cols-3 gap-8 mb-20">
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700">
                        <div className="w-14 h-14 bg-teal-50 dark:bg-teal-900/20 rounded-xl flex items-center justify-center mb-6 text-primary">
                            <ShieldCheck size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                            {t('list.benefit.verified.title')}
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                            {t('list.benefit.verified.desc')}
                        </p>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700">
                        <div className="w-14 h-14 bg-teal-50 dark:bg-teal-900/20 rounded-xl flex items-center justify-center mb-6 text-primary">
                            <Settings size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                            {t('list.benefit.management.title')}
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                            {t('list.benefit.management.desc')}
                        </p>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700">
                        <div className="w-14 h-14 bg-teal-50 dark:bg-teal-900/20 rounded-xl flex items-center justify-center mb-6 text-primary">
                            <TrendingUp size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                            {t('list.benefit.revenue.title')}
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                            {t('list.benefit.revenue.desc')}
                        </p>
                    </div>
                </div>

                {/* Application Form or Guest Gate */}
                <div id="application-form" className="max-w-3xl mx-auto">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-700">
                        {!isAuthenticated ? (
                            <div className="p-16 text-center">
                                <div className="w-24 h-24 bg-slate-100 dark:bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
                                    <Lock size={48} />
                                </div>
                                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                                    {t('list.guest.title')}
                                </h2>
                                <p className="text-xl text-slate-600 dark:text-slate-400 mb-8 max-w-lg mx-auto">
                                    {t('list.guest.desc')}
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <button
                                        onClick={openRegister}
                                        className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-xl font-semibold transition-colors text-lg"
                                    >
                                        {t('auth.submit.register')}
                                    </button>
                                    <button
                                        onClick={openLogin}
                                        className="bg-white dark:bg-slate-700 text-slate-700 dark:text-white border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 px-8 py-3 rounded-xl font-semibold transition-colors text-lg"
                                    >
                                        {t('auth.submit.login')}
                                    </button>
                                </div>
                            </div>
                        ) : isSubmitted ? (
                            <div className="p-16 text-center">
                                <div className="w-24 h-24 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-yellow-600 dark:text-yellow-400">
                                    <CheckCircle size={48} />
                                </div>
                                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                                    Application Received!
                                </h2>
                                <p className="text-xl text-slate-600 dark:text-slate-400 mb-6">
                                    Your property has been submitted for review.
                                </p>
                                <div className="bg-slate-50 dark:bg-slate-700/50 p-6 rounded-2xl max-w-lg mx-auto mb-8">
                                    <p className="text-slate-600 dark:text-slate-300">
                                        Please allow 24 hours for our team to verify your listing.
                                        If you have urgent questions, please contact us at:
                                        <br />
                                        <a href="tel:+905551234567" className="text-primary font-bold mt-2 inline-block">+90 555 123 45 67</a>
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="p-8 md:p-12">
                                <div className="text-center mb-10">
                                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
                                        {t('list.form.title')}
                                    </h2>
                                    <p className="text-slate-600 dark:text-slate-400">
                                        {t('list.form.subtitle')}
                                    </p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                {t('list.form.prop_title')}
                                            </label>
                                            <input
                                                type="text"
                                                name="title"
                                                required
                                                placeholder="e.g. Luxury Seaview Apartment"
                                                value={formData.title}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                {t('list.form.name')}
                                            </label>
                                            <input
                                                type="text"
                                                name="name"
                                                required
                                                value={formData.name}
                                                onChange={handleChange}
                                                readOnly={true}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all opacity-60 cursor-not-allowed"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                {t('list.form.email')}
                                            </label>
                                            <input
                                                type="email"
                                                name="email"
                                                required
                                                value={formData.email}
                                                onChange={handleChange}
                                                readOnly={true}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all opacity-60 cursor-not-allowed"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                {t('list.form.price')}
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
                                                {t('list.form.type')}
                                            </label>
                                            <div className="relative">
                                                <select
                                                    name="propertyType"
                                                    value={formData.propertyType}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all appearance-none"
                                                >
                                                    <option value="apartment">{t('list.form.type.apartment')}</option>
                                                    <option value="villa">{t('list.form.type.villa')}</option>
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
                                                Number of Beds
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
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                                            {t('list.form.license')}
                                            <div className="group relative">
                                                <Info size={16} className="text-slate-400 hover:text-accent cursor-help" />
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-slate-800 text-white text-xs p-3 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 pointer-events-none">
                                                    {t('list.form.license_info')}
                                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-800"></div>
                                                </div>
                                            </div>
                                        </label>
                                        <input
                                            type="text"
                                            name="rentalLicense"
                                            placeholder="e.g. 07-1234..."
                                            value={formData.rentalLicense}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            {t('list.form.location')} (Area)
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                name="location"
                                                placeholder="e.g. Mahmutlar"
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
                                            placeholder="Street, Building No, Apartment No..."
                                            required
                                            value={formData.address || ''}
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
                                            <ShieldCheck className="text-accent" size={20} />
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
                                                        const files = Array.from(e.target.files);
                                                        // Store actual File objects separately or in state for upload
                                                        // Here we are just modifying visual preview logic for now, actual upload needs state
                                                        setFiles(files);
                                                    }
                                                }}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            />
                                            <div className="w-12 h-12 bg-teal-50 dark:bg-teal-900/30 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Camera size={24} />
                                            </div>
                                            <p className="text-sm font-medium text-slate-900 dark:text-white">Click to upload photos</p>
                                            <p className="text-xs text-slate-500 mt-1">PNG, JPG up to 5MB</p>

                                            {files.length > 0 && (
                                                <div className="mt-4 flex flex-wrap gap-2 justify-center">
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
                                            {t('list.form.message')} (Description)
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
                                        {isLoading ? 'Submitting...' : t('list.form.submit')}
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div >
        </div >
    );
};
