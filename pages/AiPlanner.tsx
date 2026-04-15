import React, { useState } from 'react';
import { TripPlannerForm } from '../components/ai/TripPlannerForm';
import { TripItinerary, ItineraryDay } from '../components/ai/TripItinerary';
import { planTrip } from '../api-services/aiService';
import { Sparkles, Loader2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const AiPlanner: React.FC = () => {
    const { t } = useLanguage();
    const [status, setStatus] = useState<'form' | 'loading' | 'results' | 'error'>(() => {
        const savedStatus = sessionStorage.getItem('ai-planner-status');
        return (savedStatus as any) || 'form';
    });
    const [itinerary, setItinerary] = useState<ItineraryDay[]>(() => {
        const savedItinerary = sessionStorage.getItem('ai-planner-itinerary');
        return savedItinerary ? JSON.parse(savedItinerary) : [];
    });
    const [errorMsg, setErrorMsg] = useState('');

    React.useEffect(() => {
        sessionStorage.setItem('ai-planner-status', status);
        if (status === 'results') {
            sessionStorage.setItem('ai-planner-itinerary', JSON.stringify(itinerary));
        }
    }, [status, itinerary]);

    const handleGenerate = async (prefs: { 
        duration: number; 
        companion: string; 
        interests: string[];
        pace: string;
        budget: string;
    }) => {
        setStatus('loading');
        try {
            const response = await planTrip(prefs);
            
            // Check for specific error markers from aiService
            if (response === "__RATE_LIMIT__") {
                setErrorMsg(t('ai.planner.busyError')); // Or a specific rate limit key if we add one
                setStatus('error');
                return;
            }
            if (response === "__BUSY__") {
                setErrorMsg(t('ai.planner.busyError'));
                setStatus('error');
                return;
            }

            // Attempt to parse JSON from AI response
            try {
                // Remove markdown code blocks if present
                let cleanResponse = response.replace(/```json/g, '').replace(/```/g, '').trim();
                
                // Find the first { and last } to extract the JSON object
                const firstBrace = cleanResponse.indexOf('{');
                const lastBrace = cleanResponse.lastIndexOf('}');
                
                if (firstBrace !== -1 && lastBrace !== -1) {
                    cleanResponse = cleanResponse.substring(firstBrace, lastBrace + 1);
                }

                const data = JSON.parse(cleanResponse);
                
                if (data.itinerary && Array.isArray(data.itinerary)) {
                    setItinerary(data.itinerary);
                    setStatus('results');
                } else {
                    throw new Error("Missing itinerary array");
                }
            } catch (e) {
                console.error("Parsing error details:", e, "Raw response:", response);
                setErrorMsg(response.startsWith('AI Error:') ? response : t('ai.planner.errorDesc'));
                setStatus('error');
            }
        } catch (error) {
            console.error("Generation error:", error);
            setErrorMsg(t('ai.planner.connError'));
            setStatus('error');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-24 pb-20">
            <div className="container mx-auto px-4">
                {status === 'form' && (
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-12">
                            <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-4">
                                Personal <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500">AI Concierge</span>
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto">
                                Tell us your preferences and our AI will craft a unique, minute-by-minute itinerary for your perfect Alanya holiday.
                            </p>
                        </div>
                        <TripPlannerForm onComplete={handleGenerate} />
                    </div>
                )}

                {status === 'loading' && (
                    <div className="flex flex-col items-center justify-center py-32 space-y-8 animate-in fade-in zoom-in duration-700">
                        <div className="relative">
                            <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full animate-pulse" />
                            <div className="relative h-24 w-24 rounded-full border-4 border-slate-100 dark:border-slate-800 flex items-center justify-center">
                                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                            </div>
                        </div>
                        <div className="text-center space-y-4">
                            <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-3">
                                <Sparkles className="text-cyan-400 animate-pulse" />
                                Planning your adventure...
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 max-w-sm">
                                Our AI is analyzing the local map, checking distances, and finding the best hidden gems in Alanya for you.
                            </p>
                        </div>
                    </div>
                )}

                {status === 'results' && (
                    <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000">
                        <TripItinerary itinerary={itinerary} />
                        <div className="text-center mt-12">
                            <button 
                                onClick={() => {
                                    setStatus('form');
                                    setItinerary([]);
                                    sessionStorage.removeItem('ai-planner-status');
                                    sessionStorage.removeItem('ai-planner-itinerary');
                                }}
                                className="px-8 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full font-bold hover:bg-slate-200 transition-all"
                            >
                                {t('ai.planner.createNew')}
                            </button>
                        </div>
                    </div>
                )}

                {status === 'error' && (
                    <div className="max-w-md mx-auto text-center py-20 px-8 bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-red-100 dark:border-red-900/20">
                        <div className="h-16 w-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Sparkles size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{t('ai.planner.error')}</h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-6">{errorMsg}</p>
                        
                        {/* Debug Info */}
                        <div className="mb-8 text-left bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Technical Details</p>
                            <pre className="text-[10px] text-slate-500 dark:text-slate-500 overflow-x-auto whitespace-pre-wrap max-h-32">
                                {errorMsg || "No response content captured."}
                            </pre>
                        </div>

                        <button 
                            onClick={() => {
                                setStatus('form');
                                setItinerary([]);
                                sessionStorage.removeItem('ai-planner-status');
                                sessionStorage.removeItem('ai-planner-itinerary');
                            }}
                            className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold"
                        >
                            {t('ai.planner.tryAgain')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};