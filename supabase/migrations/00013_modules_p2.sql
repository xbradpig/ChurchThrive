-- Phase 2 모듈 6종: 심방·새가족·훈련·공지·헌금 기록·전자주보
-- 규약(ecosystem Tier 1): 모듈별 스키마, module_enabled/has_module 게이트, SECURITY INVOKER

-- ===== 공지 (notice) =====
create schema if not exists mod_notice;
grant usage on schema mod_notice to authenticated, service_role;
create table mod_notice.notices (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id),
  title text not null, body text not null,
  target_department_id uuid references public.departments(id),
  published_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);
create index on mod_notice.notices (church_id, published_at desc);
alter table mod_notice.notices enable row level security;
grant select, insert, update, delete on mod_notice.notices to authenticated;
grant all on mod_notice.notices to service_role;
create policy n_sel on mod_notice.notices for select to authenticated
  using (church_id = (select public.my_church_id()) and public.module_enabled('notice'));
create policy n_ins on mod_notice.notices for insert to authenticated
  with check (church_id = (select public.my_church_id()) and public.has_module('notice','manager'));
create policy n_del on mod_notice.notices for delete to authenticated
  using (church_id = (select public.my_church_id()) and public.has_module('notice','admin'));

-- ===== 심방 (visitation) — pastoral 민감 =====
create schema if not exists mod_visitation;
grant usage on schema mod_visitation to authenticated, service_role;
create table mod_visitation.visits (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id),
  member_id uuid not null references public.members(id),
  status text not null default 'requested' check (status in ('requested','assigned','done')),
  requested_by uuid references auth.users(id),
  assigned_to uuid references public.members(id),
  visit_date date, note text,                    -- note = pastoral 등급만 열람
  created_at timestamptz not null default now()
);
create index on mod_visitation.visits (church_id, status);
alter table mod_visitation.visits enable row level security;
grant select, insert, update on mod_visitation.visits to authenticated;
grant all on mod_visitation.visits to service_role;
-- 열람: 담당 등급(visitation grant 또는 교역자). 교인은 자기 요청 존재만
create policy v_sel on mod_visitation.visits for select to authenticated
  using (church_id = (select public.my_church_id()) and public.module_enabled('visitation')
         and (public.has_module('visitation','manager')
              or requested_by = auth.uid()
              or member_id = public.my_member_id()));
create policy v_ins on mod_visitation.visits for insert to authenticated
  with check (church_id = (select public.my_church_id()) and public.module_enabled('visitation')
    and (public.has_module('visitation','manager') or member_id = public.my_member_id()));
create policy v_upd on mod_visitation.visits for update to authenticated
  using (church_id = (select public.my_church_id()) and public.has_module('visitation','manager'));

-- ===== 새가족 정착 (newcomer) =====
create schema if not exists mod_newcomer;
grant usage on schema mod_newcomer to authenticated, service_role;
create table mod_newcomer.progress (
  church_id uuid not null references public.churches(id),
  member_id uuid not null references public.members(id),
  stage int not null default 1 check (stage between 1 and 4),   -- 1등록 2환영 3교육 4정착
  note text,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  primary key (church_id, member_id)
);
alter table mod_newcomer.progress enable row level security;
grant select, insert, update on mod_newcomer.progress to authenticated;
grant all on mod_newcomer.progress to service_role;
create policy nc_all on mod_newcomer.progress for all to authenticated
  using (church_id = (select public.my_church_id()) and public.module_enabled('newcomer')
         and public.has_module('newcomer','manager'))
  with check (church_id = (select public.my_church_id()) and public.has_module('newcomer','manager'));

-- ===== 훈련·교육 (training) =====
create schema if not exists mod_training;
grant usage on schema mod_training to authenticated, service_role;
create table mod_training.courses (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id),
  name text not null, description text,
  start_on date, end_on date, active boolean not null default true,
  created_by uuid references auth.users(id)
);
create table mod_training.enrollments (
  course_id uuid not null references mod_training.courses(id),
  member_id uuid not null references public.members(id),
  church_id uuid not null references public.churches(id),
  status text not null default 'enrolled' check (status in ('enrolled','completed','dropped')),
  updated_at timestamptz not null default now(),
  primary key (course_id, member_id)
);
alter table mod_training.courses enable row level security;
alter table mod_training.enrollments enable row level security;
grant select, insert, update on mod_training.courses, mod_training.enrollments to authenticated;
grant all on mod_training.courses, mod_training.enrollments to service_role;
create policy tc_sel on mod_training.courses for select to authenticated
  using (church_id = (select public.my_church_id()) and public.module_enabled('training'));
create policy tc_w on mod_training.courses for insert to authenticated
  with check (church_id = (select public.my_church_id()) and public.has_module('training','admin'));
create policy tc_u on mod_training.courses for update to authenticated
  using (church_id = (select public.my_church_id()) and public.has_module('training','admin'));
create policy te_sel on mod_training.enrollments for select to authenticated
  using (church_id = (select public.my_church_id()) and public.module_enabled('training')
         and (public.has_module('training','manager') or member_id = public.my_member_id()));
create policy te_w on mod_training.enrollments for insert to authenticated
  with check (church_id = (select public.my_church_id())
    and (public.has_module('training','manager') or member_id = public.my_member_id()));
create policy te_u on mod_training.enrollments for update to authenticated
  using (church_id = (select public.my_church_id()) and public.has_module('training','manager'));

-- ===== 헌금 기록 (giving) — 최고 민감: 본인 + giving 담당만 =====
create schema if not exists mod_giving;
grant usage on schema mod_giving to authenticated, service_role;
create table mod_giving.records (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id),
  member_id uuid not null references public.members(id),
  fund text not null default '십일조',
  amount int not null check (amount > 0),
  given_on date not null default current_date,
  note text,
  recorded_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index on mod_giving.records (church_id, given_on desc);
create index on mod_giving.records (member_id, given_on desc);
alter table mod_giving.records enable row level security;
grant select, insert on mod_giving.records to authenticated;
grant all on mod_giving.records to service_role;
-- 교역자도 giving grant 없으면 열람 불가 (재정 분리 원칙) — superadmin과 giving 담당만
create policy g_sel on mod_giving.records for select to authenticated
  using (church_id = (select public.my_church_id()) and public.module_enabled('giving')
         and (member_id = public.my_member_id()
              or public.my_role() = 'superadmin'
              or exists (select 1 from public.module_grants mg
                         where mg.church_id = (select public.my_church_id())
                           and mg.user_id = auth.uid() and mg.module = 'giving')));
create policy g_ins on mod_giving.records for insert to authenticated
  with check (church_id = (select public.my_church_id()) and public.module_enabled('giving')
    and (public.my_role() = 'superadmin'
         or exists (select 1 from public.module_grants mg
                    where mg.church_id = (select public.my_church_id())
                      and mg.user_id = auth.uid() and mg.module = 'giving'
                      and mg.level in ('manager','admin'))));
create trigger audit_giving after insert on mod_giving.records
  for each row execute function public.tg_audit_generic();

-- ===== 전자주보 (bulletin) =====
create schema if not exists mod_bulletin;
grant usage on schema mod_bulletin to authenticated, service_role;
create table mod_bulletin.issues (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id),
  week_start date not null,
  title text not null,
  content_md text not null,
  published boolean not null default false,
  created_by uuid references auth.users(id),
  unique (church_id, week_start)
);
alter table mod_bulletin.issues enable row level security;
grant select, insert, update on mod_bulletin.issues to authenticated;
grant all on mod_bulletin.issues to service_role;
create policy b_sel on mod_bulletin.issues for select to authenticated
  using (church_id = (select public.my_church_id()) and public.module_enabled('bulletin')
         and (published or public.has_module('bulletin','manager')));
create policy b_w on mod_bulletin.issues for insert to authenticated
  with check (church_id = (select public.my_church_id()) and public.has_module('bulletin','manager'));
create policy b_u on mod_bulletin.issues for update to authenticated
  using (church_id = (select public.my_church_id()) and public.has_module('bulletin','manager'));

-- ===== CSV 교인 임포트 (P1 — 엑셀 위저드 대체 v1) =====
create or replace function import_members(p_rows jsonb)
returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare r jsonb; inserted int := 0; skipped int := 0; nm text; sfx text; mid uuid;
begin
  if my_role() not in ('superadmin','pastor') then raise exception '권한이 없습니다'; end if;
  for r in select * from jsonb_array_elements(p_rows) loop
    nm := trim(r->>'name');
    if nm is null or nm = '' then skipped := skipped + 1; continue; end if;
    sfx := coalesce(nullif(trim(r->>'suffix'), ''), '');
    if exists (select 1 from members where church_id = my_church_id() and name = nm and name_suffix = sfx) then
      skipped := skipped + 1; continue;
    end if;
    insert into members (church_id, name, name_suffix, phone, birthday, position, member_type)
    values (my_church_id(), nm, sfx,
            nullif(trim(r->>'phone'), ''),
            case when (r->>'birthday') ~ '^\d{4}-\d{2}-\d{2}$' then (r->>'birthday')::date end,
            coalesce(nullif(trim(r->>'position'), ''), '평신도'), 'registered')
    returning id into mid;
    insert into member_qr_tokens (member_id, token) values (mid, encode(gen_random_bytes(24), 'hex'));
    inserted := inserted + 1;
  end loop;
  return jsonb_build_object('inserted', inserted, 'skipped', skipped);
end $$;
grant execute on function import_members to authenticated;
