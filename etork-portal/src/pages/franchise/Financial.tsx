// src/pages/franchise/Financial.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import type { FinancialRecord } from '../../types';
import { PAYMENT_STATUS_LABEL } from '../../types';
import { formatCurrency, formatDateShort } from '../../lib/utils';

export default function FranchiseFinancial() {
  const { franchisee } = useAuth();
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!franchisee) return;
    supabase
      .from('financial_records')
      .select('*, order:orders(order_number)')
      .eq('franchisee_id', franchisee.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setRecords((data || []) as unknown as FinancialRecord[]);
        setLoading(false);
      });
  }, [franchisee]);

  const totalDebit = records.filter(r => r.type === 'debit').reduce((s, r) => s + r.amount, 0);
  const totalCredit = records.filter(r => r.type === 'credit' || r.type === 'payment').reduce((s, r) => s + r.amount, 0);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: '0 0 4px' }}>Financeiro</h1>
        <p style={{ color: '#666', fontSize: 13, margin: 0 }}>Histórico de movimentações da sua conta</p>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        <SummaryCard label="Saldo Atual" value={formatCurrency((franchisee?.balance || 0) + (franchisee?.credit_limit || 0))} color="#e6b800" />
        <SummaryCard label="Total em Pedidos" value={formatCurrency(totalDebit)} color="#e74c3c" />
        <SummaryCard label="Total de Créditos" value={formatCurrency(totalCredit)} color="#22c55e" />
      </div>

      {/* Records table */}
      <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #1e1e1e' }}>
          <h2 style={{ color: '#fff', fontSize: 14, fontWeight: 600, margin: 0 }}>Extrato</h2>
        </div>
        {loading ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#555' }}>Carregando...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1a1a1a' }}>
                {['Data', 'Descrição', 'Pedido', 'Tipo', 'Valor', 'Status'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, color: '#555', letterSpacing: 1 }}>
                    {h.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid #161616' }}>
                  <td style={{ padding: '11px 16px', fontSize: 12, color: '#666' }}>{formatDateShort(r.created_at)}</td>
                  <td style={{ padding: '11px 16px', fontSize: 13, color: '#ccc' }}>{r.description}</td>
                  <td style={{ padding: '11px 16px', fontSize: 12, color: '#e6b800' }}>
                    {(r.order as unknown as { order_number: string })?.order_number || '—'}
                  </td>
                  <td style={{ padding: '11px 16px' }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                      background: r.type === 'debit' ? '#1a0a0a' : '#0a1a0a',
                      color: r.type === 'debit' ? '#e74c3c' : '#22c55e',
                      border: `1px solid ${r.type === 'debit' ? '#3a1a1a' : '#1a3a1a'}`,
                    }}>
                      {r.type === 'debit' ? 'DÉBITO' : r.type === 'credit' ? 'CRÉDITO' : r.type === 'payment' ? 'PAGAMENTO' : 'AJUSTE'}
                    </span>
                  </td>
                  <td style={{ padding: '11px 16px', fontSize: 13, fontWeight: 700, color: r.type === 'debit' ? '#e74c3c' : '#22c55e' }}>
                    {r.type === 'debit' ? '- ' : '+ '}{formatCurrency(r.amount)}
                  </td>
                  <td style={{ padding: '11px 16px', fontSize: 11, color: '#888' }}>
                    {PAYMENT_STATUS_LABEL[r.payment_status]}
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

function SummaryCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 10, padding: '16px 18px', borderLeft: `3px solid ${color}` }}>
      <div style={{ fontSize: 11, color: '#666', letterSpacing: 1, marginBottom: 8 }}>{label.toUpperCase()}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{value}</div>
    </div>
  );
}
