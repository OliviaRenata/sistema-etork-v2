// src/pages/franchise/Financial.tsx

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import type { FinancialRecord } from '../../types';
import { PAYMENT_STATUS_LABEL } from '../../types';
import { formatCurrency, formatDateShort } from '../../lib/utils';
import { useTheme } from '../../context/ThemeContext';

export default function FranchiseFinancial() {
  const { franchisee } = useAuth();
  const { theme: currentTheme } = useTheme();
  const isDark = currentTheme === 'dark';
  
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Cores baseadas no tema
  const colors = {
    text: isDark ? '#e0e0e0' : '#1a1a1a',
    textMuted: isDark ? '#666666' : '#888888',
    textLight: isDark ? '#888888' : '#666666',
    surface: isDark ? '#111111' : '#ffffff',
    border: isDark ? '#1e1e1e' : '#e0e0e0',
    borderLight: isDark ? '#1a1a1a' : '#eeeeee',
    borderRow: isDark ? '#161616' : '#f0f0f0',
    headerText: isDark ? '#555' : '#999',
    accent: '#e6b800',
    debitBg: isDark ? '#1a0a0a' : '#ffebee',
    debitColor: '#e74c3c',
    debitBorder: isDark ? '#3a1a1a' : '#ffcdd2',
    creditBg: isDark ? '#0a1a0a' : '#e8f5e9',
    creditColor: '#22c55e',
    creditBorder: isDark ? '#1a3a1a' : '#c8e6c9',
  };

  useEffect(() => {
    if (!franchisee) {
      setRecords([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    supabase
      .from('financial_records')
      .select('*, order:orders(order_number)')
      .eq('franchisee_id', franchisee.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error('Erro carregando financeiro do franqueado', error);
        }
        setRecords((data || []) as unknown as FinancialRecord[]);
        setLoading(false);
      });
  }, [franchisee]);

  const totalDebit = records.filter(r => r.type === 'debit').reduce((s, r) => s + r.amount, 0);
  const totalCredit = records.filter(r => r.type === 'credit' || r.type === 'payment').reduce((s, r) => s + r.amount, 0);

  if (!franchisee && !loading) {
    return (
      <div style={{ padding: 24, color: colors.text }}>
        <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 24 }}>
          <h1 style={{ color: colors.text, fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>Financeiro</h1>
          <p style={{ color: colors.textMuted, margin: '0 0 18px' }}>Seu usuário ainda não está vinculado a um cadastro de franqueado.</p>
          <div style={{ color: colors.textMuted, fontSize: 13 }}>Aguarde a ativação ou ajuste pelo administrador do portal.</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ color: colors.text }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: colors.text, fontSize: 20, fontWeight: 700, margin: '0 0 4px' }}>Financeiro</h1>
        <p style={{ color: colors.textMuted, fontSize: 13, margin: 0 }}>Histórico de movimentações da sua conta</p>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        <SummaryCard 
          label="Saldo Atual" 
          value={formatCurrency((franchisee?.balance || 0) + (franchisee?.credit_limit || 0))} 
          color="#e6b800"
          isDark={isDark}
        />
        <SummaryCard 
          label="Total em Pedidos" 
          value={formatCurrency(totalDebit)} 
          color="#e74c3c"
          isDark={isDark}
        />
        <SummaryCard 
          label="Total de Créditos" 
          value={formatCurrency(totalCredit)} 
          color="#22c55e"
          isDark={isDark}
        />
      </div>

      {/* Records table */}
      <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${colors.border}` }}>
          <h2 style={{ color: colors.text, fontSize: 14, fontWeight: 600, margin: 0 }}>Extrato</h2>
        </div>
        {loading ? (
          <div style={{ padding: 32, textAlign: 'center', color: colors.textMuted }}>Carregando...</div>
        ) : records.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: colors.textMuted }}>
            Nenhuma movimentação financeira encontrada.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${colors.borderLight}` }}>
                {['Data', 'Descrição', 'Pedido', 'Tipo', 'Valor', 'Status'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, color: colors.headerText, letterSpacing: 1 }}>
                    {h.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map(r => (
                <tr key={r.id} style={{ borderBottom: `1px solid ${colors.borderRow}` }}>
                  <td style={{ padding: '11px 16px', fontSize: 12, color: colors.textLight }}>
                    {formatDateShort(r.created_at)}
                  </td>
                  <td style={{ padding: '11px 16px', fontSize: 13, color: colors.text }}>
                    {r.description}
                  </td>
                  <td style={{ padding: '11px 16px', fontSize: 12, color: colors.accent }}>
                    {(r.order as unknown as { order_number: string })?.order_number || '—'}
                  </td>
                  <td style={{ padding: '11px 16px' }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                      background: r.type === 'debit' ? colors.debitBg : colors.creditBg,
                      color: r.type === 'debit' ? colors.debitColor : colors.creditColor,
                      border: `1px solid ${r.type === 'debit' ? colors.debitBorder : colors.creditBorder}`,
                    }}>
                      {r.type === 'debit' ? 'DÉBITO' : r.type === 'credit' ? 'CRÉDITO' : r.type === 'payment' ? 'PAGAMENTO' : 'AJUSTE'}
                    </span>
                  </td>
                  <td style={{ 
                    padding: '11px 16px', 
                    fontSize: 13, 
                    fontWeight: 700, 
                    color: r.type === 'debit' ? colors.debitColor : colors.creditColor 
                  }}>
                    {r.type === 'debit' ? '- ' : '+ '}{formatCurrency(r.amount)}
                  </td>
                  <td style={{ padding: '11px 16px', fontSize: 11, color: colors.textLight }}>
                    {PAYMENT_STATUS_LABEL[r.payment_status as keyof typeof PAYMENT_STATUS_LABEL]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, color, isDark }: { label: string; value: string; color: string; isDark: boolean }) {
  return (
    <div style={{ 
      background: isDark ? '#111111' : '#ffffff', 
      border: `1px solid ${isDark ? '#1e1e1e' : '#e0e0e0'}`, 
      borderRadius: 10, 
      padding: '16px 18px', 
      borderLeft: `3px solid ${color}` 
    }}>
      <div style={{ fontSize: 11, color: isDark ? '#666666' : '#888888', letterSpacing: 1, marginBottom: 8 }}>
        {label.toUpperCase()}
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: isDark ? '#e0e0e0' : '#1a1a1a' }}>
        {value}
      </div>
    </div>
  );
}