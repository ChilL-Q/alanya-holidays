import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { itinerariesService } from '../api-services/api/itineraries';
import { SavedItinerary } from '../types/models';
import { SEOHead } from '../components/seo/SEOHead';
import { Loader2, MapPin, Calendar, Trash2, Eye, Compass } from 'lucide-react';

export const MyItinerariesPage: React.FC = () => {
    const navigate = useNavigate();
    const [itineraries, setItineraries] = useState<SavedItinerary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        itinerariesService.getMyItineraries()
            .then(setItineraries)
            .catch((err) => {
                console.error('Failed to load itineraries:', err);
                setError('Failed to load your itineraries');
            })
            .finally(() => setLoading(false));
    }, []);

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this itinerary?')) return;
        try {
            await itinerariesService.deleteItinerary(id);
            setItineraries((prev) => prev.filter((it) => it.id !== id));
        } catch (err) {
            console.error('Failed to delete itinerary:', err);
            alert('Failed to delete itinerary');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-24 pb-20">
            <SEOHead title="My Itineraries | Alanya Holidays" description="Your saved trip itineraries" />
            <div className="container mx-auto px-4 max-w-4xl">
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-8">My Itineraries</h1>

                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    </div>
                )}

                {error && !loading && (
                    <div className="text-center py-12 text-red-600">{error}</div>
                )}

                {!loading && itineraries.length === 0 && (
                    <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
                        <Compass className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-6" />
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No saved itineraries yet</h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-6">Plan your first trip with our AI concierge.</p>
                        <button
                            onClick={() => navigate('/ai-planner')}
                            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
                        >
                            Plan a Trip
                        </button>
                    </div>
                )}

                {!loading && itineraries.length > 0 && (
                    <div className="space-y-4">
                        {itineraries.map((it) => (
                            <div
                                key={it.id}
                                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4"
                            >
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{it.title}</h3>
                                    <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                                        <span className="flex items-center gap-1">
                                            <Calendar size={14} />
                                            {new Date(it.created_at).toLocaleDateString()}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <MapPin size={14} />
                                            {it.itinerary.length} day{it.itinerary.length !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => navigate(`/itinerary/${it.id}`)}
                                        className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
                                    >
                                        <Eye size={16} />
                                        View
                                    </button>
                                    <button
                                        onClick={() => handleDelete(it.id)}
                                        className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl font-semibold hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors flex items-center gap-2"
                                    >
                                        <Trash2 size={16} />
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
