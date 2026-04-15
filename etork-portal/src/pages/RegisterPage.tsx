import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  async function handleRegister(e: React.FormEvent) {
    // ESSAS DUAS LINHAS S�O AS MAIS IMPORTANTES DO PROJETO AGORA
    e.preventDefault();
    e.stopPropagation();
    
    setMessage({ type: '', text: '' });
    setLoading(true);

    try {
      // O signUp precisa da chave que come�a com "ey" no Netlify
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        setMessage({ 
          type: 'success', 
          text: 'Cadastro realizado! O usu�rio deve aparecer no Supabase agora.' 
        });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erro na comunica��o com Supabase.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0a0a', display: 'flex',
      alignItems: 'center', justifyContent: 'center', fontFamily: '"Inter", sans-serif',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Background grid e Glow */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.04, backgroundImage: 'linear-gradient(#e6b800 1px, transparent 1px), linear-gradient(90deg, #e6b800 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      <div style={{ width: '100%', maxWidth: 400, padding: '0 24px', position: 'relative' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 42, fontWeight: 900, color: '#fff', letterSpacing: -1, lineHeight: 1 }}>ETORK</div>
          <div style={{ fontSize: 11, color: '#e6b800', fontWeight: 700, letterSpacing: 5, marginTop: 4 }}>BRASIL</div>
        </div>

        {/* Card */}
        <div style={{ background: '#111', border: '1px solid #222', borderRadius: 16, padding: 32 }}>
          <h1 style={{ color: '#fff', fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Novo Cadastro</h1>
          <p style={{ color: '#555', fontSize: 13, marginBottom: 28 }}>Crie sua conta de franqueado</p>

          <form onSubmit={handleRegister}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#888', marginBottom: 6 }}>E-MAIL</label>
              <input 
                type="email" 
                placeholder="seu@email.com" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
                style={{ width: '100%', padding: '12px', background: '#0d0d0d', color: '#fff', border: '1px solid #2a2a2a', borderRadius: 8, fontSize: 14, outline: 'none' }}
              />
            </div>
            <div style={{ marginBottom: 24, position: 'relative' }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#888', marginBottom: 6 }}>SENHA</label>
              <input 
                type={showPassword ? 'text' : 'password'} 
                placeholder="••••••••" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                style={{ width: '100%', padding: '12px', background: '#0d0d0d', color: '#fff', border: '1px solid #2a2a2a', borderRadius: 8, fontSize: 14, outline: 'none', paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: 10, top: 30, background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                {showPassword ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                    <path d="M2 2L22 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                )}
              </button>
            </div>
            {message.text && (
              <div style={{
                padding: '10px', marginBottom: 16, borderRadius: 8, fontSize: 13,
                background: message.type === 'error' ? '#1a0a0a' : '#0a1a0a',
                border: message.type === 'error' ? '1px solid #3a1a1a' : '1px solid #1a3a1a',
                color: message.type === 'error' ? '#e74c3c' : '#2ecc71',
              }}>
                {message.text}
              </div>
            )}
            <button 
              type="submit" 
              disabled={loading}
              style={{ width: '100%', padding: '13px', background: loading ? '#2a2a00' : '#e6b800', color: '#000', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'CARREGANDO...' : 'CADASTRAR AGORA'}
            </button>
          </form>

          {/* Link para Login */}
          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <span style={{ color: '#555', fontSize: 12 }}>Já tem conta? </span>
            <button 
              type="button"
              style={{ background: 'none', border: 'none', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
              onClick={() => window.location.href = '/login'}
            >
              Fazer Login
            </button>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: '#333' }}>
          Portal exclusivo para franqueados Etork Brasil
        </p>
      </div>
    </div>
  );
}
