import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import type { OrderStatus } from '../../types';
import { formatDate } from '../../lib/utils';

type FranchiseOrder = {
  id: string;
  order_number?: string;
  status: OrderStatus;
  created_at: string;
  vehicle_plate?: string;
  model?: string;
  notes?: string;
  order_files?: Array<{
    id: string;
    file_name: string;
    file_path: string;
  }>;
};

export default function FranchiseOrders() {
  const { user, franchisee, loading: authLoading } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [orders, setOrders] = useState<FranchiseOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const colors = {
    bgCard: isDark ? '#111' : '#ffffff',
    bgCardHover: isDark ? '#1a1a1a' : '#fafafa',
    borderCard: isDark ? '#1e1e1e' : '#e0e0e0',
    textPrimary: isDark ? '#fff' : '#1a1a1a',
    textSecondary: isDark ? '#888' : '#666',
    textMuted: isDark ? '#555' : '#999',
    accent: '#c8c8c8',
    statusAmber: isDark ? '#777777' : '#f0f0f0',
    statusBlue: isDark ? '#444333' : '#f0f0f0',
    statusGreen: isDark ? '#444333' : '#f0f0f0',
    statusRed: isDark ? '#444333' : '#f0f0f0',
    badgeFile: isDark ? '#1e1e1e' : '#f0f0f0',
    badgeFileColor: isDark ? '#c8c8c8' : '#b0b0b0',
  };

  useEffect(() => {
    if (authLoading) return;

    if (user?.id) {
      loadOrders();
    } else {
      setLoadingOrders(false);
    }
  }, [user?.id, franchisee?.id, authLoading]);

  async function loadOrders() {
    if (!user?.id) return;

    setLoadingOrders(true);
    setLoadError('');

    try {
      const ownershipFilter = franchisee?.id
        ? `franchisee_id.eq.${franchisee.id},created_by.eq.${user.id}`
        : `created_by.eq.${user.id}`;

      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          status,
          created_at,
          vehicle_plate,
          model,
          notes
        `)
        .or(ownershipFilter)
        .order('created_at', { ascending: false });

      if (ordersError) {
        throw new Error(`Erro ao carregar pedidos: ${ordersError.message}`);
      }

      const orderIds = (ordersData || []).map((order) => order.id);
      const filesByOrder = new Map<string, Array<{ id: string; file_name: string; file_path: string }>>();

      if (orderIds.length > 0) {
        const { data: filesData, error: filesError } = await supabase
          .from('order_files')
          .select('id, order_id, file_name, file_path')
          .in('order_id', orderIds);

        if (filesError) {
          throw new Error(`Erro ao carregar arquivos dos pedidos: ${filesError.message}`);
        }

        for (const file of filesData || []) {
          if (!filesByOrder.has(file.order_id)) {
            filesByOrder.set(file.order_id, []);
          }
          filesByOrder.get(file.order_id)?.push({
            id: file.id,
            file_name: file.file_name,
            file_path: file.file_path,
          });
        }
      }

      setOrders((ordersData || []).map((order) => ({
        ...order,
        order_files: filesByOrder.get(order.id) || [],
      })) as FranchiseOrder[]);
    } catch (err: unknown) {
      setLoadError((err as Error).message || 'Erro desconhecido ao carregar pedidos.');
    } finally {
      setLoadingOrders(false);
    }
  }

  const getStatusText = (status: OrderStatus) => {
    if (status === 'concluido') return 'Concluido';
    if (status === 'solicitado') return 'Recebido';
    if (status === 'cancelado') return 'Cancelado';
    if (status === 'enviado') return 'Enviado';
    return 'Em andamento';
  };

  const getStatusColor = (status: OrderStatus) => {
    const colorMap: Record<OrderStatus, string> = {
      solicitado: colors.statusAmber,
      em_producao: colors.statusBlue,
      enviado: colors.statusBlue,
      concluido: colors.statusGreen,
      cancelado: colors.statusRed,
    };
    return colorMap[status] || colors.bgCard;
  };

  const sortedOrders = [...orders].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  if (!franchisee && !authLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: colors.statusRed }}>
        <h2>Erro de acesso</h2>
        <p>Voce nao tem permissao para acessar esta pagina.</p>
      </div>
    );
  }

  if (authLoading || loadingOrders) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: colors.textSecondary }}>
        Carregando pedidos...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: colors.textPrimary }}>Meus Pedidos</h1>
          <p style={{ margin: '4px 0 0', color: colors.textSecondary, fontSize: 13 }}>
            Histórico dos pedidos enviados, com arquivos e status atualizados pelo administrador
          </p>
        </div>
        <Link
          to="/orders/new"
          style={{
            padding: '10px 24px',
            background: '#c8c8c8',
            borderRadius: 8,
            color: '#000',
            textDecoration: 'none',
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          Ir para Novo Pedido
        </Link>
      </div>

      {loadError && (
        <div
          style={{
            marginBottom: 16,
            padding: '14px 16px',
            background: '#444333',
            color: '#d4d4d4',
            borderRadius: 12,
            fontSize: 13,
          }}
        >
          {loadError}
        </div>
      )}

      <div style={{ background: colors.bgCard, border: `1px solid ${colors.borderCard}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${colors.borderCard}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontSize: 13, color: colors.textSecondary }}>
            Total: {orders.length} pedido(s)
          </span>
          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            style={{
              background: 'transparent',
              border: 'none',
              color: colors.textPrimary,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            Ordenar por data {sortOrder === 'desc' ? '↓' : '↑'}
          </button>
        </div>

        {sortedOrders.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: colors.textSecondary }}>
            Nenhum pedido encontrado. Use Novo Pedido para enviar sua primeira solicitação.
          </div>
        ) : (
          sortedOrders.map((order) => (
            <div key={order.id} style={{ borderBottom: `1px solid ${colors.borderCard}`, transition: 'all 0.2s' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '120px 1fr 140px 120px',
                  alignItems: 'center',
                  padding: '14px 20px',
                  cursor: 'pointer',
                  background: expandedOrderId === order.id ? colors.bgCardHover : 'transparent',
                  gap: 10,
                }}
                onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
              >
                <div>
                  <span style={{ fontWeight: 600, color: colors.textPrimary, fontSize: 13 }}>
                    {order.order_number || order.id.slice(0, 8)}
                  </span>
                </div>
                <div>
                  <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: getStatusColor(order.status), color: isDark ? '#fff' : '#1a1a1a' }}>
                    {getStatusText(order.status)}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: colors.textSecondary }}>{formatDate(order.created_at)}</div>
                <div>
                  {order.order_files && order.order_files.length > 0 && (
                    <span style={{ fontSize: 11, color: colors.badgeFileColor, background: colors.badgeFile, padding: '4px 8px', borderRadius: 4 }}>
                      {order.order_files.length} arquivo(s)
                    </span>
                  )}
                </div>

              </div>

              {expandedOrderId === order.id && (
                <div style={{ padding: '16px 20px 20px 20px', background: colors.bgCardHover, borderTop: `1px solid ${colors.borderCard}` }}>
                  <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                    {order.vehicle_plate && (
                      <div>
                        <div style={{ fontSize: 11, color: colors.textMuted }}>PLACA</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimary }}>{order.vehicle_plate}</div>
                      </div>
                    )}
                    {order.model && (
                      <div>
                        <div style={{ fontSize: 11, color: colors.textMuted }}>MODELO</div>
                        <div style={{ fontSize: 14, color: colors.textPrimary }}>{order.model}</div>
                      </div>
                    )}
                    {order.notes && (
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, color: colors.textMuted }}>OBSERVACOES</div>
                        <div style={{ fontSize: 12, color: colors.textSecondary }}>{order.notes}</div>
                      </div>
                    )}
                  </div>

                  {order.order_files && order.order_files.length > 0 && (
                    <div>
                      <div style={{ fontSize: 11, color: colors.textMuted, marginBottom: 8 }}>ARQUIVOS ENVIADOS</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {order.order_files.map((file) => (
                          <a
                            key={file.id}
                            href={supabase.storage.from('order-files').getPublicUrl(file.file_path).data.publicUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '6px 12px',
                              background: isDark ? '#1a1a1a' : '#f0f0f0',
                              borderRadius: 6,
                              fontSize: 12,
                              color: '#c8c8c8',
                              textDecoration: 'none',
                            }}
                          >
                            {file.file_name}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
