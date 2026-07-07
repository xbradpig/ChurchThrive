-- 말씀노트 모듈 (church-stats-upgrade Phase 4, detail_goal §3-3)
-- 프라이버시 선제 확정: 내용(body)은 본인만 — 스태프·superadmin도 열람 불가.
-- 통계는 "작성 여부/건수"만 security definer RPC로 집계.

create schema if not exists mod_note;
grant usage on schema mod_note to authenticated, service_role;

create table mod_note.notes (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id),
  member_id uuid not null references public.members(id),
  week_start date not null,                                  -- 주일 기준 (KST, 일요일 시작)
  bulletin_issue_id uuid,                                    -- mod_bulletin.issues 연결 (주보 없는 주 대비 nullable)
  title text,
  body_md text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_note_church_week on mod_note.notes (church_id, week_start desc);
create index idx_note_member on mod_note.notes (member_id, week_start desc);

alter table mod_note.notes enable row level security;
grant select, insert, update, delete on mod_note.notes to authenticated;
grant all on mod_note.notes to service_role;

-- 본인만 — 어떤 역할도 타인 노트 접근 불가 (D3 프라이버시 원칙)
create policy note_own on mod_note.notes for all to authenticated
  using (church_id = (select public.my_church_id()) and public.module_enabled('note')
         and member_id = public.my_member_id())
  with check (church_id = (select public.my_church_id()) and public.module_enabled('note')
         and member_id = public.my_member_id());

create or replace function public.tg_note_updated() returns trigger
language plpgsql as $$
begin new.updated_at := now(); return new; end $$;
create trigger note_updated before update on mod_note.notes
  for each row execute function public.tg_note_updated();

-- ===== 노트 통계 — 건수/작성 여부만 (내용·제목 비노출) =====
create or replace function public.stats_notes(p_weeks int default 13) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v_cid uuid := my_church_id();
begin
  if not module_enabled('note') then return null; end if;
  -- checker 제외 (권한 매트릭스: 암송/노트 checker ✕)
  if my_role() not in ('superadmin','pastor','dept_leader') then return null; end if;
  return jsonb_build_object(
    'weekly', (
      select coalesce(jsonb_agg(jsonb_build_object('week', wk, 'writers', writers, 'notes', notes)
                                order by wk), '[]'::jsonb) from (
        select n.week_start wk, count(distinct n.member_id) writers, count(*) notes
        from mod_note.notes n
        where n.church_id = v_cid and n.week_start >= week_sunday(kst_today()) - (p_weeks - 1) * 7
        group by 1) t),
    'this_week_rate', (
      select jsonb_build_object(
        'writers', count(distinct n.member_id),
        'target', (select count(*) from members m
                   where m.church_id = v_cid and m.status = 'active'
                     and m.member_type = 'registered' and m.user_id is not null))
      from mod_note.notes n
      where n.church_id = v_cid and n.week_start = week_sunday(kst_today())),
    'streaks', (
      -- 연속 작성 주차 (이번 주 또는 지난주부터 거슬러 연속)
      select coalesce(jsonb_agg(jsonb_build_object('name', name, 'streak', streak)
                                order by streak desc), '[]'::jsonb) from (
        select m.name || coalesce(m.name_suffix, '') as name,
               (select count(*) from generate_series(0, 51) g
                where not exists (
                  select 1 from generate_series(0, g.g) g2
                  where not exists (select 1 from mod_note.notes n
                                    where n.member_id = m.id
                                      and n.week_start = week_sunday(kst_today()) - g2 * 7))) streak
        from members m
        where m.church_id = v_cid and m.status = 'active'
          and exists (select 1 from mod_note.notes n where n.member_id = m.id)
        order by 2 desc limit 10) t
      where streak > 0),
    'total_notes', (select count(*) from mod_note.notes n where n.church_id = v_cid));
end $$;

-- ===== 종합 참여 점수 (detail_goal §3-5) =====
-- 축: 최근 13주 예배 출석 주수 / 암송 체크 / 노트 작성 주수 / 훈련 수강
-- 개인 비노출 원칙: 구간 인원수 + "심방 후보" 명단만 (점수·등급 라벨 없음)
create or replace function public.participation_overview() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_cid uuid := my_church_id();
  v_dept uuid := null;
begin
  if my_role() not in ('superadmin','pastor','dept_leader') then return null; end if;
  if my_role() = 'dept_leader' then
    select * into v_dept from my_led_departments() limit 1;
  end if;
  return (
    with axes as (
      select m.id, m.name || coalesce(m.name_suffix, '') as name, m.care_target,
        (select count(distinct week_sunday(a.event_date)) from attendances a
         join events e on e.id = a.event_id
         where a.member_id = m.id and a.approved and e.category = 'worship'
           and a.event_date >= week_sunday(kst_today()) - 12 * 7) att_wk,
        case when module_enabled('verse') then
          (select count(*) from mod_verse.checks c
           where c.member_id = m.id and c.checked_at >= now() - interval '91 days') else 0 end verse_cnt,
        case when module_enabled('note') then
          (select count(distinct n.week_start) from mod_note.notes n
           where n.member_id = m.id and n.week_start >= week_sunday(kst_today()) - 12 * 7) else 0 end note_wk,
        case when module_enabled('training') then
          (select count(*) from mod_training.enrollments t
           where t.member_id = m.id and t.status in ('enrolled','completed')) else 0 end training
      from members m
      where m.church_id = v_cid and m.status = 'active' and m.member_type = 'registered'
        and (v_dept is null or exists (select 1 from department_members dm
                                       where dm.member_id = m.id and dm.department_id = v_dept))),
    scored as (
      select *,
        (case when att_wk >= 6 then 2 when att_wk >= 2 then 1 else 0 end
         + case when verse_cnt >= 4 then 1 else 0 end
         + case when note_wk >= 4 then 1 else 0 end
         + case when training > 0 then 1 else 0 end) score
      from axes)
    select jsonb_build_object(
      'bands', jsonb_build_object(
        'engaged', (select count(*) from scored where score >= 3),
        'steady',  (select count(*) from scored where score between 1 and 2),
        'at_risk', (select count(*) from scored where score = 0)),
      'visit_candidates', (
        -- 심방 후보: 참여 축 전무 — 이름만, 점수·등급 비노출 (낙인 방지)
        select coalesce(jsonb_agg(jsonb_build_object('name', name, 'care', care_target)), '[]'::jsonb)
        from (select name, care_target from scored where score = 0
              order by care_target desc, name limit 20) t),
      'axes_avg', jsonb_build_object(
        'att_wk', (select round(avg(att_wk), 1) from scored),
        'verse', (select round(avg(verse_cnt), 1) from scored),
        'note_wk', (select round(avg(note_wk), 1) from scored))));
end $$;

grant execute on function public.stats_notes, public.participation_overview to authenticated;
