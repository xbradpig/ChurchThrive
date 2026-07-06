-- 말씀 암송 모듈 (mod_verse 스키마 — ecosystem Tier 규약의 첫 실증)
create schema if not exists mod_verse;
grant usage on schema mod_verse to authenticated, service_role;

create table mod_verse.assignments (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id),
  week_start date not null,
  reference text not null,            -- 예: 시편 23:1
  body text not null,
  guide text,                          -- MATCH 단계 안내 (선택)
  target_department_id uuid references public.departments(id),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (church_id, week_start, reference)
);
create index idx_verse_assign_church on mod_verse.assignments (church_id, week_start desc);

create table mod_verse.checks (
  assignment_id uuid not null references mod_verse.assignments(id),
  member_id uuid not null references public.members(id),
  church_id uuid not null references public.churches(id),
  method text not null default 'self' check (method in ('self','manager')),
  checked_by uuid references auth.users(id),
  note text,
  checked_at timestamptz not null default now(),
  primary key (assignment_id, member_id)
);
create index idx_verse_checks_church on mod_verse.checks (church_id, assignment_id);

alter table mod_verse.assignments enable row level security;
alter table mod_verse.checks enable row level security;
grant select, insert, update, delete on all tables in schema mod_verse to authenticated;
grant all on all tables in schema mod_verse to service_role;

create policy va_select on mod_verse.assignments for select to authenticated
  using (church_id = (select public.my_church_id()) and public.module_enabled('verse'));
create policy va_write on mod_verse.assignments for insert to authenticated
  with check (church_id = (select public.my_church_id()) and public.has_module('verse', 'admin'));
create policy va_update on mod_verse.assignments for update to authenticated
  using (church_id = (select public.my_church_id()) and public.has_module('verse', 'admin'));

create policy vc_select on mod_verse.checks for select to authenticated
  using (church_id = (select public.my_church_id()) and public.module_enabled('verse')
         and (public.is_staff() or member_id = public.my_member_id()));
create policy vc_self on mod_verse.checks for insert to authenticated
  with check (church_id = (select public.my_church_id()) and public.module_enabled('verse')
    and ((method = 'self' and member_id = public.my_member_id())
         or (method = 'manager' and public.has_module('verse', 'manager'))));

-- RPC (SECURITY INVOKER — 모듈 규약: RLS가 그대로 적용) [검증 패턴]
create or replace function public.verse_create_assignment(
  p_week_start date, p_reference text, p_body text, p_guide text default null,
  p_department uuid default null
) returns uuid
language plpgsql security invoker as $$
declare aid uuid;
begin
  insert into mod_verse.assignments (church_id, week_start, reference, body, guide, target_department_id, created_by)
  values (public.my_church_id(), p_week_start, p_reference, p_body, p_guide, p_department, auth.uid())
  returning id into aid;
  return aid;
end $$;

create or replace function public.verse_check(p_assignment uuid, p_member uuid default null)
returns void
language plpgsql security invoker as $$
declare target uuid := coalesce(p_member, public.my_member_id());
        meth text := case when p_member is null or p_member = public.my_member_id() then 'self' else 'manager' end;
begin
  insert into mod_verse.checks (assignment_id, member_id, church_id, method, checked_by)
  values (p_assignment, target, public.my_church_id(), meth, auth.uid())
  on conflict (assignment_id, member_id) do nothing;
end $$;

create or replace function public.verse_current()
returns table (id uuid, week_start date, reference text, body text, guide text,
               checked boolean, check_count bigint, target_count bigint)
language sql stable security invoker as $$
  select a.id, a.week_start, a.reference, a.body, a.guide,
    exists (select 1 from mod_verse.checks c
            where c.assignment_id = a.id and c.member_id = public.my_member_id()),
    (select count(*) from mod_verse.checks c where c.assignment_id = a.id),
    (select count(*) from public.members m
      where m.church_id = a.church_id and m.status = 'active' and m.member_type = 'registered'
        and (a.target_department_id is null
             or exists (select 1 from public.department_members dm
                        where dm.member_id = m.id and dm.department_id = a.target_department_id)))
  from mod_verse.assignments a
  where a.church_id = (select public.my_church_id())
  order by a.week_start desc limit 8
$$;

grant execute on function public.verse_create_assignment, public.verse_check, public.verse_current
  to authenticated;
