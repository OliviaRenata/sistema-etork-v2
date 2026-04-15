// src/context/AuthContext.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, auth } from '../lib/supabase';
import type { Profile, Franchisee } from '../types';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  franchisee: Franchisee | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [franchisee, setFranchisee] = useState<Franchisee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user.id);
      else {
        setProfile(null);
        setFranchisee(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadProfile(userId: string) {
    try {
      const { data: prof } = await supabase
        .from('profiles').select('*').eq('id', userId).single();
      setProfile(prof);

      if (prof?.role === 'franchisee') {
        const { data: franc } = await supabase
          .from('franchisees').select('*').eq('user_id', userId).single();
        setFranchisee(franc);
      }
    } finally {
      setLoading(false);
    }
  }

  async function signIn(email: string, password: string) {
    const { error } = await auth.signIn(email, password);
    if (error) throw error;
  }

  async function signOut() {
    await auth.signOut();
  }

  return (
    <AuthContext.Provider value={{
      user, session, profile, franchisee,
      isAdmin: profile?.role === 'admin',
      loading, signIn, signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
