import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ForumEvent } from '../../types/models';

/** Local-date key in YYYY-MM-DD form (avoids UTC off-by-one). */
export const dateKey = (d: Date | string): string => {
    const date = typeof d === 'string' ? new Date(d) : d;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

interface EventCalendarProps {
    events: ForumEvent[];
    selectedKey: string | null;
    onSelect: (key: string) => void;
}

export const EventCalendar: React.FC<EventCalendarProps> = ({ events, selectedKey, onSelect }) => {
    const eventsByDay = useMemo(() => {
        const map = new Map<string, ForumEvent[]>();
        for (const e of events) {
            const k = dateKey(e.event_date);
            (map.get(k) ?? map.set(k, []).get(k)!).push(e);
        }
        return map;
    }, [events]);

    const initial = selectedKey ? new Date(selectedKey) : new Date();
    const [view, setView] = useState({ year: initial.getFullYear(), month: initial.getMonth() });

    const firstOfMonth = new Date(view.year, view.month, 1);
    const startOffset = (firstOfMonth.getDay() + 6) % 7; // Monday-first grid
    const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
    const todayKey = dateKey(new Date());

    const cells: (number | null)[] = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);

    const prev = () => setView((v) => (v.month === 0 ? { year: v.year - 1, month: 11 } : { year: v.year, month: v.month - 1 }));
    const next = () => setView((v) => (v.month === 11 ? { year: v.year + 1, month: 0 } : { year: v.year, month: v.month + 1 }));

    return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">{MONTHS[view.month]} {view.year}</h3>
                <div className="flex items-center gap-2">
                    <button onClick={prev} aria-label="Previous month" className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300">
                        <ChevronLeft size={16} />
                    </button>
                    <button onClick={next} aria-label="Next month" className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300">
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-px mb-px">
                {WEEKDAYS.map((w) => (
                    <div key={w} className="text-center sm:text-left sm:px-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 pb-2">
                        <span className="hidden sm:inline">{w}</span>
                        <span className="sm:hidden">{w[0]}</span>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                {cells.map((d, i) => {
                    if (d === null) {
                        return <div key={i} className="rounded-lg bg-slate-50/60 dark:bg-slate-900/30 min-h-[52px] sm:min-h-[84px]" />;
                    }
                    const k = dateKey(new Date(view.year, view.month, d));
                    const dayEvents = eventsByDay.get(k) ?? [];
                    const has = dayEvents.length > 0;
                    const isSelected = k === selectedKey;
                    const isToday = k === todayKey;
                    return (
                        <button
                            key={i}
                            onClick={() => onSelect(k)}
                            className={`group text-left p-1.5 sm:p-2 min-h-[52px] sm:min-h-[84px] rounded-lg border transition-colors flex flex-col gap-1 overflow-hidden
                                ${isSelected
                                    ? 'border-teal-500 ring-1 ring-teal-500 bg-teal-50/70 dark:bg-teal-900/20'
                                    : has
                                        ? 'border-slate-200 dark:border-slate-700 hover:border-teal-400 hover:bg-teal-50/40 dark:hover:bg-teal-900/10'
                                        : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-700/40'}
                            `}
                        >
                            <span className={`inline-flex items-center justify-center w-6 h-6 text-xs sm:text-sm rounded-full shrink-0
                                ${isToday ? 'bg-teal-600 text-white font-bold' : has ? 'text-slate-900 dark:text-white font-semibold' : 'text-slate-400 dark:text-slate-500'}`}>
                                {d}
                            </span>
                            <div className="flex-1 min-h-0 space-y-1 w-full">
                                {dayEvents.slice(0, 2).map((ev) => (
                                    <span
                                        key={ev.id}
                                        className="hidden sm:block truncate text-[11px] leading-tight px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-200"
                                        title={ev.title}
                                    >
                                        {ev.title}
                                    </span>
                                ))}
                                {dayEvents.length > 2 && (
                                    <span className="hidden sm:block text-[10px] text-slate-400 px-1.5">+{dayEvents.length - 2} more</span>
                                )}
                                {has && (
                                    <span className="sm:hidden mx-auto block w-1.5 h-1.5 rounded-full bg-teal-500" />
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
