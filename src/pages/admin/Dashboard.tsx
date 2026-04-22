// src/pages/admin/Dashboard.tsx
import { useState, useEffect, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import logoImg from '../../assets/logoetork.png';
import type { Announcement } from '../../types';
import StatusBadge from '../../components/ui/StatusBadge';
import { ArrowRightIcon } from '../../components/ui/Icons';
import { formatDate } from '../../lib/utils';
import { useTheme } from '../../context/ThemeContext';

// Ícones
const IconUsers = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const IconPackage = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.29 7 12 12 20.71 7"/>
    <line x1="12" y1="22" x2="12" y2="12"/>
  </svg>
);

const IconClock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

const IconCheckCircle = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

const IconAlertTriangle = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const IconLoader = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 2a10 10 0 0 1 10 10"/>
  </svg>
);

const IconMegaphone = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 11h18v2H3z"/>
    <path d="M5 11v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/>
    <path d="M8 2v3"/>
    <path d="M16 2v3"/>
  </svg>
);

const IconEdit = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 3l4 4-7 7H10v-4l7-7z"/>
    <path d="M4 20h16"/>
  </svg>
);

const IconBuilding = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/>
    <line x1="9" y1="22" x2="9" y2="18"/>
    <line x1="15" y1="22" x2="15" y2="18"/>
    <line x1="8" y1="6" x2="16" y2="6"/>
    <line x1="8" y1="10" x2="16" y2="10"/>
    <line x1="8" y1="14" x2="12" y2="14"/>
  </svg>
);

interface FranchiseeStats {
  id: string;
  company_name: string;
  code: string;
  total_orders: number;
  pending_orders: number;
  last_order_date: string | null;
  active: boolean;
}

interface Stats {
  total_franchisees: number;
  active_franchisees: number;
  inactive_franchisees: number;
  total_orders: number;
  pending: number;
  in_production: number;
  completed: number;
}

export default function AdminDashboard() {
  const { isAdmin } = useAuth();
  const { theme: currentTheme } = useTheme();
  const isDark = currentTheme === 'dark';
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  const [stats, setStats] = useState<Stats | null>(null);
  const [franchiseeStats, setFranchiseeStats] = useState<FranchiseeStats[]>([]);
  const [recent, setRecent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [draftBody, setDraftBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState('');

  const colors = {
    background: isDark ? '#0d0d0d' : '#f3f4f6',
    surface: isDark ? '#141414' : '#ffffff',
    surfaceHover: isDark ? '#1c1c1c' : '#fafafa',
    text: isDark ? '#e5e5e5' : '#1a1a1a',
    textSecondary: isDark ? '#888888' : '#777777',
    textMuted: isDark ? '#666666' : '#9ca3af',
    border: isDark ? '#222222' : '#e5e7eb',
    accent: '#c8c8c8',
    accentHover: '#e0e0e0',
    tableHeaderBg: isDark ? '#0d0d0d' : '#f9fafb',
    tableRowHover: isDark ? '#1a1a1a' : '#f9fafb',
  };

  // Verificação de acesso - USANDO isAdmin DO CONTEXTO
  if (!isAdmin) {
    return (
      <div style={{ background: colors.background, minHeight: '100vh', padding: isMobile ? 12 : 24 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center', padding: isMobile ? 24 : 60 }}>
          <h2 style={{ color: colors.text }}>Acesso negado</h2>
          <p style={{ color: colors.textSecondary }}>Voce nao tem permissao para acessar esta pagina.</p>
          <button 
            onClick={() => window.location.href = '/dashboard'}
            style={{ marginTop: 16, padding: '8px 16px', background: colors.accent, border: 'none', borderRadius: 6, cursor: 'pointer', color: '#000' }}
          >
            Voltar para o Painel
          </button>
        </div>
      </div>
    );
  }

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);

    loadData();
    loadAnnouncement();
    
    const ordersChannel = supabase
      .channel('admin-dash-orders')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'orders' }, 
        () => loadData()
      )
      .subscribe();
    
    const franchiseesChannel = supabase
      .channel('admin-dash-franchisees')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'franchisees' }, 
        () => loadData()
      )
      .subscribe();
      
    return () => { 
      window.removeEventListener('resize', onResize);
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(franchiseesChannel);
    };
  }, []);

  async function loadData() {
    setLoading(true);
    
    try {
      // Busca apenas os campos usados na tela para reduzir payload.
      const { data: franchisees, error: franchiseesError } = await supabase
        .from('franchisees')
        .select('id, company_name, code, active')
        .order('company_name');
      
      if (franchiseesError) throw franchiseesError;
      
      // Busca apenas os campos usados na listagem e estatísticas.
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          franchisee_id,
          status,
          created_at,
          vehicle_plate,
          model,
          franchisee:franchisees(company_name, code)
        `)
        .order('created_at', { ascending: false });
      
      if (ordersError) throw ordersError;
      
      const franchiseesList = franchisees || [];
      const ordersList = orders || [];
      
      // Agrega pedidos por franqueado em O(n), evitando filtros repetidos O(n*m).
      const perFranchisee = new Map<string, { total_orders: number; pending_orders: number; last_order_date: string | null }>();
      for (const order of ordersList) {
        const current = perFranchisee.get(order.franchisee_id) || {
          total_orders: 0,
          pending_orders: 0,
          last_order_date: null,
        };

        current.total_orders += 1;
        if (['solicitado', 'em_producao'].includes(order.status)) {
          current.pending_orders += 1;
        }

        if (!current.last_order_date) {
          current.last_order_date = order.created_at;
        }

        perFranchisee.set(order.franchisee_id, current);
      }

      const franchiseeStatsData: FranchiseeStats[] = franchiseesList.map(f => {
        const agg = perFranchisee.get(f.id);

        return {
          id: f.id,
          company_name: f.company_name,
          code: f.code,
          total_orders: agg?.total_orders || 0,
          pending_orders: agg?.pending_orders || 0,
          last_order_date: agg?.last_order_date || null,
          active: f.active,
        };
      }).sort((a, b) => b.total_orders - a.total_orders);
      
      // Estatísticas gerais
      const activeFranchisees = franchiseesList.filter(f => f.active === true).length;
      const inactiveFranchisees = franchiseesList.filter(f => f.active === false).length;
      const completedOrders = ordersList.filter(o => o.status === 'concluido');
      
      setStats({
        total_franchisees: franchiseesList.length,
        active_franchisees: activeFranchisees,
        inactive_franchisees: inactiveFranchisees,
        total_orders: ordersList.length,
        pending: ordersList.filter(o => o.status === 'solicitado').length,
        in_production: ordersList.filter(o => o.status === 'em_producao').length,
        completed: completedOrders.length,
      });
      
      setFranchiseeStats(franchiseeStatsData);
      setRecent(ordersList.slice(0, 10));
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadAnnouncement() {
    const { data, error } = await supabase
      .from('announcements')
      .select('id, title, body, active, created_by, created_at, updated_at')
      .eq('active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Erro carregando aviso geral', error);
      return;
    }

    setAnnouncement(data || null);
    setDraftBody(data?.body || 'NOVAS SOLUCOES DE REPROGRAMACAO (FERRAMENTAS KESS3 TRANSDATA)\nNovas solucoes ADBLUI ODD\nDAFF 530 EURO 6 (NO MODULO DO ARLA CM 1881)\n...');
  }

  async function saveAnnouncement() {
    if (!draftBody.trim()) {
      setNoticeMessage('O aviso nao pode ficar vazio.');
      return;
    }

    setSaving(true);
    setNoticeMessage('');

    const payload = {
      id: announcement?.id,
      title: 'Aviso Geral',
      body: draftBody.trim(),
      active: true,
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
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: isMobile ? '12px' : '24px' }}>
        
        {/* Header */}
        <div style={{ marginBottom: isMobile ? 20 : 32 }}>
          <h1 style={{ color: colors.text, fontSize: isMobile ? 20 : 24, fontWeight: 700, margin: '0 0 8px' }}>
            Painel Administrativo
          </h1>
          <p style={{ color: colors.textSecondary, fontSize: isMobile ? 12 : 14, margin: 0 }}>
            Visao geral completa de TODOS os franqueados e operacoes Etork Brasil
          </p>
        </div>

        {/* Announcement Banner */}
        <div style={{ 
          background: colors.surface, 
          border: `1px solid ${colors.border}`, 
          borderRadius: 12, 
          padding: isMobile ? 14 : 20, 
          marginBottom: isMobile ? 20 : 32 
        }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 16 }}>
            <div style={{
              width: 40,
              height: 40,
              background: isDark ? '#000000' : '#f3f4f6',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <img src={logoImg} alt="ETORK Brasil" style={{ width: 28, height: 28, objectFit: 'contain' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: colors.text, display: 'flex', alignItems: 'center', gap: 6 }}>
                <IconMegaphone /> Aviso Geral
              </div>
              <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>Edite o texto abaixo para mostrar avisos importantes a TODOS os franqueados</div>
            </div>
          </div>

          <textarea
            value={draftBody}
            onChange={e => setDraftBody(e.target.value)}
            rows={4}
            style={{ 
              width: '100%', 
              background: isDark ? '#0d0d0d' : '#f9fafb',
              color: colors.text, 
              border: `1px solid ${colors.border}`, 
              borderRadius: 8, 
              padding: 10, 
              resize: 'vertical', 
              fontSize: 12, 
              lineHeight: 1.5,
              fontFamily: 'inherit'
            }}
          />

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 12, alignItems: 'center' }}>
            <button
              type="button"
              onClick={saveAnnouncement}
              disabled={saving}
              style={{ 
                background: colors.accent, 
                color: '#000', 
                border: 'none', 
                borderRadius: 6, 
                padding: '8px 16px', 
                cursor: 'pointer', 
                fontWeight: 600,
                fontSize: 11,
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
                borderRadius: 6, 
                padding: '8px 16px', 
                cursor: 'pointer', 
                fontWeight: 500,
                fontSize: 11
              }}
            >
              Reverter
            </button>
            {noticeMessage && (
              <div style={{ 
                color: noticeMessage.includes('Erro') ? '#c8c8c8' : '#c8c8c8', 
                fontSize: 11,
                display: 'flex',
                alignItems: 'center',
                gap: 5
              }}>
                {noticeMessage.includes('Erro') ? <IconAlertTriangle /> : <IconCheckCircle />}
                {noticeMessage}
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: isMobile ? 20 : 32 }}>
            <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 10, padding: '12px 14px', borderLeft: `3px solid #c8c8c8` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 10, color: colors.textMuted, fontWeight: 600 }}>FRANQUEADOS</span>
                <IconUsers />
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: colors.text }}>{stats.total_franchisees}</div>
              <div style={{ fontSize: 10, color: colors.textMuted, marginTop: 4 }}>{stats.active_franchisees} ativos / {stats.inactive_franchisees} inativos</div>
            </div>
            
            <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 10, padding: '12px 14px', borderLeft: `3px solid #c8c8c8` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 10, color: colors.textMuted, fontWeight: 600 }}>TOTAL PEDIDOS</span>
                <IconPackage />
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: colors.text }}>{stats.total_orders}</div>
            </div>
            
            <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 10, padding: '12px 14px', borderLeft: `3px solid #c8c8c8` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 10, color: colors.textMuted, fontWeight: 600 }}>AGUARDANDO</span>
                <IconClock />
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: stats.pending > 0 ? '#c8c8c8' : colors.text }}>{stats.pending}</div>
            </div>
            
            <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 10, padding: '12px 14px', borderLeft: `3px solid #c8c8c8` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 10, color: colors.textMuted, fontWeight: 600 }}>EM PRODUCAO</span>
                <IconPackage />
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: colors.text }}>{stats.in_production}</div>
            </div>
            
            <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 10, padding: '12px 14px', borderLeft: `3px solid #c8c8c8` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 10, color: colors.textMuted, fontWeight: 600 }}>CONCLUIDOS</span>
                <IconCheckCircle />
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: colors.text }}>{stats.completed}</div>
            </div>
          </div>
        )}

        {/* Urgent Alert */}
        {stats && stats.pending > 0 && (
          <div style={{
            padding: '12px 16px',
            marginBottom: isMobile ? 20 : 32,
            background: isDark ? '#1c1c1c' : '#f0f0f0',
            border: `1px solid ${isDark ? '#2d2d2d' : '#d4d4d4'}`,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexWrap: 'wrap',
          }}>
            <IconAlertTriangle />
            <div style={{ flex: 1 }}>
              <span style={{ color: '#c8c8c8', fontSize: 12, fontWeight: 700 }}>{stats.pending} pedido(s) aguardando processamento</span>
            </div>
            <Link to="/admin/orders?status=solicitado" style={{
              padding: '6px 12px',
              background: colors.accent,
              color: '#000',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
            }}>
              Ver Pedidos <ArrowRightIcon width={12} height={12} />
            </Link>
          </div>
        )}

        {/* Todos os Franqueados */}
        {franchiseeStats.length > 0 && (
          <div style={{
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: 12,
            overflow: 'hidden',
            marginBottom: 32,
          }}>
            <div style={{
              padding: isMobile ? '10px 12px' : '12px 16px',
              borderBottom: `1px solid ${colors.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <h2 style={{ color: colors.text, fontSize: 13, fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                <IconBuilding /> Todos os Franqueados
              </h2>
              <Link to="/admin/franchisees" style={{ color: colors.accent, fontSize: 11, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                Gerenciar <ArrowRightIcon width={10} height={10} />
              </Link>
            </div>
            {isMobile ? (
              <div style={{ padding: 10, display: 'grid', gap: 8 }}>
                {franchiseeStats.map((f, index) => (
                  <div key={f.id} style={{ border: `1px solid ${colors.border}`, borderRadius: 8, padding: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: colors.text, marginBottom: 6 }}>#{index + 1} {f.company_name}</div>
                    <div style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 2 }}>Código: {f.code}</div>
                    <div style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 2 }}>Pedidos: {f.total_orders} | Pendentes: {f.pending_orders}</div>
                    <div style={{ fontSize: 11, color: colors.textSecondary }}>Último pedido: {f.last_order_date ? formatDate(f.last_order_date) : '—'}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${colors.border}`, background: colors.tableHeaderBg }}>
                      {['POS', 'FRANQUEADO', 'CODIGO', 'PEDIDOS', 'PENDENTES', 'STATUS', 'ULTIMO PEDIDO'].map(header => (
                        <th key={header} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 9, fontWeight: 700, color: colors.textMuted, letterSpacing: 1 }}>
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {franchiseeStats.map((f, index) => (
                      <tr key={f.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                        <td style={{ padding: '10px 12px', fontSize: 11, fontWeight: 600, color: colors.textSecondary }}>#{index + 1}</td>
                        <td style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: colors.text }}>
                          {f.company_name}
                          {!f.active && <span style={{ marginLeft: 6, fontSize: 9, color: '#c8c8c8' }}>(INATIVO)</span>}
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: 11, color: colors.textSecondary }}>{f.code}</td>
                        <td style={{ padding: '10px 12px', fontSize: 12, color: colors.text }}>{f.total_orders}</td>
                        <td style={{ padding: '10px 12px' }}>
                          {f.pending_orders > 0 ? (
                            <span style={{ color: '#c8c8c8', fontSize: 11, fontWeight: 600 }}>{f.pending_orders}</span>
                          ) : (
                            <IconCheckCircle />
                          )}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: f.active ? '#c8c8c8' : '#c8c8c8', marginRight: 5 }} />
                          <span style={{ fontSize: 11, color: colors.textSecondary }}>{f.active ? 'Ativo' : 'Inativo'}</span>
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: 11, color: colors.textSecondary }}>
                          {f.last_order_date ? formatDate(f.last_order_date) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
            padding: isMobile ? '10px 12px' : '12px 16px',
            borderBottom: `1px solid ${colors.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <h2 style={{ color: colors.text, fontSize: 13, fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <IconPackage /> Ultimos Pedidos
            </h2>
            <Link to="/admin/orders" style={{ color: colors.accent, fontSize: 11, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              Ver todos <ArrowRightIcon width={10} height={10} />
            </Link>
          </div>
          
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: colors.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <IconLoader /> Carregando...
            </div>
          ) : recent.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: colors.textMuted }}>Nenhum pedido encontrado</div>
          ) : (
            isMobile ? (
              <div style={{ padding: 10, display: 'grid', gap: 8 }}>
                {recent.map(order => (
                  <Link key={order.id} to={`/admin/orders/${order.id}`} style={{ textDecoration: 'none', border: `1px solid ${colors.border}`, borderRadius: 8, padding: 10, color: colors.text }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: colors.accent }}>{order.order_number}</div>
                    <div style={{ fontSize: 11, marginTop: 4 }}>{(order.franchisee as unknown as { company_name: string })?.company_name || '—'}</div>
                    <div style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>{formatDate(order.created_at)}</div>
                    <div style={{ marginTop: 8 }}><StatusBadge status={order.status} /></div>
                  </Link>
                ))}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${colors.border}`, background: colors.tableHeaderBg }}>
                      {['PEDIDO', 'FRANQUEADO', 'DATA', 'STATUS', ''].map(header => (
                        <th key={header} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 9, fontWeight: 700, color: colors.textMuted, letterSpacing: 1 }}>
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
                        <td style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: colors.accent }}>{order.order_number}</td>
                        <td style={{ padding: '10px 12px', fontSize: 11, color: colors.text }}>{(order.franchisee as unknown as { company_name: string })?.company_name || '—'}</td>
                        <td style={{ padding: '10px 12px', fontSize: 11, color: colors.textSecondary }}>{formatDate(order.created_at)}</td>
                        <td style={{ padding: '10px 12px' }}><StatusBadge status={order.status} /></td>
                        <td style={{ padding: '10px 12px' }}>
                          <Link to={`/admin/orders/${order.id}`} style={{ color: colors.accent, fontSize: 11, textDecoration: 'none' }}>
                            Detalhes
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}