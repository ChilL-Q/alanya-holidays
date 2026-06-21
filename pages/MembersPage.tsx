import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Loader2, Globe, Instagram, Facebook, Youtube, MessageSquare, Circle } from 'lucide-react';
import { db } from '../api-services';
import { ForumMember } from '../types/models';
import { SEOHead } from '../components/seo/SEOHead';
import { useAuth } from '../context/AuthContext';
import { FORUM_HERO_IMAGE } from '../data/forumContent';

const relativeJoined = (iso: string | null): string => {
    if (!iso) return '';
    try {
        return new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } catch {
        return '';
    }
};

const MemberCard: React.FC<{ member: ForumMember; canMessage: boolean }> = ({ member, canMessage }) => {
    const social = member.social_links || {};
    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 flex flex-col items-center text-center hover:shadow-lg transition-shadow">
            <div className="relative mb-3">
                {member.avatar_url ? (
                    <img src={member.avatar_url} alt={member.full_name || 'Member'} className="w-16 h-16 rounded-full object-cover" />
                ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white font-bold text-xl">
                        {(member.full_name || 'A').charAt(0).toUpperCase()}
                    </div>
                )}
                {member.is_online && (
                    <span className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-800" />
                )}
            </div>
            <p className="font-semibold text-slate-900 dark:text-white truncate max-w-full">{member.full_name || 'Anonymous'}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 capitalize">
                {member.role && member.role !== 'user' ? `${member.role} · ` : ''}
                {member.post_count} {member.post_count === 1 ? 'post' : 'posts'}
                {member.created_at ? ` · joined ${relativeJoined(member.created_at)}` : ''}
            </p>
            <div className="flex items-center gap-2 mt-auto">
                {social.website && <a href={social.website} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-slate-100 dark:hover:bg-slate-700"><Globe size={16} /></a>}
                {social.instagram && <a href={social.instagram} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg text-slate-400 hover:text-pink-600 hover:bg-slate-100 dark:hover:bg-slate-700"><Instagram size={16} /></a>}
                {social.facebook && <a href={social.facebook} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700"><Facebook size={16} /></a>}
                {social.youtube && <a href={social.youtube} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-700"><Youtube size={16} /></a>}
                {canMessage && (
                    <Link to="/inbox" className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-slate-100 dark:hover:bg-slate-700" title="Message">
                        <MessageSquare size={16} />
                    </Link>
                )}
            </div>
        </div>
    );
};

export const MembersPage: React.FC = () => {
    const { isAuthenticated } = useAuth();
    const [members, setMembers] = useState<ForumMember[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        db.getForumMembers({ limit: 120 })
            .then((data) => { if (active) setMembers(data); })
            .catch((e) => console.error('Failed to load members:', e))
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, []);

    const online = members.filter((m) => m.is_online);

    return (
        <div className="bg-slate-50 dark:bg-slate-900 min-h-screen">
            <SEOHead
                title="Members — Alanya Forum"
                description="Meet the travelers, expats, and locals in the Alanya community. See who's online and connect."
                keywords={['Alanya community members', 'Alanya expats', 'Alanya forum members']}
            />

            {/* Hero */}
            <section className="relative overflow-hidden">
                <img src={FORUM_HERO_IMAGE} alt="Alanya" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900/85 via-teal-900/70 to-slate-900/85" />
                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
                    <div className="inline-flex items-center gap-2 text-sm font-semibold text-teal-300 uppercase tracking-wider mb-3">
                        <Users size={16} /> Community
                    </div>
                    <h1 className="text-4xl md:text-5xl font-serif text-white mb-3">Our Members</h1>
                    <p className="text-white/85 max-w-2xl mx-auto inline-flex items-center gap-2">
                        <Circle size={10} className="fill-emerald-400 text-emerald-400" />
                        {online.length} online now · {members.length} shown
                    </p>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {loading ? (
                    <div className="flex justify-center p-20"><Loader2 size={32} className="animate-spin text-teal-500" /></div>
                ) : members.length === 0 ? (
                    <div className="text-center py-20">
                        <Users size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                        <p className="text-slate-500 dark:text-slate-400">No members to show yet.</p>
                    </div>
                ) : (
                    <>
                        {online.length > 0 && (
                            <section className="mb-14">
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-5 inline-flex items-center gap-2">
                                    <Circle size={10} className="fill-emerald-500 text-emerald-500" /> Online now
                                </h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                                    {online.map((m) => <MemberCard key={m.id} member={m} canMessage={isAuthenticated} />)}
                                </div>
                            </section>
                        )}
                        <section>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-5">All members</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                                {members.map((m) => <MemberCard key={m.id} member={m} canMessage={isAuthenticated} />)}
                            </div>
                        </section>
                    </>
                )}
            </div>
        </div>
    );
};
