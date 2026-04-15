import { useState } from 'react';
import { supabase } from '../lib/supabase';

const logoUrl = new URL('../assets/logo.svg', import.meta.url).href;

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  background: '#101010',
  color: '#fff',
  border: '1px solid #2a2a2a',
  borderRadius: 10,
  fontSize: 14,
  outline: 'none',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 700,
  color: '#999',
  marginBottom: 8,
  letterSpacing: 1,
};

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'As senhas não coincidem.' });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{ id: data.user.id, role: 'franchisee', full_name: email }]);

        if (profileError) throw profileError;

        setMessage({
          type: 'success',
          text: 'Cadastro realizado! Agora você pode entrar com seu e-mail e senha.',
        });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erro ao registrar no Supabase.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: '"Inter", sans-serif' }}>
      <div style={{ width: 460, minHeight: '100vh', flexShrink: 0, background: '#0a0a0a', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px 44px', position: 'relative' }}>
        <div style={{ position: 'absolute', right: 0, top: '10%', bottom: '10%', width: 1, background: 'linear-gradient(to bottom, transparent, rgba(230,184,0,0.4) 40%, rgba(230,184,0,0.4) 60%, transparent)' }} />

        <div style={{ marginBottom: 44 }}>
          <div>
            <div style={{ fontSize: 38, fontWeight: 900, color: '#fff', letterSpacing: -1.5, lineHeight: 1 }}>ETORK</div>
            <div style={{ fontSize: 10, color: '#e6b800', fontWeight: 800, letterSpacing: 5, marginTop: 3 }}>BRASIL</div>
            <div style={{ fontSize: 9, color: '#333', letterSpacing: 2.5, marginTop: 6 }}>REMAP · CHIP · PERFORMANCE</div>
          </div>
        </div>

        <div style={{ marginBottom: 32 }}>
          <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 700, margin: '0 0 6px' }}>Novo Cadastro</h1>
          <p style={{ color: '#444', fontSize: 13, margin: 0 }}>Crie sua conta de franqueado e acesse o portal.</p>
        </div>

        <form onSubmit={handleRegister}>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>E-MAIL</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="seu@email.com"
              style={inputStyle}
              onFocus={e => e.currentTarget.style.borderColor = '#e6b800'}
              onBlur={e => e.currentTarget.style.borderColor = '#2a2a2a'}
            />
          </div>

          <div style={{ marginBottom: 16, position: 'relative' }}>
            <label style={labelStyle}>SENHA</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={{ ...inputStyle, paddingRight: 42 }}
              onFocus={e => e.currentTarget.style.borderColor = '#e6b800'}
              onBlur={e => e.currentTarget.style.borderColor = '#2a2a2a'}
            />
            <button type="button" onClick={() => setShowPassword(s => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 14, padding: 0, lineHeight: 1 }}>
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>

          <div style={{ marginBottom: 24, position: 'relative' }}>
            <label style={labelStyle}>CONFIRMAR SENHA</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={{ ...inputStyle, paddingRight: 42 }}
              onFocus={e => e.currentTarget.style.borderColor = '#e6b800'}
              onBlur={e => e.currentTarget.style.borderColor = '#2a2a2a'}
            />
            <button type="button" onClick={() => setShowPassword(s => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 14, padding: 0, lineHeight: 1 }}>
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>

          {message.text && (
            <div style={{ padding: '10px 14px', marginBottom: 18, borderRadius: 10, fontSize: 13, lineHeight: 1.5, background: message.type === 'error' ? '#150a0a' : '#0a1510', border: `1px solid ${message.type === 'error' ? '#4f1c1c' : '#153a22'}`, color: message.type === 'error' ? '#f87171' : '#7dd3fc' }}>
              {message.text}
            </div>
          )}

          <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', background: loading ? '#2a2500' : '#e6b800', color: '#000', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, letterSpacing: 1, cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.15s' }}>
            {loading ? 'REGISTRANDO...' : 'CADASTRAR AGORA'}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <span style={{ color: '#555', fontSize: 12 }}>Já tem conta? </span>
          <a href="/login" style={{ color: '#e6b800', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>Fazer Login</a>
        </div>

        <div style={{ position: 'absolute', bottom: 20, left: 0, right: 0, textAlign: 'center' }}>
          <p style={{ fontSize: 10, color: '#252525', letterSpacing: 0.5, margin: 0 }}>(67) 99254-9181 · @etorkbrasil · Campo Grande/MS</p>
        </div>
      </div>

      <div style={{ flex: 1, background: '#060606', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, transparent 0%, #cc2200 30%, #e6b800 60%, transparent 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(230,184,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(230,184,0,0.04) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
        <div style={{ position: 'absolute', top: '38%', left: '50%', transform: 'translate(-50%, -50%)', width: 480, height: 480, borderRadius: '50%', background: 'radial-gradient(circle, rgba(230,184,0,0.06) 0%, transparent 68%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 420, padding: 24, textAlign: 'center' }}>
          <img src={logoUrl} alt="Etork Brasil" style={{ width: 180, maxWidth: '100%', marginBottom: 24, filter: 'brightness(0) invert(1)' }} />
          <div style={{ color: '#fff', fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Bem-vindo ao portal Etork</div>
          <p style={{ color: '#999', fontSize: 14, lineHeight: 1.7, margin: 0 }}>Cadastre sua conta e acesse o painel de franqueados para acompanhar pedidos, finanças e novidades da rede.</p>
        </div>
      </div>
    </div>
  );
}
