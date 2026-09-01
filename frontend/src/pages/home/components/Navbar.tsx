import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/context/AuthContext";
import CartDrawer from "@/components/feature/CartDrawer";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  subscribeToUserNotifications,
  formatNotificationTime,
  type AppNotification,
  type NotificationType,
} from "@/api-services/notifications.service";
import { logger } from "@/lib/logger";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import "@/i18n";

interface NavDropdown {
  label: string;
  href?: string;
  children?: { label: string; href: string; icon: string }[];
}

const discoverItems = [
  { label: "Explore", href: "/explore", icon: "ri-compass-3-line" },
  { label: "Travel Guides", href: "/travel-guides", icon: "ri-book-open-line" },
  { label: "Blog", href: "/blog", icon: "ri-article-line" },
];

const communityItems = [
  { label: "Community Hub", href: "/community-hub", icon: "ri-community-line" },
  { label: "Categories", href: "/categories", icon: "ri-stack-line" },
  { label: "Events", href: "/events", icon: "ri-calendar-event-line" },
];

const shopItems = [
  { label: "Shop Marketplace", href: "/shop", icon: "ri-store-2-line" },
];

const DARK_HERO_ROUTES = [
  "/",
  "/events",
  "/community-hub",
  "/yacht-charters",
  "/private-jets",
  "/helicopter-tours",
  "/villa-stays",
  "/hammam-spa",
  "/wine-tastings",
  "/golf-vacations",
  "/personal-chefs",
  "/personal-shopper",
  "/personal-driver",
  "/photography-excursions",
  "/about",
  "/contact",
  "/shop",
  "/categories",
  "/explore",
  "/checkout",
];

const NAV_LABEL_KEYS: Record<string, string> = {
  Home: "nav.home",
  Discover: "nav.discover",
  Explore: "nav.explore",
  "Travel Guides": "nav.travelGuides",
  Blog: "nav.blog",
  Community: "nav.community",
  "Community Hub": "nav.communityHub",
  Categories: "nav.categories",
  Events: "nav.events",
  Shop: "nav.shop",
  "Shop Marketplace": "nav.shopMarketplace",
};

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [openDesktopDropdown, setOpenDesktopDropdown] = useState<string | null>(null);
  const [openMobileDropdown, setOpenMobileDropdown] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const [mobileNotificationsOpen, setMobileNotificationsOpen] = useState(false);

  const desktopDropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const notificationDropdownRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { totalItems } = useCart();
  const { user, profile, signOut, isAuthenticated } = useAuth();

  const navLabel = (label: string) => {
    const key = NAV_LABEL_KEYS[label];
    return key ? t(key, label) : label;
  };

  const isDarkHeroPage =
    DARK_HERO_ROUTES.includes(location.pathname) ||
    location.pathname.startsWith("/category/") ||
    location.pathname.startsWith("/business/");

  const isSolidNav = scrolled || !isDarkHeroPage;

  const displayName =
    profile?.full_name ||
    (user?.user_metadata?.full_name as string | undefined) ||
    (user?.user_metadata?.name as string | undefined) ||
    (user?.email ? user.email.split("@")[0] : "User");

  const userEmail = profile?.email || user?.email || "";
  const avatarUrl =
    profile?.avatar_url ||
    (user?.user_metadata?.avatar_url as string | undefined) ||
    null;

  const isActive = (href: string): boolean => {
    if (href === "/") return location.pathname === "/";
    return location.pathname === href || location.pathname.startsWith(href + "/");
  };

  const isDiscoverActive = discoverItems.some((item) => isActive(item.href));
  const isCommunityActive =
    communityItems.some((item) => isActive(item.href)) ||
    location.pathname.startsWith("/category/") ||
    location.pathname.startsWith("/thread/");
  const isShopActive =
    shopItems.some((item) => isActive(item.href)) ||
    location.pathname.startsWith("/shop");
  const canCreateThread = isAuthenticated && Boolean(user);
  const newThreadTarget = canCreateThread ? "/new-thread" : "/register";
  const newThreadState = canCreateThread
    ? undefined
    : { from: { pathname: "/new-thread" } };

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
      if (desktopDropdownRef.current && !desktopDropdownRef.current.contains(e.target as Node)) {
        setOpenDesktopDropdown(null);
      }
      if (notificationDropdownRef.current && !notificationDropdownRef.current.contains(e.target as Node)) {
        setNotificationDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [mobileOpen]);

  useEffect(() => {
    setMobileOpen(false);
    setOpenMobileDropdown(null);
    setMobileNotificationsOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    let isMounted = true;
    if (!user?.id) {
      setNotifications([]);
      return;
    }
    const fetchNotifications = async () => {
      try {
        const data = await getNotifications(user.id);
        if (isMounted) {
          setNotifications(data);
        }
      } catch (err) {
        logger.warn("Failed to load notifications in Navbar:", err);
      }
    };
    void fetchNotifications();

    const unsubscribe = subscribeToUserNotifications(user.id, (newNotif) => {
      if (isMounted) {
        setNotifications((prev) => [newNotif, ...prev.filter((n) => n.id !== newNotif.id)]);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [user?.id]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenDesktopDropdown(null);
        setMobileOpen(false);
        setUserDropdownOpen(false);
        setNotificationDropdownOpen(false);
        setMobileNotificationsOpen(false);
        setCartOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllNotificationsRead = async () => {
    const snapshot = notifications;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await markAllAsRead(user?.id);
    } catch (err) {
      logger.error("Failed to mark all notifications as read:", err);
      setNotifications(snapshot);
    }
  };

  const handleNotificationClick = async (notif: AppNotification) => {
    const snapshot = notifications;
    if (!notif.read) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
      );
      try {
        await markAsRead(notif.id);
      } catch (err) {
        logger.error("Failed to mark notification as read:", err);
        setNotifications(snapshot);
      }
    }
    setNotificationDropdownOpen(false);
    setMobileOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const handleDeleteNotification = async (
    e: React.MouseEvent<HTMLButtonElement>,
    id: string
  ) => {
    e.stopPropagation();
    const snapshot = notifications;
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await deleteNotification(id);
    } catch (err) {
      logger.error("Failed to delete notification:", err);
      setNotifications(snapshot);
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case "booking":
        return {
          icon: "ri-calendar-check-line",
          bg: "bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400",
        };
      case "message":
        return {
          icon: "ri-message-3-line",
          bg: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400",
        };
      case "community":
        return {
          icon: "ri-team-line",
          bg: "bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400",
        };
      case "system":
      default:
        return {
          icon: "ri-notification-3-line",
          bg: "bg-purple-100 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400",
        };
    }
  };

  const handleLogout = async () => {
    setUserDropdownOpen(false);
    setMobileOpen(false);
    await signOut();
    navigate("/");
  };

  const handleDesktopHover = (label: string) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setOpenDesktopDropdown(label);
  };

  const handleDesktopLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setOpenDesktopDropdown(null);
    }, 150);
  };

  const closeAllMobile = () => {
    setMobileOpen(false);
    setOpenMobileDropdown(null);
    setMobileNotificationsOpen(false);
  };

  const toggleMobileDropdown = (label: string) => {
    setOpenMobileDropdown(openMobileDropdown === label ? null : label);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";
  };

  const renderDesktopDropdown = (
    label: string,
    items: { label: string; href: string; icon: string }[],
    isParentActive: boolean
  ) => {
    const isOpen = openDesktopDropdown === label;
    return (
      <div
        className="relative"
        onMouseEnter={() => handleDesktopHover(label)}
        onMouseLeave={handleDesktopLeave}
        ref={isOpen ? desktopDropdownRef : undefined}
      >
        <button
          aria-expanded={isOpen}
          aria-haspopup="true"
          className={`flex items-center gap-1 text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
            isParentActive
              ? isSolidNav
                ? "text-primary-600 font-semibold"
                : "text-white font-semibold"
              : isSolidNav
                ? "text-foreground-700 hover:text-foreground-900"
                : "text-white/90 hover:text-white"
          }`}
          onClick={() => setOpenDesktopDropdown(isOpen ? null : label)}
        >
          {navLabel(label)}
          <i className={`ri-arrow-down-s-line text-xs transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}></i>
        </button>

        {isOpen && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-52 rounded-xl bg-background-50 border border-background-200/80 overflow-hidden z-50 shadow-lg">
            <div className="py-1.5">
              {items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.label}
                    to={item.href}
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors whitespace-nowrap ${
                      active
                        ? "bg-primary-50 text-primary-700 font-semibold"
                        : "text-foreground-700 hover:bg-background-100"
                    }`}
                    onClick={() => setOpenDesktopDropdown(null)}
                  >
                    <span className={`w-7 h-7 flex items-center justify-center rounded-lg shrink-0 ${
                      active ? "bg-primary-100" : "bg-background-100"
                    }`}>
                      <i className={`${item.icon} text-sm ${active ? "text-primary-600" : "text-foreground-500"}`}></i>
                    </span>
                    {navLabel(item.label)}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderMobileDropdown = (
    label: string,
    items: { label: string; href: string; icon: string }[],
    isParentActive: boolean
  ) => {
    const isOpen = openMobileDropdown === label;
    return (
      <div>
        <button
          aria-expanded={isOpen}
          aria-haspopup="true"
          onClick={() => toggleMobileDropdown(label)}
          className={`w-full flex items-center justify-between text-sm font-medium py-2.5 cursor-pointer ${
            isParentActive ? "text-primary-600 font-semibold" : "text-foreground-700"
          }`}
        >
          <span>{navLabel(label)}</span>
          <i className={`ri-arrow-down-s-line transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}></i>
        </button>
        {isOpen && (
          <div className="pl-4 pb-1 space-y-0.5">
            {items.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.label}
                  to={item.href}
                  className={`flex items-center gap-3 py-2 text-sm transition-colors ${
                    active
                      ? "text-primary-600 font-semibold"
                      : "text-foreground-600 hover:text-foreground-900"
                  }`}
                  onClick={closeAllMobile}
                >
                  <i className={`${item.icon} w-4 h-4 flex items-center justify-center text-sm ${
                    active ? "text-primary-500" : "text-foreground-400"
                  }`}></i>
                  {navLabel(item.label)}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const mainLinks: NavDropdown[] = [
    { label: "Home", href: "/" },
    { label: "Discover", children: discoverItems },
    { label: "Community", children: communityItems },
    { label: "Shop", children: shopItems },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isSolidNav
          ? "bg-background-50/95 backdrop-blur-md shadow-xs border-b border-background-200/80"
          : "bg-transparent"
      }`}
    >
      <div className="w-full min-w-0 px-3 sm:px-4 xl:px-6 2xl:px-10">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex min-w-0 shrink items-center gap-1.5 sm:gap-2">
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl 2xl:h-11 2xl:w-11">
              <img
                src="/images/alanya-holidays-brand-mark-transparent.png"
                alt=""
                aria-hidden="true"
                className="h-full w-full scale-[1.55] object-cover contrast-125 saturate-125"
              />
            </div>
            <span
              className={`hidden truncate font-heading text-lg font-bold transition-colors sm:block sm:text-xl 2xl:text-2xl ${
                isSolidNav ? "text-foreground-900" : "text-white"
              }`}
            >
              Alanya Holidays
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden xl:flex items-center gap-4 2xl:gap-6" ref={desktopDropdownRef}>
            {mainLinks.map((link) => {
              if (link.children) {
                const parentActive =
                  link.label === "Discover"
                    ? isDiscoverActive
                    : link.label === "Community"
                    ? isCommunityActive
                    : isShopActive;
                return (
                  <div key={link.label}>
                    {renderDesktopDropdown(link.label, link.children, parentActive)}
                  </div>
                );
              }
              const href = link.href || "/";
              return (
                <Link
                  key={link.label}
                  to={href}
                  className={`relative text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive(href)
                      ? isSolidNav
                        ? "text-primary-600 font-semibold after:absolute after:bottom-[-4px] after:left-1/2 after:-translate-x-1/2 after:w-5 after:h-0.5 after:rounded-full after:bg-primary-500"
                        : "text-white font-semibold after:absolute after:bottom-[-4px] after:left-1/2 after:-translate-x-1/2 after:w-5 after:h-0.5 after:rounded-full after:bg-white"
                      : isSolidNav
                        ? "text-foreground-700 hover:text-foreground-900"
                        : "text-white/90 hover:text-white"
                  }`}
                >
                  {navLabel(link.label)}
                </Link>
              );
            })}
          </div>

          {/* Desktop Actions */}
          <div className="hidden xl:flex items-center gap-2 2xl:gap-3">
            <LanguageSwitcher isSolidNav={isSolidNav} compact />
            <Link
              to="/search"
              className={`w-9 h-9 flex items-center justify-center rounded-full transition-all cursor-pointer ${
                isSolidNav
                  ? "bg-background-100 text-foreground-600 hover:bg-background-200"
                   : "bg-white/25 backdrop-blur-sm text-white hover:bg-white/35"
              }`}
              aria-label={t("nav.search", "Search")}
              title={t("nav.search", "Search")}
            >
              <i className="ri-search-line text-lg"></i>
            </Link>

            {/* Notification Bell with interactive dropdown */}
            <div className="relative" ref={notificationDropdownRef}>
              <button
                aria-expanded={notificationDropdownOpen}
                aria-haspopup="true"
                onClick={() => {
                  setNotificationDropdownOpen(!notificationDropdownOpen);
                  setUserDropdownOpen(false);
                  setOpenDesktopDropdown(null);
                }}
                className={`relative w-9 h-9 flex items-center justify-center rounded-full transition-all cursor-pointer ${
                  isSolidNav
                    ? "bg-background-100 text-foreground-600 hover:bg-background-200"
                    : "bg-white/25 backdrop-blur-sm text-white hover:bg-white/35"
                }`}
                aria-label={t("nav.notifications", "Notifications")}
                title={t("nav.notifications", "Notifications")}
              >
                <i className="ri-notification-3-line text-lg"></i>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center rounded-full bg-primary-500 text-white text-[11px] font-semibold leading-none shadow-xs">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {notificationDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 md:w-96 rounded-xl bg-background-50 border border-background-200/80 shadow-xl overflow-hidden z-50 animate-in fade-in-50 duration-150">
                  {/* Dropdown Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-background-200/80 bg-background-100/50">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground-900">{t("nav.notifications", "Notifications")}</h3>
                      {unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 text-[11px] font-semibold rounded-full bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                          {t("nav.newNotifications", { count: unreadCount })}
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllNotificationsRead}
                        className="text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <i className="ri-check-double-line text-sm"></i>
                        {t("nav.markAllRead")}
                      </button>
                    )}
                  </div>

                  {/* Notifications List */}
                  <div className="max-h-80 overflow-y-auto divide-y divide-background-200/60">
                    {notifications.length === 0 ? (
                      <div className="py-8 px-4 text-center">
                        <div className="w-12 h-12 mx-auto mb-2 flex items-center justify-center rounded-full bg-background-100 text-foreground-400">
                          <i className="ri-notification-off-line text-xl"></i>
                        </div>
                        <p className="text-sm font-medium text-foreground-700">{t("nav.noNotifications", "No notifications yet")}</p>
                        <p className="text-xs text-foreground-400 mt-0.5">{t("nav.notificationsHint", "We'll alert you when important updates happen.")}</p>
                      </div>
                    ) : (
                      notifications.map((notif) => {
                        const style = getNotificationIcon(notif.type);
                        return (
                          <div
                            key={notif.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => handleNotificationClick(notif)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                handleNotificationClick(notif);
                              }
                            }}
                            className={`flex items-start gap-3 p-3 transition-colors cursor-pointer group relative ${
                              !notif.read
                                ? "bg-primary-50/40 hover:bg-primary-50/70 dark:bg-primary-950/20 dark:hover:bg-primary-950/40"
                                : "hover:bg-background-100/70"
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${style.bg}`}>
                              <i className={`${style.icon} text-base`}></i>
                            </div>

                            <div className="flex-1 min-w-0 pr-2">
                              <div className="flex items-center justify-between gap-1 mb-0.5">
                                <p className={`text-xs truncate ${!notif.read ? "font-semibold text-foreground-900" : "font-medium text-foreground-700"}`}>
                                  {notif.title}
                                </p>
                                <span className="text-[10px] text-foreground-400 shrink-0">
                                  {formatNotificationTime(notif.createdAt)}
                                </span>
                              </div>
                              <p className="text-xs text-foreground-600 line-clamp-2 leading-relaxed">
                                {notif.message}
                              </p>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {!notif.read && (
                                <span className="w-2 h-2 rounded-full bg-primary-500 shrink-0"></span>
                              )}
                              <button
                                onClick={(e) => handleDeleteNotification(e, notif.id)}
                                aria-label={t("nav.dismissNotification", "Dismiss notification")}
                                title={t("nav.dismissNotification", "Dismiss notification")}
                                className="opacity-0 group-hover:opacity-100 p-1 text-foreground-400 hover:text-foreground-700 rounded-md transition-opacity"
                              >
                                <i className="ri-close-line text-sm"></i>
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setCartOpen(true)}
              className={`relative w-9 h-9 flex items-center justify-center rounded-full transition-all cursor-pointer ${
                isSolidNav
                  ? "bg-background-100 text-foreground-600 hover:bg-background-200"
                   : "bg-white/25 backdrop-blur-sm text-white hover:bg-white/35"
              }`}
              aria-label={t("nav.cart", "Cart")}
              title={t("nav.cart", "Cart")}
            >
              <i className="ri-shopping-cart-line text-lg"></i>
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center rounded-full bg-accent-500 text-background-50 text-[11px] font-semibold leading-none">
                  {totalItems}
                </span>
              )}
            </button>

            <Link
              to={newThreadTarget}
              state={newThreadState}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                isSolidNav
                  ? "bg-primary-500 text-background-50 hover:bg-primary-600 shadow-xs"
                   : "bg-white/20 backdrop-blur-sm text-white border border-white/30 hover:bg-white/30"
              }`}
            >
              <i className="ri-edit-line"></i>
              {t("nav.newThread")}
            </Link>

            {isAuthenticated && user ? (
              <div className="relative" ref={userDropdownRef}>
                <button
                  aria-expanded={userDropdownOpen}
                  aria-haspopup="true"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold cursor-pointer transition-all overflow-hidden ${
                    isSolidNav
                      ? "bg-primary-500 text-white hover:bg-primary-600"
                       : "bg-white/25 backdrop-blur-sm text-white border border-white/30 hover:bg-white/35"
                  }`}
                  title={displayName}
                  aria-label={t("nav.userMenu", "User menu")}
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    getInitials(displayName)
                  )}
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-background-50 border border-background-200/80 overflow-hidden z-50 shadow-lg">
                    <div className="px-4 py-3 border-b border-background-100">
                      <p className="text-sm font-semibold text-foreground-900 truncate">{displayName}</p>
                      <p className="text-xs text-foreground-500 truncate">{userEmail}</p>
                    </div>
                    <div className="py-1">
                      <Link
                        to="/settings"
                        onClick={() => setUserDropdownOpen(false)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground-700 hover:bg-background-100 transition-colors cursor-pointer"
                      >
                        <i className="ri-user-settings-line w-4 h-4 flex items-center justify-center text-foreground-400"></i>
                        {t("nav.myProfile")}
                      </Link>
                      <Link
                        to="/settings?tab=activity"
                        onClick={() => setUserDropdownOpen(false)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground-700 hover:bg-background-100 transition-colors cursor-pointer"
                      >
                        <i className="ri-bookmark-line w-4 h-4 flex items-center justify-center text-foreground-400"></i>
                        {t("nav.favorites")}
                      </Link>
                      <Link
                        to="/business/dashboard"
                        onClick={() => setUserDropdownOpen(false)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground-700 hover:bg-background-100 transition-colors cursor-pointer"
                      >
                        <i className="ri-store-3-line w-4 h-4 flex items-center justify-center text-foreground-400"></i>
                        {t("nav.merchantDashboard")}
                      </Link>
                      {profile?.role === "admin" && (
                        <Link
                          to="/admin"
                          onClick={() => setUserDropdownOpen(false)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground-700 hover:bg-background-100 transition-colors cursor-pointer"
                        >
                          <i className="ri-dashboard-line w-4 h-4 flex items-center justify-center text-foreground-400"></i>
                          {t("nav.adminDashboard")}
                        </Link>
                      )}
                    </div>
                    <div className="border-t border-background-100 py-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-accent-700 hover:bg-accent-50 transition-colors cursor-pointer"
                      >
                        <i className="ri-logout-box-line w-4 h-4 flex items-center justify-center text-accent-600"></i>
                        {t("nav.signOut")}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    isSolidNav
                      ? "text-foreground-700 border border-foreground-200 hover:bg-background-100"
                      : "bg-white/15 text-white border border-white/30 backdrop-blur-sm hover:bg-white/25"
                  }`}
                >
                  {t("nav.signIn")}
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap bg-primary-500 text-background-50 hover:bg-primary-600 transition-colors shadow-xs"
                >
                  {t("nav.joinCommunity")}
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger */}
          <div className="flex xl:hidden shrink-0 items-center gap-1 sm:gap-2">
            <LanguageSwitcher isSolidNav={isSolidNav} compact />
            <button
              aria-expanded={mobileOpen}
              aria-haspopup="true"
              aria-controls="mobile-navigation"
              className="w-10 h-10 flex items-center justify-center cursor-pointer"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? t("nav.closeMenu") : t("nav.openMenu")}
            >
              <i
                aria-hidden="true"
                className={`${mobileOpen ? "ri-close-line" : "ri-menu-line"} text-2xl ${
                  isSolidNav ? "text-foreground-900" : "text-white"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div
          id="mobile-navigation"
          className="max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain border-t border-background-200/50 bg-background-50/95 backdrop-blur-md md:max-h-[calc(100dvh-5rem)] xl:hidden"
        >
          <div className="px-4 py-4 space-y-1">
            {mainLinks.map((link) => {
              if (link.children) {
                const parentActive =
                  link.label === "Discover"
                    ? isDiscoverActive
                    : link.label === "Community"
                    ? isCommunityActive
                    : isShopActive;
                return (
                  <div key={link.label}>
                    {renderMobileDropdown(link.label, link.children, parentActive)}
                  </div>
                );
              }
              const href = link.href || "/";
              return (
                <Link
                  key={link.label}
                  to={href}
                  className={`block text-sm font-medium py-2.5 transition-colors ${
                    isActive(href) ? "text-primary-600 font-semibold" : "text-foreground-700"
                  }`}
                  onClick={closeAllMobile}
                >
                  {navLabel(link.label)}
                </Link>
              );
            })}
            <div className="pt-1">
              <Link
                to="/search"
                className="block text-sm font-medium text-foreground-600 py-2.5"
                onClick={closeAllMobile}
              >
                <i className="ri-search-line mr-2 text-foreground-400"></i>
                {t("nav.search")}
              </Link>
              <button
                aria-expanded={mobileNotificationsOpen}
                aria-haspopup="true"
                className="w-full flex items-center justify-between text-sm font-medium text-foreground-600 py-2.5 cursor-pointer"
                onClick={() => setMobileNotificationsOpen(!mobileNotificationsOpen)}
              >
                <div className="flex items-center">
                  <i className="ri-notification-3-line mr-2 text-foreground-400"></i>
                  {t("nav.notifications")}
                  {unreadCount > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center px-1.5 py-0.5 rounded-full bg-primary-500 text-white text-[11px] font-semibold">
                      {t("nav.newNotifications", { count: unreadCount })}
                    </span>
                  )}
                </div>
                <i className={`ri-arrow-down-s-line transition-transform duration-200 ${mobileNotificationsOpen ? "rotate-180" : ""}`}></i>
              </button>
              {mobileNotificationsOpen && (
                <div className="pl-3 pr-1 py-1 space-y-1 bg-background-100/50 rounded-xl mb-2">
                  {unreadCount > 0 && (
                    <div className="flex justify-end py-1">
                      <button
                        onClick={handleMarkAllNotificationsRead}
                        className="text-xs font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1 cursor-pointer"
                      >
                        <i className="ri-check-double-line text-xs"></i>
                        {t("nav.markAllRead")}
                      </button>
                    </div>
                  )}
                  {notifications.length === 0 ? (
                    <p className="text-xs text-foreground-500 py-2 text-center">{t("nav.noNotifications")}</p>
                  ) : (
                    notifications.map((notif) => {
                      const style = getNotificationIcon(notif.type);
                      return (
                        <div
                          key={notif.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => handleNotificationClick(notif)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              handleNotificationClick(notif);
                            }
                          }}
                          className={`p-2 rounded-lg flex items-start gap-2.5 cursor-pointer transition-colors ${
                            !notif.read
                              ? "bg-primary-50/60 dark:bg-primary-950/30 font-medium"
                              : "hover:bg-background-200/50"
                          }`}
                        >
                          <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${style.bg}`}>
                            <i className={`${style.icon} text-sm`}></i>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-foreground-900 truncate">{notif.title}</span>
                              <span className="text-[10px] text-foreground-400 shrink-0">{formatNotificationTime(notif.createdAt)}</span>
                            </div>
                            <p className="text-xs text-foreground-600 line-clamp-1">{notif.message}</p>
                          </div>
                          <button
                            onClick={(e) => handleDeleteNotification(e, notif.id)}
                            aria-label={t("nav.dismissNotification", "Dismiss notification")}
                            className="p-1 text-foreground-400 hover:text-foreground-700 cursor-pointer shrink-0"
                            title={t("nav.dismissNotification", "Dismiss notification")}
                          >
                            <i className="ri-close-line text-xs"></i>
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
              <button
                className="block w-full text-left text-sm font-medium text-foreground-600 py-2.5 cursor-pointer"
                onClick={() => { closeAllMobile(); setCartOpen(true); }}
              >
                <i className="ri-shopping-cart-line mr-2 text-foreground-400"></i>
                {t("nav.cart")}
                {totalItems > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-accent-500 text-background-50 text-[11px] font-semibold">
                    {totalItems}
                  </span>
                )}
              </button>
            </div>
            <div className="pt-3 border-t border-background-200/50 flex flex-col gap-2">
              <Link
                to={newThreadTarget}
                state={newThreadState}
                className="block text-center text-sm font-medium py-2.5 rounded-full bg-primary-500 text-background-50"
                onClick={closeAllMobile}
              >
                <i className="ri-edit-line mr-1.5"></i>
                {t("nav.newThread")}
              </Link>

              {isAuthenticated && user ? (
                <>
                  <div className="flex items-center gap-3 px-1 py-2">
                    <div className="w-10 h-10 rounded-full bg-primary-500 text-white flex items-center justify-center text-sm font-semibold overflow-hidden">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={displayName}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        getInitials(displayName)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground-900 truncate">{displayName}</p>
                      <p className="text-xs text-foreground-500 truncate">{userEmail}</p>
                    </div>
                  </div>
                  <Link
                    to="/settings"
                    className="block text-center text-sm font-medium py-2.5 rounded-full border border-foreground-200 text-foreground-700"
                    onClick={closeAllMobile}
                  >
                    <i className="ri-user-settings-line mr-1.5"></i>
                    {t("nav.myProfile")}
                  </Link>
                  <Link
                    to="/settings?tab=activity"
                    className="block text-center text-sm font-medium py-2.5 rounded-full border border-foreground-200 text-foreground-700"
                    onClick={closeAllMobile}
                  >
                    <i className="ri-bookmark-line mr-1.5"></i>
                    {t("nav.favorites")}
                  </Link>
                  <Link
                    to="/business/dashboard"
                    className="block text-center text-sm font-medium py-2.5 rounded-full border border-foreground-200 text-foreground-700"
                    onClick={closeAllMobile}
                  >
                    <i className="ri-store-3-line mr-1.5"></i>
                    {t("nav.merchantDashboard")}
                  </Link>
                  {profile?.role === "admin" && (
                    <Link
                      to="/admin"
                      className="block text-center text-sm font-medium py-2.5 rounded-full border border-foreground-200 text-foreground-700"
                      onClick={closeAllMobile}
                    >
                      <i className="ri-dashboard-line mr-1.5"></i>
                      {t("nav.adminDashboard")}
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="block w-full text-center text-sm font-medium py-2.5 rounded-full bg-accent-100 text-accent-800 cursor-pointer"
                  >
                    <i className="ri-logout-box-line mr-1.5"></i>
                    {t("nav.signOut")}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="block text-center text-sm font-medium text-foreground-700 py-2.5 rounded-full border border-foreground-200"
                    onClick={closeAllMobile}
                  >
                    {t("nav.signIn")}
                  </Link>
                  <Link
                    to="/register"
                    className="block text-center text-sm font-medium py-2.5 rounded-full bg-primary-500 text-background-50"
                    onClick={closeAllMobile}
                  >
                    {t("nav.joinCommunity")}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </nav>
  );
}
