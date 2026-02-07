CREATE TABLE IF NOT EXISTS sermons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  preacher_id UUID REFERENCES members(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  bible_verses TEXT[],
  sermon_date DATE NOT NULL,
  service_type TEXT NOT NULL DEFAULT 'sunday_morning'
    CHECK (service_type IN ('sunday_morning', 'sunday_evening', 'wednesday', 'friday', 'dawn', 'special', 'other')),
  audio_url TEXT,
  transcript TEXT,
  stt_status TEXT CHECK (stt_status IN ('pending', 'processing', 'completed', 'failed')),
  tags TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sermons_church_id ON sermons(church_id);
CREATE INDEX idx_sermons_date ON sermons(church_id, sermon_date DESC);
CREATE INDEX idx_sermons_preacher ON sermons(preacher_id);
