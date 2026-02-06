-- 00018_church_creation_policy.sql
-- 회원가입 시 교회 생성을 위한 RLS 정책 추가

-- ===== CHURCHES INSERT POLICY =====
-- 인증된 사용자는 새 교회를 생성할 수 있음
-- (회원가입 플로우에서 검색 결과 없을 때 교회 직접 등록용)
CREATE POLICY "churches_insert" ON churches
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ===== MEMBERS SELF-INSERT POLICY =====
-- 사용자가 새 교회 생성 시 자신을 admin으로 등록할 수 있음
-- 기존 members_insert 정책은 이미 교회에 소속된 관리자만 추가 가능
-- 새 교회 생성 시에는 아직 소속 교회가 없으므로 별도 정책 필요
CREATE POLICY "members_insert_church_creator" ON members
  FOR INSERT WITH CHECK (
    -- 본인 계정으로만 등록 가능
    user_id = auth.uid()
    -- 아직 어떤 교회에도 active 상태로 소속되지 않은 경우
    AND NOT EXISTS (
      SELECT 1 FROM members m
      WHERE m.user_id = auth.uid()
      AND m.status = 'active'
    )
    -- admin 역할로 등록 (새 교회 생성자)
    AND role = 'admin'
    AND status = 'active'
  );

-- ===== COMMENT =====
COMMENT ON POLICY "churches_insert" ON churches IS
  '인증된 사용자가 새 교회를 등록할 수 있음 (회원가입 플로우)';

COMMENT ON POLICY "members_insert_church_creator" ON members IS
  '새 교회 생성 시 생성자가 자신을 admin으로 등록할 수 있음';
