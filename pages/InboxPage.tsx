import React, { useEffect, useState } from 'react';
import { useChat } from '../context/ChatContext';
import { ChatWindow } from '../components/chat/ChatWindow';
import { useLanguage } from '../context/LanguageContext';
import { Search, Home, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { Navigate, useSearchParams } from 'react-router-dom';

export const InboxPage: React.FC = () => {
    const { conversations, activeConversationId, setActiveConversationId, refreshConversations } = useChat();
    const { isAuthenticated } = useAuth();
    const { t } = useLanguage();
    const [searchTerm, setSearchTerm] = useState('');

    const [searchParams] = useSearchParams();

    useEffect(() => {
        refreshConversations();

        // Handle deep linking to specific conversation
        const conversationIdParam = searchParams.get('conversationId');
        if (conversationIdParam) {
            setActiveConversationId(conversationIdParam);
        }
    }, [searchParams]);

    // Redirect if not logged in
    if (!isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    const filteredConversations = conversations
        .filter(c =>
            (c.property?.title?.toLowerCase() || '').includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
            const dateA = new Date(a.last_message?.created_at || a.created_at).getTime();
            const dateB = new Date(b.last_message?.created_at || b.created_at).getTime();
            return dateB - dateA;
        });

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-white mb-6">Messages</h1>

            <div className="flex h-[calc(100vh-200px)] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                {/* Sidebar List */}
                <div className={`${activeConversationId ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900`}>
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="relative group">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search properties..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                        {filteredConversations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-center animate-in fade-in zoom-in-95 duration-300">
                                <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
                                    <MessageSquare size={20} className="opacity-50" />
                                </div>
                                <p className="text-sm font-medium">No messages yet</p>
                                <p className="text-xs opacity-70 mt-1">Start a chat from a property page</p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {filteredConversations.map(conv => {
                                    const isActive = conv.id === activeConversationId;
                                    return (
                                        <button
                                            key={conv.id}
                                            onClick={() => setActiveConversationId(conv.id)}
                                            className={`w-full text-left p-3 rounded-xl transition-all duration-200 group relative overflow-hidden ${isActive
                                                ? 'bg-teal-50 dark:bg-teal-900/10 shadow-sm ring-1 ring-teal-200 dark:ring-teal-800'
                                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 transparent'}`}
                                        >
                                            <div className="flex justify-between items-start mb-1.5 relative z-10">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative shrink-0">
                                                        {conv.property?.images?.[0] ? (
                                                            <img src={conv.property.images[0]} className="w-10 h-10 rounded-lg object-cover shadow-sm ring-1 ring-slate-100 dark:ring-slate-800" alt="" />
                                                        ) : (
                                                            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center ring-1 ring-slate-100 dark:ring-slate-800">
                                                                <Home size={18} className="text-slate-400" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="min-w-0">
                                                        <h3 className={`font-bold text-sm leading-tight truncate ${isActive ? 'text-teal-900 dark:text-teal-50' : 'text-slate-900 dark:text-white'}`}>
                                                            {conv.property?.title || 'Unknown Property'}
                                                        </h3>
                                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                                            {conv.host?.full_name || 'Host'}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                                                    {conv.last_message && (
                                                        <span className={`text-[10px] font-medium ${isActive ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400'}`}>
                                                            {format(new Date(conv.last_message.created_at), 'MMM d')}
                                                        </span>
                                                    )}
                                                    {conv.unread_count && conv.unread_count > 0 ? (
                                                        <span className="bg-teal-600 text-white text-[10px] font-bold px-1.5 h-4 min-w-[16px] flex items-center justify-center rounded-full shadow-md animate-bounce-short">
                                                            {conv.unread_count}
                                                        </span>
                                                    ) : null}
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-center pl-[52px] relative z-10">
                                                <p className={`text-xs truncate max-w-[180px] leading-relaxed ${isActive ? 'text-teal-700/80 dark:text-teal-300/70 font-medium' : 'text-slate-500 dark:text-slate-400'}`}>
                                                    {conv.last_message?.sender_id === 'me' && 'You: '}
                                                    {conv.last_message?.content || 'No messages'}
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className={`${activeConversationId ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-slate-50/50 dark:bg-slate-900/80 relative`}>
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/subtle-white-feathers.png')] opacity-50 pointer-events-none mix-blend-soft-light disabled"></div>

                    {activeConversationId ? (
                        <ChatWindow key={activeConversationId} embedded className="h-full bg-transparent shadow-none border-none" />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-600 animate-in fade-in duration-500">
                            <div className="w-20 h-20 bg-teal-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 shadow-sm">
                                <MessageSquare size={32} className="text-teal-500/50" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Your Messages</h3>
                            <p className="text-slate-500 text-sm max-w-xs text-center leading-relaxed">Select a conversation to communicate with hosts regarding your bookings.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
