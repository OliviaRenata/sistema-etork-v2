// src/pages/admin/Financial.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { FinancialRecord, Franchisee } from '../../types';
import { formatCurrency, formatDateShort } from '../../lib/utils';

export default function AdminFinancial() {
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [franchisees, setFranchisees] = useState<Franchisee[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterFranchisee, setFilterFranchisee] = useState('');
  const [filterType, setFilterType] = useState('');

  useEffect(() => {
    Promise.all([
      supabase.from('financial_records')
        .select('*, franchisee:franchisees(company_name, code), order:orders(order_number)')
        .order('created_at', { ascending: false })
        .limit(200),
      supabase.from('franchisees').select('id, company_name, code, balance, credit_limit').order('company_name'),
    ]).then(([recRes, francRes]) => {
      setRecords((recRes.data || []) as unknown as FinancialRecord[]);
      setFranchisees((francRes.data || []) as unknown as Franchisee[]);
      setLoading(false);
    });
  }, []);

  const filtered = records.filter(r =>
    (filterFranchisee === '' || r.franchisee_id === filterFranchisee) &&
    (filterType === '' || r.type === filterType)
  );

  const totalRevenue = records.filter(r => r.type === 'debit').reduce((s, r) => s + r.amount, 0);
  const totalPending = records.filter(r => r.type === 'debit' && r.payment_status === 'pendente').reduce((s, r) => s + r.amount, 0);

  function exportCSV() {
    const header = 'Data,Franqueado,Descrição,Pedido,Tipo,Valor,Status\n';
    const rows = filtered.map(r => [
      formatDateShort(r.created_at),
      (r.franchisee_id as unknown as { company_name: string })?.company_name || '',
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
    a.download = `financeiro-etork-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: '0 0 4px' }}>Financeiro</h1>
          <p style={{ color: '#666', fontSize: 13, margin: 0 }}>Movimentações de todos os franqueados</p>
        </div>
        <button onClick={exportCSV} style={{
          padding: '9px 18px', background: 'transparent', border: '1px solid #333',
          borderRadius: 8, color: '#e6b800', cursor: 'pointer', fontSize: 12, fontWeight: 700,
        }}>
          ↓ Exportar CSV
        </button>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
        <SCard label="Receita Total" value={formatCurrency(totalRevenue)} color="#22c55e" />
        <SCard label="A Receber" value={formatCurrency(totalPending)} color="#f59e0b" />
        <SCard label="Franqueados" value={franchisees.length.toString()} color="#a855f7" />
        <SCard label="Movimentações" value={records.length.toString()} color="#3b82f6" />
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <select
          value={filterFranchisee}
          onChange={e => setFilterFranchisee(e.target.value)}
          style={{
            padding: '9px 12px', background: '#111', border: '1px solid #2a2a2a',
            borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none', minWidth: 220,
          }}
        >
          <option value="">Todos os franqueados</option>
          {franchisees.map(f => <option key={f.id} value={f.id}>{f.company_name}</option>)}
        </select>

        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          style={{
            padding: '9px 12px', background: '#111', border: '1px solid #2a2a2a',
            borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none',
          }}
        >
          <option value="">Todos os tipos</option>
          <option value="debit">Débito</option>
          <option value="credit">Crédito</option>
          <option value="payment">Pagamento</option>
          <option value="adjustment">Ajuste</option>
        </select>

        <span style={{ color: '#555', fontSize: 12, alignSelf: 'center' }}>
          {filtered.length} registros
        </span>
      </div>

      {/* Table */}
      <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 12, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#555' }}>Carregando...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1a1a1a' }}>
                {['Data', 'Franqueado', 'Descrição', 'Pedido', 'Tipo', 'Valor', 'Status'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, color: '#555', letterSpacing: 1 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid #161616' }}>
                  <td style={{ padding: '10px 14px', fontSize: 11, color: '#666' }}>{formatDateShort(r.created_at)}</td>
                  <td style={{ padding: '10px 14px', fontSize: 12, color: '#ccc' }}>
                    {(r.franchisee_id as unknown as { company_name: string })?.company_name || '—'}
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 12, color: '#888' }}>{r.description}</td>
                  <td style={{ padding: '10px 14px', fontSize: 12, color: '#e6b800' }}>
                    {(r.order as unknown as { order_number: string })?.order_number || '—'}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
                      background: r.type === 'debit' ? '#1a0a0a' : '#0a1a0a',
                      color: r.type === 'debit' ? '#e74c3c' : '#22c55e',
                      border: `1px solid ${r.type === 'debit' ? '#3a1a1a' : '#1a3a1a'}`,
                    }}>
                      {r.type === 'debit' ? 'DÉB' : r.type === 'credit' ? 'CRÉ' : r.type === 'payment' ? 'PAG' : 'AJU'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 700, color: r.type === 'debit' ? '#e74c3c' : '#22c55e' }}>
                    {r.type === 'debit' ? '- ' : '+ '}{formatCurrency(r.amount)}
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 11, color: '#666' }}>
                    {r.payment_status}
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

function SCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 10, padding: '14px 16px', borderLeft: `3px solid ${color}` }}>
      <div style={{ fontSize: 10, color: '#666', letterSpacing: 1, marginBottom: 8 }}>{label.toUpperCase()}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>{value}</div>
    </div>
  );
}
