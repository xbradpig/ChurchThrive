-- 교회 관리 고도화 Phase A·B: 교인 명부 · 부서 관리 · 교회 설정 (church-admin-upgrade)
-- 원칙: hard delete 금지(상태 전환만), 담당자 이상 열람, 연락처는 교역자/관리자만, 전 변경 감사 기록

-- 1) 교인 명부 (검색·부서·상태 필터)
create or replace function admin_list_members(
  p_search text default null, p_dept uuid default null, p_status text default null
) returns table (
  id uuid, name text, name_suffix text, phone text, "position" text,
  status text, member_type text, joined boolean, photo_url text,
  departments jsonb, birthday date
)
language sql stable security definer set search_path = public as $$
  select m.id, m.name, m.name_suffix,
         case when my_role() in ('superadmin','pastor') then m.phone end,
         m.position, m.status::text, m.member_type::text,
         (m.user_id is not null),
         m.photo_url,
         coalesce((select jsonb_agg(jsonb_build_object('id', d.id, 'name', d.name))
                   from department_members dm join departments d on d.id = dm.department_id
                   where dm.member_id = m.id), '[]'::jsonb),
         case when my_role() in ('superadmin','pastor') then m.birthday end
  from members m
  where m.church_id = my_church_id() and is_staff()
    and (p_search is null or (m.name || m.name_suffix) ilike '%' || p_search || '%')
    and (p_dept is null or exists (select 1 from department_members dm
                                   where dm.member_id = m.id and dm.department_id = p_dept))
    and (p_status is null or m.status::text = p_status)
  order by m.status = 'active' desc, m.name collate "ko-KR-x-icu"
$$;
grant execute on function admin_list_members to authenticated;

-- 2) 교인 등록·수정 (관리자/교역자) — 삭제 없음, 상태 전환만
create or replace function admin_upsert_member(
  p_id uuid default null, p_name text default null, p_suffix text default '',
  p_phone text default null, p_birthday date default null,
  p_position text default null, p_status text default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare mid uuid;
begin
  if my_role() not in ('superadmin','pastor') then raise exception '교역자 이상만 가능합니다'; end if;
  if p_status is not null and p_status not in ('active','inactive','moved','deceased') then
    raise exception '잘못된 상태'; end if;
  if p_id is null then
    if coalesce(trim(p_name), '') = '' then raise exception '이름이 필요합니다'; end if;
    insert into members (church_id, name, name_suffix, phone, birthday, position, member_type, status)
    values (my_church_id(), trim(p_name), coalesce(p_suffix, ''), nullif(trim(p_phone), ''),
            p_birthday, nullif(trim(p_position), ''), 'registered', coalesce(p_status, 'active')::member_status)
    returning id into mid;
  else
    select id into mid from members where id = p_id and church_id = my_church_id();
    if mid is null then raise exception '우리 교회 교인이 아닙니다'; end if;
    update members set
      name = coalesce(nullif(trim(p_name), ''), name),
      name_suffix = coalesce(p_suffix, name_suffix),
      phone = coalesce(nullif(trim(p_phone), ''), phone),
      birthday = coalesce(p_birthday, birthday),
      position = coalesce(nullif(trim(p_position), ''), position),
      status = coalesce(p_status::member_status, status),
      updated_at = now()
    where id = mid;
  end if;
  insert into audit_log (actor_user_id, action, target_table, target_id, after_json, church_id)
  values (auth.uid(), case when p_id is null then 'member_create' else 'member_update' end,
          'members', mid::text,
          jsonb_strip_nulls(jsonb_build_object('name', p_name, 'status', p_status, 'position', p_position)),
          my_church_id());
  return mid;
end $$;
grant execute on function admin_upsert_member to authenticated;

-- 3) 부서 관리 (관리자/교역자)
create or replace function admin_save_department(p_id uuid default null, p_name text default null)
returns uuid
language plpgsql security definer set search_path = public as $$
declare did uuid;
begin
  if my_role() not in ('superadmin','pastor') then raise exception '교역자 이상만 가능합니다'; end if;
  if coalesce(trim(p_name), '') = '' then raise exception '부서 이름이 필요합니다'; end if;
  if p_id is null then
    insert into departments (church_id, name, sort_order)
    values (my_church_id(), trim(p_name),
            coalesce((select max(sort_order) + 1 from departments where church_id = my_church_id()), 1))
    returning id into did;
  else
    update departments set name = trim(p_name)
    where id = p_id and church_id = my_church_id() returning id into did;
    if did is null then raise exception '우리 교회 부서가 아닙니다'; end if;
  end if;
  insert into audit_log (actor_user_id, action, target_table, target_id, after_json, church_id)
  values (auth.uid(), 'department_save', 'departments', did::text,
          jsonb_build_object('name', p_name), my_church_id());
  return did;
end $$;
grant execute on function admin_save_department to authenticated;

create or replace function admin_delete_department(p_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if my_role() not in ('superadmin','pastor') then raise exception '교역자 이상만 가능합니다'; end if;
  if exists (select 1 from department_members where department_id = p_id) then
    raise exception '부서원이 있는 부서는 삭제할 수 없습니다. 먼저 부서원을 옮겨주세요';
  end if;
  delete from department_leaders where department_id = p_id;
  delete from departments where id = p_id and church_id = my_church_id();
  insert into audit_log (actor_user_id, action, target_table, target_id, church_id)
  values (auth.uid(), 'department_delete', 'departments', p_id::text, my_church_id());
end $$;
grant execute on function admin_delete_department to authenticated;

create or replace function admin_assign_department(p_member uuid, p_dept uuid, p_add boolean)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if my_role() not in ('superadmin','pastor') then raise exception '교역자 이상만 가능합니다'; end if;
  if not exists (select 1 from members where id = p_member and church_id = my_church_id())
     or not exists (select 1 from departments where id = p_dept and church_id = my_church_id()) then
    raise exception '우리 교회 소속이 아닙니다';
  end if;
  if p_add then
    insert into department_members (member_id, department_id) values (p_member, p_dept)
      on conflict do nothing;
  else
    delete from department_members where member_id = p_member and department_id = p_dept;
    delete from department_leaders where member_id = p_member and department_id = p_dept;
  end if;
  insert into audit_log (actor_user_id, action, target_table, target_id, after_json, church_id)
  values (auth.uid(), 'dept_assign', 'department_members', p_member::text,
          jsonb_build_object('dept', p_dept, 'add', p_add), my_church_id());
end $$;
grant execute on function admin_assign_department to authenticated;

create or replace function admin_set_dept_leader(p_dept uuid, p_member uuid, p_on boolean)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if my_role() not in ('superadmin','pastor') then raise exception '교역자 이상만 가능합니다'; end if;
  if p_on then
    insert into department_members (member_id, department_id) values (p_member, p_dept)
      on conflict do nothing;
    insert into department_leaders (member_id, department_id, status, approved_by, approved_at)
    values (p_member, p_dept, 'approved', auth.uid(), now())
    on conflict do nothing;
  else
    delete from department_leaders where member_id = p_member and department_id = p_dept;
  end if;
  insert into audit_log (actor_user_id, action, target_table, target_id, after_json, church_id)
  values (auth.uid(), 'dept_leader_set', 'department_leaders', p_member::text,
          jsonb_build_object('dept', p_dept, 'on', p_on), my_church_id());
end $$;
grant execute on function admin_set_dept_leader to authenticated;

-- 부서 목록 + 인원·부서장 (담당자 이상)
create or replace function admin_list_departments()
returns table (id uuid, name text, sort_order int, member_count bigint, leaders jsonb)
language sql stable security definer set search_path = public as $$
  select d.id, d.name, d.sort_order,
         (select count(*) from department_members dm where dm.department_id = d.id),
         coalesce((select jsonb_agg(jsonb_build_object('member_id', m.id, 'name', m.name || m.name_suffix))
                   from department_leaders dl join members m on m.id = dl.member_id
                   where dl.department_id = d.id and dl.status = 'approved'), '[]'::jsonb)
  from departments d
  where d.church_id = my_church_id() and is_staff()
  order by d.sort_order, d.name
$$;
grant execute on function admin_list_departments to authenticated;

-- 4) 교회 설정 (관리자)
create or replace function update_church_profile(p jsonb)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if my_role() is distinct from 'superadmin' then raise exception '교회 관리자만 가능합니다'; end if;
  update churches set
    name = coalesce(nullif(trim(p->>'name'), ''), name),
    denomination = coalesce(nullif(trim(p->>'denomination'), ''), denomination),
    pastor_name = coalesce(nullif(trim(p->>'pastor_name'), ''), pastor_name),
    contact_phone = coalesce(nullif(trim(p->>'contact_phone'), ''), contact_phone),
    address = coalesce(nullif(trim(p->>'address'), ''), address),
    intro = coalesce(nullif(trim(p->>'intro'), ''), intro)
  where id = my_church_id();
  insert into audit_log (actor_user_id, action, target_table, target_id, after_json, church_id)
  values (auth.uid(), 'church_profile_update', 'churches', my_church_id()::text,
          jsonb_strip_nulls(p), my_church_id());
end $$;
grant execute on function update_church_profile to authenticated;

create or replace function get_church_profile()
returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('name', name, 'slug', slug, 'denomination', denomination,
    'pastor_name', pastor_name, 'contact_phone', contact_phone, 'address', address,
    'intro', intro, 'member_size', member_size, 'status', status, 'created_at', created_at)
  from churches where id = my_church_id() and is_staff()
$$;
grant execute on function get_church_profile to authenticated;

-- 5) 가입 신청 큐 (명부 상단 통합용 — 이메일 포함)
create or replace function admin_list_join_requests()
returns table (id uuid, applicant_name text, email text, note text, requested_at timestamptz)
language sql stable security definer set search_path = public as $$
  select j.id, j.applicant_name, u.email::text, j.note, j.requested_at
  from join_requests j join auth.users u on u.id = j.user_id
  where j.church_id = my_church_id() and j.status = 'pending'
    and my_role() in ('superadmin','pastor')
  order by j.requested_at
$$;
grant execute on function admin_list_join_requests to authenticated;
