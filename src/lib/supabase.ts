/// <reference types="vite/client" />

import { createClient } from '@supabase/supabase-js';

// 1. Configuração do Cliente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Variáveis de ambiente do Supabase não encontradas. Verifique o seu arquivo .env ou as configurações do Netlify.');
}

// Função auxiliar para obter o token do localStorage
const getToken = () => localStorage.getItem('sb-access-token');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'sb-access-token',
    storage: localStorage,
    detectSessionInUrl: true
  },
  realtime: {
    params: { eventsPerSecond: 10 },
  },
  global: {
    headers: {
      ...(getToken() && { Authorization: `Bearer ${getToken()}` })
    }
  }
});

// EXPOR PARA O CONSOLE (Para você testar)
if (typeof window !== 'undefined') {
  (window as any).supabase = supabase;
}

// 2. Auth Helpers
export const auth = {
  signIn: (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password }),

  signOut: () => supabase.auth.signOut(),

  getSession: () => supabase.auth.getSession(),

  onAuthStateChange: (cb: Parameters<typeof supabase.auth.onAuthStateChange>[0]) =>
    supabase.auth.onAuthStateChange(cb),
};

// 3. Edge Function Caller
export async function callFunction<T>(
  name: string,
  body?: any,
  method: 'POST' | 'PATCH' | 'DELETE' = 'POST'
): Promise<T> {
  const token = getToken();
  
  if (!token) {
    throw new Error('Usuário não autenticado. Por favor, faça login novamente.');
  }

  const { data, error } = await supabase.functions.invoke<T>(name, {
    method,
    body,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (error) {
    console.error(`Erro na função ${name}:`, error);
    throw error;
  }
  
  return data as T;
}

// 4. Storage Helpers
export const storage = {
  uploadOrderFile: async (orderId: string, file: File) => {
    const path = `${orderId}/${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage
      .from('order-files')
      .upload(path, file, { 
        upsert: false,
        contentType: file.type 
      });
    
    if (error) throw error;
    return data?.path || ''; 
  },

  getSignedUrl: async (path: string, expiresIn = 3600) => {
    const { data, error } = await supabase.storage
      .from('order-files')
      .createSignedUrl(path, expiresIn);
    
    if (error) throw error;
    return data.signedUrl;
  },

  deleteFile: async (path: string) => {
    const { error } = await supabase.storage
      .from('order-files')
      .remove([path]);
    if (error) throw error;
  },
};