CREATE TABLE IF NOT EXISTS attendances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL DEFAULT 'worship'
    CHECK (event_type IN ('worship', 'meeting', 'training', 'cell_group', 'other')),
  event_id UUID,
  event_date DATE NOT NULL,
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  check_method TEXT NOT NULL DEFAULT 'manual'
    CHECK (check_method IN ('manual', 'qr')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(church_id, member_id, event_type, event_date)
);

CREATE INDEX idx_attendances_church_date ON attendances(church_id, event_date DESC);
CREATE INDEX idx_attendances_member ON attendances(member_id);
