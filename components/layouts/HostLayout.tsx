import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Home, Calendar, Inbox, LogOut, Menu, X, Plus, Car, Map as MapIcon, BarChart3 } from 'lucide-react';
import { User } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { ErrorBoundary } from '../ui/ErrorBoundary';

interface HostLayoutProps {
    children: React.ReactNode;
    user: User | null;
    unreadCount: number;
}

export const HostLayout: React.FC<HostLayoutProps> = ({ children, user, unreadCount }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);


    // Handle Esc key to close mobile menu
    React.useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsMobileMenuOpen(false);
        };
        if (isMobileMenuOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isMobileMenuOpen]);

    const navItems = [
        { id: 'dashboard', path: '/host', label: 'Dashboard', icon: LayoutDashboard, exact: true },
        { id: 'properties', path: '/host/properties', label: 'My Properties', icon: Home },
        { id: 'fleet', path: '/host/fleet', label: 'My Fleet', icon: Car },
        { id: 'services', path: '/host/services', label: 'My Services', icon: MapIcon },
        { id: 'analytics', path: '/host/directory-analytics', label: 'Directory Analytics', icon: BarChart3 },
        { id: 'bookings', path: '/host/bookings', label: 'Reservations', icon: Calendar },
        { id: 'messages', path: '/host/messages', label: 'Inbox', icon: Inbox },
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex font-sans">
            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed md:sticky top-0 h-screen w-72 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800/50 z-50 transition-transform duration-300 ease-in-out md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}>
                <div className="p-6 border-b border-slate-100 dark:border-slate-800/50 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/20">
                            H
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-none">Host</h1>
                            <span className="text-xs text-slate-500 font-medium">Dashboard</span>
                        </div>
                    </div>
                    <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-slate-400">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-4">
                    <Button
                        onClick={() => navigate('/list-property')}
                        className="w-full justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/20"
                    >
                        <Plus size={18} />
                        Add New Listing
                    </Button>
                </div>

                <nav className="p-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = item.exact
                            ? location.pathname === item.path
                            : location.pathname.startsWith(item.path);

                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={({ isActive: _linkActive }) => `
                                    flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group
                                    ${isActive ? 'bg-indigo-50 dark:bg-slate-800/50 text-indigo-600 dark:text-slate-200 font-medium shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/90 hover:text-slate-900 dark:hover:text-white'}
                                `}
                            >
                                <Icon size={20} className={isActive ? 'text-indigo-600 dark:text-slate-200' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'} />
                                <span className="flex-1">{item.label}</span>
                                {item.id === 'messages' && unreadCount > 0 && (
                                    <span className="bg-teal-600 dark:bg-cyan-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-in zoom-in duration-300">
                                        {unreadCount}
                                    </span>
                                )}
                            </NavLink>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-100 dark:border-slate-800/50 mt-2">
                    <div className="flex items-center gap-3 px-4 py-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800/80 overflow-hidden">
                            {user?.avatar ? (
                                <img src={user.avatar} alt={user.name || 'User'} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-500">
                                    {user?.name?.charAt(0) || 'U'}
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{user?.name || 'Host'}</p>
                            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                        </div>
                    </div>

                    <button onClick={() => navigate('/')} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors">
                        <LogOut size={16} />
                        <span>Back to Site</span>
                    </button>
                </div>

                <div className="flex-1"></div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800/50 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg">
                            <Menu size={24} />
                        </button>
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                            {navItems.find(i => i.exact ? location.pathname === i.path : location.pathname.startsWith(i.path))?.label || 'Dashboard'}
                        </h2>
                    </div>
                </header>

                <div className="flex-1 p-6 md:p-8 overflow-y-auto">
                    <ErrorBoundary>
                        {children}
                    </ErrorBoundary>
                </div>
            </main>
        </div>
    );
};
