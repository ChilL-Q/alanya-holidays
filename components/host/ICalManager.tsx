import React, { useState, useEffect, useCallback } from 'react';
import { Copy, RefreshCw, Check, Loader2, Plus, Trash2, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '../../api-services';
import { getAppUrl } from '../../utils/appUrl';

interface ICalManagerProps {
    propertyId: string;
    existingIcalUrl?: string;
    lastSyncedAt?: string;
    onUpdate: () => void;
}

interface ICalFeed {
    id: string;
    name: string;
    url: string;
    last_synced_at?: string;
}

export const ICalManager: React.FC<ICalManagerProps> = ({ propertyId, onUpdate }) => {
    const [feeds, setFeeds] = useState<ICalFeed[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);

    // Form State
    const [newFeedName, setNewFeedName] = useState('');
    const [newFeedUrl, setNewFeedUrl] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    // Export URL Logic
    const [_icalToken, setIcalToken] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const loadFeeds = useCallback(async () => {
        try {
            const data = await db.getICalFeeds(propertyId);
            setFeeds(data);
        } catch (error) {
            console.error('Error loading feeds:', error);
        } finally {
            setIsLoading(false);
        }
    }, [propertyId]);

    const loadPropertyDetails = useCallback(async () => {
        try {
            const property = await db.getProperty(propertyId);
            setIcalToken(property.ical_token || property.id); // Fallback to ID if token missing
        } catch (error) {
            console.error('Error loading property:', error);
        }
    }, [propertyId]);

    useEffect(() => {
        const isMountedRef = { current: true };
        const doLoad = async () => {
            if (isMountedRef.current) {
                await loadFeeds();
            }
            if (isMountedRef.current) {
                await loadPropertyDetails();
            }
        };
        doLoad();
        return () => { isMountedRef.current = false; };
    }, [loadFeeds, loadPropertyDetails]);

    const handleAddFeed = async () => {
        if (!newFeedName || !newFeedUrl) {
            toast.error('Please enter both name and URL');
            return;
        }

        setIsAdding(true);
        try {
            await db.addICalFeed(propertyId, newFeedName, newFeedUrl);
            setNewFeedName('');
            setNewFeedUrl('');
            await loadFeeds();
            toast.success('Calendar added');
            // Auto-trigger sync after adding?
            handleSync();
        } catch (error) {
            console.error('Error adding feed:', error);
            toast.error('Failed to add calendar');
        } finally {
            setIsAdding(false);
        }
    };

    const handleRemoveFeed = async (id: string) => {
        if (!confirm('Are you sure? This will remove imported dates from this calendar.')) return;

        try {
            await db.removeICalFeed(id);
            setFeeds(feeds.filter(f => f.id !== id));
            toast.success('Calendar removed');
            onUpdate(); // Refresh calendar to remove blocked dates
        } catch (error) {
            console.error('Error removing feed:', error);
            toast.error('Failed to remove calendar');
        }
    };

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            await db.syncPropertyCalendar(propertyId);
            toast.success('All calendars synchronized');
            onUpdate();
            loadFeeds(); // Update last_synced_at if we displayed it
        } catch (error) {
            console.error('Sync error:', error);
            toast.error('Failed to sync calendars');
        } finally {
            setIsSyncing(false);
        }
    };

    const exportUrl = getAppUrl(`/calendar/${propertyId}.ics`);

    const handleCopy = () => {
        navigator.clipboard.writeText(exportUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success('Export link copied');
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800/50 p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-2">
                <RefreshCw className="text-teal-600 dark:text-cyan-400 " />
                Sync Calendars (iCal)
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Synchronize availability with Airbnb, Booking.com, and other platforms.
            </p>

            {/* Import Section */}
            <div className="mb-8">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Calendar size={16} />
                    Imported Calendars
                </h3>

                {/* Add New Feed Form */}
                <div className="flex flex-col sm:flex-row gap-2 mb-4">
                    <input
                        type="text"
                        placeholder="Name (e.g. Airbnb)"
                        value={newFeedName}
                        onChange={(e) => setNewFeedName(e.target.value)}
                        className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800/50 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                    <input
                        type="text"
                        placeholder="iCal URL (https://...)"
                        value={newFeedUrl}
                        onChange={(e) => setNewFeedUrl(e.target.value)}
                        className="flex-[2] px-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800/50 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                    <button
                        onClick={handleAddFeed}
                        disabled={isAdding}
                        className="px-4 py-2 bg-teal-600 dark:bg-cyan-600 hover:bg-teal-700 dark:bg-cyan-600 text-white rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
                    >
                        {isAdding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                        <span className="ml-2 hidden sm:inline">Add</span>
                    </button>
                </div>

                {/* Feeds List */}
                <div className="space-y-2 mb-4">
                    {isLoading ? (
                        <div className="text-center py-4 text-slate-400 text-sm">Loading feeds...</div>
                    ) : feeds.length === 0 ? (
                        <div className="text-center py-4 text-slate-400 text-sm border border-dashed border-slate-200 rounded-lg">
                            No calendars added yet.
                        </div>
                    ) : (
                        feeds.map((feed) => (
                            <div key={feed.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-100 dark:border-slate-800/50">
                                <div className="overflow-hidden">
                                    <div className="font-medium text-slate-900 dark:text-white text-sm">{feed.name}</div>
                                    <div className="text-xs text-slate-500 truncate mt-0.5">{feed.url}</div>
                                    {feed.last_synced_at && (
                                        <div className="text-[10px] text-slate-400 mt-1">
                                            Last synced: {new Date(feed.last_synced_at).toLocaleString()}
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => handleRemoveFeed(feed.id)}
                                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                                    title="Remove Calendar"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/* Global Sync Button */}
                {feeds.length > 0 && (
                    <button
                        onClick={handleSync}
                        disabled={isSyncing}
                        className="w-full py-2 bg-slate-900 dark:bg-white text-white dark:text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                        {isSyncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                        Sync All Calendars
                    </button>
                )}
            </div>

            {/* Export Section */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800/50">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                    <Copy size={16} />
                    Export Calendar
                </h3>
                <p className="text-xs text-slate-500 mb-3">
                    Copy this link to Airbnb or Booking.com to block dates when booked here.
                </p>
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 p-2 rounded-lg">
                    <code className="flex-1 text-xs text-slate-600 dark:text-slate-300 truncate font-mono select-all">
                        {exportUrl}
                    </code>
                    <button
                        onClick={handleCopy}
                        className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700/80 rounded-md text-slate-500 transition-colors"
                    >
                        {copied ? <Check size={14} className="text-teal-500 dark:text-cyan-400 " /> : <Copy size={14} />}
                    </button>
                </div>
            </div>
        </div>
    );
};
