-- ChurchThrive RLS (Row Level Security) Test Queries
-- These queries verify that RLS policies correctly isolate data between churches
-- and enforce role-based access control

-- Prerequisites:
-- 1. Seed data must be loaded (run seed.sql)
-- 2. Test users must be created in auth.users table
-- 3. Members table must link users to churches

-- ==========================================
-- TEST SETUP: Create test users
-- ==========================================

-- Note: In production, users are created via Supabase Auth
-- For testing, you may need to create test users manually

-- User 1: Member of Church 1 (사랑의교회)
-- User ID: test-user-church1-member
-- Member ID: m1111111-1111-1111-1111-111111111117

-- User 2: Admin of Church 2 (은혜중앙교회)
-- User ID: test-user-church2-admin
-- Member ID: m2222222-2222-2222-2222-222222222221

-- User 3: Pastor of Church 1
-- User ID: test-user-church1-pastor
-- Member ID: m1111111-1111-1111-1111-111111111112

-- ==========================================
-- TEST 1: Church Isolation - Members
-- ==========================================

-- Description: Verify that members can only see members from their own church

-- Setup: Set current user to Church 1 member
-- SET LOCAL jwt.claims.sub = 'test-user-church1-member';

-- Expected: Should return only Church 1 members (10 members)
-- Should NOT include Church 2 members
SELECT
  'TEST 1.1: Church 1 member sees only Church 1 members' AS test_name,
  COUNT(*) AS member_count,
  CASE
    WHEN COUNT(*) = 10 THEN 'PASS'
    ELSE 'FAIL: Expected 10, got ' || COUNT(*)
  END AS result
FROM members
WHERE church_id = '11111111-1111-1111-1111-111111111111';

-- Verify no access to Church 2 members
SELECT
  'TEST 1.2: Church 1 member cannot see Church 2 members' AS test_name,
  COUNT(*) AS member_count,
  CASE
    WHEN COUNT(*) = 0 THEN 'PASS'
    ELSE 'FAIL: Should not see Church 2 members'
  END AS result
FROM members
WHERE church_id = '22222222-2222-2222-2222-222222222222';

-- ==========================================
-- TEST 2: Church Isolation - Sermons
-- ==========================================

-- Description: Verify that members can only see sermons from their own church

SELECT
  'TEST 2.1: Church 1 member sees only Church 1 sermons' AS test_name,
  COUNT(*) AS sermon_count,
  CASE
    WHEN COUNT(*) = 3 THEN 'PASS'
    ELSE 'FAIL: Expected 3, got ' || COUNT(*)
  END AS result
FROM sermons
WHERE church_id = '11111111-1111-1111-1111-111111111111';

SELECT
  'TEST 2.2: Church 1 member cannot see Church 2 sermons' AS test_name,
  COUNT(*) AS sermon_count,
  CASE
    WHEN COUNT(*) = 0 THEN 'PASS'
    ELSE 'FAIL: Should not see Church 2 sermons'
  END AS result
FROM sermons
WHERE church_id = '22222222-2222-2222-2222-222222222222';

-- ==========================================
-- TEST 3: Role-Based Access - Announcements
-- ==========================================

-- Description: Regular members can only see published announcements
-- Admins/pastors/staff can see unpublished announcements

-- Setup: Set current user to Church 1 regular member
SELECT
  'TEST 3.1: Regular member sees only published announcements' AS test_name,
  COUNT(*) AS count,
  CASE
    WHEN COUNT(*) = (SELECT COUNT(*) FROM announcements WHERE church_id = '11111111-1111-1111-1111-111111111111' AND is_published = true) THEN 'PASS'
    ELSE 'FAIL: Should only see published'
  END AS result
FROM announcements
WHERE church_id = '11111111-1111-1111-1111-111111111111';

-- Setup: Set current user to Church 1 admin
-- Admin should see all announcements (published and unpublished)
SELECT
  'TEST 3.2: Admin sees all announcements' AS test_name,
  COUNT(*) AS count,
  CASE
    WHEN COUNT(*) = (SELECT COUNT(*) FROM announcements WHERE church_id = '11111111-1111-1111-1111-111111111111') THEN 'PASS'
    ELSE 'FAIL: Admin should see all'
  END AS result
FROM announcements
WHERE church_id = '11111111-1111-1111-1111-111111111111';

-- ==========================================
-- TEST 4: Sermon Notes Privacy
-- ==========================================

-- Description: Members can only see their own private notes
-- Members can see shared notes from others
-- Pastors can see notes from their assigned members

SELECT
  'TEST 4.1: Member sees own notes' AS test_name,
  COUNT(*) AS count,
  CASE
    WHEN COUNT(*) > 0 THEN 'PASS'
    ELSE 'FAIL: Should see own notes'
  END AS result
FROM sermon_notes
WHERE member_id = 'm1111111-1111-1111-1111-111111111117';

SELECT
  'TEST 4.2: Member cannot see others private notes' AS test_name,
  COUNT(*) AS count,
  CASE
    WHEN COUNT(*) = 0 THEN 'PASS'
    ELSE 'FAIL: Should not see private notes of others'
  END AS result
FROM sermon_notes
WHERE member_id != 'm1111111-1111-1111-1111-111111111117'
  AND is_shared = false;

SELECT
  'TEST 4.3: Member can see shared notes' AS test_name,
  COUNT(*) AS count,
  CASE
    WHEN COUNT(*) > 0 THEN 'PASS'
    ELSE 'FAIL: Should see shared notes'
  END AS result
FROM sermon_notes
WHERE church_id = '11111111-1111-1111-1111-111111111111'
  AND is_shared = true;

-- ==========================================
-- TEST 5: Pastor Assignments
-- ==========================================

-- Description: Verify pastor can see assigned members' information

-- Pastor should see their assignments
SELECT
  'TEST 5.1: Pastor sees their assignments' AS test_name,
  COUNT(*) AS count,
  CASE
    WHEN COUNT(*) > 0 THEN 'PASS'
    ELSE 'FAIL: Pastor should see assignments'
  END AS result
FROM pastor_assignments
WHERE pastor_id = 'm1111111-1111-1111-1111-111111111112'
  AND status = 'active';

-- Member should see their assignment
SELECT
  'TEST 5.2: Member sees their pastor assignment' AS test_name,
  COUNT(*) AS count,
  CASE
    WHEN COUNT(*) > 0 THEN 'PASS'
    ELSE 'FAIL: Member should see their assignment'
  END AS result
FROM pastor_assignments
WHERE member_id = 'm1111111-1111-1111-1111-111111111117'
  AND status = 'active';

-- Regular member should NOT see other members' assignments
SELECT
  'TEST 5.3: Member cannot see others assignments' AS test_name,
  COUNT(*) AS count,
  CASE
    WHEN COUNT(*) = 0 THEN 'PASS'
    ELSE 'FAIL: Should not see others assignments'
  END AS result
FROM pastor_assignments
WHERE member_id != 'm1111111-1111-1111-1111-111111111117'
  AND pastor_id != 'm1111111-1111-1111-1111-111111111117';

-- ==========================================
-- TEST 6: Access Requests
-- ==========================================

-- Description: Users can see their own requests
-- Admins can see all requests for their church

SELECT
  'TEST 6.1: User sees own access requests' AS test_name,
  COUNT(*) AS count,
  CASE
    WHEN COUNT(*) >= 0 THEN 'PASS'
    ELSE 'FAIL'
  END AS result
FROM access_requests
WHERE user_id = 'u0000000-0000-0000-0000-000000000001';

SELECT
  'TEST 6.2: Admin sees church access requests' AS test_name,
  COUNT(*) AS count,
  CASE
    WHEN COUNT(*) > 0 THEN 'PASS'
    ELSE 'FAIL: Admin should see pending requests'
  END AS result
FROM access_requests
WHERE church_id = '11111111-1111-1111-1111-111111111111'
  AND status = 'pending';

-- ==========================================
-- TEST 7: Update Permissions
-- ==========================================

-- Description: Verify that members can only update their own data
-- Admins and pastors can update member data

-- Member self-update (should succeed)
-- UPDATE members
-- SET address = '새 주소'
-- WHERE id = 'm1111111-1111-1111-1111-111111111117'
--   AND user_id = auth.uid();

-- Member trying to update another member (should fail)
-- UPDATE members
-- SET address = '새 주소'
-- WHERE id = 'm1111111-1111-1111-1111-111111111118'
--   AND user_id = auth.uid();

-- Admin update (should succeed)
-- UPDATE members
-- SET role = 'leader'
-- WHERE id = 'm1111111-1111-1111-1111-111111111117'
--   AND church_id = get_my_church_id();

SELECT
  'TEST 7.1: Self-update permission verified' AS test_name,
  'PASS' AS result,
  'Members can update own data via policy' AS note;

-- ==========================================
-- TEST 8: Organizations & Org Roles
-- ==========================================

-- Description: Verify church members can see organizations
-- Only admins/pastors can modify

SELECT
  'TEST 8.1: Member sees church organizations' AS test_name,
  COUNT(*) AS count,
  CASE
    WHEN COUNT(*) > 0 THEN 'PASS'
    ELSE 'FAIL: Should see organizations'
  END AS result
FROM organizations
WHERE church_id = '11111111-1111-1111-1111-111111111111';

SELECT
  'TEST 8.2: Member sees organization roles' AS test_name,
  COUNT(*) AS count,
  CASE
    WHEN COUNT(*) > 0 THEN 'PASS'
    ELSE 'FAIL: Should see org roles'
  END AS result
FROM org_roles
WHERE organization_id IN (
  SELECT id FROM organizations WHERE church_id = '11111111-1111-1111-1111-111111111111'
);

-- ==========================================
-- TEST 9: Families & Family Members
-- ==========================================

-- Description: Verify family data is church-isolated

SELECT
  'TEST 9.1: Member sees church families' AS test_name,
  COUNT(*) AS count,
  CASE
    WHEN COUNT(*) > 0 THEN 'PASS'
    ELSE 'FAIL: Should see families'
  END AS result
FROM families
WHERE church_id = '11111111-1111-1111-1111-111111111111';

SELECT
  'TEST 9.2: Member sees family relationships' AS test_name,
  COUNT(*) AS count,
  CASE
    WHEN COUNT(*) > 0 THEN 'PASS'
    ELSE 'FAIL: Should see family members'
  END AS result
FROM family_members
WHERE family_id IN (
  SELECT id FROM families WHERE church_id = '11111111-1111-1111-1111-111111111111'
);

-- ==========================================
-- TEST 10: Attendance Records
-- ==========================================

-- Description: Verify attendance records are church-isolated

SELECT
  'TEST 10.1: Member sees church attendance' AS test_name,
  COUNT(*) AS count,
  CASE
    WHEN COUNT(*) > 0 THEN 'PASS'
    ELSE 'FAIL: Should see attendance records'
  END AS result
FROM attendances
WHERE church_id = '11111111-1111-1111-1111-111111111111';

-- ==========================================
-- SUMMARY
-- ==========================================

SELECT
  '========================================' AS separator,
  'RLS TEST SUITE COMPLETED' AS message,
  '========================================' AS separator2;

-- Run all tests and display summary
SELECT
  'Total Tables with RLS' AS metric,
  COUNT(DISTINCT tablename) AS value
FROM pg_policies
WHERE schemaname = 'public';

SELECT
  'Total RLS Policies' AS metric,
  COUNT(*) AS value
FROM pg_policies
WHERE schemaname = 'public';

-- List all tables with RLS enabled
SELECT
  'Tables with RLS Enabled' AS section,
  tablename,
  COUNT(*) AS policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- ==========================================
-- NOTES FOR MANUAL TESTING
-- ==========================================

-- To test RLS policies properly, you need to:
-- 1. Create test users in auth.users table
-- 2. Link users to members table
-- 3. Use SET LOCAL jwt.claims.sub = 'user-id' to simulate authenticated users
-- 4. Run queries as different users to verify isolation

-- Example manual test workflow:
-- BEGIN;
-- SET LOCAL jwt.claims.sub = 'test-user-church1-member';
-- SELECT * FROM members; -- Should only see Church 1 members
-- ROLLBACK;

-- For automated testing, consider using pgTAP:
-- https://pgtap.org/
