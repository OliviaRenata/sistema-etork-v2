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
    textSecondary: isDark ? '#888888' : '#6b7280',
    border: isDark ? '#222222' : '#e5e7eb',
    accent: '#e6b800',
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
      // CORREÇÃO: Remover o join com users que não existe
      const { data, error } = await supabase
        .from('franchisees')
        .select('*')
        .order('company_name');
      
      if (error) throw error;
      setFranchisees(data || []);
    } catch (error) {
      console.error('Erro ao carregar franqueados:', error);
    } finally {
      setLoading(false);
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

  return (
    <div style={{ background: colors.background, minHeight: '100vh', padding: isMobile ? 12 : 24 }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        
        <div style={{ marginBottom: isMobile ? 16 : 24 }}>
          <h1 style={{ color: colors.text, fontSize: isMobile ? 20 : 24, margin: 0 }}>Gerenciar Franqueados</h1>
          <p style={{ color: colors.textSecondary, marginTop: 4, fontSize: isMobile ? 12 : 14 }}>
            Bloqueie ou desbloqueie o acesso dos franqueados (bloqueado: sem telas de pedido)
          </p>
        </div>

        <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 12, overflow: 'hidden' }}>
          {isMobile ? (
            <div style={{ padding: 10 }}>
              {loading ? (
                <div style={{ padding: 24, textAlign: 'center', color: colors.textSecondary }}>Carregando...</div>
              ) : franchisees.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: colors.textSecondary }}>Nenhum franqueado encontrado</div>
              ) : (
                <div style={{ display: 'grid', gap: 10 }}>
                  {franchisees.map((f) => (
                    <div key={f.id} style={{ border: `1px solid ${colors.border}`, borderRadius: 8, padding: 10 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: colors.text }}>{f.company_name}</div>
                      <div style={{ fontSize: 12, color: colors.accent, marginTop: 2 }}>{f.code}</div>
                      <div style={{ fontSize: 11, color: colors.textSecondary, marginTop: 4 }}>
                        {f.active ? 'Ativo' : 'Inativo'} · Cadastro: {formatDate(f.created_at)}
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                        <button
                          onClick={() => toggleFranchiseeStatus(f.id, f.active)}
                          disabled={updating}
                          style={{
                            flex: 1,
                            padding: '7px 10px',
                            background: '#e6b800',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 6,
                            cursor: 'pointer',
                            fontSize: 11,
                            fontWeight: 600
                          }}
                        >
                          {f.active ? 'Bloquear' : 'Desbloquear'}
                        </button>
                        <button
                          onClick={() => deleteFranchisee(f.id)}
                          style={{ flex: 1, background: '#e6b800', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}
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
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: colors.textSecondary }}>CODIGO</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: colors.textSecondary }}>STATUS</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: colors.textSecondary }}>CADASTRO</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: colors.textSecondary }}>ACOES</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} style={{ padding: 60, textAlign: 'center', color: colors.textSecondary }}>Carregando...</td></tr>
                  ) : franchisees.length === 0 ? (
                    <tr><td colSpan={5} style={{ padding: 60, textAlign: 'center', color: colors.textSecondary }}>Nenhum franqueado encontrado</td></tr>
                  ) : (
                    franchisees.map((f) => (
                      <tr key={f.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                        <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: colors.text }}>{f.company_name}</td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: colors.accent }}>{f.code}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ 
                            display: 'inline-block', 
                            width: 8, 
                            height: 8, 
                            borderRadius: '50%', 
                            background: f.active ? '#e6b800' : '#e6b800',
                            marginRight: 6
                          }} />
                          <span style={{ fontSize: 12, color: colors.textSecondary }}>{f.active ? 'Ativo' : 'Inativo'}</span>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 12, color: colors.textSecondary }}>{formatDate(f.created_at)}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                            <button
                              onClick={() => toggleFranchiseeStatus(f.id, f.active)}
                              disabled={updating}
                              style={{
                                padding: '6px 12px',
                                background: f.active ? '#e6b800' : '#e6b800',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 6,
                                cursor: 'pointer',
                                fontSize: 11,
                                fontWeight: 600
                              }}
                            >
                              {f.active ? 'Bloquear' : 'Desbloquear'}
                            </button>
                            <button
                              onClick={() => deleteFranchisee(f.id)}
                              style={{ background: '#e6b800', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}
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
  );
}