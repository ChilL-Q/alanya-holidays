import React, { useState } from 'react';
import { Home, Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useModal } from '../../context/ModalContext';
import { usersService } from '../../api-services';
import { BecomeHostModal } from '../modals/BecomeHostModal';

export const ListPropertyAction: React.FC = () => {
    const { user, updateUser } = useAuth();
    const { t } = useLanguage();
    const { openLogin } = useModal();
    const navigate = useNavigate();

    const [isHostModalOpen, setIsHostModalOpen] = useState(false);
    const [isUpgrading, setIsUpgrading] = useState(false);

    const handleBecomeHost = async () => {
        if (!user) return;
        setIsUpgrading(true);
        try {
            await usersService.updateUserProfile(user.id, { role: 'host' });
            await updateUser({ role: 'host' });
            toast.success(t('profile.host_success') || 'Congratulations! You are now a host.');
            setIsHostModalOpen(false);
            navigate('/host/dashboard');
        } catch (error: any) {
            console.error('Error upgrading to host:', error);
            toast.error('Failed to update role');
        } finally {
            setIsUpgrading(false);
        }
    };

    if (user?.role === 'guest') {
        return (
            <>
                <div className="relative hidden md:block">
                    <button
                        onClick={() => setIsHostModalOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-full text-sm font-medium hover:shadow-lg hover:shadow-emerald-500/20 transition-all duration-300 ease-out hover:scale-105 active:scale-95 whitespace-nowrap"
                    >
                        <Home size={16} className="text-white" />
                        <span>{t('profile.upgrade_btn')}</span>
                    </button>
                </div>
                <BecomeHostModal
                    isOpen={isHostModalOpen}
                    onClose={() => setIsHostModalOpen(false)}
                    onConfirm={handleBecomeHost}
                    isLoading={isUpgrading}
                />
            </>
        );
    }

    const handleListBusinessClick = (e: React.MouseEvent) => {
        if (!user) {
            e.preventDefault();
            toast.error(t('auth.required') || 'Please log in to add a listing');
            openLogin();
        }
    };

    return (
        <div className="relative hidden md:block">
            <Link
                to="/add-listing"
                onClick={handleListBusinessClick}
                className="flex items-center gap-1.5 p-2 lg:px-3 lg:py-2 bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-700 text-white rounded-full text-sm font-medium hover:shadow-lg hover:shadow-slate-500/20 transition-all duration-300 ease-out hover:scale-105 active:scale-95 whitespace-nowrap"
                title={t('nav.list_business') || 'List Business'}
            >
                <Plus size={16} className="text-teal-400 dark:text-cyan-400 shrink-0" />
                <span className="hidden lg:inline">{t('nav.list_business') || 'List Business'}</span>
            </Link>
        </div>
    );
};
