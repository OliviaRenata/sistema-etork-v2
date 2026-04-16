// src/pages/franchise/Financial.tsx

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import type { FinancialRecord } from '../../types';
import { PAYMENT_STATUS_LABEL } from '../../types';
import { formatCurrency, formatDateShort } from '../../lib/utils';
import { useTheme } from '../../context/ThemeContext';

// Ícones
const IconTrendingUp = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 6 13.5 15.5 8 10 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
  </svg>
);

const IconTrendingDown = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 18 13.5 8.5 8 14 1 6"/>
    <polyline points="17 18 23 18 23 12"/>
  </svg>
);

const IconWallet = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 12v5c0 1.66-1.34 3-3 3H5c-1.66 0-3-1.34-3-3V9c0-1.66 1.34-3 3-3h14c1.66 0 3 1.34 3 3"/>
    <path d="M22 9c0 1.66-1.34 3-3 3h-2v-2h2c1.1 0 2-.9 2-2V5"/>
    <circle cx="18" cy="12" r="1"/>
  </svg>
);

const IconCalendar = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
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

export default function FranchiseFinancial() {
  const { franchisee } = useAuth();
  const { theme: currentTheme } = useTheme();
  const isDark = currentTheme === 'dark';
  
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [loading, setLoading] = useState(true);
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
    if (!franchisee) {
      setRecords([]);
      setLoading(false);
      return;
    }

    loadData();
  }, [franchisee]);

  async function loadData() {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('financial_records')
      .select('*, order:orders(order_number)')
      .eq('franchisee_id', franchisee.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Erro carregando financeiro do franqueado', error);
    }
    setRecords((data || []) as unknown as FinancialRecord[]);
    setLoading(false);
  }

  const filteredRecords = records.filter(r => {
    if (filterType && r.type !== filterType) return false;
    if (filterStatus && r.payment_status !== filterStatus) return false;
    if (dateRange.start && new Date(r.created_at) < new Date(dateRange.start)) return false;
    if (dateRange.end && new Date(r.created_at) > new Date(dateRange.end)) return false;
    return true;
  });

  const totalDebit = records.filter(r => r.type === 'debit').reduce((s, r) => s + r.amount, 0);
  const totalCredit = records.filter(r => r.type === 'credit' || r.type === 'payment').reduce((s, r) => s + r.amount, 0);
  const paidDebit = records.filter(r => r.type === 'debit' && r.payment_status === 'pago').reduce((s, r) => s + r.amount, 0);
  
  const currentBalance = (franchisee?.balance || 0) + (franchisee?.credit_limit || 0);

  function exportCSV() {
    const header = 'Data,Descrição,Pedido,Tipo,Valor,Status\n';
    const rows = filteredRecords.map(r => [
      formatDateShort(r.created_at),
      r.description,
      (r.order as unknown as { order_number: string })?.order_number || '',
      r.type,
      r.amount.toFixed(2),
      r.payment_status,
    ].join(',')).join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `extrato-etork-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const spinKeyframes = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;

  if (!franchisee && !loading) {
    return (
      <div style={{ background: colors.background, minHeight: '100vh', padding: 24 }}>
        <style>{spinKeyframes}</style>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 32 }}>
            <h1 style={{ color: colors.text, fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>Financeiro</h1>
            <p style={{ color: colors.textSecondary, margin: '0 0 18px' }}>Seu usuário ainda não está vinculado a um cadastro de franqueado.</p>
            <div style={{ color: colors.textMuted, fontSize: 13 }}>Aguarde a ativação ou ajuste pelo administrador do portal.</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: colors.background, minHeight: '100vh' }}>
      <style>{spinKeyframes}</style>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px' }}>
        
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ color: colors.text, fontSize: 24, fontWeight: 700, margin: '0 0 6px' }}>
            Financeiro
          </h1>
          <p style={{ color: colors.textSecondary, fontSize: 14, margin: 0 }}>
            Histórico completo de movimentações da sua conta
          </p>
        </div>

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
          <SummaryCard 
            label="Saldo Disponível" 
            value={formatCurrency(currentBalance)} 
            icon={<IconWallet />}
            color={colors.accent}
            isDark={isDark}
          />
          <SummaryCard 
            label="Total em Pedidos" 
            value={formatCurrency(totalDebit)} 
            icon={<IconTrendingDown />}
            color="#ef4444"
            isDark={isDark}
          />
          <SummaryCard 
            label="Total Pago" 
            value={formatCurrency(paidDebit)} 
            icon={<IconTrendingUp />}
            color="#10b981"
            isDark={isDark}
          />
          <SummaryCard 
            label="Total de Créditos" 
            value={formatCurrency(totalCredit)} 
            icon={<IconWallet />}
            color="#8b5cf6"
            isDark={isDark}
          />
        </div>

        {/* Filters Bar */}
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
                placeholder="Data inicial"
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
                placeholder="Data final"
              />

              {(filterType || filterStatus || dateRange.start || dateRange.end) && (
                <button
                  onClick={() => {
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

        {/* Records Table */}
        <div style={{ 
          background: colors.surface, 
          border: `1px solid ${colors.border}`, 
          borderRadius: 12, 
          overflow: 'hidden' 
        }}>
          <div style={{ 
            padding: '16px 20px', 
            borderBottom: `1px solid ${colors.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <h2 style={{ color: colors.text, fontSize: 14, fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <IconCalendar />
              Extrato de Movimentações
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
              Nenhuma movimentação financeira encontrada.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${colors.border}`, background: colors.tableHeaderBg }}>
                    {['DATA', 'DESCRIÇÃO', 'PEDIDO', 'TIPO', 'VALOR', 'STATUS'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: colors.textMuted, letterSpacing: 1 }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map(r => (
                    <tr key={r.id} style={{ borderBottom: `1px solid ${colors.border}`, transition: 'background 0.15s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = colors.tableRowHover; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: colors.textSecondary }}>
                        {formatDateShort(r.created_at)}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: colors.text }}>
                        {r.description}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: colors.accent }}>
                        {(r.order as unknown as { order_number: string })?.order_number || '—'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 6,
                          background: r.type === 'debit' ? colors.debitBg : colors.creditBg,
                          color: r.type === 'debit' ? colors.debitColor : colors.creditColor,
                          border: `1px solid ${r.type === 'debit' ? '#fecaca' : '#bbf7d0'}`,
                        }}>
                          {r.type === 'debit' ? 'DÉBITO' : r.type === 'credit' ? 'CRÉDITO' : r.type === 'payment' ? 'PAGAMENTO' : 'AJUSTE'}
                        </span>
                      </td>
                      <td style={{ 
                        padding: '12px 16px', 
                        fontSize: 13, 
                        fontWeight: 700, 
                        color: r.type === 'debit' ? colors.debitColor : colors.creditColor 
                      }}>
                        {r.type === 'debit' ? '- ' : '+ '}{formatCurrency(r.amount)}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          fontSize: 11,
                          padding: '2px 8px',
                          borderRadius: 4,
                          background: r.payment_status === 'pago' ? '#10b98120' : r.payment_status === 'pendente' ? '#f59e0b20' : '#ef444420',
                          color: r.payment_status === 'pago' ? '#10b981' : r.payment_status === 'pendente' ? '#f59e0b' : '#ef4444',
                        }}>
                          {PAYMENT_STATUS_LABEL[r.payment_status as keyof typeof PAYMENT_STATUS_LABEL] || r.payment_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Componente SummaryCard corrigido
function SummaryCard({ label, value, icon, color, isDark }: { 
  label: string; 
  value: string; 
  icon: React.ReactNode;
  color: string; 
  isDark: boolean;
}) {
  return (
    <div style={{
      background: isDark ? '#141414' : '#ffffff',
      border: `1px solid ${isDark ? '#222222' : '#e5e7eb'}`,
      borderRadius: 12,
      padding: '18px 20px',
      borderLeft: `3px solid ${color}`,
      transition: 'transform 0.2s',
      cursor: 'pointer',
    }}
    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 11, color: isDark ? '#666666' : '#6b7280', fontWeight: 700, letterSpacing: 1 }}>
          {label.toUpperCase()}
        </span>
        <span style={{ color }}>{icon}</span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: isDark ? '#e5e5e5' : '#1a1a1a' }}>
        {value}
      </div>
    </div>
  );
}