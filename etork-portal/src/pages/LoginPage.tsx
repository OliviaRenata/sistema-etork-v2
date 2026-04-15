// src/pages/LoginPage.tsx
//
// ════════════════════════════════════════════════════════════
// COMO USAR SUA LOGO SEM DEFORMAR:
//
// 1. Copie o arquivo  logoetork.png  para a pasta:
//       src/assets/logoetork.png
//
// 2. Descomente a linha de import abaixo:
//       import logoImg from '../assets/logoetork.png';
//
// 3. No JSX, substitua o bloco <LogoFallback /> por:
//       <img
//         src={logoImg}
//         alt="Etork Brasil"
//         style={{
//           height: 60,          // ← defina apenas a altura
//           width: 'auto',       // ← a largura se ajusta sozinha
//           objectFit: 'contain',
//           display: 'block',
//         }}
//       />
//
// ⚠️  NUNCA defina width E height ao mesmo tempo sem objectFit,
//     pois isso estica/comprime a imagem.
// ════════════════════════════════════════════════════════════

import logoImg from '../assets/logoetork.png';

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (err: unknown) {
      setMessage({ type: 'error', text: (err as Error).message || 'Credenciais inválidas.' });
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!email) {
      setMessage({ type: 'error', text: 'Digite seu e-mail primeiro.' });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setMessage(error
      ? { type: 'error', text: error.message }
      : { type: 'success', text: 'E-mail de recuperação enviado! Verifique sua caixa.' }
    );
    setLoading(false);
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', fontFamily: '"Inter", "Helvetica Neue", sans-serif' }}>

      {/* ─── ESQUERDA: formulário ───────────────────────────────── */}
      <div style={{
        width: 460, minHeight: '100vh', flexShrink: 0,
        background: '#0a0a0a',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '48px 44px', position: 'relative',
      }}>
        {/* Borda direita dourada */}
        <div style={{
          position: 'absolute', right: 0, top: '10%', bottom: '10%', width: 1,
          background: 'linear-gradient(to bottom, transparent, rgba(230,184,0,0.4) 40%, rgba(230,184,0,0.4) 60%, transparent)',
        }} />

        <div style={{ marginBottom: 44, textAlign: 'center' }}>
          <img
            src={logoImg}
            alt="Etork Brasil"
            style={{ height: 72, width: 'auto', objectFit: 'contain', display: 'block', margin: '0 auto' }}
          />
        </div>

        {/* Cabeçalho */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ color: '#fff', fontSize: 21, fontWeight: 700, margin: '0 0 6px' }}>Bem-vindo de volta</h1>
          <p style={{ color: '#444', fontSize: 13, margin: 0 }}>Acesse seu painel de franqueado</p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>E-MAIL</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              required placeholder="seu@email.com"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#e6b800'}
              onBlur={e => e.target.style.borderColor = '#1e1e1e'}
            />
          </div>

          <div style={{ marginBottom: 6 }}>
            <label style={labelStyle}>SENHA</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password} onChange={e => setPassword(e.target.value)}
                required placeholder="••••••••"
                style={{ ...inputStyle, paddingRight: 42 }}
                onFocus={e => e.target.style.borderColor = '#e6b800'}
                onBlur={e => e.target.style.borderColor = '#1e1e1e'}
              />
              <button type="button" onClick={() => setShowPassword(s => !s)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 14, padding: 0, lineHeight: 1 }}>
                {showPassword
                  ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
          </div>

          <div style={{ textAlign: 'right', marginBottom: 22 }}>
            <button type="button" onClick={handleForgotPassword}
              style={{ background: 'none', border: 'none', color: '#e6b800', fontSize: 11, fontWeight: 700, cursor: 'pointer', letterSpacing: 0.5 }}>
              ESQUECEU A SENHA?
            </button>
          </div>

          {message.text && (
            <div style={{
              padding: '10px 14px', marginBottom: 14, borderRadius: 8, fontSize: 12, lineHeight: 1.5,
              background: message.type === 'error' ? '#130808' : '#081308',
              border: `1px solid ${message.type === 'error' ? '#3a1010' : '#103a10'}`,
              color: message.type === 'error' ? '#f87171' : '#4ade80',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              {message.type === 'error' ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              )}
              <span>{message.text}</span>
            </div>
          )}

          <button type="submit" disabled={loading}
            style={{
              width: '100%', padding: '14px',
              background: loading ? '#1a1600' : '#e6b800',
              color: '#000', border: 'none', borderRadius: 8,
              fontSize: 13, fontWeight: 800, letterSpacing: 1.5,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s, box-shadow 0.15s',
              boxShadow: loading ? 'none' : '0 4px 24px rgba(230,184,0,0.18)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
            onMouseEnter={e => { if (!loading) { (e.currentTarget).style.background = '#ffd000'; } }}
            onMouseLeave={e => { if (!loading) { (e.currentTarget).style.background = '#e6b800'; } }}
          >
            {loading ? 'ENTRANDO...' : (
              <>
                ENTRAR NO PORTAL
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </>
            )}
          </button>
        </form>

        {/* Rodapé */}
        <div style={{ marginTop: 28, paddingTop: 22, borderTop: '1px solid #181818', textAlign: 'center' }}>
          <a href="/register" style={{ color: '#e6b800', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
            Novo Cadastro
          </a>
        </div>

        {/* Contato no rodapé */}
        <div style={{ position: 'absolute', bottom: 20, left: 0, right: 0, textAlign: 'center' }}>
          <p style={{ fontSize: 10, color: '#252525', letterSpacing: 0.5, margin: 0 }}>
            (67) 99254-9181 · @etorkbrasil · Campo Grande/MS
          </p>
        </div>
      </div>

      {/* ─── DIREITA: branding visual ──────────────────────────────── */}
      <div style={{
        flex: '0 0 420px', maxWidth: 420, background: '#000',
        position: 'relative', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>

        {/* Faixa vermelha no topo */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: 'linear-gradient(90deg, transparent 0%, #cc2200 30%, #e6b800 60%, transparent 100%)',
        }} />

        {/* Grade de fundo */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: [
            'linear-gradient(rgba(230,184,0,0.04) 1px, transparent 1px)',
            'linear-gradient(90deg, rgba(230,184,0,0.04) 1px, transparent 1px)',
          ].join(', '),
          backgroundSize: '48px 48px',
        }} />

        {/* Glow dourado */}
        <div style={{
          position: 'absolute', top: '38%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 480, height: 480, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(230,184,0,0.06) 0%, transparent 68%)',
          pointerEvents: 'none',
        }} />

        {/* Glow vermelho menor */}
        <div style={{
          position: 'absolute', bottom: '20%', right: '20%',
          width: 200, height: 200, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(204,34,0,0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Xadrez decorativo canto superior direito */}
        <div style={{
          position: 'absolute', top: 24, right: 24,
          width: 48, height: 48, opacity: 0.12,
          backgroundImage: 'repeating-conic-gradient(#e6b800 0% 25%, transparent 0% 50%)',
          backgroundSize: '12px 12px',
          borderRadius: 4,
        }} />

        {/* Xadrez decorativo canto inferior esquerdo */}
        <div style={{
          position: 'absolute', bottom: 90, left: 32,
          width: 64, height: 64, opacity: 0.07,
          backgroundImage: 'repeating-conic-gradient(#cc2200 0% 25%, transparent 0% 50%)',
          backgroundSize: '16px 16px',
          borderRadius: 4,
        }} />

        {/* Conteúdo central */}
        <div style={{ position: 'relative', textAlign: 'center', padding: '0 56px', maxWidth: 560 }}>

          {/* Badge pulsante */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: '#0d0d0d', border: '1px solid #2a2200',
            borderRadius: 30, padding: '7px 18px', marginBottom: 36,
            fontSize: 10, color: '#e6b800', letterSpacing: 2, fontWeight: 700,
          }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%', background: '#e6b800',
              display: 'inline-block',
              boxShadow: '0 0 6px #e6b800',
              animation: 'etorkPulse 2s ease-in-out infinite',
            }} />
            PORTAL DE FRANQUEADOS
          </div>

          {/* Título principal */}
          <div style={{ marginBottom: 8 }}>
            <img
              src={logoImg}
              alt="Etork Brasil"
              style={{ height: 140, width: 'auto', objectFit: 'contain', display: 'block', margin: '0 auto', filter: 'brightness(1.1)' }}
            />
          </div>

          {/* Linha vermelha */}
          <div style={{ width: 50, height: 3, background: '#cc2200', margin: '28px auto', borderRadius: 2 }} />

          {/* Descrição */}
          <p style={{ color: '#3a3a3a', fontSize: 14, lineHeight: 1.9, margin: '0 auto 40px' }}>
            Plataforma de gestão de pedidos,<br />
            arquivos de remap e financeiro<br />
            para franqueados da rede Etork.
          </p>

          {/* Pilares */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            {[
              {
                icon: (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 3h18v6H3z" />
                    <path d="M3 9l9 6 9-6" />
                    <path d="M12 15v6" />
                  </svg>
                ),
                label: 'REMAP',
              },
              {
                icon: (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                ),
                label: 'CHIP',
              },
              {
                icon: (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 3h14l4 4v14H3z" />
                    <path d="M7 7h10v4H7z" />
                  </svg>
                ),
                label: 'PERFORMANCE',
              },
            ].map(({ icon, label }) => (
              <div key={label} style={{
                padding: '9px 20px',
                background: '#0a0a0a', border: '1px solid #1a1a1a',
                borderRadius: 24, fontSize: 10, fontWeight: 700,
                color: '#555', letterSpacing: 1.5,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <span style={{ display: 'inline-flex', width: 16, height: 16, alignItems: 'center', justifyContent: 'center' }}>{icon}</span>
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Barra inferior com stats */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          borderTop: '1px solid #111',
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
        }}>
          {[
            { num: '2017', txt: 'Fundação' },
            { num: 'MS', txt: 'Campo Grande' },
            { num: '100%', txt: 'Próprio' },
          ].map((s, i) => (
            <div key={i} style={{
              padding: '18px 12px', textAlign: 'center',
              borderRight: i < 2 ? '1px solid #111' : 'none',
            }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#e6b800', letterSpacing: -0.5 }}>{s.num}</div>
              <div style={{ fontSize: 9, color: '#333', marginTop: 3, letterSpacing: 1.5 }}>{s.txt.toUpperCase()}</div>
            </div>
          ))}
        </div>

        <style>{`
          @keyframes etorkPulse {
            0%, 100% { opacity: 1; box-shadow: 0 0 6px #e6b800; }
            50% { opacity: 0.4; box-shadow: 0 0 2px #e6b800; }
          }
        `}</style>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 10, fontWeight: 700,
  color: '#444', letterSpacing: 1.5, marginBottom: 7,
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px',
  background: '#0d0d0d', border: '1px solid #1e1e1e',
  borderRadius: 8, color: '#fff', fontSize: 13,
  outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.15s',
};
