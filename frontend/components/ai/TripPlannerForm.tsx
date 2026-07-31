import React, { useState } from 'react';
import { Calendar, Users, Heart, Sparkles, ChevronRight, ChevronLeft } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface PlannerPrefs {
    duration: number;
    companion: string;
    interests: string[];
    pace: 'relaxed' | 'moderate' | 'intense';
    budget: 'economy' | 'standard' | 'luxury';
}

interface Props {
    onComplete: (prefs: PlannerPrefs) => void;
}

export const TripPlannerForm: React.FC<Props> = ({ onComplete }) => {
    const { t } = useLanguage();
    const [step, setStep] = useState(1);
    const [prefs, setPrefs] = useState<PlannerPrefs>({
        duration: 3,
        companion: 'couple',
        interests: [],
        pace: 'moderate',
        budget: 'standard'
    });

    const companionshipOptions = [
        { id: 'solo', label: t('ai.planner.comp.solo'), icon: '👤' },
        { id: 'couple', label: t('ai.planner.comp.couple'), icon: '💑' },
        { id: 'family', label: t('ai.planner.comp.family'), icon: '👨‍👩-👧‍👦' },
        { id: 'friends', label: t('ai.planner.comp.friends'), icon: '👯‍♂️' }
    ];

    const interestOptions = [
        { id: 'beach', label: t('ai.planner.interest.beach'), icon: '🏖️' },
        { id: 'culture', label: t('ai.planner.interest.culture'), icon: '🏛️' },
        { id: 'adventure', label: t('ai.planner.interest.adventure'), icon: '🌋' },
        { id: 'food', label: t('ai.planner.interest.food'), icon: '🥘' },
        { id: 'wellness', label: t('ai.planner.interest.wellness'), icon: '🧖‍♀️' },
        { id: 'nightlife', label: t('ai.planner.interest.nightlife'), icon: '💃' }
    ];
    
    const paceOptions: Array<{ id: PlannerPrefs['pace']; label: string; desc: string; icon: string }> = [
        { id: 'relaxed', label: t('ai.planner.pace.relaxed'), desc: t('ai.planner.pace.relaxed.desc'), icon: '🧘' },
        { id: 'moderate', label: t('ai.planner.pace.moderate'), desc: t('ai.planner.pace.moderate.desc'), icon: '🚶' },
        { id: 'intense', label: t('ai.planner.pace.intense'), desc: t('ai.planner.pace.intense.desc'), icon: '⚡' }
    ];

    const budgetOptions: Array<{ id: PlannerPrefs['budget']; label: string; desc: string; icon: string }> = [
        { id: 'economy', label: t('ai.planner.budget.economy'), desc: t('ai.planner.budget.economy.desc'), icon: '🪙' },
        { id: 'standard', label: t('ai.planner.budget.standard'), desc: t('ai.planner.budget.standard.desc'), icon: '💳' },
        { id: 'luxury', label: t('ai.planner.budget.luxury'), desc: t('ai.planner.budget.luxury.desc'), icon: '💎' }
    ];

    const toggleInterest = (id: string) => {
        setPrefs(prev => ({
            ...prev,
            interests: prev.interests.includes(id) 
                ? prev.interests.filter(i => i !== id) 
                : [...prev.interests, id]
        }));
    };

    const nextStep = () => setStep(s => s + 1);
    const prevStep = () => setStep(s => s - 1);

    return (
        <div className="max-w-xl mx-auto bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800/50">
            {/* Progress Bar */}
            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800">
                <div 
                    className="h-full bg-gradient-to-r from-blue-600 to-teal-500 transition-all duration-500" 
                    style={{ width: `${(step / 5) * 100}%` }}
                />
            </div>

            <div className="p-8">
                {step === 1 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <Calendar className="text-blue-600 dark:text-blue-400 w-5 h-5" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('ai.planner.step1.title')}</h2>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400">{t('ai.planner.step1.desc')}</p>
                        
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl">
                            <input 
                                name="duration"
                                type="range" 
                                min="1" 
                                max="14" 
                                value={prefs.duration}
                                onChange={(e) => setPrefs({...prefs, duration: parseInt(e.target.value)})}
                                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                            <div className="flex justify-between items-center mt-4">
                                <span className="text-sm font-medium text-slate-400">1 {t('ai.planner.day')}</span>
                                <span className="text-3xl font-black text-blue-600 dark:text-cyan-400">{prefs.duration} {prefs.duration > 1 ? t('ai.planner.days') : t('ai.planner.day')}</span>
                                <span className="text-sm font-medium text-slate-400">14 {t('ai.planner.days')}</span>
                            </div>
                        </div>

                        <button 
                            onClick={nextStep}
                            className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all mt-8"
                        >
                            {t('ai.planner.next')} <ChevronRight size={20} />
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
                                <Users className="text-teal-600 dark:text-teal-400 w-5 h-5" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('ai.planner.step2.title')}</h2>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            {companionshipOptions.map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => setPrefs({...prefs, companion: opt.id})}
                                    className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${
                                        prefs.companion === opt.id 
                                        ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 scale-[1.02]' 
                                        : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                                    }`}
                                >
                                    <span className="text-3xl">{opt.icon}</span>
                                    <span className="font-semibold text-sm">{opt.label}</span>
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-4 mt-8">
                            <button onClick={prevStep} className="flex-1 py-4 border-2 border-slate-100 dark:border-slate-800 rounded-xl font-bold text-slate-400 flex items-center justify-center gap-2">
                                <ChevronLeft size={20} /> {t('ai.planner.back')}
                            </button>
                            <button onClick={nextStep} className="flex-[2] py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold flex items-center justify-center gap-2">
                                {t('ai.planner.next')} <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                <Heart className="text-purple-600 dark:text-purple-400 w-5 h-5" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('ai.planner.step3.title')}</h2>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                            {interestOptions.map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => toggleInterest(opt.id)}
                                    className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                                        prefs.interests.includes(opt.id) 
                                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400' 
                                        : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                                    }`}
                                >
                                    <span className="text-xl">{opt.icon}</span>
                                    <span className="font-semibold text-xs text-left">{opt.label}</span>
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-4 mt-8">
                            <button onClick={prevStep} className="flex-1 py-4 border-2 border-slate-100 dark:border-slate-800 rounded-xl font-bold text-slate-400 flex items-center justify-center gap-2">
                                <ChevronLeft size={20} /> {t('ai.planner.back')}
                            </button>
                            <button onClick={nextStep} className="flex-[2] py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold flex items-center justify-center gap-2">
                                {t('ai.planner.next')} <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                                <Sparkles className="text-orange-600 dark:text-orange-400 w-5 h-5" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('ai.planner.step4.title')}</h2>
                        </div>
                        
                        <div className="space-y-3">
                            {paceOptions.map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => setPrefs({...prefs, pace: opt.id})}
                                    className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 text-left ${
                                        prefs.pace === opt.id 
                                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' 
                                        : 'border-slate-100 dark:border-slate-800 hover:border-slate-200'
                                    }`}
                                >
                                    <span className="text-3xl">{opt.icon}</span>
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-white">{opt.label}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{opt.desc}</p>
                                    </div>
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-4 mt-8">
                            <button onClick={prevStep} className="flex-1 py-4 border-2 border-slate-100 dark:border-slate-800 rounded-xl font-bold text-slate-400 flex items-center justify-center gap-2">
                                <ChevronLeft size={20} /> {t('ai.planner.back')}
                            </button>
                            <button onClick={nextStep} className="flex-[2] py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold flex items-center justify-center gap-2">
                                {t('ai.planner.next')} <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                )}

                {step === 5 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                                <Heart className="text-emerald-600 dark:text-emerald-400 w-5 h-5" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('ai.planner.step5.title')}</h2>
                        </div>
                        
                        <div className="space-y-3">
                            {budgetOptions.map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => setPrefs({...prefs, budget: opt.id})}
                                    className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 text-left ${
                                        prefs.budget === opt.id 
                                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' 
                                        : 'border-slate-100 dark:border-slate-800 hover:border-slate-200'
                                    }`}
                                >
                                    <span className="text-3xl">{opt.icon}</span>
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-white">{opt.label}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{opt.desc}</p>
                                    </div>
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-4 mt-8">
                            <button onClick={prevStep} className="flex-1 py-4 border-2 border-slate-100 dark:border-slate-800 rounded-xl font-bold text-slate-400 flex items-center justify-center gap-2">
                                <ChevronLeft size={20} /> {t('ai.planner.back')}
                            </button>
                            <button 
                                onClick={() => onComplete(prefs)}
                                className="flex-[2] py-4 bg-gradient-to-r from-blue-600 to-teal-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 hover:scale-[1.02] transition-all"
                            >
                                <Sparkles size={20} /> {t('ai.planner.generate')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
