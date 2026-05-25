import React, { useState, useEffect } from 'react';
import { TripPlannerForm } from '../components/ai/TripPlannerForm';
import { TripItinerary } from '../components/ai/TripItinerary';
import { PremiumGate } from '../components/ui/PremiumGate';
import { planTrip } from '../api-services/aiService';
import { itinerariesService } from '../api-services/api/itineraries';
import { subscriptionsService } from '../api-services/api/subscriptions';
import { Sparkles, Loader2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { SEOHead } from '../components/seo/SEOHead';
import { TripParams, ItineraryDay } from '../types/models';
import { planTripResponseSchema } from '../utils/itinerarySchema';
import toast from 'react-hot-toast';

export const AiPlanner: React.FC = () => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const [isPremium, setIsPremium] = useState(false);
    const [premiumLoading, setPremiumLoading] = useState(true);

    const [lastPrefs, setLastPrefs] = useState<TripParams | null>(() => {
        const savedPrefs = sessionStorage.getItem('ai-planner-prefs');
        return savedPrefs ? JSON.parse(savedPrefs) : null;
    });
    const [savedId, setSavedId] = useState<string | null>(() => {
        return sessionStorage.getItem('ai-planner-saved-id') || null;
    });
    const [saving, setSaving] = useState(false);

    const [status, setStatus] = useState<'form' | 'loading' | 'results' | 'error'>(() => {
        const savedStatus = sessionStorage.getItem('ai-planner-status');
        return (savedStatus as any) || 'form';
    });
    const [itinerary, setItinerary] = useState<ItineraryDay[]>(() => {
        const savedItinerary = sessionStorage.getItem('ai-planner-itinerary');
        return savedItinerary ? JSON.parse(savedItinerary) : [];
    });
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (!user) {
            setPremiumLoading(false);
            return;
        }
        subscriptionsService.getPremiumStatus()
            .then(s => setIsPremium(s.isPremium))
            .catch(() => setIsPremium(false))
            .finally(() => setPremiumLoading(false));
    }, [user]);

    // A5-M3: re-check premium status when user returns to tab
    // Handles case: subscription cancelled/created while app was in background
    useEffect(() => {
        if (!user) return;
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                subscriptionsService.getPremiumStatus()
                    .then(s => setIsPremium(s.isPremium))
                    .catch(() => setIsPremium(false));
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [user]);

    useEffect(() => {
        sessionStorage.setItem('ai-planner-status', status);
        if (status === 'results') {
            sessionStorage.setItem('ai-planner-itinerary', JSON.stringify(itinerary));
        }
    }, [status, itinerary]);

    useEffect(() => {
        if (lastPrefs) {
            sessionStorage.setItem('ai-planner-prefs', JSON.stringify(lastPrefs));
        } else {
            sessionStorage.removeItem('ai-planner-prefs');
        }
    }, [lastPrefs]);

    useEffect(() => {
        if (savedId) {
            sessionStorage.setItem('ai-planner-saved-id', savedId);
        } else {
            sessionStorage.removeItem('ai-planner-saved-id');
        }
    }, [savedId]);

    const handleGenerate = async (prefs: TripParams) => {
        setStatus('loading');
        setLastPrefs(prefs);
        setSavedId(null);
        try {
            const response = await planTrip(prefs);

            try {
                let cleanResponse = response.replace(/```json/g, '').replace(/```/g, '').trim();
                const firstBrace = cleanResponse.indexOf('{');
                const lastBrace = cleanResponse.lastIndexOf('}');
                if (firstBrace !== -1 && lastBrace !== -1) {
                    cleanResponse = cleanResponse.substring(firstBrace, lastBrace + 1);
                }
                const rawData = JSON.parse(cleanResponse);
                const parsed = planTripResponseSchema.safeParse(rawData);
                if (parsed.success) {
                    setItinerary(parsed.data.itinerary);
                    setStatus('results');
                } else {
                    console.error('Validation error:', parsed.error.flatten());
                    throw new Error('Invalid itinerary structure');
                }
            } catch (e) {
                console.error('Parsing error:', e, 'Raw response:', response);
                setErrorMsg(response.startsWith('AI Error:') ? response : t('ai.planner.errorDesc'));
                setStatus('error');
            }
        } catch (error) {
            console.error('Generation error:', error);
            setErrorMsg(t('ai.planner.connError'));
            setStatus('error');
        }
    };

    const handleReset = () => {
        setStatus('form');
        setItinerary([]);
        setLastPrefs(null);
        setSavedId(null);
        sessionStorage.removeItem('ai-planner-status');
        sessionStorage.removeItem('ai-planner-itinerary');
        sessionStorage.removeItem('ai-planner-prefs');
        sessionStorage.removeItem('ai-planner-saved-id');
    };

    const handleSave = async () => {
        if (!lastPrefs) return;
        setSaving(true);
        try {
            const title = `${lastPrefs.duration}-Day Trip for ${lastPrefs.companion}`;
            const saved = await itinerariesService.saveItinerary(title, lastPrefs, itinerary);
            setSavedId(saved.id);
            toast.success('Itinerary saved!');
        } catch (err) {
            console.error('Save failed:', err);
            toast.error('Failed to save itinerary');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-24 pb-20">
            <SEOHead
                title="AI Trip Planner | Alanya Holidays"
                description="Plan your perfect trip to Alanya with our AI-powered trip planner. Get personalized itineraries, recommendations, and more."
            />
            <div className="container mx-auto px-4">
                <PremiumGate isPremium={isPremium} isLoading={premiumLoading}>
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
                            <TripItinerary
                                itinerary={itinerary}
                                savedId={savedId}
                                onSave={user ? handleSave : undefined}
                                saving={saving}
                            />
                            <div className="text-center mt-12">
                                <button
                                    onClick={handleReset}
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
                            <p className="text-slate-500 dark:text-slate-400 mb-8">{errorMsg}</p>
                            <button
                                onClick={handleReset}
                                className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold"
                            >
                                {t('ai.planner.tryAgain')}
                            </button>
                        </div>
                    )}
                </PremiumGate>
            </div>
        </div>
    );
};
