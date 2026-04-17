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

      console.log('✅ Novo franqueado criado:', newFranchisee);
      return newFranchisee;
    } catch (error) {
      console.error('Erro em createFranchisee:', error);
      return null;
    }
  }

  // Função para carregar ou criar franqueado
  async function loadOrCreateFranchisee(userId: string, userEmail: string) {
    try {
      // Buscar franqueado existente
      const { data: existingFranchisee, error: fetchError } = await supabase
        .from('franchisees')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Erro ao buscar franqueado:', fetchError);
        return null;
      }

      // Se encontrou, retorna
      if (existingFranchisee) {
        console.log('✅ Franqueado encontrado:', existingFranchisee);
        return existingFranchisee;
      }

      // Se não encontrou, criar novo
      console.log('⚠️ Franqueado não encontrado, criando...');
      return await createFranchisee(userId, userEmail);
      
    } catch (error) {
      console.error('Erro em loadOrCreateFranchisee:', error);
      return null;
    }
  }

  async function loadProfile(userId: string, userEmail: string) {
    try {
      // 1. Carregar perfil
      const { data: prof, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Erro carregando perfil', profileError);
      }

      setProfile(prof ?? null);

      // 2. Para usuários com role 'franchisee' OU que não têm role definida
      const shouldHaveFranchisee = !prof || prof.role === 'franchisee' || prof.role === 'user';
      
      if (shouldHaveFranchisee) {
        const franchiseeData = await loadOrCreateFranchisee(userId, userEmail);
        setFranchisee(franchiseeData);
        
        // Se o perfil não existe ou não tem role, criar/atualizar
        if (!prof || !prof.role) {
          const { error: upsertError } = await supabase
            .from('profiles')
            .upsert({
              id: userId,
              role: 'franchisee',
              updated_at: new Date().toISOString()
            });
          
          if (upsertError) {
            console.error('Erro ao criar perfil:', upsertError);
          } else {
            // Recarregar perfil
            const { data: updatedProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', userId)
              .single();
            setProfile(updatedProfile);
          }
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
    auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id, session.user.email!);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = auth.onAuthStateChange(async (_event, session) => {
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
    await auth.signOut();
  }

  // Verificar se é admin (baseado no profile OU se é o João)
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