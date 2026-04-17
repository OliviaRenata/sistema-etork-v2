// src/pages/admin/AdminOrders.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';
import { formatDate } from '../../lib/utils';

// Ícones SVG
const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"/>
    <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14"/>
  </svg>
);

const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

const PackageIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.29 7 12 12 20.71 7"/>
    <line x1="12" y1="22" x2="12" y2="12"/>
  </svg>
);

const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

type OrderStatus = 'solicitado' | 'em_producao' | 'enviado' | 'concluido' | 'cancelado';

const statusOptions = [
  { value: 'solicitado', label: 'Solicitado', color: '#f59e0b', bg: '#fef3c7', icon: <ClockIcon /> },
  { value: 'em_producao', label: 'Em Produção', color: '#3b82f6', bg: '#dbeafe', icon: <RefreshIcon /> },
  { value: 'enviado', label: 'Enviado', color: '#8b5cf6', bg: '#ede9fe', icon: <PackageIcon /> },
  { value: 'concluido', label: 'Concluído', color: '#10b981', bg: '#d1fae5', icon: <CheckIcon /> },
  { value: 'cancelado', label: 'Cancelado', color: '#ef4444', bg: '#fee2e2', icon: <XIcon /> },
];

export default function AdminOrders() {
  const { isAdmin } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const colors = {
    background: isDark ? '#0d0d0d' : '#f3f4f6',
    surface: isDark ? '#141414' : '#ffffff',
    text: isDark ? '#e5e5e5' : '#1a1a1a',
    textSecondary: isDark ? '#888888' : '#6b7280',
    border: isDark ? '#222222' : '#e5e7eb',
    accent: '#e6b800',
  };

  if (!isAdmin) {
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <h2>Acesso negado</h2>
        <p>Você não tem permissão para acessar esta página.</p>
      </div>
    );
  }

  useEffect(() => {
    loadOrders();
  }, [filterStatus]);

  async function loadOrders() {
    setLoading(true);
    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          franchisee:franchisees(company_name, code)
        `)
        .order('created_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateOrderStatus(orderId: string, newStatus: OrderStatus) {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;
      
      await loadOrders();
      setShowStatusModal(false);
      setSelectedOrder(null);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    } finally {
      setUpdating(false);
    }
  }

  const getStatusInfo = (status: string) => {
    return statusOptions.find(opt => opt.value === status) || statusOptions[0];
  };

  const filteredOrders = orders.filter(order => 
    order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.vehicle_plate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.franchisee?.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Estatísticas
  const stats = {
    total: orders.length,
    solicitado: orders.filter(o => o.status === 'solicitado').length,
    em_producao: orders.filter(o => o.status === 'em_producao').length,
    enviado: orders.filter(o => o.status === 'enviado').length,
    concluido: orders.filter(o => o.status === 'concluido').length,
    cancelado: orders.filter(o => o.status === 'cancelado').length,
  };

  return (
    <div style={{ background: colors.background, minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ color: colors.text, fontSize: 24, margin: 0 }}>Gerenciar Pedidos</h1>
          <p style={{ color: colors.textSecondary, marginTop: 4 }}>Visualize e atualize o status de todos os pedidos dos franqueados</p>
        </div>

        {/* Cards de Estatísticas */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 24 }}>
          <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 10, padding: '12px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: colors.textSecondary }}>TOTAL</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: colors.text }}>{stats.total}</div>
          </div>
          <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 10, padding: '12px 14px', textAlign: 'center', borderTop: `2px solid #f59e0b` }}>
            <div style={{ fontSize: 11, color: '#f59e0b' }}>SOLICITADO</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#f59e0b' }}>{stats.solicitado}</div>
          </div>
          <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 10, padding: '12px 14px', textAlign: 'center', borderTop: `2px solid #3b82f6` }}>
            <div style={{ fontSize: 11, color: '#3b82f6' }}>EM PRODUÇÃO</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#3b82f6' }}>{stats.em_producao}</div>
          </div>
          <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 10, padding: '12px 14px', textAlign: 'center', borderTop: `2px solid #8b5cf6` }}>
            <div style={{ fontSize: 11, color: '#8b5cf6' }}>ENVIADO</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#8b5cf6' }}>{stats.enviado}</div>
          </div>
          <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 10, padding: '12px 14px', textAlign: 'center', borderTop: `2px solid #10b981` }}>
            <div style={{ fontSize: 11, color: '#10b981' }}>CONCLUÍDO</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#10b981' }}>{stats.concluido}</div>
          </div>
        </div>

        {/* Filtros e Busca */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 24, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flex: 1 }}>
            <button
              onClick={() => setFilterStatus('all')}
              style={{
                padding: '8px 16px',
                borderRadius: 20,
                border: `1px solid ${filterStatus === 'all' ? colors.accent : colors.border}`,
                background: filterStatus === 'all' ? colors.accent : 'transparent',
                color: filterStatus === 'all' ? '#000' : colors.textSecondary,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600
              }}
            >
              Todos
            </button>
            {statusOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setFilterStatus(opt.value)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 20,
                  border: `1px solid ${filterStatus === opt.value ? opt.color : colors.border}`,
                  background: filterStatus === opt.value ? opt.color : 'transparent',
                  color: filterStatus === opt.value ? '#fff' : colors.textSecondary,
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
          
          <input
            type="text"
            placeholder="Buscar por pedido, placa ou franqueado..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: `1px solid ${colors.border}`,
              background: colors.surface,
              color: colors.text,
              width: 250,
              outline: 'none'
            }}
          />
        </div>

        {/* Cards de Pedidos */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: colors.textSecondary }}>Carregando pedidos...</div>
        ) : filteredOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: colors.textSecondary }}>Nenhum pedido encontrado</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 16 }}>
            {filteredOrders.map((order) => {
              const statusInfo = getStatusInfo(order.status);
              return (
                <div
                  key={order.id}
                  style={{
                    background: colors.surface,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 12,
                    overflow: 'hidden',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Header do Card */}
                  <div style={{
                    padding: '12px 16px',
                    background: statusInfo.bg,
                    borderBottom: `1px solid ${colors.border}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: statusInfo.color }}>{statusInfo.icon}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: statusInfo.color }}>{statusInfo.label}</span>
                    </div>
                    <span style={{ fontSize: 11, color: colors.textSecondary }}>{order.order_number}</span>
                  </div>

                  {/* Corpo do Card */}
                  <div style={{ padding: 16 }}>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 4 }}>FRANQUEADO</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: colors.text }}>{order.franchisee?.company_name || '—'}</div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 4 }}>PLACA</div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: colors.accent }}>{order.vehicle_plate || '—'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 4 }}>DATA</div>
                        <div style={{ fontSize: 12, color: colors.textSecondary }}>{formatDate(order.created_at)}</div>
                      </div>
                    </div>

                    {order.model && (
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 4 }}>MODELO</div>
                        <div style={{ fontSize: 12, color: colors.text }}>{order.model}</div>
                      </div>
                    )}

                    {order.notes && (
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 4 }}>OBSERVAÇÕES</div>
                        <div style={{ fontSize: 11, color: colors.textSecondary, maxHeight: 40, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {order.notes}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer do Card - Botões */}
                  <div style={{
                    padding: '12px 16px',
                    borderTop: `1px solid ${colors.border}`,
                    display: 'flex',
                    gap: 10,
                    background: isDark ? '#1a1a1a' : '#fafafa'
                  }}>
                    <button
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowStatusModal(true);
                      }}
                      style={{
                        flex: 1,
                        padding: '8px',
                        background: colors.accent,
                        color: '#000',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6
                      }}
                    >
                      <RefreshIcon /> Alterar Status
                    </button>
                    <button
                      onClick={() => window.location.href = `/admin/orders/${order.id}`}
                      style={{
                        padding: '8px 16px',
                        background: 'transparent',
                        border: `1px solid ${colors.border}`,
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 12,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        color: colors.textSecondary
                      }}
                    >
                      <EyeIcon /> Detalhes
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal para alterar status */}
        {showStatusModal && selectedOrder && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: colors.surface,
              borderRadius: 12,
              padding: 24,
              width: '90%',
              maxWidth: 400
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ color: colors.text, margin: 0 }}>Alterar Status</h3>
                <button
                  onClick={() => setShowStatusModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textSecondary }}
                >
                  <XIcon />
                </button>
              </div>
              
              <p style={{ color: colors.textSecondary, marginBottom: 16 }}>
                Pedido: <strong style={{ color: colors.accent }}>{selectedOrder.order_number}</strong>
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {statusOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => updateOrderStatus(selectedOrder.id, opt.value as OrderStatus)}
                    disabled={updating}
                    style={{
                      padding: '12px',
                      background: selectedOrder.status === opt.value ? opt.color : colors.surface,
                      border: `1px solid ${colors.border}`,
                      borderRadius: 8,
                      color: selectedOrder.status === opt.value ? '#fff' : colors.text,
                      cursor: updating ? 'not-allowed' : 'pointer',
                      fontWeight: 600,
                      fontSize: 13,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8
                    }}
                  >
                    {opt.icon} {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}