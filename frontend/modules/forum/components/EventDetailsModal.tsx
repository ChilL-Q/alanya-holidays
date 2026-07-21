import React from 'react';
import { Calendar, Clock, MapPin, Users, Check, Loader2 } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { ForumEvent } from '../../../types/models';
import { useEventRsvp } from '../../../hooks/useEventRsvp';
import { useAuth } from '../../../context/AuthContext';
import { RsvpPromptModal } from './RsvpPromptModal';
import { THREAD_FALLBACK_IMAGE } from '../../../data/forumContent';
import { formatDate, formatEventTime as formatTime } from '../../../utils/formatEventDate';

interface EventDetailsModalProps {
    event: ForumEvent | null;
    isOpen: boolean;
    onClose: () => void;
    onRsvpChange?: (eventId: string, going: boolean, count: number) => void;
}

const FALLBACK_EVENT = { id: '', title: '', attendee_count: 0, going_by_me: false } as unknown as ForumEvent;

export const EventDetailsModal: React.FC<EventDetailsModalProps> = ({ event, isOpen, onClose, onRsvpChange }) => {
    const { isAuthenticated } = useAuth();
    // Hook must run unconditionally; falls back to an inert event when none is open.
    const { going, count, busy, promptOpen, requestRsvp, confirmRsvp, closePrompt } = useEventRsvp(event ?? FALLBACK_EVENT, onRsvpChange);

    if (!event) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} maxWidth="2xl" noPadding>
            <div className="relative h-52 sm:h-60">
                <img
                    src={event.image_url || THREAD_FALLBACK_IMAGE}
                    alt={event.title}
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/85 via-slate-900/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                    {event.category?.name && (
                        <span className="inline-block mb-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-600 text-white">
                            {event.category.name}
                        </span>
                    )}
                    <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white">{event.title}</h2>
                </div>
            </div>

            <div className="p-5 sm:p-6">
                <div className="grid sm:grid-cols-2 gap-3 mb-5">
                    <div className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-200">
                        <Calendar size={18} className="text-teal-500 shrink-0" />
                        <span>{formatDate(event.event_date)}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-200">
                        <Clock size={18} className="text-teal-500 shrink-0" />
                        <span>{formatTime(event.event_date)}</span>
                    </div>
                    {event.location && (
                        <div className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-200">
                            <MapPin size={18} className="text-teal-500 shrink-0" />
                            <span>{event.location}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-200">
                        <Users size={18} className="text-teal-500 shrink-0" />
                        <span>{count} {count === 1 ? 'person' : 'people'} going</span>
                    </div>
                </div>

                {event.host?.full_name && (
                    <div className="flex items-center gap-2 mb-5 text-sm text-slate-500 dark:text-slate-400">
                        {event.host.avatar_url
                            ? <img src={event.host.avatar_url} alt={event.host.full_name} className="w-7 h-7 rounded-full object-cover" />
                            : <span className="w-7 h-7 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-200 grid place-items-center text-xs font-bold">{event.host.full_name.charAt(0)}</span>}
                        <span>Hosted by <span className="font-semibold text-slate-700 dark:text-slate-200">{event.host.full_name}</span></span>
                    </div>
                )}

                {event.description && (
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line mb-6">
                        {event.description}
                    </p>
                )}

                <button
                    onClick={requestRsvp}
                    disabled={busy}
                    className={`w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-base font-semibold transition-colors disabled:opacity-60 ${
                        going
                            ? 'bg-teal-600 text-white hover:bg-teal-700'
                            : 'bg-teal-500 text-white hover:bg-teal-600 shadow-lg shadow-teal-500/25'
                    }`}
                >
                    {busy ? <Loader2 size={18} className="animate-spin" /> : going ? <Check size={18} /> : null}
                    {going ? "You're going — tap to cancel" : 'RSVP — reserve your spot'}
                </button>
                {!isAuthenticated && (
                    <p className="mt-2 text-center text-xs text-slate-400">You'll be asked to sign in first.</p>
                )}
            </div>

            <RsvpPromptModal isOpen={promptOpen} onClose={closePrompt} onConfirm={confirmRsvp} eventTitle={event.title} busy={busy} />
        </Modal>
    );
};
