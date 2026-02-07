-- =============================================
-- ChurchThrive Full Database Schema
-- Supabase SQL Editor에서 한 번에 실행
-- =============================================

-- 00001: Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 00002: Churches
CREATE TABLE IF NOT EXISTS churches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  denomination TEXT,
  address TEXT,
  phone TEXT,
  senior_pastor TEXT,
  founded_year INTEGER,
  member_count INTEGER DEFAULT 0,
  subscription_tier TEXT NOT NULL DEFAULT 'free'
    CHECK (subscription_tier IN ('free', 'basic', 'standard', 'premium')),
  subdomain TEXT UNIQUE,
  custom_domain TEXT UNIQUE,
  logo_url TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_churches_name ON churches(name);
CREATE INDEX IF NOT EXISTS idx_churches_subdomain ON churches(subdomain);

-- 00003: Members
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

CREATE INDEX IF NOT EXISTS idx_members_church_id ON members(church_id);
CREATE INDEX IF NOT EXISTS idx_members_user_id ON members(user_id);
CREATE INDEX IF NOT EXISTS idx_members_phone ON members(phone);
CREATE INDEX IF NOT EXISTS idx_members_status ON members(church_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_members_church_user ON members(church_id, user_id) WHERE user_id IS NOT NULL;

-- 00004: Families
CREATE TABLE IF NOT EXISTS families (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  family_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS family_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  relationship TEXT NOT NULL DEFAULT 'other'
    CHECK (relationship IN ('head', 'spouse', 'child', 'parent', 'sibling', 'other')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(family_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_families_church_id ON families(church_id);
CREATE INDEX IF NOT EXISTS idx_family_members_family_id ON family_members(family_id);
CREATE INDEX IF NOT EXISTS idx_family_members_member_id ON family_members(member_id);

-- 00005: Sermons
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

CREATE INDEX IF NOT EXISTS idx_sermons_church_id ON sermons(church_id);
CREATE INDEX IF NOT EXISTS idx_sermons_date ON sermons(church_id, sermon_date DESC);
CREATE INDEX IF NOT EXISTS idx_sermons_preacher ON sermons(preacher_id);

-- 00006: Sermon Notes
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

CREATE INDEX IF NOT EXISTS idx_sermon_notes_church_member ON sermon_notes(church_id, member_id);
CREATE INDEX IF NOT EXISTS idx_sermon_notes_sermon ON sermon_notes(sermon_id);
CREATE INDEX IF NOT EXISTS idx_sermon_notes_created ON sermon_notes(member_id, created_at DESC);

-- 00007: Note Feedbacks
CREATE TABLE IF NOT EXISTS note_feedbacks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sermon_note_id UUID NOT NULL REFERENCES sermon_notes(id) ON DELETE CASCADE,
  pastor_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES note_feedbacks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_note_feedbacks_note ON note_feedbacks(sermon_note_id);
CREATE INDEX IF NOT EXISTS idx_note_feedbacks_pastor ON note_feedbacks(pastor_id);
CREATE INDEX IF NOT EXISTS idx_note_feedbacks_parent ON note_feedbacks(parent_id);

-- 00008: Organizations
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('committee', 'department', 'group', 'team')),
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_organizations_church_id ON organizations(church_id);
CREATE INDEX IF NOT EXISTS idx_organizations_parent ON organizations(parent_id);

-- 00009: Org Roles
CREATE TABLE IF NOT EXISTS org_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('head', 'member', 'secretary')),
  permissions TEXT[] NOT NULL DEFAULT '{}',
  delegated_by UUID REFERENCES members(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_org_roles_organization ON org_roles(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_roles_member ON org_roles(member_id);

-- 00010: Announcements
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  target_groups TEXT[],
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcements_church ON announcements(church_id);
CREATE INDEX IF NOT EXISTS idx_announcements_published ON announcements(church_id, is_published, published_at DESC);

-- 00011: Attendances
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

CREATE INDEX IF NOT EXISTS idx_attendances_church_date ON attendances(church_id, event_date DESC);
CREATE INDEX IF NOT EXISTS idx_attendances_member ON attendances(member_id);

-- 00012: Cell Groups
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

CREATE INDEX IF NOT EXISTS idx_cell_groups_church ON cell_groups(church_id);
CREATE INDEX IF NOT EXISTS idx_cell_groups_leader ON cell_groups(leader_id);

-- Add FK from members to cell_groups (after cell_groups table exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_members_cell_group'
  ) THEN
    ALTER TABLE members
      ADD CONSTRAINT fk_members_cell_group
      FOREIGN KEY (cell_group_id) REFERENCES cell_groups(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 00013: Pastor Assignments
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

CREATE INDEX IF NOT EXISTS idx_pastor_assignments_church ON pastor_assignments(church_id);
CREATE INDEX IF NOT EXISTS idx_pastor_assignments_pastor ON pastor_assignments(pastor_id, status);
CREATE INDEX IF NOT EXISTS idx_pastor_assignments_member ON pastor_assignments(member_id, status);

-- 00014: Access Requests
CREATE TABLE IF NOT EXISTS access_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  responded_by UUID REFERENCES members(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_access_requests_church ON access_requests(church_id, status);
CREATE INDEX IF NOT EXISTS idx_access_requests_user ON access_requests(user_id);

-- =============================================
-- 00015: RLS Policies
-- =============================================

-- Enable RLS on all tables
ALTER TABLE churches ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE sermons ENABLE ROW LEVEL SECURITY;
ALTER TABLE sermon_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE cell_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE pastor_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user's church_id
CREATE OR REPLACE FUNCTION get_my_church_id()
RETURNS UUID AS $$
  SELECT church_id FROM members WHERE user_id = auth.uid() AND status = 'active' LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: get current user's member role
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM members WHERE user_id = auth.uid() AND status = 'active' LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: get current user's member id
CREATE OR REPLACE FUNCTION get_my_member_id()
RETURNS UUID AS $$
  SELECT id FROM members WHERE user_id = auth.uid() AND status = 'active' LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ===== CHURCHES =====
-- Anyone can read churches (for search during registration)
CREATE POLICY "churches_select" ON churches
  FOR SELECT USING (true);

-- Only admins can update their own church
CREATE POLICY "churches_update" ON churches
  FOR UPDATE USING (
    id = get_my_church_id() AND get_my_role() = 'admin'
  );

-- 인증된 사용자는 새 교회를 생성할 수 있음
CREATE POLICY "churches_insert" ON churches
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ===== MEMBERS =====
-- Members can see other members in their church
CREATE POLICY "members_select" ON members
  FOR SELECT USING (
    church_id = get_my_church_id()
  );

-- Admin/pastor/staff can insert members
CREATE POLICY "members_insert" ON members
  FOR INSERT WITH CHECK (
    church_id = get_my_church_id()
    AND get_my_role() IN ('admin', 'pastor', 'staff')
  );

-- 새 교회 생성자가 자신을 admin으로 등록할 수 있음
CREATE POLICY "members_insert_church_creator" ON members
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND NOT EXISTS (
      SELECT 1 FROM members m
      WHERE m.user_id = auth.uid()
      AND m.status = 'active'
    )
    AND role = 'admin'
    AND status = 'active'
  );

-- Admin/pastor can update any member; members can update own non-sensitive fields
CREATE POLICY "members_update_admin" ON members
  FOR UPDATE USING (
    church_id = get_my_church_id()
    AND get_my_role() IN ('admin', 'pastor')
  );

CREATE POLICY "members_update_self" ON members
  FOR UPDATE USING (
    user_id = auth.uid()
  ) WITH CHECK (
    user_id = auth.uid()
  );

-- Admin can delete members
CREATE POLICY "members_delete" ON members
  FOR DELETE USING (
    church_id = get_my_church_id()
    AND get_my_role() = 'admin'
  );

-- ===== FAMILIES =====
CREATE POLICY "families_church_isolation" ON families
  FOR ALL USING (church_id = get_my_church_id());

-- ===== FAMILY_MEMBERS =====
CREATE POLICY "family_members_select" ON family_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM families f
      WHERE f.id = family_members.family_id
      AND f.church_id = get_my_church_id()
    )
  );

CREATE POLICY "family_members_modify" ON family_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM families f
      WHERE f.id = family_members.family_id
      AND f.church_id = get_my_church_id()
    )
    AND get_my_role() IN ('admin', 'pastor', 'staff')
  );

-- ===== SERMONS =====
CREATE POLICY "sermons_church_isolation" ON sermons
  FOR SELECT USING (church_id = get_my_church_id());

CREATE POLICY "sermons_modify" ON sermons
  FOR ALL USING (
    church_id = get_my_church_id()
    AND get_my_role() IN ('admin', 'pastor', 'staff')
  );

-- ===== SERMON_NOTES =====
CREATE POLICY "sermon_notes_select_own" ON sermon_notes
  FOR SELECT USING (
    church_id = get_my_church_id()
    AND (
      member_id = get_my_member_id()
      OR is_shared = true
      OR EXISTS (
        SELECT 1 FROM pastor_assignments pa
        WHERE pa.pastor_id = get_my_member_id()
        AND pa.member_id = sermon_notes.member_id
        AND pa.status = 'active'
      )
      OR get_my_role() IN ('admin', 'pastor')
    )
  );

CREATE POLICY "sermon_notes_insert" ON sermon_notes
  FOR INSERT WITH CHECK (
    church_id = get_my_church_id()
    AND member_id = get_my_member_id()
  );

CREATE POLICY "sermon_notes_update" ON sermon_notes
  FOR UPDATE USING (
    church_id = get_my_church_id()
    AND member_id = get_my_member_id()
  );

CREATE POLICY "sermon_notes_delete" ON sermon_notes
  FOR DELETE USING (
    church_id = get_my_church_id()
    AND member_id = get_my_member_id()
  );

-- ===== NOTE_FEEDBACKS =====
CREATE POLICY "note_feedbacks_select" ON note_feedbacks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sermon_notes sn
      WHERE sn.id = note_feedbacks.sermon_note_id
      AND sn.church_id = get_my_church_id()
      AND (
        sn.member_id = get_my_member_id()
        OR note_feedbacks.pastor_id = get_my_member_id()
      )
    )
  );

CREATE POLICY "note_feedbacks_insert" ON note_feedbacks
  FOR INSERT WITH CHECK (
    pastor_id = get_my_member_id()
    AND get_my_role() IN ('admin', 'pastor')
  );

-- ===== ORGANIZATIONS =====
CREATE POLICY "organizations_church_isolation" ON organizations
  FOR SELECT USING (church_id = get_my_church_id());

CREATE POLICY "organizations_modify" ON organizations
  FOR ALL USING (
    church_id = get_my_church_id()
    AND get_my_role() IN ('admin', 'pastor')
  );

-- ===== ORG_ROLES =====
CREATE POLICY "org_roles_select" ON org_roles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organizations o
      WHERE o.id = org_roles.organization_id
      AND o.church_id = get_my_church_id()
    )
  );

CREATE POLICY "org_roles_modify" ON org_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM organizations o
      WHERE o.id = org_roles.organization_id
      AND o.church_id = get_my_church_id()
    )
    AND get_my_role() IN ('admin', 'pastor')
  );

-- ===== ANNOUNCEMENTS =====
CREATE POLICY "announcements_select" ON announcements
  FOR SELECT USING (
    church_id = get_my_church_id()
    AND (is_published = true OR get_my_role() IN ('admin', 'pastor', 'staff'))
  );

CREATE POLICY "announcements_modify" ON announcements
  FOR ALL USING (
    church_id = get_my_church_id()
    AND get_my_role() IN ('admin', 'pastor', 'staff')
  );

-- ===== ATTENDANCES =====
CREATE POLICY "attendances_select" ON attendances
  FOR SELECT USING (church_id = get_my_church_id());

CREATE POLICY "attendances_insert" ON attendances
  FOR INSERT WITH CHECK (
    church_id = get_my_church_id()
    AND (
      member_id = get_my_member_id()
      OR get_my_role() IN ('admin', 'pastor', 'staff', 'leader')
    )
  );

-- ===== CELL_GROUPS =====
CREATE POLICY "cell_groups_church_isolation" ON cell_groups
  FOR SELECT USING (church_id = get_my_church_id());

CREATE POLICY "cell_groups_modify" ON cell_groups
  FOR ALL USING (
    church_id = get_my_church_id()
    AND get_my_role() IN ('admin', 'pastor', 'staff')
  );

-- ===== PASTOR_ASSIGNMENTS =====
CREATE POLICY "pastor_assignments_select" ON pastor_assignments
  FOR SELECT USING (
    church_id = get_my_church_id()
    AND (
      pastor_id = get_my_member_id()
      OR member_id = get_my_member_id()
      OR get_my_role() = 'admin'
    )
  );

CREATE POLICY "pastor_assignments_modify" ON pastor_assignments
  FOR ALL USING (
    church_id = get_my_church_id()
    AND get_my_role() = 'admin'
  );

-- ===== ACCESS_REQUESTS =====
CREATE POLICY "access_requests_select" ON access_requests
  FOR SELECT USING (
    user_id = auth.uid()
    OR (church_id = get_my_church_id() AND get_my_role() IN ('admin', 'pastor'))
  );

CREATE POLICY "access_requests_insert" ON access_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "access_requests_update" ON access_requests
  FOR UPDATE USING (
    church_id = get_my_church_id()
    AND get_my_role() IN ('admin', 'pastor')
  );

-- =============================================
-- Done! Database schema created successfully.
-- =============================================
