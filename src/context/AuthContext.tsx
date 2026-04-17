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

  // Função para criar franqueado automaticamente
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
          active: true,
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
        .select('*')
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
    try {
      const { data: prof, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      setProfile(prof ?? null);

      const shouldHaveFranchisee = !prof || prof.role === 'franchisee' || prof.role === 'user';
      
      if (shouldHaveFranchisee) {
        const franchiseeData = await loadOrCreateFranchisee(userId, userEmail);
        setFranchisee(franchiseeData);
        
        if (!prof || !prof.role) {
          await supabase.from('profiles').upsert({
            id: userId,
            role: 'franchisee',
            updated_at: new Date().toISOString()
          });
          
          const { data: updatedProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
          setProfile(updatedProfile);
        }
      } else {
        setFranchisee(null);
      }
    } catch (error) {
      console.error('Erro em loadProfile:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // AJUSTE: Tratamento de erro na inicialização da sessão
    auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("Erro ao recuperar sessão (Token inválido):", error.message);
        // Se o token estiver corrompido, limpa tudo para permitir novo login
        auth.signOut();
        setLoading(false);
        return;
      }

      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id, session.user.email!);
      } else {
        setLoading(false);
      }
    }).catch(() => {
        setLoading(false);
    });

    const { data: { subscription } } = auth.onAuthStateChange(async (event, session) => {
      // Se houver erro de sinalização ou token inválido, deslogar
      if (event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
         // Pequena proteção extra
      }

      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await loadProfile(session.user.id, session.user.email!);
      } else {
        setProfile(null);
        setFranchisee(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    const { error } = await auth.signIn(email, password);
    if (error) throw error;
  }

  async function signOut() {
    setLoading(true);
    await auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    setFranchisee(null);
    setLoading(false);
  }

  const isAdmin = profile?.role === 'admin' || franchisee?.company_name === 'ETORK SP';

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