-- 00031: "내 부서" 홈 카드 + 부서 공지 활성화 (홈 고도화 3단계)
-- docs/Task_Work/2026-07-08_dept-home-card/detail_goal.md
-- 잠자던 mod_notice.notices.target_department_id를 깨워 부서 공지 격리

-- 1) 내 부서 = 소속(member) ∪ 담당(approved leader)
create or replace function public.my_dept_ids()
returns setof uuid
language sql stable security definer set search_path = public as $$
  select department_id from department_members where member_id = my_member_id()
  union
  select department_id from department_leaders
    where member_id = my_member_id() and status = 'approved'
$$;
grant execute on function public.my_dept_ids() to authenticated;

-- 2) 공지 RLS 재정의 — 부서 인지
drop policy if exists n_sel on mod_notice.notices;
create policy n_sel on mod_notice.notices for select to authenticated
  using (church_id = (select public.my_church_id()) and public.module_enabled('notice')
    and (target_department_id is null
         or public.my_role() in ('superadmin','pastor')
         or target_department_id in (select public.my_dept_ids())));

drop policy if exists n_ins on mod_notice.notices;
create policy n_ins on mod_notice.notices for insert to authenticated
  with check (church_id = (select public.my_church_id()) and public.module_enabled('notice')
    and (public.has_module('notice','manager')
         or public.my_role() in ('superadmin','pastor')
         or (target_department_id is not null
             and target_department_id in (select public.my_led_departments()))));
-- n_del(admin) 유지

-- 3) 공지 작성 대상 (전교회 가능 여부 + 선택 가능 부서)
create or replace function public.notice_targets()
returns jsonb
language sql stable security invoker set search_path = public as $$
  select jsonb_build_object(
    'can_church_wide', (my_role() in ('superadmin','pastor') or has_module('notice','manager')),
    'departments', (
      select coalesce(jsonb_agg(jsonb_build_object('id', d.id, 'name', d.name)
               order by d.sort_order), '[]'::jsonb)
      from departments d
      where d.church_id = my_church_id()
        and (my_role() in ('superadmin','pastor') or has_module('notice','manager')
             or d.id in (select my_led_departments())))
  )
$$;
grant execute on function public.notice_targets() to authenticated;

-- 4) 내 부서 홈 카드 데이터 (부서 타겟 일정·공지만)
create or replace function public.dept_home()
returns jsonb
language sql stable security invoker set search_path = public, mod_notice, mod_calendar as $$
  select case when my_member_id() is null then null else jsonb_build_object(
    'departments', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'id', d.id, 'name', d.name,
               'is_leader', exists (select 1 from department_leaders dl
                 where dl.department_id = d.id and dl.member_id = my_member_id() and dl.status = 'approved'))
               order by d.sort_order), '[]'::jsonb)
      from departments d
      where d.church_id = my_church_id() and d.id in (select my_dept_ids())),
    'events', case when module_enabled('calendar') then (
      select coalesce(jsonb_agg(x), '[]'::jsonb) from (
        select jsonb_build_object('id', e.id, 'title', e.title, 'dept', d.name,
                 'starts_at', e.starts_at) as x
        from mod_calendar.events e join departments d on d.id = e.target_department_id
        where e.church_id = my_church_id()
          and e.target_department_id in (select my_dept_ids())
          and coalesce(e.ends_at, e.starts_at) >= date_trunc('day', now())
        order by e.starts_at limit 5) t) else '[]'::jsonb end,
    'notices', case when module_enabled('notice') then (
      select coalesce(jsonb_agg(x), '[]'::jsonb) from (
        select jsonb_build_object('id', n.id, 'title', n.title, 'dept', d.name,
                 'at', to_char(n.published_at, 'MM.DD')) as x
        from mod_notice.notices n join departments d on d.id = n.target_department_id
        where n.church_id = my_church_id() and n.target_department_id is not null
        order by n.published_at desc limit 5) t) else '[]'::jsonb end
  ) end
$$;
grant execute on function public.dept_home() to authenticated;

-- 5) home_feed 재정의 (00030 전체 복제 + 공지 전교회 한정) — 부서 공지는 dept_home으로 분리
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
      where church_id = my_church_id() and status = 'pending') end
  )
$$;
grant execute on function home_feed to authenticated;
