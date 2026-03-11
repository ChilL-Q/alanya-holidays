import React, { useEffect, useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { ChatWindow } from '../../components/chat/ChatWindow';
import { useLanguage } from '../../context/LanguageContext';
import { Search, User, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

export const HostMessagesPage: React.FC = () => {
    const { conversations, activeConversationId, setActiveConversationId, refreshConversations } = useChat();
    const { t } = useLanguage();
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        refreshConversations();
    }, []);

    const filteredConversations = conversations
        .filter(c =>
            (c.guest?.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (c.property?.title?.toLowerCase() || '').includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
            const dateA = new Date(a.last_message?.created_at || a.created_at).getTime();
            const dateB = new Date(b.last_message?.created_at || b.created_at).getTime();
            return dateB - dateA;
        });


    return (
        <div className="flex h-[calc(100vh-210px)] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/50 rounded-3xl overflow-hidden shadow-xl mt-6 mx-4 md:mx-0">
            {/* Sidebar List */}
            <div className={`${activeConversationId ? 'hidden md:flex' : 'flex'} w-full md:w-96 flex-col border-r border-slate-200 dark:border-slate-800/50 bg-white dark:bg-slate-900`}>
                <div className="p-6 border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-serif">Messages</h2>
                        <span className="bg-teal-100 dark:bg-slate-800/50 text-teal-700 dark:text-cyan-400 dark:text-slate-200 text-xs font-bold px-2.5 py-1 rounded-full">
                            {conversations.length}
                        </span>
                    </div>
                    <div className="relative group">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-500 dark:text-cyan-400 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search guests or properties..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-sm"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                    {filteredConversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-400 text-center animate-in fade-in zoom-in-95 duration-300">
                            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800/80 rounded-full flex items-center justify-center mb-4">
                                <Search size={24} className="opacity-50" />
                            </div>
                            <p className="text-sm font-medium">No messages found</p>
                            <p className="text-xs opacity-70 mt-1">Try a different search term</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {filteredConversations.map(conv => {
                                const isActive = conv.id === activeConversationId;
                                return (
                                    <button
                                        key={conv.id}
                                        onClick={() => setActiveConversationId(conv.id)}
                                        className={`w-full text-left p-4 rounded-2xl transition-all duration-200 group relative overflow-hidden ${isActive
                                            ? 'bg-teal-50 dark:bg-slate-800/50 shadow-sm ring-1 ring-teal-200 dark:ring-teal-800'
                                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/90/50 transparent'}`}
                                    >
                                        <div className="flex justify-between items-start mb-1.5 relative z-10">
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    {conv.guest?.avatar_url ? (
                                                        <img src={conv.guest.avatar_url} className="w-10 h-10 rounded-full object-cover shadow-sm ring-2 ring-white dark:ring-slate-900" alt="" />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
                                                            <User size={18} className="text-slate-400" />
                                                        </div>
                                                    )}
                                                    {/* Online status mock */}
                                                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
                                                </div>

                                                <div>
                                                    <h3 className={`font-bold text-sm leading-tight ${isActive ? 'text-teal-900 dark:text-slate-200' : 'text-slate-900 dark:text-white'}`}>
                                                        {conv.guest?.full_name || 'Guest User'}
                                                    </h3>
                                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                                        <span className="truncate max-w-[120px]">{conv.property?.title}</span>
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-end gap-1">
                                                {conv.last_message && (
                                                    <span className={`text-[10px] font-medium ${isActive ? 'text-teal-600 dark:text-cyan-400 dark:text-slate-200' : 'text-slate-400'}`}>
                                                        {format(new Date(conv.last_message.created_at), 'MMM d')}
                                                    </span>
                                                )}
                                                {conv.unread_count && conv.unread_count > 0 ? (
                                                    <span className="bg-teal-600 dark:bg-cyan-600 text-white text-[10px] font-bold px-1.5 h-4 min-w-[16px] flex items-center justify-center rounded-full shadow-md animate-bounce-short">
                                                        {conv.unread_count}
                                                    </span>
                                                ) : null}
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center pl-[52px] relative z-10">
                                            <p className={`text-xs truncate max-w-[200px] leading-relaxed ${isActive ? 'text-teal-700 dark:text-cyan-400 /80 dark:text-slate-200 font-medium' : 'text-slate-500 dark:text-slate-400'}`}>
                                                {conv.last_message?.sender_id === 'me' && 'You: '}
                                                {conv.last_message?.content || 'No messages'}
                                            </p>
                                        </div>

                                        {/* Active Indicator Bar */}
                                        {isActive && (
                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-teal-500 dark:bg-cyan-600 rounded-r-full"></div>
                                        )}
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
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-400 animate-in fade-in duration-500">
                        <div className="w-24 h-24 bg-teal-50 dark:bg-slate-800/80 rounded-[2rem] flex items-center justify-center mb-6 shadow-sm rotate-3 transform transition-transform hover:rotate-6">
                            <MessageSquare size={48} className="text-teal-500 dark:text-cyan-400 /50" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Select a conversation</h3>
                        <p className="text-slate-500 max-w-xs text-center leading-relaxed">Choose a chat from the sidebar to view message history and respond to guests.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
