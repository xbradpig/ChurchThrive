CREATE TABLE IF NOT EXISTS cell_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  leader_id UUID REFERENCES members(id) ON DELETE SET NULL,
  description TEXT,
  meeting_day TEXT,
  meeting_time TEXT,
  meeting_place TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cell_groups_church ON cell_groups(church_id);
CREATE INDEX idx_cell_groups_leader ON cell_groups(leader_id);

-- Add FK from members to cell_groups (after cell_groups table exists)
ALTER TABLE members
  ADD CONSTRAINT fk_members_cell_group
  FOREIGN KEY (cell_group_id) REFERENCES cell_groups(id) ON DELETE SET NULL;
