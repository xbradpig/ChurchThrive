-- 00030: 교적카드 셀프서비스 — 교인 직접 등록(즉시) + 수정 승인 워크플로
-- docs/Task_Work/2026-07-07_member-card-self-service/detail_goal.md
-- 원칙: 등록은 본인 입력 신뢰, 수정은 승인제, 삭제는 불가(구조적), 알림은 홈 todo + 푸시 크론

-- 0) 삭제 불가 명시 (기존에도 정책·RPC 전무 — belt-and-braces)
revoke delete on public.members from authenticated;

-- 1) 수정 요청 큐
create table member_edit_requests (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references churches(id),
  member_id uuid not null references members(id),
  requested_by uuid not null references auth.users(id),
  changes jsonb not null,                 -- 화이트리스트 필드의 diff만 저장
  note text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  decided_by uuid references auth.users(id),
  decided_at timestamptz,
  decide_note text,
  notified_at timestamptz,                -- 푸시 발송 마킹 (send-digest.mjs)
  created_at timestamptz not null default now()
);
create unique index uq_edit_req_pending on member_edit_requests (member_id) where status = 'pending';
create index idx_edit_req_church on member_edit_requests (church_id, status);

alter table member_edit_requests enable row level security;
grant select on member_edit_requests to authenticated;
grant all on member_edit_requests to service_role;

-- 승인 권한: 교역자·관리자 + 교적(core) 담당 권한자
create or replace function public.can_decide_member_edit()
returns boolean language sql stable security invoker as $$
  select my_role() in ('superadmin','pastor') or has_module('core', 'manager')
$$;

create policy edit_req_select on member_edit_requests for select to authenticated
  using (church_id = (select my_church_id())
         and (requested_by = auth.uid() or public.can_decide_member_edit()));
-- 쓰기는 RPC(SECURITY DEFINER) 전용 — insert/update 정책 없음

-- 2) 교인 본인 교적 등록 (즉시 반영 — 사용자 확정)
create or replace function public.register_my_card(p jsonb)
returns uuid
language plpgsql security definer set search_path = public as $$
declare mid uuid;
begin
  if auth.uid() is null or my_church_id() is null then
    raise exception '교회 소속 후 등록할 수 있습니다';
  end if;
  if my_member_id() is not null then
    raise exception '이미 교적이 연결되어 있습니다';
  end if;
  if coalesce(trim(p->>'name'), '') = '' then
    raise exception '이름을 입력해주세요';
  end if;
  begin
    insert into members (church_id, name, name_suffix, phone, birthday, address,
                         member_type, status, user_id)
    values (my_church_id(), trim(p->>'name'), coalesce(trim(p->>'name_suffix'), ''),
            nullif(trim(p->>'phone'), ''), nullif(p->>'birthday','')::date,
            nullif(trim(p->>'address'), ''), 'registered', 'active', auth.uid())
    returning id into mid;
  exception when unique_violation then
    raise exception '같은 이름의 교적이 이미 있습니다. 본인 교적일 수 있으니 교회 담당자에게 연결을 요청해주세요';
  end;
  insert into member_qr_tokens (member_id, token)
  values (mid, encode(extensions.gen_random_bytes(24), 'hex'))
  on conflict (member_id) do nothing;
  return mid;
end $$;

-- 3) 수정 요청 (화이트리스트 diff — 승인 전 members 무변경)
create or replace function public.request_my_card_edit(p jsonb, p_note text default null)
returns uuid
language plpgsql security definer set search_path = public as $$
declare m members%rowtype; diff jsonb := '{}'::jsonb; rid uuid;
begin
  select * into m from members where id = my_member_id();
  if not found then raise exception '연결된 교적이 없습니다'; end if;

  -- 화이트리스트만 채택, 현재 값과 같으면 제외 (position·status 등은 담당자 전용 — strip)
  if p ? 'name' and nullif(trim(p->>'name'), '') is distinct from m.name and nullif(trim(p->>'name'),'') is not null then
    diff := diff || jsonb_build_object('name', trim(p->>'name')); end if;
  if p ? 'phone' and nullif(trim(p->>'phone'), '') is distinct from m.phone then
    diff := diff || jsonb_build_object('phone', nullif(trim(p->>'phone'), '')); end if;
  if p ? 'birthday' and nullif(p->>'birthday','')::date is distinct from m.birthday then
    diff := diff || jsonb_build_object('birthday', nullif(p->>'birthday','')); end if;
  if p ? 'address' and nullif(trim(p->>'address'), '') is distinct from m.address then
    diff := diff || jsonb_build_object('address', nullif(trim(p->>'address'), '')); end if;
  if p ? 'family_note' and nullif(trim(p->>'family_note'), '') is distinct from m.family_note then
    diff := diff || jsonb_build_object('family_note', nullif(trim(p->>'family_note'), '')); end if;

  if diff = '{}'::jsonb then raise exception '변경된 내용이 없습니다'; end if;

  insert into member_edit_requests (church_id, member_id, requested_by, changes, note)
  values (m.church_id, m.id, auth.uid(), diff, nullif(trim(p_note), ''))
  on conflict (member_id) where status = 'pending'
  do update set changes = excluded.changes, note = excluded.note,
                created_at = now(), notified_at = null, requested_by = excluded.requested_by
  returning id into rid;
  return rid;
end $$;

-- 3-b) 기존 update_my_card(즉시 반영, 00003) → 승인 큐로 위임 (하위호환·정책 강화)
create or replace function public.update_my_card(
  p_phone text default null, p_address text default null,
  p_photo_url text default null, p_family_note text default null
) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform request_my_card_edit(jsonb_strip_nulls(jsonb_build_object(
    'phone', p_phone, 'address', p_address, 'family_note', p_family_note)));
  -- photo_url은 셀프서비스 비범위 (업로드 플로우 별도 과업)
end $$;

-- 4) 내 최신 요청 (배너용)
create or replace function public.my_edit_request()
returns table (id uuid, changes jsonb, note text, status text, decide_note text, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select r.id, r.changes, r.note, r.status, r.decide_note, r.created_at
  from member_edit_requests r
  where r.member_id = my_member_id()
  order by r.created_at desc limit 1
$$;

-- 5) 승인 큐 목록 (승인권자) — 현재값 스냅샷 포함
create or replace function public.member_edit_requests_list()
returns table (id uuid, member_id uuid, member_name text, changes jsonb, current jsonb,
               note text, requested_at timestamptz)
language sql stable security definer set search_path = public as $$
  select r.id, r.member_id, m.name || m.name_suffix, r.changes,
         jsonb_build_object('name', m.name, 'phone', m.phone, 'birthday', m.birthday,
                            'address', m.address, 'family_note', m.family_note),
         r.note, r.created_at
  from member_edit_requests r join members m on m.id = r.member_id
  where r.church_id = my_church_id() and r.status = 'pending'
    and public.can_decide_member_edit()
  order by r.created_at
$$;

-- 6) 승인/거절 — 승인 시 화이트리스트 키 존재 기준으로 반영 (tg_members_audit이 자동 기록)
create or replace function public.member_edit_decide(p_id uuid, p_approve boolean, p_note text default null)
returns void
language plpgsql security definer set search_path = public as $$
declare r member_edit_requests%rowtype;
begin
  if not public.can_decide_member_edit() then raise exception '승인 권한이 없습니다'; end if;
  select * into r from member_edit_requests
   where id = p_id and church_id = my_church_id() and status = 'pending';
  if not found then raise exception '대기 중인 요청이 아닙니다'; end if;

  if p_approve then
    update members set
      name        = case when r.changes ? 'name' then r.changes->>'name' else name end,
      phone       = case when r.changes ? 'phone' then r.changes->>'phone' else phone end,
      birthday    = case when r.changes ? 'birthday' then (r.changes->>'birthday')::date else birthday end,
      address     = case when r.changes ? 'address' then r.changes->>'address' else address end,
      family_note = case when r.changes ? 'family_note' then r.changes->>'family_note' else family_note end
    where id = r.member_id;
  end if;

  update member_edit_requests
  set status = case when p_approve then 'approved' else 'rejected' end,
      decided_by = auth.uid(), decided_at = now(), decide_note = nullif(trim(p_note), '')
  where id = p_id;
end $$;

grant execute on function public.register_my_card, public.request_my_card_edit,
  public.my_edit_request, public.member_edit_requests_list, public.member_edit_decide,
  public.can_decide_member_edit to authenticated;

-- 7) home_feed v1.1 — 'edit_pending' 추가 (00025 전체 재정의 + 1키)
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
        where n.church_id = my_church_id()
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
