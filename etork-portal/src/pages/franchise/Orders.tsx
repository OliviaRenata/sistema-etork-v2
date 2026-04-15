// src/pages/franchise/Orders.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import type { Order, OrderStatus } from '../../types';
import { ORDER_STATUS_LABEL } from '../../types';
import StatusBadge from '../../components/ui/StatusBadge';
import { PlusIcon, CarIcon, ArrowRightIcon } from '../../components/ui/Icons';
import { formatCurrency, formatDate } from '../../lib/utils';

export default function FranchiseOrders() {
  const { franchisee } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<OrderStatus | 'todos'>('todos');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!franchisee) {
      setOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    loadOrders();

    const channel = supabase.channel('franchise-orders')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'orders',
        filter: `franchisee_id=eq.${franchisee.id}`,
      }, () => loadOrders())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [franchisee]);

  async function loadOrders() {
    if (!franchisee) return;
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(count), order_files(count)')
      .eq('franchisee_id', franchisee.id)
      .order('created_at', { ascending: false });
    setOrders((data || []) as unknown as Order[]);
    setLoading(false);
  }

  const filtered = orders.filter(o =>
    (filter === 'todos' || o.status === filter) &&
    (search === '' || o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      (o.vehicle_plate || '').toLowerCase().includes(search.toLowerCase()))
  );

  if (!franchisee && !loading) {
    return (
      <div style={{ padding: 24, color: 'var(--text)' }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
          <h1 style={{ margin: 0, fontSize: 22, color: 'var(--text)' }}>Aguardando ativação</h1>
          <p style={{ color: 'var(--muted)', marginTop: 8 }}>Seu cadastro de franqueado não está vinculado ainda. Aguarde o administrador concluir.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ color: 'var(--text)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ color: 'var(--text)', fontSize: 20, fontWeight: 700, margin: '0 0 4px' }}>Meus Pedidos</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, margin: 0 }}>{orders.length} pedidos no total</p>
        </div>
        <Link to="/orders/new" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '10px 18px', background: 'var(--accent)', color: '#000',
          borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none',
        }}>
          <PlusIcon width={16} height={16} /> Novo Pedido
        </Link>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {(['todos', 'solicitado', 'em_producao', 'enviado', 'concluido', 'cancelado'] as const).map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{
            padding: '6px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600,
            border: '1px solid',
            background: filter === s ? 'var(--accent)' : 'transparent',
            color: filter === s ? '#000' : 'var(--muted)',
            borderColor: filter === s ? 'var(--accent)' : 'var(--border)',
            cursor: 'pointer',
          }}>
            {s === 'todos' ? 'Todos' : ORDER_STATUS_LABEL[s as OrderStatus]}
          </button>
        ))}
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar pedido ou placa..."
          style={{
            marginLeft: 'auto', padding: '8px 12px',
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 8, color: 'var(--text)', fontSize: 12, outline: 'none', width: 220,
          }}
          onFocus={e => e.target.style.borderColor = 'var(--accent)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
      </div>

      {/* Orders list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Carregando...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
            Nenhum pedido encontrado.{' '}
            <Link to="/orders/new" style={{ color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              Criar novo <ArrowRightIcon width={12} height={12} />
            </Link>
          </div>
        ) : (
          filtered.map(order => (
            <div key={order.id} style={{
              background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10,
              padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 20,
            }}>
              <div style={{ minWidth: 120 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>{order.order_number}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{formatDate(order.created_at)}</div>
              </div>
              {order.vehicle_plate && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: 'var(--surface)', borderRadius: 6, fontSize: 12, color: 'var(--muted)', fontFamily: 'monospace', letterSpacing: 1 }}>
                  <CarIcon width={12} height={12} /> {order.vehicle_plate}
                </div>
              )}
              <div style={{ flex: 1 }}>
                <StatusBadge status={order.status} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', minWidth: 100, textAlign: 'right' }}>
                {formatCurrency(order.total_amount)}
              </div>
              {order.notes && (
                <div style={{ fontSize: 11, color: 'var(--muted)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {order.notes}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
