import React from 'react';
import { Send, Paperclip, Smile } from 'lucide-react';

interface MessageInputProps {
    inputText: string;
    setInputText: (text: string) => void;
    onSend: (e: React.FormEvent) => void;
    embedded: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({
    inputText,
    setInputText,
    onSend,
    embedded
}) => {
    return (
        <div className={`p-4 ${embedded ? 'bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800/50' : 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-100 dark:border-slate-800/50'}`}>
            <form onSubmit={onSend} className="relative flex items-end gap-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-[24px] border border-slate-200 dark:border-slate-800/50 focus-within:ring-2 focus-within:ring-teal-500/20 focus-within:border-teal-500 transition-all">
                <button type="button" className="p-3 text-slate-400 hover:text-teal-600 dark:text-cyan-400 hover:bg-slate-200 dark:hover:bg-slate-700/80 rounded-full transition-colors flex-shrink-0">
                    <Paperclip size={20} />
                </button>

                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 py-3 bg-transparent border-none outline-none text-slate-900 dark:text-white placeholder:text-slate-400 text-sm max-h-32 resize-none overflow-auto"
                />

                <div className="flex items-center gap-1 pr-1">
                    {!inputText.trim() && (
                        <button type="button" className="p-3 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-slate-700/80 rounded-full transition-colors flex-shrink-0">
                            <Smile size={20} />
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={!inputText.trim()}
                        className={`p-3 rounded-full shadow-sm flex-shrink-0 transform transition-all duration-200 ${inputText.trim() ? 'bg-teal-600 dark:bg-cyan-600 text-white hover:bg-teal-700 scale-100 rotate-0' : 'bg-slate-200 dark:bg-slate-800/50 text-slate-400 scale-90 rotate-90 disabled:cursor-not-allowed'}`}
                    >
                        <Send size={18} className={inputText.trim() ? 'ml-0.5' : ''} />
                    </button>
                </div>
            </form>
        </div>
    );
};
