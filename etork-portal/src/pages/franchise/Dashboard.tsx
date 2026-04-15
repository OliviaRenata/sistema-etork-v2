// src/pages/franchise/Dashboard.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import type { Order, DashboardStats } from '../../types';
import { ORDER_STATUS_LABEL, ORDER_STATUS_COLOR } from '../../types';
import StatusBadge from '../../components/ui/StatusBadge';
import { formatCurrency, formatDate } from '../../lib/utils';

export default function FranchiseDashboard() {
  const { franchisee, profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!franchisee) return;
    loadData();

    // Realtime subscription for order updates
    const channel = supabase
      .channel('orders-updates')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'orders',
        filter: `franchisee_id=eq.${franchisee.id}`,
      }, () => loadData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [franchisee]);

  async function loadData() {
    if (!franchisee) return;
    try {
      const [ordersRes, statsRes] = await Promise.all([
        supabase.from('orders')
          .select('*, order_items(count)')
          .eq('franchisee_id', franchisee.id)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase.from('orders')
          .select('status, total_amount, created_at')
          .eq('franchisee_id', franchisee.id),
      ]);

      const orders = ordersRes.data || [];
      const allOrders = statsRes.data || [];
      const now = new Date();
      const thisMonth = allOrders.filter(o =>
        new Date(o.created_at).getMonth() === now.getMonth() &&
        new Date(o.created_at).getFullYear() === now.getFullYear()
      );

      setRecentOrders(orders as Order[]);
      setStats({
        total_orders: allOrders.length,
        orders_this_month: thisMonth.length,
        pending_orders: allOrders.filter(o => ['solicitado', 'em_producao'].includes(o.status)).length,
        total_spent: allOrders.reduce((s, o) => s + (o.total_amount || 0), 0),
        balance: franchisee.balance,
        credit_limit: franchisee.credit_limit,
      });
    } finally {
      setLoading(false);
    }
  }

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>
          {greeting()}, {profile?.full_name?.split(' ')[0]} 👋
        </h1>
        <p style={{ color: '#666', fontSize: 14, margin: 0 }}>
          {franchisee?.company_name} · Código: {franchisee?.code}
        </p>
      </div>

      {/* Stats grid */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 28 }}>
          <StatCard label="Saldo Disponível" value={formatCurrency(stats.balance + stats.credit_limit)} accent="#e6b800" />
          <StatCard label="Pedidos Ativos" value={stats.pending_orders.toString()} accent="#3b82f6" />
          <StatCard label="Pedidos este Mês" value={stats.orders_this_month.toString()} accent="#a855f7" />
          <StatCard label="Total Gasto" value={formatCurrency(stats.total_spent)} accent="#22c55e" />
        </div>
      )}

      {/* Quick action */}
      <Link
        to="/orders/new"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '11px 20px', background: '#e6b800', color: '#000',
          borderRadius: 8, fontSize: 13, fontWeight: 700,
          textDecoration: 'none', letterSpacing: 0.5, marginBottom: 28,
          transition: 'background 0.15s',
        }}
      >
        ⊕ Novo Pedido
      </Link>

      {/* Recent orders */}
      <div style={{
        background: '#111', border: '1px solid #1e1e1e', borderRadius: 12, overflow: 'hidden',
      }}>
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid #1e1e1e',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <h2 style={{ color: '#fff', fontSize: 14, fontWeight: 600, margin: 0 }}>Pedidos Recentes</h2>
          <Link to="/orders" style={{ color: '#e6b800', fontSize: 12, textDecoration: 'none' }}>Ver todos →</Link>
        </div>

        {loading ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#555', fontSize: 13 }}>Carregando...</div>
        ) : recentOrders.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#555', fontSize: 13 }}>
            Nenhum pedido ainda. <Link to="/orders/new" style={{ color: '#e6b800' }}>Criar primeiro pedido →</Link>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1a1a1a' }}>
                {['Pedido', 'Data', 'Valor', 'Status'].map(h => (
                  <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#555', letterSpacing: 1 }}>{h.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentOrders.map(order => (
                <tr key={order.id} style={{ borderBottom: '1px solid #161616' }}>
                  <td style={{ padding: '12px 20px', fontSize: 13, color: '#e6b800', fontWeight: 600 }}>
                    {order.order_number}
                  </td>
                  <td style={{ padding: '12px 20px', fontSize: 13, color: '#888' }}>
                    {formatDate(order.created_at)}
                  </td>
                  <td style={{ padding: '12px 20px', fontSize: 13, color: '#fff', fontWeight: 600 }}>
                    {formatCurrency(order.total_amount)}
                  </td>
                  <td style={{ padding: '12px 20px' }}>
                    <StatusBadge status={order.status} />
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

function StatCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div style={{
      background: '#111', border: '1px solid #1e1e1e',
      borderRadius: 10, padding: '16px 18px',
      borderLeft: `3px solid ${accent}`,
    }}>
      <div style={{ fontSize: 11, color: '#666', fontWeight: 600, letterSpacing: 1, marginBottom: 8 }}>
        {label.toUpperCase()}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>
        {value}
      </div>
    </div>
  );
}
