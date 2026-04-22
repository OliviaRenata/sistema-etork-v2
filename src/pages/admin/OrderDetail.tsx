// src/pages/admin/OrderDetail.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, callFunction, storage } from '../../lib/supabase';
import type { Order, OrderStatusHistory, OrderFile, OrderStatus } from '../../types';
import { ORDER_STATUS_LABEL } from '../../types';
import StatusBadge from '../../components/ui/StatusBadge';
import { ArrowRightIcon, DocumentIcon } from '../../components/ui/Icons';
import { formatCurrency, formatDate } from '../../lib/utils';

const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  solicitado:   ['em_producao', 'cancelado'],
  em_producao: ['enviado', 'cancelado'],
  enviado:      ['concluido'],
  concluido:    [],
  cancelado:    [],
};

export default function AdminOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [history, setHistory] = useState<OrderStatusHistory[]>([]);
  const [files, setFiles] = useState<OrderFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [statusNote, setStatusNote] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) loadOrder(id);
  }, [id]);

  async function loadOrder(orderId: string) {
    const [orderRes, historyRes, filesRes] = await Promise.all([
      supabase.from('orders').select(`
        *, 
        franchisee:franchisees(company_name, code, email, phone),
        order_items(*, item:items(name, sku, category))
      `).eq('id', orderId).single(),
      supabase.from('order_status_history')
        .select('*, profile:profiles(full_name)')
        .eq('order_id', orderId).order('created_at', { ascending: false }),
      supabase.from('order_files').select('*').eq('order_id', orderId),
    ]);

    setOrder(orderRes.data as unknown as Order);
    setHistory((historyRes.data || []) as unknown as OrderStatusHistory[]);
    setFiles(filesRes.data || []);
    setLoading(false);
  }

  async function updateStatus(newStatus: OrderStatus) {
    if (!order) return;
    setUpdating(true);
    setError('');
    try {
      await callFunction('update-order-status', {
        order_id: order.id,
        new_status: newStatus,
        notes: statusNote,
      }, 'PATCH');
      await loadOrder(order.id);
      setStatusNote('');
    } catch (err: unknown) {
      setError((err as Error).message || 'Erro ao atualizar status');
    } finally {
      setUpdating(false);
    }
  }

  async function downloadFile(file: OrderFile) {
    const url = await storage.getSignedUrl(file.file_path);
    window.open(url, '_blank');
  }

  if (loading) return <div style={{ color: '#555', padding: 40, textAlign: 'center' }}>Carregando...</div>;
  if (!order) return <div style={{ color: '#c8c8c8', padding: 40 }}>Pedido não encontrado.</div>;

  const franchiseeData = order.franchisee as unknown as { company_name: string; code: string; email: string; phone: string };
  const nextStatuses = STATUS_TRANSITIONS[order.status] || [];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32 }}>
          <ArrowRightIcon width={18} height={18} style={{ transform: 'rotate(180deg)' }} />
        </button>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 style={{ color: '#c8c8c8', fontSize: 22, fontWeight: 700, margin: 0 }}>{order.order_number}</h1>
            <StatusBadge status={order.status} large />
          </div>
          <p style={{ color: '#666', fontSize: 13, margin: '4px 0 0' }}>Criado em {formatDate(order.created_at)}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
        {/* Left */}
        <div>
          {/* Items */}
          <Section title="Itens do Pedido">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1a1a1a' }}>
                  {['SKU', 'Serviço', 'Qtd', 'Valor Unit.', 'Subtotal'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, color: '#555', letterSpacing: 1 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(order.order_items || []).map((oi: any) => {
                  const item = oi as { id: string; item: { sku: string; name: string; category: string }; quantity: number; unit_price: number; subtotal: number };
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid #161616' }}>
                      <td style={{ padding: '10px 12px', fontSize: 11, color: '#555' }}>{item.item?.sku}</td>
                      <td style={{ padding: '10px 12px', fontSize: 13, color: '#ccc' }}>
                        {item.item?.name}
                        <span style={{ display: 'block', fontSize: 11, color: '#555' }}>{item.item?.category}</span>
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: 13, color: '#888' }}>{item.quantity}</td>
                      <td style={{ padding: '10px 12px', fontSize: 13, color: '#888' }}>{formatCurrency(item.unit_price)}</td>
                      <td style={{ padding: '10px 12px', fontSize: 13, color: '#c8c8c8', fontWeight: 600 }}>{formatCurrency(item.subtotal)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4} style={{ padding: '12px', textAlign: 'right', color: '#888', fontSize: 13 }}>Total</td>
                  <td style={{ padding: '12px', color: '#c8c8c8', fontSize: 16, fontWeight: 700 }}>{formatCurrency(order.total_amount)}</td>
                </tr>
              </tfoot>
            </table>
          </Section>

          {/* Files */}
          {files.length > 0 && (
            <Section title="Arquivos Enviados">
              {files.map(file => (
                <div key={file.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 12px', background: '#0d0d0d', borderRadius: 8, marginBottom: 6,
                }}>
                  <div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#ccc', fontWeight: 500 }}>
                      <DocumentIcon width={14} height={14} /> {file.file_name}
                    </div>
                    <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>
                      {file.file_size ? `${(file.file_size / 1024).toFixed(1)} KB · ` : ''}{formatDate(file.created_at)}
                    </div>
                  </div>
                  <button onClick={() => downloadFile(file)}
                    style={{ padding: '6px 14px', background: 'transparent', border: '1px solid #444', borderRadius: 6, color: '#c8c8c8', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
                    Baixar
                  </button>
                </div>
              ))}
            </Section>
          )}

          {/* History */}
          <Section title="Histórico de Status">
            {history.map((h, i) => (
              <div key={h.id} style={{ display: 'flex', gap: 12, marginBottom: 12, position: 'relative' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#c8c8c8', marginTop: 4, flexShrink: 0 }} />
                {i < history.length - 1 && (
                  <div style={{ position: 'absolute', left: 3.5, top: 14, bottom: -8, width: 1, background: '#222' }} />
                )}
                <div>
                  <div style={{ fontSize: 12, color: '#ccc', display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                    {h.from_status && (
                      <>
                        <span>{ORDER_STATUS_LABEL[h.from_status]}</span>
                        <ArrowRightIcon width={12} height={12} />
                      </>
                    )}
                    <strong style={{ color: '#c8c8c8' }}>{ORDER_STATUS_LABEL[h.to_status]}</strong>
                  </div>
                  {h.notes && <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{h.notes}</div>}
                  <div style={{ fontSize: 10, color: '#444', marginTop: 2 }}>
                    {(h.profile as any)?.full_name || '—'} · {formatDate(h.created_at)}
                  </div>
                </div>
              </div>
            ))}
          </Section>
        </div>

        {/* Right: actions + info */}
        <div>
          {/* Update status */}
          {nextStatuses.length > 0 && (
            <Section title="Atualizar Status">
              <textarea
                value={statusNote}
                onChange={e => setStatusNote(e.target.value)}
                placeholder="Observação (opcional)..."
                rows={2}
                style={{ width: '100%', padding: '8px 10px', background: '#0d0d0d', border: '1px solid #2a2a2a', borderRadius: 8, color: '#ccc', fontSize: 12, outline: 'none', resize: 'vertical', marginBottom: 10, boxSizing: 'border-box' }}
              />
              {error && <div style={{ color: '#c8c8c8', fontSize: 12, marginBottom: 8 }}>{error}</div>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {nextStatuses.map(s => (
                  <button key={s} onClick={() => updateStatus(s)} disabled={updating}
                    style={{
                      padding: '10px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                      border: '1px solid',
                      background: s === 'cancelado' ? '#1c1c1c' : '#1e1e1e',
                      color: s === 'cancelado' ? '#c8c8c8' : '#c8c8c8',
                      borderColor: s === 'cancelado' ? '#252525' : '#444333',
                      cursor: 'pointer', letterSpacing: 0.5,
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                    }}>
                    {ORDER_STATUS_LABEL[s]} <ArrowRightIcon width={12} height={12} />
                  </button>
                ))}
              </div>
            </Section>
          )}

          {/* Franchisee info */}
          <Section title="Franqueado">
            <InfoRow label="Empresa" value={franchiseeData?.company_name} />
            <InfoRow label="Código" value={franchiseeData?.code} />
            <InfoRow label="E-mail" value={franchiseeData?.email} />
            <InfoRow label="Telefone" value={franchiseeData?.phone} />
          </Section>

          {/* Order meta */}
          <Section title="Detalhes">
            {order.vehicle_plate && <InfoRow label="Placa" value={order.vehicle_plate} />}
            {order.notes && <InfoRow label="Observações" value={order.notes} />}
            <InfoRow label="Criado em" value={formatDate(order.created_at)} />
            <InfoRow label="Atualizado" value={formatDate(order.updated_at)} />
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 10, padding: 16, marginBottom: 16 }}>
      <h2 style={{ color: '#fff', fontSize: 13, fontWeight: 600, margin: '0 0 14px', letterSpacing: 0.5 }}>{title.toUpperCase()}</h2>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
      <span style={{ fontSize: 12, color: '#555' }}>{label}</span>
      <span style={{ fontSize: 12, color: '#ccc', fontWeight: 500 }}>{value}</span>
    </div>
  );
}