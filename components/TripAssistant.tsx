import React, { useRef, useEffect } from 'react';
import { Sparkles, Send, X, RefreshCw } from 'lucide-react';
import { askLocalGuide } from '../services/aiService';
import { useLanguage } from '../context/LanguageContext';
import { useChat } from '../context/ChatContext';

export const TripAssistant: React.FC = () => {
  const {
    isOpen, setIsOpen,
    messages, addMessage,
    isLoading, setIsLoading,
    chatContext, clearMessages
  } = useChat();

  const [query, setQuery] = React.useState('');
  const [isFooterVisible, setIsFooterVisible] = React.useState(false);
  const { t } = useLanguage();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsFooterVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    const footer = document.querySelector('footer');
    if (footer) {
      observer.observe(footer);
    }

    return () => {
      if (footer) observer.unobserve(footer);
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleAsk = async () => {
    if (!query.trim()) return;

    const currentQuery = query;
    setQuery(''); // Clear input immediately

    // Add user message
    addMessage({ role: 'user', content: currentQuery });
    setIsLoading(true);

    try {
      // Use context if available
      const propertyName = chatContext?.propertyName || null;
      const location = chatContext?.location || null;

      const answer = await askLocalGuide(propertyName, location, currentQuery, messages);

      addMessage({ role: 'model', content: answer });
    } catch (error) {
      console.error('AI Error:', error);
      addMessage({ role: 'model', content: "Sorry, I'm having trouble connecting right now. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
        className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 ${isFooterVisible ? 'bg-teal-600' : 'bg-slate-900 dark:bg-teal-600'} text-white px-5 py-3 rounded-full shadow-xl hover:scale-105 transition-all duration-300 group`}
      >
        <Sparkles size={18} className="group-hover:animate-pulse" />
        <span className="font-medium">{t('ai.button')}</span>
      </button>
    );
  }

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="fixed bottom-6 right-6 z-50 w-80 md:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in slide-in-from-bottom-5 flex flex-col max-h-[600px] h-[500px]"
    >
      {/* Header */}
      <div className="bg-slate-900 dark:bg-teal-600 p-4 flex justify-between items-center text-white shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles size={18} />
          <div>
            <h3 className="font-medium leading-none">{t('ai.title')}</h3>
            {chatContext?.propertyName && (
              <span className="text-xs opacity-75 block mt-1">
                Talking about: {chatContext.propertyName}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={clearMessages}
            className="hover:bg-white/20 rounded-full p-1.5 transition-colors"
            title="Clear Chat"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="hover:bg-white/20 rounded-full p-1.5 transition-colors"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="p-4 flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 flex flex-col gap-3">
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 space-y-3 opacity-80">
            <Sparkles size={32} className="text-teal-500" />
            <p className="text-sm max-w-[200px]">
              {t('ai.welcome')}
            </p>
          </div>
        )}

        {messages.map((msg, index) => (
          <div
            key={index}
            className={`p-3 rounded-2xl max-w-[85%] text-sm leading-relaxed ${msg.role === 'user'
              ? 'bg-slate-900 dark:bg-teal-600 text-white self-end rounded-br-none'
              : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm self-start rounded-bl-none'
              }`}
          >
            {msg.content}
          </div>
        ))}

        {isLoading && (
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm self-start rounded-bl-none w-16 flex items-center justify-center">
            <div className="flex space-x-1">
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-100"></div>
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-200"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex gap-2 shrink-0">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
          placeholder={t('ai.placeholder')}
          className="flex-1 text-sm bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white dark:placeholder-slate-500 transition-all"
        />
        <button
          onClick={handleAsk}
          disabled={isLoading || !query.trim()}
          className="bg-teal-600 text-white p-3 rounded-xl hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 shadow-md shadow-teal-500/20"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};