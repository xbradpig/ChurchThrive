-- ChurchThrive 승격 1: 멀티테넌시 (identity-role-architecture.md / plan.md 기반)
-- 청파중앙교회 = 첫 테넌트로 기존 데이터 백필

-- ===== 교회 =====
create table churches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,32}$'),
  phone text, address text,
  status text not null default 'active',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

insert into churches (id, name, slug) values
  ('11111111-1111-1111-1111-111111111111', '청파중앙교회', 'chungpa');

-- 가입 검색용 최소 공개 뷰 (D7: 과다 노출 방지)
create view church_public as select id, name, slug from churches where status = 'active';
grant select on church_public to authenticated;

-- ===== church_id 도입 (테넌트 축) + 인덱스 [RLS 수칙 1] =====
alter table members          add column church_id uuid not null default '11111111-1111-1111-1111-111111111111' references churches(id);
alter table departments      add column church_id uuid not null default '11111111-1111-1111-1111-111111111111' references churches(id);
alter table events           add column church_id uuid not null default '11111111-1111-1111-1111-111111111111' references churches(id);
alter table attendances      add column church_id uuid not null default '11111111-1111-1111-1111-111111111111' references churches(id);
alter table devices          add column church_id uuid not null default '11111111-1111-1111-1111-111111111111' references churches(id);
alter table field_permissions add column church_id uuid not null default '11111111-1111-1111-1111-111111111111' references churches(id);
alter table audit_log        add column church_id uuid;
create index idx_members_church on members (church_id);
create index idx_departments_church on departments (church_id);
create index idx_events_church on events (church_id);
create index idx_attendances_church on attendances (church_id, event_date);
create index idx_devices_church on devices (church_id);
create index idx_fperm_church on field_permissions (church_id);

-- 유니크 제약을 교회 스코프로
alter table members drop constraint members_name_name_suffix_key;
alter table members add constraint members_church_name_key unique (church_id, name, name_suffix);
alter table departments drop constraint departments_name_key;
alter table departments add constraint departments_church_name_key unique (church_id, name);
alter table events drop constraint events_name_key;
alter table events add constraint events_church_name_key unique (church_id, name);
alter table field_permissions drop constraint field_permissions_role_scope_fgroup_key;
alter table field_permissions add constraint fperm_church_scope_key unique (church_id, role_scope, fgroup);

-- ===== 역할: 교회 컨텍스트 바인딩 (identity §3) =====
create table church_roles (
  church_id uuid not null references churches(id),
  user_id uuid not null references auth.users(id),
  role app_role not null,
  granted_by uuid references auth.users(id),
  granted_at timestamptz not null default now(),
  primary key (church_id, user_id, role)
);
insert into church_roles (church_id, user_id, role)
  select '11111111-1111-1111-1111-111111111111', user_id, role from user_roles;

-- 활성 컨텍스트 (다중 교회 사용자용, 단일 교회면 자동)
create table active_church (
  user_id uuid primary key references auth.users(id),
  church_id uuid not null references churches(id),
  updated_at timestamptz not null default now()
);

-- 플랫폼 운영 (교회 데이터 접근 불가 — D6)
create table platform_admins (
  user_id uuid primary key references auth.users(id),
  granted_at timestamptz not null default now()
);

-- ===== 모듈: 교회별 토글 + 기능별 권한 (ecosystem §2) =====
create type module_level as enum ('viewer', 'manager', 'admin');

create table church_modules (
  church_id uuid not null references churches(id),
  module text not null,
  enabled boolean not null default true,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  primary key (church_id, module)
);
insert into church_modules (church_id, module) values
  ('11111111-1111-1111-1111-111111111111', 'attendance'),
  ('11111111-1111-1111-1111-111111111111', 'verse');

create table module_grants (
  church_id uuid not null references churches(id),
  user_id uuid not null references auth.users(id),
  module text not null,
  level module_level not null default 'manager',
  granted_by uuid references auth.users(id),
  granted_at timestamptz not null default now(),
  primary key (church_id, user_id, module)
);
-- checker 역할 → attendance:manager 이행 (D4)
insert into module_grants (church_id, user_id, module, level)
  select '11111111-1111-1111-1111-111111111111', user_id, 'attendance', 'manager'
  from user_roles where role = 'checker';

-- ===== 헬퍼 재정의: 활성 교회 컨텍스트 기준 [RLS 수칙 2: (select ...) 래핑은 정책에서] =====
create or replace function my_church_id() returns uuid
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select church_id from active_church where user_id = auth.uid()),
    (select church_id from church_roles where user_id = auth.uid() limit 1)
  )
$$;

create or replace function my_role() returns app_role
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select role from church_roles
     where user_id = auth.uid() and church_id = my_church_id()
     order by case role when 'superadmin' then 0 when 'pastor' then 1
              when 'dept_leader' then 2 when 'checker' then 3 else 4 end
     limit 1),
    'member'::app_role)
$$;

create or replace function my_member_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from members where user_id = auth.uid() and church_id = my_church_id()
$$;

create or replace function module_enabled(p_module text) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select enabled from church_modules
                   where church_id = my_church_id() and module = p_module), false)
$$;

create or replace function has_module(p_module text, p_level module_level) returns boolean
language sql stable security definer set search_path = public as $$
  select module_enabled(p_module) and (
    my_role() in ('superadmin','pastor')
    or exists (select 1 from module_grants
               where church_id = my_church_id() and user_id = auth.uid() and module = p_module
                 and level >= p_level)
  )
$$;

-- is_staff: 역할 또는 모듈 권한 보유자
create or replace function is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select my_role() in ('superadmin','pastor','dept_leader','checker')
    or exists (select 1 from module_grants
               where church_id = my_church_id() and user_id = auth.uid())
$$;

-- ===== church_id 자동 스탬프 트리거 (RPC 무수정 이관) =====
create or replace function tg_stamp_church() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.church_id is null or new.church_id = '11111111-1111-1111-1111-111111111111' then
    if tg_table_name = 'attendances' or tg_table_name = 'devices' then
      select church_id into new.church_id from members where id = new.member_id;
    else
      new.church_id := coalesce(my_church_id(), new.church_id);
    end if;
  end if;
  return new;
end $$;
create trigger stamp_church_att before insert on attendances for each row execute function tg_stamp_church();
create trigger stamp_church_dev before insert on devices for each row execute function tg_stamp_church();
create trigger stamp_church_mem before insert on members for each row execute function tg_stamp_church();
create trigger stamp_church_evt before insert on events for each row execute function tg_stamp_church();
create trigger stamp_church_dept before insert on departments for each row execute function tg_stamp_church();

-- 기본값 제거 (이후 신규 행은 컨텍스트/트리거가 결정)
alter table members alter column church_id drop default;
alter table departments alter column church_id drop default;
alter table events alter column church_id drop default;
alter table attendances alter column church_id drop default;
alter table devices alter column church_id drop default;
alter table field_permissions alter column church_id drop default;

-- ===== RLS: 테넌트 술어 추가 (핵심 테이블 재정의) =====
drop policy members_select on members;
create policy members_select on members for select to authenticated using (
  church_id = (select my_church_id()) and
  case my_role()
    when 'superadmin' then true when 'pastor' then true when 'checker' then true
    when 'dept_leader' then id = my_member_id()
      or exists (select 1 from department_members dm
                 where dm.member_id = members.id
                   and dm.department_id in (select my_led_departments()))
    else id = my_member_id()
      or exists (select 1 from module_grants mg where mg.church_id = members.church_id
                 and mg.user_id = auth.uid())   -- 모듈 담당자: 기본 컬럼 명단
  end
);

drop policy att_select on attendances;
create policy att_select on attendances for select to authenticated using (
  church_id = (select my_church_id()) and
  (is_staff() or member_id = my_member_id())
);
drop policy att_insert on attendances;
create policy att_insert on attendances for insert to authenticated
  with check (is_staff() or (method = 'self' and member_id = my_member_id()));
drop policy att_delete on attendances;
create policy att_delete on attendances for delete to authenticated
  using (church_id = (select my_church_id()) and is_staff());

drop policy departments_select on departments;
create policy departments_select on departments for select to authenticated
  using (church_id = (select my_church_id()));
drop policy events_select on events;
create policy events_select on events for select to authenticated
  using (church_id = (select my_church_id()));
drop policy fperm_select on field_permissions;
create policy fperm_select on field_permissions for select to authenticated
  using (church_id = (select my_church_id()));
drop policy fperm_update on field_permissions;
create policy fperm_update on field_permissions for update to authenticated
  using (church_id = (select my_church_id()) and my_role() in ('superadmin','pastor'));

-- 신규 테이블 RLS
alter table churches enable row level security;
alter table church_roles enable row level security;
alter table church_modules enable row level security;
alter table module_grants enable row level security;
alter table active_church enable row level security;
alter table platform_admins enable row level security;

grant select on churches to authenticated;
create policy churches_select_mine on churches for select to authenticated
  using (id = (select my_church_id())
         or exists (select 1 from platform_admins pa where pa.user_id = auth.uid()));

grant select, insert on church_roles to authenticated;
create policy croles_select on church_roles for select to authenticated
  using (user_id = auth.uid()
         or (church_id = (select my_church_id()) and my_role() in ('superadmin','pastor')));
create policy croles_admin_ins on church_roles for insert to authenticated
  with check (church_id = (select my_church_id()) and my_role() = 'superadmin');

grant select, update on church_modules to authenticated;
grant insert on church_modules to authenticated;
create policy cmod_select on church_modules for select to authenticated
  using (church_id = (select my_church_id()));
create policy cmod_write on church_modules for insert to authenticated
  with check (church_id = (select my_church_id()) and my_role() = 'superadmin');
create policy cmod_update on church_modules for update to authenticated
  using (church_id = (select my_church_id()) and my_role() = 'superadmin');

grant select, insert, update, delete on module_grants to authenticated;
create policy mgrant_select on module_grants for select to authenticated
  using (church_id = (select my_church_id()));
create policy mgrant_write on module_grants for all to authenticated
  using (church_id = (select my_church_id()) and my_role() in ('superadmin','pastor'))
  with check (church_id = (select my_church_id()) and my_role() in ('superadmin','pastor'));

grant select, insert, update on active_church to authenticated;
create policy actch_own on active_church for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid()
    and exists (select 1 from church_roles cr where cr.user_id = auth.uid() and cr.church_id = active_church.church_id));

grant select on platform_admins to authenticated;
create policy padmin_select on platform_admins for select to authenticated
  using (user_id = auth.uid());

-- ===== 교회 생성 RPC (SG2): 생성자 = 교회 admin, 기본 시드 =====
create or replace function create_church(p_name text, p_slug text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare cid uuid;
begin
  if exists (select 1 from churches where slug = p_slug) then
    raise exception '이미 사용 중인 주소입니다';
  end if;
  insert into churches (name, slug, created_by) values (trim(p_name), p_slug, auth.uid())
    returning id into cid;
  insert into church_roles (church_id, user_id, role) values (cid, auth.uid(), 'superadmin');
  insert into active_church (user_id, church_id) values (auth.uid(), cid)
    on conflict (user_id) do update set church_id = cid, updated_at = now();
  -- 기본 시드: 이벤트·부서 템플릿 + 코어 권한 기본값 + 기본 모듈
  insert into events (church_id, name, category, schedule_rule, sort_order) values
    (cid, '주일예배', 'worship', '{"dow":[0],"start":"09:00","end":"13:30"}', 1),
    (cid, '수요예배', 'worship', '{"dow":[3],"start":"19:00","end":"21:30"}', 2),
    (cid, '방문', 'visit', null, 9);
  insert into departments (church_id, name, sort_order) values
    (cid, '남선교회', 1), (cid, '여선교회', 2), (cid, '청년부', 3);
  insert into field_permissions (church_id, role_scope, fgroup, allowed)
    select cid, 'dept_leader', g, (g = 'attendance')
    from unnest(enum_range(null::field_group)) g;
  insert into church_modules (church_id, module) values (cid, 'attendance');
  return cid;
end $$;

-- 모듈 설치/해지 RPC (SG3)
create or replace function set_module(p_module text, p_enabled boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if my_role() <> 'superadmin' then raise exception '교회 관리자만 가능합니다'; end if;
  insert into church_modules (church_id, module, enabled, updated_by)
  values (my_church_id(), p_module, p_enabled, auth.uid())
  on conflict (church_id, module)
  do update set enabled = p_enabled, updated_by = auth.uid(), updated_at = now();
end $$;

grant execute on function my_church_id, module_enabled, has_module, create_church, set_module
  to authenticated;
grant select on churches, church_roles, church_modules, module_grants, active_church, platform_admins to service_role;
grant all on churches, church_roles, church_modules, module_grants, active_church, platform_admins to service_role;
