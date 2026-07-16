import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<Profile | null>;
  applyProfileUpdate: (profile: Profile) => void;
  signUp: (email: string, password: string) => Promise<{ error: string | null; needsEmailConfirmation: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Tracks whichever user we most recently asked for a profile, so that if an
  // older request resolves late (e.g. right after a fast sign-out + new
  // sign-up), we can tell it's stale and ignore it instead of overwriting
  // the new user's state with the wrong data.
  const latestUserId = useRef<string | null>(null);

  const fetchProfile = async (userId: string) => {
    latestUserId.current = userId;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;

    if (latestUserId.current !== userId) return null;
    const nextProfile = data as Profile | null;
    setProfile(nextProfile);
    return nextProfile;
  };

  useEffect(() => {
    // Check for an existing session as soon as the app opens
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      try {
        if (data.session?.user) await fetchProfile(data.session.user.id);
      } catch (error) {
        console.warn('Unable to load profile', error);
      } finally {
        setLoading(false);
      }
    });

    // Keep session in sync if it changes (sign in, sign out, token refresh)
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        try {
          await fetchProfile(newSession.user.id);
        } catch (error) {
          console.warn('Unable to refresh profile after auth change', error);
        }
      } else {
        latestUserId.current = null;
        setProfile(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (session?.user) {
      return fetchProfile(session.user.id);
    }
    return null;
  };

  const applyProfileUpdate = (updatedProfile: Profile) => {
    if (updatedProfile.id === session?.user.id) setProfile(updatedProfile);
  };

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    // If email confirmation is turned on in Supabase, signUp succeeds but
    // returns no active session — the user has to verify their email first.
    const needsEmailConfirmation = !error && !data.session;
    return { error: error?.message ?? null, needsEmailConfirmation };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{ session, profile, loading, refreshProfile, applyProfileUpdate, signUp, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
