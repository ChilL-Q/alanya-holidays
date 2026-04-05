import React, { useState, useEffect, useCallback } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { db } from '../../api-services';
import { PropertyAvailability } from '../../types/models';
import { Calendar as CalendarIcon, RefreshCw, X } from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';
import toast from 'react-hot-toast';

interface AvailabilityCalendarProps {
    propertyId: string;
}

export const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({ propertyId }) => {
    const [availability, setAvailability] = useState<PropertyAvailability[]>([]);
    const [feeds, setFeeds] = useState<{ id: string, name: string }[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDates, setSelectedDates] = useState<string[]>([]);
    const [isPanelOpen, setIsPanelOpen] = useState(false);

    // Edit Form Logic
    const [status, setStatus] = useState<'available' | 'blocked'>('available');
    const [price, setPrice] = useState<string>('');
    const { formatPrice, currency } = useCurrency(); // Added currency destructuring

    const loadData = useCallback(async () => {
        try {
            const start = new Date();
            start.setMonth(start.getMonth() - 1); // Get slightly past
            const end = new Date();
            end.setFullYear(end.getFullYear() + 1); // 1 year ahead

            const [avData, feedsData] = await Promise.all([
                db.getPropertyAvailability(
                    propertyId,
                    start.toISOString().split('T')[0],
                    end.toISOString().split('T')[0]
                ),
                db.getICalFeeds(propertyId)
            ]);

            setAvailability(avData);
            setFeeds(feedsData);
        } catch (error) {
            console.error('Error fetching calendar data:', error);
            toast.error('Failed to load calendar data');
        } finally {
            setIsLoading(false);
        }
    }, [propertyId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Helper: Get local YYYY-MM-DD consistently avoiding UTC shifts
    const toLocalISOString = (date: Date) => {
        // 'sv' locale uses ISO 8601 format (YYYY-MM-DD) natively
        return date.toLocaleDateString('sv');
    };

    const handleDateChange = (date: Date | null) => {
        if (!date) return;

        const dateStr = toLocalISOString(date);

        setSelectedDates(prev => {
            const newDates = prev.includes(dateStr)
                ? prev.filter(d => d !== dateStr) // Deselect
                : [...prev, dateStr]; // Select

            // Auto-open panel if we have selection
            setIsPanelOpen(newDates.length > 0);
            return newDates;
        });
    };

    const handleSave = async () => {
        if (selectedDates.length === 0) return;

        try {
            await db.updatePropertyAvailability(
                propertyId,
                selectedDates,
                status === 'blocked' ? 'blocked' : 'available',
                price ? parseFloat(price) : undefined
            );
            toast.success(`Updated ${selectedDates.length} dates`);
            setIsPanelOpen(false);
            setSelectedDates([]); // Clear selection after save
            loadData(); // Refresh
        } catch (error) {
            console.error('Error saving availability:', error);
            toast.error('Failed to save changes');
        }
    };

    // Note: Removed handleClearSelection as requested, using handleClosePanel instead if needed.

    const handleClosePanel = () => {
        setIsPanelOpen(false);
        setSelectedDates([]);
    };

    // Render Helpers
    const getDayClassName = (date: Date) => {
        const dateStr = toLocalISOString(date);
        const isSelected = selectedDates.includes(dateStr);

        if (isSelected) {
            // Return a safe placeholder, we handle main styling in renderDayContents 
            // to allow inline style overrides
            return 'selected-day-override';
        }

        const entry = availability.find(a => a.date === dateStr);
        if (!entry) return undefined;

        if (entry.status === 'blocked') {
            return entry.source === 'ical' ? 'bg-purple-100 text-purple-800' : 'bg-slate-200 text-slate-500 line-through';
        }
        if (entry.status === 'booked') return 'bg-rose-100 text-rose-600 font-bold';
        if (entry.price) return 'bg-teal-50 text-teal-700 dark:text-cyan-400 font-medium'; // Has custom price

        return undefined;
    };

    const renderDayContents = (day: number, date: Date) => {
        const dateStr = toLocalISOString(date);
        const entry = availability.find(a => a.date === dateStr);
        const isSelected = selectedDates.includes(dateStr);

        let classes = "relative w-full h-full flex flex-col items-center justify-center text-sm rounded-xl transition-all";

        if (isSelected) {
            classes += " rdp-day-selected";
        } else if (entry) {
            if (entry.status === 'blocked') {
                classes += entry.source === 'ical' ? " rdp-day-external" : " rdp-day-blocked";
            } else if (entry.status === 'booked') {
                classes += " rdp-day-booked";
            } else if (entry.price) {
                classes += " rdp-day-custom";
            }
        }

        return (
            <div className={classes}>
                <span>{day}</span>
                {entry?.price && !isSelected && (
                    <span className="text-[10px] leading-none mt-0.5 font-bold opacity-80">
                        {formatPrice(entry.price).replace(/[^0-9.,]/g, '')}
                    </span>
                )}
                {entry?.source === 'ical' && !isSelected && (
                    <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-purple-500 rounded-full" />
                )}
            </div>
        );
    };

    // Helper to get feed name
    const getFeedName = (feedId?: string) => {
        if (!feedId) return null;
        const feed = feeds.find(f => f.id === feedId);
        return feed ? feed.name : null;
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800/50 p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <CalendarIcon className="text-teal-600 dark:text-cyan-400 " />
                        Availability & Pricing
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Manage blocked dates and custom prices.
                    </p>
                </div>
                <button
                    onClick={loadData}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800/90 rounded-full transition-colors"
                    title="Refresh Calendar"
                >
                    <RefreshCw size={20} className={isLoading ? 'animate-spin text-slate-400' : 'text-slate-600 dark:text-slate-300'} />
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Calendar */}
                <div className="flex-1">
                    {/* Styles moved to index.css for better dark mode support */}
                    <DatePicker
                        onChange={handleDateChange}
                        // We control selection visually via dayClassName/renderDayContents
                        selected={null}
                        inline
                        minDate={new Date()}
                        showDisabledMonthNavigation
                        monthsShown={window.innerWidth > 1024 ? 2 : 1}
                        renderDayContents={renderDayContents}
                        dayClassName={getDayClassName}
                        shouldCloseOnSelect={false}
                    />

                    {/* Legend */}
                    <div className="flex flex-wrap gap-4 mt-6 text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                            <span>Blocked (Manual)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-purple-100 border border-purple-200"></div>
                            <span>External (Airbnb, Booking...)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-rose-100 border border-rose-200"></div>
                            <span>Reserved</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-teal-50 border border-teal-200"></div>
                            <span>Custom Price</span>
                        </div>
                    </div>
                </div>

                {/* Edit Panel */}
                <div className={`lg:w-80 bg-slate-50 dark:bg-slate-800/80 rounded-xl p-6 h-fit transition-all ${isPanelOpen ? 'opacity-100 translate-x-0' : 'opacity-50 pointer-events-none'}`}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-slate-900 dark:text-white">
                            {selectedDates.length === 0 ? 'Select dates' :
                                selectedDates.length === 1 ? new Date(selectedDates[0]).toLocaleDateString() :
                                    `${selectedDates.length} nights selected`}
                        </h3>
                        <button
                            onClick={handleClosePanel}
                            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700/80 rounded-full text-slate-500 transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Summary Logic */}
                    {(() => {
                        if (selectedDates.length === 0) return <p className="text-sm text-slate-500">Select dates on the calendar to edit availability or pricing.</p>;

                        // Calculate Stats
                        let blockedCount = 0;
                        let availableCount = 0;
                        const blockSources = new Set<string>();

                        selectedDates.forEach(dateStr => {
                            const entry = availability.find(a => a.date === dateStr);
                            if (entry && entry.status === 'blocked') {
                                blockedCount++;
                                if (entry.source === 'ical') {
                                    // Try to find feed name
                                    let feedName = getFeedName(entry.feed_id) || entry.feed?.name;
                                    // Fallback for single feed case
                                    if (!feedName && feeds.length === 1) feedName = feeds[0].name;

                                    blockSources.add(feedName || 'External Calendar');
                                } else {
                                    blockSources.add('You'); // Manual block
                                }
                            } else {
                                availableCount++;
                            }
                        });


                        const isMixed = availableCount > 0 && blockedCount > 0;
                        const uniqueSources = Array.from(blockSources);

                        // 1. Mixed Availability (Open & Blocked)
                        if (isMixed) {
                            return (
                                <div className="mb-6 p-4 bg-slate-200 dark:bg-slate-800/50 rounded-xl">
                                    <h4 className="font-bold text-slate-900 dark:text-white mb-2">Mixed availability</h4>
                                    <ul className="space-y-1 text-sm">
                                        {availableCount > 0 && <li className="text-teal-600 dark:text-cyan-400 flex items-center gap-2"><div className="w-1.5 h-1.5 bg-teal-500 dark:bg-cyan-600 rounded-full" /> {availableCount} nights open</li>}
                                        {blockedCount > 0 && <li className="text-rose-600 flex items-center gap-2"><div className="w-1.5 h-1.5 bg-rose-500 rounded-full" /> {blockedCount} nights blocked</li>}
                                    </ul>
                                </div>
                            );
                        }

                        // 2. All Blocked (Check Sources)
                        if (blockedCount > 0 && availableCount === 0) {
                            // 2a. Single Source (e.g. All Airbnb)
                            if (uniqueSources.length === 1) {
                                const sourceName = uniqueSources[0];
                                const isExternal = sourceName !== 'You';
                                return (
                                    <div className={`mb-6 p-4 rounded-xl border ${isExternal ? 'bg-purple-50 border-purple-100 dark:bg-slate-800/50 dark:border-purple-800' : 'bg-slate-100 border-slate-200'}`}>
                                        <h4 className={`font-bold mb-1 ${isExternal ? 'text-purple-800 dark:text-slate-200' : 'text-slate-800'}`}>
                                            Blocked by {sourceName}
                                        </h4>
                                        <p className="text-sm opacity-80 mb-2">{blockedCount} nights blocked</p>
                                        {isExternal && (
                                            <p className="text-xs opacity-70">
                                                To unblock, remove the event from your external calendar and sync again.
                                            </p>
                                        )}
                                        {!isExternal && (
                                            <button
                                                onClick={() => { setStatus('available'); handleSave(); }}
                                                className="text-xs font-medium underline mt-2"
                                            >
                                                Unblock these dates
                                            </button>
                                        )}
                                    </div>
                                );
                            }

                            // 2b. Multiple Sources (Mixed block types)
                            return (
                                <div className="mb-6 p-4 bg-slate-800 text-white rounded-xl">
                                    <h4 className="font-bold mb-2">Unavailable</h4>
                                    <p className="text-sm opacity-80 mb-3">{blockedCount} nights blocked</p>
                                    <ul className="space-y-1 text-xs opacity-70">
                                        {uniqueSources.map(src => (
                                            <li key={src}>• By {src}</li>
                                        ))}
                                    </ul>
                                </div>
                            );
                        }

                        // 3. All Available (Default Edit View)
                        // Simplified view without redundant "N nights selected"
                        return (
                            <div className="mb-6">
                                <p className="text-sm text-slate-500">Set status or price for these dates.</p>
                            </div>
                        );

                    })()}

                    {/* Edit Controls (Only show if we have available dates or manual blocks to edit) */}
                    {selectedDates.length > 0 && (() => {
                        // Build a Set of externally-sourced dates (ical) for O(1) lookup
                        const externalDates = new Set(
                            availability.filter(a => a.source === 'ical').map(a => a.date)
                        );
                        function hasExternalBlock(dates: string[]) {
                            return dates.some(d => externalDates.has(d));
                        }
                        return (
                        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800/50">

                            {/* Inputs (Status/Price) - Only if NO external blocks */}
                            {!hasExternalBlock(selectedDates) && (
                                <>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Status</label>
                                        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
                                                <button
                                                    onClick={() => setStatus('available')}
                                                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${status === 'available' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                                                >
                                                    Available
                                                </button>
                                                <button
                                                    onClick={() => setStatus('blocked')}
                                                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${status === 'blocked' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                                                >
                                                    Blocked
                                                </button>
                                            </div>
                                        </div>

                                        {status === 'available' && (
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                                                    Nightly Price
                                                </label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <span className="text-slate-500 font-bold text-sm">
                                                            {currency === 'EUR' ? '€' : currency === 'USD' ? '$' : '₺'}
                                                        </span>
                                                    </div>
                                                    <input
                                                        type="number"
                                                        value={price}
                                                        onChange={(e) => setPrice(e.target.value)}
                                                        onWheel={(e) => e.currentTarget.blur()}
                                                        placeholder="Base Price"
                                                        className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-900 border-none rounded-lg text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                </>
                            )}

                            {/* Actions - MOVED TO BOTTOM */}
                            {hasExternalBlock(selectedDates) ? null : (
                                <button
                                    onClick={handleSave}
                                    className="w-full py-2 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-white rounded-lg transition-colors"
                                >
                                    Save Changes
                                </button>
                            )}

                        </div>
                        );
                    })()}
                </div>
            </div>
        </div>
    );
};
