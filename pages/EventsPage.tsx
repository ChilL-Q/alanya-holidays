import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Loader2, CalendarDays } from 'lucide-react';
import { db } from '../api-services';
import { ForumEvent } from '../types/models';
import { ForumEventCard } from '../components/forum/ForumEventCard';
import { EventDetailsModal } from '../components/forum/EventDetailsModal';
import { EventCalendar, dateKey } from '../components/forum/EventCalendar';
import { SEOHead } from '../components/seo/SEOHead';
import { FORUM_HERO_IMAGE } from '../data/forumContent';

const formatLongDate = (key: string): string => {
    try {
        return new Date(key).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    } catch {
        return key;
    }
};

export const EventsPage: React.FC = () => {
    const [events, setEvents] = useState<ForumEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedKey, setSelectedKey] = useState<string | null>(null);
    const [modalEvent, setModalEvent] = useState<ForumEvent | null>(null);

    const handleRsvpChange = (eventId: string, going: boolean, count: number) => {
        setEvents((prev) => prev.map((e) => (e.id === eventId ? { ...e, going_by_me: going, attendee_count: count } : e)));
        setModalEvent((prev) => (prev && prev.id === eventId ? { ...prev, going_by_me: going, attendee_count: count } : prev));
    };

    useEffect(() => {
        let active = true;
        db.getForumEvents({ upcomingOnly: false })
            .then((data) => {
                if (!active) return;
                setEvents(data);
                // Default-select the nearest upcoming event, else the most recent past one.
                const now = Date.now();
                const upcoming = data
                    .filter((e) => new Date(e.event_date).getTime() >= now)
                    .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
                const fallback = [...data].sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());
                const pick = upcoming[0] || fallback[0];
                if (pick) setSelectedKey(dateKey(pick.event_date));
            })
            .catch((e) => console.error('Failed to load events:', e))
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, []);

    const selectedEvents = useMemo(() => {
        if (!selectedKey) return [];
        return events
            .filter((e) => dateKey(e.event_date) === selectedKey)
            .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
    }, [events, selectedKey]);

    return (
        <div className="bg-slate-50 dark:bg-slate-900 min-h-screen">
            <SEOHead
                title="Community Events — Alanya Forum"
                description="Meetups, boat tours, language exchanges and more. Find and RSVP to upcoming Alanya community events."
                keywords={['Alanya events', 'Alanya meetups', 'expat events Alanya']}
            />

            {/* Hero */}
            <section className="relative overflow-hidden">
                <img src={FORUM_HERO_IMAGE} alt="Alanya" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900/85 via-teal-900/70 to-slate-900/85" />
                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12 text-center">
                    <div className="inline-flex items-center gap-2 text-sm font-semibold text-teal-300 uppercase tracking-wider mb-2">
                        <Calendar size={16} /> Community
                    </div>
                    <h1 className="text-3xl md:text-4xl font-serif text-white mb-2">Upcoming Events</h1>
                    <p className="text-white/85 max-w-2xl mx-auto text-sm md:text-base">
                        Meet fellow travelers, expats, and locals. RSVP to a meetup and we'll save you a spot.
                    </p>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {loading ? (
                    <div className="flex justify-center p-20"><Loader2 size={32} className="animate-spin text-teal-500" /></div>
                ) : events.length === 0 ? (
                    <div className="text-center py-20">
                        <CalendarDays size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                        <p className="text-slate-500 dark:text-slate-400">No events scheduled yet. Check back soon!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
                        <div className="lg:col-span-2">
                            <EventCalendar events={events} selectedKey={selectedKey} onSelect={setSelectedKey} />
                        </div>

                        <aside className="lg:sticky lg:top-24">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-0.5">
                                {selectedKey ? formatLongDate(selectedKey) : 'Select a date'}
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                                {selectedEvents.length > 0
                                    ? `${selectedEvents.length} event${selectedEvents.length > 1 ? 's' : ''} on this day`
                                    : 'No events on this day — pick a highlighted date.'}
                            </p>
                            {selectedEvents.length > 0 && (
                                <div className="space-y-4 lg:max-h-[60vh] lg:overflow-y-auto lg:pr-1">
                                    {selectedEvents.map((ev) => <ForumEventCard key={ev.id} event={ev} compact onOpen={setModalEvent} />)}
                                </div>
                            )}
                        </aside>
                    </div>
                )}
            </div>

            <EventDetailsModal
                event={modalEvent}
                isOpen={!!modalEvent}
                onClose={() => setModalEvent(null)}
                onRsvpChange={handleRsvpChange}
            />
        </div>
    );
};
