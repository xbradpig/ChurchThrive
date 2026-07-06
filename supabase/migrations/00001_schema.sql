-- ChungpaAttend 스키마 v1
-- 원칙: 교적(members) hard delete 금지, 모든 체크인 방법은 attendances로 수렴

create type app_role as enum ('superadmin', 'pastor', 'dept_leader', 'checker', 'member');
create type member_type as enum ('registered', 'new_family', 'visitor');
create type member_status as enum ('active', 'inactive', 'moved', 'deceased');
create type check_method as enum ('manual', 'qr', 'nfc', 'self', 'auto_wifi', 'auto_ble');
create type leader_status as enum ('pending', 'approved', 'revoked');
create type device_kind as enum ('wifi', 'ble_beacon');
create type event_category as enum ('worship', 'education', 'meeting', 'visit', 'other');
create type field_group as enum ('attendance', 'contact', 'birth', 'address', 'family', 'pastoral');

create table departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_suffix text not null default '',        -- 동명이인 구분 (김선우A/B)
  photo_url text,
  phone text,
  birthday date,
  address text,
  family_note text,
  position text not null default '평신도',      -- 직분
  member_type member_type not null default 'registered',
  status member_status not null default 'active',
  -- 케어 연계 (R13, pastoral 그룹)
  care_target boolean not null default false,
  guardian_name text,
  guardian_phone text,
  has_wander_device boolean not null default false,
  dementia_center_registered boolean not null default false,
  user_id uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name, name_suffix)
);

create table department_members (
  member_id uuid not null references members(id),
  department_id uuid not null references departments(id),
  primary key (member_id, department_id)
);

create table department_leaders (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id),
  department_id uuid not null references departments(id),
  status leader_status not null default 'pending',
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  unique (member_id, department_id)
);

create table user_roles (
  user_id uuid primary key references auth.users(id),
  role app_role not null default 'member',
  created_at timestamptz not null default now()
);

create table events (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category event_category not null default 'worship',
  -- 자동 분류 규칙: {"dow":[0], "start":"09:00", "end":"13:00"} (0=일요일)
  schedule_rule jsonb,
  target_department_id uuid references departments(id),  -- null = 전체
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table attendances (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id),
  event_id uuid not null references events(id),
  event_date date not null,
  checked_in_at timestamptz not null default now(),
  method check_method not null default 'manual',
  approved boolean not null default true,        -- self 체크인은 담당자 승인 전 false
  checked_by uuid references auth.users(id),
  note text,
  unique (member_id, event_id, event_date)
);
create index idx_attendances_date on attendances (event_date, event_id);
create index idx_attendances_member on attendances (member_id, event_date desc);

create table devices (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id),
  device_kind device_kind not null default 'wifi',
  mac_hash text not null unique,                -- SHA-256(mac + salt), 원본 비저장
  label text,
  registered_at timestamptz not null default now(),
  last_seen_at timestamptz,
  active boolean not null default true
);

create table presence_events (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references devices(id),
  first_seen timestamptz not null,
  last_seen timestamptz not null,
  synced_at timestamptz not null default now()
);
create index idx_presence_device on presence_events (device_id, first_seen desc);

create table member_qr_tokens (
  member_id uuid primary key references members(id),
  token text not null unique,
  issued_at timestamptz not null default now(),
  revoked boolean not null default false
);

create table field_permissions (
  id uuid primary key default gen_random_uuid(),
  role_scope app_role not null,                  -- 대상 역할 (주로 dept_leader)
  fgroup field_group not null,
  allowed boolean not null default false,
  approved_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  unique (role_scope, fgroup)
);

create table member_consents (
  member_id uuid not null references members(id),
  fgroup field_group not null,
  granted boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (member_id, fgroup)
);

create table audit_log (
  id bigint generated always as identity primary key,
  actor_user_id uuid,
  action text not null,
  target_table text not null,
  target_id text,
  before_json jsonb,
  after_json jsonb,
  at timestamptz not null default now()
);

create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  endpoint text not null unique,
  keys_json jsonb not null,
  created_at timestamptz not null default now()
);

create table notification_settings (
  user_id uuid not null references auth.users(id),
  kind text not null default 'absentee_digest',
  threshold_weeks int not null default 2,
  send_dow int not null default 1,               -- 0=일 … 6=토
  send_time time not null default '09:00',
  event_category event_category,
  enabled boolean not null default true,
  primary key (user_id, kind)
);

-- updated_at 자동 갱신 + 교적 변경 감사 로그
create or replace function tg_members_audit() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.updated_at := now();
  insert into audit_log (actor_user_id, action, target_table, target_id, before_json, after_json)
  values (auth.uid(), lower(tg_op), 'members', new.id::text, to_jsonb(old), to_jsonb(new));
  return new;
end $$;
create trigger members_audit before update on members
  for each row execute function tg_members_audit();
