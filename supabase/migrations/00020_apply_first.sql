-- 온보딩 재설계: "승인 먼저, 가입 나중"
-- 계정 없이 신청서 제출 → 플랫폼 승인 → 승인 메일의 링크로 계정 생성(관리자 자동 바인딩)

create table church_applications (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  denomination text not null,
  pastor_name text not null,
  contact_phone text not null,
  applicant_email text not null,          -- 승인 메일을 받을 주소 = 초대 계정
  address text,
  member_size text,
  intro text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  review_note text,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  church_id uuid references churches(id),  -- 승인 시 생성된 교회
  created_at timestamptz not null default now()
);
alter table church_applications enable row level security;
grant select on church_applications to authenticated;
grant all on church_applications to service_role;
create policy ca_platform on church_applications for select to authenticated
  using (is_platform_admin());

-- 신청 큐 조회 (플랫폼)
create or replace function platform_pending_applications()
returns setof church_applications
language sql stable security definer set search_path = public as $$
  select * from church_applications where status = 'pending' and is_platform_admin()
  order by created_at
$$;
grant execute on function platform_pending_applications to authenticated;

-- 승인 처리 (플랫폼): 교회를 active로 생성·시드. 관리자 바인딩·메일은 웹 라우트(service)가 수행
create or replace function approve_application(p_app uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare a church_applications; cid uuid;
begin
  if not is_platform_admin() then raise exception '플랫폼 운영 권한이 없습니다'; end if;
  select * into a from church_applications where id = p_app and status = 'pending';
  if a.id is null then raise exception '대기 중인 신청이 아닙니다'; end if;
  if exists (select 1 from churches where slug = a.slug) then
    raise exception '이미 사용 중인 주소(slug)입니다 — 신청자와 조정 필요';
  end if;
  insert into churches (name, slug, status, denomination, pastor_name, contact_phone,
                        address, member_size, intro, reviewed_by, reviewed_at)
  values (a.name, a.slug, 'active', a.denomination, a.pastor_name, a.contact_phone,
          a.address, a.member_size, a.intro, auth.uid(), now())
  returning id into cid;
  insert into events (church_id, name, category, schedule_rule, sort_order) values
    (cid, '주일예배', 'worship', '{"dow":[0],"start":"09:00","end":"13:30"}', 1),
    (cid, '수요예배', 'worship', '{"dow":[3],"start":"19:00","end":"21:30"}', 2),
    (cid, '방문', 'visit', null, 9);
  insert into departments (church_id, name, sort_order) values
    (cid, '남선교회', 1), (cid, '여선교회', 2), (cid, '청년부', 3);
  insert into field_permissions (church_id, role_scope, fgroup, allowed)
    select cid, 'dept_leader', g, (g = 'attendance') from unnest(enum_range(null::field_group)) g;
  insert into church_modules (church_id, module) values (cid, 'attendance');
  update church_applications set status = 'approved', church_id = cid,
    reviewed_by = auth.uid(), reviewed_at = now() where id = p_app;
  insert into audit_log (actor_user_id, action, target_table, target_id, after_json, church_id)
  values (auth.uid(), 'application_approve', 'church_applications', p_app::text,
          jsonb_build_object('church', a.name, 'email', a.applicant_email), cid);
  return jsonb_build_object('church_id', cid, 'email', a.applicant_email, 'church_name', a.name);
end $$;

create or replace function reject_application(p_app uuid, p_note text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_platform_admin() then raise exception '플랫폼 운영 권한이 없습니다'; end if;
  update church_applications set status = 'rejected', review_note = p_note,
    reviewed_by = auth.uid(), reviewed_at = now() where id = p_app and status = 'pending';
  insert into audit_log (actor_user_id, action, target_table, target_id, after_json)
  values (auth.uid(), 'application_reject', 'church_applications', p_app::text,
          jsonb_build_object('note', p_note));
end $$;
grant execute on function reject_application to authenticated;

-- 스태프 역할 = 인증된 개인 계정 한정 (제안 ③)
-- 가상 초대 계정(@invite.*)·이메일 미확인 계정에는 교역자/담당자/관리자 부여 불가
create or replace function set_church_role_by_email(p_email text, p_role text)
returns void
language plpgsql security definer set search_path = public as $$
declare target uuid; confirmed timestamptz;
begin
  if my_role() is distinct from 'superadmin' then raise exception '교회 관리자만 가능합니다'; end if;
  if p_role not in ('member','dept_leader','checker','pastor','superadmin') then
    raise exception '잘못된 역할'; end if;
  select id, email_confirmed_at into target, confirmed
    from auth.users where lower(email) = lower(trim(p_email));
  if target is null then
    raise exception '해당 이메일의 계정이 없습니다. 후임자가 먼저 회원가입을 해야 합니다';
  end if;
  if p_role <> 'member' then
    if lower(p_email) like '%@invite.%' then
      raise exception '초대 간편 계정에는 담당자 역할을 부여할 수 없습니다. 본인 이메일로 가입한 계정이 필요합니다';
    end if;
    if confirmed is null then
      raise exception '이메일 인증이 완료되지 않은 계정입니다. 본인 인증(메일 확인) 후 부여할 수 있습니다';
    end if;
  end if;
  insert into church_roles (church_id, user_id, role, granted_by)
  values (my_church_id(), target, p_role::app_role, auth.uid())
    on conflict (church_id, user_id, role) do nothing;
  insert into active_church (user_id, church_id) values (target, my_church_id())
    on conflict (user_id) do nothing;
  insert into audit_log (actor_user_id, action, target_table, target_id, after_json, church_id)
  values (auth.uid(), 'role_grant', 'church_roles', target::text,
          jsonb_build_object('email', p_email, 'role', p_role), my_church_id());
end $$;
