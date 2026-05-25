import React, { useMemo } from 'react';
import { Clock, MapPin, ExternalLink, Star, ChevronRight, Share2, Download, BookmarkPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../../context/LanguageContext';
import type { ItineraryDay } from '../../types/models';
import { ItineraryMap } from './ItineraryMap';
import '../../print-itinerary.css';

interface Props {
    itinerary: ItineraryDay[];
    savedId?: string | null;
    onSave?: () => void;
    saving?: boolean;
}

export const TripItinerary: React.FC<Props> = ({ itinerary, savedId, onSave, saving }) => {
    const { t } = useLanguage();
    
    const mapItems = useMemo(
        () =>
            itinerary.flatMap((day, di) =>
                day.items
                    .filter((item) => item.lat != null && item.lng != null)
                    .map((item) => ({ ...item, dayIndex: di }))
            ),
        [itinerary]
    );

    const handleDownloadPDF = () => {
        window.print();
    };

    const handleShare = async () => {
        const shareUrl = savedId
            ? `${window.location.origin}/itinerary/${savedId}`
            : window.location.href;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: t('ai.itinerary.shareTitle'),
                    text: t('ai.itinerary.shareText'),
                    url: shareUrl,
                });
            } catch (_error) {
                // User cancelled share
            }
        } else {
            navigator.clipboard.writeText(shareUrl);
            toast.success('Link copied to clipboard!');
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-12 px-4 print:py-0 print:px-0">
            {/* Print Header */}
            <div className="print-header">
                <div className="flex items-center gap-3">
                    <img src="/logo.png" alt="Alanya Holidays" className="h-12 w-auto" />
                    <div>
                        <h4 className="font-black text-xl text-slate-900">ALANYA HOLIDAYS</h4>
                        <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Premium Rentals & Experiences</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-sm font-bold text-slate-900 uppercase tracking-tighter">Personalized Itinerary</p>
                    <p className="text-[10px] text-slate-400 font-medium">Generated on {new Date().toLocaleDateString()}</p>
                </div>
            </div>

            <div className="text-center mb-16 print:mb-8">
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4">
                    Your Personalized <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500">Trip Plan</span>
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-lg">
                    {t('ai.itinerary.enjoy')}
                </p>
            </div>

            <div className="space-y-12">
                {itinerary.map((day) => (
                    <div key={day.day} className="relative group">
                        {/* Day Header */}
                        <div className="flex items-center gap-4 mb-8">
                            <div className="day-marker h-14 w-14 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex flex-col items-center justify-center shrink-0 shadow-xl group-hover:scale-110 transition-transform duration-500">
                                <span className="text-xs font-bold uppercase tracking-widest opacity-70">Day</span>
                                <span className="text-2xl font-black leading-none">{day.day}</span>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors">
                                    {day.title}
                                </h2>
                                <p className="text-sm text-slate-400 font-medium tracking-wide">ALANYA EXPLORATION</p>
                            </div>
                        </div>

                        {/* Day Items */}
                        <div className="ml-7 md:ml-10 border-l-2 border-slate-100 dark:border-slate-800 pl-8 md:pl-12 space-y-10 pb-4">
                            {day.items.map((item, i) => (
                                <div key={i} className="relative">
                                    {/* Timeline Dot */}
                                    <div className="absolute -left-[41px] md:-left-[57px] top-1.5 h-4 w-4 rounded-full bg-slate-200 dark:bg-slate-700 border-4 border-white dark:border-slate-950 group-hover:bg-blue-500 transition-colors" />
                                    
                                    <div className="itinerary-card bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 group/card">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="flex items-center gap-2 text-blue-600 dark:text-cyan-400 font-bold text-xs uppercase tracking-widest mb-2 md:mb-0">
                                                <Clock size={14} />
                                                {item.time}
                                            </div>
                                            {item.location && (
                                                <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                                                    <MapPin size={14} />
                                                    {item.location}
                                                </div>
                                            )}
                                        </div>
                                        
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-3 mb-2 flex items-center gap-2">
                                            {item.title}
                                            {item.link && (
                                                <a 
                                                    href={item.link} 
                                                    className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-blue-600 transition-colors"
                                                    title="View Service"
                                                >
                                                    <ExternalLink size={12} />
                                                </a>
                                            )}
                                        </h3>
                                        
                                        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                                            {item.description}
                                        </p>

                                        {item.link && (
                                            <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800/50">
                                                <a 
                                                    href={item.link}
                                                    className="text-xs font-bold text-teal-600 dark:text-cyan-400 hover:underline flex items-center gap-1.5 uppercase tracking-wider"
                                                >
                                                    Book This Experience <ChevronRight size={12} />
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {/* Closing Card */}
                <div className="bg-slate-900 dark:bg-slate-800 p-8 rounded-3xl text-center text-white shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:rotate-12 transition-transform duration-1000">
                        <Star size={120} className="fill-current" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3 relative z-10">{t('ai.itinerary.enjoy')}</h3>
                    <p className="text-slate-400 mb-6 relative z-10">{t('ai.itinerary.saved')}</p>
                    <div className="flex justify-center gap-4 relative z-10 no-print">
                        <button
                            onClick={handleDownloadPDF}
                            className="px-6 py-3 bg-white text-slate-900 rounded-xl font-bold hover:bg-slate-50 transition-colors flex items-center gap-2"
                        >
                            <Download size={18} />
                            {t('ai.itinerary.downloadPDF')}
                        </button>
                        <button
                            onClick={handleShare}
                            className="px-6 py-3 bg-white/10 border border-white/20 rounded-xl font-bold hover:bg-white/20 transition-colors flex items-center gap-2"
                        >
                            <Share2 size={18} />
                            {t('ai.itinerary.share')}
                        </button>
                        {onSave && (
                            <button
                                onClick={onSave}
                                disabled={saving || !!savedId}
                                className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors ${
                                    savedId
                                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default'
                                        : 'bg-white/10 border border-white/20 hover:bg-white/20 text-white'
                                } ${(saving || savedId) ? 'opacity-70' : ''}`}
                            >
                                <BookmarkPlus size={18} />
                                {savedId ? 'Saved' : saving ? 'Saving…' : 'Save'}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Map */}
            {mapItems.length > 0 && (
                <div className="mt-10 print:hidden">
                    <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">Trip Map</h2>
                    <ItineraryMap items={mapItems} />
                </div>
            )}

            {/* Print Footer */}
            <div className="print-footer">
                <p className="font-bold">Alanya Holidays — Your Local Concierge</p>
                <p>www.alanyaholidays.com | +90 (555) 123 45 67</p>
                <p className="mt-2 opacity-50 italic">Making your stay in Alanya unforgettable since 2024</p>
            </div>
        </div>
    );
};
