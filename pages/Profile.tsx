import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../api-services';
import { useNavigate } from 'react-router-dom';
import {
    User, Mail, Calendar, MapPin, Package, LogOut, Edit2, Save, X,
    Phone, UserCircle, Camera, Shield, Settings, Grid, Key, AlertTriangle, Check, Home, Car, Banknote, Wallet
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { toast } from 'react-hot-toast';
import { BecomeHostModal } from '../components/modals/BecomeHostModal';

export const Profile: React.FC = () => {
    const { user, logout, isAuthenticated, updateUser, updateEmail, updatePassword } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();

    // Data State
    const [bookings, setBookings] = useState<any[]>([]);
    const [myProperties, setMyProperties] = useState<any[]>([]);
    const [myServices, setMyServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // UI State
    const [activeTab, setActiveTab] = useState<'overview' | 'my_properties' | 'my_services' | 'payouts' | 'settings' | 'security'>('overview');
    const [uploading, setUploading] = useState(false);
    const [isHostModalOpen, setIsHostModalOpen] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Forms State
    const [profileForm, setProfileForm] = useState({
        name: user?.name || '',
        phone: '',
        companyName: user?.company_name || ''
    });

    const [emailForm, setEmailForm] = useState({
        email: user?.email || '',
        confirmEmail: ''
    });

    const [passwordForm, setPasswordForm] = useState({
        newPassword: '',
        confirmPassword: ''
    });

    const [payoutForm, setPayoutForm] = useState({
        iban: '',
        bankName: '',
        bankAccountHolderName: '',
        cryptoWallet: ''
    });

    const [savingPayout, setSavingPayout] = useState(false);

    const [savingProfile, setSavingProfile] = useState(false);
    const [changingEmail, setChangingEmail] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);

    // Initial Data Fetch
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/');
            return;
        }

        const fetchData = async () => {
            if (user?.id) {
                try {
                    const [bookingsData, propertiesData, servicesData, profile] = await Promise.all([
                        db.getBookings(user.id),
                        db.getPropertiesByHost(user.id),
                        db.getServicesByProvider(user.id),
                        db.getUserProfile(user.id)
                    ]);

                    setBookings(bookingsData || []);
                    setMyProperties(propertiesData || []);
                    setMyServices(servicesData || []);

                    if (profile) {
                        setProfileForm(prev => ({
                            ...prev,
                            name: profile.full_name || user.name,
                            phone: profile.phone || '',
                            companyName: profile.company_name || user.company_name || ''
                        }));
                        setPayoutForm({
                            iban: profile.iban || '',
                            bankName: profile.bank_name || '',
                            bankAccountHolderName: profile.bank_account_holder_name || '',
                            cryptoWallet: (profile as any).crypto_wallet || ''
                        });
                        // Update email form initial value
                        setEmailForm(prev => ({
                            ...prev,
                            email: profile.email || user.email
                        }));
                    }
                } catch (error) {
                    console.error('Error fetching data:', error);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchData();
    }, [user, isAuthenticated, navigate]);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    // --- Actions ---

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setUploading(true);
        const toastId = toast.loading(t('auth.avatar_uploading'));
        try {
            const publicUrl = await db.uploadAvatar(file);
            await db.updateUserProfile(user.id, { avatar_url: publicUrl });
            await updateUser({ avatar: publicUrl });
            toast.success(t('auth.avatar_success'), { id: toastId });
        } catch (error: any) {
            console.error('Avatar upload error:', error);
            toast.error(error.message || t('auth.avatar_error'), { id: toastId });
        } finally {
            setUploading(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setSavingProfile(true);
        try {
            await db.updateUserProfile(user.id, {
                full_name: profileForm.name,
                phone: profileForm.phone,
                company_name: profileForm.companyName
            });
            await updateUser({
                name: profileForm.name,
                company_name: profileForm.companyName
            });
            toast.success(t('profile.save_success') || 'Profile updated successfully');
        } catch (error: any) {
            toast.error(error.message || 'Failed to update profile');
        } finally {
            setSavingProfile(false);
        }
    };

    const handleUpdatePayout = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setSavingPayout(true);
        try {
            await db.updateUserProfile(user.id, {
                iban: payoutForm.iban,
                bank_name: payoutForm.bankName,
                bank_account_holder_name: payoutForm.bankAccountHolderName,
                // @ts-ignore - added to DB but maybe not all types yet
                crypto_wallet: payoutForm.cryptoWallet
            });
            toast.success('Payout details updated successfully');
        } catch (error: any) {
            toast.error(error.message || 'Failed to update payout details');
        } finally {
            setSavingPayout(false);
        }
    };

    const handleCancelBooking = async (bookingId: string, createdAt: string) => {
        const createdTime = new Date(createdAt).getTime();
        const now = Date.now();
        const diffHours = (now - createdTime) / (1000 * 60 * 60);

        const isFree = diffHours <= 48;
        const message = isFree
            ? t('profile.cancel_free') || "Are you sure? You are within the 48-hour free cancellation window."
            : t('profile.cancel_fee') || "Are you sure? The 48-hour free cancellation window has passed. Standard cancellation policies apply.";

        if (!window.confirm(message)) return;

        const toastId = toast.loading(t('booking.cancelling') || 'Cancelling booking...');
        try {
            await db.cancelBooking(bookingId);
            toast.success(t('profile.cancel_success'), { id: toastId });
            // Refresh bookings locally
            setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b));
        } catch (error: any) {
            console.error('Cancellation error:', error);
            toast.error(error.message || t('profile.cancel_error'), { id: toastId });
        }
    };

    const handleChangeEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        if (emailForm.email === user?.email) return;

        setChangingEmail(true);
        try {
            await updateEmail(emailForm.email);
            toast.success(t('profile.email_verify_sent'));
        } catch (error: any) {
            toast.error(error.message || 'Failed to update email');
        } finally {
            setChangingEmail(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            toast.error(t('auth.error.password_match'));
            return;
        }

        setChangingPassword(true);
        try {
            await updatePassword(passwordForm.newPassword);
            toast.success(t('auth.password_success'));
            setPasswordForm({ newPassword: '', confirmPassword: '' });
        } catch (error: any) {
            toast.error(error.message || 'Failed to update password');
        } finally {
            setChangingPassword(false);
        }
    };

    const handleBecomeHost = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // Update role in DB
            await db.updateUserProfile(user.id, { role: 'host' });
            // Update role in Context
            await updateUser({ role: 'host' });
            toast.success(t('profile.host_success') || 'Congratulations! You are now a host.');
            setIsHostModalOpen(false);
            // Refresh page or state to show new tabs
        } catch (error: any) {
            console.error('Error upgrading to host:', error);
            toast.error('Failed to update role');
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-24 pb-12 transition-colors">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Sidebar Navigation */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* User Card */}
                        <div className="bg-white dark:bg-slate-800/80 rounded-2xl shadow-sm p-6 text-center border border-slate-100 dark:border-slate-800/50">
                            <div className="relative inline-block mb-4 group/avatar">
                                <img
                                    src={user.avatar}
                                    alt={user.name}
                                    className="w-24 h-24 rounded-full border-4 border-slate-100 dark:border-slate-800/50 object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                    <Camera size={24} className="text-white" />
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleAvatarUpload}
                                    className="hidden"
                                    accept="image/*"
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full shadow-lg hover:scale-110 transition-transform disabled:opacity-50"
                                >
                                    <Camera size={14} />
                                </button>
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white truncate">{user.name}</h2>
                            <p className="text-slate-500 text-sm mb-4">{user.email}</p>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800/50 text-xs font-semibold text-slate-600 dark:text-slate-300">
                                <span className={`w-2 h-2 rounded-full ${user.role === 'admin' ? 'bg-purple-500' : 'bg-green-500'}`}></span>
                                {user.role === 'host' ? t('profile.role.host') : user.role === 'admin' ? t('profile.role.admin') : t('profile.role.guest')}
                            </div>
                        </div>

                        {/* Navigation Tabs */}
                        <nav className="bg-white dark:bg-slate-800/80 rounded-2xl shadow-sm overflow-hidden border border-slate-100 dark:border-slate-800/50">
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={`w-full flex items-center gap-3 px-6 py-4 text-left transition-colors ${activeTab === 'overview' ? 'bg-primary/5 text-primary border-l-4 border-primary' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/80'}`}
                            >
                                <Grid size={20} />
                                <span className="font-medium">{t('profile.bookings') || 'Overview'}</span>
                            </button>

                            {/* Host Only Tabs */}
                            {(user.role === 'host' || user.role === 'admin') && (
                                <>
                                    <button
                                        onClick={() => setActiveTab('my_properties')}
                                        className={`w-full flex items-center gap-3 px-6 py-4 text-left transition-colors ${activeTab === 'my_properties' ? 'bg-primary/5 text-primary border-l-4 border-primary' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/80'}`}
                                    >
                                        <Home size={20} />
                                        <span className="font-medium">{t('profile.my_properties')}</span>
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('my_services')}
                                        className={`w-full flex items-center gap-3 px-6 py-4 text-left transition-colors ${activeTab === 'my_services' ? 'bg-primary/5 text-primary border-l-4 border-primary' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/80'}`}
                                    >
                                        <Car size={20} />
                                        <span className="font-medium">{t('profile.my_services')}</span>
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('payouts')}
                                        className={`w-full flex items-center gap-3 px-6 py-4 text-left transition-colors ${activeTab === 'payouts' ? 'bg-primary/5 text-primary border-l-4 border-primary' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/80'}`}
                                    >
                                        <Banknote size={20} />
                                        <span className="font-medium">{t('profile.payout_details')}</span>
                                    </button>
                                </>
                            )}

                            <button
                                onClick={() => setActiveTab('settings')}
                                className={`w-full flex items-center gap-3 px-6 py-4 text-left transition-colors ${activeTab === 'settings' ? 'bg-primary/5 text-primary border-l-4 border-primary' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/80'}`}
                            >
                                <Settings size={20} />
                                <span className="font-medium">{t('profile.settings')}</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('security')}
                                className={`w-full flex items-center gap-3 px-6 py-4 text-left transition-colors ${activeTab === 'security' ? 'bg-primary/5 text-primary border-l-4 border-primary' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/80'}`}
                            >
                                <Shield size={20} />
                                <span className="font-medium">{t('profile.security')}</span>
                            </button>
                            <div className="border-t border-slate-100 dark:border-slate-800/50 mt-2 pt-2">
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-6 py-4 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                                >
                                    <LogOut size={20} />
                                    <span className="font-medium">{t('auth.logout')}</span>
                                </button>
                            </div>
                        </nav>

                        {/* Become a Host Call to Action */}
                        {user.role === 'guest' && (
                            <div className="bg-gradient-to-br from-primary to-teal-600 rounded-2xl p-6 text-white shadow-lg overflow-hidden relative">
                                <div className="absolute top-0 right-0 p-4 opacity-20">
                                    <Home size={80} />
                                </div>
                                <h3 className="text-lg font-bold mb-2 relative z-10">{t('profile.become_host_title') || 'Become a Host'}</h3>
                                <p className="text-white/90 text-sm mb-4 relative z-10">
                                    {t('profile.become_host_desc') || 'Earn money by renting out your property or vehicle.'}
                                </p>
                                <button
                                    onClick={() => setIsHostModalOpen(true)}
                                    disabled={loading}
                                    className="w-full bg-white text-primary font-bold py-2.5 rounded-xl text-sm hover:bg-slate-50 transition-colors relative z-10"
                                >
                                    {loading ? t('auth.submitting') : t('profile.upgrade_btn')}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Main Content Area */}
                    <div className="lg:col-span-9">

                        {/* TAB: OVERVIEW (BOOKINGS) */}
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-white">{t('profile.bookings')}</h2>
                                    <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-bold rounded-full">
                                        {bookings.length}
                                    </span>
                                </div>

                                {loading ? (
                                    <div className="grid gap-4">
                                        {[1, 2].map(i => (
                                            <div key={i} className="bg-white dark:bg-slate-800/80 rounded-2xl h-40 animate-pulse border border-slate-100 dark:border-slate-800/50"></div>
                                        ))}
                                    </div>
                                ) : bookings.length === 0 ? (
                                    <div className="bg-white dark:bg-slate-800/80 rounded-3xl shadow-sm p-12 text-center border-2 border-dashed border-slate-100 dark:border-slate-800/50">
                                        <Package size={48} className="mx-auto text-slate-200 dark:text-slate-300 mb-6" />
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{t('profile.no_bookings')}</h3>
                                        <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm mx-auto">{t('profile.empty_message')}</p>
                                        <button
                                            onClick={() => navigate('/stays')}
                                            className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-2xl font-bold transition-all hover:scale-105 shadow-lg shadow-primary/20"
                                        >
                                            {t('profile.explore_button')}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid gap-6">
                                        {bookings.map((booking) => (
                                            <div key={booking.id} className="bg-white dark:bg-slate-800/80 rounded-2xl shadow-sm overflow-hidden border border-slate-100 dark:border-slate-800/50 group hover:shadow-xl transition-all duration-300">
                                                <div className="flex flex-col md:flex-row">
                                                    <div className="w-full md:w-64 h-48 md:h-auto overflow-hidden relative">
                                                        {booking.property?.images?.[0] ? (
                                                            <img src={booking.property.images[0]} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" alt={booking.property.title} />
                                                        ) : booking.service?.images?.[0] ? (
                                                            <img src={booking.service.images[0]} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" alt={booking.service.title} />
                                                        ) : (
                                                            <div className="flex items-center justify-center h-full bg-slate-50 dark:bg-slate-900 text-slate-400">
                                                                <Package size={32} />
                                                            </div>
                                                        )}
                                                        <div className="absolute top-4 left-4">
                                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm ${booking.status === 'confirmed' ? 'bg-green-500 text-white' :
                                                                booking.status === 'cancelled' ? 'bg-red-500 text-white' :
                                                                    'bg-amber-500 text-white'
                                                                }`}>
                                                                {booking.status}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="p-6 flex-grow flex flex-col justify-between">
                                                        <div>
                                                            <div className="flex justify-between items-start mb-4">
                                                                <div>
                                                                    <p className="text-[10px] font-bold text-accent dark:text-amber-400 uppercase tracking-widest mb-1">
                                                                        {booking.item_type}
                                                                    </p>
                                                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                                                                        {booking.property?.title || booking.service?.title || 'Booking'}
                                                                    </h3>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">{t('prop.total')}</p>
                                                                    <p className="text-xl font-serif font-bold text-slate-900 dark:text-white">
                                                                        €{booking.total_price}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <div className="flex flex-wrap gap-4 text-sm">
                                                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 px-3 py-1.5 rounded-xl">
                                                                    <Calendar size={14} className="text-primary" />
                                                                    <span className="font-medium">
                                                                        {new Date(booking.check_in).toLocaleDateString()}
                                                                        {booking.check_out && ` - ${new Date(booking.check_out).toLocaleDateString()}`}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="mt-6 flex items-center justify-between border-t border-slate-50 dark:border-slate-800/50 pt-4">
                                                            <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                                                {t('profile.id_label')}: {booking.id.slice(0, 8)}
                                                            </p>
                                                            <button
                                                                onClick={() => navigate(`/properties/${booking.item_id}`)}
                                                                className="text-xs font-bold text-primary hover:text-primary-dark transition-colors flex items-center gap-1 group/btn"
                                                            >
                                                                {t('profile.view_details')}
                                                                <Package size={14} className="group-hover/btn:translate-x-0.5 transition-transform" />
                                                            </button>

                                                            {/* Cancel Button */}
                                                            {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                                                                <button
                                                                    onClick={() => handleCancelBooking(booking.id, booking.created_at)}
                                                                    className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors flex items-center gap-1 ml-4"
                                                                >
                                                                    {t('profile.cancel') || 'Cancel'}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB: MY PROPERTIES */}
                        {activeTab === 'my_properties' && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-white">{t('profile.my_properties')}</h2>
                                    <button
                                        onClick={() => navigate('/list-property')}
                                        className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl font-bold transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                                    >
                                        <Home size={18} />
                                        {t('profile.add_property')}
                                    </button>
                                </div>

                                {loading ? (
                                    <div className="grid gap-4">
                                        {[1, 2].map(i => (
                                            <div key={i} className="bg-white dark:bg-slate-800/80 rounded-2xl h-40 animate-pulse border border-slate-100 dark:border-slate-800/50"></div>
                                        ))}
                                    </div>
                                ) : myProperties.length === 0 ? (
                                    <div className="bg-white dark:bg-slate-800/80 rounded-3xl shadow-sm p-12 text-center border-2 border-dashed border-slate-100 dark:border-slate-800/50">
                                        <Home size={48} className="mx-auto text-slate-200 dark:text-slate-300 mb-6" />
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{t('profile.no_properties')}</h3>
                                        <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm mx-auto">{t('profile.add_property')}</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-6">
                                        {myProperties.map((property) => (
                                            <div key={property.id} className="bg-white dark:bg-slate-800/80 rounded-2xl shadow-sm overflow-hidden border border-slate-100 dark:border-slate-800/50 group hover:shadow-xl transition-all duration-300">
                                                <div className="flex flex-col md:flex-row">
                                                    <div className="w-full md:w-64 h-48 md:h-auto overflow-hidden relative">
                                                        {property.images?.[0] ? (
                                                            <img src={property.images[0]} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" alt={property.title} />
                                                        ) : (
                                                            <div className="flex items-center justify-center h-full bg-slate-50 dark:bg-slate-900 text-slate-400">
                                                                <Home size={32} />
                                                            </div>
                                                        )}
                                                        <div className="absolute top-4 left-4">
                                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm ${property.status === 'approved' ? 'bg-green-500 text-white' :
                                                                property.status === 'rejected' ? 'bg-red-500 text-white' :
                                                                    'bg-amber-500 text-white'
                                                                }`}>
                                                                {property.status || 'Pending'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="p-6 flex-grow flex flex-col justify-between">
                                                        <div>
                                                            <div className="flex justify-between items-start mb-4">
                                                                <div>
                                                                    <p className="text-[10px] font-bold text-accent dark:text-amber-400 uppercase tracking-widest mb-1">
                                                                        {property.type}
                                                                    </p>
                                                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                                                                        {property.title}
                                                                    </h3>
                                                                    <div className="flex items-center gap-1 text-slate-500 text-sm mt-1">
                                                                        <MapPin size={14} />
                                                                        {property.location}
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-xl font-serif font-bold text-slate-900 dark:text-white">
                                                                        €{property.price_per_night}
                                                                        <span className="text-xs font-sans font-normal text-slate-400">/night</span>
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="mt-6 flex items-center justify-end border-t border-slate-50 dark:border-slate-800/50 pt-4">
                                                            <button
                                                                onClick={() => navigate(`/properties/${property.id}`)}
                                                                className="text-white bg-slate-900 dark:bg-slate-800/50 px-4 py-2 rounded-lg text-sm font-medium hover:bg-black dark:hover:bg-slate-600 transition-colors"
                                                            >
                                                                {t('profile.view_page') || 'View Page'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB: MY SERVICES */}
                        {activeTab === 'my_services' && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-white">{t('profile.my_services')}</h2>
                                    <button
                                        onClick={() => navigate('/add-service')}
                                        className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl font-bold transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                                    >
                                        <Car size={18} />
                                        {t('profile.add_service')}
                                    </button>
                                </div>

                                {loading ? (
                                    <div className="grid gap-4">
                                        {[1, 2].map(i => (
                                            <div key={i} className="bg-white dark:bg-slate-800/80 rounded-2xl h-40 animate-pulse border border-slate-100 dark:border-slate-800/50"></div>
                                        ))}
                                    </div>
                                ) : myServices.length === 0 ? (
                                    <div className="bg-white dark:bg-slate-800/80 rounded-3xl shadow-sm p-12 text-center border-2 border-dashed border-slate-100 dark:border-slate-800/50">
                                        <Car size={48} className="mx-auto text-slate-200 dark:text-slate-300 mb-6" />
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{t('profile.no_services')}</h3>
                                        <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm mx-auto">{t('profile.add_service')}</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-6">
                                        {myServices.map((service) => (
                                            <div key={service.id} className="bg-white dark:bg-slate-800/80 rounded-2xl shadow-sm overflow-hidden border border-slate-100 dark:border-slate-800/50 group hover:shadow-xl transition-all duration-300">
                                                <div className="flex flex-col md:flex-row">
                                                    <div className="w-full md:w-64 h-48 md:h-auto overflow-hidden relative">
                                                        {service.images?.[0] ? (
                                                            <img src={service.images[0]} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" alt={service.title} />
                                                        ) : (
                                                            <div className="flex items-center justify-center h-full bg-slate-50 dark:bg-slate-900 text-slate-400">
                                                                <Car size={32} />
                                                            </div>
                                                        )}
                                                        <div className="absolute top-4 left-4">
                                                            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm bg-green-500 text-white">
                                                                Active
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="p-6 flex-grow flex flex-col justify-between">
                                                        <div>
                                                            <div className="flex justify-between items-start mb-4">
                                                                <div>
                                                                    <p className="text-[10px] font-bold text-accent dark:text-amber-400 uppercase tracking-widest mb-1">
                                                                        {service.type}
                                                                    </p>
                                                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                                                                        {service.title}
                                                                    </h3>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-xl font-serif font-bold text-slate-900 dark:text-white">
                                                                        €{service.price}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="mt-6 flex items-center justify-end border-t border-slate-50 dark:border-slate-800/50 pt-4">
                                                            <button
                                                                onClick={() => {
                                                                    // Navigate based on type since service detail pages might differ or use a standardized one
                                                                    if (service.type === 'car') navigate('/car-rental');
                                                                    else if (service.type === 'bike') navigate('/bike-rental');
                                                                    // For now, services don't have a single detail page in the same way, redirecting to category listing
                                                                }}
                                                                className="text-white bg-slate-900 dark:bg-slate-800/50 px-4 py-2 rounded-lg text-sm font-medium hover:bg-black dark:hover:bg-slate-600 transition-colors"
                                                            >
                                                                {t('profile.view_listing') || 'View Listing'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB: SETTINGS (PERSONAL INFO) */}
                        {activeTab === 'settings' && (
                            <div className="bg-white dark:bg-slate-800/80 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800/50 p-8">
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">{t('profile.personal_info')}</h2>
                                <form onSubmit={handleUpdateProfile} className="space-y-6 max-w-2xl">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                                {t('auth.name')}
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={profileForm.name}
                                                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/50 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white"
                                                    required
                                                />
                                                <UserCircle size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                                {t('profile.phone')}
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="tel"
                                                    value={profileForm.phone}
                                                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                                                    placeholder="+90..."
                                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/50 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white"
                                                />
                                                <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Company Name (For Hosts) */}
                                    {(user.role === 'host' || user.role === 'admin') && (
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                                {t('profile.company_name')}
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={profileForm.companyName}
                                                    onChange={(e) => setProfileForm({ ...profileForm, companyName: e.target.value })}
                                                    placeholder="Alanya Holidays Ltd."
                                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/50 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white"
                                                />
                                                <Home size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800/50">
                                        <button
                                            type="submit"
                                            disabled={savingProfile}
                                            className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {savingProfile ? t('auth.submitting') : (
                                                <>
                                                    <Save size={18} />
                                                    {t('profile.save_btn')}
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* TAB: SECURITY */}
                        {activeTab === 'security' && (
                            <div className="space-y-8">
                                {/* Change Password */}
                                <div className="bg-white dark:bg-slate-800/80 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800/50 p-8">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-3 bg-primary/10 rounded-xl text-primary">
                                            <Key size={24} />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('profile.change_password')}</h2>
                                            <p className="text-slate-500 text-sm">{t('profile.password_subtitle')}</p>
                                        </div>
                                    </div>

                                    <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{t('profile.new_password')}</label>
                                            <input
                                                type="password"
                                                value={passwordForm.newPassword}
                                                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/50 rounded-xl focus:ring-2 focus:ring-primary outline-none dark:text-white"
                                                required
                                                minLength={6}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{t('profile.confirm_password')}</label>
                                            <input
                                                type="password"
                                                value={passwordForm.confirmPassword}
                                                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/50 rounded-xl focus:ring-2 focus:ring-primary outline-none dark:text-white"
                                                required
                                                minLength={6}
                                            />
                                        </div>
                                        <div className="pt-2">
                                            <button
                                                type="submit"
                                                disabled={changingPassword}
                                                className="bg-slate-900 dark:bg-slate-800/50 text-white px-6 py-2.5 rounded-xl font-medium transition-colors hover:bg-slate-800 disabled:opacity-50"
                                            >
                                                {changingPassword ? t('auth.submitting') : t('profile.update_password')}
                                            </button>
                                        </div>
                                    </form>
                                </div>

                                {/* Change Email */}
                                <div className="bg-white dark:bg-slate-800/80 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800/50 p-8">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-3 bg-indigo-50 dark:bg-slate-800/50 rounded-xl text-indigo-600 dark:text-slate-200">
                                            <Mail size={24} />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('profile.email_verify_title')}</h2>
                                            <p className="text-slate-500 text-sm">{t('profile.email_verify_subtitle')}</p>
                                        </div>
                                    </div>

                                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/50 rounded-xl p-4 mb-6 flex gap-3">
                                        <AlertTriangle className="text-amber-600 dark:text-amber-500 shrink-0" size={20} />
                                        <p className="text-sm text-amber-800 dark:text-amber-200">
                                            {t('profile.email_verify_notice')}
                                        </p>
                                    </div>

                                    <form onSubmit={handleChangeEmail} className="space-y-4 max-w-md">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{t('profile.current_email')}</label>
                                            <input
                                                type="email"
                                                value={user.email}
                                                disabled
                                                className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800/50 rounded-xl text-slate-500 cursor-not-allowed"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{t('profile.new_email')}</label>
                                            <input
                                                type="email"
                                                value={emailForm.email}
                                                onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })}
                                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/50 rounded-xl focus:ring-2 focus:ring-primary outline-none dark:text-white"
                                                required
                                            />
                                        </div>
                                        <div className="pt-2">
                                            <button
                                                type="submit"
                                                disabled={changingEmail || emailForm.email === user.email}
                                                className="bg-primary text-white px-6 py-2.5 rounded-xl font-medium transition-colors hover:bg-primary-dark disabled:opacity-50 disabled:grayscale"
                                            >
                                                {changingEmail ? t('auth.submitting') : t('profile.save_btn')}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        {/* TAB: PAYOUT DETAILS */}
                        {activeTab === 'payouts' && (
                            <div className="space-y-8 animate-fade-in">
                                <div className="bg-white dark:bg-slate-800/80 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800/50 p-8">
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Payout Details</h2>
                                    <p className="text-slate-500 mb-8">Set up how you want to receive your earnings from listings.</p>

                                    <form onSubmit={handleUpdatePayout} className="space-y-8 max-w-2xl">
                                        <div className="space-y-6">
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                                <Banknote className="text-teal-600 dark:text-cyan-400 " size={20} />
                                                Bank Transfer (IBAN)
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="md:col-span-2">
                                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">IBAN</label>
                                                    <input
                                                        type="text"
                                                        value={payoutForm.iban}
                                                        onChange={(e) => setPayoutForm({ ...payoutForm, iban: e.target.value })}
                                                        placeholder="TR00 0000 0000 0000 0000 0000 00"
                                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/50 rounded-xl focus:ring-2 focus:ring-primary outline-none dark:text-white font-mono"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Bank Name</label>
                                                    <input
                                                        type="text"
                                                        value={payoutForm.bankName}
                                                        onChange={(e) => setPayoutForm({ ...payoutForm, bankName: e.target.value })}
                                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/50 rounded-xl focus:ring-2 focus:ring-primary outline-none dark:text-white"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Account Holder Name</label>
                                                    <input
                                                        type="text"
                                                        value={payoutForm.bankAccountHolderName}
                                                        onChange={(e) => setPayoutForm({ ...payoutForm, bankAccountHolderName: e.target.value })}
                                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/50 rounded-xl focus:ring-2 focus:ring-primary outline-none dark:text-white"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-8 border-t border-slate-100 dark:border-slate-800/50 space-y-6">
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                                <Wallet className="text-orange-500" size={20} />
                                                Crypto Wallet (USDT/USDC)
                                            </h3>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Wallet Address (TRC20 / ERC20 / BEP20)</label>
                                                <input
                                                    type="text"
                                                    value={payoutForm.cryptoWallet}
                                                    onChange={(e) => setPayoutForm({ ...payoutForm, cryptoWallet: e.target.value })}
                                                    placeholder="0x... or T..."
                                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/50 rounded-xl focus:ring-2 focus:ring-primary outline-none dark:text-white font-mono"
                                                />
                                                <p className="text-xs text-slate-500 mt-2">Please ensure the network type is clearly specified if needed in notes.</p>
                                            </div>
                                        </div>

                                        <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800/50">
                                            <button
                                                type="submit"
                                                disabled={savingPayout}
                                                className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
                                            >
                                                {savingPayout ? t('auth.submitting') : (
                                                    <>
                                                        <Save size={18} />
                                                        Save Payout Details
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <BecomeHostModal
                isOpen={isHostModalOpen}
                onClose={() => setIsHostModalOpen(false)}
                onConfirm={handleBecomeHost}
                isLoading={loading}
            />
        </div>
    );
};
