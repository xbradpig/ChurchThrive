-- 관리자 인수인계·복구: ①재직 중 셀프 인수인계 ②퇴사 후 플랫폼 소유권 복구

-- 1) 담당자 목록 (관리자용 — 이메일 포함)
create or replace function list_church_staff()
returns table (user_id uuid, email text, role text, granted_at timestamptz)
language sql stable security definer set search_path = public as $$
  select cr.user_id, u.email::text, cr.role::text, cr.granted_at
  from church_roles cr join auth.users u on u.id = cr.user_id
  where cr.church_id = my_church_id()
    and exists (select 1 from church_roles me
                where me.church_id = my_church_id() and me.user_id = auth.uid() and me.role = 'superadmin')
  order by cr.role, cr.granted_at
$$;
grant execute on function list_church_staff to authenticated;

-- 2) 역할 부여 (이메일로 — 후임자가 먼저 가입해두면 됨)
create or replace function set_church_role_by_email(p_email text, p_role text)
returns void
language plpgsql security definer set search_path = public as $$
declare target uuid;
begin
  if my_role() is distinct from 'superadmin' then raise exception '교회 관리자만 가능합니다'; end if;
  if p_role not in ('member','dept_leader','checker','pastor','superadmin') then
    raise exception '잘못된 역할'; end if;
  select id into target from auth.users where lower(email) = lower(trim(p_email));
  if target is null then
    raise exception '해당 이메일의 계정이 없습니다. 후임자가 먼저 회원가입을 해야 합니다';
  end if;
  insert into church_roles (church_id, user_id, role, granted_by) values (my_church_id(), target, p_role::app_role, auth.uid())
    on conflict (church_id, user_id, role) do nothing;
  insert into active_church (user_id, church_id) values (target, my_church_id())
    on conflict (user_id) do nothing;
  insert into audit_log (actor_user_id, action, target_table, target_id, after_json, church_id)
  values (auth.uid(), 'role_grant', 'church_roles', target::text,
          jsonb_build_object('email', p_email, 'role', p_role), my_church_id());
end $$;
grant execute on function set_church_role_by_email to authenticated;

-- 3) 역할 회수 — 마지막 관리자 보호 (교회가 관리자 0명이 되는 것 방지)
create or replace function remove_church_role(p_user uuid, p_role text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if my_role() is distinct from 'superadmin' then raise exception '교회 관리자만 가능합니다'; end if;
  if p_role = 'superadmin' and
     (select count(*) from church_roles where church_id = my_church_id() and role = 'superadmin') <= 1 then
    raise exception '마지막 관리자는 해제할 수 없습니다. 먼저 다른 관리자를 임명해주세요';
  end if;
  delete from church_roles where church_id = my_church_id() and user_id = p_user and role = p_role::app_role;
  insert into audit_log (actor_user_id, action, target_table, target_id, after_json, church_id)
  values (auth.uid(), 'role_revoke', 'church_roles', p_user::text,
          jsonb_build_object('role', p_role), my_church_id());
end $$;
grant execute on function remove_church_role to authenticated;

-- 4) 플랫폼 소유권 복구 — 기존 관리자가 이미 떠난 경우 (신원 확인 후 운영자가 실행)
--    p_revoke_email: 떠난 관리자의 권한을 함께 회수 (선택)
create or replace function platform_transfer_admin(p_church uuid, p_new_email text, p_revoke_email text default null)
returns void
language plpgsql security definer set search_path = public as $$
declare new_uid uuid; old_uid uuid;
begin
  if not is_platform_admin() then raise exception '플랫폼 운영 권한이 없습니다'; end if;
  select id into new_uid from auth.users where lower(email) = lower(trim(p_new_email));
  if new_uid is null then raise exception '새 관리자 계정이 없습니다. 먼저 회원가입이 필요합니다'; end if;
  insert into church_roles (church_id, user_id, role, granted_by) values (p_church, new_uid, 'superadmin', auth.uid())
    on conflict (church_id, user_id, role) do nothing;
  insert into active_church (user_id, church_id) values (new_uid, p_church)
    on conflict (user_id) do update set church_id = p_church, updated_at = now();
  if p_revoke_email is not null then
    select id into old_uid from auth.users where lower(email) = lower(trim(p_revoke_email));
    if old_uid is not null then
      delete from church_roles where church_id = p_church and user_id = old_uid;
    end if;
  end if;
  insert into audit_log (actor_user_id, action, target_table, target_id, after_json)
  values (auth.uid(), 'platform_admin_transfer', 'church_roles', p_church::text,
          jsonb_build_object('new_admin', p_new_email, 'revoked', p_revoke_email));
end $$;
