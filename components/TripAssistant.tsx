import React, { useState } from 'react';
import { Sparkles, Send, X } from 'lucide-react';
import { askLocalGuide } from '../services/geminiService';
import { useLanguage } from '../context/LanguageContext';

interface TripAssistantProps {
  propertyName?: string;
  location?: string;
}

export const TripAssistant: React.FC<TripAssistantProps> = ({ propertyName, location }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; content: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useLanguage();

  const isMounted = React.useRef(true);

  React.useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleAsk = async () => {
    if (!query.trim()) return;

    // Add user message immediately
    const userMessage = { role: 'user' as const, content: query };
    setMessages(prev => [...prev, userMessage]);
    setQuery(''); // Clear input
    setIsLoading(true);

    // Pass null if props are undefined
    const answer = await askLocalGuide(propertyName || null, location || null, query);

    if (isMounted.current) {
      // Add model response
      const modelMessage = { role: 'model' as const, content: answer };
      setMessages(prev => [...prev, modelMessage]);
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-primary text-white px-5 py-3 rounded-full shadow-xl hover:bg-primary-dark hover:scale-105 transition-all duration-300"
      >
        <Sparkles size={18} />
        <span className="font-medium">{t('ai.button')}</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 w-80 md:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in slide-in-from-bottom-5 flex flex-col max-h-[600px]">
      <div className="bg-primary p-4 flex justify-between items-center text-white shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles size={18} />
          <h3 className="font-medium">{t('ai.title')}</h3>
        </div>
        <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 rounded-full p-1">
          <X size={18} />
        </button>
      </div>

      <div className="p-4 flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 flex flex-col gap-3 min-h-[300px]">
        {messages.length === 0 && !isLoading && (
          <p className="text-slate-500 dark:text-slate-400 text-sm text-center mt-4">
            {t('ai.welcome')}
          </p>
        )}

        {messages.map((msg, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg max-w-[85%] text-sm leading-relaxed ${msg.role === 'user'
              ? 'bg-primary text-white self-end rounded-br-none'
              : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm self-start rounded-bl-none'
              }`}
          >
            {msg.content}
          </div>
        ))}

        {isLoading && (
          <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm self-start rounded-bl-none w-16 flex items-center justify-center">
            <div className="flex space-x-1">
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce delay-100"></div>
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce delay-200"></div>
            </div>
          </div>
        )}
      </div>

      <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex gap-2 shrink-0">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
          placeholder={t('ai.placeholder')}
          className="flex-1 text-sm bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-3 py-2 focus:ring-1 focus:ring-primary outline-none dark:text-white dark:placeholder-slate-500"
        />
        <button
          onClick={handleAsk}
          disabled={isLoading || !query.trim()}
          className="bg-primary text-white p-2 rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
};