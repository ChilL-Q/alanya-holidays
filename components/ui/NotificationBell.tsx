import React, { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

export const NotificationBell: React.FC = () => {
    const { notifications, unreadCount, markAsRead, addNotification } = useNotifications();
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

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
            case 'booking_request': return 'text-blue-500 bg-blue-50 dark:bg-slate-800/50';
            case 'review': return 'text-orange-500 bg-orange-50 dark:bg-slate-800/50';
            default: return 'text-slate-500 bg-slate-50 dark:bg-slate-800/80';
        }
    };

    // Live Notification Effect
    const [showBubble, setShowBubble] = useState(false);
    const { lastNotification } = useNotifications();

    useEffect(() => {
        if (lastNotification && !lastNotification.read) {
            setShowBubble(true);
            const timer = setTimeout(() => setShowBubble(false), 10000); // Increased to 10s
            return () => clearTimeout(timer);
        }
    }, [lastNotification]);

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => { setIsOpen(!isOpen); setShowBubble(false); }}
                className="relative p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/90 rounded-lg transition-colors"
                aria-label="Notifications"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-white dark:border-slate-900 rounded-full animate-pulse"></span>
                )}
            </button>

            {/* Live Bubble */}
            {showBubble && lastNotification && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-72 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800/50 p-4 z-[60] animate-in fade-in slide-in-from-top-2 duration-300 flex flex-col gap-2">
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-slate-900 border-t border-l border-slate-100 dark:border-slate-800/50 transform rotate-45"></div>
                    <div className="relative flex gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${getIconColor(lastNotification.type)}`}>
                            <Bell size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-900 dark:text-white mb-0.5">New Notification</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">{lastNotification.message}</p>
                            {lastNotification.link && (
                                <Link
                                    to={lastNotification.link.includes('/host/messages') && user?.role !== 'host' && user?.role !== 'admin' ? '/inbox' : lastNotification.link}
                                    onClick={() => setShowBubble(false)}
                                    className="text-xs text-teal-600 dark:text-cyan-400 font-bold hover:underline mt-1.5 inline-block"
                                >
                                    View
                                </Link>
                            )}
                        </div>
                        <button onClick={() => setShowBubble(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 self-start">
                            <span className="sr-only">Close</span>
                            &times;
                        </button>
                    </div>
                </div>
            )}

            {isOpen && (
                <div className="absolute left-1/2 -translate-x-1/2 mt-3 w-80 md:w-96 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] border border-slate-100 dark:border-slate-800/50 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-slate-900 border-t border-l border-slate-100 dark:border-slate-800/50 transform rotate-45 z-0"></div>
                    <div className="relative z-10 bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800/50 flex justify-between items-center bg-white dark:bg-slate-900">
                            <h3 className="font-bold text-slate-900 dark:text-white">Notifications</h3>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
                                        audio.play().catch(err => console.error('Manual sound test failed', err));

                                        addNotification({
                                            type: 'info' as const,
                                            title: 'Sound Test',
                                            message: 'If you hear this, sound is working!',
                                            link: '#',
                                            user_id: 'test'
                                        });
                                    }}
                                    className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded-md transition-colors"
                                >
                                    Test Sound
                                </button>
                                {unreadCount > 0 && (
                                    <span className="text-xs font-semibold text-white bg-red-500 px-2 py-0.5 rounded-full">{unreadCount} new</span>
                                )}
                            </div>
                        </div>

                        <div className="max-h-[60vh] overflow-y-auto">
                            {notifications.length > 0 ? (
                                <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                    {notifications.map((notification) => (
                                        <div
                                            key={notification.id}
                                            className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800/90/50 transition-colors ${!notification.read ? 'bg-teal-50/30 dark:bg-slate-800/50' : ''}`}
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
                                                        {new Date(notification.created_at || new Date()).toLocaleString()}
                                                    </p>
                                                    {notification.link && (
                                                        <Link to={notification.link} className="text-xs text-teal-600 dark:text-cyan-400 font-bold hover:underline mt-1 inline-block">
                                                            View details
                                                        </Link>
                                                    )}
                                                </div>
                                                {!notification.read && (
                                                    <div className="w-2 h-2 bg-teal-500 dark:bg-cyan-600 rounded-full mt-2"></div>
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
                </div>
            )}
        </div>
    );
};
