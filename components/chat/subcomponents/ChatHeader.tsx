import React, { useState } from 'react';
import { User, MoreVertical, X, MessageSquare } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ChatHeaderProps {
    otherPerson: any;
    activeConversation: any;
    activeConversationId: string | null;
    setActiveConversationId: (id: string | null) => void;
    embedded: boolean;
    onClearHistory: () => Promise<void>;
    onReportIssue: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
    otherPerson,
    activeConversation,
    activeConversationId,
    setActiveConversationId,
    embedded,
    onClearHistory,
    onReportIssue
}) => {
    const [showMenu, setShowMenu] = useState(false);

    return (
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
                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className={`p-2 rounded-full transition-colors relative ${embedded
                                ? 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'
                                : 'text-white/90 hover:bg-white/10'
                                }`}
                        >
                            <MoreVertical size={20} />
                        </button>

                        {showMenu && (
                            <div className="absolute top-10 right-0 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-200">
                                <button
                                    onClick={async () => {
                                        if (confirm('Are you sure you want to clear this chat history? This cannot be undone.')) {
                                            await onClearHistory();
                                            toast.success('Chat history cleared');
                                            setShowMenu(false);
                                        }
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 group/btn"
                                >
                                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover/btn:bg-slate-200 dark:group-hover/btn:bg-slate-700 transition-colors">
                                        <MessageSquare size={14} className="opacity-70" />
                                    </div>
                                    <span>Clear history</span>
                                </button>
                                <button
                                    onClick={() => {
                                        setShowMenu(false);
                                        onReportIssue();
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 group/btn"
                                >
                                    <div className="w-8 h-8 rounded-full bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center group-hover/btn:bg-rose-100 dark:group-hover/btn:bg-rose-900/40 transition-colors">
                                        <span className="text-rose-500 font-bold text-xs">!</span>
                                    </div>
                                    <span>Report issue</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {!embedded && (
                        <button onClick={() => setActiveConversationId(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/90 ml-1">
                            <X size={20} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
