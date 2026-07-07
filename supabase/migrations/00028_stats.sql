-- 교회 현황 통계 (church-stats-upgrade Phase 1~3)
-- 원칙: 차단은 UI 분기가 아닌 RPC/RLS 계층. 주간 = KST, 일요일 시작. (detail_goal §5)

-- ===== 0) KST 헬퍼 =====
create or replace function kst_today() returns date
language sql stable as $$ select (now() at time zone 'Asia/Seoul')::date $$;

-- 일요일 시작 주의 첫날 (교회 주일 기준)
create or replace function week_sunday(p date) returns date
language sql immutable as $$ select p - extract(dow from p)::int $$;

-- ===== 1) 대표 교역자(담임목사) 지정 =====
alter table churches add column if not exists senior_pastor_user_id uuid references auth.users(id);

create or replace function is_senior_pastor() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from churches c
                 where c.id = my_church_id() and c.senior_pastor_user_id = auth.uid())
$$;

-- 지정/해제 (superadmin 전용) — 지정 시 giving viewer 자동 부여, 모두 감사 기록 (D2)
create or replace function set_senior_pastor(p_user_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_church uuid := my_church_id();
begin
  if my_role() <> 'superadmin' then raise exception 'superadmin only'; end if;
  update churches set senior_pastor_user_id = p_user_id where id = v_church;
  if p_user_id is not null then
    insert into module_grants (church_id, user_id, module, level, granted_by)
    values (v_church, p_user_id, 'giving', 'viewer', auth.uid())
    on conflict (church_id, user_id, module) do nothing;
  end if;
  insert into audit_log (actor_user_id, action, target_table, target_id, after_json, church_id)
  values (auth.uid(), case when p_user_id is null then 'senior_pastor_unset' else 'senior_pastor_set' end,
          'churches', v_church::text, jsonb_build_object('senior_pastor_user_id', p_user_id), v_church);
end $$;

-- ===== 2) giving grant 부여 권한 강화 =====
-- 기존 mgrant_write는 pastor 전체 허용 → giving은 superadmin 또는 담임목사만 (2026-07-07 확정, decisions D2)
drop policy if exists mgrant_write on module_grants;
create policy mgrant_write on module_grants for all to authenticated
  using (church_id = (select my_church_id())
         and case when module = 'giving'
             then (my_role() = 'superadmin' or is_senior_pastor())
             else my_role() in ('superadmin','pastor') end)
  with check (church_id = (select my_church_id())
         and case when module = 'giving'
             then (my_role() = 'superadmin' or is_senior_pastor())
             else my_role() in ('superadmin','pastor') end);

-- 재정 열람 자격: superadmin / 담임목사 / giving grant(viewer+) — 일반 pastor 불가
create or replace function can_view_giving() returns boolean
language sql stable security definer set search_path = public as $$
  select my_role() = 'superadmin' or is_senior_pastor()
      or exists (select 1 from module_grants mg
                 where mg.church_id = my_church_id()
                   and mg.user_id = auth.uid() and mg.module = 'giving')
$$;

-- ===== 3) 오버뷰 stats_overview() — 역할별 조립 (home_feed 패턴) =====
create or replace function stats_overview() returns jsonb
language sql stable security definer set search_path = public as $$
  with base as (
    select my_church_id() cid, kst_today() today,
           week_sunday(kst_today()) w0, week_sunday(kst_today()) - 7 w1
  )
  select case when not is_staff() and my_role() <> 'checker' then null else jsonb_build_object(
    'sunday_att', (select count(*) from attendances a join events e on e.id = a.event_id, base b
                   where a.church_id = b.cid and a.approved and e.category = 'worship'
                     and a.event_date = b.w0),
    'sunday_att_prev', (select count(*) from attendances a join events e on e.id = a.event_id, base b
                        where a.church_id = b.cid and a.approved and e.category = 'worship'
                          and a.event_date = b.w1),
    'today_att', (select count(*) from attendances a, base b
                  where a.church_id = b.cid and a.event_date = b.today),
    -- checker = 출석 KPI만 (권한 매트릭스) — is_staff()는 checker 포함이므로 명시적 역할 목록 사용
    'new_families', case when my_role() in ('superadmin','pastor','dept_leader') then (
      select count(*) from members m, base b
      where m.church_id = b.cid and m.member_type = 'new_family' and m.status = 'active'
        and (m.created_at at time zone 'Asia/Seoul')::date >= b.w0) end,
    'new_families_prev', case when my_role() in ('superadmin','pastor','dept_leader') then (
      select count(*) from members m, base b
      where m.church_id = b.cid and m.member_type = 'new_family' and m.status = 'active'
        and (m.created_at at time zone 'Asia/Seoul')::date between b.w1 and b.w0 - 1) end,
    'members_active', case when my_role() in ('superadmin','pastor','dept_leader') then (
      select count(*) from members m, base b
      where m.church_id = b.cid and m.status = 'active' and m.member_type = 'registered') end,
    'verse', case when my_role() in ('superadmin','pastor','dept_leader') and module_enabled('verse') then (
      select jsonb_build_object('reference', a.reference, 'week_start', a.week_start,
               'checked', (select count(*) from mod_verse.checks c where c.assignment_id = a.id),
               'target', (select count(*) from members m
                          where m.church_id = a.church_id and m.status = 'active' and m.member_type = 'registered'
                            and (a.target_department_id is null
                                 or exists (select 1 from department_members dm
                                            where dm.member_id = m.id and dm.department_id = a.target_department_id))))
      from mod_verse.assignments a, base b where a.church_id = b.cid
      order by a.week_start desc limit 1) end,
    'absentees_3w', case when my_role() in ('superadmin','pastor','dept_leader') then (
      select count(*) from absentee_list(3)) end,
    'giving_week', case when can_view_giving() and module_enabled('giving') then (
      select jsonb_build_object('total', coalesce(sum(g.amount), 0),
                                'households', count(distinct g.member_id))
      from mod_giving.records g, base b
      where g.church_id = b.cid and g.given_on >= b.w0) end,
    'todo', jsonb_build_object(
      'join_pending', case when my_role() in ('superadmin','pastor') then (
        select count(*) from join_requests j, base b
        where j.church_id = b.cid and j.status = 'pending') end,
      'newcomer_stall', case when is_staff() and module_enabled('newcomer') then (
        select count(*) from mod_newcomer.progress p, base b
        where p.church_id = b.cid and p.stage = 1
          and p.updated_at < now() - interval '48 hours') end,
      'selfcheck_pending', case when my_role() in ('superadmin','pastor','checker','dept_leader') then (
        select count(*) from attendances a, base b
        where a.church_id = b.cid and a.approved = false) end,
      'visit_requested', case when my_role() in ('superadmin','pastor') and module_enabled('visitation') then (
        select count(*) from mod_visitation.visits v, base b
        where v.church_id = b.cid and v.status = 'requested') end)
  ) end
$$;

-- ===== 4) 출석 stats_attendance(p_weeks) =====
-- dept_leader는 자기 부서로 자동 축소 (파라미터 조작 무력화 — goal.md DoD ③)
create or replace function stats_attendance(p_weeks int default 13, p_dept uuid default null)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_cid uuid := my_church_id();
  v_from date := week_sunday(kst_today()) - (p_weeks - 1) * 7;
  v_dept uuid := p_dept;
begin
  if not is_staff() and my_role() <> 'checker' then return null; end if;
  -- 부서담당자: 지정 부서가 자기 담당이 아니면 첫 담당 부서로 강제
  if my_role() = 'dept_leader' then
    if v_dept is null or v_dept not in (select my_led_departments()) then
      select * into v_dept from my_led_departments() limit 1;
    end if;
  end if;
  return jsonb_build_object(
    'weekly', (
      select coalesce(jsonb_agg(x order by x->>'week'), '[]'::jsonb) from (
        select jsonb_build_object('week', week_sunday(a.event_date), 'category', e.category,
                                  'cnt', count(distinct a.member_id)) x
        from attendances a join events e on e.id = a.event_id
        where a.church_id = v_cid and a.approved and a.event_date >= v_from
          and (v_dept is null or exists (select 1 from department_members dm
                                         where dm.member_id = a.member_id and dm.department_id = v_dept))
        group by week_sunday(a.event_date), e.category) t),
    'yoy', (
      select coalesce(jsonb_agg(x order by x->>'week'), '[]'::jsonb) from (
        select jsonb_build_object('week', week_sunday(a.event_date) + 364, 'cnt', count(distinct a.member_id)) x
        from attendances a join events e on e.id = a.event_id
        where a.church_id = v_cid and a.approved and e.category = 'worship'
          and a.event_date >= v_from - 364 and a.event_date < v_from - 364 + p_weeks * 7
          and (v_dept is null or exists (select 1 from department_members dm
                                         where dm.member_id = a.member_id and dm.department_id = v_dept))
        group by week_sunday(a.event_date)) t),
    'by_dept', case when v_dept is null then (
      select coalesce(jsonb_agg(x order by (x->>'cnt')::int desc), '[]'::jsonb) from (
        select jsonb_build_object('dept', d.name, 'cnt', count(distinct a.member_id)) x
        from attendances a
        join department_members dm on dm.member_id = a.member_id
        join departments d on d.id = dm.department_id
        where a.church_id = v_cid and a.approved and a.event_date >= week_sunday(kst_today()) - 28
        group by d.name) t) end,
    'method_dist', (
      select coalesce(jsonb_object_agg(method, cnt), '{}'::jsonb) from (
        select a.method, count(*) cnt from attendances a
        where a.church_id = v_cid and a.event_date >= v_from group by a.method) t),
    'consistency', (
      -- 최근 13주 예배 출석 주수 기준: 11+ 매주 / 6+ 격주 / 2+ 월1회 / <2 이탈위험
      select jsonb_build_object(
        'weekly',   count(*) filter (where wk >= 11),
        'biweekly', count(*) filter (where wk between 6 and 10),
        'monthly',  count(*) filter (where wk between 2 and 5),
        'at_risk',  count(*) filter (where wk < 2))
      from (
        select m.id, count(distinct week_sunday(a.event_date)) wk
        from members m
        left join attendances a on a.member_id = m.id and a.approved
          and a.event_date >= week_sunday(kst_today()) - 12 * 7
          and exists (select 1 from events e where e.id = a.event_id and e.category = 'worship')
        where m.church_id = v_cid and m.status = 'active' and m.member_type = 'registered'
          and (v_dept is null or exists (select 1 from department_members dm
                                         where dm.member_id = m.id and dm.department_id = v_dept))
        group by m.id) t),
    'funnel', case when module_enabled('newcomer') and my_role() in ('superadmin','pastor') then (
      select jsonb_build_object(
        'registered', count(*),
        'returned_4w', count(*) filter (where exists (
          select 1 from attendances a where a.member_id = m.id and a.approved
            and a.event_date > (m.created_at at time zone 'Asia/Seoul')::date
            and a.event_date <= (m.created_at at time zone 'Asia/Seoul')::date + 28)),
        'stages', (select coalesce(jsonb_object_agg('s' || stage, c), '{}'::jsonb) from (
          select p.stage, count(*) c from mod_newcomer.progress p
          where p.church_id = v_cid group by p.stage) s))
      from members m
      where m.church_id = v_cid and m.member_type = 'new_family'
        and m.created_at >= now() - interval '180 days') end);
end $$;

-- ===== 5) 교적 stats_members() =====
create or replace function stats_members() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_cid uuid := my_church_id();
  v_dept uuid := null;
begin
  if my_role() not in ('superadmin','pastor','dept_leader') then return null; end if;
  if my_role() = 'dept_leader' then
    select * into v_dept from my_led_departments() limit 1;
  end if;
  return jsonb_build_object(
    'by_status', (
      select coalesce(jsonb_object_agg(status, cnt), '{}'::jsonb) from (
        select m.status, count(*) cnt from members m
        where m.church_id = v_cid
          and (v_dept is null or exists (select 1 from department_members dm
                                         where dm.member_id = m.id and dm.department_id = v_dept))
        group by m.status) t),
    'by_position', (
      select coalesce(jsonb_agg(x order by (x->>'cnt')::int desc), '[]'::jsonb) from (
        select jsonb_build_object('label', coalesce(nullif(m.position, ''), '평신도'), 'cnt', count(*)) x
        from members m where m.church_id = v_cid and m.status = 'active'
          and (v_dept is null or exists (select 1 from department_members dm
                                         where dm.member_id = m.id and dm.department_id = v_dept))
        group by coalesce(nullif(m.position, ''), '평신도')) t),
    'by_age', (
      select coalesce(jsonb_agg(jsonb_build_object('label', band, 'cnt', cnt) order by band), '[]'::jsonb) from (
        select case when age < 20 then '0_19' when age < 40 then '20_39'
                    when age < 60 then '40_59' when age < 80 then '60_79' else '80_' end band,
               count(*) cnt
        from (select extract(year from age(kst_today(), m.birthday))::int age
              from members m where m.church_id = v_cid and m.status = 'active' and m.birthday is not null
                and (v_dept is null or exists (select 1 from department_members dm
                                               where dm.member_id = m.id and dm.department_id = v_dept))) a
        group by 1) t),
    'no_birthday', (select count(*) from members m
                    where m.church_id = v_cid and m.status = 'active' and m.birthday is null
                      and (v_dept is null or exists (select 1 from department_members dm
                                                     where dm.member_id = m.id and dm.department_id = v_dept))),
    'by_dept', case when v_dept is null then (
      select coalesce(jsonb_agg(x order by (x->>'cnt')::int desc), '[]'::jsonb) from (
        select jsonb_build_object('label', d.name, 'cnt', count(dm.member_id)) x
        from departments d
        left join department_members dm on dm.department_id = d.id
        left join members m on m.id = dm.member_id and m.status = 'active'
        where d.church_id = v_cid group by d.name) t) end,
    'monthly_reg', (
      select coalesce(jsonb_agg(jsonb_build_object('month', mon, 'cnt', cnt) order by mon), '[]'::jsonb) from (
        select to_char((m.created_at at time zone 'Asia/Seoul'), 'YYYY-MM') mon, count(*) cnt
        from members m where m.church_id = v_cid and m.created_at >= now() - interval '12 months'
        group by 1) t),
    -- 전출입: 기존 audit_log의 status 전환 추출 (analysis §3-5 재분류 — 전용 이력 테이블 불필요)
    'monthly_transitions', case when my_role() in ('superadmin','pastor') then (
      select coalesce(jsonb_agg(jsonb_build_object('month', mon, 'outflow', outflow, 'restored', restored)
                                order by mon), '[]'::jsonb) from (
        select to_char((l.at at time zone 'Asia/Seoul'), 'YYYY-MM') mon,
          count(*) filter (where l.after_json->>'status' in ('moved','inactive','deceased')
                             and l.before_json->>'status' = 'active') outflow,
          count(*) filter (where l.after_json->>'status' = 'active'
                             and l.before_json->>'status' <> 'active') restored
        from audit_log l
        where l.target_table = 'members'
          -- 00001 트리거는 church_id 미기록 → row json에서 귀속 (테넌트 오귀속 방지)
          and coalesce(l.church_id, (l.after_json->>'church_id')::uuid) = v_cid
          and l.before_json->>'status' is distinct from l.after_json->>'status'
          and l.at >= now() - interval '12 months'
        group by 1) t) end,
    'history_since', (select to_char(min(l.at at time zone 'Asia/Seoul'), 'YYYY-MM-DD') from audit_log l
                      where l.target_table = 'members'
                        and coalesce(l.church_id, (l.after_json->>'church_id')::uuid) = v_cid));
end $$;

-- ===== 6) 암송 stats_verse(p_weeks) — RPC 경계 뒤 배치 (Family_Verse 이전 대비) =====
create or replace function stats_verse(p_weeks int default 13) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v_cid uuid := my_church_id();
begin
  if not module_enabled('verse') then return null; end if;
  -- checker 제외 (권한 매트릭스: 암송/노트 checker ✕) — verse grant 보유자는 허용
  if not (my_role() in ('superadmin','pastor','dept_leader') or has_module('verse', 'viewer')) then
    return null;
  end if;
  return jsonb_build_object(
    'weekly', (
      select coalesce(jsonb_agg(x order by x->>'week'), '[]'::jsonb) from (
        select jsonb_build_object('week', a.week_start, 'reference', a.reference,
          'checked', (select count(*) from mod_verse.checks c where c.assignment_id = a.id),
          'target', (select count(*) from members m
                     where m.church_id = v_cid and m.status = 'active' and m.member_type = 'registered'
                       and (a.target_department_id is null
                            or exists (select 1 from department_members dm
                                       where dm.member_id = m.id and dm.department_id = a.target_department_id)))) x
        from mod_verse.assignments a
        where a.church_id = v_cid and a.week_start >= week_sunday(kst_today()) - (p_weeks - 1) * 7) t),
    'by_dept', (
      select coalesce(jsonb_agg(x order by (x->>'rate')::numeric desc), '[]'::jsonb) from (
        select jsonb_build_object('label', d.name,
          'checked', count(c.member_id), 'total', count(dm.member_id),
          'rate', round(count(c.member_id)::numeric / greatest(count(dm.member_id), 1) * 100)) x
        from departments d
        join department_members dm on dm.department_id = d.id
        join members m on m.id = dm.member_id and m.status = 'active'
        left join mod_verse.checks c on c.member_id = m.id
          and c.assignment_id = (select a.id from mod_verse.assignments a
                                 where a.church_id = v_cid order by a.week_start desc limit 1)
        where d.church_id = v_cid group by d.name) t),
    'streaks', (
      -- 최신 과제부터 연속 체크 주차 (YouVersion 스트릭 패턴)
      select coalesce(jsonb_agg(x order by (x->>'streak')::int desc), '[]'::jsonb) from (
        select jsonb_build_object('name', m.name || coalesce(m.name_suffix, ''),
                                  'streak', coalesce(fm.miss - 1, ac.total)) x
        from members m
        cross join (select count(*) total from mod_verse.assignments where church_id = v_cid) ac
        left join lateral (
          select min(a.rn) miss from (
            select a2.id, row_number() over (order by a2.week_start desc) rn
            from mod_verse.assignments a2 where a2.church_id = v_cid) a
          where not exists (select 1 from mod_verse.checks c
                            where c.assignment_id = a.id and c.member_id = m.id)) fm on true
        where m.church_id = v_cid and m.status = 'active'
          and coalesce(fm.miss - 1, ac.total) > 0
        order by coalesce(fm.miss - 1, ac.total) desc limit 10) t),
    'wau', (select count(distinct c.member_id) from mod_verse.checks c
            where c.church_id = v_cid and c.checked_at >= now() - interval '7 days'),
    'year_review', (
      select jsonb_build_object(
        'checks', count(*), 'participants', count(distinct c.member_id),
        'assignments', (select count(*) from mod_verse.assignments a
                        where a.church_id = v_cid
                          and extract(year from a.week_start) = extract(year from kst_today())))
      from mod_verse.checks c
      where c.church_id = v_cid
        and extract(year from (c.checked_at at time zone 'Asia/Seoul')) = extract(year from kst_today())));
end $$;

-- ===== 7) 재정 stats_giving / giving_ledger — can_view_giving() 게이트 =====
create or replace function stats_giving(p_months int default 12) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v_cid uuid := my_church_id();
begin
  if not (module_enabled('giving') and can_view_giving()) then return null; end if;
  return jsonb_build_object(
    'monthly', (
      select coalesce(jsonb_agg(jsonb_build_object('month', mon, 'fund', fund, 'total', total)
                                order by mon), '[]'::jsonb) from (
        select to_char(g.given_on, 'YYYY-MM') mon, g.fund, sum(g.amount) total
        from mod_giving.records g
        where g.church_id = v_cid and g.given_on >= kst_today() - (p_months * 31)
        group by 1, g.fund) t),
    'weekly_households', (
      select coalesce(jsonb_agg(jsonb_build_object('week', wk, 'households', hh, 'total', total)
                                order by wk), '[]'::jsonb) from (
        select week_sunday(g.given_on) wk, count(distinct g.member_id) hh, sum(g.amount) total
        from mod_giving.records g
        where g.church_id = v_cid and g.given_on >= week_sunday(kst_today()) - 12 * 7
        group by 1) t),
    'segments', (
      -- 최근 6개월 헌금 월수 기준: 5+ 정기 / 1~4 간헐 / 최근 90일 첫 헌금 신규 / 직전 6개월 있었으나 최근 2개월 없음 중단
      select jsonb_build_object(
        'regular',    count(*) filter (where months >= 5),
        'occasional', count(*) filter (where months between 1 and 4 and not is_new),
        'new',        count(*) filter (where is_new),
        'lapsed', (select count(distinct g.member_id) from mod_giving.records g
                   where g.church_id = v_cid
                     and g.given_on >= kst_today() - 240 and g.given_on < kst_today() - 60
                     and not exists (select 1 from mod_giving.records g2
                                     where g2.church_id = v_cid and g2.member_id = g.member_id
                                       and g2.given_on >= kst_today() - 60)))
      from (
        select g.member_id,
               count(distinct to_char(g.given_on, 'YYYY-MM')) months,
               (min(g.first_on) >= kst_today() - 90) as is_new
        from (select member_id, given_on, min(given_on) over (partition by member_id) first_on
              from mod_giving.records where church_id = v_cid) g
        where g.given_on >= kst_today() - 180
        group by g.member_id) t),
    'ytd', (select coalesce(sum(g.amount), 0) from mod_giving.records g
            where g.church_id = v_cid
              and extract(year from g.given_on) = extract(year from kst_today())));
end $$;

-- 개인별 명세 (열람 — viewer+ 조회 가능. 입력·수정은 기존 g_ins RLS: manager+)
create or replace function giving_ledger(p_from date, p_to date)
returns table (given_on date, member_name text, fund text, amount int, note text)
language sql stable security definer set search_path = public as $$
  select g.given_on, m.name || coalesce(m.name_suffix, ''), g.fund, g.amount, g.note
  from mod_giving.records g join members m on m.id = g.member_id
  where g.church_id = my_church_id() and module_enabled('giving') and can_view_giving()
    and g.given_on between p_from and p_to
  order by g.given_on desc, m.name collate "ko-KR-x-icu"
$$;

grant execute on function kst_today, week_sunday, is_senior_pastor, set_senior_pastor,
  can_view_giving, stats_overview, stats_attendance, stats_members, stats_verse,
  stats_giving, giving_ledger to authenticated;

-- ===== 8) 주간 다이제스트용 (service_role 전용 — send-digest.mjs, absentee_list_for 패턴) =====
create or replace function stats_digest_for(p_user_id uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  with tc as (
    select coalesce(
      (select church_id from active_church where user_id = p_user_id),
      (select church_id from church_roles where user_id = p_user_id limit 1)) as cid
  ), tr as (
    select role from church_roles cr, tc where cr.user_id = p_user_id and cr.church_id = tc.cid
    order by case role when 'superadmin' then 0 when 'pastor' then 1
             when 'dept_leader' then 2 else 3 end limit 1
  ), can_g as (
    select (select role from tr) = 'superadmin'
        or exists (select 1 from churches c, tc where c.id = tc.cid and c.senior_pastor_user_id = p_user_id)
        or exists (select 1 from module_grants mg, tc
                   where mg.church_id = tc.cid and mg.user_id = p_user_id and mg.module = 'giving') as ok
  )
  select case when (select role from tr) not in ('superadmin','pastor','dept_leader') then null
  else jsonb_build_object(
    'sunday_att', (select count(*) from attendances a join events e on e.id = a.event_id, tc
                   where a.church_id = tc.cid and a.approved and e.category = 'worship'
                     and a.event_date = week_sunday(kst_today())),
    'new_families', (select count(*) from members m, tc
                     where m.church_id = tc.cid and m.member_type = 'new_family' and m.status = 'active'
                       and (m.created_at at time zone 'Asia/Seoul')::date >= week_sunday(kst_today())),
    'absentees_3w', (select count(*) from absentee_list_for(p_user_id, 3)),
    -- 재정 수치는 열람 자격자에게만 포함 (detail_goal §2-④)
    'giving_week', case when (select ok from can_g) then (
      select coalesce(sum(g.amount), 0) from mod_giving.records g, tc
      where g.church_id = tc.cid and g.given_on >= week_sunday(kst_today())) end) end
$$;
revoke execute on function stats_digest_for from public, authenticated;
grant execute on function stats_digest_for to service_role;
