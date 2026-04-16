// src/pages/admin/Franchisees.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { Franchisee } from '../../types';
import { formatCurrency, formatDate } from '../../lib/utils';

export default function AdminFranchisees() {
  const [franchisees, setFranchisees] = useState<Franchisee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<Franchisee | null>(null);

  useEffect(() => {
    supabase.from('franchisees')
      .select('*, profile:profiles(full_name, phone)')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setFranchisees((data || []) as unknown as Franchisee[]);
        setLoading(false);
      });
  }, []);

  const filtered = franchisees.filter(f =>
    search === '' ||
    f.company_name.toLowerCase().includes(search.toLowerCase()) ||
    f.code.toLowerCase().includes(search.toLowerCase()) ||
    (f.email || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: '0 0 4px' }}>Franqueados</h1>
          <p style={{ color: '#666', fontSize: 13, margin: 0 }}>{franchisees.length} franqueados cadastrados</p>
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar franqueado..."
          style={{
            padding: '9px 14px', background: '#111', border: '1px solid #2a2a2a',
            borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none', width: 240,
          }}
          onFocus={e => e.target.style.borderColor = '#e6b800'}
          onBlur={e => e.target.style.borderColor = '#2a2a2a'}
        />
      </div>

      <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 12, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#555' }}>Carregando...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1a1a1a' }}>
                {['Código', 'Empresa', 'E-mail', 'Saldo', 'Limite', 'Status', 'Ações'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, color: '#555', letterSpacing: 1 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(f => (
                <tr key={f.id} style={{ borderBottom: '1px solid #161616' }}>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: '#e6b800', fontWeight: 700, fontFamily: 'monospace' }}>{f.code}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>{f.company_name}</div>
                    {f.city && <div style={{ fontSize: 11, color: '#555' }}>{f.city} - {f.state}</div>}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: '#888' }}>{f.email}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: f.balance < 0 ? '#e74c3c' : '#22c55e', fontWeight: 600 }}>
                    {formatCurrency(f.balance)}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#888' }}>{formatCurrency(f.credit_limit)}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                      background: f.active ? '#0a1a0a' : '#1a0a0a',
                      color: f.active ? '#22c55e' : '#e74c3c',
                      border: `1px solid ${f.active ? '#1a3a1a' : '#3a1a1a'}`,
                    }}>
                      {f.active ? 'ATIVO' : 'INATIVO'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button onClick={() => setModal(f)}
                      style={{ background: 'none', border: '1px solid #333', borderRadius: 6, color: '#e6b800', cursor: 'pointer', fontSize: 11, padding: '5px 12px' }}>
                      Ver detalhes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#111', border: '1px solid #222', borderRadius: 12, padding: 28, width: 480, maxWidth: '90vw' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ color: '#fff', fontSize: 16, fontWeight: 700, margin: 0 }}>{modal.company_name}</h2>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 20 }}>×</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                ['Código', modal.code],
                ['CNPJ', modal.cnpj || '—'],
                ['E-mail', modal.email],
                ['Telefone', modal.phone || '—'],
                ['Cidade', `${modal.city || '—'} - ${modal.state || '—'}`],
                ['CEP', modal.zip_code || '—'],
                ['Saldo', formatCurrency(modal.balance)],
                ['Limite de Crédito', formatCurrency(modal.credit_limit)],
                ['Cadastrado em', formatDate(modal.created_at)],
                ['Status', modal.active ? 'Ativo' : 'Inativo'],
              ].map(([label, value]) => (
                <div key={label} style={{ background: '#0d0d0d', borderRadius: 8, padding: '10px 12px' }}>
                  <div style={{ fontSize: 10, color: '#555', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 13, color: '#ccc', fontWeight: 500 }}>{value}</div>
                </div>
              ))}
            </div>
            {modal.address && (
              <div style={{ background: '#0d0d0d', borderRadius: 8, padding: '10px 12px', marginTop: 12 }}>
                <div style={{ fontSize: 10, color: '#555', marginBottom: 4 }}>Endereço</div>
                <div style={{ fontSize: 13, color: '#ccc' }}>{modal.address}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
