import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase'; // Importe o supabase direto para funções extras

export default function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (err: unknown) {
      setMessage({ type: 'error', text: (err as Error).message || 'Erro ao fazer login.' });
    } finally {
      setLoading(false);
    }
  }

  // Função para Esqueci Senha (via E-mail)
  async function handleForgotPassword() {
    if (!email) {
      setMessage({ type: 'error', text: 'Digite seu e-mail primeiro para recuperar a senha.' });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    
    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'E-mail de recuperação enviado!' });
    }
    setLoading(false);
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0a0a', display: 'flex',
      alignItems: 'center', justifyContent: 'center', fontFamily: '"Inter", sans-serif',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Background grid e Glow (mantidos conforme seu original) */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.04, backgroundImage: 'linear-gradient(#e6b800 1px, transparent 1px), linear-gradient(90deg, #e6b800 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      <div style={{ width: '100%', maxWidth: 400, padding: '0 24px', position: 'relative' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 42, fontWeight: 900, color: '#fff', letterSpacing: -1, lineHeight: 1 }}>ETORK</div>
          <div style={{ fontSize: 11, color: '#e6b800', fontWeight: 700, letterSpacing: 5, marginTop: 4 }}>BRASIL</div>
        </div>

        {/* Card */}
        <div style={{ background: '#111', border: '1px solid #222', borderRadius: 16, padding: 32 }}>
          <h1 style={{ color: '#fff', fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Acessar Portal</h1>
          <p style={{ color: '#555', fontSize: 13, marginBottom: 28 }}>Entre com suas credenciais de franqueado</p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#888', marginBottom: 6 }}>E-MAIL</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="seu@email.com"
                style={{ width: '100%', padding: '12px', background: '#0d0d0d', border: '1px solid #2a2a2a', borderRadius: 8, color: '#fff', fontSize: 14, outline: 'none' }}
              />
            </div>

            <div style={{ marginBottom: 8 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#888', marginBottom: 6 }}>SENHA</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)} required
                placeholder="••••••••"
                style={{ width: '100%', padding: '12px', background: '#0d0d0d', border: '1px solid #2a2a2a', borderRadius: 8, color: '#fff', fontSize: 14, outline: 'none' }}
              />
            </div>

            {/* Link Esqueci Senha */}
            <div style={{ textAlign: 'right', marginBottom: 24 }}>
              <button 
                type="button" 
                onClick={handleForgotPassword}
                style={{ background: 'none', border: 'none', color: '#e6b800', fontSize: 11, fontWeight: 600, cursor: 'pointer', padding: 0 }}
              >
                ESQUECEU A SENHA?
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
              type="submit" disabled={loading}
              style={{ width: '100%', padding: '13px', background: loading ? '#2a2a00' : '#e6b800', color: '#000', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'PROCESSANDO...' : 'ENTRAR'}
            </button>
          </form>

          {/* Link para Cadastro */}
          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <span style={{ color: '#555', fontSize: 12 }}>Não tem conta? </span>
            <button 
              type="button"
              style={{ background: 'none', border: 'none', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
              onClick={() => window.location.href = '/register'} // Ou use <Link> se tiver rotas
            >
              Solicitar Acesso
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