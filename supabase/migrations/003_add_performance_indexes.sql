-- ============================================================
-- Performance indexes for common dashboard and list queries
-- ============================================================

-- Speeds up auth/franchisee lookups and RLS checks that depend on user_id.
CREATE INDEX IF NOT EXISTS idx_franchisees_user_id ON franchisees(user_id);

-- Speeds up list + filter by franchisee with recent-first ordering.
CREATE INDEX IF NOT EXISTS idx_orders_franchisee_created_at ON orders(franchisee_id, created_at DESC);

-- Speeds up admin status filters ordered by most recent.
CREATE INDEX IF NOT EXISTS idx_orders_status_created_at ON orders(status, created_at DESC);

-- Speeds up order files retrieval in detail screens.
CREATE INDEX IF NOT EXISTS idx_order_files_order_created_at ON order_files(order_id, created_at DESC);

-- Speeds up financial timeline queries by franchisee.
CREATE INDEX IF NOT EXISTS idx_financial_franchisee_created_at ON financial_records(franchisee_id, created_at DESC);

-- Speeds up active announcement fetch ordered by latest update.
CREATE INDEX IF NOT EXISTS idx_announcements_active_updated_at ON announcements(active, updated_at DESC);
