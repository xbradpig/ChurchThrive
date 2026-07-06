-- 웹 홈 대시보드: 홈 데이터 1왕복 (web-home-proposal §3)
-- SECURITY INVOKER — 모듈 노출·행 가시성은 전부 기존 RLS/게이트가 결정
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
        where n.church_id = my_church_id()
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
      where church_id = my_church_id() and status = 'requested') end
  )
$$;
grant execute on function home_feed to authenticated;
