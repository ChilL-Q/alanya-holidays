import React, { useState, useRef, useEffect } from 'react';
import { ShoppingBag, Menu, User, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { NotificationBell } from './ui/NotificationBell';
import { MobileMenu } from './navbar/MobileMenu';
import { UserDropdown } from './navbar/UserDropdown';
import { DesktopNav } from './navbar/DesktopNav';
import { NavbarActions } from './navbar/NavbarActions';
import { ListPropertyAction } from './navbar/ListPropertyAction';

export const Navbar: React.FC = () => {
  const { items, setIsCartOpen } = useCart();
  const { favorites } = useFavorites();
  const { user, isAuthenticated } = useAuth();
  // useModal is kept if it provides context needed by other logic, but unused vars removed
  useModal();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Handle Mobile Menu and Profile dropdown clicks
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/50 transition-colors supports-[backdrop-filter]:bg-white/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-20">

          {/* Logo */}
          <Link to="/" className="flex-shrink-0 flex items-center gap-3 group relative z-10">
            <div className="relative">
              <div className="absolute inset-0 bg-teal-500 dark:bg-cyan-600 blur-lg opacity-20 group-hover:opacity-40 transition-opacity rounded-full"></div>
              <img src="/logo.png" alt="Alanya Holidays" className="w-10 h-10 object-contain relative z-10 rounded-full" />
            </div>
            <span className="font-serif text-lg sm:text-xl md:text-2xl text-slate-900 dark:text-white tracking-tight font-medium truncate max-w-[120px] md:max-w-none">
              Alanya<span className="text-teal-600 dark:text-cyan-400 dark:text-slate-200">Holidays</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <DesktopNav />

          {/* Right Section */}
          <div className="flex-shrink-0 flex items-center gap-2 lg:gap-4 ml-auto">

            {/* Utilities Group (Desktop) */}
            <NavbarActions />

            {/* List Property CTA (Desktop) */}
            <ListPropertyAction />

            {/* User Actions */}
            <div className="flex items-center gap-1 sm:gap-2 pl-2">

              <NotificationBell />

              <Link to="/favorites" className="p-2.5 rounded-full text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 dark:text-slate-400 transition-all relative group hidden sm:block">
                <Heart size={20} />
                {favorites.length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900"></span>}
              </Link>

              <button
                onClick={() => setIsCartOpen(true)}
                className="p-2.5 rounded-full text-slate-500 hover:text-teal-600 dark:text-cyan-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 dark:text-slate-400 transition-all relative group"
              >
                <ShoppingBag size={20} />
                {items.length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-teal-500 dark:bg-cyan-600 rounded-full border-2 border-white dark:border-slate-900"></span>}
              </button>

              {/* Profile / Mobile Menu Trigger */}
              <div className="relative ml-1" ref={profileRef}>
                <button
                  onClick={() => {
                    // Logic: Mobile -> Open MobileMenu. Desktop -> Open ProfileDropdown.
                    // If user is Auth on Desktop -> ProfileDropdown acting as user menu.
                    // If user is Guest on Desktop -> ProfileDropdown acting as Login/Register menu.
                    if (window.innerWidth < 768) {
                      setIsMobileMenuOpen(!isMobileMenuOpen);
                    } else {
                      setIsProfileOpen(!isProfileOpen);
                    }
                  }}
                  data-testid="profile-button"
                  className="flex items-center gap-2 p-1 pr-3 rounded-full border border-slate-200 dark:border-slate-800/50 hover:shadow-md transition-all active:scale-95 bg-white dark:bg-slate-800/80"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800/50 overflow-hidden ring-2 ring-white dark:ring-slate-900">
                    {isAuthenticated && user?.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <User size={16} />
                        {/* Burger Menu Icon on Mobile for Guests/Auth? Maybe just User icon is enough or we can swap icon */}
                      </div>
                    )}
                  </div>
                  <div className="hidden lg:flex flex-col items-start">
                    <Menu size={14} className="text-slate-400" />
                  </div>
                  {/* Show Menu icon on mobile to indicate it opens a menu */}
                  <div className="lg:hidden">
                    <Menu size={16} className="text-slate-500" />
                  </div>
                </button>

                <UserDropdown isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
              </div>

            </div>

          </div>
        </div>
      </div>

      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

      {/* Host Upgrade Modal */}
      {/* Host Upgrade Modal - Now inside ListPropertyAction */}
    </nav>
  );
};