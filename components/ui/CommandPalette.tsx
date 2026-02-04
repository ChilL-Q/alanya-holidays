import React, { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import {
    Building,
    Search,
    Home,
    User,
    Settings,
    LogOut,
    LayoutDashboard,
    Calendar,
    Heart,
    ShoppingCart,
    Sun,
    Moon,
    Sparkles,
    CreditCard,
    LogIn,
    UserPlus,
    Car,
    Bike,
    Wifi,
    Info,
    Phone,
    Percent,
    HelpCircle,
    Briefcase,
    FileCheck,
    Plane,
    Mountain,
    Waves,
    Compass
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useModal } from '../../context/ModalContext';
import { useTheme } from '../../context/ThemeContext';
import { useCart } from '../../context/CartContext';
import { useChat } from '../../context/ChatContext';
import { propertiesService } from '../../services/api/properties';
import { PropertyDB } from '../../types/models';

export const CommandPalette = () => {
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
                className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-scale-in"
                loop
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center border-b border-slate-100 dark:border-slate-800 px-4">
                    <Search className="w-5 h-5 text-slate-400 mr-3" />
                    <Command.Input
                        autoFocus
                        placeholder="Type a command or search..."
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
                            className="flex items-center px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 text-sm"
                        >
                            <Home className="w-4 h-4 mr-3" />
                            Home
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => navigate('/stays'))}
                            className="flex items-center px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 text-sm"
                        >
                            <Building className="w-4 h-4 mr-3" />
                            Stays
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => navigate('/favorites'))}
                            className="flex items-center px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 text-sm"
                        >
                            <Heart className="w-4 h-4 mr-3" />
                            Favorites
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => navigate('/services'))}
                            className="flex items-center px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 text-sm"
                        >
                            <Sparkles className="w-4 h-4 mr-3" />
                            Services
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => navigate('/services/car-rental'))}
                            className="flex items-center px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 text-sm"
                        >
                            <Car className="w-4 h-4 mr-3" />
                            Car Rental
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => navigate('/services/bike-rental'))}
                            className="flex items-center px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 text-sm"
                        >
                            <Bike className="w-4 h-4 mr-3" />
                            Motorbike Rental
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => navigate('/services/bicycle-rental'))}
                            className="flex items-center px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 text-sm"
                        >
                            <Bike className="w-4 h-4 mr-3" />
                            Bicycle Rental
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => navigate('/experiences/land'))}
                            className="flex items-center px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 text-sm"
                        >
                            <Mountain className="w-4 h-4 mr-3" />
                            Land Tours
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => navigate('/experiences/water'))}
                            className="flex items-center px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 text-sm"
                        >
                            <Waves className="w-4 h-4 mr-3" />
                            Water Sports
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => navigate('/experiences/safari'))}
                            className="flex items-center px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 text-sm"
                        >
                            <Compass className="w-4 h-4 mr-3" />
                            Safari Expeditions
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => navigate('/services/visa'))}
                            className="flex items-center px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 text-sm"
                        >
                            <FileCheck className="w-4 h-4 mr-3" />
                            Visa & Legal
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => navigate('/services/tourist-sim-card'))}
                            className="flex items-center px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 text-sm"
                        >
                            <Wifi className="w-4 h-4 mr-3" />
                            Tourist SIM Card
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => navigate('/shop'))}
                            className="flex items-center px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 text-sm"
                        >
                            <ShoppingCart className="w-4 h-4 mr-3" />
                            Shop
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => navigate('/zero-fees'))}
                            className="flex items-center px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 text-sm"
                        >
                            <Percent className="w-4 h-4 mr-3" />
                            Zero Guest Fees
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => navigate('/about'))}
                            className="flex items-center px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 text-sm"
                        >
                            <Info className="w-4 h-4 mr-3" />
                            About Us
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => navigate('/contact'))}
                            className="flex items-center px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 text-sm"
                        >
                            <Phone className="w-4 h-4 mr-3" />
                            Contact
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => navigate('/help'))}
                            className="flex items-center px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 text-sm"
                        >
                            <HelpCircle className="w-4 h-4 mr-3" />
                            Help & FAQ
                        </Command.Item>
                    </Command.Group>

                    {user && (
                        <Command.Group heading="User" className="text-xs font-medium text-slate-400 mb-2 px-2 mt-2">
                            <Command.Item
                                onSelect={() => runCommand(() => navigate('/profile'))}
                                className="flex items-center px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 text-sm"
                            >
                                <User className="w-4 h-4 mr-3" />
                                Profile
                            </Command.Item>
                            <Command.Item
                                onSelect={() => runCommand(() => navigate(user.role === 'admin' ? '/admin/dashboard' : '/host/dashboard'))}
                                className="flex items-center px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 text-sm"
                            >
                                <LayoutDashboard className="w-4 h-4 mr-3" />
                                Dashboard
                            </Command.Item>

                            {(user.role === 'admin' || user.role === 'host') && (
                                <>
                                    <Command.Item
                                        onSelect={() => runCommand(() => navigate('/list-property'))}
                                        className="flex items-center px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 text-sm"
                                    >
                                        <Building className="w-4 h-4 mr-3 text-teal-500" />
                                        List Property
                                    </Command.Item>
                                    <Command.Item
                                        onSelect={() => runCommand(() => navigate('/add-service'))}
                                        className="flex items-center px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 text-sm"
                                    >
                                        <Car className="w-4 h-4 mr-3 text-purple-500" />
                                        List Service
                                    </Command.Item>
                                    <Command.Item
                                        onSelect={() => runCommand(() => navigate(user.role === 'admin' ? '/admin/bookings' : '/host/bookings'))}
                                        className="flex items-center px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 text-sm"
                                    >
                                        <Calendar className="w-4 h-4 mr-3 text-blue-500" />
                                        Bookings
                                    </Command.Item>
                                </>
                            )}
                        </Command.Group>
                    )}

                    {!user && (
                        <Command.Group heading="Account" className="text-xs font-medium text-slate-400 mb-2 px-2 mt-2">
                            <Command.Item
                                onSelect={() => runCommand(() => openLogin())}
                                className="flex items-center px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 text-sm"
                            >
                                <LogIn className="w-4 h-4 mr-3" />
                                Log In
                            </Command.Item>
                            <Command.Item
                                onSelect={() => runCommand(() => openRegister())}
                                className="flex items-center px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 text-sm"
                            >
                                <UserPlus className="w-4 h-4 mr-3" />
                                Register
                            </Command.Item>
                        </Command.Group>
                    )}

                    <Command.Group heading="Actions" className="text-xs font-medium text-slate-400 mb-2 px-2 mt-2">
                        <Command.Item
                            onSelect={() => runCommand(() => toggleTheme())}
                            className="flex items-center px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 text-sm"
                        >
                            {theme === 'dark' ? <Sun className="w-4 h-4 mr-3" /> : <Moon className="w-4 h-4 mr-3" />}
                            Toggle Theme
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => setIsCartOpen(true))}
                            className="flex items-center px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 text-sm"
                        >
                            <ShoppingCart className="w-4 h-4 mr-3" />
                            Open Cart
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => setChatOpen(true))}
                            className="flex items-center px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 text-sm"
                        >
                            <Sparkles className="w-4 h-4 mr-3 text-purple-500" />
                            Ask AI Assistant
                        </Command.Item>
                    </Command.Group>

                    {user && (
                        <Command.Group heading="" className="px-2 mt-2">
                            <Command.Item
                                onSelect={() => runCommand(() => logout())}
                                className="flex items-center px-4 py-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer transition-colors aria-selected:bg-red-50 dark:aria-selected:bg-red-900/20 text-sm"
                            >
                                <LogOut className="w-4 h-4 mr-3" />
                                Log Out
                            </Command.Item>
                        </Command.Group>
                    )}

                    <Command.Group heading="Properties" className="text-xs font-medium text-slate-400 mb-2 px-2 mt-2">
                        {properties.map((property) => (
                            <Command.Item
                                key={property.id}
                                onSelect={() => runCommand(() => navigate(`/property/${property.id}`))}
                                value={property.title} // Crucial for search filtering
                                className="flex items-center px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 text-sm"
                            >
                                <Building className="w-4 h-4 mr-3 text-teal-500" />
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
