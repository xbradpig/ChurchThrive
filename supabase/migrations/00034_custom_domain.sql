-- 00034: 교회 커스텀 도메인 (Cloudflare for SaaS) — 홈 고도화 6단계
-- docs/Task_Work/2026-07-08_custom-domain/detail_goal.md
-- 교회가 산 도메인을 등록하면 Host→slug rewrite로 자기 테넌트 연결 (경로 기반 위에 얹음)

alter table churches
  add column if not exists custom_domain text unique,
  add column if not exists custom_domain_status text not null default 'none'
    check (custom_domain_status in ('none','pending_dns','verifying','active','failed')),
  add column if not exists custom_domain_cf_id text;   -- CF custom_hostname id (조회·삭제용)

-- 미들웨어용: Host → slug (anon 허용 — 커스텀 도메인 방문자는 로그아웃일 수 있음)
-- active 교회의 active 도메인만 반환(존재 정보 노출 최소화)
create or replace function public.church_slug_by_domain(p_host text)
returns text
language sql stable security definer set search_path = public as $$
  select slug from churches
   where lower(custom_domain) = lower(p_host)
     and status = 'active' and custom_domain_status = 'active'
$$;
revoke all on function public.church_slug_by_domain(text) from public;
grant execute on function public.church_slug_by_domain(text) to anon, authenticated;

-- 도메인 등록 (superadmin) — 형식 검증 후 pending_dns
create or replace function public.set_custom_domain(p_domain text)
returns void
language plpgsql security definer set search_path = public as $$
declare d text := lower(trim(p_domain));
begin
  if my_role() is distinct from 'superadmin' then raise exception '교회 관리자만 가능합니다'; end if;
  if d !~ '^(?!-)[a-z0-9-]{1,63}(\.[a-z0-9-]{1,63})+$' then
    raise exception '도메인 형식을 확인해주세요 (예: church.example.com)'; end if;
  if exists (select 1 from churches where lower(custom_domain) = d and id <> my_church_id()) then
    raise exception '이미 다른 교회가 사용 중인 도메인입니다'; end if;
  update churches
    set custom_domain = d, custom_domain_status = 'pending_dns', custom_domain_cf_id = null
    where id = my_church_id();
  insert into audit_log (actor_user_id, action, target_table, target_id, after_json, church_id)
  values (auth.uid(), 'custom_domain_set', 'churches', my_church_id()::text,
          jsonb_build_object('domain', d), my_church_id());
end $$;
grant execute on function public.set_custom_domain(text) to authenticated;

-- CF 응답 후 상태/식별자 갱신 (superadmin — API 라우트에서 호출)
create or replace function public.set_custom_domain_state(p_status text, p_cf_id text default null)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if my_role() is distinct from 'superadmin' then raise exception '교회 관리자만 가능합니다'; end if;
  if p_status not in ('none','pending_dns','verifying','active','failed') then
    raise exception '잘못된 상태값'; end if;
  update churches set custom_domain_status = p_status,
    custom_domain_cf_id = coalesce(p_cf_id, custom_domain_cf_id)
    where id = my_church_id();
end $$;
grant execute on function public.set_custom_domain_state(text, text) to authenticated;

-- 도메인 해제 (superadmin)
create or replace function public.clear_custom_domain()
returns void
language plpgsql security definer set search_path = public as $$
begin
  if my_role() is distinct from 'superadmin' then raise exception '교회 관리자만 가능합니다'; end if;
  update churches set custom_domain = null, custom_domain_status = 'none', custom_domain_cf_id = null
    where id = my_church_id();
  insert into audit_log (actor_user_id, action, target_table, target_id, church_id)
  values (auth.uid(), 'custom_domain_clear', 'churches', my_church_id()::text, my_church_id());
end $$;
grant execute on function public.clear_custom_domain() to authenticated;

-- get_church_profile 확장 (custom_domain 필드 + cf_id)
create or replace function get_church_profile()
returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('name', name, 'slug', slug, 'denomination', denomination,
    'pastor_name', pastor_name, 'contact_phone', contact_phone, 'address', address,
    'intro', intro, 'member_size', member_size, 'status', status, 'created_at', created_at,
    'custom_domain', custom_domain, 'custom_domain_status', custom_domain_status,
    'custom_domain_cf_id', custom_domain_cf_id)
  from churches where id = my_church_id() and is_staff()
$$;
grant execute on function get_church_profile to authenticated;
