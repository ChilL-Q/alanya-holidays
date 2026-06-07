import React, { useState, useRef, useEffect } from 'react';
import { useClickOutside } from '../hooks/useClickOutside';
import { ShoppingBag, Menu, User, Heart } from 'lucide-react';

const MD_BREAKPOINT = 768;
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { useLanguage } from '../context/LanguageContext';
import { NotificationBell } from './ui/NotificationBell';
import { MobileMenu } from './navbar/MobileMenu';
import { UserDropdown } from './navbar/UserDropdown';
import { DesktopNav } from './navbar/DesktopNav';
import { ListPropertyAction } from './navbar/ListPropertyAction';
import { cn } from '../utils/cn';
import { useScroll } from '../hooks/useScroll';
import { MenuToggleIcon } from './ui/MenuToggleIcon';

export type NavMode = 'directory' | 'rental';

export const Navbar: React.FC = () => {
  const { items, setIsCartOpen } = useCart();
  const { favorites } = useFavorites();
  const { user, isAuthenticated } = useAuth();
  useLanguage();
  useModal();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [navMode, setNavMode] = useState<NavMode>('directory');
  const profileRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const scrolled = useScroll(10);

  useEffect(() => {
    if (['/services', '/alanya-villas', '/alanya-apartments', '/services/car-rental', '/services/bike-rental', '/services/bicycle-rental'].includes(location.pathname) || location.pathname.startsWith('/services/')) {
      setNavMode('rental');
    } else {
      setNavMode('directory');
    }
  }, [location.pathname]);

  useClickOutside(profileRef, () => setIsProfileOpen(false));

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  // Reset mobile menu when viewport widens to desktop — prevents both menus open simultaneously
  useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${MD_BREAKPOINT}px)`);
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) {
        setIsMobileMenuOpen(false);
      }
    };
    handleChange(mql);
    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 mx-auto w-full border-b border-slate-200/60 dark:border-slate-800/50 md:transition-all md:duration-300 md:ease-out bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60',
        {
          'bg-white/95 dark:bg-slate-900/95 border-slate-200/60 dark:border-slate-800/50 shadow-md md:top-4 md:max-w-6xl md:rounded-2xl md:border':
            scrolled && !isMobileMenuOpen,
          'bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800': isMobileMenuOpen,
        }
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={cn(
            'flex items-center h-20 relative transition-all duration-300 ease-out',
            {
              'h-16': scrolled && !isMobileMenuOpen,
            }
          )}
        >

          {/* Logo */}
          <div className="flex items-center flex-shrink-0 z-10 lg:-ml-6">
            <Link to="/" className="flex items-center gap-3 group relative">
              <div className="relative hidden sm:block">
                <div className="absolute inset-0 bg-teal-500 dark:bg-cyan-600 blur-lg opacity-20 group-hover:opacity-40 transition-opacity rounded-full"></div>
                <img src="/logo.png" alt="Alanya Holidays" className="w-10 h-10 object-contain relative z-10 rounded-full" width="40" height="40" loading="eager" />
              </div>
              <span className="font-serif text-lg sm:text-xl md:text-2xl text-slate-900 dark:text-white tracking-tight font-medium truncate hidden md:block">
                Alanya<span className="text-teal-600 dark:text-cyan-400">Holidays</span>
              </span>
            </Link>
          </div>

          {/* Desktop Nav — centered */}
          <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 z-10">
            <DesktopNav mode={navMode} />
          </div>

          {/* Right Section */}
          <div className="flex-shrink-0 flex items-center gap-2 lg:gap-4 ml-auto">

            {/* List Property CTA (Rental Mode Only) */}
            {navMode === 'rental' && (
              <ListPropertyAction />
            )}

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
                    if (window.innerWidth < MD_BREAKPOINT) {
                      setIsMobileMenuOpen(!isMobileMenuOpen);
                    } else {
                      setIsProfileOpen(!isProfileOpen);
                    }
                  }}
                  data-testid="profile-button"
                  className="flex items-center gap-2 p-2 pr-3 rounded-full border border-slate-200 dark:border-slate-800/50 hover:shadow-md transition-all active:scale-95 bg-white dark:bg-slate-800/80"
                >
                  <div className="w-10 h-10 sm:w-8 sm:h-8 rounded-full bg-slate-100 dark:bg-slate-800/50 overflow-hidden ring-2 ring-white dark:ring-slate-900">
                    {isAuthenticated && user?.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <User size={20} />
                      </div>
                    )}
                  </div>
                  <div className="hidden lg:flex flex-col items-start">
                    <Menu size={14} className="text-slate-400" />
                  </div>
                  {/* Show animated MenuToggleIcon on mobile to indicate it opens a menu */}
                  <div className="lg:hidden">
                    <MenuToggleIcon open={isMobileMenuOpen} className="w-5 h-5 text-slate-500 dark:text-slate-400" duration={300} />
                  </div>
                </button>

                <UserDropdown isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} mode={navMode} />
              </div>

            </div>

          </div>
        </div>
      </div>

      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} mode={navMode} setMode={setNavMode} />

      {/* Host Upgrade Modal */}
    </header>
  );
};