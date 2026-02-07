-- Migration: Add superadmin role to members table
-- Description: Adds 'superadmin' to the role CHECK constraint for system-level administration

-- Step 1: Drop the existing CHECK constraint on role column
ALTER TABLE members DROP CONSTRAINT IF EXISTS members_role_check;

-- Step 2: Add the new CHECK constraint with superadmin included
ALTER TABLE members ADD CONSTRAINT members_role_check
  CHECK (role IN ('superadmin', 'admin', 'pastor', 'staff', 'leader', 'member'));

-- Note: To promote an existing user to superadmin, run:
-- UPDATE members SET role = 'superadmin' WHERE id = '<member-id>';
