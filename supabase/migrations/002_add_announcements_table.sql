-- ============================================================
-- Announcement board table
-- ============================================================

CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL DEFAULT 'Aviso Geral',
  body TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_announcements_updated
  BEFORE UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage announcements"
  ON announcements
  FOR ALL
  USING (current_role_is('admin'))
  WITH CHECK (current_role_is('admin'));

CREATE POLICY "Public can read active announcements"
  ON announcements
  FOR SELECT
  USING (active = true OR current_role_is('admin'));
