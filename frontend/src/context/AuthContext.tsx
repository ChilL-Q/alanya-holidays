import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import type { User, Session, AuthError, Provider } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { Tables } from "@alanya-holidays/shared";

export type UserProfile = Tables<"profiles">;

export interface SignUpParams {
  email: string;
  password: string;
  fullName?: string;
  metadata?: Record<string, unknown>;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isHost: boolean;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ user: User | null; session: Session | null; error: AuthError | null }>;
  signUp: (
    params: SignUpParams
  ) => Promise<{ user: User | null; session: Session | null; error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (
    email: string,
    redirectTo?: string
  ) => Promise<{ error: AuthError | null }>;
  signInWithOAuth: (
    provider: Provider,
    redirectTo?: string
  ) => Promise<{ error: AuthError | null }>;
  refreshProfile: () => Promise<void>;
  updateProfile: (
    updates: Partial<UserProfile>
  ) => Promise<{ profile: UserProfile | null; error: Error | null }>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const createFallbackProfile = (authUser: User): UserProfile => {
  const metaFullName =
    (authUser.user_metadata?.full_name as string | undefined) ||
    (authUser.user_metadata?.name as string | undefined);
  const derivedName = metaFullName || (authUser.email ? authUser.email.split("@")[0] : "User");

  return {
    id: authUser.id,
    email: authUser.email ?? null,
    full_name: derivedName,
    avatar_url: (authUser.user_metadata?.avatar_url as string | undefined) || null,
    role: (authUser.user_metadata?.role as string | undefined) || "user",
    phone: null,
    company_name: null,
    iban: null,
    bank_name: null,
    bank_account_holder_name: null,
    crypto_wallet: null,
    social_links: null,
    created_at: authUser.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfile = useCallback(async (userId: string, authUser?: User | null): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.warn("Could not fetch user profile from Supabase:", error.message);
      }

      if (data) {
        return data as UserProfile;
      }

      if (authUser) {
        return createFallbackProfile(authUser);
      }

      return null;
    } catch (err: unknown) {
      console.warn("Unexpected error fetching profile:", err);
      if (authUser) {
        return createFallbackProfile(authUser);
      }
      return null;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      return;
    }
    const updated = await fetchProfile(user.id, user);
    setProfile(updated);
  }, [user, fetchProfile]);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.warn("Error getting initial Supabase session:", error.message);
        }

        if (!isMounted) return;

        const currentSession = data.session;
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          const prof = await fetchProfile(currentSession.user.id, currentSession.user);
          if (isMounted) {
            setProfile(prof);
          }
        } else {
          setProfile(null);
        }
      } catch (err: unknown) {
        console.error("Auth initialization failed:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!isMounted) return;

      setSession(newSession);
      const currentUser = newSession?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        const prof = await fetchProfile(currentUser.id, currentUser);
        if (isMounted) {
          setProfile(prof);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (!error && data.session) {
        setSession(data.session);
        setUser(data.user);
        if (data.user) {
          const prof = await fetchProfile(data.user.id, data.user);
          setProfile(prof);
        }
      }

      return { user: data.user, session: data.session, error };
    },
    [fetchProfile]
  );

  const signUp = useCallback(
    async ({ email, password, fullName, metadata = {} }: SignUpParams) => {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName,
            ...metadata,
          },
        },
      });

      if (!error && data.user) {
        if (data.session) {
          setSession(data.session);
          setUser(data.user);
          const prof = await fetchProfile(data.user.id, data.user);
          setProfile(prof);
        }
      }

      return { user: data.user, session: data.session, error };
    },
    [fetchProfile]
  );

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    return { error };
  }, []);

  const resetPassword = useCallback(async (email: string, redirectTo?: string) => {
    const redirectUrl =
      redirectTo ||
      (typeof window !== "undefined"
        ? `${window.location.origin}/login`
        : undefined);

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: redirectUrl,
    });

    return { error };
  }, []);

  const signInWithOAuth = useCallback(
    async (provider: Provider, redirectTo?: string) => {
      const redirectUrl =
        redirectTo ||
        (typeof window !== "undefined"
          ? `${window.location.origin}/`
          : undefined);

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
        },
      });

      return { error };
    },
    []
  );

  const updateProfile = useCallback(
    async (updates: Partial<UserProfile>) => {
      if (!user) {
        return { profile: null, error: new Error("User is not logged in") };
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .update(updates)
          .eq("id", user.id)
          .select()
          .single();

        if (error) {
          return { profile: null, error: new Error(error.message) };
        }

        const updatedProfile = data as UserProfile;
        setProfile(updatedProfile);
        return { profile: updatedProfile, error: null };
      } catch (err: unknown) {
        const errObj = err instanceof Error ? err : new Error("Failed to update profile");
        return { profile: null, error: errObj };
      }
    },
    [user]
  );

  const isAuthenticated = Boolean(user);
  const isAdmin = profile?.role === "admin";
  const isHost = profile?.role === "host" || profile?.role === "admin";

  const contextValue = useMemo(
    () => ({
      user,
      session,
      profile,
      loading,
      isAuthenticated,
      isAdmin,
      isHost,
      signIn,
      signUp,
      signOut,
      resetPassword,
      signInWithOAuth,
      refreshProfile,
      updateProfile,
    }),
    [
      user,
      session,
      profile,
      loading,
      isAuthenticated,
      isAdmin,
      isHost,
      signIn,
      signUp,
      signOut,
      resetPassword,
      signInWithOAuth,
      refreshProfile,
      updateProfile,
    ]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
