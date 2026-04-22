import logoImg from '../assets/logoetork.png';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function ResetPasswordPage() {
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (password.length < 6) {
      setMessage({ type: 'error', text: 'A senha deve ter pelo menos 6 caracteres.' });
      return;
    }

    if (password !== confirm) {
      setMessage({ type: 'error', text: 'As senhas nao coincidem.' });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      setDone(true);
      setTimeout(() => navigate('/dashboard'), 3000);
    } catch (err: unknown) {
      setMessage({
        type: 'error',
        text: (err as Error).message || 'Erro ao redefinir senha. Tente novamente.',
      });
    } finally {
      setLoading(false);
    }
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

  const EyeIcon = ({ open }: { open: boolean }) =>
    open ? (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
        <line x1="2" y1="2" x2="22" y2="22" />
      </svg>
    ) : (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );

  const strength = (() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 6) s++;
    if (password.length >= 10) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  })();

  const strengthLabel = ['', 'Muito fraca', 'Fraca', 'Regular', 'Boa', 'Forte'][strength];
  const strengthColor = ['', '#c0392b', '#e67e22', '#f1c40f', '#27ae60', '#2ecc71'][strength];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        fontFamily: '"Inter", "Helvetica Neue", sans-serif',
      }}
    >
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img
            src={logoImg}
            alt="Etork Brasil"
            style={{ height: 80, width: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))' }}
          />
        </div>

        <div
          style={{
            background: '#111',
            border: '1px solid #1e1e1e',
            borderRadius: 12,
            padding: '32px 28px',
          }}
        >
          {!ready && !done && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  border: '2px solid #222',
                  borderTop: '2px solid #c8c8c8',
                  margin: '0 auto 16px',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
              <p style={{ color: '#555', fontSize: 13, lineHeight: 1.6 }}>Verificando o link de redefinicao...</p>
              <p style={{ color: '#333', fontSize: 11, marginTop: 8 }}>
                Se este estado persistir, o link pode ter expirado.{' '}
                <a href="/login" style={{ color: '#c8c8c8', textDecoration: 'none', fontWeight: 700 }}>
                  Solicitar novo link
                </a>
              </p>
            </div>
          )}

          {done && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  background: 'rgba(46,204,113,0.1)',
                  border: '1px solid rgba(46,204,113,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2ecc71" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Senha redefinida!</h2>
              <p style={{ color: '#555', fontSize: 13, lineHeight: 1.6 }}>
                Sua senha foi alterada com sucesso.
                <br />
                Redirecionando para o dashboard...
              </p>
            </div>
          )}

          {ready && !done && (
            <>
              <div style={{ marginBottom: 28 }}>
                <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: '0 0 6px' }}>Redefinir Senha</h1>
                <p style={{ color: '#444', fontSize: 13, margin: 0 }}>Escolha uma nova senha para sua conta.</p>
              </div>

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>NOVA SENHA</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="Minimo 6 caracteres"
                      style={{ ...inputStyle, paddingRight: 42 }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = '#c8c8c8')}
                      onBlur={(e) => (e.currentTarget.style.borderColor = '#1e1e1e')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      style={{
                        position: 'absolute',
                        right: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#555',
                        cursor: 'pointer',
                        padding: 0,
                        lineHeight: 1,
                      }}
                    >
                      <EyeIcon open={showPassword} />
                    </button>
                  </div>

                  {password && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            style={{
                              flex: 1,
                              height: 3,
                              borderRadius: 2,
                              background: i <= strength ? strengthColor : '#1e1e1e',
                              transition: 'background 0.2s',
                            }}
                          />
                        ))}
                      </div>
                      <span style={{ fontSize: 10, color: strengthColor, fontWeight: 600, letterSpacing: 0.5 }}>{strengthLabel}</span>
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: 22 }}>
                  <label style={labelStyle}>CONFIRMAR SENHA</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      required
                      placeholder="Repita a nova senha"
                      style={{
                        ...inputStyle,
                        paddingRight: 42,
                        borderColor:
                          confirm && confirm !== password
                            ? '#c0392b'
                            : confirm && confirm === password
                            ? '#27ae60'
                            : '#1e1e1e',
                      }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = '#c8c8c8')}
                      onBlur={(e) => {
                        if (confirm && confirm !== password) e.currentTarget.style.borderColor = '#c0392b';
                        else if (confirm && confirm === password) e.currentTarget.style.borderColor = '#27ae60';
                        else e.currentTarget.style.borderColor = '#1e1e1e';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((s) => !s)}
                      style={{
                        position: 'absolute',
                        right: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#555',
                        cursor: 'pointer',
                        padding: 0,
                        lineHeight: 1,
                      }}
                    >
                      <EyeIcon open={showConfirm} />
                    </button>
                  </div>
                </div>

                {message.text && (
                  <div
                    style={{
                      padding: '10px 14px',
                      marginBottom: 16,
                      borderRadius: 8,
                      fontSize: 12,
                      lineHeight: 1.5,
                      background: '#1e1e1e',
                      border: `1px solid ${message.type === 'error' ? '#c0392b44' : '#27ae6044'}`,
                      color: message.type === 'error' ? '#e74c3c' : '#2ecc71',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    {message.type === 'error' ? (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    ) : (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                    {message.text}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '14px',
                    background: loading ? '#1e1e1e' : '#c8c8c8',
                    color: '#000',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 800,
                    letterSpacing: 1.5,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'background 0.15s',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) e.currentTarget.style.background = '#e0e0e0';
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) e.currentTarget.style.background = '#c8c8c8';
                  }}
                >
                  {loading ? (
                    'SALVANDO...'
                  ) : (
                    <>
                      SALVAR NOVA SENHA
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <a href="/login" style={{ color: '#333', fontSize: 12, textDecoration: 'none', fontWeight: 600, letterSpacing: 0.5 }}>
            <- Voltar ao login
          </a>
        </div>
      </div>
    </div>
  );
}
