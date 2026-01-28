import React, { useEffect, useState, useRef } from 'react';
import { Send, X, User, MessageSquare, Paperclip, MoreVertical, Check, CheckCheck, Smile } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { ChatMessage } from '../../types/models';
import { chatService } from '../../services/api/chat';

interface ChatWindowProps {
    className?: string;
    embedded?: boolean; // If true, doesn't show close button or header (for dashboard)
    autoScroll?: boolean; // If true, scrolls to bottom on new messages
}

import { toast } from 'react-hot-toast';

export const ChatWindow: React.FC<ChatWindowProps> = ({ className = '', embedded = false, autoScroll = true }) => {
    const { activeConversationId, setActiveConversationId, sendMessage, conversations, clearHistory, submitReport } = useChat();
    const { user } = useAuth();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [isReportOpen, setIsReportOpen] = useState(false);
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    const activeConversation = conversations.find(c => c.id === activeConversationId);

    // Determine the "other" person
    const otherPerson = activeConversation
        ? (user?.id === activeConversation.guest_id ? activeConversation.host : activeConversation.guest)
        : null;

    useEffect(() => {
        let isMounted = true;
        let isFirstLoad = true;

        const fetchMessages = async () => {
            if (!activeConversationId) return;

            // Only set loading on the very first fetch for this conversation
            if (isFirstLoad) setLoading(true);

            try {
                const data = await chatService.getMessages(activeConversationId);
                if (isMounted) {
                    setMessages(prev => {
                        // Simple equality check to prevent re-renders
                        if (prev.length === data.length && prev[prev.length - 1]?.id === data[data.length - 1]?.id) {
                            return prev;
                        }
                        return data;
                    });
                }
            } catch (err) {
                console.error(err);
            } finally {
                if (isMounted && isFirstLoad) {
                    setLoading(false);
                    isFirstLoad = false;
                }
            }
        };

        fetchMessages();
        const interval = setInterval(fetchMessages, 3000);
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [activeConversationId]);

    // Scroll to bottom when messages change (new message sent or received), IF autoScroll enabled
    // Use scrollTo() on container instead of scrollIntoView() to prevent scrolling the main page
    useEffect(() => {
        if (autoScroll && messagesContainerRef.current) {
            const { scrollHeight, clientHeight } = messagesContainerRef.current;
            messagesContainerRef.current.scrollTo({
                top: scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages.length, activeConversationId, autoScroll]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        const content = inputText;
        const tempId = 'temp-' + Date.now();
        setInputText(''); // Optimistic clear

        // Optimistic Update
        if (user && activeConversationId) {
            const optimisticMsg: ChatMessage = {
                id: tempId,
                conversation_id: activeConversationId,
                sender_id: user.id,
                content: content,
                is_read: false,
                created_at: new Date().toISOString()
            };
            setMessages(prev => [...prev, optimisticMsg]);
        }

        try {
            const realMsg = await sendMessage(content);
            if (realMsg) {
                // Success: replace temp message with real one to prevent flicker/duplication
                setMessages(prev => prev.map(m => m.id === tempId ? realMsg : m));
            }
        } catch (err) {
            console.error("Failed to send message:", err);
            // Rollback on fail
            setMessages(prev => prev.filter(m => m.id !== tempId));
            setInputText(content);
        }
    };

    if (!activeConversationId) return null;

    return (
        <div className={`flex flex-col bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden ${embedded ? 'rounded-none border-0 shadow-none h-full' : 'fixed top-[72px] bottom-0 left-0 right-0 sm:top-28 sm:bottom-6 sm:right-6 sm:left-auto sm:w-[400px] rounded-t-3xl sm:rounded-3xl z-50'} ${className} font-sans`}>
            {/* Premium Header */}
            <div className={`relative z-10 p-4 ${embedded ? 'bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800' : 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-lg'}`}>
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            {otherPerson?.avatar_url ? (
                                <img src={otherPerson.avatar_url} className={`w-12 h-12 rounded-full object-cover shadow-md border-2 ${embedded ? 'border-teal-500' : 'border-white/30'}`} alt="" />
                            ) : (
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-inner ${embedded ? 'bg-teal-50 text-teal-600' : 'bg-white/10 text-white backdrop-blur-sm'}`}>
                                    <User size={20} />
                                </div>
                            )}
                            {/* Online Status Indicator (Mock) */}
                            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full shadow-sm"></div>
                        </div>
                        <div>
                            <div className={`font-bold text-lg leading-tight ${embedded ? 'text-slate-900 dark:text-white' : 'text-white'}`}>
                                {otherPerson?.full_name || 'Guest User'}
                            </div>
                            <div className={`text-xs font-medium flex items-center gap-1.5 ${embedded ? 'text-slate-500 dark:text-slate-400' : 'text-teal-50/90'}`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70"></span>
                                {activeConversation?.property?.title || 'Inquiry'}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 relative">
                        {!embedded && (
                            <>
                                <button
                                    onClick={() => setShowMenu(!showMenu)}
                                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/90 relative"
                                >
                                    <MoreVertical size={20} />
                                </button>
                                {showMenu && (
                                    <div className="absolute top-10 right-10 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 py-1 z-50 animate-in fade-in zoom-in-95 duration-200">
                                        <button
                                            onClick={async () => {
                                                if (activeConversationId && confirm('Are you sure you want to clear this chat history? This cannot be undone.')) {
                                                    await clearHistory(activeConversationId);
                                                    setMessages([]); // Clear locally
                                                    toast.success('Chat history cleared');
                                                    setShowMenu(false);
                                                }
                                            }}
                                            className="w-full text-left px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
                                        >
                                            <span>Clear chat history</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowMenu(false);
                                                setIsReportOpen(true);
                                            }}
                                            className="w-full text-left px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
                                        >
                                            <span>Report issue</span>
                                        </button>
                                    </div>
                                )}
                                <button onClick={() => setActiveConversationId(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/90 ml-1">
                                    <X size={20} />
                                </button>
                            </>
                        )}
                        {embedded && (
                            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400">
                                <MoreVertical size={20} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Report Issue Modal Overlay */}
            {isReportOpen && (
                <div className="absolute inset-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
                    <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 p-6 relative">
                        <button
                            onClick={() => setIsReportOpen(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                            <X size={20} />
                        </button>

                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Report Issue</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Let us know what's wrong with this conversation.</p>

                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            setLoading(true);
                            try {
                                const formData = new FormData(e.currentTarget);
                                const reason = formData.get('reason') as string;
                                const description = formData.get('description') as string;

                                if (activeConversationId && user && activeConversation) {
                                    // Determine who we are reporting (the other person)
                                    const reportedId = user.id === activeConversation.host_id
                                        ? activeConversation.guest_id
                                        : activeConversation.host_id;

                                    await submitReport({
                                        reporter_id: user.id,
                                        reported_id: reportedId,
                                        conversation_id: activeConversationId,
                                        reason,
                                        description
                                    });
                                    toast.success('Report submitted successfully. We will investigate shortly.');
                                    setIsReportOpen(false);
                                }
                            } catch (err) {
                                console.error(err);
                                toast.error('Failed to submit report');
                            } finally {
                                setLoading(false);
                            }
                        }}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Reason</label>
                                    <select
                                        name="reason"
                                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                                        required
                                    >
                                        <option value="">Select a reason</option>
                                        <option value="spam">Spam or unwanted messages</option>
                                        <option value="inappropriate">Inappropriate behavior</option>
                                        <option value="scam">Suspicious or scam attempt</option>
                                        <option value="other">Other issue</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
                                    <textarea
                                        name="description"
                                        rows={4}
                                        placeholder="Please provide more details..."
                                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none transition-all resize-none"
                                        required
                                    ></textarea>
                                </div>

                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-teal-600 text-white font-medium py-3 rounded-xl hover:bg-teal-700 active:scale-[0.98] transition-all shadow-lg shadow-teal-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {loading ? 'Submitting...' : 'Submit Report'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Messages Area with refined background */}
            <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth relative"
                style={{ backgroundImage: embedded ? 'none' : 'radial-gradient(circle at center, rgba(20, 184, 166, 0.05) 0%, transparent 70%)' }}
            >
                {/* Empty State */}
                {(!messages || messages.length === 0) && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 p-8 text-center animate-in fade-in duration-700">
                        <div className="w-20 h-20 bg-teal-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-sm">
                            <MessageSquare size={32} className="text-teal-500" />
                        </div>
                        <h3 className="text-slate-900 dark:text-white font-bold text-lg mb-2">Start a conversation</h3>
                        <p className="text-sm max-w-[240px]">Ask questions about the property or discuss booking details.</p>
                    </div>
                )}

                {/* Date Divider (Mock) */}
                {messages.length > 0 && (
                    <div className="flex justify-center mb-4">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">
                            Today
                        </span>
                    </div>
                )}

                {Array.isArray(messages) && messages.map((msg, idx) => {
                    const isMe = msg.sender_id === user?.id;
                    const prevMsg = messages[idx - 1];
                    const nextMsg = messages[idx + 1];

                    // Logic to group messages visually
                    const isFirstInGroup = !prevMsg || prevMsg.sender_id !== msg.sender_id;
                    const isLastInGroup = !nextMsg || nextMsg.sender_id !== msg.sender_id;

                    return (
                        <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                            {/* Avatar for valid other person, only show on last message of group */}
                            {!isMe && (
                                <div className={`w-8 mr-3 flex flex-col justify-end ${isLastInGroup ? 'visible' : 'invisible'}`}>
                                    {otherPerson?.avatar_url ? (
                                        <img src={otherPerson.avatar_url} className="w-8 h-8 rounded-full shadow-sm object-cover" alt="" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                                            <User size={12} className="text-slate-500" />
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%] group`}>
                                <div className={`
                                    px-5 py-3.5 shadow-sm text-[15px] leading-relaxed relative transition-all duration-200
                                    ${isMe
                                        ? `bg-teal-600 text-white ${isFirstInGroup ? 'rounded-tr-2xl' : 'rounded-tr-md'} ${isLastInGroup ? 'rounded-br-2xl' : 'rounded-br-md'} rounded-l-2xl`
                                        : `bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 ${isFirstInGroup ? 'rounded-tl-2xl' : 'rounded-tl-md'} ${isLastInGroup ? 'rounded-bl-2xl' : 'rounded-bl-md'} rounded-r-2xl border border-slate-100 dark:border-slate-700`
                                    }
                                `}>
                                    {msg.content}
                                </div>

                                {/* Timestamp & Status */}
                                <div className={`
                                    flex items-center gap-1.5 mt-1 text-[10px] font-medium transition-opacity duration-200
                                    ${isMe ? 'text-slate-400 justify-end' : 'text-slate-400 justify-start'}
                                    ${isLastInGroup ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden group-hover:opacity-100 group-hover:h-auto'}
                                `}>
                                    <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    {isMe && (
                                        msg.is_read ? <CheckCheck size={12} className="text-teal-500" /> : <Check size={12} />
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Input Area */}
            <div className={`p-4 ${embedded ? 'bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800' : 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-100 dark:border-slate-800'}`}>
                <form onSubmit={handleSend} className="relative flex items-end gap-2 bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-[24px] border border-slate-200 dark:border-slate-800 focus-within:ring-2 focus-within:ring-teal-500/20 focus-within:border-teal-500 transition-all">
                    <button type="button" className="p-3 text-slate-400 hover:text-teal-600 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors flex-shrink-0">
                        <Paperclip size={20} />
                    </button>

                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 py-3 bg-transparent border-none outline-none text-slate-900 dark:text-white placeholder:text-slate-400 text-sm max-h-32 resize-none overflow-auto" // If textarea, but keeping as input for now
                    />

                    <div className="flex items-center gap-1 pr-1">
                        {!inputText.trim() && (
                            <button type="button" className="p-3 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-slate-700 rounded-full transition-colors flex-shrink-0">
                                <Smile size={20} />
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={!inputText.trim()}
                            className={`p-3 rounded-full shadow-sm flex-shrink-0 transform transition-all duration-200 ${inputText.trim() ? 'bg-teal-600 text-white hover:bg-teal-700 scale-100 rotate-0' : 'bg-slate-200 dark:bg-slate-700 text-slate-400 scale-90 rotate-90 disabled:cursor-not-allowed'}`}
                        >
                            <Send size={18} className={inputText.trim() ? 'ml-0.5' : ''} />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
