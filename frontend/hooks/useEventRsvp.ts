import { useState, useEffect } from 'react';
import { forumEventsService } from '../api-services';
import { ForumEvent } from '../types/models';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';

export interface UseEventRsvp {
    going: boolean;
    count: number;
    busy: boolean;
    promptOpen: boolean;
    /** Called by an RSVP button: cancels directly if going, else opens the contact prompt. */
    requestRsvp: () => void;
    /** Confirm registration with the number the attendee typed. */
    confirmRsvp: (contactPhone: string) => Promise<void>;
    closePrompt: () => void;
}

/**
 * Shared RSVP logic for events. Registering opens a prompt to collect a
 * contact number (WhatsApp) which is stored on the RSVP; cancelling just
 * removes the RSVP. Keeps an optimistic count and reports changes upward.
 */
export function useEventRsvp(
    event: ForumEvent,
    onChange?: (eventId: string, going: boolean, count: number) => void,
): UseEventRsvp {
    const { isAuthenticated } = useAuth();
    const { openLogin } = useModal();
    const [going, setGoing] = useState(!!event.going_by_me);
    const [count, setCount] = useState(event.attendee_count);
    const [busy, setBusy] = useState(false);
    const [promptOpen, setPromptOpen] = useState(false);

    useEffect(() => {
        setGoing(!!event.going_by_me);
        setCount(event.attendee_count);
    }, [event.id, event.going_by_me, event.attendee_count]);

    const applyToggle = async (contactPhone?: string) => {
        setBusy(true);
        const next = !going;
        const optimisticCount = Math.max(0, count + (next ? 1 : -1));
        setGoing(next);
        setCount(optimisticCount);
        try {
            const res = await forumEventsService.toggleEventRsvp(event.id, contactPhone);
            setGoing(res.going);
            onChange?.(event.id, res.going, optimisticCount);
        } catch {
            setGoing(going);
            setCount(count);
        } finally {
            setBusy(false);
        }
    };

    const requestRsvp = () => {
        if (!isAuthenticated) { openLogin(); return; }
        if (going) {
            applyToggle();
        } else {
            setPromptOpen(true);
        }
    };

    const confirmRsvp = async (contactPhone: string) => {
        setPromptOpen(false);
        await applyToggle(contactPhone);
    };

    return { going, count, busy, promptOpen, requestRsvp, confirmRsvp, closePrompt: () => setPromptOpen(false) };
}
