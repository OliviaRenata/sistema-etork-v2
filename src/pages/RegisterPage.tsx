// src/pages/RegisterPage.tsx

import logoImg from '../assets/logoetork.png';
import { useState, FormEvent, useEffect } from 'react';
import { supabase } from '../lib/supabase';

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
  const [email, setEmail] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>(''); // NOVO: nome da empresa
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: string; text: string }>({ type: '', text: '' });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 960);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage({ type: '', text: '' });

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'As senhas não coincidem.' });
      return;
    }

    if (!companyName.trim()) {
      setMessage({ type: 'error', text: 'Informe o nome da empresa.' });
      return;
    }

    setLoading(true);
    try {
      // 1. Criar usuário no auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            company_name: companyName, // Envia o nome da empresa no metadata
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        // 2. Criar perfil na tabela profiles
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{ 
            id: data.user.id, 
            role: 'franchisee', 
            full_name: companyName 
          }]);

        if (profileError) throw profileError;

        // 3. Criar franqueado na tabela franchisees
        const companyCode = `FRAN${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        
        const { error: franchiseeError } = await supabase
          .from('franchisees')
          .insert([{
            user_id: data.user.id,
            company_name: companyName,
            code: companyCode,
            active: false,
            approved: false,
            balance: 0,
            credit_limit: 1000,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);

        if (franchiseeError) throw franchiseeError;

        setMessage({
          type: 'success',
          text: `Cadastro realizado! Seu acesso será liberado após aprovação do administrador. Fique atento ao seu e-mail.`,
        });
        
        // Limpar formulário
        setEmail('');
        setCompanyName('');
        setPassword('');
        setConfirmPassword('');
        
        // Redirecionar para login após 4 segundos
        setTimeout(() => {
          window.location.href = '/login';
        }, 4000);
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      console.error('Erro no cadastro:', error);
      setMessage({ 
        type: 'error', 
        text: error?.message || 'Erro ao realizar cadastro.' 
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: isMobile ? 'column' : 'row', background: '#000', fontFamily: '"Inter", sans-serif' }}>
      <div style={{ width: isMobile ? '100%' : 460, minHeight: '100vh', flexShrink: 0, background: '#0a0a0a', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: isMobile ? '28px 18px 22px' : '48px 44px', position: 'relative' }}>
        <div style={{ display: isMobile ? 'none' : 'block', position: 'absolute', right: 0, top: '10%', bottom: '10%', width: 1, background: 'linear-gradient(to bottom, transparent, rgba(200,200,200,0.4) 40%, rgba(200,200,200,0.4) 60%, transparent)' }} />

        <div style={{ marginBottom: 44, textAlign: 'center' }}>
          <img
            src={logoImg}
            alt="Etork Brasil"
            style={{ height: isMobile ? 52 : 60, width: 'auto', objectFit: 'contain', display: 'block', margin: '0 auto' }}
          />
        </div>

        <div style={{ marginBottom: 32 }}>
          <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 700, margin: '0 0 6px' }}>Novo Cadastro</h1>
          <p style={{ color: '#444', fontSize: 13, margin: 0 }}>Crie sua conta de franqueado e acesse o portal.</p>
        </div>

        <form onSubmit={handleRegister}>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>NOME DA EMPRESA *</label>
            <input
              type="text"
              value={companyName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompanyName(e.target.value)}
              required
              placeholder="Ex: ETORK RJ"
              style={inputStyle}
              onFocus={(e: React.FocusEvent<HTMLInputElement>) => e.currentTarget.style.borderColor = '#c8c8c8'}
              onBlur={(e: React.FocusEvent<HTMLInputElement>) => e.currentTarget.style.borderColor = '#2a2a2a'}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>E-MAIL *</label>
            <input
              type="email"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              required
              placeholder="seu@email.com"
              style={inputStyle}
              onFocus={(e: React.FocusEvent<HTMLInputElement>) => e.currentTarget.style.borderColor = '#c8c8c8'}
              onBlur={(e: React.FocusEvent<HTMLInputElement>) => e.currentTarget.style.borderColor = '#2a2a2a'}
            />
          </div>

          <div style={{ marginBottom: 16, position: 'relative' }}>
            <label style={labelStyle}>SENHA *</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={{ ...inputStyle, paddingRight: 42 }}
              onFocus={(e: React.FocusEvent<HTMLInputElement>) => e.currentTarget.style.borderColor = '#c8c8c8'}
              onBlur={(e: React.FocusEvent<HTMLInputElement>) => e.currentTarget.style.borderColor = '#2a2a2a'}
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)} 
              style={{ 
                position: 'absolute', 
                right: 12, 
                top: '50%', 
                transform: 'translateY(-50%)', 
                background: 'none', 
                border: 'none', 
                color: '#888', 
                cursor: 'pointer', 
                fontSize: 14, 
                padding: 0, 
                lineHeight: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
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

          <div style={{ marginBottom: 24, position: 'relative' }}>
            <label style={labelStyle}>CONFIRMAR SENHA *</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={{ ...inputStyle, paddingRight: 42 }}
              onFocus={(e: React.FocusEvent<HTMLInputElement>) => e.currentTarget.style.borderColor = '#c8c8c8'}
              onBlur={(e: React.FocusEvent<HTMLInputElement>) => e.currentTarget.style.borderColor = '#2a2a2a'}
            />
          </div>

          {message.text && (
            <div style={{ 
              padding: '10px 14px', 
              marginBottom: 18, 
              borderRadius: 10, 
              fontSize: 13, 
              lineHeight: 1.5, 
              background: message.type === 'error' ? '#1e1e1e' : '#0a1510', 
              border: `1px solid ${message.type === 'error' ? '#444333' : '#444333'}`, 
              color: message.type === 'error' ? '#c8c8c8' : '#d4d4d4' 
            }}>
              {message.text}
            </div>
          )}

          <button type="submit" disabled={loading} style={{ 
            width: '100%', 
            padding: '14px', 
            background: loading ? '#222222' : '#c8c8c8', 
            color: '#000', 
            border: 'none', 
            borderRadius: 10, 
            fontSize: 14, 
            fontWeight: 700, 
            letterSpacing: 1, 
            cursor: loading ? 'not-allowed' : 'pointer', 
            transition: 'background 0.15s' 
          }}>
            {loading ? 'REGISTRANDO...' : 'CADASTRAR AGORA'}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <span style={{ color: '#555', fontSize: 12 }}>Já tem conta? </span>
          <a href="/login" style={{ color: '#c8c8c8', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>Fazer Login</a>
        </div>

        <div style={{ position: isMobile ? 'static' : 'absolute', marginTop: isMobile ? 18 : 0, bottom: 0, left: 0, right: 0, textAlign: 'center', background: '#000', padding: '14px 0' }}>
          <p style={{ fontSize: 10, color: '#999', letterSpacing: 0.5, margin: 0 }}>(67) 99254-9181 · @etorkbrasil · Campo Grande/MS</p>
        </div>
      </div>

      <div style={{ display: isMobile ? 'none' : 'flex', flex: 1, background: '#000', position: 'relative', overflow: 'hidden', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, transparent 0%, #c8c8c8 30%, #c8c8c8 60%, transparent 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(230,184,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(230,184,0,0.04) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
        <div style={{ position: 'absolute', top: '38%', left: '50%', transform: 'translate(-50%, -50%)', width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle, rgba(230,184,0,0.06) 0%, transparent 68%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 420, padding: 24, textAlign: 'center' }}>
          <img 
            src={logoImg} 
            alt="Etork Brasil" 
            style={{ width: 180, maxWidth: '100%', marginBottom: 24, objectFit: 'contain' }} 
          />
          <div style={{ color: '#fff', fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Bem-vindo ao portal Etork</div>
          <p style={{ color: '#999', fontSize: 14, lineHeight: 1.7, margin: 0 }}>Cadastre sua conta e acesse o painel de franqueados para acompanhar pedidos, finanças e novidades da rede.</p>
        </div>
      </div>
    </div>
  );
}