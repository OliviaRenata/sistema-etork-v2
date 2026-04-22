// src/components/ui/StatusBadge.tsx
import type { OrderStatus } from '../../types';
import { ORDER_STATUS_LABEL } from '../../types';

const COLORS: Record<OrderStatus, { bg: string; color: string; border: string }> = {
  solicitado:   { bg: '#1c1c1c', color: '#c8c8c8', border: '#2d2d2d' },
  em_producao:  { bg: '#151515', color: '#c8c8c8', border: '#252525' },
  enviado:      { bg: '#1a1a1a', color: '#d4d4d4', border: '#252525' },
  concluido:    { bg: '#1e1e1e', color: '#c8c8c8', border: '#252525' },
  cancelado:    { bg: '#1c1c1c', color: '#c8c8c8', border: '#444333' },
};

function getFranchiseStatusLabel(status: OrderStatus) {
  if (status === 'solicitado') return 'RECEBIDO';
  if (status === 'concluido') return 'CONCLUÍDO';
  if (status === 'cancelado') return 'CANCELADO';
  return 'EM ANDAMENTO';
}

export default function StatusBadge({
  status,
  large = false,
  mode = 'default',
}: {
  status: OrderStatus;
  large?: boolean;
  mode?: 'default' | 'franchise';
}) {
  const { bg, color, border } = COLORS[status];
  const label = mode === 'franchise' ? getFranchiseStatusLabel(status) : ORDER_STATUS_LABEL[status].toUpperCase();
  return (
    <span style={{
      display: 'inline-block',
      padding: large ? '4px 12px' : '3px 8px',
      borderRadius: 20,
      fontSize: large ? 12 : 10,
      fontWeight: 700,
      letterSpacing: 0.5,
      background: bg, color, border: `1px solid ${border}`,
    }}>
      {label}
    </span>
  );
}
