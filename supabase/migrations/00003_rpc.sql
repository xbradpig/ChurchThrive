-- RPC: 항목별 2중 게이트 조회, 본인 수정, 출석 기록, QR, 신규 등록, 미출석 리스트

-- 항목 그룹 공개 여부: (관리자 승인) AND (본인 동의) — 부서 담당자에게만 적용
create or replace function field_visible(p_member uuid, p_group field_group) returns boolean
language sql stable security definer set search_path = public as $$
  select case
    when my_role() in ('superadmin','pastor') then true
    when my_role() = 'member' and p_member = my_member_id() then true
    when p_group = 'attendance' and is_staff() then true         -- 출석은 staff 기본 공개
    when my_role() = 'dept_leader' then
      coalesce((select allowed from field_permissions
                where role_scope = 'dept_leader' and fgroup = p_group), false)
      and coalesce((select granted from member_consents
                    where member_id = p_member and fgroup = p_group), false)
    else false
  end
$$;

-- 교적카드 조회: 게이트 통과 항목만 JSON에 포함 (미통과 항목은 키 자체가 없음)
create or replace function get_member_card(p_member_id uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  m members%rowtype;
  result jsonb;
  can_see boolean;
begin
  select * into m from members where id = p_member_id;
  if not found then return null; end if;

  -- 행 접근 범위 검사 (RLS와 동일 규칙)
  can_see := case my_role()
    when 'superadmin' then true when 'pastor' then true when 'checker' then true
    when 'dept_leader' then m.id = my_member_id()
      or exists (select 1 from department_members dm
                 where dm.member_id = m.id
                   and dm.department_id in (select my_led_departments()))
    else m.id = my_member_id() end;
  if not can_see then return null; end if;

  result := jsonb_build_object(
    'id', m.id, 'name', m.name, 'name_suffix', m.name_suffix,
    'photo_url', m.photo_url, 'position', m.position,
    'member_type', m.member_type, 'status', m.status,
    'departments', (select coalesce(jsonb_agg(jsonb_build_object('id', d.id, 'name', d.name)), '[]'::jsonb)
                    from department_members dm join departments d on d.id = dm.department_id
                    where dm.member_id = m.id));

  if field_visible(p_member_id, 'contact') then
    result := result || jsonb_build_object('phone', m.phone);
  end if;
  if field_visible(p_member_id, 'birth') then
    result := result || jsonb_build_object('birthday', m.birthday);
  end if;
  if field_visible(p_member_id, 'address') then
    result := result || jsonb_build_object('address', m.address);
  end if;
  if field_visible(p_member_id, 'family') then
    result := result || jsonb_build_object('family_note', m.family_note);
  end if;
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

-- 본인 교적 수정: 화이트리스트 컬럼만 (삭제·타인 수정 불가)
create or replace function update_my_card(
  p_phone text default null, p_address text default null,
  p_photo_url text default null, p_family_note text default null
) returns void
language plpgsql security definer set search_path = public as $$
declare mid uuid := my_member_id();
begin
  if mid is null then raise exception '연결된 교적이 없습니다'; end if;
  update members set
    phone = coalesce(p_phone, phone),
    address = coalesce(p_address, address),
    photo_url = coalesce(p_photo_url, photo_url),
    family_note = coalesce(p_family_note, family_note)
  where id = mid;
end $$;

-- 출석 토글 (담당자): 방법 우선순위 manual > qr/nfc > self > auto
create or replace function set_attendance(
  p_member_id uuid, p_event_id uuid, p_event_date date,
  p_present boolean, p_method check_method default 'manual'
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_staff() then raise exception '권한이 없습니다'; end if;
  if p_present then
    insert into attendances (member_id, event_id, event_date, method, approved, checked_by)
    values (p_member_id, p_event_id, p_event_date, p_method, true, auth.uid())
    on conflict (member_id, event_id, event_date)
    do update set method = case
        when excluded.method = 'manual' then 'manual'::check_method
        when attendances.method in ('auto_wifi','auto_ble','self') then excluded.method
        else attendances.method end,
      approved = true, checked_by = auth.uid();
  else
    delete from attendances
    where member_id = p_member_id and event_id = p_event_id and event_date = p_event_date;
  end if;
end $$;

-- 신규 이름만 즉시 등록 + 당일 출석
create or replace function quick_register(p_name text, p_event_id uuid, p_event_date date)
returns uuid
language plpgsql security definer set search_path = public, extensions as $$
declare new_id uuid; suffix text := '';
begin
  if not is_staff() then raise exception '권한이 없습니다'; end if;
  if exists (select 1 from members where name = trim(p_name) and name_suffix = '') then
    suffix := 'N' || to_char(now(), 'MMDD');
  end if;
  insert into members (name, name_suffix, member_type)
  values (trim(p_name), suffix, 'new_family') returning id into new_id;
  insert into member_qr_tokens (member_id, token) values (new_id, encode(gen_random_bytes(24), 'hex'));
  perform set_attendance(new_id, p_event_id, p_event_date, true, 'manual');
  return new_id;
end $$;

-- QR 스캔 체크인
create or replace function scan_checkin(p_token text, p_event_id uuid, p_event_date date)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare mid uuid; mname text;
begin
  if not is_staff() then raise exception '권한이 없습니다'; end if;
  select member_id into mid from member_qr_tokens where token = p_token and not revoked;
  if mid is null then return jsonb_build_object('ok', false, 'error', '유효하지 않은 QR입니다'); end if;
  perform set_attendance(mid, p_event_id, p_event_date, true, 'qr');
  select name || name_suffix into mname from members where id = mid;
  return jsonb_build_object('ok', true, 'member_id', mid, 'name', mname);
end $$;

-- 셀프 체크인 (교인 본인, 담당자 승인 대기)
create or replace function self_checkin(p_event_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare mid uuid := my_member_id();
begin
  if mid is null then raise exception '연결된 교적이 없습니다'; end if;
  insert into attendances (member_id, event_id, event_date, method, approved)
  values (mid, p_event_id, current_date, 'self', false)
  on conflict (member_id, event_id, event_date) do nothing;
end $$;

-- 출석 체크 화면용: 대상 명단 + 당일 상태 (초성 정렬)
create or replace function get_check_list(p_event_id uuid, p_event_date date)
returns table (member_id uuid, name text, name_suffix text, photo_url text,
               member_type member_type, present boolean, method check_method, approved boolean)
language sql stable security definer set search_path = public as $$
  select m.id, m.name, m.name_suffix, m.photo_url, m.member_type,
         (a.id is not null), a.method, a.approved
  from members m
  left join attendances a on a.member_id = m.id
    and a.event_id = p_event_id and a.event_date = p_event_date
  where m.status = 'active' and is_staff()
    and (my_role() <> 'dept_leader'
         or m.id = my_member_id()
         or exists (select 1 from department_members dm
                    where dm.member_id = m.id
                      and dm.department_id in (select my_led_departments())))
    and (coalesce((select e.target_department_id from events e where e.id = p_event_id), null) is null
         or exists (select 1 from department_members dm2
                    where dm2.member_id = m.id
                      and dm2.department_id = (select e.target_department_id from events e where e.id = p_event_id)))
  order by m.name collate "ko-KR-x-icu", m.name_suffix
$$;

-- 장기 미출석 리스트 (모든 체크인 방법 통합 기준)
create or replace function absentee_list(p_weeks int default 2)
returns table (member_id uuid, name text, name_suffix text, care_target boolean,
               last_attended date, weeks_absent int)
language sql stable security definer set search_path = public as $$
  select m.id, m.name, m.name_suffix, m.care_target,
         la.last_date,
         coalesce((current_date - la.last_date) / 7, 999)::int
  from members m
  left join lateral (select max(event_date) as last_date from attendances a
                     where a.member_id = m.id and a.approved) la on true
  where m.status = 'active' and m.member_type = 'registered' and is_staff()
    and (la.last_date is null or la.last_date <= current_date - (p_weeks * 7))
    and (my_role() <> 'dept_leader'
         or exists (select 1 from department_members dm
                    where dm.member_id = m.id
                      and dm.department_id in (select my_led_departments())))
  order by la.last_date nulls first
$$;

-- 통계: 최근 N주 이벤트별 출석 수
create or replace function attendance_trend(p_weeks int default 8)
returns table (event_date date, event_name text, cnt bigint)
language sql stable security definer set search_path = public as $$
  select a.event_date, e.name, count(*)
  from attendances a join events e on e.id = a.event_id
  where a.approved and a.event_date >= current_date - (p_weeks * 7) and is_staff()
  group by a.event_date, e.name order by a.event_date
$$;

grant execute on function get_member_card, update_my_card, set_attendance, quick_register,
  scan_checkin, self_checkin, get_check_list, absentee_list, attendance_trend,
  field_visible, my_role, my_member_id, my_led_departments, is_staff to authenticated;
