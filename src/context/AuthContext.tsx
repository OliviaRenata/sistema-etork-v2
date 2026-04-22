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

  function clearSupabaseAuthStorage() {
    if (typeof window === 'undefined') return;

    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('sb-') && key.includes('auth-token')) {
        localStorage.removeItem(key);
      }
    }

    for (const key of Object.keys(sessionStorage)) {
      if (key.startsWith('sb-') && key.includes('auth-token')) {
        sessionStorage.removeItem(key);
      }
    }
  }

  async function createFranchisee(userId: string, userEmail: string) {
    try {
      const companyCode = `FRAN${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const companyName = `Empresa ${userEmail.split('@')[0]}`;

      const { data: newFranchisee, error: insertError } = await supabase
        .from('franchisees')
        .insert({
          user_id: userId,
          company_name: companyName,
          code: companyCode,
          active: false,
          approved: false,
          balance: 0,
          credit_limit: 1000,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        console.error('Erro ao criar franqueado:', insertError);
        return null;
      }
      return newFranchisee;
    } catch (error) {
      console.error('Erro em createFranchisee:', error);
      return null;
    }
  }

  async function loadOrCreateFranchisee(userId: string, userEmail: string) {
    try {
      const { data: existingFranchisee, error: fetchError } = await supabase
        .from('franchisees')
        .select('id, user_id, company_name, code, active, approved')
        .eq('user_id', userId)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') return null;
      if (existingFranchisee) return existingFranchisee;
      return await createFranchisee(userId, userEmail);
    } catch (error) {
      return null;
    }
  }

  async function loadProfile(userId: string, userEmail: string) {
    setLoading(true);
    const unlockTimer = window.setTimeout(() => {
      setLoading(false);
    }, 8000);

    try {
      let { data: prof } = await supabase
        .from('profiles')
        .select('id, role, full_name, email, created_at, updated_at')
        .eq('id', userId)
        .maybeSingle();

      if (!prof) {
        const isAdminEmail = userEmail === 'joao@etorkbrasil.com.br';
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            role: isAdminEmail ? 'admin' : 'franchisee',
            full_name: isAdminEmail ? 'Administrador' : userEmail.split('@')[0],
            email: userEmail,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (!insertError && newProfile) {
          prof = newProfile;
        }
      }

      setProfile(prof ?? null);

      if (prof?.role === 'admin') {
        setFranchisee(null);
      } else {
        const franchiseeData = await loadOrCreateFranchisee(userId, userEmail);
        setFranchisee(franchiseeData);
      }
      
    } catch (error) {
      console.error('Erro em loadProfile:', error);
    } finally {
      window.clearTimeout(unlockTimer);
      setLoading(false);
    }
  }

  async function signIn(email: string, password: string) {
    const { error } = await auth.signIn(email, password);
    if (error) throw error;
  }

  async function signOut() {
    setLoading(true);
    try {
      // Evita travar o logout caso a requisição remota demore.
      await Promise.race([
        auth.signOut(),
        new Promise((resolve) => setTimeout(resolve, 1800)),
      ]);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      clearSupabaseAuthStorage();
      setSession(null);
      setUser(null);
      setProfile(null);
      setFranchisee(null);
      setLoading(false);
      window.location.replace('/login');
    }
  }

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);

      try {
        const { data: { session: initialSession } } = await auth.getSession();

        if (initialSession?.user) {
          setSession(initialSession);
          setUser(initialSession.user);
          void loadProfile(initialSession.user.id, initialSession.user.email!);
        } else {
          setUser(null);
          setSession(null);
          setProfile(null);
          setFranchisee(null);
          setLoading(false);
        }
      } catch (error) {
        console.error('Erro ao restaurar sessão:', error);
        setUser(null);
        setSession(null);
        setProfile(null);
        setFranchisee(null);
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session?.user) {
        setSession(session);
        setUser(session.user);
        // Evita await no callback do Supabase Auth para não travar o fluxo interno.
        setTimeout(() => {
          void loadProfile(session.user.id, session.user.email!);
        }, 0);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        setSession(session);
        setUser(session.user);
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setSession(null);
        setProfile(null);
        setFranchisee(null);
        setLoading(false);
      }

      return Promise.resolve();
    });

    return () => subscription.unsubscribe();
  }, []);

  const isAdmin = profile?.role === 'admin' || user?.email === 'joao@etorkbrasil.com.br';

  return (
    <AuthContext.Provider value={{
      user, session, profile, franchisee,
      isAdmin,
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