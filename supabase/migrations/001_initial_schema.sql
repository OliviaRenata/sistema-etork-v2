-- ============================================================
-- ETORK BRASIL — Portal de Franqueados
-- Migration: 001_initial_schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUM TYPES
-- ============================================================
CREATE TYPE user_role AS ENUM ('admin', 'franchisee');
CREATE TYPE order_status AS ENUM ('solicitado', 'em_producao', 'enviado', 'concluido', 'cancelado');
CREATE TYPE payment_status AS ENUM ('pendente', 'pago', 'vencido', 'cancelado');
CREATE TYPE notification_type AS ENUM ('novo_pedido', 'status_atualizado', 'financeiro', 'sistema');

-- ============================================================
-- PROFILES (extends Supabase Auth)
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'franchisee',
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- FRANCHISEES
-- ============================================================
CREATE TABLE franchisees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  company_name TEXT NOT NULL,
  cnpj TEXT UNIQUE,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT(2),
  zip_code TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  credit_limit NUMERIC(12,2) NOT NULL DEFAULT 0,
  balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ITEMS (catalog)
-- ============================================================
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  requires_file BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  franchisee_id UUID NOT NULL REFERENCES franchisees(id),
  status order_status NOT NULL DEFAULT 'solicitado',
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  vehicle_plate TEXT,
  vehicle_info JSONB,
  created_by UUID NOT NULL REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-generate order number
CREATE SEQUENCE order_seq START 1000;
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number := 'ETK-' || LPAD(nextval('order_seq')::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION generate_order_number();

-- ============================================================
-- ORDER ITEMS
-- ============================================================
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10,2) NOT NULL,
  subtotal NUMERIC(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ORDER FILES
-- ============================================================
CREATE TABLE order_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- FINANCIAL RECORDS
-- ============================================================
CREATE TABLE financial_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  franchisee_id UUID NOT NULL REFERENCES franchisees(id),
  order_id UUID REFERENCES orders(id),
  type TEXT NOT NULL CHECK (type IN ('debit', 'credit', 'payment', 'adjustment')),
  amount NUMERIC(12,2) NOT NULL,
  description TEXT NOT NULL,
  payment_status payment_status NOT NULL DEFAULT 'pendente',
  due_date DATE,
  paid_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ORDER STATUS HISTORY
-- ============================================================
CREATE TABLE order_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_status order_status,
  to_status order_status NOT NULL,
  changed_by UUID NOT NULL REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TRIGGERS — updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated     BEFORE UPDATE ON profiles           FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_franchisees_updated  BEFORE UPDATE ON franchisees         FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_items_updated        BEFORE UPDATE ON items               FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_orders_updated       BEFORE UPDATE ON orders              FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ============================================================
-- TRIGGER — recalc order total on item change
-- ============================================================
CREATE OR REPLACE FUNCTION recalc_order_total()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE orders SET total_amount = (
    SELECT COALESCE(SUM(subtotal), 0) FROM order_items WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)
  ) WHERE id = COALESCE(NEW.order_id, OLD.order_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_recalc_total
  AFTER INSERT OR UPDATE OR DELETE ON order_items
  FOR EACH ROW EXECUTE FUNCTION recalc_order_total();

-- ============================================================
-- TRIGGER — notify on new order
-- ============================================================
CREATE OR REPLACE FUNCTION notify_new_order()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, body, data)
  SELECT p.id, 'novo_pedido',
    'Novo pedido recebido',
    'Pedido ' || NEW.order_number || ' foi criado e aguarda produção.',
    jsonb_build_object('order_id', NEW.id, 'order_number', NEW.order_number)
  FROM profiles p WHERE p.role = 'admin';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notify_new_order
  AFTER INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION notify_new_order();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE franchisees           ENABLE ROW LEVEL SECURITY;
ALTER TABLE items                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders                ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items           ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_files           ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_records     ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications         ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history  ENABLE ROW LEVEL SECURITY;

-- Helper: get current user role
CREATE OR REPLACE FUNCTION current_role_is(r user_role)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = r);
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper: get franchisee id for current user
CREATE OR REPLACE FUNCTION my_franchisee_id()
RETURNS UUID AS $$
  SELECT id FROM franchisees WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Profiles: users see own, admins see all
CREATE POLICY "profiles_select" ON profiles FOR SELECT
  USING (id = auth.uid() OR current_role_is('admin'));
CREATE POLICY "profiles_update" ON profiles FOR UPDATE
  USING (id = auth.uid() OR current_role_is('admin'));

-- Franchisees: own or admin
CREATE POLICY "franchisees_select" ON franchisees FOR SELECT
  USING (user_id = auth.uid() OR current_role_is('admin'));
CREATE POLICY "franchisees_all_admin" ON franchisees FOR ALL
  USING (current_role_is('admin'));

-- Items: readable by all authenticated
CREATE POLICY "items_select" ON items FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "items_admin"  ON items FOR ALL USING (current_role_is('admin'));

-- Orders: franchisee sees own, admin sees all
CREATE POLICY "orders_select" ON orders FOR SELECT
  USING (franchisee_id = my_franchisee_id() OR current_role_is('admin'));
CREATE POLICY "orders_insert_franchisee" ON orders FOR INSERT
  WITH CHECK (franchisee_id = my_franchisee_id() AND created_by = auth.uid());
CREATE POLICY "orders_admin" ON orders FOR ALL USING (current_role_is('admin'));

-- Order items: tied to order access
CREATE POLICY "order_items_select" ON order_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND (o.franchisee_id = my_franchisee_id() OR current_role_is('admin'))));

-- Order files
CREATE POLICY "order_files_select" ON order_files FOR SELECT
  USING (EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND (o.franchisee_id = my_franchisee_id() OR current_role_is('admin'))));

-- Financial records
CREATE POLICY "financial_select" ON financial_records FOR SELECT
  USING (franchisee_id = my_franchisee_id() OR current_role_is('admin'));
CREATE POLICY "financial_admin" ON financial_records FOR ALL USING (current_role_is('admin'));

-- Notifications: own only
CREATE POLICY "notifications_own" ON notifications FOR ALL USING (user_id = auth.uid());

-- Status history: order access
CREATE POLICY "order_history_select" ON order_status_history FOR SELECT
  USING (EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND (o.franchisee_id = my_franchisee_id() OR current_role_is('admin'))));

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_orders_franchisee     ON orders(franchisee_id);
CREATE INDEX idx_orders_status         ON orders(status);
CREATE INDEX idx_orders_created_at     ON orders(created_at DESC);
CREATE INDEX idx_order_items_order     ON order_items(order_id);
CREATE INDEX idx_financial_franchisee  ON financial_records(franchisee_id);
CREATE INDEX idx_notifications_user    ON notifications(user_id, read, created_at DESC);
CREATE INDEX idx_order_history_order   ON order_status_history(order_id);

-- ============================================================
-- STORAGE BUCKETS (run in Supabase dashboard or via API)
-- ============================================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('order-files', 'order-files', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Storage policies (order-files private, signed URL access)
-- CREATE POLICY "order_files_upload" ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'order-files' AND auth.uid() IS NOT NULL);
-- CREATE POLICY "order_files_download" ON storage.objects FOR SELECT
--   USING (bucket_id = 'order-files' AND auth.uid() IS NOT NULL);

-- ============================================================
-- SEED DATA — Categories & Items Example
-- ============================================================
INSERT INTO items (sku, name, description, category, unit_price, requires_file) VALUES
  ('RMP-001', 'Remap Stage 1',        'Reprogramação ECU nível 1 — ganho de potência e torque',        'Remap',      450.00, true),
  ('RMP-002', 'Remap Stage 2',        'Reprogramação ECU nível 2 — alta performance com upgrades',     'Remap',      750.00, true),
  ('RMP-003', 'Remap DSG/TCU',        'Reprogramação de câmbio automático DSG/DCT',                    'Remap',      380.00, true),
  ('CHIP-001','Chip Acelerador',       'Módulo de otimização de acelerador plug-and-play',               'Chip',       290.00, false),
  ('CHIP-002','Chip Diesel EGR Off',   'Desativação eletrônica de EGR por software',                    'Chip',       320.00, true),
  ('DIAG-001','Diagnóstico Completo',  'Leitura e interpretação de todas as centralinas do veículo',    'Diagnóstico', 80.00, false),
  ('DIAG-002','Leitura de Falhas',     'Leitura e limpeza de códigos de falha OBD2',                   'Diagnóstico', 50.00, false),
  ('PERF-001','Flexfuel Conversion',   'Mapa para uso de etanol/gasolina com sensor de flex',           'Performance', 520.00, true),
  ('PERF-002','Launch Control',        'Ativação de sistema de largada controlada',                     'Performance', 180.00, true),
  ('PERF-003','Pop & Bang',            'Ativação de detonações controladas no escape',                  'Performance', 150.00, true);
