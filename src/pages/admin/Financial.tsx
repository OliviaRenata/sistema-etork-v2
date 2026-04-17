// src/pages/admin/Financial.tsx

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { FinancialRecord, Franchisee } from '../../types';
import { formatCurrency, formatDateShort } from '../../lib/utils';
import { useTheme } from '../../context/ThemeContext';

// Ícones
const IconTrendingUp = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 6 13.5 15.5 8 10 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
  </svg>
);

const IconUsers = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const IconPackage = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.29 7 12 12 20.71 7"/>
    <line x1="12" y1="22" x2="12" y2="12"/>
  </svg>
);

const IconAlertCircle = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

const IconFilter = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="22 3 2 3 10 13 10 21 14 18 14 13 22 3"/>
  </svg>
);

const IconDownload = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

const IconLoader = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 2a10 10 0 0 1 10 10"/>
  </svg>
);

interface FranchiseeFinancial {
  id: string;
  company_name: string;
  code: string;
  balance: number;
  credit_limit: number;
  total_orders: number;
  total_spent: number;
  pending_amount: number;
}

export default function AdminFinancial() {
  const { theme: currentTheme } = useTheme();
  const isDark = currentTheme === 'dark';
  
  const [records, setRecords] = useState<any[]>([]);
  const [franchisees, setFranchisees] = useState<Franchisee[]>([]);
  const [franchiseeFinancials, setFranchiseeFinancials] = useState<FranchiseeFinancial[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterFranchisee, setFilterFranchisee] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showFilters, setShowFilters] = useState(false);

  const colors = {
    background: isDark ? '#0d0d0d' : '#f3f4f6',
    surface: isDark ? '#141414' : '#ffffff',
    surfaceHover: isDark ? '#1c1c1c' : '#fafafa',
    text: isDark ? '#e5e5e5' : '#1a1a1a',
    textSecondary: isDark ? '#888888' : '#6b7280',
    textMuted: isDark ? '#666666' : '#9ca3af',
    border: isDark ? '#222222' : '#e5e7eb',
    accent: '#e6b800',
    debitBg: isDark ? '#1a0a0a' : '#fef2f2',
    debitColor: '#ef4444',
    creditBg: isDark ? '#0a1a0a' : '#f0fdf4',
    creditColor: '#10b981',
    tableHeaderBg: isDark ? '#0d0d0d' : '#f9fafb',
    tableRowHover: isDark ? '#1a1a1a' : '#f9fafb',
  };

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel('admin-financial')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'financial_records' }, 
        () => loadData()
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'franchisees' },
        () => loadData()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function loadData() {
    setLoading(true);
    
    try {
      const [recRes, francRes] = await Promise.all([
        supabase.from('financial_records')
          .select('*, franchisee:franchisees(company_name, code), order:orders(order_number)')
          .order('created_at', { ascending: false })
          .limit(500),
        supabase.from('franchisees').select('id, company_name, code, balance, credit_limit').order('company_name'),
      ]);

      if (recRes.error) console.error('Erro ao buscar registros financeiros', recRes.error);
      if (francRes.error) console.error('Erro ao buscar franqueados', francRes.error);
      
      const allRecords = recRes.data || [];
      const allFranchisees = francRes.data || [];
      
      setRecords(allRecords);
      setFranchisees(allFranchisees as Franchisee[]);
      
      const stats = allFranchisees.map(f => {
        const franchiseeRecords = allRecords.filter(r => r.franchisee_id === f.id);
        const debitRecords = franchiseeRecords.filter(r => r.type === 'debit');
        const pendingRecords = debitRecords.filter(r => r.payment_status === 'pendente');
        
        return {
          id: f.id,
          company_name: f.company_name,
          code: f.code,
          balance: f.balance,
          credit_limit: f.credit_limit,
          total_orders: franchiseeRecords.filter(r => r.type === 'debit').length,
          total_spent: debitRecords.reduce((sum, r) => sum + (r.amount || 0), 0),
          pending_amount: pendingRecords.reduce((sum, r) => sum + (r.amount || 0), 0),
        };
      }).sort((a, b) => b.total_spent - a.total_spent);
      
      setFranchiseeFinancials(stats);
      
    } catch (error) {
      console.error('Erro carregando financeiro', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredRecords = records.filter(r => {
    if (filterFranchisee && r.franchisee_id !== filterFranchisee) return false;
    if (filterType && r.type !== filterType) return false;
    if (filterStatus && r.payment_status !== filterStatus) return false;
    if (dateRange.start && new Date(r.created_at) < new Date(dateRange.start)) return false;
    if (dateRange.end && new Date(r.created_at) > new Date(dateRange.end)) return false;
    return true;
  });

  const totalRevenue = records.filter(r => r.type === 'debit').reduce((s, r) => s + (r.amount || 0), 0);
  const totalPending = records.filter(r => r.type === 'debit' && r.payment_status === 'pendente').reduce((s, r) => s + (r.amount || 0), 0);
  const totalPaid = records.filter(r => r.type === 'debit' && r.payment_status === 'pago').reduce((s, r) => s + (r.amount || 0), 0);
  const totalCredits = records.filter(r => r.type === 'credit' || r.type === 'payment').reduce((s, r) => s + (r.amount || 0), 0);

  const filteredTotal = filteredRecords.reduce((sum, r) => sum + (r.amount || 0), 0);

  function exportCSV() {
    const header = 'Data,Franqueado,Descrição,Pedido,Tipo,Valor,Status\n';
    const rows = filteredRecords.map(r => [
      formatDateShort(r.created_at),
      r.franchisee?.company_name || '',
      r.description,
      r.order?.order_number || '',
      r.type,
      r.amount.toFixed(2),
      r.payment_status,
    ].join(',')).join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financeiro-etork-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const spinKeyframes = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;

  return (
    <div style={{ background: colors.background, minHeight: '100vh' }}>
      <style>{spinKeyframes}</style>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px' }}>
        
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ color: colors.text, fontSize: 24, fontWeight: 700, margin: '0 0 6px' }}>
            Financeiro - Administrativo
          </h1>
          <p style={{ color: colors.textSecondary, fontSize: 14, margin: 0 }}>
            Gestão financeira completa de todos os franqueados
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
          <AdminStat 
            label="Receita Total" 
            value={formatCurrency(totalRevenue)} 
            subtitle={`${records.length} movimentações`}
            color="#10b981" 
            icon={<IconTrendingUp />}
            colors={colors}
          />
          <AdminStat 
            label="A Receber" 
            value={formatCurrency(totalPending)} 
            subtitle={`${records.filter(r => r.payment_status === 'pendente').length} pendentes`}
            color="#f59e0b" 
            icon={<IconAlertCircle />}
            colors={colors}
          />
          <AdminStat 
            label="Receita Paga" 
            value={formatCurrency(totalPaid)} 
            color="#3b82f6" 
            icon={<IconPackage />}
            colors={colors}
          />
          <AdminStat 
            label="Créditos Totais" 
            value={formatCurrency(totalCredits)} 
            color="#8b5cf6" 
            icon={<IconUsers />}
            colors={colors}
          />
          <AdminStat 
            label="Franqueados" 
            value={franchisees.length.toString()} 
            subtitle={`${franchisees.filter(f => f.balance > 0).length} com saldo`}
            color={colors.accent} 
            icon={<IconUsers />}
            colors={colors}
          />
        </div>

        <div style={{ 
          background: colors.surface, 
          border: `1px solid ${colors.border}`, 
          borderRadius: 12, 
          padding: '16px 20px',
          marginBottom: 24
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showFilters ? 16 : 0 }}>
            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'transparent',
                border: 'none',
                color: colors.accent,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              <IconFilter />
              {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
            </button>
            
            <button
              onClick={exportCSV}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: colors.surfaceHover,
                border: `1px solid ${colors.border}`,
                borderRadius: 8,
                padding: '8px 16px',
                color: colors.text,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              <IconDownload />
              Exportar CSV
            </button>
          </div>

          {showFilters && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              <select
                value={filterFranchisee}
                onChange={e => setFilterFranchisee(e.target.value)}
                style={{
                  padding: '8px 12px',
                  background: colors.background,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 8,
                  color: colors.text,
                  fontSize: 12,
                }}
              >
                <option value="">Todos os franqueados</option>
                {franchisees.map(f => (
                  <option key={f.id} value={f.id}>{f.company_name}</option>
                ))}
              </select>

              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                style={{
                  padding: '8px 12px',
                  background: colors.background,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 8,
                  color: colors.text,
                  fontSize: 12,
                }}
              >
                <option value="">Todos os tipos</option>
                <option value="debit">Débito</option>
                <option value="credit">Crédito</option>
                <option value="payment">Pagamento</option>
                <option value="adjustment">Ajuste</option>
              </select>

              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                style={{
                  padding: '8px 12px',
                  background: colors.background,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 8,
                  color: colors.text,
                  fontSize: 12,
                }}
              >
                <option value="">Todos os status</option>
                <option value="pendente">Pendente</option>
                <option value="pago">Pago</option>
                <option value="cancelado">Cancelado</option>
              </select>

              <input
                type="date"
                value={dateRange.start}
                onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
                style={{
                  padding: '8px 12px',
                  background: colors.background,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 8,
                  color: colors.text,
                  fontSize: 12,
                }}
              />

              <input
                type="date"
                value={dateRange.end}
                onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
                style={{
                  padding: '8px 12px',
                  background: colors.background,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 8,
                  color: colors.text,
                  fontSize: 12,
                }}
              />

              {(filterFranchisee || filterType || filterStatus || dateRange.start || dateRange.end) && (
                <button
                  onClick={() => {
                    setFilterFranchisee('');
                    setFilterType('');
                    setFilterStatus('');
                    setDateRange({ start: '', end: '' });
                  }}
                  style={{
                    padding: '8px 16px',
                    background: '#ef4444',
                    border: 'none',
                    borderRadius: 8,
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  Limpar Filtros
                </button>
              )}
            </div>
          )}
        </div>

        {franchiseeFinancials.length > 0 && (
          <div style={{
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: 12,
            overflow: 'hidden',
            marginBottom: 24,
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: `1px solid ${colors.border}`,
              background: colors.tableHeaderBg,
            }}>
              <h2 style={{ color: colors.text, fontSize: 14, fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <IconUsers />
                Resumo Financeiro por Franqueado
              </h2>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                    {['FRANQUEADO', 'CÓDIGO', 'PEDIDOS', 'TOTAL GASTO', 'A RECEBER', 'SALDO'].map(header => (
                      <th key={header} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: colors.textMuted, letterSpacing: 1 }}>
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {franchiseeFinancials.slice(0, 10).map(f => (
                    <tr key={f.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: colors.text }}>
                        {f.company_name}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: colors.textSecondary }}>
                        {f.code}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: colors.text }}>
                        {f.total_orders}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: colors.text }}>
                        {formatCurrency(f.total_spent)}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: f.pending_amount > 0 ? '#f59e0b' : '#10b981', fontWeight: 600 }}>
                        {formatCurrency(f.pending_amount)}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: colors.accent }}>
                        {formatCurrency(f.balance + f.credit_limit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: 12,
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '16px 20px',
            borderBottom: `1px solid ${colors.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <h2 style={{ color: colors.text, fontSize: 14, fontWeight: 600, margin: 0 }}>
              Todas as Transações
            </h2>
            <span style={{ fontSize: 12, color: colors.textMuted }}>
              {filteredRecords.length} registros
            </span>
          </div>
          
          {loading ? (
            <div style={{ padding: 48, textAlign: 'center', color: colors.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <IconLoader />
              Carregando...
            </div>
          ) : filteredRecords.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: colors.textMuted }}>
              Nenhuma movimentação encontrada.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${colors.border}`, background: colors.tableHeaderBg }}>
                    {['DATA', 'FRANQUEADO', 'DESCRIÇÃO', 'PEDIDO', 'TIPO', 'VALOR', 'STATUS', ''].map(header => (
                      <th key={header} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: colors.textMuted, letterSpacing: 1 }}>
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map(r => (
                    <tr key={r.id} style={{ borderBottom: `1px solid ${colors.border}`, transition: 'background 0.15s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = colors.tableRowHover; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                      <td style={{ padding: '10px 14px', fontSize: 11, color: colors.textSecondary }}>
                        {formatDateShort(r.created_at)}
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: colors.text }}>
                        {r.franchisee?.company_name || '—'}
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: colors.textSecondary }}>
                        {r.description}
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: colors.accent }}>
                        {r.order?.order_number || '—'}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                          background: r.type === 'debit' ? colors.debitBg : colors.creditBg,
                          color: r.type === 'debit' ? colors.debitColor : colors.creditColor,
                        }}>
                          {r.type === 'debit' ? 'DÉBITO' : r.type === 'credit' ? 'CRÉDITO' : r.type === 'payment' ? 'PAGAMENTO' : 'AJUSTE'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 700, color: r.type === 'debit' ? colors.debitColor : colors.creditColor }}>
                        {r.type === 'debit' ? '- ' : '+ '}{formatCurrency(r.amount)}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{
                          fontSize: 10,
                          padding: '2px 6px',
                          borderRadius: 4,
                          background: r.payment_status === 'pago' ? '#10b98120' : r.payment_status === 'pendente' ? '#f59e0b20' : '#ef444420',
                          color: r.payment_status === 'pago' ? '#10b981' : r.payment_status === 'pendente' ? '#f59e0b' : '#ef4444',
                        }}>
                          {r.payment_status === 'pago' ? 'PAGO' : r.payment_status === 'pendente' ? 'PENDENTE' : 'CANCELADO'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <button
                          onClick={() => {}}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: colors.accent,
                            cursor: 'pointer',
                            fontSize: 11,
                          }}
                        >
                          Detalhes
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: `2px solid ${colors.border}`, background: colors.tableHeaderBg }}>
                    <td colSpan={5} style={{ padding: '10px 14px', fontSize: 12, fontWeight: 600, color: colors.text }}>
                      Total:
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 700, color: colors.accent }}>
                      {formatCurrency(filteredTotal)}
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AdminStat({ label, value, subtitle, color, icon, colors }: { 
  label: string; 
  value: string; 
  subtitle?: string;
  color: string; 
  icon: React.ReactNode;
  colors: any;
}) {
  return (
    <div style={{
      background: colors.surface,
      border: `1px solid ${colors.border}`,
      borderRadius: 10,
      padding: '16px 18px',
      borderLeft: `3px solid ${color}`,
      transition: 'transform 0.2s',
    }}
    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 10, color: colors.textMuted, fontWeight: 700, letterSpacing: 1 }}>
          {label.toUpperCase()}
        </span>
        <span style={{ color }}>{icon}</span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: colors.text }}>
        {value}
      </div>
      {subtitle && (
        <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 6 }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}