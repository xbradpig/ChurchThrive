-- 교인 초대 링크: 이메일·가입 절차 없이 어르신을 앱 사용자로 (문자/카톡으로 링크 전달)
create table member_invites (
  token text primary key,
  church_id uuid not null references churches(id),
  member_id uuid not null references members(id),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days',
  used_at timestamptz
);
create index on member_invites (member_id);
alter table member_invites enable row level security;
grant select on member_invites to authenticated;
grant all on member_invites to service_role;
create policy mi_select on member_invites for select to authenticated
  using (church_id = (select my_church_id()) and is_staff());
create trigger audit_member_invites after insert on member_invites
  for each row execute function tg_audit_generic();

-- 초대 생성 (담당자 이상): 기존 유효 토큰 있으면 재사용
create or replace function create_member_invite(p_member uuid)
returns text
language plpgsql security definer set search_path = public, extensions as $$
declare t text;
begin
  if not is_staff() then raise exception '권한이 없습니다'; end if;
  if not exists (select 1 from members where id = p_member and church_id = my_church_id()) then
    raise exception '우리 교회 교인이 아닙니다';
  end if;
  select token into t from member_invites
   where member_id = p_member and expires_at > now() limit 1;
  if t is null then
    t := encode(gen_random_bytes(24), 'hex');
    insert into member_invites (token, church_id, member_id, created_by)
    values (t, my_church_id(), p_member, auth.uid());
  end if;
  return t;
end $$;
grant execute on function create_member_invite to authenticated;

-- 초대 조회 (비로그인 수락 페이지용 — 이름·교회명만, 서비스 경유)
-- 수락 처리(계정 생성·연결)는 웹 API 라우트가 service key로 수행
