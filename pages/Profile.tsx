import React, { useState, useEffect } from 'react';
import { useAuth, User as UserType } from '../context/AuthContext';
import { db } from '../services/db';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Calendar, MapPin, Package, LogOut, Edit2, Save, X, Phone, UserCircle, Camera } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { toast } from 'react-hot-toast';

export const Profile: React.FC = () => {
    const { user, logout, isAuthenticated, updateUser } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Edit Form State
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: '' // Added phone though not in all contexts, many profiles use it
    });

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/');
            return;
        }

        const fetchBookings = async () => {
            if (user?.id) {
                try {
                    const data = await db.getBookings(user.id);
                    setBookings(data || []);

                    // Also fetch latest profile data to populate phone if exists
                    const profile = await db.getUserProfile(user.id);
                    if (profile) {
                        setFormData(prev => ({
                            ...prev,
                            name: profile.full_name || user.name,
                            email: profile.email || user.email,
                            phone: profile.phone || ''
                        }));
                    }
                } catch (error) {
                    console.error('Error fetching data:', error);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchBookings();
    }, [user, isAuthenticated, navigate]);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setSaving(true);
        try {
            // Update in DB (profiles table)
            await db.updateUserProfile(user.id, {
                full_name: formData.name,
                email: formData.email,
                phone: formData.phone
            });

            // Update in Auth Context (local state)
            await updateUser({
                name: formData.name,
                email: formData.email
            });

            toast.success(t('profile.save_success') || 'Profile updated successfully');
            setIsEditing(false);
        } catch (error: any) {
            console.error('Update profile error:', error);
            toast.error(error.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setUploading(true);
        const toastId = toast.loading('Uploading avatar...');
        try {
            const publicUrl = await db.uploadAvatar(file);

            // Update in DB
            await db.updateUserProfile(user.id, { avatar_url: publicUrl });

            // Update in Auth Context
            await updateUser({ avatar: publicUrl });

            toast.success('Avatar updated successfully', { id: toastId });
        } catch (error: any) {
            console.error('Avatar upload error:', error);
            toast.error(error.message || 'Failed to upload avatar', { id: toastId });
        } finally {
            setUploading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-24 pb-12 transition-colors">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6 text-center border border-slate-100 dark:border-slate-800">
                            <div className="relative inline-block mb-4 group/avatar">
                                <img
                                    src={user.avatar}
                                    alt={user.name}
                                    className="w-24 h-24 rounded-full border-4 border-slate-100 dark:border-slate-700 object-cover"
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

                            {isEditing ? (
                                <form onSubmit={handleUpdateProfile} className="space-y-4 text-left">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                                            {t('auth.name')}
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white"
                                                required
                                            />
                                            <UserCircle size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                                            {t('auth.email')}
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white"
                                                required
                                            />
                                            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                                            {t('profile.phone')}
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="tel"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                placeholder="+90..."
                                                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white"
                                            />
                                            <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        </div>
                                    </div>

                                    <div className="flex gap-2 pt-2">
                                        <button
                                            type="submit"
                                            disabled={saving}
                                            className="flex-1 flex items-center justify-center gap-1.5 bg-primary hover:bg-primary-dark text-white py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                                        >
                                            {saving ? '...' : <Save size={14} />}
                                            {t('profile.save')}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsEditing(false)}
                                            className="px-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 py-2 rounded-xl text-sm font-medium transition-colors"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white truncate">{user.name}</h2>
                                    <p className="text-slate-500 mb-6 flex items-center justify-center gap-1.5 text-sm">
                                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                        {user.role === 'host' ? t('profile.role.host') : user.role === 'admin' ? t('profile.role.admin') : t('profile.role.guest')}
                                    </p>

                                    <div className="space-y-4 text-left border-t border-slate-100 dark:border-slate-700 pt-6">
                                        <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                                            <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-900 flex items-center justify-center shrink-0">
                                                <Mail size={16} className="text-primary" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t('auth.email')}</p>
                                                <p className="text-sm truncate font-medium">{user.email}</p>
                                            </div>
                                        </div>
                                        {formData.phone && (
                                            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                                                <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-900 flex items-center justify-center shrink-0">
                                                    <Phone size={16} className="text-primary" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t('profile.phone')}</p>
                                                    <p className="text-sm truncate font-medium">{formData.phone}</p>
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                                            <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-900 flex items-center justify-center shrink-0">
                                                <Calendar size={16} className="text-primary" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t('profile.joined')}</p>
                                                <p className="text-sm font-medium">{new Date(user.joinedDate).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700 space-y-2">
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="w-full flex items-center justify-center gap-2 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 py-2 rounded-xl transition-colors font-medium border border-slate-100 dark:border-slate-700"
                                        >
                                            <Edit2 size={16} />
                                            {t('profile.edit')}
                                        </button>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center justify-center gap-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 py-2 rounded-xl transition-colors font-medium"
                                        >
                                            <LogOut size={16} />
                                            {t('auth.logout')}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-3">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-white">{t('profile.bookings')}</h2>
                            <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-bold rounded-full">
                                {bookings.length}
                            </span>
                        </div>

                        {loading ? (
                            <div className="grid gap-6">
                                {[1, 2].map(i => (
                                    <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl h-40 animate-animate-pulse border border-slate-100 dark:border-slate-800"></div>
                                ))}
                            </div>
                        ) : bookings.length === 0 ? (
                            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm p-12 text-center border-2 border-dashed border-slate-100 dark:border-slate-800">
                                <Package size={48} className="mx-auto text-slate-200 dark:text-slate-700 mb-6" />
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
                            <div className="space-y-6">
                                {bookings.map((booking) => (
                                    <div key={booking.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden border border-slate-100 dark:border-slate-800 group hover:shadow-xl transition-all duration-300">
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
                                                            <p className="text-[10px] font-bold text-accent uppercase tracking-widest mb-1">
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

                                                    <div className="flex flex-wrap gap-6 text-sm">
                                                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 px-3 py-1.5 rounded-xl">
                                                            <Calendar size={14} className="text-primary" />
                                                            <span className="font-medium">
                                                                {new Date(booking.check_in).toLocaleDateString()}
                                                                {booking.check_out && ` - ${new Date(booking.check_out).toLocaleDateString()}`}
                                                            </span>
                                                        </div>
                                                        {(booking.property?.location) && (
                                                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 px-3 py-1.5 rounded-xl">
                                                                <MapPin size={14} className="text-primary" />
                                                                <span className="font-medium truncate max-w-[150px]">{booking.property.location}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="mt-6 flex items-center justify-between border-t border-slate-50 dark:border-slate-800 pt-4">
                                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                                        {t('profile.id_label')}: {booking.id.slice(0, 8)}...
                                                    </p>
                                                    <button
                                                        onClick={() => navigate(`/properties/${booking.item_id}`)}
                                                        className="text-xs font-bold text-primary hover:text-primary-dark transition-colors flex items-center gap-1 group/btn"
                                                    >
                                                        {t('profile.view_details')}
                                                        <Package size={14} className="group-hover/btn:translate-x-0.5 transition-transform" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
