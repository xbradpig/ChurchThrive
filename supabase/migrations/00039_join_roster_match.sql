-- 00039: 교회 신청 시 명부(재적)에서 본인 검색 → 매칭 신청 → 관리자 승인
-- /join UX 개선: 이미 등록된 교인은 자기 교적을 찾아 연결 신청

-- 신청에 "연결하려는 기존 교적" 기록 (관리자가 매칭 승인)
alter table join_requests add column if not exists matched_member_id uuid references members(id);

-- 미연결 교적에서 이름으로 본인 검색 (열거 방지: 정확 이름 일치 + 마스킹 힌트만)
create or replace function public.join_search_roster(p_slug text, p_name text)
returns table (member_id uuid, name text, name_suffix text, hint text)
language sql stable security definer set search_path = public as $$
  select m.id, m.name, m.name_suffix,
    coalesce(
      -- 실제 숫자 4자리 이상일 때만 연락처 힌트 (플레이스홀더 전화 제외)
      nullif(case when length(regexp_replace(coalesce(m.phone, ''), '[^0-9]', '', 'g')) >= 4
           then '연락처 ***' || right(regexp_replace(m.phone, '[^0-9]', '', 'g'), 4) end, ''),
      case when m.birthday is not null then to_char(m.birthday, 'YYYY') || '년생' end,
      '') as hint
  from members m
  join churches c on c.id = m.church_id
  where c.slug = p_slug and c.status = 'active'
    and m.user_id is null and m.status = 'active'
    and m.name = trim(p_name)
  order by m.name_suffix
  limit 5
$$;
grant execute on function public.join_search_roster(text, text) to authenticated;

-- request_join v2: 매칭할 기존 교적(p_member_id) 옵션 (해당 교회의 미연결 교적만)
-- 구 3-arg 오버로드 제거 → PostgREST 함수 선택 모호성 방지
drop function if exists public.request_join(text, text, text);
create or replace function public.request_join(
  p_slug text, p_name text, p_note text default null, p_member_id uuid default null)
returns uuid
language plpgsql security definer set search_path = public as $$
declare cid uuid; rid uuid;
begin
  select id into cid from churches where slug = p_slug and status = 'active';
  if cid is null then raise exception '교회를 찾을 수 없습니다'; end if;
  if exists (select 1 from church_roles where church_id = cid and user_id = auth.uid()) then
    raise exception '이미 이 교회에 소속되어 있습니다';
  end if;
  if p_member_id is not null and not exists (
       select 1 from members where id = p_member_id and church_id = cid and user_id is null) then
    raise exception '연결할 수 없는 교적입니다';
  end if;
  insert into join_requests (church_id, user_id, applicant_name, note, matched_member_id)
  values (cid, auth.uid(), trim(p_name), p_note, p_member_id)
  on conflict (church_id, user_id) do update
    set applicant_name = excluded.applicant_name, note = excluded.note,
        matched_member_id = excluded.matched_member_id, status = 'pending',
        decided_by = null, decided_at = null
  returning id into rid;
  return rid;
end $$;
grant execute on function public.request_join(text, text, text, uuid) to authenticated;

-- 관리자 신청 큐: 매칭 요청한 교적명 포함 (반환 타입 변경 → 재생성)
drop function if exists public.admin_list_join_requests();
create or replace function public.admin_list_join_requests()
returns table (id uuid, applicant_name text, email text, note text, requested_at timestamptz,
               matched_member_id uuid, matched_member_name text)
language sql stable security definer set search_path = public as $$
  select j.id, j.applicant_name, u.email::text, j.note, j.requested_at,
         j.matched_member_id, (m.name || coalesce(m.name_suffix, ''))
  from join_requests j
  join auth.users u on u.id = j.user_id
  left join members m on m.id = j.matched_member_id
  where j.church_id = my_church_id() and j.status = 'pending'
    and my_role() in ('superadmin','pastor')
  order by j.requested_at
$$;
grant execute on function public.admin_list_join_requests to authenticated;
