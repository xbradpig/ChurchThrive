-- SECURITY DEFINER RPC 테넌트 가드 일괄 적용 (스크린샷 검증에서 발견: 교차 교인 노출)
-- 교훈: DEFINER 함수는 RLS를 우회하므로 모든 조회·쓰기에 명시적 church 필터 필수

-- 1) 출석 체크 명단: 내 교회 교인만
create or replace function get_check_list(p_event_id uuid, p_event_date date)
returns table (member_id uuid, name text, name_suffix text, photo_url text,
               member_type member_type, present boolean, method check_method, approved boolean)
language sql stable security definer set search_path = public as $$
  select m.id, m.name, m.name_suffix, m.photo_url, m.member_type,
         (a.id is not null), a.method, a.approved
  from members m
  left join attendances a on a.member_id = m.id
    and a.event_id = p_event_id and a.event_date = p_event_date
  where m.church_id = my_church_id()                          -- 테넌트 가드
    and m.status = 'active' and is_staff()
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

-- 2) 미출석 리스트: 내 교회만
create or replace function absentee_list(p_weeks int default 2)
returns table (member_id uuid, name text, name_suffix text, care_target boolean,
               last_attended date, weeks_absent int)
language sql stable security definer set search_path = public as $$
  select m.id, m.name, m.name_suffix, m.care_target, la.last_date,
         coalesce((current_date - la.last_date) / 7, 999)::int
  from members m
  left join lateral (select max(event_date) as last_date from attendances a
                     where a.member_id = m.id and a.approved) la on true
  where m.church_id = my_church_id()                          -- 테넌트 가드
    and m.status = 'active' and m.member_type = 'registered' and is_staff()
    and (la.last_date is null or la.last_date <= current_date - (p_weeks * 7))
    and (my_role() <> 'dept_leader'
         or exists (select 1 from department_members dm
                    where dm.member_id = m.id
                      and dm.department_id in (select my_led_departments())))
  order by la.last_date nulls first
$$;

-- 3) 출석 추이: 내 교회만
create or replace function attendance_trend(p_weeks int default 8)
returns table (event_date date, event_name text, cnt bigint)
language sql stable security definer set search_path = public as $$
  select a.event_date, e.name, count(*)
  from attendances a join events e on e.id = a.event_id
  where a.church_id = my_church_id()                          -- 테넌트 가드
    and a.approved and a.event_date >= current_date - (p_weeks * 7) and is_staff()
  group by a.event_date, e.name order by a.event_date
$$;

-- 4) 출석 기록: 다른 교회 교인·이벤트에 기록 불가
create or replace function set_attendance(
  p_member_id uuid, p_event_id uuid, p_event_date date,
  p_present boolean, p_method check_method default 'manual'
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_staff() then raise exception '권한이 없습니다'; end if;
  if not exists (select 1 from members where id = p_member_id and church_id = my_church_id()) then
    raise exception '우리 교회 교인이 아닙니다';               -- 테넌트 가드
  end if;
  if not exists (select 1 from events where id = p_event_id and church_id = my_church_id()) then
    raise exception '우리 교회 이벤트가 아닙니다';
  end if;
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

-- 5) QR 스캔: 다른 교회 토큰 거부
create or replace function scan_checkin(p_token text, p_event_id uuid, p_event_date date)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare mid uuid; mname text;
begin
  if not is_staff() then raise exception '권한이 없습니다'; end if;
  select t.member_id into mid
  from member_qr_tokens t join members m on m.id = t.member_id
  where t.token = p_token and not t.revoked and m.church_id = my_church_id();  -- 테넌트 가드
  if mid is null then return jsonb_build_object('ok', false, 'error', '유효하지 않은 QR입니다'); end if;
  perform set_attendance(mid, p_event_id, p_event_date, true, 'qr');
  select name || name_suffix into mname from members where id = mid;
  return jsonb_build_object('ok', true, 'member_id', mid, 'name', mname);
end $$;

-- 6) attendances INSERT 정책에도 교회 술어 (2중 방어)
drop policy att_insert on attendances;
create policy att_insert on attendances for insert to authenticated
  with check (
    exists (select 1 from members m where m.id = attendances.member_id
            and m.church_id = (select my_church_id()))
    and (is_staff() or (method = 'self' and member_id = my_member_id()))
  );
