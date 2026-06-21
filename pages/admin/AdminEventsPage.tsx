import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Loader2, Plus, Trash2, Calendar, MapPin, Users, Mail, Phone, MessageCircle, ChevronDown } from 'lucide-react';
import { db } from '../../api-services';
import { ForumEvent, ForumMember, EventAttendee } from '../../types/models';

const waLink = (phone: string) => `https://wa.me/${phone.replace(/[^0-9]/g, '')}`;

const IMAGE_PRESETS = [
    '/images/home/cleopatra_beach.png',
    '/images/experiences/water_sports_hero.png',
    '/images/home/turkish_cuisine.png',
    '/images/hero-bg.jpg',
];

const emptyForm = {
    title: '',
    event_date: '',
    location: '',
    image_url: IMAGE_PRESETS[0],
    description: '',
    host_id: '',
};

export const AdminEventsPage: React.FC = () => {
    const [events, setEvents] = useState<ForumEvent[]>([]);
    const [members, setMembers] = useState<ForumMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [openId, setOpenId] = useState<string | null>(null);
    const [attendees, setAttendees] = useState<EventAttendee[]>([]);
    const [attLoading, setAttLoading] = useState(false);

    const toggleAttendees = async (ev: ForumEvent) => {
        if (openId === ev.id) { setOpenId(null); return; }
        setOpenId(ev.id);
        setAttendees([]);
        setAttLoading(true);
        try {
            setAttendees(await db.getEventAttendees(ev.id));
        } catch (e) {
            toast.error((e as Error).message || 'Failed to load attendees');
            setOpenId(null);
        } finally {
            setAttLoading(false);
        }
    };

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [evs, mem] = await Promise.all([
                db.getForumEvents({ upcomingOnly: false, includeUnpublished: true }),
                db.getForumMembers({ limit: 200 }),
            ]);
            setEvents(evs);
            setMembers(mem);
        } catch (e) {
            toast.error((e as Error).message || 'Failed to load events');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title.trim() || !form.event_date) {
            toast.error('Title and date are required');
            return;
        }
        setCreating(true);
        try {
            await db.createForumEvent({
                title: form.title.trim(),
                event_date: new Date(form.event_date).toISOString(),
                location: form.location.trim() || undefined,
                image_url: form.image_url || undefined,
                description: form.description.trim() || undefined,
                host_id: form.host_id || null,
            });
            toast.success('Event created');
            setForm(emptyForm);
            fetchAll();
        } catch (e) {
            toast.error((e as Error).message || 'Failed to create event');
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Delete this event? RSVPs will be removed.')) return;
        try {
            await db.deleteForumEvent(id);
            toast.success('Event deleted');
            setEvents((prev) => prev.filter((e) => e.id !== id));
        } catch (e) {
            toast.error((e as Error).message || 'Failed to delete event');
        }
    };

    const set = (key: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        setForm((f) => ({ ...f, [key]: e.target.value }));

    const inputCls = 'w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500';

    return (
        <div className="space-y-10">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Events</h1>
                <p className="mt-1 text-slate-500 dark:text-slate-400">Create community events and manage RSVPs. You can host an event on behalf of a member.</p>
            </div>

            {/* Create */}
            <section>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">New event</h2>
                <form onSubmit={handleCreate} className="bg-white dark:bg-slate-800 rounded-xl shadow p-5 max-w-2xl space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title *</label>
                            <input type="text" value={form.title} onChange={set('title')} required placeholder="Digital Nomad Beach Meetup" className={inputCls} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date & time *</label>
                            <input type="datetime-local" value={form.event_date} onChange={set('event_date')} required className={inputCls} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Location</label>
                            <input type="text" value={form.location} onChange={set('location')} placeholder="Cleopatra Beach" className={inputCls} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Host (on behalf of)</label>
                            <select value={form.host_id} onChange={set('host_id')} className={inputCls}>
                                <option value="">— Forum / no specific host —</option>
                                {members.map((m) => (
                                    <option key={m.id} value={m.id}>{m.full_name || 'Anonymous'}</option>
                                ))}
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Image</label>
                            <select value={form.image_url} onChange={set('image_url')} className={inputCls}>
                                {IMAGE_PRESETS.map((src) => <option key={src} value={src}>{src}</option>)}
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                            <textarea value={form.description} onChange={set('description')} rows={3} placeholder="What's happening?" className={inputCls} />
                        </div>
                    </div>
                    <button type="submit" disabled={creating} className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 rounded-lg font-medium transition-colors disabled:opacity-50">
                        {creating ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                        Create event
                    </button>
                </form>
            </section>

            {/* List */}
            <section>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">All events</h2>
                {loading ? (
                    <div className="flex justify-center p-12"><Loader2 size={28} className="animate-spin text-teal-500" /></div>
                ) : events.length === 0 ? (
                    <p className="text-slate-500 dark:text-slate-400">No events yet.</p>
                ) : (
                    <div className="space-y-2 max-w-3xl">
                        {events.map((ev) => (
                            <div key={ev.id} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                                <div className="flex items-center gap-4 px-4 py-3">
                                    <img src={ev.image_url || '/images/hero-bg.jpg'} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />
                                    <div className="flex-grow min-w-0">
                                        <p className="font-medium text-slate-900 dark:text-white truncate">{ev.title}</p>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
                                            <span className="inline-flex items-center gap-1"><Calendar size={12} /> {new Date(ev.event_date).toLocaleString()}</span>
                                            {ev.location && <span className="inline-flex items-center gap-1"><MapPin size={12} /> {ev.location}</span>}
                                            {!ev.is_published && <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">Draft</span>}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => toggleAttendees(ev)}
                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors shrink-0 ${
                                            openId === ev.id
                                                ? 'bg-teal-600 text-white'
                                                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
                                        }`}
                                    >
                                        <Users size={14} /> {ev.attendee_count} going
                                        <ChevronDown size={14} className={`transition-transform ${openId === ev.id ? 'rotate-180' : ''}`} />
                                    </button>
                                    <button onClick={() => handleDelete(ev.id)} title="Delete event" className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0">
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                {openId === ev.id && (
                                    <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 px-4 py-3">
                                        {attLoading ? (
                                            <div className="flex justify-center py-6"><Loader2 size={20} className="animate-spin text-teal-500" /></div>
                                        ) : attendees.length === 0 ? (
                                            <p className="text-sm text-slate-500 dark:text-slate-400 py-2">No one has RSVP'd yet.</p>
                                        ) : (
                                            <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                                                {attendees.map((a) => {
                                                    const contactNum = a.contact_phone || a.phone;
                                                    return (
                                                    <li key={a.id} className="flex items-center gap-3 py-2.5">
                                                        {a.avatar_url
                                                            ? <img src={a.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                                                            : <span className="w-9 h-9 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-200 grid place-items-center text-sm font-bold shrink-0">{(a.full_name || '?').charAt(0)}</span>}
                                                        <div className="flex-grow min-w-0">
                                                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{a.full_name || 'Anonymous'}</p>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                                                {a.contact_phone
                                                                    ? <span className="inline-flex items-center gap-1"><MessageCircle size={11} className="text-green-500" /> {a.contact_phone}</span>
                                                                    : (a.email || a.phone || 'No contact info')}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-1 shrink-0">
                                                            {a.email && (
                                                                <a href={`mailto:${a.email}`} title={`Email ${a.email}`} className="p-2 rounded-lg text-slate-500 hover:text-teal-600 hover:bg-white dark:hover:bg-slate-700 transition-colors">
                                                                    <Mail size={16} />
                                                                </a>
                                                            )}
                                                            {contactNum && (
                                                                <>
                                                                    <a href={`tel:${contactNum}`} title={`Call ${contactNum}`} className="p-2 rounded-lg text-slate-500 hover:text-teal-600 hover:bg-white dark:hover:bg-slate-700 transition-colors">
                                                                        <Phone size={16} />
                                                                    </a>
                                                                    <a href={waLink(contactNum)} target="_blank" rel="noopener noreferrer" title={`WhatsApp ${contactNum}`} className="p-2 rounded-lg text-slate-500 hover:text-green-600 hover:bg-white dark:hover:bg-slate-700 transition-colors">
                                                                        <MessageCircle size={16} />
                                                                    </a>
                                                                </>
                                                            )}
                                                        </div>
                                                    </li>
                                                    );
                                                })}
                                            </ul>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};
