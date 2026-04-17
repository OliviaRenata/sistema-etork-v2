// src/pages/admin/AdminOrders.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';
import { formatDate } from '../../lib/utils';

type OrderStatus = 'solicitado' | 'em_producao' | 'enviado' | 'concluido' | 'cancelado';

const statusOptions = [
  { value: 'solicitado', label: 'Solicitado', color: '#f59e0b' },
  { value: 'em_producao', label: 'Em Produção', color: '#3b82f6' },
  { value: 'enviado', label: 'Enviado', color: '#8b5cf6' },
  { value: 'concluido', label: 'Concluído', color: '#10b981' },
  { value: 'cancelado', label: 'Cancelado', color: '#ef4444' },
];

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
      const franchiseeIds = [...new Set(data?.map(o => o.franchisee_id) || [])];
      const { data: franchisees } = await supabase
        .from('franchisees')
        .select('id, company_name, code')
        .in('id', franchiseeIds);
      
      const franchiseeMap = new Map();
      franchisees?.forEach(f => franchiseeMap.set(f.id, f));
      
      const ordersWithFranchisee = (data || []).map(order => ({
        ...order,
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
          <h3 style={{ color: '#ef4444' }}>Erro</h3>
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
                style={{
                  background: colors.surface,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 12,
                  padding: 16,
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: colors.accent }}>
                      {order.order_number}
                    </div>
                    <div style={{ fontSize: 12, color: colors.text, marginTop: 4 }}>
                      {order.franchisee?.company_name || '—'}
                    </div>
                    <div style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
                      Placa: {order.vehicle_plate || '—'} | Data: {formatDate(order.created_at)}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      borderRadius: 20,
                      fontSize: 11,
                      fontWeight: 600,
                      background: statusOptions.find(s => s.value === order.status)?.color + '20',
                      color: statusOptions.find(s => s.value === order.status)?.color,
                    }}>
                      {statusOptions.find(s => s.value === order.status)?.label || order.status}
                    </span>
                    
                    <select
                      value={order.status}
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
      </div>
    </div>
  );
}