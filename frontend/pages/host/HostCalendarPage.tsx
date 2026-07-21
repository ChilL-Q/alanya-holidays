import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { db } from '../../api-services';
import { useAuth } from '../../context/AuthContext';

export const HostCalendarPage = () => {
    const { user } = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [bookings, setBookings] = useState<any[]>([]);
    const [_isLoading, setIsLoading] = useState(true);

    const loadBookings = useCallback(async () => {
        if (!user) return;
        try {
            setIsLoading(true);
            const month = currentDate.getMonth();
            const year = currentDate.getFullYear();
            const monthStart = new Date(year, month, 1).toISOString();
            const monthEnd = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
            const myBookings = await db.getBookingsForHost(user.id, monthStart, monthEnd);
            setBookings(myBookings || []);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [user, currentDate]);

    useEffect(() => {
        loadBookings();
    }, [loadBookings]);

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday
        return { days, firstDay };
    };

    const { days, firstDay } = getDaysInMonth(currentDate);
    const monthName = currentDate.toLocaleString('default', { month: 'long' });
    const year = currentDate.getFullYear();

    const changeMonth = (delta: number) => {
        setCurrentDate(new Date(year, currentDate.getMonth() + delta, 1));
    };

    // Build a Map of bookings for O(1) lookup
    const dateRangeMap = new Map<string, { check_in: string; check_out: string }>();
    if (bookings.length) {
        bookings.forEach(b => {
            const start = new Date(b.check_in);
            const end = new Date(b.check_out);
            start.setHours(0, 0, 0, 0);
            end.setHours(0, 0, 0, 0);
            const current = new Date(start);
            while (current <= end) {
                dateRangeMap.set(current.toISOString().slice(0, 10), b);
                current.setDate(current.getDate() + 1);
            }
        });
    }

    const isDateBooked = (day: number) => {
        const dateKey = new Date(year, currentDate.getMonth(), day).toISOString().slice(0, 10);
        return dateRangeMap.has(dateKey);
    };

    return (
        <div className="space-y-6 animate-fade-up">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Calendar</h1>
                    <p className="text-slate-500 dark:text-slate-400">View your booking schedule</p>
                </div>
                <div className="flex items-center gap-4 bg-white dark:bg-slate-800/80 p-2 rounded-xl border border-slate-100 dark:border-slate-800/50 shadow-sm">
                    <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700/80 rounded-lg">
                        <ChevronLeft size={20} className="text-slate-600 dark:text-slate-300" />
                    </button>
                    <span className="font-bold text-lg min-w-[140px] text-center text-slate-900 dark:text-white">{monthName} {year}</span>
                    <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700/80 rounded-lg">
                        <ChevronRight size={20} className="text-slate-600 dark:text-slate-300" />
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm p-6">
                <div className="grid grid-cols-7 gap-4 mb-4">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="text-center text-sm font-semibold text-slate-400 uppercase">
                            {day}
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-2">
                    {[...Array(firstDay)].map((_, i) => (
                        <div key={`empty-${i}`} className="aspect-square bg-slate-50 dark:bg-slate-900/50 rounded-xl" />
                    ))}
                    {[...Array(days)].map((_, i) => {
                        const day = i + 1;
                        const booked = isDateBooked(day);
                        return (
                            <div
                                key={day}
                                className={`aspect-square rounded-xl flex items-center justify-center text-sm font-medium transition-all cursor-pointer relative
                                    ${booked
                                        ? 'bg-indigo-100 text-indigo-700 dark:bg-slate-800/50 dark:text-slate-200'
                                        : 'bg-white hover:bg-slate-50 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 border border-slate-100 dark:border-slate-800/50 text-slate-700 dark:text-slate-300'
                                    }
                                `}
                            >
                                {day}
                                {booked && <div className="absolute bottom-2 w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="flex gap-6 justify-center">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-800/50" />
                    <span className="text-sm text-slate-500">Available</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-indigo-500" />
                    <span className="text-sm text-slate-500">Booked</span>
                </div>
            </div>
        </div>
    );
};
