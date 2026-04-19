import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Home, Users, Calendar, Car, LogOut, Menu, X, Flag, ShoppingBag, Map as MapIcon, BookOpen, ChefHat, Coffee, MessageSquare, PenLine } from 'lucide-react';
import { ErrorBoundary } from '../ui/ErrorBoundary';

interface AdminLayoutProps {
    children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
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
        { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
        { path: '/admin/properties', label: 'Properties', icon: Home },
        { path: '/admin/fleet', label: 'Fleet', icon: Car },
        { path: '/admin/services', label: 'Services', icon: MapIcon },
        { path: '/admin/directory', label: 'Directory', icon: BookOpen },
        { path: '/admin/restaurants', label: 'Restaurants', icon: ChefHat },
        { path: '/admin/cafes', label: 'Cafes', icon: Coffee },
        { path: '/admin/bookings', label: 'Bookings', icon: Calendar },
        { path: '/admin/products', label: 'Products', icon: ShoppingBag },
        { path: '/admin/users', label: 'Users', icon: Users },
        { path: '/admin/reviews', label: 'Reviews', icon: MessageSquare },
        { path: '/admin/blog-submissions', label: 'Blog Submissions', icon: PenLine },
        { path: '/admin/reports', label: 'Reports', icon: Flag },
    ];

    const navGroups = [
        {
            label: 'Listings',
            items: navItems.filter(i => ['Properties', 'Fleet', 'Services', 'Directory', 'Restaurants', 'Cafes', 'Products'].includes(i.label))
        },
        {
            label: 'Commerce',
            items: navItems.filter(i => ['Bookings'].includes(i.label))
        },
        {
            label: 'Content',
            items: navItems.filter(i => ['Reviews', 'Blog Submissions'].includes(i.label))
        },
        {
            label: 'Users',
            items: navItems.filter(i => ['Users', 'Reports'].includes(i.label))
        },
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
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-teal-500/20">
                            A
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-none">Admin</h1>
                            <span className="text-xs text-slate-500 font-medium">Panel</span>
                        </div>
                    </div>
                    <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-slate-400 p-2 hover:bg-slate-100 dark:hover:bg-slate-800/90 rounded-lg transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <nav className="p-4 space-y-6 overflow-y-auto">
                    {/* Dashboard (always on top, outside groups) */}
                    {(() => {
                        const dashboardItem = navItems[0];
                        const Icon = dashboardItem.icon;
                        const isActive = dashboardItem.exact
                            ? location.pathname === dashboardItem.path
                            : location.pathname.startsWith(dashboardItem.path);
                        return (
                            <div key={dashboardItem.path} className="space-y-1">
                                <NavLink
                                    to={dashboardItem.path}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`
                                        flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group
                                        ${isActive ? 'bg-teal-50 dark:bg-slate-800/50 text-teal-600 dark:text-cyan-400 dark:text-slate-200 font-medium shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/90 hover:text-slate-900 dark:hover:text-white'}
                                    `}
                                >
                                    <Icon size={20} className={isActive ? 'text-teal-600 dark:text-cyan-400 dark:text-slate-200' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'} />
                                    <span>{dashboardItem.label}</span>
                                </NavLink>

                                {/* Nav Groups */}
                                {navGroups.map((group) => (
                                    <div key={group.label} className="pt-4 first:pt-0">
                                        <h3 className="px-4 mb-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                            {group.label}
                                        </h3>
                                        <div className="space-y-1">
                                            {group.items.map((item) => {
                                                const ItemIcon = item.icon;
                                                const isItemActive = item.exact
                                                    ? location.pathname === item.path
                                                    : location.pathname.startsWith(item.path);

                                                return (
                                                    <NavLink
                                                        key={item.path}
                                                        to={item.path}
                                                        onClick={() => setIsMobileMenuOpen(false)}
                                                        className={`
                                                            flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group
                                                            ${isItemActive ? 'bg-teal-50 dark:bg-slate-800/50 text-teal-600 dark:text-cyan-400 dark:text-slate-200 font-medium shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/90 hover:text-slate-900 dark:hover:text-white'}
                                                        `}
                                                    >
                                                        <ItemIcon size={20} className={isItemActive ? 'text-teal-600 dark:text-cyan-400 dark:text-slate-200' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'} />
                                                        <span>{item.label}</span>
                                                        {item.label === 'Bookings' && (
                                                            <span className="ml-auto w-2 h-2 rounded-full bg-orange-500 hidden" />
                                                        )}
                                                    </NavLink>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        );
                    })()}
                </nav>

                <div className="p-4 border-t border-slate-100 dark:border-slate-800/50 space-y-1">
                    <button onClick={() => navigate('/')} className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors">
                        <LogOut size={20} />
                        <span>Back to Site</span>
                    </button>
                </div>
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
