-- 00033: 암송 위젯 고도화 — 부서 스코핑 + streak + 완료율 (홈 고도화 5단계)
-- docs/Task_Work/2026-07-08_verse-widget-upgrade/detail_goal.md
-- verse_current에 부서 필터·컬럼 추가(교인은 전교회+내 부서, 직원은 전체), verse_home 신설

-- 1) verse_current v2 (컬럼 추가 → DROP 후 재생성)
drop function if exists public.verse_current();
create function public.verse_current()
returns table (id uuid, week_start date, reference text, body text, guide text,
               checked boolean, check_count bigint, target_count bigint,
               target_department_id uuid, dept_name text)
language sql stable security invoker set search_path = public, mod_verse as $$
  select a.id, a.week_start, a.reference, a.body, a.guide,
    exists (select 1 from mod_verse.checks c
            where c.assignment_id = a.id and c.member_id = public.my_member_id()),
    (select count(*) from mod_verse.checks c where c.assignment_id = a.id),
    (select count(*) from public.members m
      where m.church_id = a.church_id and m.status = 'active' and m.member_type = 'registered'
        and (a.target_department_id is null
             or exists (select 1 from public.department_members dm
                        where dm.member_id = m.id and dm.department_id = a.target_department_id))),
    a.target_department_id,
    (select d.name from public.departments d where d.id = a.target_department_id)
  from mod_verse.assignments a
  where a.church_id = (select public.my_church_id())
    and (public.is_staff()
         or a.target_department_id is null
         or a.target_department_id in (select public.my_dept_ids()))
  order by a.week_start desc, (a.target_department_id is not null) desc
  limit 8
$$;
grant execute on function public.verse_current() to authenticated;

-- 2) verse_home — 부서 우선 현재 암송 + streak + 완료율 (홈 위젯)
create or replace function public.verse_home()
returns jsonb
language plpgsql stable security invoker set search_path = public, mod_verse as $$
declare
  a record;
  r record;
  v_streak int := 0;
  v_skipped boolean := false;
  v_started boolean := false;
begin
  if not module_enabled('verse') or my_member_id() is null then return null; end if;

  -- 현재 암송: 내게 적용되는 것 중 최근 주, 같은 주는 부서 우선
  select x.* into a from (
    select a2.id, a2.reference, a2.body, a2.guide, a2.target_department_id,
      exists (select 1 from mod_verse.checks c where c.assignment_id = a2.id and c.member_id = my_member_id()) as checked,
      (select count(*) from mod_verse.checks c where c.assignment_id = a2.id) as check_count,
      (select count(*) from members m
        where m.church_id = a2.church_id and m.status = 'active' and m.member_type = 'registered'
          and (a2.target_department_id is null
               or exists (select 1 from department_members dm
                          where dm.member_id = m.id and dm.department_id = a2.target_department_id))) as target_count,
      (select d.name from departments d where d.id = a2.target_department_id) as dept_name
    from mod_verse.assignments a2
    where a2.church_id = my_church_id()
      and (a2.target_department_id is null or a2.target_department_id in (select my_dept_ids()))
    order by a2.week_start desc, (a2.target_department_id is not null) desc
    limit 1
  ) x;

  if a.id is null then return null; end if;

  -- streak: 주별(부서 우선) 최신순 연속 체크 (현재 진행주 1회 미체크 허용)
  for r in
    select w.checked from (
      select distinct on (a3.week_start) a3.week_start,
        exists (select 1 from mod_verse.checks c where c.assignment_id = a3.id and c.member_id = my_member_id()) as checked
      from mod_verse.assignments a3
      where a3.church_id = my_church_id()
        and (a3.target_department_id is null or a3.target_department_id in (select my_dept_ids()))
      order by a3.week_start desc, (a3.target_department_id is not null) desc
    ) w
    order by w.week_start desc
  loop
    if r.checked then
      v_streak := v_streak + 1; v_started := true;
    else
      if v_started then exit;
      elsif not v_skipped then v_skipped := true;   -- 진행 중 현재주 1회만 건너뜀
      else exit;
      end if;
    end if;
  end loop;

  return jsonb_build_object(
    'id', a.id, 'reference', a.reference, 'body', a.body, 'guide', a.guide,
    'checked', a.checked, 'dept_name', a.dept_name, 'streak', v_streak,
    'check_count', a.check_count, 'target_count', a.target_count
  );
end $$;
grant execute on function public.verse_home() to authenticated;
