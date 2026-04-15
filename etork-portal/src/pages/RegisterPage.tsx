import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  async function handleRegister(e: React.FormEvent) {
    // ESSAS DUAS LINHAS SÃO AS MAIS IMPORTANTES DO PROJETO AGORA
    e.preventDefault();
    e.stopPropagation();
    
    setMessage({ type: '', text: '' });
    setLoading(true);

    try {
      // O signUp precisa da chave que começa com "ey" no Netlify
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        setMessage({ 
          type: 'success', 
          text: 'Cadastro realizado! O usuário deve aparecer no Supabase agora.' 
        });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erro na comunicação com Supabase.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 400, padding: '24px', background: '#111', borderRadius: 16, border: '1px solid #222' }}>
        <h1 style={{ color: '#fff', marginBottom: 20 }}>Solicitar Acesso</h1>
        <form onSubmit={handleRegister}>
          <input 
            type="email" 
            placeholder="E-mail" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            required 
            style={{ width: '100%', padding: '12px', marginBottom: 10, background: '#000', color: '#fff', border: '1px solid #333', borderRadius: 8 }}
          />
          <input 
            type="password" 
            placeholder="Senha" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            required 
            style={{ width: '100%', padding: '12px', marginBottom: 20, background: '#000', color: '#fff', border: '1px solid #333', borderRadius: 8 }}
          />
          {message.text && (
            <div style={{ color: message.type === 'error' ? '#ff4d4d' : '#00ff00', marginBottom: 15 }}>{message.text}</div>
          )}
          <button 
            type="submit" 
            disabled={loading}
            style={{ width: '100%', padding: '12px', background: '#e6b800', border: 'none', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer' }}
          >
            {loading ? 'CARREGANDO...' : 'CADASTRAR AGORA'}
          </button>
        </form>
      </div>
    </div>
  );
}
