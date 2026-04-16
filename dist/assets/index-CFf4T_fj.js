// src/pages/LoginPage.jsx

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
  const [isDarkMode, setIsDarkMode] = useState(true);

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Credenciais inválidas.' });
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

  const theme = {
    background: isDarkMode ? '#000' : '#ffffff',
    textColor: isDarkMode ? '#ffffff' : '#000000',
    subTextColor: isDarkMode ? '#aaa' : '#666',
    badgeBg: isDarkMode ? '#111' : '#f5f5f5',
    badgeBorder: isDarkMode ? '#222' : '#e0e0e0',
    badgeText: isDarkMode ? '#888' : '#555',
    statBg: isDarkMode ? '#000' : '#ffffff',
    statBorder: isDarkMode ? '#1a1a1a' : '#eee',
    statText: isDarkMode ? '#555' : '#999',
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'row',
      flexWrap: 'wrap',
      fontFamily: '"Inter", "Helvetica Neue", sans-serif' 
    }}>
      {/* ESQUERDA: formulário */}
      <div style={{
        width: 460, 
        minHeight: '100vh', 
        flexShrink: 0,
        background: '#0a0a0a',
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center',
        padding: '48px 44px', 
        position: 'relative',
      }}>
        {/* Borda direita dourada */}
        <div style={{
          position: 'absolute', 
          right: 0, 
          top: '10%', 
          bottom: '10%', 
          width: 1,
          background: 'linear-gradient(to bottom, transparent, rgba(230,184,0,0.4) 40%, rgba(230,184,0,0.4) 60%, transparent)',
          zIndex: 2,
        }} />

        {/* Logo pequena no topo */}
        <div style={{ marginBottom: 44, textAlign: 'center' }}>
          <img
            src={logoImg}
            alt="Etork Brasil"
            style={{ height: 60, width: 'auto', objectFit: 'contain', display: 'block', margin: '0 auto' }}
          />
        </div>

        {/* Cabeçalho */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ color: '#fff', fontSize: 21, fontWeight: 700, margin: '0 0 6px' }}>Bem-vindo de volta</h1>
          <p style={{ color: '#444', fontSize: 13, margin: 0 }}>Acesse seu painel de franqueado</p>
        </div>

        {/* Botão toggle tema */}
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            background: 'transparent',
            border: '1px solid #333',
            borderRadius: 20,
            padding: '6px 12px',
            color: '#888',
            fontSize: 11,
            cursor: 'pointer',
            zIndex: 10,
          }}
        >
          {isDarkMode ? '☀️ Claro' : '🌙 Escuro'}
        </button>

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
                {showPassword ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                    <line x1="2" y1="2" x2="22" y2="22"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
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
              padding: '10px 14px', 
              marginBottom: 14, 
              borderRadius: 8, 
              fontSize: 12, 
              lineHeight: 1.5,
              background: message.type === 'error' ? '#130808' : '#081308',
              border: `1px solid ${message.type === 'error' ? '#3a1010' : '#103a10'}`,
              color: message.type === 'error' ? '#f87171' : '#4ade80',
              display: 'flex', 
              alignItems: 'center', 
              gap: 8,
            }}>
              {message.type === 'error' ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = '#ffd000'; } }}
            onMouseLeave={e => { if (!loading) { e.currentTarget.style.background = '#e6b800'; } }}
          >
            {loading ? 'ENTRANDO...' : (
              <>
                ENTRAR NO PORTAL
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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

      {/* DIREITA: área com tema dinâmico */}
      <div style={{
        flex: 1,
        background: theme.background,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '40px',
        transition: 'background 0.3s ease',
      }}>
        {/* Textura de fundo */}
        <div style={{
          position: 'absolute',
          inset: 0,
          opacity: isDarkMode ? 0.03 : 0.02,
          backgroundImage: `radial-gradient(circle at 25% 40%, ${theme.textColor} 1.5px, transparent 1.5px)`,
          backgroundSize: '32px 32px',
          pointerEvents: 'none',
        }} />

        {/* Conteúdo central */}
        <div style={{ textAlign: 'center', maxWidth: '90%', width: '100%' }}>
          {/* Logo responsiva */}
          <img
            src={logoImg}
            alt="Etork Brasil"
            style={{ 
              width: '100%',
              maxWidth: 500,
              height: 'auto',
              objectFit: 'contain',
              display: 'block',
              margin: '0 auto 32px auto',
            }}
          />

          {/* Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: theme.badgeBg,
            border: `1px solid ${theme.badgeBorder}`,
            borderRadius: 30,
            padding: '8px 24px',
            marginBottom: 32,
            transition: 'all 0.3s ease',
          }}>
            <span style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#e6b800',
              display: 'inline-block',
            }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: theme.badgeText, letterSpacing: 2 }}>
              REMAP · CHIP · PERFORMANCE
            </span>
          </div>

          {/* Descrição */}
          <p style={{ 
            color: theme.subTextColor,
            fontSize: 15, 
            lineHeight: 1.8, 
            maxWidth: 400, 
            margin: '0 auto',
            transition: 'color 0.3s ease',
          }}>
            Plataforma de gestão de pedidos,<br />
            arquivos de remap e financeiro<br />
            para franqueados da rede Etork.
          </p>
        </div>

        {/* Rodapé com stats */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          borderTop: `1px solid ${theme.statBorder}`,
          display: 'flex',
          justifyContent: 'center',
          gap: 48,
          padding: '20px 32px',
          background: theme.statBg,
          transition: 'all 0.3s ease',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#e6b800' }}>2017</div>
            <div style={{ fontSize: 10, color: theme.statText, letterSpacing: 1 }}>FUNDAÇÃO</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#e6b800' }}>MS</div>
            <div style={{ fontSize: 10, color: theme.statText, letterSpacing: 1 }}>CAMPO GRANDE</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#e6b800' }}>100%</div>
            <div style={{ fontSize: 10, color: theme.statText, letterSpacing: 1 }}>PRÓPRIO</div>
          </div>
        </div>
      </div>
    </div>
  );
}

const labelStyle = {
  display: 'block', 
  fontSize: 10, 
  fontWeight: 700,
  color: '#444', 
  letterSpacing: 1.5, 
  marginBottom: 7,
};

const inputStyle = {
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