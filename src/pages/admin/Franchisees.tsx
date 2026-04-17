// src/pages/admin/AdminFranchisees.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';
import { formatDate } from '../../lib/utils';

export default function AdminFranchisees() {
  const { isAdmin } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
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
    return <div style={{ padding: 60, textAlign: 'center' }}>Acesso negado</div>;
  }

  useEffect(() => {
    loadFranchisees();
  }, []);

  async function loadFranchisees() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('franchisees')
        .select('*, users:user_id(email)')
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
    <div style={{ background: colors.background, minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ color: colors.text, fontSize: 24, margin: 0 }}>Gerenciar Franqueados</h1>
          <p style={{ color: colors.textSecondary, marginTop: 4 }}>Ative, inative ou exclua franqueados da plataforma</p>
        </div>

        <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${colors.border}`, background: isDark ? '#0f0f0f' : '#fafafa' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: colors.textSecondary }}>EMPRESA</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: colors.textSecondary }}>CÓDIGO</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: colors.textSecondary }}>EMAIL</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: colors.textSecondary }}>STATUS</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: colors.textSecondary }}>CADASTRO</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: colors.textSecondary }}>AÇÕES</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ padding: 60, textAlign: 'center' }}>Carregando...</td></tr>
                ) : franchisees.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: 60, textAlign: 'center' }}>Nenhum franqueado encontrado</td></tr>
                ) : (
                  franchisees.map((f) => (
                    <tr key={f.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: colors.text }}>{f.company_name}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: colors.accent }}>{f.code}</td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: colors.textSecondary }}>{(f.users as any)?.email || '—'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ 
                          display: 'inline-block', 
                          width: 8, 
                          height: 8, 
                          borderRadius: '50%', 
                          background: f.active ? '#10b981' : '#ef4444',
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
                              background: f.active ? '#ef4444' : '#10b981',
                              color: '#fff',
                              border: 'none',
                              borderRadius: 6,
                              cursor: 'pointer',
                              fontSize: 11,
                              fontWeight: 600
                            }}
                          >
                            {f.active ? 'Inativar' : 'Ativar'}
                          </button>
                          <button
                            onClick={() => deleteFranchisee(f.id)}
                            style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}
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
        </div>
      </div>
    </div>
  );
}