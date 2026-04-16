// src/pages/franchise/Dashboard.tsx

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import logoImg from '../../assets/logoetork.png';
import type { Announcement, Order, DashboardStats } from '../../types';
import StatusBadge from '../../components/ui/StatusBadge';
import { PlusIcon, ArrowRightIcon, WaveIcon } from '../../components/ui/Icons';
import { formatCurrency, formatDate } from '../../lib/utils';
import { useTheme } from '../../context/ThemeContext';

// Ícones adicionais
const IconMoney = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 6v6l4 2"/>
  </svg>
);

const IconRefresh = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 4v6h-6"/>
    <path d="M1 20v-6h6"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"/>
    <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14"/>
  </svg>
);

const IconCalendar = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const IconTrendingUp = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8 10 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
  </svg>
);

const IconAlertCircle = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

const IconMegaphone = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 11h18v2H3z"/>
    <path d="M5 11v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/>
    <path d="M8 2v3"/>
    <path d="M16 2v3"/>
  </svg>
);

const IconClipboard = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
  </svg>
);

const IconLoader = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 2a10 10 0 0 1 10 10"/>
  </svg>
);

const DEFAULT_ANNOUNCEMENT_BODY = `NOVAS SOLUÇÕES DE REPROGRAMAÇÃO (FERRAMENTAS KESS3 TRANSDATA)
Novas soluções ADBLUI ODD
DAFF 530 EURO 6 (NO MODULO DO ARLA CM 1881)
...`;

export default function FranchiseDashboard() {
  const { franchisee, profile } = useAuth();
  const { theme: currentTheme } = useTheme();
  const isDark = currentTheme === 'dark';
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);

  // Sistema de cores padronizado
  const colors = {
    background: isDark ? '#0d0d0d' : '#f3f4f6',
    surface: isDark ? '#141414' : '#ffffff',
    surfaceHover: isDark ? '#1c1c1c' : '#fafafa',
    text: isDark ? '#e5e5e5' : '#1a1a1a',
    textSecondary: isDark ? '#888888' : '#6b7280',
    textMuted: isDark ? '#666666' : '#9ca3af',
    border: isDark ? '#222222' : '#e5e7eb',
    borderLight: isDark ? '#1a1a1a' : '#f3f4f6',
    accent: '#e6b800',
    accentHover: '#f5c518',
    tableHeaderBg: isDark ? '#0d0d0d' : '#f9fafb',
    tableRowHover: isDark ? '#1a1a1a' : '#f9fafb',
  };

  useEffect(() => {
    if (!franchisee) {
      setStats(null);
      setRecentOrders([]);
      setAnnouncement(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    loadData();
    loadAnnouncement();

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

  async function loadAnnouncement() {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Erro carregando aviso geral', error);
      return;
    }

    setAnnouncement(data || null);
  }

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const spinKeyframes = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;

  if (!franchisee && !loading) {
    return (
      <div style={{ background: colors.background, minHeight: '100vh', padding: 24 }}>
        <style>{spinKeyframes}</style>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 32 }}>
            <h1 style={{ margin: 0, fontSize: 22, color: colors.text }}>Aguardando ativação</h1>
            <p style={{ color: colors.textSecondary, marginTop: 8 }}>Seu cadastro de franqueado ainda não foi vinculado. Peça ao administrador para concluir a ativação.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: colors.background, minHeight: '100vh' }}>
      <style>{spinKeyframes}</style>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px' }}>
        
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ color: colors.text, fontSize: 24, fontWeight: 700, margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
            {greeting()}, {profile?.full_name?.split(' ')[0]} 
            <WaveIcon width={22} height={22} />
          </h1>
          <p style={{ color: colors.textSecondary, fontSize: 14, margin: 0 }}>
            {franchisee?.company_name} · Código: {franchisee?.code}
          </p>
        </div>

        {/* Announcement Banner */}
        <div style={{ 
          marginBottom: 32, 
          padding: '20px 24px', 
          background: isDark ? '#1a1410' : '#fff7ed', 
          border: `1px solid ${isDark ? '#332a1a' : '#fed7aa'}`,
          borderRadius: 12, 
          display: 'flex', 
          gap: 20, 
          alignItems: 'flex-start',
        }}>
          <div style={{
            width: 48,
            height: 48,
            background: isDark ? '#000000' : '#ffffff',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 8,
          }}>
            <img src={logoImg} alt="ETORK Brasil" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ 
              fontSize: 11, 
              fontWeight: 700, 
              textTransform: 'uppercase', 
              letterSpacing: 1.5, 
              marginBottom: 10, 
              color: isDark ? '#fbbf24' : '#b45309',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}>
              <IconMegaphone />
              Avisos Gerais
            </div>
            <div style={{ 
              whiteSpace: 'pre-wrap', 
              fontSize: 13, 
              lineHeight: 1.6, 
              color: colors.text,
              fontWeight: 500
            }}>
              {announcement?.body || DEFAULT_ANNOUNCEMENT_BODY}
            </div>
          </div>
        </div>

        {/* Stats grid */}
        {stats && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
            gap: 16, 
            marginBottom: 32 
          }}>
            <StatCard 
              label="Saldo Disponível" 
              value={formatCurrency(stats.balance + stats.credit_limit)} 
              icon={<IconMoney />}
              accent={colors.accent}
              isDark={isDark}
              colors={colors}
            />
            <StatCard 
              label="Pedidos em Andamento" 
              value={stats.pending_orders.toString()} 
              icon={<IconRefresh />}
              accent="#3b82f6"
              isDark={isDark}
              colors={colors}
            />
            <StatCard 
              label="Pedidos este Mês" 
              value={stats.orders_this_month.toString()} 
              icon={<IconCalendar />}
              accent="#8b5cf6"
              isDark={isDark}
              colors={colors}
            />
            <StatCard 
              label="Total Investido" 
              value={formatCurrency(stats.total_spent)} 
              icon={<IconTrendingUp />}
              accent="#10b981"
              isDark={isDark}
              colors={colors}
            />
          </div>
        )}

        {/* Quick action button */}
        <Link
          to="/orders/new"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 24px',
            background: colors.accent,
            color: '#000000',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 700,
            textDecoration: 'none',
            letterSpacing: 0.5,
            marginBottom: 32,
            transition: 'all 0.2s',
            border: 'none',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = colors.accentHover;
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = colors.accent;
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <PlusIcon width={16} height={16} /> 
          NOVO PEDIDO
        </Link>

        {/* Recent orders table */}
        <div style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: 12,
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '18px 24px',
            borderBottom: `1px solid ${colors.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}>
            <h2 style={{ color: colors.text, fontSize: 16, fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <IconClipboard />
              Pedidos Recentes
            </h2>
            <Link 
              to="/orders" 
              style={{ 
                color: colors.accent, 
                fontSize: 12, 
                textDecoration: 'none', 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: 6,
                fontWeight: 600,
                transition: 'gap 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.gap = '10px';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.gap = '6px';
              }}
            >
              Ver todos os pedidos 
              <ArrowRightIcon width={12} height={12} />
            </Link>
          </div>

          {loading ? (
            <div style={{ padding: 48, textAlign: 'center', color: colors.textSecondary, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <IconLoader />
              Carregando pedidos...
            </div>
          ) : recentOrders.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: colors.textSecondary, fontSize: 13 }}>
              Nenhum pedido encontrado. 
              <Link to="/orders/new" style={{ color: colors.accent, marginLeft: 6, textDecoration: 'none', fontWeight: 600 }}>
                Criar primeiro pedido →
              </Link>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ 
                    borderBottom: `1px solid ${colors.border}`,
                    background: colors.tableHeaderBg
                  }}>
                    {['PEDIDO', 'DATA', 'VALOR', 'STATUS'].map(header => (
                      <th key={header} style={{ 
                        padding: '12px 20px', 
                        textAlign: 'left', 
                        fontSize: 11, 
                        fontWeight: 700, 
                        color: colors.textSecondary, 
                        letterSpacing: 1,
                        textTransform: 'uppercase'
                      }}>
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order, index) => (
                    <tr 
                      key={order.id} 
                      style={{ 
                        borderBottom: index === recentOrders.length - 1 ? 'none' : `1px solid ${colors.border}`,
                        transition: 'background 0.15s',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = colors.tableRowHover;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                      onClick={() => window.location.href = `/orders/${order.id}`}
                    >
                      <td style={{ padding: '14px 20px', fontSize: 13, color: colors.accent, fontWeight: 600 }}>
                        {order.order_number}
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: 13, color: colors.textSecondary }}>
                        {formatDate(order.created_at)}
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: 13, color: colors.text, fontWeight: 600 }}>
                        {formatCurrency(order.total_amount)}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <StatusBadge status={order.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Componente StatCard melhorado
function StatCard({ label, value, icon, accent, isDark, colors }: { 
  label: string; 
  value: string; 
  icon: React.ReactNode;
  accent: string; 
  isDark: boolean;
  colors: any;
}) {
  return (
    <div style={{
      background: colors.surface,
      border: `1px solid ${colors.border}`,
      borderRadius: 12,
      padding: '20px',
      borderLeft: `3px solid ${accent}`,
      transition: 'transform 0.2s, box-shadow 0.2s',
      cursor: 'pointer',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = isDark ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.05)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = 'none';
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
      }}>
        <div style={{ 
          fontSize: 11, 
          color: colors.textSecondary, 
          fontWeight: 700, 
          letterSpacing: 1,
          textTransform: 'uppercase'
        }}>
          {label}
        </div>
        <div style={{ color: accent }}>
          {icon}
        </div>
      </div>
      <div style={{ 
        fontSize: 24, 
        fontWeight: 800, 
        color: colors.text,
        lineHeight: 1.2
      }}>
        {value}
      </div>
    </div>
  );
}