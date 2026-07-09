-- 연합 이벤트 수신 (Phase 0.5 — 교인카드 타임라인)
-- 타 앱(manna 등)이 발행한 이벤트를 수신해 교인카드에 출처와 함께 표시.
-- 정본: docs/guides/havruta-ecosystem.md §5. 수신 처리는 @havruta/contracts handleIncoming.

-- 교인 ↔ Havruta ID 링크 (포털 신원과 연결)
alter table members add column if not exists havruta_id uuid unique;

-- 수신 이벤트 사본 (event_id = 멱등 키)
create table if not exists federation_events (
  event_id     uuid primary key,
  havruta_id   uuid not null,
  source_app   text not null,
  type         text not null,
  payload      jsonb,
  occurred_at  timestamptz,
  church_id    uuid references churches(id),   -- 해석된 소속(테넌시)
  received_at  timestamptz not null default now()
);
create index if not exists idx_fedev_havruta on federation_events (havruta_id, occurred_at desc);
create index if not exists idx_fedev_church on federation_events (church_id, received_at desc);

alter table federation_events enable row level security;
grant select on federation_events to authenticated;
grant all on federation_events to service_role;

-- 스태프는 자기 교회의 연합 이벤트만 열람
drop policy if exists fe_sel on federation_events;
create policy fe_sel on federation_events for select to authenticated
  using (church_id = (select my_church_id()) and is_staff());

-- 교인카드 타임라인 (havruta_id로 연결, 스태프·자기 교회 한정)
create or replace function member_federation_timeline(p_member_id uuid)
returns table (event_id uuid, source_app text, type text, payload jsonb, occurred_at timestamptz)
language sql stable security definer set search_path = public as $$
  select f.event_id, f.source_app, f.type, f.payload, f.occurred_at
  from federation_events f
  join members m on m.havruta_id = f.havruta_id
  where m.id = p_member_id and m.church_id = my_church_id() and is_staff()
  order by f.occurred_at desc nulls last, f.received_at desc
  limit 100
$$;
grant execute on function member_federation_timeline to authenticated;
