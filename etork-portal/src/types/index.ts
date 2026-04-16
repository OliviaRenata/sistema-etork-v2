// src/types/index.ts — Etork Brasil Portal Types

export type UserRole = 'admin' | 'franchisee';
export type OrderStatus = 'solicitado' | 'em_producao' | 'enviado' | 'concluido' | 'cancelado';
export type PaymentStatus = 'pendente' | 'pago' | 'vencido' | 'cancelado';
export type NotificationType = 'novo_pedido' | 'status_atualizado' | 'financeiro' | 'sistema';
export type TransactionType = 'debit' | 'credit' | 'payment' | 'adjustment';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Franchisee {
  id: string;
  user_id: string;
  code: string;
  company_name: string;
  cnpj?: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  active: boolean;
  credit_limit: number;
  balance: number;
  created_at: string;
  updated_at: string;
  profile?: Profile;
}

export interface Item {
  id: string;
  sku: string;
  name: string;
  description?: string;
  category: string;
  unit_price: number;
  active: boolean;
  requires_file: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  item_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  notes?: string;
  item?: Item;
}

export interface OrderFile {
  id: string;
  order_id: string;
  file_name: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  uploaded_by: string;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  franchisee_id: string;
  status: OrderStatus;
  total_amount: number;
  notes?: string;
  vehicle_plate?: string;
  vehicle_info?: Record<string, unknown>;
  created_by: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  franchisee?: Franchisee;
  order_items?: OrderItem[];
  order_files?: OrderFile[];
}

export interface FinancialRecord {
  id: string;
  franchisee_id: string;
  order_id?: string;
  type: TransactionType;
  amount: number;
  description: string;
  payment_status: PaymentStatus;
  due_date?: string;
  paid_at?: string;
  created_by: string;
  created_at: string;
  order?: Order;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  data?: Record<string, unknown>;
  created_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  from_status?: OrderStatus;
  to_status: OrderStatus;
  changed_by: string;
  notes?: string;
  created_at: string;
  profile?: Profile;
}

// UI / form types
export interface CartItem {
  item: Item;
  quantity: number;
  notes?: string;
}

export interface OrderFormData {
  notes?: string;
  vehicle_plate?: string;
  items: { item_id: string; quantity: number; notes?: string }[];
}

export interface DashboardStats {
  total_orders: number;
  orders_this_month: number;
  pending_orders: number;
  total_spent: number;
  balance: number;
  credit_limit: number;
}

export interface AdminStats {
  total_franchisees: number;
  active_franchisees: number;
  total_orders: number;
  orders_pending: number;
  orders_in_production: number;
  revenue_this_month: number;
  revenue_total: number;
}

// Status labels & colors
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  solicitado:   'Solicitado',
  em_producao:  'Em Produção',
  enviado:      'Enviado',
  concluido:    'Concluído',
  cancelado:    'Cancelado',
};

export const ORDER_STATUS_COLOR: Record<OrderStatus, string> = {
  solicitado:   'amber',
  em_producao:  'blue',
  enviado:      'purple',
  concluido:    'green',
  cancelado:    'red',
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  pendente:   'Pendente',
  pago:       'Pago',
  vencido:    'Vencido',
  cancelado:  'Cancelado',
};
