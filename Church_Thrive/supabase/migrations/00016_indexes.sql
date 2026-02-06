-- Chosung search index (trigram for partial matching)
CREATE INDEX IF NOT EXISTS idx_members_name_trgm ON members USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_members_chosung ON members(name_chosung);

-- Full-text search for sermons
CREATE INDEX IF NOT EXISTS idx_sermons_fts ON sermons USING gin(
  to_tsvector('simple', COALESCE(title, '') || ' ' || COALESCE(transcript, ''))
);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_members_church_role ON members(church_id, role);
CREATE INDEX IF NOT EXISTS idx_members_church_position ON members(church_id, position);
CREATE INDEX IF NOT EXISTS idx_members_church_name ON members(church_id, name);
CREATE INDEX IF NOT EXISTS idx_sermon_notes_church_created ON sermon_notes(church_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_church_created ON announcements(church_id, created_at DESC);
