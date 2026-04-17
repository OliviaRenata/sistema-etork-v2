/// <reference types="vite/client" />

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Variáveis de ambiente do Supabase não encontradas.');
}

// Função para obter o token de forma confiável
const getToken = async () => {
  // Primeiro tenta do localStorage
  let token = localStorage.getItem('sb-access-token');
  
  // Se não tiver, tenta da sessão
  if (!token) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      token = session.access_token;
      localStorage.setItem('sb-access-token', token);
    }
  }
  
  return token;
};

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
});

if (typeof window !== 'undefined') {
  (window as any).supabase = supabase;
}

export const auth = {
  signIn: (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password }),
  signOut: () => supabase.auth.signOut(),
  getSession: () => supabase.auth.getSession(),
  onAuthStateChange: (cb: any) => supabase.auth.onAuthStateChange(cb),
};

// Edge Function Caller CORRIGIDO
export async function callFunction<T>(
  name: string,
  body?: any,
  method: 'POST' | 'PATCH' | 'DELETE' = 'POST'
): Promise<T> {
  // Buscar o token
  const token = await getToken();
  
  console.log('Chamando função:', name);
  console.log('Token obtido:', token ? 'Sim - ' + token.substring(0, 30) + '...' : 'Não');
  
  if (!token) {
    console.error('Token não encontrado. Usuário não autenticado.');
    throw new Error('Usuário não autenticado. Faça login novamente.');
  }

  const { data, error } = await supabase.functions.invoke<T>(name, {
    method,
    body,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (error) {
    console.error(`Erro na função ${name}:`, error);
    throw error;
  }
  
  return data as T;
}

export const storage = {
  uploadOrderFile: async (orderId: string, file: File) => {
    const token = await getToken();
    const path = `${orderId}/${Date.now()}-${file.name}`;
    
    const { data, error } = await supabase.storage
      .from('order-files')
      .upload(path, file, { 
        upsert: false,
        contentType: file.type,
        headers: token ? { Authorization: `Bearer ${token}` } : {}
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
    const { error } = await supabase.storage.from('order-files').remove([path]);
    if (error) throw error;
  },
};