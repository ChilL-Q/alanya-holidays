import React from 'react';
import { Calendar, MapPin, Users, Check, Loader2 } from 'lucide-react';
import { ForumEvent } from '../../../types/models';
import { useEventRsvp } from '../../../hooks/useEventRsvp';
import { RsvpPromptModal } from './RsvpPromptModal';
import { THREAD_FALLBACK_IMAGE } from '../../../data/forumContent';
import { formatEventDate, formatEventTime } from '../../../utils/formatEventDate';

interface ForumEventCardProps {
    event: ForumEvent;
    /** Glass style for use over imagery / colored sections. */
    glass?: boolean;
    /** Condensed horizontal layout for dense lists (e.g. calendar day view). */
    compact?: boolean;
    /** When provided, clicking the card (outside the RSVP button) opens details. */
    onOpen?: (event: ForumEvent) => void;
}

export const ForumEventCard: React.FC<ForumEventCardProps> = ({ event, glass, compact, onOpen }) => {
    const { going, count, busy, promptOpen, requestRsvp, confirmRsvp, closePrompt } = useEventRsvp(event);

    const handleRsvp = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        requestRsvp();
    };

    const prompt = (
        <RsvpPromptModal isOpen={promptOpen} onClose={closePrompt} onConfirm={confirmRsvp} eventTitle={event.title} busy={busy} />
    );

    const shell = glass
        ? 'bg-white/10 backdrop-blur-md border border-white/20'
        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700';
    const titleColor = glass ? 'text-white' : 'text-slate-900 dark:text-white';
    const metaColor = glass ? 'text-white/80' : 'text-slate-500 dark:text-slate-400';

    if (compact) {
        const time = formatEventTime(event.event_date);
        return (
            <>
            <div
                onClick={onOpen ? () => onOpen(event) : undefined}
                role={onOpen ? 'button' : undefined}
                tabIndex={onOpen ? 0 : undefined}
                onKeyDown={onOpen ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(event); } } : undefined}
                className={`group flex items-stretch gap-4 rounded-xl overflow-hidden transition-shadow hover:shadow-md ${onOpen ? 'cursor-pointer' : ''} ${shell}`}
            >
                <img
                    src={event.image_url || THREAD_FALLBACK_IMAGE}
                    alt={event.title}
                    loading="lazy"
                    className="w-24 sm:w-28 h-auto object-cover shrink-0"
                />
                <div className="flex-1 min-w-0 py-3 pr-4">
                    <h4 className={`text-sm font-bold truncate ${titleColor}`}>{event.title}</h4>
                    <div className={`mt-1 space-y-0.5 text-xs ${metaColor}`}>
                        <p className="inline-flex items-center gap-1.5">
                            <Calendar size={12} className="text-teal-400 shrink-0" />
                            {time ? `${time}` : formatEventDate(event.event_date)}
                            {event.location && <span className="inline-flex items-center gap-1 truncate"><MapPin size={12} className="text-teal-400 shrink-0" /> {event.location}</span>}
                        </p>
                        <p className="inline-flex items-center gap-1.5"><Users size={12} className="text-teal-400 shrink-0" /> {count} going</p>
                    </div>
                    <button
                        onClick={handleRsvp}
                        disabled={busy}
                        className={`mt-2 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-60 ${
                            going ? 'bg-teal-600 text-white hover:bg-teal-700' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
                        }`}
                    >
                        {busy ? <Loader2 size={13} className="animate-spin" /> : going ? <Check size={13} /> : null}
                        {going ? "You're going" : 'RSVP'}
                    </button>
                </div>
            </div>
            {prompt}
            </>
        );
    }

    return (
        <>
        <div className={`group rounded-2xl overflow-hidden transition-shadow hover:shadow-xl ${shell}`}>
            <div className="relative h-40 overflow-hidden">
                <img
                    src={event.image_url || THREAD_FALLBACK_IMAGE}
                    alt={event.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-white bg-teal-600">
                    <Users size={12} /> {count} going
                </span>
            </div>
            <div className="p-5">
                <h4 className={`text-lg font-bold mb-2 ${titleColor}`}>{event.title}</h4>
                <div className={`space-y-1.5 text-sm mb-4 ${metaColor}`}>
                    <p className="inline-flex items-center gap-2"><Calendar size={14} className="text-teal-400 shrink-0" /> {formatEventDate(event.event_date)}</p>
                    {event.location && (
                        <p className="inline-flex items-center gap-2"><MapPin size={14} className="text-teal-400 shrink-0" /> {event.location}</p>
                    )}
                </div>
                <button
                    onClick={handleRsvp}
                    disabled={busy}
                    className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-60 ${
                        going
                            ? 'bg-teal-600 text-white hover:bg-teal-700'
                            : glass
                                ? 'bg-white/20 text-white hover:bg-white/30'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                >
                    {busy ? <Loader2 size={16} className="animate-spin" /> : going ? <Check size={16} /> : null}
                    {going ? "You're going" : 'RSVP'}
                </button>
            </div>
        </div>
        {prompt}
        </>
    );
};
