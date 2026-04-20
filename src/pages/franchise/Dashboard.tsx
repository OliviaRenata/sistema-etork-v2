// src/pages/franchise/Dashboard.tsx

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import logoImg from '../../assets/logoetork.png';
import type { Announcement, DashboardStats } from '../../types';
import StatusBadge from '../../components/ui/StatusBadge';
import { PlusIcon, ArrowRightIcon, WaveIcon } from '../../components/ui/Icons';
import { formatDate } from '../../lib/utils';
import { useTheme } from '../../context/ThemeContext';

// ─── Tipos para ícones com style ────────────────────────────────────────────
type IconProps = {
  style?: React.CSSProperties;
  width?: number;
  height?: number;
};

// ─── Ícones SVG ──────────────────────────────────────────────────────────────
const IconRefresh = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"/>
    <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14"/>
  </svg>
);

const IconCalendar = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const IconMegaphone = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 11h18v2H3z"/>
    <path d="M5 11v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/>
    <path d="M8 2v3"/><path d="M16 2v3"/>
  </svg>
);

const IconClipboard = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
  </svg>
);

const IconLoader = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 2a10 10 0 0 1 10 10"/>
  </svg>
);

const IconCar = ({ style }: IconProps) => (
  <svg width={style?.width ?? 18} height={style?.height ?? 18} viewBox="0 0 24 24" fill="none" stroke={style?.color ?? 'currentColor'} strokeWidth="2">
    <path d="M5 10 L19 10 L18 16 L6 16 L5 10Z"/>
    <circle cx="8" cy="18" r="2"/><circle cx="16" cy="18" r="2"/>
    <path d="M5 10 L7 4 L17 4 L19 10"/>
  </svg>
);

const IconChip = ({ style }: IconProps) => (
  <svg width={style?.width ?? 18} height={style?.height ?? 18} viewBox="0 0 24 24" fill="none" stroke={style?.color ?? 'currentColor'} strokeWidth="2">
    <rect x="4" y="4" width="16" height="16" rx="2"/>
    <path d="M9 8h6"/><path d="M9 12h6"/><path d="M9 16h6"/>
  </svg>
);

const IconTarget = ({ style }: IconProps) => (
  <svg width={style?.width ?? 18} height={style?.height ?? 18} viewBox="0 0 24 24" fill="none" stroke={style?.color ?? 'currentColor'} strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="6"/>
    <circle cx="12" cy="12" r="2"/>
  </svg>
);

const IconAward = ({ style }: IconProps) => (
  <svg width={style?.width ?? 18} height={style?.height ?? 18} viewBox="0 0 24 24" fill="none" stroke={style?.color ?? 'currentColor'} strokeWidth="2">
    <circle cx="12" cy="8" r="6"/>
    <path d="M12 14v8"/><path d="M8 22h8"/>
    <path d="M5 16l3-2"/><path d="M19 16l-3-2"/>
  </svg>
);

const IconWhatsApp = ({ style }: IconProps) => (
  <svg width={style?.width ?? 16} height={style?.height ?? 16} viewBox="0 0 24 24" fill="none" stroke={style?.color ?? 'currentColor'} strokeWidth="2">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
  </svg>
);

const IconMail = ({ style }: IconProps) => (
  <svg width={style?.width ?? 16} height={style?.height ?? 16} viewBox="0 0 24 24" fill="none" stroke={style?.color ?? 'currentColor'} strokeWidth="2">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);

const IconMapPin = ({ style }: IconProps) => (
  <svg width={style?.width ?? 16} height={style?.height ?? 16} viewBox="0 0 24 24" fill="none" stroke={style?.color ?? 'currentColor'} strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

const IconClock = ({ style }: IconProps) => (
  <svg width={style?.width ?? 16} height={style?.height ?? 16} viewBox="0 0 24 24" fill="none" stroke={style?.color ?? 'currentColor'} strokeWidth="2">
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
  <svg width={style?.width ?? 16} height={style?.height ?? 16} viewBox="0 0 24 24" fill="none" stroke={style?.color ?? 'currentColor'} strokeWidth="2">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const IconStar = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
  const isFranchiseeBlocked = !!franchisee && franchisee.active === false;

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
    green: '#e6b800',
    blue: '#e6b800',
    purple: '#e6b800',
    red: '#e6b800',
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
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

      const [
        { data: orders, error: ordersError },
        { count: totalCount, error: totalError },
        { count: pendingCount, error: pendingError },
        { count: monthCount, error: monthError },
      ] = await Promise.all([
        supabase
          .from('orders')
          .select('id, order_number, status, created_at, vehicle_plate, model')
          .eq('franchisee_id', franchisee.id)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('franchisee_id', franchisee.id),
        supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('franchisee_id', franchisee.id)
          .in('status', ['solicitado', 'em_producao']),
        supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('franchisee_id', franchisee.id)
          .gte('created_at', monthStart)
          .lt('created_at', monthEnd),
      ]);

      if (ordersError) throw ordersError;
      if (totalError) throw totalError;
      if (pendingError) throw pendingError;
      if (monthError) throw monthError;

      setRecentOrders(orders || []);
      setStats({
        total_orders: totalCount || 0,
        orders_this_month: monthCount || 0,
        pending_orders: pendingCount || 0,
        total_spent: 0,
        balance: 0,
        credit_limit: 0,
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
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ color: iconColor, flexShrink: 0, width: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
      <span style={{ fontSize: 11, color: colors.textSecondary, lineHeight: 1.4 }}>{text}</span>
    </div>
  );

  return (
    <div style={{ background: colors.background, minHeight: '100vh' }}>
      <style>{spinKeyframes}</style>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '20px', animation: 'fadeIn 0.3s ease' }}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ color: colors.text, fontSize: 22, fontWeight: 800, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
              {greeting()}, {profile?.full_name?.split(' ')[0] || 'Franqueado'}
              <WaveIcon width={18} height={18} />
            </h1>
            <p style={{ color: colors.textSecondary, fontSize: 12, margin: 0 }}>
              {franchisee?.company_name} · Código: <strong style={{ color: colors.accent }}>{franchisee?.code}</strong>
            </p>
          </div>
          {!isFranchiseeBlocked && (
            <Link
              to="/orders/new"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 18px', background: colors.accent, color: '#000', borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: 'none' }}
            >
              <PlusIcon width={14} height={14} /> NOVO PEDIDO
            </Link>
          )}
        </div>

        {isFranchiseeBlocked && (
          <div
            style={{
              marginBottom: 18,
              padding: '14px 16px',
              borderRadius: 10,
              border: `1px solid ${isDark ? '#3a3000' : '#d4c176'}`,
              background: isDark ? '#1a1500' : '#fff8d6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ minWidth: 240 }}>
              <div style={{ color: '#e6b800', fontSize: 12, fontWeight: 800, letterSpacing: 0.3 }}>
                ACESSO DE PEDIDOS BLOQUEADO
              </div>
              <div style={{ color: colors.text, fontSize: 12, marginTop: 4, lineHeight: 1.5 }}>
                Seu acesso a telas de pedidos foi inativado pelo administrador. Para liberar, fale com o suporte.
              </div>
            </div>

            <a
              href="https://wa.me/5567998711313"
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                textDecoration: 'none',
                padding: '8px 12px',
                borderRadius: 8,
                border: `1px solid ${isDark ? '#3a3000' : '#d4c176'}`,
                color: '#e6b800',
                background: isDark ? '#1a1500' : '#fff8d6',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              <IconWhatsApp width={13} height={13} /> Suporte WhatsApp
            </a>
          </div>
        )}

        {/* ── Stats Cards - MENORES ───────────────────────────────────────── */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 24 }}>
            <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 10, padding: '12px 14px', borderLeft: `3px solid ${colors.accent}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 9, color: colors.textSecondary, fontWeight: 700, letterSpacing: 0.5 }}>TOTAL PEDIDOS</span>
                <IconClipboard />
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: colors.text }}>{stats.total_orders}</div>
            </div>
            
            <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 10, padding: '12px 14px', borderLeft: `3px solid ${colors.blue}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 9, color: colors.textSecondary, fontWeight: 700, letterSpacing: 0.5 }}>EM ANDAMENTO</span>
                <IconRefresh />
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: colors.text }}>{stats.pending_orders}</div>
            </div>
            
            <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 10, padding: '12px 14px', borderLeft: `3px solid ${colors.green}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 9, color: colors.textSecondary, fontWeight: 700, letterSpacing: 0.5 }}>ESTE MES</span>
                <IconCalendar />
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: colors.text }}>{stats.orders_this_month}</div>
            </div>
          </div>
        )}

        {/* ── Info Cards - MENORES ─────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, marginBottom: 24 }}>

          {/* Sobre */}
          <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 10, padding: 14, borderTop: `2px solid ${colors.accent}` }}>
            <h3 style={{ fontSize: 12, fontWeight: 700, color: colors.text, margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <IconStar /> Sobre a ETORK
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {infoRow(<IconAward width={14} height={14} />, 'Fundada em 2017 em Campo Grande/MS')}
              {infoRow(<IconTarget width={14} height={14} />, 'Especialista em reprogramacao')}
              {infoRow(<IconChip width={14} height={14} />, 'Remap, DPF, EGR, SCR OFF')}
              {infoRow(<IconCar width={14} height={14} />, 'Atendimento nacional')}
            </div>
          </div>

          {/* Serviços */}
          <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 10, padding: 14, borderTop: `2px solid ${colors.accent}` }}>
            <h3 style={{ fontSize: 12, fontWeight: 700, color: colors.text, margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <IconTool width={14} height={14} /> Servicos
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {infoRow(<IconPlug width={14} height={14} />, 'Remap de Potencia (STG1/STG2)')}
              {infoRow(<IconTool width={14} height={14} />, 'DPF, EGR, SCR OFF')}
              {infoRow(<IconChip width={14} height={14} />, 'Start Stop, TVA OFF, Sonda O2')}
              {infoRow(<IconCheck width={14} height={14} />, 'Correcao Checksum, Decode')}
            </div>
          </div>

          {/* Ferramentas */}
          <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 10, padding: 14, borderTop: `2px solid ${colors.accent}` }}>
            <h3 style={{ fontSize: 12, fontWeight: 700, color: colors.text, margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <IconPlug width={14} height={14} /> Ferramentas
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {infoRow(<IconChip width={14} height={14} />, 'KTAG / KESS V2 / KESS3')}
              {infoRow(<IconTool width={14} height={14} />, 'NEW GENIUS / TRANSDATA')}
              {infoRow(<IconPlug width={14} height={14} />, 'KZ PROG / DFox / KT200')}
              {infoRow(<IconCheck width={14} height={14} />, 'Garantia certificada')}
            </div>
          </div>

          {/* Contato */}
          <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 10, padding: 14, borderTop: `2px solid ${colors.accent}` }}>
            <h3 style={{ fontSize: 12, fontWeight: 700, color: colors.text, margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <IconWhatsApp width={14} height={14} /> Contato
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {infoRow(<IconWhatsApp width={14} height={14} />, '(67) 99254-9181')}
              {infoRow(<IconMail width={14} height={14} />, 'contato@etorkbrasil.com.br')}
              {infoRow(<IconMapPin width={14} height={14} />, 'Campo Grande - MS')}
              {infoRow(<IconClock width={14} height={14} />, 'Atendimento: 07:30 as 17:30')}
            </div>
          </div>
        </div>

        {/* ── Announcement ───────────────────────────────────────────────── */}
        <div style={{ marginBottom: 24, padding: '14px 18px', background: colors.accentBg, border: `1px solid ${colors.accent}`, borderRadius: 10, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <div style={{ width: 40, height: 40, background: isDark ? '#000' : '#fff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 6, flexShrink: 0 }}>
            <img src={logoImg} alt="ETORK Brasil" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, color: colors.accent, display: 'flex', alignItems: 'center', gap: 5 }}>
              <IconMegaphone /> AVISOS
            </div>
            <div style={{ whiteSpace: 'pre-wrap', fontSize: 12, lineHeight: 1.5, color: colors.text }}>
              {announcement?.body || DEFAULT_ANNOUNCEMENT_BODY}
            </div>
          </div>
        </div>

        {/* ── Recent Orders ──────────────────────────────────────────────── */}
        <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <h2 style={{ color: colors.text, fontSize: 13, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <IconClipboard /> Pedidos Recentes
            </h2>
            {!isFranchiseeBlocked && (
              <Link to="/orders" style={{ color: colors.accent, fontSize: 11, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                Ver todos <ArrowRightIcon width={10} height={10} />
              </Link>
            )}
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: colors.textSecondary, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <IconLoader /> Carregando...
            </div>
          ) : recentOrders.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: colors.textSecondary, fontSize: 12 }}>
              {isFranchiseeBlocked ? (
                'Nenhum pedido recente para exibir.'
              ) : (
                <>
                  Nenhum pedido encontrado.{' '}
                  <Link to="/orders/new" style={{ color: colors.accent, textDecoration: 'none', fontWeight: 600 }}>Criar primeiro pedido →</Link>
                </>
              )}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${colors.border}`, background: isDark ? '#0f0f0f' : '#fafafa' }}>
                    {['PEDIDO', 'DATA', 'STATUS'].map(h => (
                      <th key={h} style={{ padding: '8px 16px', textAlign: 'left', fontSize: 9, fontWeight: 700, color: colors.textSecondary, letterSpacing: 0.5 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order, index) => (
                    <tr
                      key={order.id}
                      style={{ borderBottom: index === recentOrders.length - 1 ? 'none' : `1px solid ${colors.border}`, cursor: isFranchiseeBlocked ? 'default' : 'pointer' }}
                      onClick={() => {
                        if (!isFranchiseeBlocked) {
                          window.location.href = `/orders/${order.id}`;
                        }
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = colors.surfaceHover)}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '10px 16px', fontSize: 12, color: colors.accent, fontWeight: 700 }}>{order.order_number || order.id.slice(0, 8)}</td>
                      <td style={{ padding: '10px 16px', fontSize: 12, color: colors.textSecondary }}>{formatDate(order.created_at)}</td>
                      <td style={{ padding: '10px 16px' }}><StatusBadge status={order.status} mode="franchise" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div style={{ marginTop: 24, padding: '12px 20px', background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 10, textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 6 }}>
            <span style={{ color: colors.textSecondary, fontSize: 10 }}>© 2017-2026 ETORK Brasil</span>
            <span style={{ color: colors.accent, fontSize: 10 }}>·</span>
            <span style={{ color: colors.textSecondary, fontSize: 10 }}>Todos os direitos reservados</span>
            <span style={{ color: colors.accent, fontSize: 10 }}>·</span>
            <span style={{ color: colors.textSecondary, fontSize: 10 }}>Reprogramacao Automotiva</span>
          </div>
          <div style={{ color: colors.textMuted, fontSize: 9 }}>Versao 2.0 — Sistema de Gestao de Franqueados</div>
        </div>

      </div>
    </div>
  );
}