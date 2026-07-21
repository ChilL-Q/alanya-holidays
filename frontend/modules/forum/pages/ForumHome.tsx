import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    PlusCircle, Loader2, Flame, Compass, Users, MessagesSquare,
    MessageCircle, Radio, ArrowRight, Calendar, Sparkles, HelpCircle,
} from 'lucide-react';
import { forumService, forumEventsService, membersService } from '../../../api-services';
import { ForumPost, ForumCategory, ForumEvent, ForumMember } from '../../../types/models';
import { ForumThreadCard } from '../components/ForumThreadCard';
import { ForumCategoryCard } from '../components/ForumCategoryCard';
import { ForumEventCard } from '../components/ForumEventCard';
import { SEOHead } from '../../../components/seo/SEOHead';
import { useAuth } from '../../../context/AuthContext';
import { useModal } from '../../../context/ModalContext';
import { FORUM_HERO_IMAGE } from '../../../data/forumContent';

const fmt = (n: number): string => n.toLocaleString('en-US');

const SectionHeader: React.FC<{ eyebrow: string; icon: React.ReactNode; title: string; subtitle?: string }> = ({
    eyebrow, icon, title, subtitle,
}) => (
    <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 text-sm font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wider mb-3">
            {icon} {eyebrow}
        </div>
        <h2 className="text-3xl md:text-4xl font-serif text-slate-900 dark:text-white mb-3">{title}</h2>
        {subtitle && <p className="text-slate-600 dark:text-slate-400">{subtitle}</p>}
    </div>
);

export const ForumHome: React.FC = () => {
    const { isAuthenticated } = useAuth();
    const { openLogin } = useModal();

    const [categories, setCategories] = useState<ForumCategory[]>([]);
    const [hotPosts, setHotPosts] = useState<ForumPost[]>([]);
    const [events, setEvents] = useState<ForumEvent[]>([]);
    const [members, setMembers] = useState<ForumMember[]>([]);
    const [stats, setStats] = useState({ members: 0, discussions: 0, replies: 0, online: 0 });
    const [loading, setLoading] = useState(true);
    const [activePostType, setActivePostType] = useState<'discussion' | 'question'>('discussion');

    useEffect(() => {
        let active = true;
        Promise.allSettled([
            forumService.getForumCategoryTree(),
            forumService.getHotPosts(8),
            forumService.getForumStats(),
            forumEventsService.getForumEvents({ upcomingOnly: true, limit: 3 }),
            membersService.getForumMembers({ limit: 6 }),
            membersService.getOnlineCount(),
        ]).then(([cats, hot, st, evs, mem, online]) => {
            if (!active) return;
            if (cats.status === 'fulfilled') setCategories(cats.value);
            if (hot.status === 'fulfilled') setHotPosts(hot.value);
            if (st.status === 'fulfilled' || online.status === 'fulfilled') {
                setStats({
                    ...(st.status === 'fulfilled' ? st.value : { members: 0, discussions: 0, replies: 0 }),
                    online: online.status === 'fulfilled' ? online.value : 0,
                });
            }
            if (evs.status === 'fulfilled') setEvents(evs.value);
            if (mem.status === 'fulfilled') setMembers(mem.value);
            setLoading(false);
        });
        return () => { active = false; };
    }, []);

    const display = {
        members: stats.members,
        discussions: stats.discussions,
        replies: stats.replies,
        onlineNow: stats.online,
    };

    const NewPostButton: React.FC<{ className?: string }> = ({ className = '' }) =>
        isAuthenticated ? (
            <Link to="/forum/new" className={className}>
                <PlusCircle size={18} /> New Post
            </Link>
        ) : (
            <button onClick={openLogin} className={className}>
                <PlusCircle size={18} /> New Post
            </button>
        );

    return (
        <div className="bg-slate-50 dark:bg-slate-900 min-h-screen">
            <SEOHead
                title="Community Forum"
                description="The Alanya community for travelers, expats, and locals. Discover beaches, share experiences, and connect with people who love Alanya."
                keywords={['Alanya forum', 'Alanya community', 'expats Alanya', 'travel forum Türkiye']}
            />

            {/* ===== Hero ===== */}
            <section className="relative z-20">
                <img src={FORUM_HERO_IMAGE} alt="Alanya coastline" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-teal-900/70" />
                <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-28 text-center">
                    <div className="inline-flex items-center gap-3 mb-6">
                        <div className="flex -space-x-2">
                            {['from-rose-400 to-pink-500', 'from-sky-400 to-blue-500', 'from-amber-400 to-orange-500'].map((g, i) => (
                                <div key={i} className={`w-8 h-8 rounded-full bg-gradient-to-br ${g} border-2 border-white/80`} />
                            ))}
                        </div>
                        <span className="text-sm font-medium text-white/90">{fmt(display.members)} members already here</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-serif text-white mb-5 tracking-tight">
                        Alanya <span className="text-teal-300">Forum</span>
                    </h1>
                    <p className="text-lg md:text-xl text-white/85 max-w-2xl mx-auto mb-8">
                        The community for travelers, expats, and locals. Discover beaches, share experiences,
                        and connect with people who love Alanya.
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <NewPostButton className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-teal-900/30 transition-colors" />
                        <a
                            href="#categories"
                            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-xl font-semibold border border-white/20 transition-colors"
                        >
                            <Compass size={18} /> Explore Discussions
                        </a>
                    </div>
                </div>

                {/* Stats bar */}
                <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mb-12 -mt-12">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-200 dark:bg-slate-700 rounded-2xl overflow-hidden shadow-xl">
                        {[
                            { label: 'Members', value: display.members, icon: <Users size={18} /> },
                            { label: 'Discussions', value: display.discussions, icon: <MessagesSquare size={18} /> },
                            { label: 'Replies', value: display.replies, icon: <MessageCircle size={18} /> },
                            { label: 'Online Now', value: display.onlineNow, icon: <Radio size={18} className="text-emerald-500" /> },
                        ].map((s) => (
                            <div key={s.label} className="bg-white dark:bg-slate-800 px-4 py-6 text-center">
                                <div className="flex items-center justify-center gap-1.5 text-teal-600 dark:text-teal-400 mb-1">{s.icon}</div>
                                <p className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">{fmt(s.value)}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">{s.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== Upcoming Events (transparent band, top) ===== */}
            {/* Always rendered: gives the stats bar a backdrop to float over and a
                permanent path to the /events page, even before any events exist. */}
            <section className="relative z-0 overflow-hidden pt-32 pb-16">
                <img src={FORUM_HERO_IMAGE} alt="" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900/85 via-teal-900/70 to-slate-900/85 backdrop-blur-sm" />
                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
                        <div>
                            <div className="inline-flex items-center gap-2 text-sm font-semibold text-teal-300 uppercase tracking-wider mb-2">
                                <Calendar size={16} /> This Week
                            </div>
                            <h2 className="text-3xl md:text-4xl font-serif text-white">Upcoming Events</h2>
                            <p className="text-white/80 mt-2 max-w-xl">Join meetups, attend gatherings, and be part of the growing Alanya community.</p>
                        </div>
                        <Link to="/events" className="inline-flex items-center gap-2 text-white font-semibold hover:gap-3 transition-all">
                            View all events <ArrowRight size={18} />
                        </Link>
                    </div>
                    {events.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {events.map((ev) => <ForumEventCard key={ev.id} event={ev} glass />)}
                        </div>
                    ) : loading ? (
                        <div className="flex justify-center py-10"><Loader2 size={28} className="animate-spin text-white/70" /></div>
                    ) : (
                        <div className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-sm px-6 py-10 text-center">
                            <Calendar size={32} className="mx-auto mb-3 text-teal-300" />
                            <p className="text-white/90 mb-5">No upcoming events scheduled yet — check the calendar to see what's coming up.</p>
                            <Link to="/events" className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white px-5 py-2.5 rounded-lg font-semibold border border-white/20 transition-colors">
                                <Calendar size={18} /> View events calendar
                            </Link>
                        </div>
                    )}
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-20 space-y-24">
                {/* ===== Hot Discussions ===== */}
                <section>
                    <SectionHeader
                        eyebrow="Trending Now"
                        icon={<Flame size={16} />}
                        title="Hot Discussions"
                        subtitle="The conversations everyone is talking about right now."
                    />
                    {loading ? (
                        <div className="flex justify-center p-12"><Loader2 size={32} className="animate-spin text-teal-500" /></div>
                    ) : hotPosts.length === 0 ? (
                        <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                            <MessagesSquare size={40} className="mx-auto mb-3 opacity-40" />
                            <p className="mb-4">No discussions yet. Be the first to start one!</p>
                            <NewPostButton className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors" />
                        </div>
                    ) : (
                        <div className="flex gap-5 overflow-x-auto snap-x pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
                            {hotPosts.map((post) => (
                                <div key={post.id} className="snap-start shrink-0 w-72">
                                    <ForumThreadCard post={post} />
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* ===== Discussions vs Questions Tabs ===== */}
                <section>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                        <div className="flex gap-2">
                            <button
                                onClick={() => setActivePostType('discussion')}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                    activePostType === 'discussion'
                                        ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/30'
                                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                                }`}
                            >
                                <MessagesSquare size={16} className="inline-block mr-1.5" /> All Discussions
                            </button>
                            <button
                                onClick={() => setActivePostType('question')}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                    activePostType === 'question'
                                        ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/30'
                                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                                }`}
                            >
                                <HelpCircle size={16} className="inline-block mr-1.5" /> Ask Alanya
                            </button>
                        </div>
                        {activePostType === 'question' ? (
                            isAuthenticated ? (
                                <Link
                                    to="/forum/ask"
                                    className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
                                >
                                    <PlusCircle size={18} /> Ask a Question
                                </Link>
                            ) : (
                                <button
                                    onClick={openLogin}
                                    className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
                                >
                                    <PlusCircle size={18} /> Ask a Question
                                </button>
                            )
                        ) : null}
                    </div>

                    {loading ? (
                        <div className="flex justify-center p-12"><Loader2 size={32} className="animate-spin text-teal-500" /></div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {hotPosts
                                .filter((p) => p.post_type === activePostType)
                                .slice(0, 6)
                                .map((post) => (
                                    <ForumThreadCard key={post.id} post={post} />
                                ))}
                        </div>
                    )}
                </section>

                {/* ===== Browse Categories ===== */}
                <section id="categories" className="scroll-mt-20">
                    <SectionHeader
                        eyebrow="Explore"
                        icon={<Compass size={16} />}
                        title="Browse Categories"
                        subtitle="From travel planning to local culture, find the right space for your questions and stories."
                    />
                    {loading ? (
                        <div className="flex justify-center p-12"><Loader2 size={32} className="animate-spin text-teal-500" /></div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                            {categories.map((c) => (
                                <ForumCategoryCard key={c.id} category={c} />
                            ))}
                        </div>
                    )}
                </section>

                {/* ===== Meet Our Community (real members) ===== */}
                {members.length > 0 && (
                    <section>
                        <SectionHeader
                            eyebrow="Top Contributors"
                            icon={<Sparkles size={16} />}
                            title="Meet Our Community"
                            subtitle="The experts, locals, and passionate travelers who make this forum what it is."
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {members.map((person) => (
                                <div key={person.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 flex items-center gap-4">
                                    <div className="relative shrink-0">
                                        {person.avatar_url ? (
                                            <img src={person.avatar_url} alt={person.full_name || 'Member'} className="w-14 h-14 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white font-bold text-lg">
                                                {(person.full_name || 'A').charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        {person.is_online && (
                                            <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-800" />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-semibold text-slate-900 dark:text-white truncate">{person.full_name || 'Anonymous'}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                                            {person.role && person.role !== 'user' ? `${person.role} · ` : ''}{fmt(person.post_count)} posts
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="text-center mt-8">
                            <Link to="/members" className="inline-flex items-center gap-2 text-teal-600 dark:text-teal-400 font-semibold hover:gap-3 transition-all">
                                See all members <ArrowRight size={18} />
                            </Link>
                        </div>
                    </section>
                )}

                {/* ===== CTA ===== */}
                <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-600 to-cyan-700 px-8 py-14 text-center">
                    <h2 className="text-3xl md:text-4xl font-serif text-white mb-3">Got something to share?</h2>
                    <p className="text-teal-50 max-w-xl mx-auto mb-8">
                        Ask a question, share a hidden gem, or help a fellow traveler. Your voice makes the community better.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <NewPostButton className="inline-flex items-center gap-2 bg-white text-teal-700 px-6 py-3 rounded-xl font-semibold hover:bg-teal-50 transition-colors" />
                        <a href="#categories" className="inline-flex items-center gap-2 text-white font-semibold hover:gap-3 transition-all">
                            Browse all categories <ArrowRight size={18} />
                        </a>
                    </div>
                </section>
            </div>
        </div>
    );
};
