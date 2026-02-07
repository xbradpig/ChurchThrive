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
    -- Self-update restricted: cannot change role, position, status, cell_group_id
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
-- Members see own notes; pastors see assigned members' notes
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

-- Members can create/update own notes
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
-- Users can see own requests; admins can see all for their church
CREATE POLICY "access_requests_select" ON access_requests
  FOR SELECT USING (
    user_id = auth.uid()
    OR (church_id = get_my_church_id() AND get_my_role() IN ('admin', 'pastor'))
  );

-- Anyone can create a request
CREATE POLICY "access_requests_insert" ON access_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Admins can update requests
CREATE POLICY "access_requests_update" ON access_requests
  FOR UPDATE USING (
    church_id = get_my_church_id()
    AND get_my_role() IN ('admin', 'pastor')
  );
