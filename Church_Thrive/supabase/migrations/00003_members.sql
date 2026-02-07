CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  name_chosung TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  birth_date DATE,
  gender TEXT CHECK (gender IN ('male', 'female')),
  baptism_date DATE,
  position TEXT CHECK (position IN ('elder', 'ordained_deacon', 'deacon', 'saint')),
  cell_group_id UUID,
  role TEXT NOT NULL DEFAULT 'member'
    CHECK (role IN ('admin', 'pastor', 'staff', 'leader', 'member')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'inactive', 'transferred')),
  photo_url TEXT,
  joined_at DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_members_church_id ON members(church_id);
CREATE INDEX idx_members_user_id ON members(user_id);
CREATE INDEX idx_members_phone ON members(phone);
CREATE INDEX idx_members_status ON members(church_id, status);
CREATE UNIQUE INDEX idx_members_church_user ON members(church_id, user_id) WHERE user_id IS NOT NULL;
