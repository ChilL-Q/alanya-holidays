import React, { useState, useRef } from 'react';
import { Home, Plus, Car } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { db } from '../../api-services';
import { useClickOutside } from '../../hooks/useClickOutside';
import { BecomeHostModal } from '../modals/BecomeHostModal';

export const ListPropertyAction: React.FC = () => {
    const { user, updateUser } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();

    const [isListMenuOpen, setIsListMenuOpen] = useState(false);
    const [isHostModalOpen, setIsHostModalOpen] = useState(false);
    const [isUpgrading, setIsUpgrading] = useState(false);

    const listMenuRef = useRef<HTMLDivElement>(null);
    useClickOutside(listMenuRef, () => setIsListMenuOpen(false));

    const handleBecomeHost = async () => {
        if (!user) return;
        setIsUpgrading(true);
        try {
            await db.updateUserProfile(user.id, { role: 'host' });
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

    // Host or Admin
    return (
        <div className="relative hidden md:block" ref={listMenuRef}>
            <button
                onClick={() => setIsListMenuOpen(!isListMenuOpen)}
                className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-700 text-white rounded-full text-sm font-medium hover:shadow-lg hover:shadow-slate-500/20 transition-all duration-300 ease-out hover:scale-105 active:scale-95 whitespace-nowrap"
            >
                <Plus size={16} className="text-teal-400 dark:text-cyan-400 " />
                <span>{t('nav.list_business') || 'List Business'}</span>
            </button>
            {/* List Dropdown */}
            {isListMenuOpen && (
                <div className="absolute top-full right-0 mt-3 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800/50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
                    <div className="p-2 space-y-1">
                        <Link to="/list-property" onClick={() => setIsListMenuOpen(false)} className="flex items-start gap-4 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/90 rounded-xl transition-all group">
                            <div className="w-10 h-10 bg-teal-50 dark:bg-slate-800/50 text-teal-600 dark:text-cyan-400 rounded-lg flex items-center justify-center group-hover:bg-teal-100 dark:group-hover:bg-slate-700/50 transition-colors">
                                <Home size={20} />
                            </div>
                            <div>
                                <span className="block text-sm font-bold text-slate-900 dark:text-white">{t('nav.list_property')}</span>
                                <span className="block text-xs text-slate-500 font-medium">{t('nav.list_desc')}</span>
                            </div>
                        </Link>
                        <Link to="/add-service" onClick={() => setIsListMenuOpen(false)} className="flex items-start gap-4 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/90 rounded-xl transition-all group">
                            <div className="w-10 h-10 bg-purple-50 dark:bg-slate-800/50 text-purple-600 rounded-lg flex items-center justify-center group-hover:bg-purple-100 dark:group-hover:bg-purple-900/50 transition-colors">
                                <Car size={20} />
                            </div>
                            <div>
                                <span className="block text-sm font-bold text-slate-900 dark:text-white">{t('nav.list_service')}</span>
                                <span className="block text-xs text-slate-500 font-medium">{t('nav.service_desc')}</span>
                            </div>
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
};
