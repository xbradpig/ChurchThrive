-- RLS: 행 수준 = 정책, 항목(열) 수준 = 컬럼 GRANT + RPC 2중 게이트
-- 원칙: members에 DELETE 정책을 만들지 않는다 (전면 차단)

-- 헬퍼: 내 역할 / 내 member_id / 내가 담당(승인)된 부서
create or replace function my_role() returns app_role
language sql stable security definer set search_path = public as $$
  select coalesce((select role from user_roles where user_id = auth.uid()), 'member'::app_role)
$$;

create or replace function my_member_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from members where user_id = auth.uid()
$$;

create or replace function my_led_departments() returns setof uuid
language sql stable security definer set search_path = public as $$
  select dl.department_id from department_leaders dl
  where dl.member_id = my_member_id() and dl.status = 'approved'
$$;

create or replace function is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select my_role() in ('superadmin','pastor','dept_leader','checker')
$$;

-- ===== 컬럼 수준: 기본(안전) 컬럼만 authenticated에 공개 =====
revoke all on all tables in schema public from anon, authenticated;

grant select (id, name, name_suffix, photo_url, position, member_type, status, care_target, created_at)
  on members to authenticated;
grant select on departments, department_members, events to authenticated;
grant select on attendances, department_leaders, field_permissions to authenticated;
grant select, insert, update on member_consents to authenticated;
grant select, insert, update, delete on push_subscriptions, notification_settings to authenticated;
grant select on member_qr_tokens to authenticated;   -- 행은 RLS로 본인만
grant select on devices to authenticated;            -- 행은 RLS로 본인만
grant insert, delete on attendances to authenticated; -- 행은 RLS로 staff만
grant update (approved, method, checked_by, note) on attendances to authenticated;
grant insert, update on department_leaders to authenticated;
grant update (allowed, approved_by, updated_at) on field_permissions to authenticated;
grant insert, update on events to authenticated;
grant insert on departments to authenticated;

-- ===== RLS =====
alter table members enable row level security;
alter table departments enable row level security;
alter table department_members enable row level security;
alter table department_leaders enable row level security;
alter table user_roles enable row level security;
alter table events enable row level security;
alter table attendances enable row level security;
alter table devices enable row level security;
alter table presence_events enable row level security;
alter table member_qr_tokens enable row level security;
alter table field_permissions enable row level security;
alter table member_consents enable row level security;
alter table audit_log enable row level security;
alter table push_subscriptions enable row level security;
alter table notification_settings enable row level security;

-- members: 행 범위 (열은 위 GRANT로 이미 제한)
create policy members_select on members for select to authenticated using (
  case my_role()
    when 'superadmin' then true
    when 'pastor' then true
    when 'checker' then true                                   -- 출석 체크용 전체 명단(기본 컬럼만)
    when 'dept_leader' then id = my_member_id()
      or exists (select 1 from department_members dm
                 where dm.member_id = members.id
                   and dm.department_id in (select my_led_departments()))
    else id = my_member_id()                                    -- member: 본인 행만
  end
);
-- INSERT는 RPC(quick_register, 이관)만 — service role 경유. UPDATE는 RPC update_my_card / staff RPC만.
-- DELETE 정책 없음 → 삭제 불가.

create policy departments_select on departments for select to authenticated using (true);
create policy departments_insert on departments for insert to authenticated
  with check (my_role() in ('superadmin','pastor'));

create policy dept_members_select on department_members for select to authenticated using (true);

create policy dept_leaders_select on department_leaders for select to authenticated using (is_staff());
create policy dept_leaders_apply on department_leaders for insert to authenticated
  with check (member_id = my_member_id() or my_role() in ('superadmin','pastor'));
create policy dept_leaders_approve on department_leaders for update to authenticated
  using (my_role() = 'superadmin') with check (my_role() = 'superadmin');

create policy events_select on events for select to authenticated using (true);
create policy events_write on events for insert to authenticated
  with check (my_role() in ('superadmin','pastor'));
create policy events_update on events for update to authenticated
  using (my_role() in ('superadmin','pastor'));

-- attendances: member는 본인 것 조회, staff는 범위 내 조회/기록
create policy att_select on attendances for select to authenticated using (
  case my_role()
    when 'superadmin' then true when 'pastor' then true when 'checker' then true
    when 'dept_leader' then member_id = my_member_id()
      or exists (select 1 from department_members dm
                 where dm.member_id = attendances.member_id
                   and dm.department_id in (select my_led_departments()))
    else member_id = my_member_id()
  end
);
create policy att_insert on attendances for insert to authenticated
  with check (is_staff() or (method = 'self' and member_id = my_member_id()));
create policy att_update on attendances for update to authenticated
  using (is_staff());
create policy att_delete on attendances for delete to authenticated
  using (is_staff());

create policy devices_select on devices for select to authenticated
  using (member_id = my_member_id() or my_role() in ('superadmin','pastor'));

create policy qr_select on member_qr_tokens for select to authenticated
  using (member_id = my_member_id() or my_role() in ('superadmin','pastor'));

create policy fperm_select on field_permissions for select to authenticated using (true);
create policy fperm_update on field_permissions for update to authenticated
  using (my_role() in ('superadmin','pastor')) with check (my_role() in ('superadmin','pastor'));

-- 동의: 본인만 관리
create policy consents_select on member_consents for select to authenticated
  using (member_id = my_member_id() or my_role() in ('superadmin','pastor'));
create policy consents_write on member_consents for insert to authenticated
  with check (member_id = my_member_id());
create policy consents_update on member_consents for update to authenticated
  using (member_id = my_member_id());

create policy push_own on push_subscriptions for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy notif_own on notification_settings for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- audit_log: 교역자 이상 열람 전용
grant select on audit_log to authenticated;
create policy audit_select on audit_log for select to authenticated
  using (my_role() in ('superadmin','pastor'));

-- user_roles: 본인 역할 조회 + 수퍼관리자 관리
grant select on user_roles to authenticated;
grant insert, update on user_roles to authenticated;
create policy roles_select on user_roles for select to authenticated
  using (user_id = auth.uid() or my_role() in ('superadmin','pastor'));
create policy roles_admin_ins on user_roles for insert to authenticated
  with check (my_role() = 'superadmin');
create policy roles_admin_upd on user_roles for update to authenticated
  using (my_role() = 'superadmin');
