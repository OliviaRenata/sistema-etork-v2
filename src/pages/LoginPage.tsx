// src/pages/LoginPage.tsx
//
// ════════════════════════════════════════════════════════════
// LAYOUT CORRIGIDO: LOGO RESPONSIVA OCUPANDO TODA PARTE BRANCA
// ════════════════════════════════════════════════════════════

import logoImg from '../assets/logoetorkbrasil.png';

import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 960);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

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

// src/pages/LoginPage.tsx
// Substitua a função handleForgotPassword inteira por:

async function handleForgotPassword() {
  if (!email) {
    setMessage({ type: 'error', text: 'Digite seu e-mail primeiro.' });
    return;
  }
  
  setLoading(true);
  try {
    // Usar Magic Link - NÃO precisa de SMTP configurado
    const { error } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      }
    });
    
    if (error) throw error;
    
    setMessage({ 
      type: 'success', 
      text: 'Link de acesso enviado! Verifique seu e-mail para fazer login.' 
    });
  } catch (err: unknown) {
    console.error('Erro no magic link:', err);
    setMessage({ 
      type: 'error', 
      text: (err as Error).message || 'Erro ao enviar link. Tente novamente.' 
    });
  } finally {
    setLoading(false);
  }
}

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: isMobile ? 'column' : 'row',
      flexWrap: 'wrap',
      fontFamily: '"Inter", "Helvetica Neue", sans-serif' 
    }}>

      {/* ─── ESQUERDA: formulário (460px fixo) ───────────────────────────────── */}
      <div style={{
        width: isMobile ? '100%' : 460,
        minHeight: isMobile ? '100vh' : '100vh',
        flexShrink: 0,
        background: '#0a0a0a',
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center',
        padding: isMobile ? '28px 18px 22px' : '48px 44px',
        position: 'relative',
      }}>
        {/* Borda direita dourada */}
        <div style={{
          display: isMobile ? 'none' : 'block',
          position: 'absolute', 
          right: 0, 
          top: '10%', 
          bottom: '10%', 
          width: 1,
          background: 'linear-gradient(to bottom, transparent, rgba(230,184,0,0.4) 40%, rgba(230,184,0,0.4) 60%, transparent)',
          zIndex: 2,
        }} />

        {/* Logo pequena no topo do formulário */}
        <div style={{ marginBottom: 44, textAlign: 'center' }}>
          <img
            src={logoImg}
            alt="Etork Brasil"
            style={{ 
              height: isMobile ? 120 : 180,
              width: 'auto', 
              objectFit: 'contain', 
              display: 'block',
              margin: '0 auto',
              borderRadius: 12,
              background: 'transparent',
              padding: 0
            }}
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
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              required 
              placeholder="seu@email.com"
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
                value={password} 
                onChange={e => setPassword(e.target.value)}
                required 
                placeholder="••••••••"
                style={{ ...inputStyle, paddingRight: 42 }}
                onFocus={e => e.target.style.borderColor = '#e6b800'}
                onBlur={e => e.target.style.borderColor = '#1e1e1e'}
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(s => !s)}
                style={{ 
                  position: 'absolute', 
                  right: 12, 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  background: 'none', 
                  border: 'none', 
                  color: '#555', 
                  cursor: 'pointer', 
                  fontSize: 14, 
                  padding: 0, 
                  lineHeight: 1 
                }}>
                {showPassword
                  ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
          </div>

          <div style={{ textAlign: 'right', marginBottom: 22 }}>

<button 
  type="button" 
  onClick={handleForgotPassword}
  style={{ background: 'none', border: 'none', color: '#e6b800', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
>
  ESQUECEU A SENHA?
</button>
          </div>

          {message.text && (
            <div style={{
              padding: '10px 14px', 
              marginBottom: 14, 
              borderRadius: 8, 
              fontSize: 12, 
              lineHeight: 1.5,
              background: message.type === 'error' ? '#1a1500' : '#1a1500',
              border: `1px solid ${message.type === 'error' ? '#3a3000' : '#3a3000'}`,
              color: message.type === 'error' ? '#e6b800' : '#e6b800',
              display: 'flex', 
              alignItems: 'center', 
              gap: 8,
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
              width: '100%', 
              padding: '14px',
              background: loading ? '#1a1600' : '#e6b800',
              color: '#000', 
              border: 'none', 
              borderRadius: 8,
              fontSize: 13, 
              fontWeight: 800, 
              letterSpacing: 1.5,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s, box-shadow 0.15s',
              boxShadow: loading ? 'none' : '0 4px 24px rgba(230,184,0,0.18)',
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: 8,
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
        <div style={{ position: isMobile ? 'static' : 'absolute', marginTop: isMobile ? 18 : 0, bottom: 0, left: 0, right: 0, textAlign: 'center', background: '#000', padding: '14px 0' }}>
          <p style={{ fontSize: 10, color: '#999', letterSpacing: 0.5, margin: 0 }}>
            (67) 99254-9181 · @etorkbrasil · Campo Grande/MS
          </p>
        </div>
      </div>

      {/* ─── DIREITA: área BRANCA com logo RESPONSIVA ocupando TODO espaço ──── */}
      <div style={{
        display: isMobile ? 'none' : 'flex',
        flex: 1,              // ← ocupa todo espaço restante (responsivo!)
        background: '#000000', // ← FUNDO BRANCO como na imagem
        position: 'relative',
        overflow: 'hidden',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '40px',
      }}>

        {/* Sutil textura de fundo */}
        <div style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.03,
          backgroundImage: `radial-gradient(circle at 25% 40%, #000 1.5px, transparent 1.5px)`,
          backgroundSize: '32px 32px',
          pointerEvents: 'none',
        }} />

        {/* CONTEÚDO CENTRALIZADO - LOGO GRANDE ocupando espaço */}
        <div style={{ 
          textAlign: 'center', 
          maxWidth: '90%',
          width: '100%',
        }}>
          
          {/* LOGO RESPONSIVA - ocupa toda largura disponível */}
          <img
            src={logoImg}
            alt="Etork Brasil"
            style={{
              width: '100%',
              maxWidth: 700,
              minWidth: 220,
              height: 'auto',
              objectFit: 'contain',
              display: 'block',
              margin: '0 auto 48px auto',
              borderRadius: 12,
              background: 'transparent',
            }}
          />

          {/* Badge/tagline */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: '#f5f5f5',
            border: '1px solid #e0e0e0',
            borderRadius: 30,
            padding: '8px 24px',
            marginBottom: 32,
          }}>
            <span style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#e6b800',
              display: 'inline-block',
            }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#333', letterSpacing: 2 }}>
              PORTAL · SLAVE 
            </span>
          </div>

          {/* Descrição */}
          <p style={{ 
            color: '#666', 
            fontSize: 15, 
            lineHeight: 1.8, 
            maxWidth: 400, 
            margin: '0 auto',
          }}>
            Plataforma de gestão de pedidos,<br />
            arquivos de remap e financeiro<br />
            para franqueados da rede Etork.
          </p>
        </div>

        {/* Rodapé com stats na parte inferior */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          borderTop: '1px solid #3f3f3f',
          display: 'flex',
          justifyContent: 'center',
          gap: 48,
          padding: '20px 32px',
          background: '#000000',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#e6b800' }}>2017</div>
            <div style={{ fontSize: 10, color: '#999', letterSpacing: 1 }}>FUNDAÇÃO</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#e6b800' }}>MS</div>
            <div style={{ fontSize: 10, color: '#999', letterSpacing: 1 }}>CAMPO GRANDE</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#e6b800' }}>100%</div>
            <div style={{ fontSize: 10, color: '#999', letterSpacing: 1 }}>PRÓPRIO</div>
          </div>
        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block', 
  fontSize: 10, 
  fontWeight: 700,
  color: '#444', 
  letterSpacing: 1.5, 
  marginBottom: 7,
};

const inputStyle: React.CSSProperties = {
  width: '100%', 
  padding: '12px 14px',
  background: '#0d0d0d', 
  border: '1px solid #1e1e1e',
  borderRadius: 8, 
  color: '#fff', 
  fontSize: 13,
  outline: 'none', 
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
};