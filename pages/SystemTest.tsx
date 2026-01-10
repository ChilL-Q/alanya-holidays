import React, { useEffect, useState } from 'react';
import { db } from '../services/db';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export const SystemTest: React.FC = () => {
    const { user, login } = useAuth();
    const [results, setResults] = useState<TestResult[]>([]);
    const [isRunning, setIsRunning] = useState(false);

    type TestResult = {
        name: string;
        status: 'pending' | 'success' | 'failure';
        message?: string;
        details?: any;
    };

    const addResult = (result: TestResult) => setResults(prev => [...prev, result]);
    const updateResult = (name: string, status: 'success' | 'failure', message?: string, details?: any) => {
        setResults(prev => prev.map(r => r.name === name ? { ...r, status, message, details } : r));
    };

    const runTests = async () => {
        setIsRunning(true);
        setResults([]);

        // --- 1. Public Read Tests ---
        addResult({ name: 'Fetch Properties (Public)', status: 'pending' });
        try {
            const props = await db.getProperties();
            updateResult('Fetch Properties (Public)', 'success', `Fetched ${props?.length} properties`);
        } catch (e: any) {
            updateResult('Fetch Properties (Public)', 'failure', e.message);
        }

        addResult({ name: 'Fetch Services (Public)', status: 'pending' });
        try {
            const services = await db.getServices();
            updateResult('Fetch Services (Public)', 'success', `Fetched ${services?.length} services`);
        } catch (e: any) {
            updateResult('Fetch Services (Public)', 'failure', e.message);
        }

        addResult({ name: 'Fetch Products (Public)', status: 'pending' });
        try {
            const products = await db.getProducts();
            updateResult('Fetch Products (Public)', 'success', `Fetched ${products?.length} products`);
        } catch (e: any) {
            updateResult('Fetch Products (Public)', 'failure', e.message);
        }

        // --- 2. Auth Check ---
        if (!user) {
            addResult({ name: 'Authentication', status: 'failure', message: 'User not logged in. Cannot test protected routes.' });
            setIsRunning(false);
            return;
        }
        addResult({ name: 'Authentication', status: 'success', message: `Logged in as ${user.email} (${user.id})` });

        // --- 3. Protected Write Tests ---

        // Test Booking
        addResult({ name: 'Create Booking', status: 'pending' });
        let bookingId = '';
        try {
            // Use mock ID if no props exist (will fail FK constraint if strict)
            // But usually we have strict FK. So we need a valid item ID.
            const props = await db.getProperties();
            const targetId = props && props.length > 0 ? props[0].id : '00000000-0000-0000-0000-000000000000';

            if (!props || props.length === 0) {
                updateResult('Create Booking', 'failure', 'No properties found to book against');
            } else {
                const booking = await db.createBooking({
                    user_id: user.id,
                    item_id: targetId,
                    type: 'property',
                    status: 'pending',
                    check_in: new Date().toISOString(),
                    check_out: new Date(Date.now() + 86400000).toISOString(),
                    total_price: 100,
                    guests: 2
                });
                bookingId = booking.id;
                updateResult('Create Booking', 'success', `Created Booking ID: ${booking.id}`, booking);
            }
        } catch (e: any) {
            updateResult('Create Booking', 'failure', e.message);
        }

        // Test Get Bookings
        addResult({ name: 'Fetch User Bookings', status: 'pending' });
        try {
            const myBookings = await db.getBookings(user.id);
            const found = myBookings?.find((b: any) => b.id === bookingId);
            if (found) {
                updateResult('Fetch User Bookings', 'success', `Found newly created booking among ${myBookings?.length} total`);
            } else {
                updateResult('Fetch User Bookings', 'failure', 'Created booking not found in list (RLS issue?)');
            }
        } catch (e: any) {
            updateResult('Fetch User Bookings', 'failure', e.message);
        }

        // Test Messages
        addResult({ name: 'Send Message', status: 'pending' });
        try {
            await db.sendMessage({
                name: 'Test Runner',
                email: 'test@example.com',
                subject: 'System Test',
                message: 'This is an automated test message.'
            });
            updateResult('Send Message', 'success', 'Message sent successfully');
        } catch (e: any) {
            updateResult('Send Message', 'failure', e.message);
        }

        // Test Favorites
        addResult({ name: 'Toggle Favorite', status: 'pending' });
        try {
            const props = await db.getProperties();
            if (props && props.length > 0) {
                const targetId = props[0].id;
                // Toggle ON
                await db.toggleFavorite(user.id, targetId);
                let favs = await db.getFavorites(user.id);
                const isFav = favs.includes(targetId);

                // Toggle OFF
                await db.toggleFavorite(user.id, targetId);
                let favsAfter = await db.getFavorites(user.id);
                const isFavAfter = favsAfter.includes(targetId);

                // Revert state if needed? Ideally leave it clean.
                // Assuming initial state was unknown, this simple toggle-toggle might leave it flipped if it started true.
                // But for a test acting on a random item, it proves the function works.

                if (isFav !== isFavAfter) {
                    updateResult('Toggle Favorite', 'success', 'Successfully toggled favorite state');
                } else {
                    updateResult('Toggle Favorite', 'failure', 'State did not change after toggle');
                }
            } else {
                updateResult('Toggle Favorite', 'failure', 'No properties to favorite');
            }
        } catch (e: any) {
            updateResult('Toggle Favorite', 'failure', e.message);
        }

        setIsRunning(false);
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white p-8 pt-24">
            <div className="max-w-3xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">System Diagnostics</h1>
                    <button
                        onClick={runTests}
                        disabled={isRunning}
                        className={`px-6 py-2 rounded-lg font-bold ${isRunning ? 'bg-slate-700' : 'bg-teal-600 hover:bg-teal-700'}`}
                    >
                        {isRunning ? 'Running Tests...' : 'Run All Tests'}
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Pre-flight Check */}
                    {!user && (
                        <div className="bg-amber-900/30 border border-amber-500/50 p-4 rounded-xl flex items-center gap-4 mb-6">
                            <AlertTriangle className="text-amber-500" />
                            <div>
                                <h3 className="font-bold text-amber-500">Authentication Required</h3>
                                <p className="text-sm text-slate-300">Most write tests require an active user session. Please log in first.</p>
                            </div>
                        </div>
                    )}

                    {results.map((res, idx) => (
                        <div key={idx} className={`p-4 rounded-xl border ${res.status === 'success' ? 'bg-green-900/20 border-green-500/30' :
                                res.status === 'failure' ? 'bg-red-900/20 border-red-500/30' :
                                    'bg-slate-800 border-slate-700'
                            }`}>
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    {res.status === 'success' && <CheckCircle className="text-green-500" size={20} />}
                                    {res.status === 'failure' && <XCircle className="text-red-500" size={20} />}
                                    {res.status === 'pending' && <div className="w-5 h-5 border-2 border-slate-500 border-t-white rounded-full animate-spin" />}
                                    <span className="font-mono font-bold">{res.name}</span>
                                </div>
                                <span className={`text-xs uppercase font-bold px-2 py-1 rounded ${res.status === 'success' ? 'bg-green-900 text-green-300' :
                                        res.status === 'failure' ? 'bg-red-900 text-red-300' :
                                            'bg-slate-700 text-slate-400'
                                    }`}>
                                    {res.status}
                                </span>
                            </div>
                            {res.message && (
                                <p className="mt-2 text-sm text-slate-300 ml-8 font-mono">{res.message}</p>
                            )}
                            {res.details && (
                                <pre className="mt-2 ml-8 p-3 bg-black/30 rounded text-xs text-slate-400 overflow-auto max-h-40">
                                    {JSON.stringify(res.details, null, 2)}
                                </pre>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
