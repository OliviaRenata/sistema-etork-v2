import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { formatDateShort } from '../../lib/utils';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

const IconFilter = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="22 3 2 3 10 13 10 21 14 18 14 13 22 3"/>
  </svg>
);

const IconDownload = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

const IconLoader = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    style={{ animation: 'spin 1s linear infinite' }}>
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 2a10 10 0 0 1 10 10"/>
  </svg>
);

const IconClipboard = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
  </svg>
);

const IconSearch = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.3-4.3"/>
  </svg>
);

const IconRefresh = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"/>
    <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14"/>
  </svg>
);

const IconX = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const IconChevronUp = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="18 15 12 9 6 15"/>
  </svg>
);

const IconChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

interface OrderSummary {
  id: string;
  order_number: string;
  vehicle_plate: string;
  model: string;
  status: string;
  created_at: string;
  notes: string;
}

type SortField = 'order_number' | 'vehicle_plate' | 'created_at' | 'status';
type SortDir = 'asc' | 'desc';

const STATUS_LABELS: Record<string, string> = {
  solicitado: 'Recebido',
  em_producao: 'Em andamento',
  enviado: 'Em andamento',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
};

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  solicitado:  { bg: '#f0f0f0', text: '#888888', dot: '#c8c8c8' },
  em_producao: { bg: '#f0f0f0', text: '#909090', dot: '#c8c8c8' },
  enviado:     { bg: '#f0f0f0', text: '#909090', dot: '#c8c8c8' },
  concluido:   { bg: '#f0f0f0', text: '#444333', dot: '#b0b0b0' },
  cancelado:   { bg: '#f0f0f0', text: '#444333', dot: '#c8c8c8' },
};

const STATUS_COLORS_DARK: Record<string, { bg: string; text: string; dot: string }> = {
  solicitado:  { bg: '#2a2a2a', text: '#c8c8c8', dot: '#c8c8c8' },
  em_producao: { bg: '#222222', text: '#d4d4d4', dot: '#c8c8c8' },
  enviado:     { bg: '#222222', text: '#d4d4d4', dot: '#c8c8c8' },
  concluido:   { bg: '#1a1a1a', text: '#d4d4d4', dot: '#b0b0b0' },
  cancelado:   { bg: '#1a1a1a', text: '#d4d4d4', dot: '#c8c8c8' },
};

export default function FranchiseFinancial() {
  const { franchisee } = useAuth();
  const { theme: currentTheme } = useTheme();
  const isDark = currentTheme === 'dark';

  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const c = {
    bg:            isDark ? '#0d0d0d' : '#f3f4f6',
    surface:       isDark ? '#141414' : '#ffffff',
    surfaceAlt:    isDark ? '#0f0f0f' : '#f9fafb',
    surfaceHover:  isDark ? '#1c1c1c' : '#f0f9ff',
    text:          isDark ? '#e5e5e5' : '#1a1a1a',
    textSec:       isDark ? '#888' : '#777777',
    textMuted:     isDark ? '#555' : '#9ca3af',
    border:        isDark ? '#222' : '#e5e7eb',
    accent:        '#c8c8c8',
    accentBg:      isDark ? '#1e1e1e' : '#f0f0f0',
  };

  const statusStyle = (status: string) => {
    const map = isDark ? STATUS_COLORS_DARK : STATUS_COLORS;
    return map[status] ?? { bg: c.surface, text: c.text, dot: c.textMuted };
  };

  useEffect(() => {
    if (franchisee?.id) {
      loadData();
    } else {
      setOrders([]);
      setLoading(false);
    }
  }, [franchisee?.id]);

  async function loadData(silent = false) {
    if (!franchisee?.id) return;

    silent ? setRefreshing(true) : setLoading(true);
    try {
      const { data: oData, error: oErr } = await supabase.from('orders').select(
        'id, order_number, vehicle_plate, model, status, created_at, notes'
      )
      .eq('franchisee_id', franchisee.id)
      .order('created_at', { ascending: false });

      if (oErr) throw oErr;

      setOrders((oData || []).map(o => ({
        id: o.id,
        order_number: o.order_number ?? '—',
        vehicle_plate: o.vehicle_plate ?? '—',
        model: o.model ?? '—',
        status: o.status,
        created_at: o.created_at,
        notes: o.notes ?? '',
      })));
    } catch (err) {
      console.error('Erro ao carregar pedidos do franqueado:', err);
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const hasFilters = !!(filterStatus || dateRange.start || dateRange.end || searchTerm);

  const filteredOrders = orders
    .filter(o => {
      if (filterStatus && o.status !== filterStatus) return false;
      if (dateRange.start && new Date(o.created_at) < new Date(dateRange.start)) return false;
      if (dateRange.end && new Date(o.created_at) > new Date(dateRange.end + 'T23:59:59')) return false;
      if (searchTerm) {
        const s = searchTerm.toLowerCase();
        if (
          !o.order_number.toLowerCase().includes(s) &&
          !o.vehicle_plate.toLowerCase().includes(s) &&
          !o.model.toLowerCase().includes(s)
        ) return false;
      }
      return true;
    })
    .sort((a, b) => {
      const va = a[sortField] as string;
      const vb = b[sortField] as string;
      if (sortField === 'created_at') {
        return sortDir === 'desc'
          ? new Date(vb).getTime() - new Date(va).getTime()
          : new Date(va).getTime() - new Date(vb).getTime();
      }
      return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    });

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  }

  const stats = {
    total:       orders.length,
    solicitado:  orders.filter(o => o.status === 'solicitado').length,
    em_producao: orders.filter(o => o.status === 'em_producao' || o.status === 'enviado').length,
    concluido:   orders.filter(o => o.status === 'concluido').length,
    cancelado:   orders.filter(o => o.status === 'cancelado').length,
  };

  function exportCSV() {
    const header = 'Pedido,Placa,Modelo,Status,Data,Observacoes\n';
    const rows = filteredOrders.map(o =>
      [
        o.order_number,
        o.vehicle_plate,
        `"${o.model}"`,
        STATUS_LABELS[o.status] ?? o.status,
        formatDateShort(o.created_at),
        `"${o.notes.replace(/"/g, '""')}"`
      ].join(',')
    ).join('\n');
    const blob = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meus-pedidos-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const inputSt: React.CSSProperties = {
    padding: '8px 12px', borderRadius: 8,
    border: `1px solid ${c.border}`, background: c.bg,
    color: c.text, fontSize: 12, outline: 'none', width: '100%',
  };

  const thSt = (field?: SortField): React.CSSProperties => ({
    padding: '10px 14px', textAlign: 'left', fontSize: 10,
    fontWeight: 700, color: c.textMuted, letterSpacing: 0.8,
    cursor: field ? 'pointer' : 'default',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    background: c.surfaceAlt,
  });

  const SortIcon = ({ field }: { field: SortField }) =>
    sortField === field
      ? (sortDir === 'asc' ? <IconChevronUp /> : <IconChevronDown />)
      : <span style={{ opacity: 0.3 }}><IconChevronDown /></span>;

  const spinKeyframes = `
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }

    @media (max-width: 640px) {
      .fin-page-pad { padding: 12px !important; }
      .fin-stats { grid-template-columns: repeat(2, 1fr) !important; }
      .fin-header { flex-direction: column !important; align-items: flex-start !important; }
      .fin-toolbar { flex-direction: column !important; align-items: stretch !important; }
      .fin-toolbar-left { flex-direction: column !important; width: 100% !important; }
      .fin-search { max-width: 100% !important; }
      .fin-export { width: 100% !important; justify-content: center !important; }
      .fin-overflow { overflow-x: visible !important; padding: 8px !important; }
      .fin-table thead { display: none !important; }
      .fin-table tbody tr.fin-row {
        display: block !important;
        border-radius: 8px !important;
        margin-bottom: 8px !important;
        padding: 12px 14px !important;
        border: 1px solid rgba(128,128,128,0.15) !important;
      }
      .fin-table tbody tr.fin-row-expanded {
        display: block !important;
        padding: 12px 14px !important;
      }
      .fin-row td {
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        padding: 5px 0 !important;
        border-bottom: 1px solid rgba(128,128,128,0.08) !important;
        font-size: 12px !important;
        white-space: normal !important;
        max-width: 100% !important;
        text-overflow: clip !important;
        overflow: visible !important;
      }
      .fin-row td:last-child { border-bottom: none !important; }
      .fin-row td::before {
        content: attr(data-label);
        font-size: 10px !important;
        font-weight: 700 !important;
        color: #888 !important;
        flex-shrink: 0 !important;
        margin-right: 8px !important;
        min-width: 70px !important;
      }
    }
  `;

  if (!franchisee?.id) {
    return (
      <div style={{ background: c.bg, minHeight: '100vh', padding: 24 }}>
        <style>{spinKeyframes}</style>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 12, padding: 32 }}>
            <h1 style={{ color: c.text, fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>Extrato de Pedidos</h1>
            <p style={{ color: c.textSec, margin: '0 0 18px' }}>Seu usuário ainda não está vinculado a um cadastro de franqueado.</p>
            <div style={{ color: c.textMuted, fontSize: 13 }}>Aguarde a ativação ou ajuste pelo administrador do portal.</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: c.bg, minHeight: '100vh' }}>
      <style>{spinKeyframes}</style>
      <div className="fin-page-pad" style={{ maxWidth: 1400, margin: '0 auto', padding: 24, animation: 'fadeIn 0.3s ease' }}>
        <div className="fin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ color: c.text, fontSize: 24, fontWeight: 800, margin: '0 0 4px' }}>
              Extrato de Pedidos
            </h1>
            <p style={{ color: c.textSec, fontSize: 13, margin: 0 }}>
              Acompanhe seus pedidos e status de produção
            </p>
          </div>
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', background: c.surface,
              border: `1px solid ${c.border}`, borderRadius: 8,
              color: c.textSec, cursor: 'pointer', fontSize: 12, fontWeight: 600,
              opacity: refreshing ? 0.6 : 1,
            }}
          >
            <IconRefresh /> {refreshing ? 'Atualizando...' : 'Atualizar'}
          </button>
        </div>

        <div className="fin-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'TOTAL', value: stats.total, color: c.accent, borderColor: c.accent },
            { label: 'RECEBIDOS', value: stats.solicitado, color: '#c8c8c8', borderColor: '#c8c8c8' },
            { label: 'EM ANDAMENTO', value: stats.em_producao, color: '#c8c8c8', borderColor: '#c8c8c8' },
            { label: 'CONCLUÍDOS', value: stats.concluido, color: '#b0b0b0', borderColor: '#b0b0b0' },
            { label: 'CANCELADOS', value: stats.cancelado, color: '#c8c8c8', borderColor: '#c8c8c8' },
          ].map(({ label, value, color, borderColor }) => (
            <div key={label} style={{
              background: c.surface, border: `1px solid ${c.border}`,
              borderTop: `3px solid ${borderColor}`, borderRadius: 10,
              padding: '14px 16px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 10, color, fontWeight: 700, letterSpacing: 0.5, marginBottom: 6 }}>{label}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color }}>{value}</div>
            </div>
          ))}
        </div>

        <div style={{
          background: c.surface, border: `1px solid ${c.border}`,
          borderRadius: 12, padding: '14px 18px', marginBottom: 20,
        }}>
          <div className="fin-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div className="fin-toolbar-left" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
              <div className="fin-search" style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: c.textMuted }}>
                  <IconSearch />
                </span>
                <input
                  type="text"
                  placeholder="Buscar pedido, placa ou modelo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ ...inputSt, paddingLeft: 32 }}
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')}
                    style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: c.textMuted }}>
                    <IconX />
                  </button>
                )}
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px', borderRadius: 8,
                  border: `1px solid ${showFilters ? c.accent : c.border}`,
                  background: showFilters ? c.accentBg : 'transparent',
                  color: showFilters ? c.accent : c.textSec,
                  cursor: 'pointer', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
                }}
              >
                <IconFilter />
                Filtros
                {hasFilters && (
                  <span style={{
                    background: c.accent, color: '#000', borderRadius: '50%',
                    width: 16, height: 16, fontSize: 10, fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {[filterStatus, dateRange.start, dateRange.end].filter(Boolean).length}
                  </span>
                )}
              </button>
            </div>

            <button
              onClick={exportCSV}
              className="fin-export"
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: isDark ? '#1c1c1c' : '#f0f0f0',
                border: `1px solid ${c.accent}`,
                borderRadius: 8, padding: '8px 16px',
                color: c.accent, cursor: 'pointer', fontSize: 12, fontWeight: 700,
              }}
            >
              <IconDownload /> Exportar CSV
            </button>
          </div>

          {showFilters && (
            <div style={{
              marginTop: 14, paddingTop: 14, borderTop: `1px solid ${c.border}`,
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10,
            }}>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={inputSt}>
                <option value="">Todos os status</option>
                {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 10, color: c.textMuted, fontWeight: 700 }}>DATA INICIAL</label>
                <input type="date" value={dateRange.start} onChange={(e) => setDateRange((p) => ({ ...p, start: e.target.value }))} style={inputSt} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 10, color: c.textMuted, fontWeight: 700 }}>DATA FINAL</label>
                <input type="date" value={dateRange.end} onChange={(e) => setDateRange((p) => ({ ...p, end: e.target.value }))} style={inputSt} />
              </div>

              {hasFilters && (
                <button
                  onClick={() => { setFilterStatus(''); setDateRange({ start: '', end: '' }); setSearchTerm(''); }}
                  style={{
                    padding: '8px 14px', background: '#c8c8c8', border: 'none',
                    borderRadius: 8, color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}
                >
                  <IconX /> Limpar tudo
                </button>
              )}
            </div>
          )}
        </div>

        <div style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 12, overflow: 'hidden' }}>
          <div style={{
            padding: '14px 18px', borderBottom: `1px solid ${c.border}`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8,
          }}>
            <h2 style={{ color: c.text, fontSize: 14, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <IconClipboard /> Lista de Pedidos
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {hasFilters && (
                <span style={{
                  fontSize: 11, color: c.accent, background: c.accentBg,
                  padding: '3px 8px', borderRadius: 20, fontWeight: 600,
                }}>
                  Filtros ativos
                </span>
              )}
              <span style={{ fontSize: 12, color: c.textMuted }}>
                {filteredOrders.length} / {orders.length} pedidos
              </span>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: 64, textAlign: 'center', color: c.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontSize: 13 }}>
              <IconLoader /> Carregando pedidos...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div style={{ padding: 64, textAlign: 'center', color: c.textMuted, fontSize: 13 }}>
              Nenhum pedido encontrado{hasFilters ? ' com os filtros aplicados.' : '.'}
            </div>
          ) : (
            <div className="fin-overflow" style={{ overflowX: 'auto' }}>
              <table className="fin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${c.border}` }}>
                    <th style={thSt('order_number')} onClick={() => toggleSort('order_number')}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>PEDIDO <SortIcon field="order_number" /></span>
                    </th>
                    <th style={thSt('vehicle_plate')} onClick={() => toggleSort('vehicle_plate')}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>PLACA <SortIcon field="vehicle_plate" /></span>
                    </th>
                    <th style={thSt()}>MODELO</th>
                    <th style={thSt('created_at')} onClick={() => toggleSort('created_at')}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>DATA <SortIcon field="created_at" /></span>
                    </th>
                    <th style={thSt('status')} onClick={() => toggleSort('status')}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>STATUS <SortIcon field="status" /></span>
                    </th>
                    <th style={thSt()}>OBSERVAÇÕES</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order, idx) => {
                    const st = statusStyle(order.status);
                    const isExpanded = expandedId === order.id;
                    const isLast = idx === filteredOrders.length - 1;

                    return (
                      <>
                        <tr
                          key={order.id}
                          className="fin-row"
                          onClick={() => setExpandedId(isExpanded ? null : order.id)}
                          style={{
                            borderBottom: isLast && !isExpanded ? 'none' : `1px solid ${c.border}`,
                            cursor: 'pointer', transition: 'background 0.12s',
                            background: isExpanded ? c.surfaceHover : 'transparent',
                          }}
                          onMouseEnter={(e) => { if (!isExpanded) e.currentTarget.style.background = c.surfaceAlt; }}
                          onMouseLeave={(e) => { if (!isExpanded) e.currentTarget.style.background = 'transparent'; }}
                        >
                          <td data-label="PEDIDO" style={{ padding: '11px 14px', fontSize: 13, fontWeight: 700, color: c.accent, whiteSpace: 'nowrap' }}>
                            {order.order_number}
                          </td>
                          <td data-label="PLACA" style={{ padding: '11px 14px', fontSize: 12, color: c.textSec, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                            {order.vehicle_plate}
                          </td>
                          <td data-label="MODELO" style={{ padding: '11px 14px', fontSize: 12, color: c.textSec, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {order.model}
                          </td>
                          <td data-label="DATA" style={{ padding: '11px 14px', fontSize: 12, color: c.textSec, whiteSpace: 'nowrap' }}>
                            {formatDateShort(order.created_at)}
                          </td>
                          <td data-label="STATUS" style={{ padding: '11px 14px' }}>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                              background: st.bg, color: st.text,
                            }}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: st.dot, flexShrink: 0 }} />
                              {STATUS_LABELS[order.status] ?? order.status}
                            </span>
                          </td>
                          <td data-label="OBS" style={{ padding: '11px 14px', fontSize: 11, color: c.textSec, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {order.notes || '—'}
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr key={`${order.id}-expanded`} className="fin-row-expanded" style={{ borderBottom: isLast ? 'none' : `1px solid ${c.border}` }}>
                            <td colSpan={6} style={{ padding: '12px 20px 16px 20px', background: c.surfaceHover }}>
                              <div style={{ fontSize: 11, color: c.textMuted, fontWeight: 700, marginBottom: 6 }}>OBSERVAÇÕES COMPLETAS</div>
                              <div style={{ fontSize: 12, color: c.text, lineHeight: 1.6, whiteSpace: 'pre-wrap', maxWidth: 900 }}>
                                {order.notes || 'Sem observações registradas.'}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!loading && filteredOrders.length > 0 && (
            <div style={{
              padding: '12px 18px', borderTop: `1px solid ${c.border}`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              fontSize: 11, color: c.textMuted,
            }}>
              <span>Clique em uma linha para ver as observações completas</span>
              <span>{filteredOrders.length} resultado(s)</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
