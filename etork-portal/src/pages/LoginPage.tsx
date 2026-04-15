// src/pages/LoginPage.tsx
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (err: unknown) {
      setError((err as Error).message || 'Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '"Inter", "Helvetica Neue", sans-serif',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background grid lines */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.04,
        backgroundImage: 'linear-gradient(#e6b800 1px, transparent 1px), linear-gradient(90deg, #e6b800 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />

      {/* Glow effect */}
      <div style={{
        position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(230,184,0,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: 400, padding: '0 24px', position: 'relative' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 42, fontWeight: 900, color: '#fff', letterSpacing: -1, lineHeight: 1 }}>
            ETORK
          </div>
          <div style={{ fontSize: 11, color: '#e6b800', fontWeight: 700, letterSpacing: 5, marginTop: 4 }}>
            BRASIL
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            marginTop: 12, padding: '4px 16px',
            border: '1px solid #2a2a00', borderRadius: 20,
            fontSize: 10, color: '#888', letterSpacing: 2,
          }}>
            REMAP · CHIP · PERFORMANCE
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: '#111',
          border: '1px solid #222',
          borderRadius: 16,
          padding: 32,
        }}>
          <h1 style={{ color: '#fff', fontSize: 18, fontWeight: 600, marginBottom: 4, margin: '0 0 4px' }}>
            Acessar Portal
          </h1>
          <p style={{ color: '#555', fontSize: 13, marginBottom: 28, margin: '0 0 28px' }}>
            Entre com suas credenciais de franqueado
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#888', letterSpacing: 1, marginBottom: 6 }}>
                E-MAIL
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="seu@email.com"
                style={{
                  width: '100%', padding: '12px 14px',
                  background: '#0d0d0d', border: '1px solid #2a2a2a',
                  borderRadius: 8, color: '#fff', fontSize: 14,
                  outline: 'none', boxSizing: 'border-box',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => e.target.style.borderColor = '#e6b800'}
                onBlur={e => e.target.style.borderColor = '#2a2a2a'}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#888', letterSpacing: 1, marginBottom: 6 }}>
                SENHA
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={{
                  width: '100%', padding: '12px 14px',
                  background: '#0d0d0d', border: '1px solid #2a2a2a',
                  borderRadius: 8, color: '#fff', fontSize: 14,
                  outline: 'none', boxSizing: 'border-box',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => e.target.style.borderColor = '#e6b800'}
                onBlur={e => e.target.style.borderColor = '#2a2a2a'}
              />
            </div>

            {error && (
              <div style={{
                padding: '10px 14px', marginBottom: 16,
                background: '#1a0a0a', border: '1px solid #3a1a1a',
                borderRadius: 8, color: '#e74c3c', fontSize: 13,
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '13px',
                background: loading ? '#2a2a00' : '#e6b800',
                color: '#000', border: 'none', borderRadius: 8,
                fontSize: 13, fontWeight: 700, letterSpacing: 1,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {loading ? 'ENTRANDO...' : 'ENTRAR'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: '#333' }}>
          Portal exclusivo para franqueados Etork Brasil
        </p>
      </div>
    </div>
  );
}
