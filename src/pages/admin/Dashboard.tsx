// src/pages/admin/Dashboard.tsx
import { useState, useEffect, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import logoImg from '../../assets/logoetork.png';
import type { Announcement, Order, Franchisee } from '../../types';
import StatusBadge from '../../components/ui/StatusBadge';
import { DashboardIcon, OrdersIcon, FranchiseesIcon, FinanceIcon, WarningIcon, ArrowRightIcon } from '../../components/ui/Icons';
import { formatCurrency, formatDate } from '../../lib/utils';
import { useTheme } from '../../context/ThemeContext';

// Ícones adicionais - SEM props style para evitar erro
const IconTrendingUp = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 6 13.5 15.5 8 10 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
  </svg>
);

const IconUsers = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const IconPackage = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.29 7 12 12 20.71 7"/>
    <line x1="12" y1="22" x2="12" y2="12"/>
  </svg>
);

const IconAlertTriangle = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const IconCheckCircle = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

const IconClock = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

const IconLoader = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 2a10 10 0 0 1 10 10"/>
  </svg>
);

const IconEdit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 3l4 4-7 7H10v-4l7-7z"/>
    <path d="M4 20h16"/>
  </svg>
);

interface FranchiseeStats {
  id: string;
  company_name: string;
  code: string;
  total_orders: number;
  total_spent: number;
  pending_orders: number;
  last_order_date: string | null;
}

interface Stats {
  total_franchisees: number;
  active_franchisees: number;
  total_orders: number;
  pending: number;
  in_production: number;
  completed: number;
  revenue_month: number;
  revenue_total: number;
  avg_order_value: number;
}

export default function AdminDashboard() {
  const { profile } = useAuth();
  const { theme: currentTheme } = useTheme();
  const isDark = currentTheme === 'dark';
  
  const [stats, setStats] = useState<Stats | null>(null);
  const [franchiseeStats, setFranchiseeStats] = useState<FranchiseeStats[]>([]);
  const [recent, setRecent] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [draftBody, setDraftBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'year' | 'all'>('month');

  const colors = {
    background: isDark ? '#0d0d0d' : '#f3f4f6',
    surface: isDark ? '#141414' : '#ffffff',
    surfaceHover: isDark ? '#1c1c1c' : '#fafafa',
    text: isDark ? '#e5e5e5' : '#1a1a1a',
    textSecondary: isDark ? '#888888' : '#6b7280',
    textMuted: isDark ? '#666666' : '#9ca3af',
    border: isDark ? '#222222' : '#e5e7eb',
    accent: '#e6b800',
    accentHover: '#f5c518',
    tableHeaderBg: isDark ? '#0d0d0d' : '#f9fafb',
    tableRowHover: isDark ? '#1a1a1a' : '#f9fafb',
  };

  useEffect(() => {
    loadData();
    loadAnnouncement();
    
    const channel = supabase.channel('admin-dash')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'franchisees' }, () => loadData())
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, [selectedPeriod]);

  async function loadData() {
    setLoading(true);
    
    try {
      const [franchiseesRes, ordersRes] = await Promise.all([
        supabase.from('franchisees').select('id, company_name, code, balance, credit_limit, active'),
        supabase.from('orders').select('*, franchisee:franchisees(company_name, code)').order('created_at', { ascending: false })
      ]);
      
      const franchisees = franchiseesRes.data || [];
      const orders = ordersRes.data || [];
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      let filteredOrders = orders;
      if (selectedPeriod === 'month') {
        filteredOrders = orders.filter(o => 
          new Date(o.created_at).getMonth() === currentMonth &&
          new Date(o.created_at).getFullYear() === currentYear
        );
      } else if (selectedPeriod === 'year') {
        filteredOrders = orders.filter(o => 
          new Date(o.created_at).getFullYear() === currentYear
        );
      }
      
      const franchiseeStatsData: FranchiseeStats[] = franchisees.map(f => {
        const franchiseeOrders = orders.filter(o => o.franchisee_id === f.id);
        const lastOrder = franchiseeOrders[0];
        
        return {
          id: f.id,
          company_name: f.company_name,
          code: f.code,
          total_orders: franchiseeOrders.length,
          total_spent: franchiseeOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
          pending_orders: franchiseeOrders.filter(o => ['solicitado', 'em_producao'].includes(o.status)).length,
          last_order_date: lastOrder ? lastOrder.created_at : null,
        };
      }).sort((a, b) => b.total_spent - a.total_spent);
      
      const activeFranchisees = franchisees.filter(f => f.active === true).length;
      const monthOrders = selectedPeriod === 'month' ? filteredOrders : orders.filter(o =>
        new Date(o.created_at).getMonth() === currentMonth &&
        new Date(o.created_at).getFullYear() === currentYear
      );
      
      const completedOrders = orders.filter(o => o.status === 'entregue');
      const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
      const avgOrderValue = filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0;
      
      setStats({
        total_franchisees: franchisees.length,
        active_franchisees: activeFranchisees,
        total_orders: filteredOrders.length,
        pending: orders.filter(o => o.status === 'solicitado').length,
        in_production: orders.filter(o => o.status === 'em_producao').length,
        completed: completedOrders.length,
        revenue_month: monthOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
        revenue_total: totalRevenue,
        avg_order_value: avgOrderValue,
      });
      
      setFranchiseeStats(franchiseeStatsData);
      setRecent(orders.slice(0, 10));
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadAnnouncement() {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Erro carregando aviso geral', error);
      return;
    }

    setAnnouncement(data || null);
    setDraftBody(data?.body || 'NOVAS SOLUÇÕES DE REPROGRAMAÇÃO (FERRAMENTAS KESS3 TRANSDATA)\nNovas soluções ADBLUI ODD\nDAFF 530 EURO 6 (NO MODULO DO ARLA CM 1881)\n...');
  }

  async function saveAnnouncement() {
    if (!profile) return;
    if (!draftBody.trim()) {
      setNoticeMessage('O aviso não pode ficar vazio.');
      return;
    }

    setSaving(true);
    setNoticeMessage('');

    const payload = {
      id: announcement?.id,
      title: 'Aviso Geral',
      body: draftBody.trim(),
      active: true,
      created_by: profile.id,
    };

    const { data, error } = await supabase
      .from('announcements')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('Erro salvando aviso geral', error);
      setNoticeMessage('Erro ao salvar aviso.');
    } else {
      setAnnouncement(data);
      setNoticeMessage('Aviso salvo com sucesso.');
      setTimeout(() => setNoticeMessage(''), 3000);
    }

    setSaving(false);
  }

  const spinKeyframes = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;

  return (
    <div style={{ background: colors.background, minHeight: '100vh' }}>
      <style>{spinKeyframes}</style>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px' }}>
        
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ color: colors.text, fontSize: 24, fontWeight: 700, margin: '0 0 8px' }}>
            Painel Administrativo
          </h1>
          <p style={{ color: colors.textSecondary, fontSize: 14, margin: 0 }}>
            Visão geral completa das operações Etork Brasil
          </p>
        </div>

        {/* Announcement Banner */}
        <div style={{ 
          background: colors.surface, 
          border: `1px solid ${colors.border}`, 
          borderRadius: 12, 
          padding: 24, 
          marginBottom: 32 
        }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 20 }}>
            <div style={{
              width: 48,
              height: 48,
              background: isDark ? '#000000' : '#f3f4f6',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <img src={logoImg} alt="ETORK Brasil" style={{ width: 32, height: 32, objectFit: 'contain' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: colors.text }}>Aviso Geral</div>
              <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 4 }}>Edite o texto abaixo para mostrar avisos importantes aos franqueados</div>
            </div>
          </div>

          <textarea
            value={draftBody}
            onChange={e => setDraftBody(e.target.value)}
            rows={5}
            style={{ 
              width: '100%', 
              background: isDark ? '#0d0d0d' : '#f9fafb',
              color: colors.text, 
              border: `1px solid ${colors.border}`, 
              borderRadius: 10, 
              padding: 12, 
              resize: 'vertical', 
              fontSize: 13, 
              lineHeight: 1.6,
              fontFamily: 'inherit'
            }}
          />

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 16, alignItems: 'center' }}>
            <button
              type="button"
              onClick={saveAnnouncement}
              disabled={saving}
              style={{ 
                background: colors.accent, 
                color: '#000', 
                border: 'none', 
                borderRadius: 8, 
                padding: '10px 20px', 
                cursor: 'pointer', 
                fontWeight: 700,
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              {saving ? <IconLoader /> : <IconEdit />}
              {saving ? 'SALVANDO...' : 'SALVAR AVISO'}
            </button>
            <button
              type="button"
              onClick={() => setDraftBody(announcement?.body || '')}
              style={{ 
                background: colors.surfaceHover, 
                color: colors.text, 
                border: `1px solid ${colors.border}`, 
                borderRadius: 8, 
                padding: '10px 20px', 
                cursor: 'pointer', 
                fontWeight: 600,
                fontSize: 12
              }}
            >
              Reverter
            </button>
            {noticeMessage && (
              <div style={{ 
                color: noticeMessage.includes('Erro') ? '#ef4444' : '#10b981', 
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}>
                {noticeMessage.includes('Erro') ? <IconAlertTriangle /> : <IconCheckCircle />}
                {noticeMessage}
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
              <div style={{ 
                display: 'inline-flex', 
                background: colors.surface, 
                border: `1px solid ${colors.border}`, 
                borderRadius: 8, 
                padding: 4 
              }}>
                {(['month', 'year', 'all'] as const).map(period => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    style={{
                      padding: '6px 16px',
                      fontSize: 12,
                      fontWeight: 600,
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      background: selectedPeriod === period ? colors.accent : 'transparent',
                      color: selectedPeriod === period ? '#000' : colors.textSecondary,
                      transition: 'all 0.15s'
                    }}
                  >
                    {period === 'month' ? 'Este Mês' : period === 'year' ? 'Este Ano' : 'Todo Período'}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
              <AdminStat 
                label="Franqueados" 
                value={stats.total_franchisees.toString()} 
                subtitle={`${stats.active_franchisees} ativos`}
                color="#8b5cf6" 
                icon={<IconUsers />}
                colors={colors}
              />
              <AdminStat 
                label="Total de Pedidos" 
                value={stats.total_orders.toString()} 
                color="#3b82f6" 
                icon={<IconPackage />}
                colors={colors}
              />
              <AdminStat 
                label="Aguardando" 
                value={stats.pending.toString()} 
                color="#f59e0b" 
                icon={<IconClock />}
                urgent={stats.pending > 0}
                colors={colors}
              />
              <AdminStat 
                label="Em Produção" 
                value={stats.in_production.toString()} 
                color="#06b6d4" 
                icon={<IconPackage />}
                colors={colors}
              />
              <AdminStat 
                label="Ticket Médio" 
                value={formatCurrency(stats.avg_order_value)} 
                color="#10b981" 
                icon={<IconTrendingUp />}
                colors={colors}
              />
              <AdminStat 
                label="Receita Total" 
                value={formatCurrency(stats.revenue_total)} 
                color={colors.accent} 
                icon={<FinanceIcon width={18} height={18} />}
                colors={colors}
              />
            </div>
          </>
        )}

        {/* Urgent Alert */}
        {stats && stats.pending > 0 && (
          <div style={{
            padding: '16px 20px',
            marginBottom: 32,
            background: isDark ? '#1a1200' : '#fef3c7',
            border: `1px solid ${isDark ? '#3a2a00' : '#fde68a'}`,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}>
            <div style={{ color: '#f59e0b' }}><IconAlertTriangle /></div>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#f59e0b', fontSize: 13, fontWeight: 700 }}>
                {stats.pending} pedido(s) aguardando processamento
              </div>
              <div style={{ color: isDark ? '#8a6500' : '#92400e', fontSize: 11, marginTop: 2 }}>
                Clique para revisar e iniciar produção
              </div>
            </div>
            <Link to="/admin/orders?status=solicitado" style={{
              padding: '8px 16px',
              background: colors.accent,
              color: '#000',
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 700,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}>
              Ver Pedidos <ArrowRightIcon width={14} height={14} />
            </Link>
          </div>
        )}

        {/* Top Franqueados */}
        {franchiseeStats.length > 0 && (
          <div style={{
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: 12,
            overflow: 'hidden',
            marginBottom: 32,
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: `1px solid ${colors.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <h2 style={{ color: colors.text, fontSize: 14, fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <IconUsers />
                Ranking de Franqueados
              </h2>
              <Link to="/admin/franchisees" style={{ color: colors.accent, fontSize: 12, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                Gerenciar <ArrowRightIcon width={12} height={12} />
              </Link>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${colors.border}`, background: colors.tableHeaderBg }}>
                    {['FRANQUEADO', 'CÓDIGO', 'PEDIDOS', 'VALOR TOTAL', 'PENDENTES', 'ÚLTIMO PEDIDO'].map(header => (
                      <th key={header} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: colors.textMuted, letterSpacing: 1 }}>
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {franchiseeStats.slice(0, 5).map((f, index) => (
                    <tr key={f.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: colors.text }}>
                        #{index + 1} {f.company_name}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: colors.textSecondary }}>
                        {f.code}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: colors.text }}>
                        {f.total_orders}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: colors.accent }}>
                        {formatCurrency(f.total_spent)}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {f.pending_orders > 0 ? (
                          <span style={{ color: '#f59e0b', fontSize: 12, fontWeight: 600 }}>
                            {f.pending_orders}
                          </span>
                        ) : (
                          <span style={{ color: '#10b981', fontSize: 12 }}>✓</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: colors.textSecondary }}>
                        {f.last_order_date ? formatDate(f.last_order_date) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Recent Orders */}
        <div style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: 12,
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '16px 20px',
            borderBottom: `1px solid ${colors.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <h2 style={{ color: colors.text, fontSize: 14, fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <IconPackage />
              Últimos Pedidos
            </h2>
            <Link to="/admin/orders" style={{ color: colors.accent, fontSize: 12, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              Ver todos <ArrowRightIcon width={12} height={12} />
            </Link>
          </div>
          
          {loading ? (
            <div style={{ padding: 48, textAlign: 'center', color: colors.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <IconLoader />
              Carregando...
            </div>
          ) : recent.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: colors.textMuted }}>
              Nenhum pedido encontrado
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${colors.border}`, background: colors.tableHeaderBg }}>
                    {['PEDIDO', 'FRANQUEADO', 'DATA', 'VALOR', 'STATUS', ''].map(header => (
                      <th key={header} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: colors.textMuted, letterSpacing: 1 }}>
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recent.map(order => (
                    <tr 
                      key={order.id} 
                      style={{ borderBottom: `1px solid ${colors.border}`, cursor: 'pointer' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = colors.tableRowHover; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                      onClick={() => window.location.href = `/admin/orders/${order.id}`}
                    >
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: colors.accent }}>
                        {order.order_number}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: colors.text }}>
                        {(order.franchisee as unknown as { company_name: string })?.company_name || '—'}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: colors.textSecondary }}>
                        {formatDate(order.created_at)}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: colors.text }}>
                        {formatCurrency(order.total_amount)}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <StatusBadge status={order.status} />
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <Link to={`/admin/orders/${order.id}`} style={{ color: colors.accent, fontSize: 12, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          Detalhes <ArrowRightIcon width={12} height={12} />
                        </Link>
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

function AdminStat({ label, value, subtitle, color, icon, urgent = false, colors }: { 
  label: string; 
  value: string; 
  subtitle?: string;
  color: string; 
  icon: ReactNode; 
  urgent?: boolean;
  colors: any;
}) {
  return (
    <div style={{
      background: colors.surface,
      border: `1px solid ${urgent ? '#3a2a00' : colors.border}`,
      borderRadius: 10,
      padding: '16px 18px',
      borderLeft: `3px solid ${color}`,
      transition: 'transform 0.2s',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-2px)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 10, color: colors.textMuted, fontWeight: 700, letterSpacing: 1 }}>
          {label.toUpperCase()}
        </span>
        <span style={{ color }}>{icon}</span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: urgent ? color : colors.text }}>
        {value}
      </div>
      {subtitle && (
        <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 6 }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}