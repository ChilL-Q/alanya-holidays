
import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

export const DebugAuth: React.FC = () => {
    const { user } = useAuth();
    const [profile, setProfile] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [sessionData, setSessionData] = useState<any>(null);

    useEffect(() => {
        const check = async () => {
            // 1. Get Session
            const { data: { session } } = await supabase.auth.getSession();
            setSessionData(session);

            if (!session?.user) {
                setError("No active session found.");
                setLoading(false);
                return;
            }

            // 2. Try Fetch Profile
            console.log("Fetching profile for:", session.user.id);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

            if (error) {
                console.error("Supabase Error:", error);
                setError(JSON.stringify(error, null, 2));
            } else {
                setProfile(data);
            }
            setLoading(false);
        };
        check();
    }, []);

    return (
        <div className="p-10 mt-20 bg-white dark:bg-slate-900 border border-red-500 container mx-auto rounded-xl">
            <h1 className="text-2xl font-bold mb-4 text-red-600">Authentication Debugger</h1>

            <div className="grid grid-cols-2 gap-8">
                <div>
                    <h2 className="font-bold underline mb-2">Auth Context State</h2>
                    <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
                        {JSON.stringify(user, null, 2)}
                    </pre>
                </div>

                <div>
                    <h2 className="font-bold underline mb-2">Supabase DB Test</h2>
                    {loading ? (
                        <p>Loading...</p>
                    ) : (
                        <>
                            {error ? (
                                <div className="bg-red-50 text-red-700 p-4 rounded border border-red-200">
                                    <h3 className="font-bold">Error Fetching Profile:</h3>
                                    <pre className="text-xs mt-2 whitespace-pre-wrap">{error}</pre>
                                </div>
                            ) : (
                                <div className="bg-green-50 text-green-700 p-4 rounded border border-green-200">
                                    <h3 className="font-bold">Success! Profile Found:</h3>
                                    <pre className="text-xs mt-2">{JSON.stringify(profile, null, 2)}</pre>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            <div className="mt-8">
                <h2 className="font-bold underline mb-2">Raw Session Data</h2>
                <pre className="bg-gray-800 text-white p-4 rounded text-xs overflow-auto h-40">
                    {JSON.stringify(sessionData, null, 2)}
                </pre>
            </div>
        </div>
    );
};
