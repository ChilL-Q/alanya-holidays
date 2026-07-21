import React, { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import {
    Building,
    Search,
    Home,
    User,
    LogOut,
    LayoutDashboard,
    Calendar,
    Heart,
    ShoppingCart,
    Sun,
    Moon,
    Sparkles,
    LogIn,
    UserPlus,
    Car,
    Bike,
    Wifi,
    Info,
    Phone,
    Percent,
    HelpCircle,
    FileCheck,
    Mountain,
    Waves,
    Compass
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useModal } from '../../context/ModalContext';
import { useTheme } from '../../context/ThemeContext';
import { useCart } from '../../context/CartContext';
import { useChat } from '../../context/ChatContext';
import { propertiesService } from '../../api-services/api/properties';
import { PropertyDB } from '../../types/models';

export const CommandPalette = () => {
    const { t } = useLanguage();
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [properties, setProperties] = useState<PropertyDB[]>([]);
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { openLogin, openRegister } = useModal();
    const { theme, toggleTheme } = useTheme();
    const { setIsCartOpen } = useCart();
    const { setIsOpen: setChatOpen } = useChat();

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
            if (e.key === 'Escape') {
                setOpen(false);
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    // Fetch properties for search
    useEffect(() => {
        const fetchProps = async () => {
            if (open) {
                try {
                    const { data } = await propertiesService.getProperties(1, 100); // Fetch top 100 for search
                    setProperties(data);
                } catch (e) {
                    console.error("Failed to load properties for search", e);
                }
            }
        };
        fetchProps();
    }, [open]);

    // Clear search when closed
    useEffect(() => {
        if (!open) {
            setSearch('');
        }
    }, [open]);

    const runCommand = (command: () => void) => {
        setOpen(false);
        command();
    };

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-start justify-center pt-[15vh]"
            onClick={() => setOpen(false)}
        >
            <Command
                className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800/50 overflow-hidden animate-scale-in"
                loop
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center border-b border-slate-100 dark:border-slate-800/50 px-4">
                    <Search className="w-5 h-5 text-slate-400 mr-3" />
                    <Command.Input
                        autoFocus
                        placeholder={t('placeholder.search_items')}
                        className="w-full h-14 bg-transparent outline-none text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
                        value={search}
                        onValueChange={setSearch}
                    />
                </div>

                <Command.List className="max-h-[60vh] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                    <Command.Empty className="py-6 text-center text-sm text-slate-500">
                        No results found.
                    </Command.Empty>

                    <Command.Group heading="Pages" className="text-xs font-medium text-slate-400 mb-2 px-2">
                        <Command.Item
                            onSelect={() => runCommand(() => navigate('/'))}
                            className="flex items-center px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/90 cursor-pointer transition-colors aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 text-sm"
                        >
                            <Home className="w-4 h-4 mr-3" />
                            {t('nav.home')}
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => navigate('/stays'))}
                            className="flex items-center px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/90 cursor-pointer transition-colors aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 text-sm"
                        >
                            <Building className="w-4 h-4 mr-3" />
                            {t('nav.stays')}
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => navigate('/favorites'))}
                            className="flex items-center px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/90 cursor-pointer transition-colors aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 text-sm"
                        >
                            <Heart className="w-4 h-4 mr-3" />
                            {t('nav.favorites')}
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => navigate('/services'))}
                            className="flex items-center px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/90 cursor-pointer transition-colors aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 text-sm"
                        >
                            <Sparkles className="w-4 h-4 mr-3" />
                            {t('nav.services')}
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => navigate('/services/car-rental'))}
                            className="flex items-center px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/90 cursor-pointer transition-colors aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 text-sm"
                        >
                            <Car className="w-4 h-4 mr-3" />
                            {t('services.transport.car')}
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => navigate('/services/bike-rental'))}
                            className="flex items-center px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/90 cursor-pointer transition-colors aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 text-sm"
                        >
                            <Bike className="w-4 h-4 mr-3" />
                            {t('nav.motorbike')}
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => navigate('/services/bicycle-rental'))}
                            className="flex items-center px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/90 cursor-pointer transition-colors aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 text-sm"
                        >
                            <Bike className="w-4 h-4 mr-3" />
                            {t('nav.bicycle')}
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => navigate('/experiences/land'))}
                            className="flex items-center px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/90 cursor-pointer transition-colors aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 text-sm"
                        >
                            <Mountain className="w-4 h-4 mr-3" />
                            {t('services.adventure.land')}
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => navigate('/experiences/water'))}
                            className="flex items-center px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/90 cursor-pointer transition-colors aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 text-sm"
                        >
                            <Waves className="w-4 h-4 mr-3" />
                            {t('services.adventure.water')}
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => navigate('/experiences/safari'))}
                            className="flex items-center px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/90 cursor-pointer transition-colors aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 text-sm"
                        >
                            <Compass className="w-4 h-4 mr-3" />
                            {t('services.adventure.safari')}
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => navigate('/services/visa'))}
                            className="flex items-center px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/90 cursor-pointer transition-colors aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 text-sm"
                        >
                            <FileCheck className="w-4 h-4 mr-3" />
                            {t('services.visa.title')}
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => navigate('/services/tourist-sim-card'))}
                            className="flex items-center px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/90 cursor-pointer transition-colors aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 text-sm"
                        >
                            <Wifi className="w-4 h-4 mr-3" />
                            {t('services.connectivity.esim')}
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => navigate('/shop'))}
                            className="flex items-center px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/90 cursor-pointer transition-colors aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 text-sm"
                        >
                            <ShoppingCart className="w-4 h-4 mr-3" />
                            {t('shop')}
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => navigate('/zero-fees'))}
                            className="flex items-center px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/90 cursor-pointer transition-colors aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 text-sm"
                        >
                            <Percent className="w-4 h-4 mr-3" />
                            {t('value.zero_fees.title')}
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => navigate('/about'))}
                            className="flex items-center px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/90 cursor-pointer transition-colors aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 text-sm"
                        >
                            <Info className="w-4 h-4 mr-3" />
                            {t('nav.about')}
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => navigate('/contact'))}
                            className="flex items-center px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/90 cursor-pointer transition-colors aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 text-sm"
                        >
                            <Phone className="w-4 h-4 mr-3" />
                            {t('footer.contact')}
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => navigate('/help'))}
                            className="flex items-center px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/90 cursor-pointer transition-colors aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 text-sm"
                        >
                            <HelpCircle className="w-4 h-4 mr-3" />
                            {t('footer.faqs')}
                        </Command.Item>
                    </Command.Group>

                    {user && (
                        <Command.Group heading="User" className="text-xs font-medium text-slate-400 mb-2 px-2 mt-2">
                            <Command.Item
                                onSelect={() => runCommand(() => navigate('/profile'))}
                                className="flex items-center px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/90 cursor-pointer transition-colors aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 text-sm"
                            >
                                <User className="w-4 h-4 mr-3" />
                                {t('nav.profile')}
                            </Command.Item>
                            <Command.Item
                                onSelect={() => runCommand(() => navigate(user.role === 'admin' ? '/admin/dashboard' : '/host/dashboard'))}
                                className="flex items-center px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/90 cursor-pointer transition-colors aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 text-sm"
                            >
                                <LayoutDashboard className="w-4 h-4 mr-3" />
                                {t('nav.dashboard')}
                            </Command.Item>

                            {(user.role === 'admin' || user.role === 'host') && (
                                <>
                                    <Command.Item
                                        onSelect={() => runCommand(() => navigate('/list-property'))}
                                        className="flex items-center px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/90 cursor-pointer transition-colors aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 text-sm"
                                    >
                                        <Building className="w-4 h-4 mr-3 text-teal-500 dark:text-cyan-400 " />
                                        {t('nav.list_property')}
                                    </Command.Item>
                                    <Command.Item
                                        onSelect={() => runCommand(() => navigate('/add-service'))}
                                        className="flex items-center px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/90 cursor-pointer transition-colors aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 text-sm"
                                    >
                                        <Car className="w-4 h-4 mr-3 text-purple-500" />
                                        {t('nav.list_service')}
                                    </Command.Item>
                                    <Command.Item
                                        onSelect={() => runCommand(() => navigate(user.role === 'admin' ? '/admin/bookings' : '/host/bookings'))}
                                        className="flex items-center px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/90 cursor-pointer transition-colors aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 text-sm"
                                    >
                                        <Calendar className="w-4 h-4 mr-3 text-blue-500" />
                                        {t('profile.bookings')}
                                    </Command.Item>
                                </>
                            )}
                        </Command.Group>
                    )}

                    {!user && (
                        <Command.Group heading="Account" className="text-xs font-medium text-slate-400 mb-2 px-2 mt-2">
                            <Command.Item
                                onSelect={() => runCommand(() => openLogin())}
                                className="flex items-center px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/90 cursor-pointer transition-colors aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 text-sm"
                            >
                                <LogIn className="w-4 h-4 mr-3" />
                                {t('auth.submit.login')}
                            </Command.Item>
                            <Command.Item
                                onSelect={() => runCommand(() => openRegister())}
                                className="flex items-center px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/90 cursor-pointer transition-colors aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 text-sm"
                            >
                                <UserPlus className="w-4 h-4 mr-3" />
                                {t('auth.submit.register')}
                            </Command.Item>
                        </Command.Group>
                    )}

                    <Command.Group heading="Actions" className="text-xs font-medium text-slate-400 mb-2 px-2 mt-2">
                        <Command.Item
                            onSelect={() => runCommand(() => toggleTheme())}
                            className="flex items-center px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/90 cursor-pointer transition-colors aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 text-sm"
                        >
                            {theme === 'dark' ? <Sun className="w-4 h-4 mr-3" /> : <Moon className="w-4 h-4 mr-3" />}
                            {t('nav.toggle_theme')}
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => setIsCartOpen(true))}
                            className="flex items-center px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/90 cursor-pointer transition-colors aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 text-sm"
                        >
                            <ShoppingCart className="w-4 h-4 mr-3" />
                            {t('nav.open_cart')}
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => setChatOpen(true))}
                            className="flex items-center px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/90 cursor-pointer transition-colors aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 text-sm"
                        >
                            <Sparkles className="w-4 h-4 mr-3 text-purple-500" />
                            {t('nav.ai_assistant')}
                        </Command.Item>
                    </Command.Group>

                    {user && (
                        <Command.Group heading="" className="px-2 mt-2">
                            <Command.Item
                                onSelect={() => runCommand(() => logout())}
                                className="flex items-center px-4 py-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer transition-colors aria-selected:bg-red-50 dark:aria-selected:bg-red-900/20 text-sm"
                            >
                                <LogOut className="w-4 h-4 mr-3" />
                                {t('auth.logout')}
                            </Command.Item>
                        </Command.Group>
                    )}

                    <Command.Group heading="Properties" className="text-xs font-medium text-slate-400 mb-2 px-2 mt-2">
                        {properties.map((property) => (
                            <Command.Item
                                key={property.id}
                                onSelect={() => runCommand(() => navigate(`/property/${property.id}`))}
                                value={property.title} // Crucial for search filtering
                                className="flex items-center px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/90 cursor-pointer transition-colors aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 text-sm"
                            >
                                <Building className="w-4 h-4 mr-3 text-teal-500 dark:text-cyan-400 " />
                                <span className="flex-1 truncate">{property.title}</span>
                                <span className="text-xs text-slate-400 ml-2">€{property.price_per_night}</span>
                            </Command.Item>
                        ))}
                    </Command.Group>
                </Command.List>
            </Command>
        </div >
    );
};
