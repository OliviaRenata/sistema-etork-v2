import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  async function handleRegister(e: React.FormEvent) {
    // ISSO IMPEDE A PÁGINA DE ATUALIZAR
    e.preventDefault();
    e.stopPropagation();
    
    setMessage({ type: '', text: '' });
    setLoading(true);

    try {
      console.log("Tentando registro com URL:", import.meta.env.VITE_SUPABASE_URL);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        setMessage({ 
          type: 'success', 
          text: 'Conta criada! Verifique seu e-mail ou tente logar.' 
        });
      }
    } catch (err: any) {
      console.error("Erro no Supabase:", err);
      setMessage({ type: 'error', text: err.message || 'Erro ao solicitar acesso.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"Inter", sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 400, padding: '0 24px' }}>
        <div style={{ background: '#111', border: '1px solid #222', borderRadius: 16, padding: 32 }}>
          <h1 style={{ color: '#fff', fontSize: 18, fontWeight: 600, marginBottom: 28 }}>Solicitar Acesso</h1>
          
          <form onSubmit={handleRegister}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, color: '#888', marginBottom: 6 }}>E-MAIL</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: '100%', padding: '12px', background: '#0d0d0d', border: '1px solid #2a2a2a', borderRadius: 8, color: '#fff' }} />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 11, color: '#888', marginBottom: 6 }}>SENHA</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={{ width: '100%', padding: '12px', background: '#0d0d0d', border: '1px solid #2a2a2a', borderRadius: 8, color: '#fff' }} />
            </div>

            {message.text && (
              <div style={{ padding: '10px', marginBottom: 16, borderRadius: 8, fontSize: 13, background: message.type === 'error' ? '#1a0a0a' : '#0a1a0a', color: message.type === 'error' ? '#e74c3c' : '#2ecc71', border: '1px solid' }}>
                {message.text}
              </div>
            )}

            <button type="submit" disabled={loading} style={{ width: '100%', padding: '13px', background: '#e6b800', color: '#000', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
              {loading ? 'ENVIANDO...' : 'SOLICITAR ACESSO'}
            </button>
          </form>
          <button onClick={() => window.location.href = '/'} style={{ marginTop: 20, background: 'none', border: 'none', color: '#888', cursor: 'pointer', width: '100%' }}>Voltar</button>
        </div>
      </div>
    </div>
  );
}
