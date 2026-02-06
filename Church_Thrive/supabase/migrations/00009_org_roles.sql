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

CREATE INDEX idx_org_roles_organization ON org_roles(organization_id);
CREATE INDEX idx_org_roles_member ON org_roles(member_id);
