// src/pages/franchise/Dashboard.tsx

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import type { Order, DashboardStats } from '../../types';
import { ORDER_STATUS_LABEL, ORDER_STATUS_COLOR } from '../../types';
import StatusBadge from '../../components/ui/StatusBadge';
import { PlusIcon, ArrowRightIcon, WaveIcon } from '../../components/ui/Icons';
import { formatCurrency, formatDate } from '../../lib/utils';
import { useTheme } from '../../context/ThemeContext';

export default function FranchiseDashboard() {
  const { franchisee, profile } = useAuth();
  const { theme: currentTheme } = useTheme();
  const isDark = currentTheme === 'dark';
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Cores baseadas no tema
  const colors = {
    text: isDark ? '#e0e0e0' : '#1a1a1a',
    textMuted: isDark ? '#888888' : '#666666',
    surface: isDark ? '#111111' : '#ffffff',
    border: isDark ? '#222222' : '#e0e0e0',
    accent: '#e6b800',
    statBg: isDark ? '#111111' : '#ffffff',
    statBorder: isDark ? '#222222' : '#e0e0e0',
    tableHeaderBg: isDark ? 'transparent' : '#f5f5f5',
    tableBorder: isDark ? '#1a1a1a' : '#eeeeee',
    rowBorder: isDark ? 'var(--border)' : '#f0f0f0',
  };

  useEffect(() => {
    if (!franchisee) {
      setStats(null);
      setRecentOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
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

  if (!franchisee && !loading) {
    return (
      <div style={{ color: colors.text, padding: 24 }}>
        <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 24 }}>
          <h1 style={{ margin: 0, fontSize: 22, color: colors.text }}>Aguardando ativação</h1>
          <p style={{ color: colors.textMuted, marginTop: 8 }}>Seu cadastro de franqueado ainda não foi vinculado. Peça ao administrador para concluir a ativação.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ color: colors.text }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ color: colors.text, fontSize: 22, fontWeight: 700, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
          {greeting()}, {profile?.full_name?.split(' ')[0]} <WaveIcon width={20} height={20} />
        </h1>
        <p style={{ color: colors.textMuted, fontSize: 14, margin: 0 }}>
          {franchisee?.company_name} · Código: {franchisee?.code}
        </p>
      </div>

      {/* Stats grid */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 28 }}>
          <StatCard 
            label="Saldo Disponível" 
            value={formatCurrency(stats.balance + stats.credit_limit)} 
            accent={colors.accent}
            isDark={isDark}
          />
          <StatCard 
            label="Pedidos Ativos" 
            value={stats.pending_orders.toString()} 
            accent="#3b82f6"
            isDark={isDark}
          />
          <StatCard 
            label="Pedidos este Mês" 
            value={stats.orders_this_month.toString()} 
            accent="#a855f7"
            isDark={isDark}
          />
          <StatCard 
            label="Total Gasto" 
            value={formatCurrency(stats.total_spent)} 
            accent="#22c55e"
            isDark={isDark}
          />
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
        <PlusIcon width={16} height={16} /> Novo Pedido
      </Link>

      {/* Recent orders */}
      <div style={{
        background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 12, overflow: 'hidden',
      }}>
        <div style={{
          padding: '16px 20px', borderBottom: `1px solid ${colors.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <h2 style={{ color: colors.text, fontSize: 14, fontWeight: 600, margin: 0 }}>Pedidos Recentes</h2>
          <Link to="/orders" style={{ color: colors.accent, fontSize: 12, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            Ver todos <ArrowRightIcon width={12} height={12} />
          </Link>
        </div>

        {loading ? (
          <div style={{ padding: 32, textAlign: 'center', color: colors.textMuted, fontSize: 13 }}>Carregando...</div>
        ) : recentOrders.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: colors.textMuted, fontSize: 13 }}>
            Nenhum pedido ainda. <Link to="/orders/new" style={{ color: '#e6b800', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              Criar primeiro pedido <ArrowRightIcon width={12} height={12} />
            </Link>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${colors.tableBorder}`, background: colors.tableHeaderBg }}>
                {['Pedido', 'Data', 'Valor', 'Status'].map(h => (
                  <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: colors.textMuted, letterSpacing: 1 }}>
                    {h.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentOrders.map(order => (
                <tr key={order.id} style={{ borderBottom: `1px solid ${colors.rowBorder}` }}>
                  <td style={{ padding: '12px 20px', fontSize: 13, color: colors.accent, fontWeight: 600 }}>
                    {order.order_number}
                  </td>
                  <td style={{ padding: '12px 20px', fontSize: 13, color: colors.textMuted }}>
                    {formatDate(order.created_at)}
                  </td>
                  <td style={{ padding: '12px 20px', fontSize: 13, color: colors.text, fontWeight: 600 }}>
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

function StatCard({ label, value, accent, isDark }: { label: string; value: string; accent: string; isDark: boolean }) {
  return (
    <div style={{
      background: isDark ? '#111111' : '#ffffff',
      border: `1px solid ${isDark ? '#222222' : '#e0e0e0'}`,
      borderRadius: 10, padding: '16px 18px',
      borderLeft: `3px solid ${accent}`,
    }}>
      <div style={{ fontSize: 11, color: isDark ? '#888888' : '#666666', fontWeight: 600, letterSpacing: 1, marginBottom: 8 }}>
        {label.toUpperCase()}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: isDark ? '#e0e0e0' : '#1a1a1a' }}>
        {value}
      </div>
    </div>
  );
}