-- 00032: 역할별 업무 대시보드 — home_feed v2 (홈 고도화 4단계)
-- docs/Task_Work/2026-07-08_role-work-dashboard/detail_goal.md
-- 새가족 정착·부서장 승인 대기·오늘 예배를 홈 업무 인박스에 표면화

-- 1) 새가족 정착 퍼널 (INVOKER — mod_newcomer.progress의 nc_all RLS가 매니저만 통과)
create or replace function public.newcomer_funnel()
returns jsonb
language sql stable security invoker set search_path = public, mod_newcomer as $$
  select case when not module_enabled('newcomer') then null else (
    select jsonb_build_object(
      's1', count(*) filter (where stage = 1),
      's2', count(*) filter (where stage = 2),
      's3', count(*) filter (where stage = 3),
      's4', count(*) filter (where stage = 4),
      'active', count(*) filter (where stage between 1 and 3))
    from mod_newcomer.progress
    where church_id = my_church_id()
  ) end
$$;
grant execute on function public.newcomer_funnel() to authenticated;

-- 2) home_feed v2 (00031 전체 복제 + newcomer_active·dept_pending·today_service)
create or replace function home_feed()
returns jsonb
language sql stable security invoker set search_path = public as $$
  select jsonb_build_object(
    'church_name', (select name from churches where id = my_church_id()),
    'next_sunday', (current_date + ((7 - extract(dow from current_date)::int) % 7))::text,
    'week_events', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'name', e.name, 'category', e.category, 'rule', e.schedule_rule)
               order by e.sort_order), '[]'::jsonb)
      from events e
      where e.church_id = my_church_id() and e.schedule_rule is not null),
    'notices', case when module_enabled('notice') then (
      select coalesce(jsonb_agg(x), '[]'::jsonb) from (
        select jsonb_build_object('id', n.id, 'title', n.title,
                 'created_at', to_char(n.published_at, 'MM.DD')) as x
        from mod_notice.notices n
        where n.church_id = my_church_id() and n.target_department_id is null
        order by n.published_at desc limit 3) t) end,
    'bulletin', case when module_enabled('bulletin') then (
      select jsonb_build_object('id', b.id, 'title', b.title, 'week_start', b.week_start)
      from mod_bulletin.issues b
      where b.church_id = my_church_id() and b.published
      order by b.week_start desc limit 1) end,
    'join_pending', case when my_role() in ('superadmin','pastor') then (
      select count(*) from join_requests
      where church_id = my_church_id() and status = 'pending') end,
    'selfcheck_pending', case when my_role() in ('superadmin','pastor','checker','dept_leader') then (
      select count(*) from attendances
      where church_id = my_church_id() and approved = false) end,
    'visit_requested', case when my_role() in ('superadmin','pastor')
                             and module_enabled('visitation') then (
      select count(*) from mod_visitation.visits
      where church_id = my_church_id() and status = 'requested') end,
    'edit_pending', case when public.can_decide_member_edit() then (
      select count(*) from member_edit_requests
      where church_id = my_church_id() and status = 'pending') end,
    'newcomer_active', case when has_module('newcomer','manager') then (
      select count(*) from mod_newcomer.progress
      where church_id = my_church_id() and stage between 1 and 3) end,
    'dept_pending', case when my_role() in ('superadmin','pastor') then (
      select count(*) from department_leaders dl
      join departments d on d.id = dl.department_id
      where d.church_id = my_church_id() and dl.status = 'pending') end,
    'today_service', case when my_role() in ('superadmin','pastor','checker','dept_leader') then (
      select e.name from events e
      where e.church_id = my_church_id() and e.schedule_rule is not null
        and (e.schedule_rule->'dow') @> to_jsonb(extract(dow from current_date)::int)
      order by e.sort_order limit 1) end
  )
$$;
grant execute on function home_feed to authenticated;
