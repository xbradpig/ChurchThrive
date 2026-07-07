-- 00026: 교회별 URL(경로 기반 테넌시) 컨텍스트 함수
-- docs/Task_Work/2026-07-07_church-url-tenancy/detail_goal.md W1

-- URL slug와 active_church 동기화.
-- 교회 없음 / 비활성 / 비소속 → 모두 null (존재 여부 정보 비노출)
create or replace function public.set_active_church_by_slug(p_slug text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_church uuid;
begin
  if auth.uid() is null then
    return null;
  end if;
  select c.id into v_church
    from churches c
   where c.slug = p_slug and c.status = 'active';
  if v_church is null then
    return null;
  end if;
  if not exists (
    select 1 from church_roles r
     where r.church_id = v_church and r.user_id = auth.uid()
  ) then
    return null;
  end if;
  insert into active_church (user_id, church_id)
  values (auth.uid(), v_church)
  on conflict (user_id) do update set church_id = excluded.church_id, updated_at = now();
  return v_church;
end $$;

revoke all on function public.set_active_church_by_slug(text) from public, anon;
grant execute on function public.set_active_church_by_slug(text) to authenticated;

-- 레거시 URL(/home 등) → /{slug}/... 리다이렉트용
create or replace function public.my_church_slug()
returns text
language sql security definer stable set search_path = public as $$
  select c.slug from churches c where c.id = my_church_id();
$$;

revoke all on function public.my_church_slug() from public, anon;
grant execute on function public.my_church_slug() to authenticated;

-- 파일럿 교회 slug 개명: chungpa → chungpa21 (사용자 확정 2026-07-07, 서비스 공개 전 1회성)
-- 반드시 아래 불변 트리거 생성보다 먼저 실행되어야 한다.
update churches set slug = 'chungpa21' where slug = 'chungpa';

-- slug는 ID처럼 불변 — 등록(register_church) 시 1회 입력 후 변경 금지.
-- 변경되면 공유된 모든 링크·북마크·초대 QR이 깨짐. service_role 스크립트 실수까지 차단.
create or replace function public.tg_churches_slug_immutable()
returns trigger language plpgsql as $$
begin
  if old.slug is not null and new.slug is distinct from old.slug then
    raise exception '교회 영문 주소(slug)는 변경할 수 없습니다';
  end if;
  return new;
end $$;

drop trigger if exists churches_slug_immutable on churches;
create trigger churches_slug_immutable
  before update on churches
  for each row execute function public.tg_churches_slug_immutable();

-- slug가 시스템 라우트를 가리지 않도록 예약어 차단 (라우트 SSOT: web/src/app 1단계 세그먼트)
alter table churches add constraint churches_slug_reserved check (
  slug not in (
    'login','signup','home','church','admin','check','scan','me','menu',
    'members','invites','invite','join','pending','platform','store','start',
    'apply','api','m','register-intro','register-church','forgot-password',
    'reset-password','set-password','icons','link','manifest.json','sw.js'
  )
);
