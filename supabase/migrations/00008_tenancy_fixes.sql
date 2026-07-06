-- 플랫폼 검증(P2d·P5)에서 발견된 결함 수정

-- 1) church_id는 기본(안전) 컬럼 — INVOKER 모듈 쿼리가 참조 가능해야 함
grant select (church_id) on members to authenticated;

-- 2) get_member_card 테넌트 격리: 다른 교회 교인 카드는 역할 무관 차단
create or replace function get_member_card(p_member_id uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  m members%rowtype;
  result jsonb;
  can_see boolean;
begin
  select * into m from members where id = p_member_id;
  if not found then return null; end if;
  if m.church_id is distinct from my_church_id() then return null; end if;  -- 테넌트 격리

  can_see := case my_role()
    when 'superadmin' then true when 'pastor' then true when 'checker' then true
    when 'dept_leader' then m.id = my_member_id()
      or exists (select 1 from department_members dm
                 where dm.member_id = m.id
                   and dm.department_id in (select my_led_departments()))
    else m.id = my_member_id() end;
  if not can_see then return null; end if;

  result := jsonb_build_object(
    'id', m.id, 'name', m.name, 'name_suffix', m.name_suffix,
    'photo_url', m.photo_url, 'position', m.position,
    'member_type', m.member_type, 'status', m.status,
    'departments', (select coalesce(jsonb_agg(jsonb_build_object('id', d.id, 'name', d.name)), '[]'::jsonb)
                    from department_members dm join departments d on d.id = dm.department_id
                    where dm.member_id = m.id));

  if field_visible(p_member_id, 'contact') then result := result || jsonb_build_object('phone', m.phone); end if;
  if field_visible(p_member_id, 'birth') then result := result || jsonb_build_object('birthday', m.birthday); end if;
  if field_visible(p_member_id, 'address') then result := result || jsonb_build_object('address', m.address); end if;
  if field_visible(p_member_id, 'family') then result := result || jsonb_build_object('family_note', m.family_note); end if;
  if field_visible(p_member_id, 'pastoral') then
    result := result || jsonb_build_object(
      'care_target', m.care_target, 'guardian_name', m.guardian_name,
      'guardian_phone', m.guardian_phone, 'has_wander_device', m.has_wander_device,
      'dementia_center_registered', m.dementia_center_registered,
      'last_seen_at', (select max(last_seen) from presence_events pe
                       join devices dv on dv.id = pe.device_id where dv.member_id = m.id));
  end if;
  if field_visible(p_member_id, 'attendance') then
    result := result || jsonb_build_object('recent_attendances',
      (select coalesce(jsonb_agg(jsonb_build_object(
         'event_date', a.event_date, 'event_name', e.name, 'method', a.method, 'approved', a.approved)
         order by a.event_date desc), '[]'::jsonb)
       from (select * from attendances where member_id = m.id order by event_date desc limit 60) a
       join events e on e.id = a.event_id));
  end if;
  return result;
end $$;
