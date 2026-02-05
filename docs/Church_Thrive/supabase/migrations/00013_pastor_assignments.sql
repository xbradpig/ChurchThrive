CREATE TABLE IF NOT EXISTS pastor_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  pastor_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'expired')),
  accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pastor_assignments_church ON pastor_assignments(church_id);
CREATE INDEX idx_pastor_assignments_pastor ON pastor_assignments(pastor_id, status);
CREATE INDEX idx_pastor_assignments_member ON pastor_assignments(member_id, status);
