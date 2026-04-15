// src/pages/admin/Orders.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { Order, OrderStatus } from '../../types';
import { ORDER_STATUS_LABEL } from '../../types';
import StatusBadge from '../../components/ui/StatusBadge';
import { formatCurrency, formatDate } from '../../lib/utils';

const ALL_STATUSES: (OrderStatus | 'todos')[] = ['todos', 'solicitado', 'em_producao', 'enviado', 'concluido', 'cancelado'];

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'todos'>('todos');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadOrders();

    const channel = supabase.channel('admin-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => loadOrders())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function loadOrders() {
    const { data } = await supabase
      .from('orders')
      .select('*, franchisee:franchisees(company_name, code), order_items(count)')
      .order('created_at', { ascending: false });
    setOrders((data || []) as unknown as Order[]);
    setLoading(false);
  }

  const filtered = orders.filter(o =>
    (filterStatus === 'todos' || o.status === filterStatus) &&
    (search === '' ||
      o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      (o.franchisee as unknown as { company_name: string })?.company_name?.toLowerCase().includes(search.toLowerCase()))
  );

  // Status counts for tabs
  const counts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    acc.todos = (acc.todos || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: '0 0 4px' }}>Gerenciar Pedidos</h1>
          <p style={{ color: '#666', fontSize: 13, margin: 0 }}>{orders.length} pedidos no total</p>
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por número ou franqueado..."
          style={{
            padding: '9px 14px', background: '#111', border: '1px solid #2a2a2a',
            borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none', width: 260,
          }}
          onFocus={e => e.target.style.borderColor = '#e6b800'}
          onBlur={e => e.target.style.borderColor = '#2a2a2a'}
        />
      </div>

      {/* Status filter tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap' }}>
        {ALL_STATUSES.map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            style={{
              padding: '7px 14px', borderRadius: 20, fontSize: 11, fontWeight: 600,
              border: '1px solid',
              background: filterStatus === s ? '#e6b800' : 'transparent',
              color: filterStatus === s ? '#000' : '#888',
              borderColor: filterStatus === s ? '#e6b800' : '#333',
              cursor: 'pointer', letterSpacing: 0.5,
            }}>
            {s === 'todos' ? 'Todos' : ORDER_STATUS_LABEL[s as OrderStatus]}
            {counts[s] > 0 && (
              <span style={{
                marginLeft: 6, fontSize: 10,
                background: filterStatus === s ? 'rgba(0,0,0,0.2)' : '#1a1a1a',
                padding: '1px 6px', borderRadius: 10,
              }}>
                {counts[s]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Orders table */}
      <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 12, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#555', fontSize: 13 }}>Carregando pedidos...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#555', fontSize: 13 }}>
            Nenhum pedido encontrado para os filtros selecionados.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1a1a1a' }}>
                {['Pedido', 'Franqueado', 'Data', 'Valor', 'Status', 'Ações'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: '#555', letterSpacing: 1 }}>
                    {h.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(order => (
                <tr key={order.id} style={{ borderBottom: '1px solid #161616', transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#151515')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 13, color: '#e6b800', fontWeight: 700 }}>{order.order_number}</span>
                    {order.vehicle_plate && (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#555', marginTop: 2 }}>
                        <CarIcon width={12} height={12} /> {order.vehicle_plate}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#ccc' }}>
                    {(order.franchisee as unknown as { company_name: string })?.company_name || '—'}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: '#666' }}>
                    {formatDate(order.created_at)}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#fff', fontWeight: 600 }}>
                    {formatCurrency(order.total_amount)}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <StatusBadge status={order.status} />
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <Link to={`/admin/orders/${order.id}`}
                      style={{ color: '#e6b800', fontSize: 12, textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      Detalhes <ArrowRightIcon width={12} height={12} />
                    </Link>
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
