import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../api-services';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { toast } from 'react-hot-toast';
import { BecomeHostModal } from '../components/modals/BecomeHostModal';
import { ProfileSidebar } from '../components/user/profile/ProfileSidebar';
import { ProfileBookingsTab } from '../components/user/profile/ProfileBookingsTab';
import { ProfilePropertiesTab } from '../components/user/profile/ProfilePropertiesTab';
import { ProfileServicesTab } from '../components/user/profile/ProfileServicesTab';
import { ProfileSettingsTab } from '../components/user/profile/ProfileSettingsTab';
import { ProfileSecurityTab } from '../components/user/profile/ProfileSecurityTab';
import { ProfilePayoutTab } from '../components/user/profile/ProfilePayoutTab';

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

        const isMountedRef = { current: true };

        const fetchData = async () => {
            if (user?.id) {
                try {
                    const [bookingsData, propertiesData, servicesData, profile] = await Promise.all([
                        db.getBookings(user.id),
                        db.getPropertiesByHost(user.id),
                        db.getServicesByProvider(user.id),
                        db.getUserProfile(user.id)
                    ]);

                    if (!isMountedRef.current) return;

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
                        setEmailForm(prev => ({
                            ...prev,
                            email: profile.email || user.email
                        }));
                    }
                } catch (error) {
                    // ignore unmount
                } finally {
                    if (isMountedRef.current) setLoading(false);
                }
            }
        };

        fetchData();
        return () => { isMountedRef.current = false; };
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
                    <ProfileSidebar
                        user={user}
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        fileInputRef={fileInputRef}
                        handleAvatarUpload={handleAvatarUpload}
                        uploading={uploading}
                        handleLogout={handleLogout}
                        setIsHostModalOpen={setIsHostModalOpen}
                        loading={loading}
                    />

                    {/* Main Content Area */}
                    <div className="lg:col-span-9">
                        {activeTab === 'overview' && (
                            <ProfileBookingsTab
                                bookings={bookings}
                                loading={loading}
                                onCancelBooking={handleCancelBooking}
                            />
                        )}

                        {activeTab === 'my_properties' && (
                            <ProfilePropertiesTab
                                properties={myProperties}
                                loading={loading}
                            />
                        )}

                        {activeTab === 'my_services' && (
                            <ProfileServicesTab
                                services={myServices}
                                loading={loading}
                            />
                        )}

                        {activeTab === 'settings' && (
                            <ProfileSettingsTab
                                profileForm={profileForm}
                                setProfileForm={setProfileForm}
                                savingProfile={savingProfile}
                                handleUpdateProfile={handleUpdateProfile}
                                isHostOrAdmin={user.role === 'host' || user.role === 'admin'}
                            />
                        )}

                        {activeTab === 'security' && (
                            <ProfileSecurityTab
                                userEmail={user.email}
                                emailForm={emailForm}
                                setEmailForm={setEmailForm}
                                changingEmail={changingEmail}
                                handleChangeEmail={handleChangeEmail}
                                passwordForm={passwordForm}
                                setPasswordForm={setPasswordForm}
                                changingPassword={changingPassword}
                                handleChangePassword={handleChangePassword}
                            />
                        )}

                        {activeTab === 'payouts' && (
                            <ProfilePayoutTab
                                payoutForm={payoutForm}
                                setPayoutForm={setPayoutForm}
                                savingPayout={savingPayout}
                                handleUpdatePayout={handleUpdatePayout}
                            />
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
