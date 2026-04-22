// src/pages/admin/Franchisees.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';
import { formatDate } from '../../lib/utils';

export default function AdminFranchisees() {
  const { isAdmin } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  const [franchisees, setFranchisees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const colors = {
    background: isDark ? '#0d0d0d' : '#f3f4f6',
    surface: isDark ? '#141414' : '#ffffff',
    text: isDark ? '#e5e5e5' : '#1a1a1a',
    textSecondary: isDark ? '#888888' : '#777777',
    border: isDark ? '#222222' : '#e5e7eb',
    accent: '#c8c8c8',
  };

  if (!isAdmin) {
    return (
      <div style={{ padding: isMobile ? 24 : 60, textAlign: 'center' }}>
        <h2>Acesso negado</h2>
        <p>Você não tem permissão para acessar esta página.</p>
      </div>
    );
  }

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    loadFranchisees();
    return () => window.removeEventListener('resize', onResize);
  }, []);

  async function loadFranchisees() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('franchisees')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setFranchisees(data || []);
    } catch (error) {
      console.error('Erro ao carregar franqueados:', error);
    } finally {
      setLoading(false);
    }
  }

  async function approveFranchisee(franchiseeId: string) {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('franchisees')
        .update({ approved: true, active: true, updated_at: new Date().toISOString() })
        .eq('id', franchiseeId);

      if (error) throw error;
      await loadFranchisees();
    } catch (error) {
      console.error('Erro ao aprovar franqueado:', error);
    } finally {
      setUpdating(false);
    }
  }

  async function toggleFranchiseeStatus(franchiseeId: string, currentStatus: boolean) {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('franchisees')
        .update({ active: !currentStatus, updated_at: new Date().toISOString() })
        .eq('id', franchiseeId);

      if (error) throw error;
      await loadFranchisees();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
    } finally {
      setUpdating(false);
    }
  }

  async function deleteFranchisee(franchiseeId: string) {
    if (!confirm('Tem certeza? Isso também excluirá todos os pedidos deste franqueado!')) return;
    
    try {
      const { error } = await supabase
        .from('franchisees')
        .delete()
        .eq('id', franchiseeId);

      if (error) throw error;
      await loadFranchisees();
    } catch (error) {
      console.error('Erro ao excluir franqueado:', error);
    }
  }

  const pending = franchisees.filter(f => !f.approved);
  const approved = franchisees.filter(f => f.approved);

  const btnApprove: React.CSSProperties = {
    padding: '6px 14px',
    background: '#2e2e2e',
    color: '#c8c8c8',
    border: '1px solid #2e2e2e',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.5,
  };

  const btnToggle = (active: boolean): React.CSSProperties => ({
    padding: '6px 12px',
    background: active ? '#2a2a2a' : '#252525',
    color: active ? '#a0a0a0' : '#c8c8c8',
    border: `1px solid ${active ? '#3a3a3a' : '#2e2e2e'}`,
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 11,
    fontWeight: 600,
  });

  const btnDelete: React.CSSProperties = {
    padding: '6px 12px',
    background: '#1c1c1c',
    color: '#c8c8c8',
    border: '1px solid #2a2a2a',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 11,
    fontWeight: 600,
  };

  return (
    <div style={{ background: colors.background, minHeight: '100vh', padding: isMobile ? 12 : 24 }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        
        <div style={{ marginBottom: isMobile ? 16 : 24 }}>
          <h1 style={{ color: colors.text, fontSize: isMobile ? 20 : 24, margin: 0 }}>Gerenciar Franqueados</h1>
          <p style={{ color: colors.textSecondary, marginTop: 4, fontSize: isMobile ? 12 : 14 }}>
            Aprove novos cadastros e gerencie o acesso dos franqueados
          </p>
        </div>

        {/* ── SEÇÃO: PENDENTES DE APROVAÇÃO ── */}
        {!loading && pending.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 12,
            }}>
              <div style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#c8c8c8',
                boxShadow: '0 0 6px #c8c8c8',
              }} />
              <h2 style={{ color: '#c8c8c8', fontSize: 14, fontWeight: 700, margin: 0, letterSpacing: 1 }}>
                AGUARDANDO APROVAÇÃO ({pending.length})
              </h2>
            </div>
            <div style={{
              background: isDark ? '#111111' : '#f0f0f0',
              border: `1px solid ${isDark ? '#2f2f2f' : '#c8c8c8'}`,
              borderRadius: 12,
              overflow: 'hidden',
            }}>
              {isMobile ? (
                <div style={{ padding: 10, display: 'grid', gap: 10 }}>
                  {pending.map((f) => (
                    <div key={f.id} style={{ border: `1px solid ${isDark ? '#2f2f2f' : '#c8c8c8'}`, borderRadius: 8, padding: 12 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: colors.text }}>{f.company_name}</div>
                      <div style={{ fontSize: 12, color: '#c8c8c8', marginTop: 2 }}>{f.code}</div>
                      <div style={{ fontSize: 11, color: colors.textSecondary, marginTop: 4 }}>
                        Cadastro: {formatDate(f.created_at)}
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                        <button
                          onClick={() => approveFranchisee(f.id)}
                          disabled={updating}
                          style={{ ...btnApprove, flex: 1 }}
                        >
                          ✓ APROVAR
                        </button>
                        <button
                          onClick={() => deleteFranchisee(f.id)}
                          style={{ ...btnDelete, flex: 1 }}
                        >
                          Recusar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${isDark ? '#2f2f2f' : '#c8c8c8'}`, background: isDark ? '#141414' : '#f0f0f0' }}>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#c8c8c8' }}>EMPRESA</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#c8c8c8' }}>CÓDIGO</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#c8c8c8' }}>CADASTRO</th>
                        <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#c8c8c8' }}>AÇÕES</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pending.map((f) => (
                        <tr key={f.id} style={{ borderBottom: `1px solid ${isDark ? '#222222' : '#d4d4d4'}` }}>
                          <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: colors.text }}>{f.company_name}</td>
                          <td style={{ padding: '12px 16px', fontSize: 13, color: '#c8c8c8' }}>{f.code}</td>
                          <td style={{ padding: '12px 16px', fontSize: 12, color: colors.textSecondary }}>{formatDate(f.created_at)}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                              <button
                                onClick={() => approveFranchisee(f.id)}
                                disabled={updating}
                                style={btnApprove}
                              >
                                ✓ APROVAR ACESSO
                              </button>
                              <button
                                onClick={() => deleteFranchisee(f.id)}
                                style={btnDelete}
                              >
                                Recusar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── SEÇÃO: FRANQUEADOS APROVADOS ── */}
        <div>
          {approved.length > 0 || !loading ? (
            <div style={{ marginBottom: 12 }}>
              <h2 style={{ color: colors.textSecondary, fontSize: 13, fontWeight: 700, margin: 0, letterSpacing: 1 }}>
                FRANQUEADOS ATIVOS ({approved.length})
              </h2>
            </div>
          ) : null}

          <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 12, overflow: 'hidden' }}>
            {isMobile ? (
              <div style={{ padding: 10 }}>
                {loading ? (
                  <div style={{ padding: 24, textAlign: 'center', color: colors.textSecondary }}>Carregando...</div>
                ) : approved.length === 0 ? (
                  <div style={{ padding: 24, textAlign: 'center', color: colors.textSecondary }}>Nenhum franqueado aprovado ainda</div>
                ) : (
                  <div style={{ display: 'grid', gap: 10 }}>
                    {approved.map((f) => (
                      <div key={f.id} style={{ border: `1px solid ${colors.border}`, borderRadius: 8, padding: 10 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: colors.text }}>{f.company_name}</div>
                        <div style={{ fontSize: 12, color: colors.accent, marginTop: 2 }}>{f.code}</div>
                        <div style={{ fontSize: 11, color: colors.textSecondary, marginTop: 4 }}>
                          {f.active ? 'Ativo' : 'Bloqueado'} · Cadastro: {formatDate(f.created_at)}
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                          <button
                            onClick={() => toggleFranchiseeStatus(f.id, f.active)}
                            disabled={updating}
                            style={{ ...btnToggle(f.active), flex: 1 }}
                          >
                            {f.active ? 'Bloquear' : 'Desbloquear'}
                          </button>
                          <button
                            onClick={() => deleteFranchisee(f.id)}
                            style={{ ...btnDelete, flex: 1 }}
                          >
                            Excluir
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${colors.border}`, background: isDark ? '#0f0f0f' : '#fafafa' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: colors.textSecondary }}>EMPRESA</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: colors.textSecondary }}>CÓDIGO</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: colors.textSecondary }}>STATUS</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: colors.textSecondary }}>CADASTRO</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: colors.textSecondary }}>AÇÕES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={5} style={{ padding: 60, textAlign: 'center', color: colors.textSecondary }}>Carregando...</td></tr>
                    ) : approved.length === 0 ? (
                      <tr><td colSpan={5} style={{ padding: 60, textAlign: 'center', color: colors.textSecondary }}>Nenhum franqueado aprovado ainda</td></tr>
                    ) : (
                      approved.map((f) => (
                        <tr key={f.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                          <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: colors.text }}>{f.company_name}</td>
                          <td style={{ padding: '12px 16px', fontSize: 13, color: colors.accent }}>{f.code}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              fontSize: 11,
                              fontWeight: 600,
                              color: f.active ? '#c8c8c8' : '#c8c8c8',
                              background: f.active ? 'rgba(200,200,200,0.08)' : 'rgba(200,200,200,0.08)',
                              border: `1px solid ${f.active ? 'rgba(200,200,200,0.2)' : 'rgba(200,200,200,0.2)'}`,
                              borderRadius: 20,
                              padding: '3px 10px',
                            }}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: f.active ? '#c8c8c8' : '#c8c8c8', display: 'inline-block' }} />
                              {f.active ? 'Ativo' : 'Bloqueado'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: 12, color: colors.textSecondary }}>{formatDate(f.created_at)}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                              <button
                                onClick={() => toggleFranchiseeStatus(f.id, f.active)}
                                disabled={updating}
                                style={btnToggle(f.active)}
                              >
                                {f.active ? 'Bloquear' : 'Desbloquear'}
                              </button>
                              <button
                                onClick={() => deleteFranchisee(f.id)}
                                style={btnDelete}
                              >
                                Excluir
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

