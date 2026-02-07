CREATE TABLE IF NOT EXISTS sermon_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  sermon_id UUID REFERENCES sermons(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content JSONB DEFAULT '[]',
  audio_url TEXT,
  highlights JSONB,
  is_shared BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sermon_notes_church_member ON sermon_notes(church_id, member_id);
CREATE INDEX idx_sermon_notes_sermon ON sermon_notes(sermon_id);
CREATE INDEX idx_sermon_notes_created ON sermon_notes(member_id, created_at DESC);
