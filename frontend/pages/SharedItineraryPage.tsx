import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { itinerariesService } from '../api-services/api/itineraries';
import { SavedItinerary } from '../types/models';
import { TripItinerary } from '../components/ai/TripItinerary';
import { SEOHead } from '../components/seo/SEOHead';
import { Loader2, Compass } from 'lucide-react';

export const SharedItineraryPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [itinerary, setItinerary] = useState<SavedItinerary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!id) {
            setError('Invalid itinerary link');
            setLoading(false);
            return;
        }
        itinerariesService.getItinerary(id)
            .then((data) => {
                if (data) {
                    setItinerary(data);
                } else {
                    setError('Itinerary not found');
                }
            })
            .catch((err) => {
                console.error('Failed to load itinerary:', err);
                setError('Failed to load itinerary');
            })
            .finally(() => setLoading(false));
    }, [id]);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-24 pb-20">
            <SEOHead
                title={itinerary ? `${itinerary.title} | Alanya Holidays` : 'Shared Itinerary | Alanya Holidays'}
                description={itinerary ? `Check out this ${itinerary.itinerary.length}-day Alanya trip plan.` : 'View a shared trip itinerary'}
            />
            <div className="container mx-auto px-4">
                {loading && (
                    <div className="flex items-center justify-center py-32">
                        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                    </div>
                )}

                {error && !loading && (
                    <div className="max-w-md mx-auto text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
                        <Compass className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-6" />
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{error}</h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-6">The itinerary you are looking for does not exist or has been removed.</p>
                        <Link
                            to="/ai-planner"
                            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
                        >
                            Plan Your Own Trip
                        </Link>
                    </div>
                )}

                {itinerary && !loading && (
                    <div className="animate-in fade-in duration-700">
                        <TripItinerary itinerary={itinerary.itinerary} />
                    </div>
                )}
            </div>
        </div>
    );
};
