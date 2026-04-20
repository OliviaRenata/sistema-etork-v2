// src/pages/admin/AdminOrders.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';
import { formatDate } from '../../lib/utils';

type OrderStatus = 'solicitado' | 'em_producao' | 'concluido';

const statusOptions = [
  { value: 'solicitado', label: 'Recebido', color: '#f5d54a' },
  { value: 'em_producao', label: 'Em andamento', color: '#e6b800' },
  { value: 'concluido', label: 'Concluído', color: '#b38f00' },
] as const;

function mapStatusForFlow(status: string): OrderStatus {
  if (status === 'concluido') return 'concluido';
  if (status === 'solicitado') return 'solicitado';
  return 'em_producao';
}

export default function AdminOrders() {
  const { isAdmin } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [error, setError] = useState<string>('');

  const colors = {
    background: isDark ? '#0d0d0d' : '#f3f4f6',
    surface: isDark ? '#141414' : '#ffffff',
    text: isDark ? '#e5e5e5' : '#1a1a1a',
    textSecondary: isDark ? '#888888' : '#6b7280',
    border: isDark ? '#222222' : '#e5e7eb',
    accent: '#e6b800',
  };

  const detailFieldPriority = [
    'order_number',
    'status',
    'franchisee_id',
    'vehicle_plate',
    'model',
    'chassi',
    'year',
    'engine',
    'cv',
    'fuel',
    'notes',
    'created_at',
    'updated_at',
    'id',
  ];

  function formatFieldLabel(field: string) {
    return field
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
  }

  function formatFieldValue(field: string, value: any) {
    if (value === null || value === undefined || value === '') return '—';
    if (field === 'created_at' || field === 'updated_at') return formatDate(String(value));
    if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  }

  if (!isAdmin) {
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <h2>Acesso negado</h2>
      </div>
    );
  }

  useEffect(() => {
    loadOrders();
  }, [filterStatus]);

  async function loadOrders() {
    setLoading(true);
    setError('');
    
    try {
      // Consulta SIMPLES - sem join complexo
      let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50); // LIMITADO a 50 pedidos para não travar

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      // Buscar nomes dos franqueados separadamente
      const franchiseeIds = [...new Set((data?.map(o => o.franchisee_id) || []).filter(Boolean))];
      if (franchiseeIds.length === 0) {
        setOrders([]);
        return;
      }

      const { data: franchisees } = await supabase
        .from('franchisees')
        .select('id, company_name, code')
        .in('id', franchiseeIds);
      
      const franchiseeMap = new Map();
      franchisees?.forEach(f => franchiseeMap.set(f.id, f));
      
      const ordersWithFranchisee = (data || []).map(order => ({
        ...order,
        flow_status: mapStatusForFlow(order.status),
        franchisee: franchiseeMap.get(order.franchisee_id) || { company_name: '—', code: '—' }
      }));
      
      setOrders(ordersWithFranchisee);
      
    } catch (error) {
      console.error('Erro:', error);
      setError('Erro ao carregar pedidos. Tente novamente.');
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
      setSelectedOrder(null);
    } catch (error) {
      console.error('Erro ao atualizar:', error);
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <div style={{ background: colors.background, minHeight: '100vh', padding: 24, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 16, color: colors.text }}>Carregando pedidos...</div>
          <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 8 }}>Aguarde um momento</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ background: colors.background, minHeight: '100vh', padding: 24 }}>
        <div style={{ textAlign: 'center', padding: 60, background: colors.surface, borderRadius: 12 }}>
          <h3 style={{ color: '#e6b800' }}>Erro</h3>
          <p style={{ color: colors.textSecondary }}>{error}</p>
          <button 
            onClick={() => loadOrders()}
            style={{ padding: '8px 16px', background: colors.accent, border: 'none', borderRadius: 6, cursor: 'pointer' }}
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: colors.background, minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ color: colors.text, fontSize: 24, margin: 0 }}>Gerenciar Pedidos</h1>
          <p style={{ color: colors.textSecondary, marginTop: 4 }}>Visualize e atualize o status dos pedidos</p>
        </div>

        {/* Filtros */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
          <button
            onClick={() => setFilterStatus('all')}
            style={{
              padding: '6px 16px',
              borderRadius: 20,
              border: `1px solid ${filterStatus === 'all' ? colors.accent : colors.border}`,
              background: filterStatus === 'all' ? colors.accent : 'transparent',
              color: filterStatus === 'all' ? '#000' : colors.textSecondary,
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            Todos ({orders.length})
          </button>
          {statusOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setFilterStatus(opt.value)}
              style={{
                padding: '6px 16px',
                borderRadius: 20,
                border: `1px solid ${filterStatus === opt.value ? opt.color : colors.border}`,
                background: filterStatus === opt.value ? opt.color : 'transparent',
                color: filterStatus === opt.value ? '#fff' : colors.textSecondary,
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Lista de Pedidos */}
        {orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, background: colors.surface, borderRadius: 12 }}>
            <p style={{ color: colors.textSecondary }}>Nenhum pedido encontrado</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {orders.map((order) => (
              <div
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                style={{
                  background: colors.surface,
                  border: `1px solid ${colors.border}`,
                  borderLeft: `4px solid ${statusOptions.find((s) => s.value === order.flow_status)?.color || colors.accent}`,
                  borderRadius: 14,
                  padding: 18,
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  boxShadow: isDark ? '0 4px 16px rgba(0, 0, 0, 0.25)' : '0 4px 14px rgba(0, 0, 0, 0.06)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = isDark ? '0 8px 20px rgba(0, 0, 0, 0.35)' : '0 8px 20px rgba(0, 0, 0, 0.10)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = isDark ? '0 4px 16px rgba(0, 0, 0, 0.25)' : '0 4px 14px rgba(0, 0, 0, 0.06)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: colors.accent, letterSpacing: 0.4 }}>
                      {order.order_number}
                    </div>
                    <div style={{ fontSize: 14, color: colors.text, marginTop: 4, fontWeight: 600 }}>
                      {order.franchisee?.company_name || '—'}
                    </div>
                    <div style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
                      Placa: {order.vehicle_plate || '—'} | Data: {formatDate(order.created_at)}
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 10, padding: '4px 8px', borderRadius: 999, border: `1px solid ${colors.border}`, color: colors.textSecondary }}>
                        Código: {order.franchisee?.code || '—'}
                      </span>
                      <span style={{ fontSize: 10, padding: '4px 8px', borderRadius: 999, border: `1px solid ${colors.border}`, color: colors.textSecondary }}>
                        ID: {order.id?.slice(0, 8)}...
                      </span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      borderRadius: 20,
                      fontSize: 11,
                      fontWeight: 600,
                      background: statusOptions.find(s => s.value === order.flow_status)?.color + '20',
                      color: statusOptions.find(s => s.value === order.flow_status)?.color,
                    }}>
                      {statusOptions.find(s => s.value === order.flow_status)?.label || order.flow_status}
                    </span>
                    
                    <select
                      value={order.flow_status}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                      disabled={updating}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 6,
                        border: `1px solid ${colors.border}`,
                        background: colors.surface,
                        color: colors.text,
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      {statusOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(order)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 6,
                        border: `1px solid ${colors.border}`,
                        background: isDark ? '#1a1a1a' : '#fafafa',
                        color: colors.text,
                        fontSize: 12,
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      Ver detalhes
                    </button>
                  </div>
                </div>
                
                {order.model && (
                  <div style={{ marginTop: 8, fontSize: 11, color: colors.textSecondary }}>
                    Modelo: {order.model}
                  </div>
                )}
                
                {order.notes && (
                  <div style={{ marginTop: 8, fontSize: 11, color: colors.textSecondary, background: colors.background, padding: 8, borderRadius: 6 }}>
                    Obs: {order.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {selectedOrder && (
          <div
            onClick={() => setSelectedOrder(null)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.72)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 18,
              zIndex: 1000,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: 'min(960px, 96vw)',
                maxHeight: '92vh',
                overflow: 'auto',
                background: colors.surface,
                border: `1px solid ${colors.border}`,
                borderRadius: 14,
                boxShadow: '0 18px 48px rgba(0, 0, 0, 0.35)',
              }}
            >
              <div
                style={{
                  position: 'sticky',
                  top: 0,
                  zIndex: 1,
                  background: colors.surface,
                  borderBottom: `1px solid ${colors.border}`,
                  padding: '14px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: colors.text }}>
                    Detalhes do Pedido {selectedOrder.order_number || '—'}
                  </div>
                  <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                    Franqueado: {selectedOrder.franchisee?.company_name || '—'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  style={{
                    border: `1px solid ${colors.border}`,
                    background: 'transparent',
                    color: colors.text,
                    borderRadius: 8,
                    fontSize: 13,
                    cursor: 'pointer',
                    padding: '8px 12px',
                    fontWeight: 600,
                  }}
                >
                  Fechar
                </button>
              </div>

              <div style={{ padding: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 10 }}>
                  {[
                    ...detailFieldPriority.filter((field) => field in selectedOrder),
                    ...Object.keys(selectedOrder).filter((field) => !detailFieldPriority.includes(field)),
                  ]
                    .filter((field) => field !== 'franchisee' && field !== 'flow_status')
                    .map((field) => (
                      <div
                        key={field}
                        style={{
                          border: `1px solid ${colors.border}`,
                          borderRadius: 10,
                          padding: '10px 12px',
                          background: isDark ? '#121212' : '#fafafa',
                        }}
                      >
                        <div style={{ fontSize: 10, fontWeight: 700, color: colors.textSecondary, letterSpacing: 0.5 }}>
                          {formatFieldLabel(field)}
                        </div>
                        <div style={{ marginTop: 6, fontSize: 12, color: colors.text, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                          {formatFieldValue(field, selectedOrder[field])}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}