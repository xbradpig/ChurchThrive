-- 00036: 교인 이메일 + 인증 상태 (member-email)
-- 원칙: 이메일은 민감 연락처 — 컬럼 수준 grant 없이 RPC(field_visible 'contact' 게이트)로만 노출.
-- 인증은 Supabase Auth 재활용: 연결된 계정(auth.users)의 확인된 이메일과 일치하면 인증으로 간주.
-- (@invite.* 가상 계정은 인증 소스로 사용하지 않음 — 00020 정책과 일관)

-- 1) 컬럼
alter table members add column email text;
alter table members add column email_verified_at timestamptz;

-- 2) 계정 ↔ 교적 이메일 동기화 트리거
--    - 이메일이 바뀌면 인증 해제
--    - 실계정(가상 아님)이 연결돼 있으면: 교적 이메일이 비었을 때 계정 이메일로 채우고,
--      계정의 확인된 이메일과 일치하면 인증 처리
create or replace function public.tg_sync_member_email()
returns trigger
language plpgsql security definer set search_path = public as $$
declare u_email text; u_confirmed timestamptz;
begin
  if tg_op = 'UPDATE' and new.email is distinct from old.email then
    new.email_verified_at := null;
  end if;
  if new.user_id is not null then
    select u.email, u.email_confirmed_at into u_email, u_confirmed
    from auth.users u where u.id = new.user_id;
    if u_email is not null and u_email not like '%@invite.%' then
      if new.email is null then new.email := u_email; end if;
      if lower(new.email) = lower(u_email) and u_confirmed is not null then
        new.email_verified_at := coalesce(new.email_verified_at, u_confirmed);
      end if;
    end if;
  end if;
  return new;
end $$;

create trigger sync_member_email
  before insert or update of user_id, email on members
  for each row execute function tg_sync_member_email();

-- 3) 백필: 이미 실계정이 연결된 교인은 계정 이메일 반영
update members m
set email = u.email, email_verified_at = u.email_confirmed_at
from auth.users u
where u.id = m.user_id and m.email is null
  and u.email is not null and u.email not like '%@invite.%';

-- 4) get_member_card — 연락처(contact) 게이트 아래 email·인증 여부 포함 (00008 정의 + 00018 user_id 유지)
create or replace function get_member_card(p_member_id uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  m members%rowtype;
  result jsonb;
  can_see boolean;
begin
  select * into m from members where id = p_member_id;
  if not found then return null; end if;
  if m.church_id is distinct from my_church_id() then return null; end if;  -- 테넌트 격리

  can_see := case my_role()
    when 'superadmin' then true when 'pastor' then true when 'checker' then true
    when 'dept_leader' then m.id = my_member_id()
      or exists (select 1 from department_members dm
                 where dm.member_id = m.id
                   and dm.department_id in (select my_led_departments()))
    else m.id = my_member_id() end;
  if not can_see then return null; end if;

  result := jsonb_build_object(
    'id', m.id, 'user_id', m.user_id, 'name', m.name, 'name_suffix', m.name_suffix,
    'photo_url', m.photo_url, 'position', m.position,
    'member_type', m.member_type, 'status', m.status,
    'departments', (select coalesce(jsonb_agg(jsonb_build_object('id', d.id, 'name', d.name)), '[]'::jsonb)
                    from department_members dm join departments d on d.id = dm.department_id
                    where dm.member_id = m.id));

  if field_visible(p_member_id, 'contact') then
    result := result || jsonb_build_object('phone', m.phone, 'email', m.email,
                                           'email_verified', (m.email_verified_at is not null));
  end if;
  if field_visible(p_member_id, 'birth') then result := result || jsonb_build_object('birthday', m.birthday); end if;
  if field_visible(p_member_id, 'address') then result := result || jsonb_build_object('address', m.address); end if;
  if field_visible(p_member_id, 'family') then result := result || jsonb_build_object('family_note', m.family_note); end if;
  if field_visible(p_member_id, 'pastoral') then
    result := result || jsonb_build_object(
      'care_target', m.care_target, 'guardian_name', m.guardian_name,
      'guardian_phone', m.guardian_phone, 'has_wander_device', m.has_wander_device,
      'dementia_center_registered', m.dementia_center_registered,
      'last_seen_at', (select max(last_seen) from presence_events pe
                       join devices dv on dv.id = pe.device_id where dv.member_id = m.id));
  end if;
  if field_visible(p_member_id, 'attendance') then
    result := result || jsonb_build_object('recent_attendances',
      (select coalesce(jsonb_agg(jsonb_build_object(
         'event_date', a.event_date, 'event_name', e.name, 'method', a.method, 'approved', a.approved)
         order by a.event_date desc), '[]'::jsonb)
       from (select * from attendances where member_id = m.id order by event_date desc limit 60) a
       join events e on e.id = a.event_id));
  end if;
  return result;
end $$;

-- 5) admin_list_members — email·인증 여부 추가 (반환 타입 변경 → drop 후 재생성)
drop function if exists admin_list_members(text, uuid, text);
create or replace function admin_list_members(
  p_search text default null, p_dept uuid default null, p_status text default null
) returns table (
  id uuid, name text, name_suffix text, phone text, "position" text,
  status text, member_type text, joined boolean, photo_url text,
  departments jsonb, birthday date, email text, email_verified boolean
)
language sql stable security definer set search_path = public as $$
  select m.id, m.name, m.name_suffix,
         case when my_role() in ('superadmin','pastor') then m.phone end,
         m.position, m.status::text, m.member_type::text,
         (m.user_id is not null),
         m.photo_url,
         coalesce((select jsonb_agg(jsonb_build_object('id', d.id, 'name', d.name))
                   from department_members dm join departments d on d.id = dm.department_id
                   where dm.member_id = m.id), '[]'::jsonb),
         case when my_role() in ('superadmin','pastor') then m.birthday end,
         case when my_role() in ('superadmin','pastor') then m.email end,
         (m.email_verified_at is not null)
  from members m
  where m.church_id = my_church_id() and is_staff()
    and (p_search is null or (m.name || m.name_suffix) ilike '%' || p_search || '%')
    and (p_dept is null or exists (select 1 from department_members dm
                                   where dm.member_id = m.id and dm.department_id = p_dept))
    and (p_status is null or m.status::text = p_status)
  order by m.status = 'active' desc, m.name collate "ko-KR-x-icu"
$$;
grant execute on function admin_list_members to authenticated;

-- 6) admin_upsert_member — p_email 추가 (시그니처 변경 → 기존 오버로드 제거 후 재생성: PostgREST 모호성 방지)
drop function if exists admin_upsert_member(uuid, text, text, text, date, text, text);
create or replace function admin_upsert_member(
  p_id uuid default null, p_name text default null, p_suffix text default '',
  p_phone text default null, p_birthday date default null,
  p_position text default null, p_status text default null,
  p_email text default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare mid uuid;
begin
  if my_role() not in ('superadmin','pastor') then raise exception '교역자 이상만 가능합니다'; end if;
  if p_status is not null and p_status not in ('active','inactive','moved','deceased') then
    raise exception '잘못된 상태'; end if;
  if p_email is not null and nullif(trim(p_email), '') is not null
     and trim(p_email) !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception '올바른 이메일 형식이 아닙니다'; end if;
  if p_id is null then
    if coalesce(trim(p_name), '') = '' then raise exception '이름이 필요합니다'; end if;
    insert into members (church_id, name, name_suffix, phone, birthday, position, member_type, status, email)
    values (my_church_id(), trim(p_name), coalesce(p_suffix, ''), nullif(trim(p_phone), ''),
            p_birthday, nullif(trim(p_position), ''), 'registered', coalesce(p_status, 'active')::member_status,
            nullif(lower(trim(p_email)), ''))
    returning id into mid;
  else
    select id into mid from members where id = p_id and church_id = my_church_id();
    if mid is null then raise exception '우리 교회 교인이 아닙니다'; end if;
    update members set
      name = coalesce(nullif(trim(p_name), ''), name),
      name_suffix = coalesce(p_suffix, name_suffix),
      phone = coalesce(nullif(trim(p_phone), ''), phone),
      birthday = coalesce(p_birthday, birthday),
      position = coalesce(nullif(trim(p_position), ''), position),
      status = coalesce(p_status::member_status, status),
      email = case when p_email is null then email else nullif(lower(trim(p_email)), '') end,
      updated_at = now()
    where id = mid;
  end if;
  insert into audit_log (actor_user_id, action, target_table, target_id, after_json, church_id)
  values (auth.uid(), case when p_id is null then 'member_create' else 'member_update' end,
          'members', mid::text,
          jsonb_strip_nulls(jsonb_build_object('name', p_name, 'status', p_status, 'position', p_position,
                                               'email', p_email)),
          my_church_id());
  return mid;
end $$;
grant execute on function admin_upsert_member to authenticated;

-- 7) import_members — email 열 수용 (시그니처 동일 — 본문만 교체)
create or replace function import_members(p_rows jsonb)
returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare r jsonb; inserted int := 0; skipped int := 0; nm text; sfx text; mid uuid; em text;
begin
  if my_role() not in ('superadmin','pastor') then raise exception '권한이 없습니다'; end if;
  for r in select * from jsonb_array_elements(p_rows) loop
    nm := trim(r->>'name');
    if nm is null or nm = '' then skipped := skipped + 1; continue; end if;
    sfx := coalesce(nullif(trim(r->>'suffix'), ''), '');
    if exists (select 1 from members where church_id = my_church_id() and name = nm and name_suffix = sfx) then
      skipped := skipped + 1; continue;
    end if;
    em := nullif(lower(trim(r->>'email')), '');
    if em is not null and em !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then em := null; end if;
    insert into members (church_id, name, name_suffix, phone, birthday, position, member_type, email)
    values (my_church_id(), nm, sfx,
            nullif(trim(r->>'phone'), ''),
            case when (r->>'birthday') ~ '^\d{4}-\d{2}-\d{2}$' then (r->>'birthday')::date end,
            coalesce(nullif(trim(r->>'position'), ''), '평신도'), 'registered', em)
    returning id into mid;
    insert into member_qr_tokens (member_id, token) values (mid, encode(gen_random_bytes(24), 'hex'));
    inserted := inserted + 1;
  end loop;
  return jsonb_build_object('inserted', inserted, 'skipped', skipped);
end $$;
grant execute on function import_members to authenticated;

-- 8) 셀프서비스 수정 화이트리스트에 email 추가 (00030 재정의 — 시그니처 동일)
create or replace function public.request_my_card_edit(p jsonb, p_note text default null)
returns uuid
language plpgsql security definer set search_path = public as $$
declare m members%rowtype; diff jsonb := '{}'::jsonb; rid uuid;
begin
  select * into m from members where id = my_member_id();
  if not found then raise exception '연결된 교적이 없습니다'; end if;

  -- 화이트리스트만 채택, 현재 값과 같으면 제외 (position·status 등은 담당자 전용 — strip)
  if p ? 'name' and nullif(trim(p->>'name'), '') is distinct from m.name and nullif(trim(p->>'name'),'') is not null then
    diff := diff || jsonb_build_object('name', trim(p->>'name')); end if;
  if p ? 'phone' and nullif(trim(p->>'phone'), '') is distinct from m.phone then
    diff := diff || jsonb_build_object('phone', nullif(trim(p->>'phone'), '')); end if;
  if p ? 'birthday' and nullif(p->>'birthday','')::date is distinct from m.birthday then
    diff := diff || jsonb_build_object('birthday', nullif(p->>'birthday','')); end if;
  if p ? 'address' and nullif(trim(p->>'address'), '') is distinct from m.address then
    diff := diff || jsonb_build_object('address', nullif(trim(p->>'address'), '')); end if;
  if p ? 'family_note' and nullif(trim(p->>'family_note'), '') is distinct from m.family_note then
    diff := diff || jsonb_build_object('family_note', nullif(trim(p->>'family_note'), '')); end if;
  if p ? 'email' and nullif(lower(trim(p->>'email')), '') is distinct from m.email then
    if nullif(trim(p->>'email'), '') is not null
       and trim(p->>'email') !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
      raise exception '올바른 이메일 형식이 아닙니다';
    end if;
    diff := diff || jsonb_build_object('email', nullif(lower(trim(p->>'email')), '')); end if;

  if diff = '{}'::jsonb then raise exception '변경된 내용이 없습니다'; end if;

  insert into member_edit_requests (church_id, member_id, requested_by, changes, note)
  values (m.church_id, m.id, auth.uid(), diff, nullif(trim(p_note), ''))
  on conflict (member_id) where status = 'pending'
  do update set changes = excluded.changes, note = excluded.note,
                created_at = now(), notified_at = null, requested_by = excluded.requested_by
  returning id into rid;
  return rid;
end $$;
grant execute on function public.request_my_card_edit to authenticated;

-- 9) 승인 반영에 email 추가 (00030 재정의 — 시그니처 동일)
create or replace function public.member_edit_decide(p_id uuid, p_approve boolean, p_note text default null)
returns void
language plpgsql security definer set search_path = public as $$
declare r member_edit_requests%rowtype;
begin
  if not public.can_decide_member_edit() then raise exception '승인 권한이 없습니다'; end if;
  select * into r from member_edit_requests
   where id = p_id and church_id = my_church_id() and status = 'pending';
  if not found then raise exception '대기 중인 요청이 아닙니다'; end if;

  if p_approve then
    update members set
      name        = case when r.changes ? 'name' then r.changes->>'name' else name end,
      phone       = case when r.changes ? 'phone' then r.changes->>'phone' else phone end,
      birthday    = case when r.changes ? 'birthday' then (r.changes->>'birthday')::date else birthday end,
      address     = case when r.changes ? 'address' then r.changes->>'address' else address end,
      family_note = case when r.changes ? 'family_note' then r.changes->>'family_note' else family_note end,
      email       = case when r.changes ? 'email' then r.changes->>'email' else email end
    where id = r.member_id;
  end if;

  update member_edit_requests
  set status = case when p_approve then 'approved' else 'rejected' end,
      decided_by = auth.uid(), decided_at = now(), decide_note = nullif(trim(p_note), '')
  where id = p_id;
end $$;
grant execute on function public.member_edit_decide to authenticated;

-- 10) 승인 큐 현재값 스냅샷에 email 포함 (00030 재정의 — 반환 타입 동일)
create or replace function public.member_edit_requests_list()
returns table (id uuid, member_id uuid, member_name text, changes jsonb, current jsonb,
               note text, requested_at timestamptz)
language sql stable security definer set search_path = public as $$
  select r.id, r.member_id, m.name || m.name_suffix, r.changes,
         jsonb_build_object('name', m.name, 'phone', m.phone, 'birthday', m.birthday,
                            'address', m.address, 'family_note', m.family_note, 'email', m.email),
         r.note, r.created_at
  from member_edit_requests r join members m on m.id = r.member_id
  where r.church_id = my_church_id() and r.status = 'pending'
    and public.can_decide_member_edit()
  order by r.created_at
$$;
grant execute on function public.member_edit_requests_list to authenticated;
