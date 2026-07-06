-- field_visible 테넌트 가드: 교회 2개 이상일 때 다중 행 오류 + 타 교회 승인 설정 오염 방지
-- (다교회 상태에서 verify-e2e B게이트 4건 실패로 발견 — 00009 계열 마지막 DEFINER 구멍)
create or replace function field_visible(p_member uuid, p_group field_group) returns boolean
language sql stable security definer set search_path = public as $$
  select case
    when my_role() in ('superadmin','pastor') then true
    when my_role() = 'member' and p_member = my_member_id() then true
    when p_group = 'attendance' and is_staff() then true
    when my_role() = 'dept_leader' then
      coalesce((select allowed from field_permissions
                where church_id = my_church_id()                 -- 테넌트 가드
                  and role_scope = 'dept_leader' and fgroup = p_group), false)
      and coalesce((select granted from member_consents
                    where member_id = p_member and fgroup = p_group), false)
    else false
  end
$$;
