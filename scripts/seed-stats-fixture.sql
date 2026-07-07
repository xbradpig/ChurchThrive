-- 교회 현황 검증용 로컬 픽스처 (goal.md DoD: 역할별 계정 + 13주 이상 출석 시드)
-- 로컬 전용 — 프로덕션 적용 금지. 재실행 안전(on conflict do nothing).
do $$
declare
  v_cid uuid := '11111111-1111-1111-1111-111111111111'; -- chungpa21
  v_worship uuid;
  v_sun date;
  v_admin uuid;
  i int; j int;
  v_members uuid[];
  v_take int;
  v_assign uuid;
begin
  select id into v_admin from auth.users where email = 'admin@chungpa.local';
  select id into v_worship from events
  where church_id = v_cid and category = 'worship' and active order by sort_order limit 1;
  select array_agg(id order by name) into v_members
  from members where church_id = v_cid and status = 'active' and member_type = 'registered';

  -- 최근 14주 주일 출석 (주차별로 인원 변동: 55%~75%)
  for i in 0..13 loop
    v_sun := (now() at time zone 'Asia/Seoul')::date
             - extract(dow from (now() at time zone 'Asia/Seoul')::date)::int - i * 7;
    v_take := floor(array_length(v_members, 1) * (0.55 + 0.20 * ((i * 7 + 3) % 10) / 10.0));
    for j in 1..v_take loop
      insert into attendances (church_id, member_id, event_id, event_date, method, approved, checked_by)
      values (v_cid, v_members[1 + ((j * 13 + i * 7) % array_length(v_members, 1))], v_worship, v_sun,
              ((array['manual','qr','self'])[1 + (j % 3)])::check_method, true, v_admin)
      on conflict do nothing;
    end loop;
  end loop;

  -- 전년 동기 (YoY 비교용): 52주 전 6주치
  for i in 0..5 loop
    v_sun := (now() at time zone 'Asia/Seoul')::date
             - extract(dow from (now() at time zone 'Asia/Seoul')::date)::int - (52 + i) * 7;
    for j in 1..floor(array_length(v_members, 1) * 0.5) loop
      insert into attendances (church_id, member_id, event_id, event_date, method, approved, checked_by)
      values (v_cid, v_members[1 + ((j * 11 + i * 5) % array_length(v_members, 1))], v_worship, v_sun,
              'manual'::check_method, true, v_admin)
      on conflict do nothing;
    end loop;
  end loop;

  -- 암송: 최신 과제에 60명 체크
  select id into v_assign from mod_verse.assignments where church_id = v_cid
  order by week_start desc limit 1;
  if v_assign is not null then
    for j in 1..60 loop
      insert into mod_verse.checks (assignment_id, member_id, church_id, method)
      values (v_assign, v_members[1 + ((j * 17) % array_length(v_members, 1))], v_cid, 'self')
      on conflict do nothing;
    end loop;
  end if;

  -- 헌금: 최근 6개월, 정기 20가정(매월) + 간헐 10가정
  for i in 0..5 loop
    for j in 1..20 loop
      insert into mod_giving.records (church_id, member_id, fund, amount, given_on, recorded_by)
      select v_cid, v_members[1 + ((j * 7) % array_length(v_members, 1))], '십일조',
             100000 + (j % 5) * 50000,
             (date_trunc('month', (now() at time zone 'Asia/Seoul')::date)::date - (i || ' months')::interval)::date + 6,
             v_admin
      where not exists (select 1 from mod_giving.records r
        where r.church_id = v_cid and r.member_id = v_members[1 + ((j * 7) % array_length(v_members, 1))]
          and r.fund = '십일조'
          and to_char(r.given_on, 'YYYY-MM') = to_char((date_trunc('month', (now() at time zone 'Asia/Seoul')::date)::date - (i || ' months')::interval)::date, 'YYYY-MM'));
    end loop;
  end loop;
  for j in 1..10 loop
    insert into mod_giving.records (church_id, member_id, fund, amount, given_on, recorded_by)
    select v_cid, v_members[1 + ((j * 23 + 3) % array_length(v_members, 1))], '감사헌금',
           50000, (now() at time zone 'Asia/Seoul')::date - (j * 11), v_admin
    where not exists (select 1 from mod_giving.records r
      where r.church_id = v_cid and r.fund = '감사헌금'
        and r.member_id = v_members[1 + ((j * 23 + 3) % array_length(v_members, 1))]);
  end loop;

  -- 새가족 5명 (최근 등록) + 정착 단계
  for j in 1..5 loop
    insert into members (church_id, name, name_suffix, member_type, status, created_at)
    select v_cid, '새가족' || j, '', 'new_family', 'active', now() - (j || ' days')::interval
    where not exists (select 1 from members where church_id = v_cid and name = '새가족' || j);
    insert into mod_newcomer.progress (church_id, member_id, stage, updated_at)
    select v_cid, m.id, least(j, 4), now() - (j || ' days')::interval
    from members m where m.church_id = v_cid and m.name = '새가족' || j
    on conflict do nothing;
  end loop;

  -- 전출입 이력: 교인 2명 상태 전환 (audit_log 경유 — members_audit 트리거가 기록)
  update members set status = 'moved'
  where id in (select id from members where church_id = v_cid and status = 'active'
               and member_type = 'registered' order by name desc limit 2)
    and not exists (select 1 from members where church_id = v_cid and status = 'moved');
end $$;
