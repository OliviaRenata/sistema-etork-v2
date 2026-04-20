// src/components/ui/StatusBadge.tsx
import type { OrderStatus } from '../../types';
import { ORDER_STATUS_LABEL } from '../../types';

const COLORS: Record<OrderStatus, { bg: string; color: string; border: string }> = {
  solicitado:   { bg: '#1a1200', color: '#f59e0b', border: '#3a2a00' },
  em_producao:  { bg: '#0a1020', color: '#60a5fa', border: '#1a3060' },
  enviado:      { bg: '#150a25', color: '#a78bfa', border: '#3a1a6a' },
  concluido:    { bg: '#0a1a0a', color: '#4ade80', border: '#1a4a1a' },
  cancelado:    { bg: '#1a0a0a', color: '#f87171', border: '#4a1a1a' },
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
