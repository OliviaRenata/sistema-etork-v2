// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: { eventsPerSecond: 10 },
  },
});

// ─── Auth helpers ──────────────────────────────────────────
export const auth = {
  signIn: (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password }),

  signOut: () => supabase.auth.signOut(),

  getSession: () => supabase.auth.getSession(),

  onAuthStateChange: (cb: Parameters<typeof supabase.auth.onAuthStateChange>[0]) =>
    supabase.auth.onAuthStateChange(cb),
};

// ─── Edge Function caller ──────────────────────────────────
export async function callFunction<T>(
  name: string,
  body?: unknown,
  method: 'POST' | 'PATCH' | 'DELETE' = 'POST'
): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Não autenticado');

  const { data, error } = await supabase.functions.invoke<T>(name, {
    method,
    body,
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (error) throw error;
  return data as T;
}

// ─── Storage helpers ───────────────────────────────────────
export const storage = {
  uploadOrderFile: async (orderId: string, file: File) => {
    const ext = file.name.split('.').pop();
    const path = `${orderId}/${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage
      .from('order-files').upload(path, file, { upsert: false });
    if (error) throw error;
    return data.path;
  },

  getSignedUrl: async (path: string, expiresIn = 3600) => {
    const { data, error } = await supabase.storage
      .from('order-files').createSignedUrl(path, expiresIn);
    if (error) throw error;
    return data.signedUrl;
  },

  deleteFile: async (path: string) => {
    const { error } = await supabase.storage.from('order-files').remove([path]);
    if (error) throw error;
  },
};
