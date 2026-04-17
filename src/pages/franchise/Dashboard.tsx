// src/pages/franchise/Dashboard.tsx

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import logoImg from '../../assets/logoetork.png';
import type { Announcement, DashboardStats } from '../../types';
import StatusBadge from '../../components/ui/StatusBadge';
import { PlusIcon, ArrowRightIcon, WaveIcon } from '../../components/ui/Icons';
import { formatCurrency, formatDate } from '../../lib/utils';
import { useTheme } from '../../context/ThemeContext';

// ─── Tipos para ícones com style ────────────────────────────────────────────
type IconProps = {
  style?: React.CSSProperties;
  width?: number;
  height?: number;
};

// ─── Ícones SVG ──────────────────────────────────────────────────────────────
const IconRefresh = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"/>
    <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14"/>
  </svg>
);

const IconCalendar = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const IconTrendingUp = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 6 13.5 15.5 8 10 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
  </svg>
);

const IconMegaphone = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 11h18v2H3z"/>
    <path d="M5 11v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/>
    <path d="M8 2v3"/><path d="M16 2v3"/>
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

const IconCar = ({ style }: IconProps) => (
  <svg width={style?.width ?? 20} height={style?.height ?? 20} viewBox="0 0 24 24" fill="none" stroke={style?.color ?? 'currentColor'} strokeWidth="2">
    <path d="M5 10 L19 10 L18 16 L6 16 L5 10Z"/>
    <circle cx="8" cy="18" r="2"/><circle cx="16" cy="18" r="2"/>
    <path d="M5 10 L7 4 L17 4 L19 10"/>
  </svg>
);

const IconChip = ({ style }: IconProps) => (
  <svg width={style?.width ?? 20} height={style?.height ?? 20} viewBox="0 0 24 24" fill="none" stroke={style?.color ?? 'currentColor'} strokeWidth="2">
    <rect x="4" y="4" width="16" height="16" rx="2"/>
    <path d="M9 8h6"/><path d="M9 12h6"/><path d="M9 16h6"/>
  </svg>
);

const IconTarget = ({ style }: IconProps) => (
  <svg width={style?.width ?? 20} height={style?.height ?? 20} viewBox="0 0 24 24" fill="none" stroke={style?.color ?? 'currentColor'} strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="6"/>
    <circle cx="12" cy="12" r="2"/>
  </svg>
);

const IconAward = ({ style }: IconProps) => (
  <svg width={style?.width ?? 20} height={style?.height ?? 20} viewBox="0 0 24 24" fill="none" stroke={style?.color ?? 'currentColor'} strokeWidth="2">
    <circle cx="12" cy="8" r="6"/>
    <path d="M12 14v8"/><path d="M8 22h8"/>
    <path d="M5 16l3-2"/><path d="M19 16l-3-2"/>
  </svg>
);

const IconWhatsApp = ({ style }: IconProps) => (
  <svg width={style?.width ?? 18} height={style?.height ?? 18} viewBox="0 0 24 24" fill="none" stroke={style?.color ?? 'currentColor'} strokeWidth="2">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
  </svg>
);

const IconMail = ({ style }: IconProps) => (
  <svg width={style?.width ?? 18} height={style?.height ?? 18} viewBox="0 0 24 24" fill="none" stroke={style?.color ?? 'currentColor'} strokeWidth="2">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);

const IconMapPin = ({ style }: IconProps) => (
  <svg width={style?.width ?? 18} height={style?.height ?? 18} viewBox="0 0 24 24" fill="none" stroke={style?.color ?? 'currentColor'} strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

const IconClock = ({ style }: IconProps) => (
  <svg width={style?.width ?? 18} height={style?.height ?? 18} viewBox="0 0 24 24" fill="none" stroke={style?.color ?? 'currentColor'} strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

const IconTool = ({ style }: IconProps) => (
  <svg width={style?.width ?? 18} height={style?.height ?? 18} viewBox="0 0 24 24" fill="none" stroke={style?.color ?? 'currentColor'} strokeWidth="2">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
  </svg>
);

const IconPlug = ({ style }: IconProps) => (
  <svg width={style?.width ?? 18} height={style?.height ?? 18} viewBox="0 0 24 24" fill="none" stroke={style?.color ?? 'currentColor'} strokeWidth="2">
    <path d="M12 10v4"/><path d="M10 2v4"/><path d="M14 2v4"/>
    <path d="M18 6H6a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2z"/>
  </svg>
);

const IconCheck = ({ style }: IconProps) => (
  <svg width={style?.width ?? 18} height={style?.height ?? 18} viewBox="0 0 24 24" fill="none" stroke={style?.color ?? 'currentColor'} strokeWidth="2">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const IconStar = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

const DEFAULT_ANNOUNCEMENT_BODY = `NOVIDADES ETORK BRASIL - ABRIL/2026

NOVAS SOLUCOES:
- Reprogramacao KESS3 TRANSDATA - Suporte total
- ADBLUE OFF para DAF 530 EURO 6 (Modulo ARLA CM 1881)
- Combo Agricultura EGR + Potencia STG1

FERRAMENTAS DISPONIVEIS:
- KTAG / KESS V2 / KESS3 ORIGINAL
- NEW GENIUS / NEW TRANSDATA
- KZ PROG / DFox / KT200

SUPORTE TECNICO: (67) 99254-9181
Atendimento: Seg-Sex 8h as 18h`;

export default function FranchiseDashboard() {
  const { franchisee, profile } = useAuth();
  const { theme: currentTheme } = useTheme();
  const isDark = currentTheme === 'dark';

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);

  const colors = {
    background: isDark ? '#0d0d0d' : '#f3f4f6',
    surface: isDark ? '#141414' : '#ffffff',
    surfaceHover: isDark ? '#1c1c1c' : '#f9fafb',
    text: isDark ? '#e5e5e5' : '#1a1a1a',
    textSecondary: isDark ? '#888888' : '#6b7280',
    textMuted: isDark ? '#555' : '#aaa',
    border: isDark ? '#222222' : '#e5e7eb',
    accent: '#e6b800',
    accentHover: '#f5c518',
    accentBg: isDark ? '#1a1500' : '#fffbeb',
    green: '#22c55e',
    blue: '#3b82f6',
    purple: '#a855f7',
    red: '#ef4444',
  };

  const spinKeyframes = `
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  `;

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
      .channel('franchise-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `franchisee_id=eq.${franchisee.id}` }, () => loadData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [franchisee]);

  async function loadData() {
    if (!franchisee) return;
    try {
      const { data: orders, error: ordersError } = await supabase
        .from('orders').select('*').eq('franchisee_id', franchisee.id)
        .order('created_at', { ascending: false }).limit(5);
      if (ordersError) throw ordersError;

      const { data: allOrders, error: statsError } = await supabase
        .from('orders').select('status, total_amount, created_at').eq('franchisee_id', franchisee.id);
      if (statsError) throw statsError;

      const now = new Date();
      const allList = allOrders || [];
      const thisMonth = allList.filter(o => {
        const d = new Date(o.created_at);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });

      setRecentOrders(orders || []);
      setStats({
        total_orders: allList.length,
        orders_this_month: thisMonth.length,
        pending_orders: allList.filter(o => ['solicitado', 'em_producao'].includes(o.status)).length,
        total_spent: allList.reduce((s, o) => s + (o.total_amount || 0), 0),
        balance: franchisee.balance || 0,
        credit_limit: franchisee.credit_limit || 0,
      });
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadAnnouncement() {
    const { data, error } = await supabase
      .from('announcements').select('*').eq('active', true)
      .order('updated_at', { ascending: false }).limit(1).maybeSingle();
    if (error) { console.error('Erro carregando aviso', error); return; }
    setAnnouncement(data || null);
  }

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const iconColor = colors.accent;

  if (!franchisee && !loading) {
    return (
      <div style={{ background: colors.background, minHeight: '100vh', padding: 24 }}>
        <style>{spinKeyframes}</style>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 32 }}>
            <h1 style={{ margin: 0, fontSize: 22, color: colors.text }}>Aguardando ativacao</h1>
            <p style={{ color: colors.textSecondary, marginTop: 8 }}>Seu cadastro ainda nao foi vinculado. Peça ao administrador para concluir a ativacao.</p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Card info reutilizável ───────────────────────────────────────────────
  const infoRow = (icon: React.ReactNode, text: string) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ color: iconColor, flexShrink: 0, width: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
      <span style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 1.4 }}>{text}</span>
    </div>
  );

  return (
    <div style={{ background: colors.background, minHeight: '100vh' }}>
      <style>{spinKeyframes}</style>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px', animation: 'fadeIn 0.3s ease' }}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ color: colors.text, fontSize: 26, fontWeight: 800, margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 10 }}>
              {greeting()}, {profile?.full_name?.split(' ')[0] || 'Franqueado'}
              <WaveIcon width={22} height={22} />
            </h1>
            <p style={{ color: colors.textSecondary, fontSize: 13, margin: 0 }}>
              {franchisee?.company_name} · Código: <strong style={{ color: colors.accent }}>{franchisee?.code}</strong>
            </p>
          </div>
          <Link
            to="/orders/new"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 22px', background: colors.accent, color: '#000', borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: 'none', letterSpacing: 0.3 }}
          >
            <PlusIcon width={15} height={15} /> NOVO PEDIDO
          </Link>
        </div>

        {/* ── Stats ──────────────────────────────────────────────────────── */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
            {[
              { label: 'TOTAL DE PEDIDOS', value: stats.total_orders, icon: <IconClipboard />, color: colors.accent },
              { label: 'EM ANDAMENTO', value: stats.pending_orders, icon: <IconRefresh />, color: colors.blue },
              { label: 'ESTE MÊS', value: stats.orders_this_month, icon: <IconCalendar />, color: colors.green },
              { label: 'TOTAL INVESTIDO', value: formatCurrency(stats.total_spent), icon: <IconTrendingUp />, color: colors.purple },
            ].map(({ label, value, icon, color }) => (
              <div key={label} style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 12, padding: '18px 20px', borderLeft: `3px solid ${color}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 10, color: colors.textSecondary, fontWeight: 700, letterSpacing: 0.8 }}>{label}</span>
                  <span style={{ color }}>{icon}</span>
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, color: colors.text }}>{value}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── Info Cards ─────────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 28 }}>

          {/* Sobre */}
          <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 20, borderTop: `3px solid ${colors.accent}` }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: colors.text, margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <IconStar /> Sobre a ETORK Brasil
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {infoRow(<IconAward />, 'Fundada em 2017 em Campo Grande/MS')}
              {infoRow(<IconTarget />, 'Especialista em reprogramacao automotiva')}
              {infoRow(<IconChip />, 'Remap, DPF, EGR, SCR OFF, Potencia')}
              {infoRow(<IconCar />, 'Atendimento em todo territorio nacional')}
            </div>
          </div>

          {/* Serviços */}
          <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 20, borderTop: `3px solid ${colors.accent}` }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: colors.text, margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <IconTool /> Servicos Oferecidos
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {infoRow(<IconPlug />, 'Remap de Potencia (STG1, STG2)')}
              {infoRow(<IconTool />, 'DPF, EGR, SCR OFF')}
              {infoRow(<IconChip />, 'Start Stop, TVA OFF, Sonda O2')}
              {infoRow(<IconCheck />, 'Correcao Checksum, Decode')}
            </div>
          </div>

          {/* Ferramentas */}
          <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 20, borderTop: `3px solid ${colors.accent}` }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: colors.text, margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <IconPlug /> Ferramentas Originais
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {infoRow(<IconChip />, 'KTAG / KESS V2 / KESS3')}
              {infoRow(<IconTool />, 'NEW GENIUS / NEW TRANSDATA')}
              {infoRow(<IconPlug />, 'KZ PROG / DFox / KT200')}
              {infoRow(<IconCheck />, 'Garantia e qualidade certificada')}
            </div>
          </div>

          {/* Contato */}
          <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 20, borderTop: `3px solid ${colors.accent}` }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: colors.text, margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <IconWhatsApp /> Contato & Suporte
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {infoRow(<IconWhatsApp />, '(67) 99254-9181')}
              {infoRow(<IconMail />, 'contato@etorkbrasil.com.br')}
              {infoRow(<IconMapPin />, 'Campo Grande - Mato Grosso do Sul')}
              {infoRow(<IconClock />, 'Atendimento: Seg-Sex 8h as 18h')}
            </div>
          </div>
        </div>

        {/* ── Announcement ───────────────────────────────────────────────── */}
        <div style={{ marginBottom: 28, padding: '20px 24px', background: colors.accentBg, border: `1px solid ${colors.accent}`, borderRadius: 12, display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          <div style={{ width: 48, height: 48, background: isDark ? '#000' : '#fff', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8, flexShrink: 0 }}>
            <img src={logoImg} alt="ETORK Brasil" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10, color: colors.accent, display: 'flex', alignItems: 'center', gap: 6 }}>
              <IconMegaphone /> AVISOS E NOVIDADES
            </div>
            <div style={{ whiteSpace: 'pre-wrap', fontSize: 13, lineHeight: 1.7, color: colors.text, fontWeight: 500 }}>
              {announcement?.body || DEFAULT_ANNOUNCEMENT_BODY}
            </div>
          </div>
        </div>

        {/* ── Recent Orders ──────────────────────────────────────────────── */}
        <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 28 }}>
          <div style={{ padding: '16px 24px', borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <h2 style={{ color: colors.text, fontSize: 15, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <IconClipboard /> Pedidos Recentes
            </h2>
            <Link to="/orders" style={{ color: colors.accent, fontSize: 12, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
              Ver todos <ArrowRightIcon width={12} height={12} />
            </Link>
          </div>

          {loading ? (
            <div style={{ padding: 48, textAlign: 'center', color: colors.textSecondary, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <IconLoader /> Carregando pedidos...
            </div>
          ) : recentOrders.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: colors.textSecondary, fontSize: 13 }}>
              Nenhum pedido encontrado.{' '}
              <Link to="/orders/new" style={{ color: colors.accent, textDecoration: 'none', fontWeight: 600 }}>Criar primeiro pedido →</Link>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${colors.border}`, background: isDark ? '#0f0f0f' : '#fafafa' }}>
                    {['PEDIDO', 'DATA', 'VALOR', 'STATUS'].map(h => (
                      <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: colors.textSecondary, letterSpacing: 0.8 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order, index) => (
                    <tr
                      key={order.id}
                      style={{ borderBottom: index === recentOrders.length - 1 ? 'none' : `1px solid ${colors.border}`, cursor: 'pointer', transition: 'background 0.15s' }}
                      onClick={() => window.location.href = `/orders/${order.id}`}
                      onMouseEnter={e => (e.currentTarget.style.background = colors.surfaceHover)}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '13px 20px', fontSize: 13, color: colors.accent, fontWeight: 700 }}>{order.order_number || order.id.slice(0, 8)}</td>
                      <td style={{ padding: '13px 20px', fontSize: 13, color: colors.textSecondary }}>{formatDate(order.created_at)}</td>
                      <td style={{ padding: '13px 20px', fontSize: 13, color: colors.text, fontWeight: 600 }}>{formatCurrency(order.total_amount || 0)}</td>
                      <td style={{ padding: '13px 20px' }}><StatusBadge status={order.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div style={{ padding: '16px 24px', background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 12, textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap', marginBottom: 8 }}>
            <span style={{ color: colors.textSecondary, fontSize: 12 }}>© 2017-2026 ETORK Brasil</span>
            <span style={{ color: colors.accent, fontSize: 12 }}>·</span>
            <span style={{ color: colors.textSecondary, fontSize: 12 }}>Todos os direitos reservados</span>
            <span style={{ color: colors.accent, fontSize: 12 }}>·</span>
            <span style={{ color: colors.textSecondary, fontSize: 12 }}>Reprogramacao Automotiva Especializada</span>
          </div>
          <div style={{ color: colors.textMuted, fontSize: 11 }}>Versao 2.0 — Sistema de Gestao de Franqueados</div>
        </div>

      </div>
    </div>
  );
}