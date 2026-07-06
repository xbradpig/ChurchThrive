-- 1) 교인 사진 URL을 인증 API 경로로 전환 (정적 공개 노출 제거)
update members set photo_url = replace(photo_url, '/photos/', '/api/photos/')
where photo_url like '/photos/%';

-- 2) 미출석 다이제스트용 RPC: 서비스(cron)가 수신자 기준으로 호출
--    (service 컨텍스트에서 my_church_id()가 null이라 기존 absentee_list가 0명 반환하던 버그 수정)
create or replace function absentee_list_for(p_user_id uuid, p_weeks int default 2)
returns table (member_id uuid, name text, name_suffix text, care_target boolean,
               last_attended date, weeks_absent int)
language sql stable security definer set search_path = public as $$
  with target_church as (
    select coalesce(
      (select church_id from active_church where user_id = p_user_id),
      (select church_id from church_roles where user_id = p_user_id limit 1)) as cid
  ), target_role as (
    select role from church_roles cr, target_church tc
    where cr.user_id = p_user_id and cr.church_id = tc.cid
    order by case role when 'superadmin' then 0 when 'pastor' then 1
             when 'dept_leader' then 2 else 3 end limit 1
  )
  select m.id, m.name, m.name_suffix, m.care_target, la.last_date,
         coalesce((current_date - la.last_date) / 7, 999)::int
  from members m
  cross join target_church tc
  left join lateral (select max(event_date) as last_date from attendances a
                     where a.member_id = m.id and a.approved) la on true
  where m.church_id = tc.cid
    and m.status = 'active' and m.member_type = 'registered'
    and (select role from target_role) in ('superadmin','pastor','dept_leader')
    and (la.last_date is null or la.last_date <= current_date - (p_weeks * 7))
    and ((select role from target_role) <> 'dept_leader'
         or exists (select 1 from department_members dm
                    join department_leaders dl on dl.department_id = dm.department_id
                    join members lm on lm.id = dl.member_id
                    where dm.member_id = m.id and dl.status = 'approved'
                      and lm.user_id = p_user_id and lm.church_id = tc.cid))
  order by la.last_date nulls first
$$;
-- 주의: 서비스 전용 (authenticated에 grant하지 않음 — p_user_id 위조 방지)
revoke execute on function absentee_list_for from public, authenticated;
grant execute on function absentee_list_for to service_role;
