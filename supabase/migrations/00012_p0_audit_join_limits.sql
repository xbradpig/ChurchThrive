-- P0 보강: ①감사 트리거 확대 ②교회 생성 한도 ③가입 신청→승인 플로우 ④플랫폼 콘솔 기반

-- ===== 1) 감사 로그: 권한·모듈·설정 변경 전부 기록 (identity §4 이행) =====
create or replace function tg_audit_generic() returns trigger
language plpgsql security definer set search_path = public as $$
declare cid uuid;
begin
  cid := coalesce(
    case when tg_op = 'DELETE' then null else (to_jsonb(new) ->> 'church_id')::uuid end,
    case when tg_op = 'DELETE' then (to_jsonb(old) ->> 'church_id')::uuid else null end);
  insert into audit_log (actor_user_id, action, target_table, target_id, before_json, after_json, church_id)
  values (auth.uid(), lower(tg_op), tg_table_name,
          coalesce((to_jsonb(new) ->> 'id'), (to_jsonb(old) ->> 'id'),
                   (to_jsonb(new) ->> 'user_id'), (to_jsonb(old) ->> 'user_id')),
          case when tg_op = 'INSERT' then null else to_jsonb(old) end,
          case when tg_op = 'DELETE' then null else to_jsonb(new) end,
          cid);
  return coalesce(new, old);
end $$;

create trigger audit_church_roles after insert or update or delete on church_roles
  for each row execute function tg_audit_generic();
create trigger audit_church_modules after insert or update or delete on church_modules
  for each row execute function tg_audit_generic();
create trigger audit_module_grants after insert or update or delete on module_grants
  for each row execute function tg_audit_generic();
create trigger audit_field_permissions after update on field_permissions
  for each row execute function tg_audit_generic();
create trigger audit_department_leaders after insert or update on department_leaders
  for each row execute function tg_audit_generic();

-- ===== 2) 교회 생성 한도 (남용 방지): 계정당 1개, 플랫폼 관리자는 예외 =====
create or replace function create_church(p_name text, p_slug text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare cid uuid;
begin
  if exists (select 1 from churches where slug = p_slug) then
    raise exception '이미 사용 중인 주소입니다';
  end if;
  if not exists (select 1 from platform_admins where user_id = auth.uid())
     and (select count(*) from churches where created_by = auth.uid()) >= 1 then
    raise exception '교회는 계정당 1개까지 만들 수 있습니다. 추가가 필요하면 플랫폼 운영팀에 문의해주세요';
  end if;
  insert into churches (name, slug, created_by) values (trim(p_name), p_slug, auth.uid())
    returning id into cid;
  insert into church_roles (church_id, user_id, role) values (cid, auth.uid(), 'superadmin');
  insert into active_church (user_id, church_id) values (auth.uid(), cid)
    on conflict (user_id) do update set church_id = cid, updated_at = now();
  insert into events (church_id, name, category, schedule_rule, sort_order) values
    (cid, '주일예배', 'worship', '{"dow":[0],"start":"09:00","end":"13:30"}', 1),
    (cid, '수요예배', 'worship', '{"dow":[3],"start":"19:00","end":"21:30"}', 2),
    (cid, '방문', 'visit', null, 9);
  insert into departments (church_id, name, sort_order) values
    (cid, '남선교회', 1), (cid, '여선교회', 2), (cid, '청년부', 3);
  insert into field_permissions (church_id, role_scope, fgroup, allowed)
    select cid, 'dept_leader', g, (g = 'attendance')
    from unnest(enum_range(null::field_group)) g;
  insert into church_modules (church_id, module) values (cid, 'attendance');
  return cid;
end $$;

-- ===== 3) 교인 가입 신청 → 승인 =====
create table join_requests (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references churches(id),
  user_id uuid not null references auth.users(id),
  applicant_name text not null,
  note text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  requested_at timestamptz not null default now(),
  decided_by uuid references auth.users(id),
  decided_at timestamptz,
  unique (church_id, user_id)
);
alter table join_requests enable row level security;
grant select, insert on join_requests to authenticated;
grant all on join_requests to service_role;
create policy jr_select on join_requests for select to authenticated
  using (user_id = auth.uid()
         or (church_id = (select my_church_id()) and my_role() in ('superadmin','pastor')));
create trigger audit_join_requests after insert or update on join_requests
  for each row execute function tg_audit_generic();

-- 신청 (교회 슬러그 기준 — 로그인만 되어 있으면 가능)
create or replace function request_join(p_slug text, p_name text, p_note text default null)
returns uuid
language plpgsql security definer set search_path = public as $$
declare cid uuid; rid uuid;
begin
  select id into cid from churches where slug = p_slug and status = 'active';
  if cid is null then raise exception '교회를 찾을 수 없습니다'; end if;
  if exists (select 1 from church_roles where church_id = cid and user_id = auth.uid()) then
    raise exception '이미 이 교회에 소속되어 있습니다';
  end if;
  insert into join_requests (church_id, user_id, applicant_name, note)
  values (cid, auth.uid(), trim(p_name), p_note)
  on conflict (church_id, user_id) do update
    set status = 'pending', applicant_name = trim(p_name), note = p_note, requested_at = now()
  returning id into rid;
  return rid;
end $$;

-- 승인: 기존 교적에 연결(p_member_id) 또는 신규 교적 생성
create or replace function approve_join(p_request uuid, p_member_id uuid default null)
returns void
language plpgsql security definer set search_path = public as $$
declare r join_requests%rowtype; mid uuid;
begin
  select * into r from join_requests where id = p_request and status = 'pending';
  if not found then raise exception '대기 중인 신청이 아닙니다'; end if;
  if r.church_id is distinct from my_church_id() or my_role() not in ('superadmin','pastor') then
    raise exception '승인 권한이 없습니다';
  end if;
  if p_member_id is not null then
    if not exists (select 1 from members where id = p_member_id and church_id = r.church_id and user_id is null) then
      raise exception '연결할 수 없는 교적입니다';
    end if;
    update members set user_id = r.user_id where id = p_member_id;
    mid := p_member_id;
  else
    insert into members (church_id, name, member_type, user_id)
    values (r.church_id, r.applicant_name, 'registered', r.user_id)
    returning id into mid;
    insert into member_qr_tokens (member_id, token)
    values (mid, encode(extensions.gen_random_bytes(24), 'hex'));
  end if;
  insert into church_roles (church_id, user_id, role) values (r.church_id, r.user_id, 'member')
    on conflict do nothing;
  insert into active_church (user_id, church_id) values (r.user_id, r.church_id)
    on conflict (user_id) do nothing;
  update join_requests set status = 'approved', decided_by = auth.uid(), decided_at = now()
  where id = p_request;
end $$;

create or replace function reject_join(p_request uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update join_requests set status = 'rejected', decided_by = auth.uid(), decided_at = now()
  where id = p_request and status = 'pending'
    and church_id = my_church_id() and my_role() in ('superadmin','pastor');
  if not found then raise exception '처리할 수 없는 신청입니다'; end if;
end $$;

-- ===== 4) 플랫폼 콘솔 기반 =====
create or replace function is_platform_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from platform_admins where user_id = auth.uid())
$$;

-- 집계 전용 (교회 내부 데이터 미반환 — D6)
create or replace function platform_overview() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not is_platform_admin() then raise exception '플랫폼 운영 권한이 없습니다'; end if;
  return jsonb_build_object(
    'church_count', (select count(*) from churches),
    'active_count', (select count(*) from churches where status = 'active'),
    'member_total', (select count(*) from members),                 -- 총계만 (개인정보 없음)
    'week_attendance', (select count(*) from attendances where event_date >= current_date - 7),
    'churches', (select coalesce(jsonb_agg(jsonb_build_object(
        'id', c.id, 'name', c.name, 'slug', c.slug, 'status', c.status,
        'created_at', c.created_at,
        'member_count', (select count(*) from members m where m.church_id = c.id),
        'modules', (select coalesce(jsonb_agg(cm.module), '[]'::jsonb)
                    from church_modules cm where cm.church_id = c.id and cm.enabled))
        order by c.created_at desc), '[]'::jsonb)
      from churches c));
end $$;

create or replace function platform_set_church_status(p_church uuid, p_status text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_platform_admin() then raise exception '플랫폼 운영 권한이 없습니다'; end if;
  if p_status not in ('active','suspended') then raise exception '잘못된 상태'; end if;
  update churches set status = p_status where id = p_church;
  insert into audit_log (actor_user_id, action, target_table, target_id, after_json)
  values (auth.uid(), 'platform_status', 'churches', p_church::text, jsonb_build_object('status', p_status));
end $$;

grant execute on function request_join, approve_join, reject_join, is_platform_admin,
  platform_overview, platform_set_church_status to authenticated;

-- 시드: 데모 편의상 청파 admin 계정에 플랫폼 운영 권한 부여 (컨텍스트는 분리 유지)
insert into platform_admins (user_id)
select id from auth.users where email = 'admin@chungpa.local'
on conflict do nothing;
