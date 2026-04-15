// src/pages/admin/Dashboard.tsx
import { useState, useEffect, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { Order } from '../../types';
import StatusBadge from '../../components/ui/StatusBadge';
import { DashboardIcon, OrdersIcon, FranchiseesIcon, FinanceIcon, WarningIcon, ArrowRightIcon } from '../../components/ui/Icons';
import { formatCurrency, formatDate } from '../../lib/utils';

interface Stats {
  total_franchisees: number;
  total_orders: number;
  pending: number;
  in_production: number;
  revenue_month: number;
  revenue_total: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const channel = supabase.channel('admin-dash')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => loadData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function loadData() {
    const [franchiseeRes, ordersRes, recentRes] = await Promise.all([
      supabase.from('franchisees').select('id, active'),
      supabase.from('orders').select('status, total_amount, created_at'),
      supabase.from('orders').select('*, franchisee:franchisees(company_name)')
        .order('created_at', { ascending: false }).limit(8),
    ]);

    const orders = ordersRes.data || [];
    const now = new Date();
    const monthOrders = orders.filter(o =>
      new Date(o.created_at).getMonth() === now.getMonth() &&
      new Date(o.created_at).getFullYear() === now.getFullYear()
    );

    setStats({
      total_franchisees: (franchiseeRes.data || []).length,
      total_orders: orders.length,
      pending: orders.filter(o => o.status === 'solicitado').length,
      in_production: orders.filter(o => o.status === 'em_producao').length,
      revenue_month: monthOrders.reduce((s, o) => s + (o.total_amount || 0), 0),
      revenue_total: orders.reduce((s, o) => s + (o.total_amount || 0), 0),
    });
    setRecent((recentRes.data || []) as unknown as Order[]);
    setLoading(false);
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>Painel Administrativo</h1>
        <p style={{ color: '#666', fontSize: 13, margin: 0 }}>Visão geral das operações Etork Brasil</p>
      </div>

      {stats && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 28 }}>
            <AdminStat label="Franqueados" value={stats.total_franchisees.toString()} color="#a855f7" icon={<FranchiseesIcon width={16} height={16} />} />
            <AdminStat label="Total de Pedidos" value={stats.total_orders.toString()} color="#3b82f6" icon={<OrdersIcon width={16} height={16} />} />
            <AdminStat label="Aguardando" value={stats.pending.toString()} color="#f59e0b" icon={<WarningIcon width={16} height={16} />} urgent={stats.pending > 0} />
            <AdminStat label="Em Produção" value={stats.in_production.toString()} color="#3b82f6" icon={<DashboardIcon width={16} height={16} />} />
            <AdminStat label="Receita do Mês" value={formatCurrency(stats.revenue_month)} color="#22c55e" icon={<FinanceIcon width={16} height={16} />} />
            <AdminStat label="Receita Total" value={formatCurrency(stats.revenue_total)} color="#e6b800" icon={<FinanceIcon width={16} height={16} />} />
          </div>

          {/* Urgent alert */}
          {stats.pending > 0 && (
            <div style={{
              padding: '12px 16px', marginBottom: 24,
              background: '#1a1200', border: '1px solid #3a2a00',
              borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <WarningIcon width={18} height={18} style={{ color: '#f59e0b' }} />
              <div>
                <div style={{ color: '#f59e0b', fontSize: 13, fontWeight: 700 }}>
                  {stats.pending} pedido(s) aguardando processamento
                </div>
                <div style={{ color: '#8a6500', fontSize: 11, marginTop: 2 }}>
                  Clique para revisar e iniciar produção
                </div>
              </div>
              <Link to="/admin/orders?status=solicitado" style={{
                marginLeft: 'auto', padding: '8px 16px',
                background: '#e6b800', color: '#000', borderRadius: 8,
                fontSize: 11, fontWeight: 700, textDecoration: 'none',
                display: 'inline-flex', alignItems: 'center', gap: 4,
              }}>
                Ver Pedidos <ArrowRightIcon width={14} height={14} />
              </Link>
            </div>
          )}
        </>
      )}

      {/* Recent orders */}
      <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #1e1e1e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ color: '#fff', fontSize: 14, fontWeight: 600, margin: 0 }}>Pedidos Recentes</h2>
          <Link to="/admin/orders" style={{ color: '#e6b800', fontSize: 12, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>Ver todos <ArrowRightIcon width={12} height={12} /></Link>
        </div>
        {loading ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#555' }}>Carregando...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1a1a1a' }}>
                {['Pedido', 'Franqueado', 'Data', 'Valor', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '9px 16px', textAlign: 'left', fontSize: 10, color: '#555', letterSpacing: 1 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.map(order => (
                <tr key={order.id} style={{ borderBottom: '1px solid #161616' }}>
                  <td style={{ padding: '11px 16px', color: '#e6b800', fontWeight: 700, fontSize: 13 }}>{order.order_number}</td>
                  <td style={{ padding: '11px 16px', color: '#ccc', fontSize: 12 }}>
                    {(order.franchisee as unknown as { company_name: string })?.company_name || '—'}
                  </td>
                  <td style={{ padding: '11px 16px', color: '#666', fontSize: 12 }}>{formatDate(order.created_at)}</td>
                  <td style={{ padding: '11px 16px', color: '#fff', fontWeight: 600, fontSize: 13 }}>{formatCurrency(order.total_amount)}</td>
                  <td style={{ padding: '11px 16px' }}><StatusBadge status={order.status} /></td>
                  <td style={{ padding: '11px 16px' }}>
                    <Link to={`/admin/orders/${order.id}`} style={{ color: '#e6b800', fontSize: 12, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>Detalhes <ArrowRightIcon width={12} height={12} /></Link>
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

function AdminStat({ label, value, color, icon, urgent = false }: { label: string; value: string; color: string; icon: ReactNode; urgent?: boolean }) {
  return (
    <div style={{
      background: urgent ? '#1a1200' : '#111',
      border: `1px solid ${urgent ? '#3a2a00' : '#1e1e1e'}`,
      borderRadius: 10, padding: '14px 16px',
      borderLeft: `3px solid ${color}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <span style={{ fontSize: 12, color }}>{icon}</span>
        <span style={{ fontSize: 10, color: '#666', letterSpacing: 1 }}>{label.toUpperCase()}</span>
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: urgent ? color : '#fff' }}>{value}</div>
    </div>
  );
}
