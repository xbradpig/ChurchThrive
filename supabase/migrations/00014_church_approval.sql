-- 교회 등록 승인제: 등록 폼 고도화 필드 + pending 심사 → 플랫폼 관리자 승인 후 사용

-- 1) 심사용 정보 필드
alter table churches
  add column if not exists denomination text,          -- 교단 (심사 핵심)
  add column if not exists pastor_name text,           -- 담임목사
  add column if not exists contact_phone text,
  add column if not exists member_size text,           -- 규모 구간
  add column if not exists intro text,                 -- 소개·홈페이지 등
  add column if not exists reviewed_by uuid references auth.users(id),
  add column if not exists reviewed_at timestamptz,
  add column if not exists review_note text;           -- 승인/거절 사유

-- status 값 확장: pending | active | rejected | suspended (기존 text 컬럼 — check 추가)
alter table churches drop constraint if exists churches_status_check;
alter table churches add constraint churches_status_check
  check (status in ('pending','active','rejected','suspended'));

-- 2) 미승인 교회는 모듈 사용 불가 (모든 모듈 RLS의 관문을 한 곳에서 잠금)
create or replace function module_enabled(p_module text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from churches c where c.id = my_church_id() and c.status = 'active')
     and coalesce((select enabled from church_modules
                   where church_id = my_church_id() and module = p_module), false)
$$;

create or replace function my_church_status() returns text
language sql stable security definer set search_path = public as $$
  select status from churches where id = my_church_id()
$$;
grant execute on function my_church_status to authenticated;

-- 3) 등록 RPC 고도화: 심사 정보 수집 + pending 시작 (기존 2인자 호출과 호환)
create or replace function create_church(
  p_name text, p_slug text,
  p_denomination text default null, p_pastor text default null,
  p_phone text default null, p_address text default null,
  p_size text default null, p_intro text default null
) returns uuid
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
  insert into churches (name, slug, created_by, status,
                        denomination, pastor_name, contact_phone, address, member_size, intro)
  values (trim(p_name), p_slug, auth.uid(), 'pending',
          nullif(trim(p_denomination), ''), nullif(trim(p_pastor), ''),
          nullif(trim(p_phone), ''), nullif(trim(p_address), ''),
          nullif(trim(p_size), ''), nullif(trim(p_intro), ''))
  returning id into cid;
  insert into church_roles (church_id, user_id, role) values (cid, auth.uid(), 'superadmin');
  insert into active_church (user_id, church_id) values (auth.uid(), cid)
    on conflict (user_id) do update set church_id = cid, updated_at = now();
  -- 기본 시드는 미리 준비 (승인 즉시 사용 가능하도록) — 사용은 status='active' 게이트가 막음
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
  insert into audit_log (actor_user_id, action, target_table, target_id, after_json, church_id)
  values (auth.uid(), 'church_apply', 'churches', cid::text,
          jsonb_build_object('name', p_name, 'denomination', p_denomination), cid);
  return cid;
end $$;

-- 4) 심사 처리: 승인/거절 + 사유 기록 (플랫폼 관리자)
create or replace function platform_set_church_status(p_church uuid, p_status text, p_note text default null)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_platform_admin() then raise exception '플랫폼 운영 권한이 없습니다'; end if;
  if p_status not in ('pending','active','rejected','suspended') then raise exception '잘못된 상태'; end if;
  update churches set status = p_status, reviewed_by = auth.uid(),
         reviewed_at = now(), review_note = coalesce(p_note, review_note)
  where id = p_church;
  insert into audit_log (actor_user_id, action, target_table, target_id, after_json)
  values (auth.uid(), 'platform_review', 'churches', p_church::text,
          jsonb_build_object('status', p_status, 'note', p_note));
end $$;

-- 5) 심사 큐 조회 (플랫폼 관리자용 — 심사 정보 포함)
create or replace function platform_pending_churches()
returns table (id uuid, name text, slug text, denomination text, pastor_name text,
               contact_phone text, address text, member_size text, intro text, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select c.id, c.name, c.slug, c.denomination, c.pastor_name,
         c.contact_phone, c.address, c.member_size, c.intro, c.created_at
  from churches c
  where c.status = 'pending' and is_platform_admin()
  order by c.created_at
$$;
grant execute on function platform_pending_churches to authenticated;

-- 6) 기존 교회들은 승인 상태 유지 (신규부터 심사) — chungpa 등은 이미 active
