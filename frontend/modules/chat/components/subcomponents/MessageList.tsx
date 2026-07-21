import React from 'react';
import { User, MessageSquare, Check, CheckCheck } from 'lucide-react';
import { ChatMessage } from '../../../../types/models';

interface MessageListProps {
    messages: ChatMessage[];
    currentUser: any;
    otherPerson: any;
    embedded: boolean;
    containerRef: React.RefObject<HTMLDivElement>;
}

export const MessageList: React.FC<MessageListProps> = ({
    messages,
    currentUser,
    otherPerson,
    embedded,
    containerRef
}) => {
    return (
        <div
            ref={containerRef}
            className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth relative"
            style={{ backgroundImage: embedded ? 'none' : 'radial-gradient(circle at center, rgba(20, 184, 166, 0.05) 0%, transparent 70%)' }}
        >
            {/* Empty State */}
            {(!messages || messages.length === 0) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 dark:text-slate-400 p-8 text-center animate-in fade-in duration-700">
                    <div className="w-20 h-20 bg-teal-50 dark:bg-slate-800/80 rounded-full flex items-center justify-center mb-6 shadow-sm">
                        <MessageSquare size={32} className="text-teal-500 dark:text-cyan-400 " />
                    </div>
                    <h3 className="text-slate-900 dark:text-white font-bold text-lg mb-2">Start a conversation</h3>
                    <p className="text-sm max-w-[240px]">Ask questions about the property or discuss booking details.</p>
                </div>
            )}

            {/* Date Divider (Mock) */}
            {messages.length > 0 && (
                <div className="flex justify-center mb-4">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/80 px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">
                        Today
                    </span>
                </div>
            )}

            {Array.isArray(messages) && messages.map((msg, idx) => {
                const isMe = msg.sender_id === currentUser?.id;
                const prevMsg = messages[idx - 1];
                const nextMsg = messages[idx + 1];

                // Logic to group messages visually
                const isFirstInGroup = !prevMsg || prevMsg.sender_id !== msg.sender_id;
                const isLastInGroup = !nextMsg || nextMsg.sender_id !== msg.sender_id;

                return (
                    <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                        {/* Avatar for valid other person, only show on last message of group */}
                        {!isMe && (
                            <div className={`w-8 mr-3 flex flex-col justify-end ${isLastInGroup ? 'visible' : 'invisible'}`}>
                                {otherPerson?.avatar_url ? (
                                    <img src={otherPerson.avatar_url} className="w-8 h-8 rounded-full shadow-sm object-cover" alt="" />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800/80 flex items-center justify-center">
                                        <User size={12} className="text-slate-500" />
                                    </div>
                                )}
                            </div>
                        )}

                        <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%] group`}>
                            <div className={`
                                px-5 py-3.5 shadow-sm text-[15px] leading-relaxed relative transition-all duration-200
                                ${isMe
                                    ? `bg-teal-600 dark:bg-cyan-600 text-white ${isFirstInGroup ? 'rounded-tr-2xl' : 'rounded-tr-md'} ${isLastInGroup ? 'rounded-br-2xl' : 'rounded-br-md'} rounded-l-2xl`
                                    : `bg-white dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 ${isFirstInGroup ? 'rounded-tl-2xl' : 'rounded-tl-md'} ${isLastInGroup ? 'rounded-bl-2xl' : 'rounded-bl-md'} rounded-r-2xl border border-slate-100 dark:border-slate-800/50`
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
                                    msg.is_read ? <CheckCheck size={12} className="text-teal-500 dark:text-cyan-400 " /> : <Check size={12} />
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
