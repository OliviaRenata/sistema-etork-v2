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
      // Buscar perfil existente
      let { data: prof, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      // Se não existe perfil, criar
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

      // Se for admin, não precisa de franqueado
      if (prof?.role === 'admin') {
        setFranchisee(null);
      } else {
        // Se for franqueado, carregar ou criar franqueado
        const franchiseeData = await loadOrCreateFranchisee(userId, userEmail);
        setFranchisee(franchiseeData);
      }
      
    } catch (error) {
      console.error('Erro em loadProfile:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("Erro ao recuperar sessao:", error.message);
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

  // Admin identificado por role ou email especifico
  const isAdmin = profile?.role === 'admin' || user?.email === 'joao@etorkbrasil.com.br';

  // Logs para debug
  console.log('AuthContext - isAdmin:', isAdmin);
  console.log('AuthContext - profile role:', profile?.role);
  console.log('AuthContext - user email:', user?.email);

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