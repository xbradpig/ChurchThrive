CREATE TABLE IF NOT EXISTS note_feedbacks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sermon_note_id UUID NOT NULL REFERENCES sermon_notes(id) ON DELETE CASCADE,
  pastor_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES note_feedbacks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_note_feedbacks_note ON note_feedbacks(sermon_note_id);
CREATE INDEX idx_note_feedbacks_pastor ON note_feedbacks(pastor_id);
CREATE INDEX idx_note_feedbacks_parent ON note_feedbacks(parent_id);
