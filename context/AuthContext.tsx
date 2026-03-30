
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../api-services/supabase';
import { Session } from '@supabase/supabase-js';

// Types
export interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role: 'guest' | 'host' | 'admin';
    company_name?: string;
    joinedDate: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    register: (name: string, email: string, password: string, role: 'guest' | 'host', companyName?: string) => Promise<{ success: boolean; error?: string }>;
    sendOtp: (email: string) => Promise<{ success: boolean; error?: string }>;
    verifyOtp: (email: string, token: string, type?: 'email' | 'signup' | 'recovery') => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
    updateUser: (data: Partial<User>) => void;
    updateProfile: (data: Partial<User>) => void;
    updateEmail: (email: string) => Promise<void>;
    updatePassword: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Map Supabase session user to our app User type
    const mapSessionToUser = (sessionUser: any): User => {
        const metadata = sessionUser.user_metadata || {};
        return {
            id: sessionUser.id,
            name: metadata.full_name || metadata.name || sessionUser.email?.split('@')[0] || 'User',
            email: sessionUser.email || '',
            avatar: metadata.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(metadata.full_name || 'U')}&background=0D9488&color=fff`,
            role: (metadata.role as 'guest' | 'host' | 'admin') || 'guest',
            company_name: metadata.company_name,
            joinedDate: sessionUser.created_at,
        };
    };

    useEffect(() => {
        const checkUser = async (sessionUser: any) => {
            if (!sessionUser) {
                setUser(null);
                setIsLoading(false);
                return;
            }

            try {
                // Fetch profile from DB to get the LATEST role
                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', sessionUser.id)
                    .single();

                if (profile) {
                    setUser({
                        id: sessionUser.id,
                        name: profile.full_name || 'User',
                        email: profile.email || sessionUser.email || '',
                        avatar: profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name || 'U')}&background=0D9488&color=fff`,
                        role: profile.role || 'guest',
                        company_name: profile.company_name,
                        joinedDate: profile.created_at || sessionUser.created_at,
                    });
                } else {
                    // Fallback to metadata if profile not found (unlikely)
                    setUser(mapSessionToUser(sessionUser));
                }
            } catch (err) {
                console.error('Error fetching user profile:', err);
                setUser(mapSessionToUser(sessionUser));
            } finally {
                setIsLoading(false);
            }
        };

        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            checkUser(session?.user);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            checkUser(session?.user);
        });

        return () => subscription.unsubscribe();
    }, []);

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        setIsLoading(false);

        if (error) {
            return { success: false, error: error.message };
        }
        return { success: true };
    };

    const register = async (name: string, email: string, password: string, role: 'guest' | 'host' = 'guest', companyName?: string) => {
        setIsLoading(true);
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: name,
                    role: role,
                    company_name: companyName, // Added optional company name
                    avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D9488&color=fff`
                }
            }
        });

        setIsLoading(false);

        if (error) {
            return { success: false, error: error.message };
        }

        // If email confirmation is enabled in Supabase, user might not be logged in yet.
        // But for this use-case, we assume it might be optional or handled.

        // Trigger Welcome Email
        if (data.user) {
            supabase.functions.invoke('send-email', {
                body: {
                    type: 'welcome_email',
                    to: email,
                    userId: data.user.id,
                    data: {
                        name: name,
                        link: window.location.origin
                    }
                }
            }).catch(e => console.error('Failed to send welcome email', e));
        }

        return { success: true };
    };

    const sendOtp = async (email: string) => {
        setIsLoading(true);
        const { error } = await supabase.auth.signInWithOtp({
            email,
        });
        setIsLoading(false);

        if (error) {
            return { success: false, error: error.message };
        }
        return { success: true };
    };

    const verifyOtp = async (email: string, token: string, type: 'email' | 'signup' | 'recovery' = 'email') => {
        setIsLoading(true);
        const { data, error } = await supabase.auth.verifyOtp({
            email,
            token,
            type,
        });

        setIsLoading(false);

        if (error) {
            return { success: false, error: error.message };
        }
        return { success: true };
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
    };

    const updateUser = async (data: Partial<User>) => {
        if (!user) return;

        const updates: any = {};
        if (data.name) updates.full_name = data.name;
        if (data.avatar) updates.avatar_url = data.avatar;
        // NOTE: role is intentionally excluded — role changes must go through
        // the DB (profiles table) via admin actions, not user_metadata.
        if (data.company_name) updates.company_name = data.company_name;

        const { error } = await supabase.auth.updateUser({
            data: updates
        });

        if (error) {
            console.error('Error updating user:', error);
        } else {
            // Local state will update via listener
            setUser({ ...user, ...data });
        }
    };

    const updateEmail = async (email: string) => {
        const { error } = await supabase.auth.updateUser({ email });
        if (error) throw error;
        // User needs to confirm via email, so local state might not update immediately depending on config
    };

    const updatePassword = async (password: string) => {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
    };

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated: !!user,
            isLoading,
            login,
            register,
            sendOtp,
            verifyOtp,
            logout,
            updateUser,
            updateProfile: updateUser,
            updateEmail,
            updatePassword
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
