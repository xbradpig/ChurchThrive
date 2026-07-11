-- 00040: 내 교적 연결 후보 비교 + 본인 교적 연결 요청
-- 정확한 이름 후보 안에서 연락처/생년월일 일치 여부만 반환한다.
-- 원문 연락처/생년월일은 반환하지 않고, 연결은 기존 join_requests 승인 큐를 재사용한다.

create or replace function public.my_member_match_candidates(
  p_name text,
  p_phone text default null,
  p_birthday date default null
) returns table (
  member_id uuid,
  display_name text,
  hint text,
  name_match boolean,
  phone_match boolean,
  birthday_match boolean,
  match_score int
)
language sql stable security definer set search_path = public as $$
  with input as (
    select
      trim(coalesce(p_name, '')) as nm,
      regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g') as phone_digits,
      p_birthday as bd
  ),
  candidates as (
    select
      m.id,
      m.name,
      coalesce(m.name_suffix, '') as name_suffix,
      regexp_replace(coalesce(m.phone, ''), '[^0-9]', '', 'g') as member_phone_digits,
      m.birthday,
      i.nm,
      i.phone_digits,
      i.bd
    from members m
    cross join input i
    where auth.uid() is not null
      and my_church_id() is not null
      and my_member_id() is null
      and m.church_id = my_church_id()
      and m.user_id is null
      and m.status = 'active'
      and m.name = i.nm
      and i.nm <> ''
  ),
  scored as (
    select
      c.*,
      (
        60
        + case when length(c.phone_digits) >= 4
                 and length(c.member_phone_digits) >= 4
                 and right(c.phone_digits, 4) = right(c.member_phone_digits, 4)
               then 25 else 0 end
        + case when c.bd is not null and c.birthday = c.bd then 15 else 0 end
      ) as score,
      (length(c.phone_digits) >= 4
        and length(c.member_phone_digits) >= 4
        and right(c.phone_digits, 4) = right(c.member_phone_digits, 4)) as phone_ok,
      (c.bd is not null and c.birthday = c.bd) as birthday_ok
    from candidates c
  )
  select
    id,
    name || name_suffix,
    concat_ws(' · ',
      case when length(member_phone_digits) >= 4 then '연락처 ***' || right(member_phone_digits, 4) end,
      case when birthday is not null then to_char(birthday, 'YYYY') || '년생' end
    ) as hint,
    true,
    phone_ok,
    birthday_ok,
    score
  from scored
  order by score desc, (name || name_suffix)
  limit 5
$$;

create or replace function public.request_my_member_match(
  p_member_id uuid,
  p_name text,
  p_phone text default null,
  p_birthday date default null,
  p_note text default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  m members%rowtype;
  rid uuid;
  phone_digits text := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
  member_phone_digits text;
  match_note text;
begin
  if auth.uid() is null or my_church_id() is null then
    raise exception '로그인이 필요합니다';
  end if;
  if my_member_id() is not null then
    raise exception '이미 교적이 연결되어 있습니다';
  end if;

  select * into m
    from members
   where id = p_member_id
     and church_id = my_church_id()
     and user_id is null
     and status = 'active';
  if not found then
    raise exception '연결할 수 없는 교적입니다';
  end if;
  if trim(coalesce(p_name, '')) = '' or m.name <> trim(p_name) then
    raise exception '이름이 일치하지 않습니다';
  end if;

  member_phone_digits := regexp_replace(coalesce(m.phone, ''), '[^0-9]', '', 'g');
  match_note := concat_ws(' · ',
    '내 교적 연결 요청',
    case when length(phone_digits) >= 4
           and length(member_phone_digits) >= 4
           and right(phone_digits, 4) = right(member_phone_digits, 4)
         then '연락처 확인' end,
    case when p_birthday is not null and m.birthday = p_birthday
         then '생년월일 확인' end,
    nullif(trim(coalesce(p_note, '')), '')
  );

  insert into join_requests (church_id, user_id, applicant_name, note, matched_member_id)
  values (m.church_id, auth.uid(), trim(p_name), match_note, m.id)
  on conflict (church_id, user_id) do update
    set applicant_name = excluded.applicant_name,
        note = excluded.note,
        matched_member_id = excluded.matched_member_id,
        status = 'pending',
        decided_by = null,
        decided_at = null,
        requested_at = now()
  returning id into rid;

  return rid;
end $$;

grant execute on function public.my_member_match_candidates(text, text, date) to authenticated;
grant execute on function public.request_my_member_match(uuid, text, text, date, text) to authenticated;
