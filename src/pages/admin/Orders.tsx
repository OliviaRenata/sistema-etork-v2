import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
// Importamos os ícones originais
import { Car, ArrowRight } from 'lucide-react';
import type { Order, OrderStatus } from '../../types';
import { ORDER_STATUS_LABEL } from '../../types';
import StatusBadge from '../../components/ui/StatusBadge';
import { formatCurrency, formatDate } from '../../lib/utils';

// CASTING: Transformamos os ícones em 'any' para evitar o erro de JSX component
const CarIcon = Car as any;
const ArrowRightIcon = ArrowRight as any;

// Lista de status incluindo 'entregue'
const ALL_STATUSES = ['todos', 'solicitado', 'em_producao', 'enviado', 'concluido', 'cancelado', 'entregue'] as const;

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadOrders();

    const channel = supabase.channel('admin-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => loadOrders())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadOrders() {
    setLoading(true);
    try {
      // Query otimizada buscando a relação com franqueados
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          franchisee:franchisees(company_name, code)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders((data || []) as unknown as Order[]);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
    } finally {
      setLoading(false);
    }
  }

  const filtered = orders.filter(o =>
    (filterStatus === 'todos' || o.status === filterStatus) &&
    (search === '' ||
      o.order_number?.toLowerCase().includes(search.toLowerCase()) ||
      (o.franchisee as any)?.company_name?.toLowerCase().includes(search.toLowerCase()) ||
      o.vehicle_plate?.toLowerCase().includes(search.toLowerCase()))
  );

  const counts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    acc.todos = (acc.todos || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ color: 'var(--text)', fontSize: 20, fontWeight: 700, margin: '0 0 4px' }}>Gerenciar Pedidos</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, margin: 0 }}>{orders.length} pedidos no total</p>
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por número, placa ou franqueado..."
          style={{
            padding: '9px 14px', background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 8, color: 'var(--text)', fontSize: 13, outline: 'none', width: 260,
          }}
        />
      </div>

      {/* Abas de Filtro */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap' }}>
        {ALL_STATUSES.map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            style={{
              padding: '7px 14px', borderRadius: 20, fontSize: 11, fontWeight: 600,
              border: '1px solid',
              background: filterStatus === s ? 'var(--accent)' : 'transparent',
              color: filterStatus === s ? '#000' : 'var(--muted)',
              borderColor: filterStatus === s ? 'var(--accent)' : 'var(--border)',
              cursor: 'pointer', letterSpacing: 0.5,
            }}>
            {s === 'todos' ? 'Todos' : (ORDER_STATUS_LABEL[s as OrderStatus] || s)}
            {counts[s] > 0 && (
              <span style={{
                marginLeft: 6, fontSize: 10,
                background: filterStatus === s ? 'rgba(0,0,0,0.1)' : 'var(--surface)',
                padding: '1px 6px', borderRadius: 10,
              }}>
                {counts[s]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tabela de Pedidos */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>Carregando pedidos...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
            Nenhum pedido encontrado.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Pedido', 'Franqueado', 'Data', 'Valor', 'Status', 'Ações'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: 'var(--muted)', letterSpacing: 1 }}>
                    {h.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(order => (
                <tr key={order.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.1s' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 700 }}>{order.order_number}</div>
                    {order.vehicle_plate && (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                        <CarIcon size={12} /> {order.vehicle_plate}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text)' }}>
                    {(order.franchisee as any)?.company_name || '—'}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--muted)' }}>
                    {formatDate(order.created_at)}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>
                    {formatCurrency(order.total_amount)}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <StatusBadge status={order.status} />
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <Link to={`/admin/orders/${order.id}`}
                      style={{ color: 'var(--accent)', fontSize: 12, textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      Detalhes <ArrowRightIcon size={12} />
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