-- 교인 초대 보드: 담당자(교역자·부서장·체커)용 일괄 초대 현황
create or replace function invite_board()
returns table (member_id uuid, name text, name_suffix text, phone text,
               joined boolean, invited boolean, invite_token text)
language sql stable security definer set search_path = public as $$
  select m.id, m.name, m.name_suffix, m.phone,
         (m.user_id is not null) as joined,
         exists (select 1 from member_invites i
                 where i.member_id = m.id and i.expires_at > now()) as invited,
         (select i.token from member_invites i
           where i.member_id = m.id and i.expires_at > now() limit 1) as invite_token
  from members m
  where m.church_id = my_church_id() and m.status = 'active' and is_staff()
  order by (m.user_id is not null), m.name collate "ko-KR-x-icu"
$$;
grant execute on function invite_board to authenticated;
