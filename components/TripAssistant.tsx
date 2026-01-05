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
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useLanguage();

  const handleAsk = async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    setResponse('');

    // Pass null if props are undefined
    const answer = await askLocalGuide(propertyName || null, location || null, query);
    setResponse(answer);
    setIsLoading(false);
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
    <div className="fixed bottom-6 right-6 z-40 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in slide-in-from-bottom-5">
      <div className="bg-primary p-4 flex justify-between items-center text-white">
        <div className="flex items-center gap-2">
          <Sparkles size={18} />
          <h3 className="font-medium">{t('ai.title')}</h3>
        </div>
        <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 rounded-full p-1">
          <X size={18} />
        </button>
      </div>

      <div className="p-4 h-64 overflow-y-auto bg-slate-50">
        {!response && !isLoading && (
          <p className="text-slate-500 text-sm">
            {t('ai.welcome')}
          </p>
        )}

        {isLoading && (
          <div className="flex space-x-2 justify-center items-center h-full">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-100"></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200"></div>
          </div>
        )}

        {response && (
          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
            <p className="text-slate-800 text-sm leading-relaxed">{response}</p>
          </div>
        )}
      </div>

      <div className="p-3 bg-white border-t border-slate-100 flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
          placeholder={t('ai.placeholder')}
          className="flex-1 text-sm bg-slate-100 border-none rounded-lg px-3 py-2 focus:ring-1 focus:ring-primary outline-none"
        />
        <button
          onClick={handleAsk}
          disabled={isLoading}
          className="bg-primary text-white p-2 rounded-lg hover:bg-primary-dark disabled:opacity-50"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
};