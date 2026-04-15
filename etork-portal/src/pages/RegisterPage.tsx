import { useState } from 'react';
import { supabase } from '../lib/supabase';

const logoUrl = new URL('../assets/logo.svg', import.meta.url).href;

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  async function handleRegister(e: React.FormEvent) {
    // ESSAS DUAS LINHAS SÃO AS MAIS IMPORTANTES DO PROJETO AGORA
    e.preventDefault();
    e.stopPropagation();
    
    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'As senhas não coincidem.' });
      return;
    }

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
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{ id: data.user.id, role: 'franchisee', full_name: email }]);

        if (profileError) {
          throw profileError;
        }

        setMessage({ 
          type: 'success', 
          text: 'Cadastro realizado! Agora você já tem um perfil de franqueado e pode entrar.' 
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
      minHeight: '100vh', background: 'var(--bg)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', fontFamily: '"Inter", sans-serif',
      position: 'relative', overflow: 'hidden',
      color: 'var(--text)',
    }}>
      {/* Background grid e Glow */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.04, backgroundImage: 'linear-gradient(#e6b800 1px, transparent 1px), linear-gradient(90deg, #e6b800 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      <div style={{ width: '100%', maxWidth: 400, padding: '0 24px', position: 'relative' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <img src={logoUrl} alt="ETORK Brasil" style={{ width: 220, maxWidth: '100%', height: 'auto', display: 'inline-block' }} />
        </div>

        {/* Card */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 32 }}>
          <h1 style={{ color: 'var(--text)', fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Novo Cadastro</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 28 }}>Crie sua conta de franqueado</p>

          <form onSubmit={handleRegister}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#888', marginBottom: 6 }}>E-MAIL</label>
              <input 
                type="email" 
                placeholder="seu@email.com" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
                style={{ width: '100%', padding: '12px', background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, outline: 'none' }}
              />
            </div>
            <div style={{ marginBottom: 16, position: 'relative' }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#888', marginBottom: 6 }}>SENHA</label>
              <input 
                type={showPassword ? 'text' : 'password'} 
                placeholder="••••••••" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                style={{ width: '100%', padding: '12px', background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, outline: 'none', paddingRight: 40 }}
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
            <div style={{ marginBottom: 24, position: 'relative' }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#888', marginBottom: 6 }}>CONFIRMAR SENHA</label>
              <input 
                type={showPassword ? 'text' : 'password'} 
                placeholder="••••••••" 
                value={confirmPassword} 
                onChange={e => setConfirmPassword(e.target.value)} 
                required 
                style={{ width: '100%', padding: '12px', background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, outline: 'none', paddingRight: 40 }}
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
              style={{ width: '100%', padding: '13px', background: loading ? '#2a2a00' : 'var(--accent)', color: '#000', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'CARREGANDO...' : 'CADASTRAR AGORA'}
            </button>
          </form>

          {/* Link para Login */}
          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <span style={{ color: '#555', fontSize: 12 }}>Já tem conta? </span>
            <button 
              type="button"
              style={{ background: 'none', border: 'none', color: 'var(--text)', fontSize: 12, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
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
