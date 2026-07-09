-- 00037: 교인명부 기반 담당자 임명 + 승인 워크플로 (role-appointments)
-- 흐름: 교역자/관리자가 명부에서 교인을 지목해 임명 제안 → 관리자(superadmin) 승인
--   → 계정(실이메일·인증)이 연결돼 있으면 즉시 역할 부여(active)
--   → 아니면 waiting_account 상태로 두고, 계정이 연결되는 순간 자동 활성화
-- 정책 일관성: @invite.* 가상 계정·이메일 미인증 계정에는 역할을 부여하지 않음 (00020과 동일)

create table role_appointments (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references churches(id),
  member_id uuid not null references members(id),
  role app_role not null,
  note text,
  status text not null default 'pending'
    check (status in ('pending','waiting_account','active','rejected','canceled')),
  requested_by uuid not null references auth.users(id),
  decided_by uuid references auth.users(id),
  decided_at timestamptz,
  decide_note text,
  activated_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index uq_role_appt_open on role_appointments (member_id, role)
  where status in ('pending','waiting_account');
create index idx_role_appt_church on role_appointments (church_id, status);

alter table role_appointments enable row level security;
grant select on role_appointments to authenticated;
grant all on role_appointments to service_role;

create policy role_appt_select on role_appointments for select to authenticated
  using (church_id = (select my_church_id()) and is_staff());
-- 쓰기는 RPC(SECURITY DEFINER) 전용

-- 내부 헬퍼: 임명 활성화 시도 — 실계정·이메일 인증 확인 후 역할 부여
create or replace function public.try_activate_role_appointment(p_id uuid)
returns boolean
language plpgsql security definer set search_path = public as $$
declare a role_appointments%rowtype; u_email text; u_confirmed timestamptz; target uuid;
begin
  select * into a from role_appointments where id = p_id;
  if not found then return false; end if;
  -- 승인 절차를 거친 건만 활성화 (decided_by = 승인 관리자)
  if a.status not in ('pending','waiting_account') or a.decided_by is null then return false; end if;

  select m.user_id into target from members m where m.id = a.member_id;
  if target is null then return false; end if;

  select u.email, u.email_confirmed_at into u_email, u_confirmed
  from auth.users u where u.id = target;
  if u_email is null or lower(u_email) like '%@invite.%' or u_confirmed is null then
    return false;  -- 가상 계정·미인증 계정에는 담당자 역할 부여 불가 (00020 정책)
  end if;

  insert into church_roles (church_id, user_id, role, granted_by)
  values (a.church_id, target, a.role, coalesce(a.decided_by, a.requested_by))
    on conflict (church_id, user_id, role) do nothing;
  insert into active_church (user_id, church_id) values (target, a.church_id)
    on conflict (user_id) do nothing;

  update role_appointments set status = 'active', activated_at = now() where id = a.id;

  insert into audit_log (actor_user_id, action, target_table, target_id, after_json, church_id)
  values (auth.uid(), 'role_appointment_activate', 'role_appointments', a.id::text,
          jsonb_build_object('member_id', a.member_id, 'role', a.role, 'user_id', target),
          a.church_id);
  return true;
end $$;

-- 1) 임명 제안 (교역자 이상)
create or replace function public.propose_role_appointment(
  p_member uuid, p_role text, p_note text default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare aid uuid;
begin
  if my_role() not in ('superadmin','pastor') then raise exception '교역자 이상만 임명을 제안할 수 있습니다'; end if;
  if p_role not in ('superadmin','pastor','dept_leader','checker') then
    raise exception '잘못된 역할'; end if;
  if not exists (select 1 from members where id = p_member and church_id = my_church_id()) then
    raise exception '우리 교회 교인이 아닙니다'; end if;

  insert into role_appointments (church_id, member_id, role, note, requested_by)
  values (my_church_id(), p_member, p_role::app_role, nullif(trim(p_note), ''), auth.uid())
  returning id into aid;

  insert into audit_log (actor_user_id, action, target_table, target_id, after_json, church_id)
  values (auth.uid(), 'role_appointment_propose', 'role_appointments', aid::text,
          jsonb_build_object('member_id', p_member, 'role', p_role), my_church_id());
  return aid;
exception when unique_violation then
  raise exception '이미 같은 역할의 임명이 진행 중입니다';
end $$;

-- 2) 대기 큐 목록 (담당자 이상 열람)
create or replace function public.list_role_appointments()
returns table (
  id uuid, member_id uuid, member_name text, role text, status text, note text,
  requested_at timestamptz, requester_email text,
  joined boolean, member_email text, email_verified boolean
)
language sql stable security definer set search_path = public as $$
  select a.id, a.member_id, m.name || m.name_suffix, a.role::text, a.status, a.note,
         a.created_at, u.email::text,
         (m.user_id is not null),
         case when my_role() in ('superadmin','pastor') then m.email end,
         (m.email_verified_at is not null)
  from role_appointments a
  join members m on m.id = a.member_id
  left join auth.users u on u.id = a.requested_by
  where a.church_id = my_church_id() and is_staff()
    and a.status in ('pending','waiting_account')
  order by a.created_at
$$;

-- 3) 승인/거절 (관리자 전용) — waiting_account에 재호출하면 활성화 재시도
create or replace function public.decide_role_appointment(
  p_id uuid, p_approve boolean, p_note text default null
) returns text
language plpgsql security definer set search_path = public as $$
declare a role_appointments%rowtype; ok boolean;
begin
  if my_role() is distinct from 'superadmin' then raise exception '교회 관리자만 승인할 수 있습니다'; end if;
  select * into a from role_appointments
   where id = p_id and church_id = my_church_id() and status in ('pending','waiting_account');
  if not found then raise exception '처리할 수 없는 임명입니다'; end if;

  if not p_approve then
    update role_appointments
    set status = 'rejected', decided_by = auth.uid(), decided_at = now(),
        decide_note = nullif(trim(p_note), '')
    where id = p_id;
    insert into audit_log (actor_user_id, action, target_table, target_id, after_json, church_id)
    values (auth.uid(), 'role_appointment_reject', 'role_appointments', p_id::text,
            jsonb_build_object('member_id', a.member_id, 'role', a.role), my_church_id());
    return 'rejected';
  end if;

  update role_appointments
  set decided_by = auth.uid(), decided_at = now(), decide_note = nullif(trim(p_note), '')
  where id = p_id;

  ok := try_activate_role_appointment(p_id);
  if ok then return 'active'; end if;

  update role_appointments set status = 'waiting_account' where id = p_id;
  insert into audit_log (actor_user_id, action, target_table, target_id, after_json, church_id)
  values (auth.uid(), 'role_appointment_approve_waiting', 'role_appointments', p_id::text,
          jsonb_build_object('member_id', a.member_id, 'role', a.role), my_church_id());
  return 'waiting_account';
end $$;

-- 4) 취소 (관리자 또는 제안자 본인)
create or replace function public.cancel_role_appointment(p_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare a role_appointments%rowtype;
begin
  select * into a from role_appointments
   where id = p_id and church_id = my_church_id() and status in ('pending','waiting_account');
  if not found then raise exception '취소할 수 없는 임명입니다'; end if;
  if my_role() is distinct from 'superadmin' and a.requested_by is distinct from auth.uid() then
    raise exception '취소 권한이 없습니다';
  end if;
  update role_appointments set status = 'canceled', decided_by = auth.uid(), decided_at = now()
  where id = p_id;
end $$;

-- 5) 계정 연결 시 자동 활성화 — 승인 완료(waiting_account) 임명을 즉시 부여
create or replace function public.tg_activate_appointments_on_link()
returns trigger
language plpgsql security definer set search_path = public as $$
declare a record;
begin
  if new.user_id is not null and new.user_id is distinct from old.user_id then
    for a in select id from role_appointments
             where member_id = new.id and status = 'waiting_account' loop
      perform try_activate_role_appointment(a.id);
    end loop;
  end if;
  return new;
end $$;

create trigger activate_appointments_on_link
  after update of user_id on members
  for each row execute function tg_activate_appointments_on_link();

grant execute on function public.propose_role_appointment, public.list_role_appointments,
  public.decide_role_appointment, public.cancel_role_appointment to authenticated;
-- try_activate_role_appointment는 내부 전용 — 기본 PUBLIC EXECUTE까지 차단
revoke execute on function public.try_activate_role_appointment from public, anon, authenticated;
