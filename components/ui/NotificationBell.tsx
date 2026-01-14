import React, { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

export const NotificationBell: React.FC = () => {
    const { notifications, unreadCount, markAsRead } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const { t } = useLanguage();

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarkAsRead = (id: string) => {
        markAsRead(id);
    };

    const getIconColor = (type: string) => {
        switch (type) {
            case 'booking_confirmed': return 'text-green-500 bg-green-50 dark:bg-green-900/20';
            case 'booking_request': return 'text-blue-500 bg-blue-50 dark:bg-blue-900/20';
            case 'review': return 'text-orange-500 bg-orange-50 dark:bg-orange-900/20';
            default: return 'text-slate-500 bg-slate-50 dark:bg-slate-800';
        }
    };

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                aria-label="Notifications"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-white dark:border-slate-900 rounded-full animate-pulse"></span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                        <h3 className="font-bold text-slate-900 dark:text-white">Notifications</h3>
                        {unreadCount > 0 && (
                            <span className="text-xs font-semibold text-white bg-red-500 px-2 py-0.5 rounded-full">{unreadCount} new</span>
                        )}
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto">
                        {notifications.length > 0 ? (
                            <div className="divide-y divide-slate-50 dark:divide-slate-800">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${!notification.read ? 'bg-teal-50/30 dark:bg-teal-900/10' : ''}`}
                                        onClick={() => handleMarkAsRead(notification.id)}
                                    >
                                        <div className="flex gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${getIconColor(notification.type)}`}>
                                                <Bell size={18} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm text-slate-900 dark:text-white mb-1 ${!notification.read ? 'font-semibold' : ''}`}>
                                                    {notification.message}
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    {new Date(notification.created_at).toLocaleString()}
                                                </p>
                                                {notification.link && (
                                                    <Link to={notification.link} className="text-xs text-teal-600 font-bold hover:underline mt-1 inline-block">
                                                        View details
                                                    </Link>
                                                )}
                                            </div>
                                            {!notification.read && (
                                                <div className="w-2 h-2 bg-teal-500 rounded-full mt-2"></div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                                <Bell size={32} className="mx-auto mb-3 opacity-20" />
                                <p className="text-sm">No notifications yet</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
