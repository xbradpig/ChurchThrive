-- 기본 시드: 부서, 이벤트(자동 분류 규칙 포함), 부서 담당자 항목 권한 기본값(출석만)

insert into departments (name, sort_order) values
  ('남전도회', 1), ('여전도회', 2), ('청년부', 3), ('교회학교', 4), ('성가대', 5), ('새가족부', 6)
on conflict (name) do nothing;

insert into events (name, category, schedule_rule, sort_order) values
  ('주일예배',   'worship', '{"dow":[0],"start":"09:00","end":"13:30"}', 1),
  ('수요예배',   'worship', '{"dow":[3],"start":"19:00","end":"21:30"}', 2),
  ('금요기도회', 'worship', '{"dow":[5],"start":"20:00","end":"23:00"}', 3),
  ('새벽예배',   'worship', '{"dow":[1,2,3,4,5,6],"start":"05:00","end":"06:30"}', 4),
  ('방문',       'visit',   null, 9)
on conflict (name) do nothing;

-- 부서 담당자 기본 권한: 출석만 공개, 나머지는 승인 필요
insert into field_permissions (role_scope, fgroup, allowed) values
  ('dept_leader', 'attendance', true),
  ('dept_leader', 'contact',    false),
  ('dept_leader', 'birth',      false),
  ('dept_leader', 'address',    false),
  ('dept_leader', 'family',     false),
  ('dept_leader', 'pastoral',   false)
on conflict (role_scope, fgroup) do nothing;
