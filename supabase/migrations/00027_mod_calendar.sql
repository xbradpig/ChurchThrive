-- 00027: 행사 모듈 (mod_calendar) — 날짜 기반 교회 행사·부서 일정
-- docs/Task_Work/2026-07-07_calendar-events-module/detail_goal.md W1
-- 역할 분담: 반복 예배 규칙 = public.events / 날짜 행사 = mod_calendar.events

create schema if not exists mod_calendar;
grant usage on schema mod_calendar to authenticated, service_role;

create table mod_calendar.events (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id),
  title text not null,
  description text,
  category text not null default 'other'
    check (category in ('worship','education','fellowship','outreach','meeting','other')),
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text,
  target_department_id uuid references public.departments(id),  -- null = 전교회
  visibility text not null default 'member' check (visibility in ('public','member')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  check (ends_at is null or ends_at >= starts_at)
);
create index idx_cal_events_church on mod_calendar.events (church_id, starts_at);

alter table mod_calendar.events enable row level security;
grant select, insert, update, delete on all tables in schema mod_calendar to authenticated;
grant all on all tables in schema mod_calendar to service_role;

-- 쓰기 자격: 교역자/관리자 · calendar manager 권한자 · 부서 담당자(자기 부서 타겟 행사 한정)
create or replace function mod_calendar.can_write(p_dept uuid)
returns boolean language sql stable security invoker as $$
  select public.my_role() in ('superadmin','pastor')
      or public.has_module('calendar', 'manager')
      or (p_dept is not null and p_dept in (select public.my_led_departments()))
$$;

create policy cal_select on mod_calendar.events for select to authenticated
  using (church_id = (select public.my_church_id()) and public.module_enabled('calendar'));
create policy cal_insert on mod_calendar.events for insert to authenticated
  with check (church_id = (select public.my_church_id()) and public.module_enabled('calendar')
              and mod_calendar.can_write(target_department_id));
create policy cal_update on mod_calendar.events for update to authenticated
  using (church_id = (select public.my_church_id()) and public.module_enabled('calendar')
         and mod_calendar.can_write(target_department_id))
  with check (church_id = (select public.my_church_id()) and mod_calendar.can_write(target_department_id));
create policy cal_delete on mod_calendar.events for delete to authenticated
  using (church_id = (select public.my_church_id()) and public.module_enabled('calendar')
         and mod_calendar.can_write(target_department_id));

-- ===== RPC (SECURITY INVOKER — 모듈 규약: RLS 그대로 적용) =====

-- 다가오는 행사: 전교회 + 내 부서 (직원·부서담당자·체커는 전체 부서 행사 열람)
create or replace function public.calendar_upcoming(p_limit int default 5)
returns table (id uuid, title text, category text, starts_at timestamptz, ends_at timestamptz,
               location text, visibility text, department_id uuid, department_name text)
language sql stable security invoker as $$
  select e.id, e.title, e.category, e.starts_at, e.ends_at, e.location, e.visibility,
         e.target_department_id, d.name
  from mod_calendar.events e
  left join public.departments d on d.id = e.target_department_id
  where e.church_id = (select public.my_church_id())
    and coalesce(e.ends_at, e.starts_at) >= date_trunc('day', now())
    and (e.target_department_id is null
         or public.is_staff()
         or exists (select 1 from public.department_members dm
                    where dm.member_id = public.my_member_id()
                      and dm.department_id = e.target_department_id))
  order by e.starts_at
  limit greatest(1, least(p_limit, 50))
$$;

-- 관리 목록 (과거 포함 옵션)
create or replace function public.calendar_admin_list(p_past boolean default false)
returns table (id uuid, title text, description text, category text, starts_at timestamptz,
               ends_at timestamptz, location text, visibility text, department_id uuid, department_name text)
language sql stable security invoker as $$
  select e.id, e.title, e.description, e.category, e.starts_at, e.ends_at, e.location,
         e.visibility, e.target_department_id, d.name
  from mod_calendar.events e
  left join public.departments d on d.id = e.target_department_id
  where e.church_id = (select public.my_church_id())
    and (p_past or coalesce(e.ends_at, e.starts_at) >= date_trunc('day', now()))
  order by e.starts_at
  limit 200
$$;

-- 저장 (id 있으면 수정, 없으면 생성 — 권한 판정은 RLS)
create or replace function public.calendar_save(p jsonb)
returns uuid
language plpgsql security invoker as $$
declare eid uuid := nullif(p->>'id', '')::uuid;
begin
  if eid is null then
    insert into mod_calendar.events
      (church_id, title, description, category, starts_at, ends_at, location,
       target_department_id, visibility, created_by)
    values (public.my_church_id(), trim(p->>'title'), nullif(trim(p->>'description'), ''),
            coalesce(nullif(p->>'category',''), 'other'),
            (p->>'starts_at')::timestamptz, nullif(p->>'ends_at','')::timestamptz,
            nullif(trim(p->>'location'), ''), nullif(p->>'target_department_id','')::uuid,
            coalesce(nullif(p->>'visibility',''), 'member'), auth.uid())
    returning id into eid;
  else
    update mod_calendar.events set
      title = trim(p->>'title'),
      description = nullif(trim(p->>'description'), ''),
      category = coalesce(nullif(p->>'category',''), 'other'),
      starts_at = (p->>'starts_at')::timestamptz,
      ends_at = nullif(p->>'ends_at','')::timestamptz,
      location = nullif(trim(p->>'location'), ''),
      target_department_id = nullif(p->>'target_department_id','')::uuid,
      visibility = coalesce(nullif(p->>'visibility',''), 'member')
    where id = eid;
    if not found then raise exception '행사를 찾을 수 없거나 수정 권한이 없습니다'; end if;
  end if;
  return eid;
end $$;

create or replace function public.calendar_delete(p_id uuid)
returns void
language plpgsql security invoker as $$
begin
  delete from mod_calendar.events where id = p_id;
  if not found then raise exception '행사를 찾을 수 없거나 삭제 권한이 없습니다'; end if;
end $$;

grant execute on function public.calendar_upcoming, public.calendar_admin_list,
  public.calendar_save, public.calendar_delete to authenticated;

-- ===== 공개 표면 (링크 공유용 — visibility='public'만, 필드 최소화) =====

create or replace function public.public_events(p_slug text, p_limit int default 10)
returns table (id uuid, title text, category text, starts_at timestamptz, ends_at timestamptz, location text)
language sql stable security definer set search_path = public, mod_calendar as $$
  select e.id, e.title, e.category, e.starts_at, e.ends_at, e.location
  from mod_calendar.events e
  join public.churches c on c.id = e.church_id
  where c.slug = p_slug and c.status = 'active'
    and exists (select 1 from public.church_modules cm
                where cm.church_id = c.id and cm.module = 'calendar' and cm.enabled)
    and e.visibility = 'public'
    and coalesce(e.ends_at, e.starts_at) >= date_trunc('day', now())
  order by e.starts_at
  limit greatest(1, least(p_limit, 50))
$$;

create or replace function public.public_event(p_id uuid)
returns table (id uuid, title text, description text, category text, starts_at timestamptz,
               ends_at timestamptz, location text, church_name text, church_slug text)
language sql stable security definer set search_path = public, mod_calendar as $$
  select e.id, e.title, e.description, e.category, e.starts_at, e.ends_at, e.location,
         c.name, c.slug
  from mod_calendar.events e
  join public.churches c on c.id = e.church_id
  where e.id = p_id and c.status = 'active' and e.visibility = 'public'
    and exists (select 1 from public.church_modules cm
                where cm.church_id = c.id and cm.module = 'calendar' and cm.enabled)
$$;

grant execute on function public.public_events, public.public_event to anon, authenticated;

-- 기존 교회 모듈 활성화 (신규 교회는 스토어에서 설치)
insert into church_modules (church_id, module, enabled)
select id, 'calendar', true from churches
on conflict (church_id, module) do nothing;
