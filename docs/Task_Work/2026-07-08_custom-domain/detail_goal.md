# Detail Goal — 커스텀 도메인 구현 설계

> 2026-07-08 · goal.md 실행 설계. 근거: analysis.md

## W1. `00034_custom_domain.sql`
```text
alter churches add custom_domain text unique,
  add custom_domain_status text not null default 'none'
    check in ('none','pending_dns','verifying','active','failed')
  add custom_domain_cf_id text   -- CF custom_hostname id (조회·삭제용)

church_slug_by_domain(p_host text) → text  (SECURITY DEFINER, anon+authenticated)
  select slug where lower(custom_domain)=lower(p_host) and status='active' and custom_domain_status='active'
set_custom_domain(p_domain text) → void  (superadmin, 형식 검증, status='pending_dns')
set_custom_domain_state(p_status text, p_cf_id text) → void (superadmin; API 라우트가 CF 응답 후 갱신)
clear_custom_domain() → void (superadmin)
get_church_profile: custom_domain·custom_domain_status 추가
```

## W2. `web/src/lib/cloudflare.ts` (CF for SaaS)
```text
cfConfigured(): boolean  -- CF_API_TOKEN && CF_ZONE_ID
createCustomHostname(hostname) → { id, ownership: {txt name,value}, ssl: [{txt/cname}] } | {error}
getCustomHostname(id) → { status, ssl_status, ownership, ssl_records }
deleteCustomHostname(id) → ok
  fetch https://api.cloudflare.com/client/v4/zones/{CF_ZONE_ID}/custom_hostnames ...
  Authorization: Bearer CF_API_TOKEN
```

## W3. `/api/custom-domain/route.ts` (superadmin 게이트)
```text
POST {domain}: 형식 검증 → set_custom_domain → cfConfigured?
  yes: createCustomHostname → set_custom_domain_state('verifying', cf_id) → 반환 DNS 안내 레코드
  no: 400 "Cloudflare 미설정 — 관리자에게 문의" (상태 pending_dns 유지)
GET: get_church_profile custom_domain + cf_id 있으면 getCustomHostname 상태 갱신(active면 set state active)
DELETE: cf_id 있으면 deleteCustomHostname → clear_custom_domain
  인증: 쿠키 세션(createServerClient) + my_role()=superadmin 재확인. 실제 DB write는 RPC(RLS/DEFINER)로.
```

## W4. 미들웨어 (Host 분기)
```text
host = header host, 소문자, 포트 제거
BASE_HOSTS = {church.havrutaproject.org, localhost, 127.0.0.1}
if host not in BASE:
  slug = church_slug_by_domain(host)  (RPC; 실패 → 기본 도메인으로 redirect)
  # 이후 루트 라우트(public/ROOT_PRIVATE)는 그대로, 테넌트 경로는 rewrite
  if isPublic or ROOT_PRIVATE(seg): return response
  if user && cookie != slug: set_active_church_by_slug(slug) → 쿠키 set
  target = path=='/' ? /{slug}/home : path.startsWith(/{slug}) ? path : /{slug}{path}
  return rewrite(target) + 쿠키 carry
else: 기존 경로 기반 로직
```

## W5. 설정 UI (ChurchSettings)
- "교회 도메인" 섹션: 현재 status 배지, 도메인 입력 + 등록(POST), pending/verifying 시 안내 레코드(CNAME `church.havrutaproject.org` + TXT) 표시 + 상태 새로고침(GET), active 배지, 해제(DELETE). superadmin만.

## W6. 검증 (로컬)
| 시나리오 | 기대 |
|---|---|
| set_custom_domain(superadmin) | status=pending_dns |
| set_custom_domain(비superadmin) | 거부 |
| church_slug_by_domain(active 도메인) | slug 반환 |
| church_slug_by_domain(미등록/비active) | null |
| 커스텀 Host로 `/home` 요청(로컬, active 세팅) | 내부적으로 /{slug}/home rewrite (로그인 필요시 /login) |
| cfConfigured 없이 POST | 400 미설정 |
| typecheck·build | 통과 |

## 배포 시(사용자 자격증명)
1. 클라우드 Supabase에 00026~00034 `supabase db push`.
2. Worker 배포 `wrangler deploy` + secret `CF_API_TOKEN`/`CF_ZONE_ID` 설정.
3. CF 존에 for SaaS 활성화, fallback origin 설정.
4. 커스텀 도메인마다 Supabase Auth Redirect URL 등록.

<!-- doc-crossverify:managed -->
## 🔁 Cross-LLM Verification

- **작성자(author)**: claude
- **검증자(reviewer)**: codex
- **문서유형**: plan
- **검증시각**: 2026-07-08T04:33:06.641Z
- **합의여부**: 🤝 합의 도달 (CONSENSUS)
- **최종판정**: ⚠️ NEEDS-REVISION
- **라운드 수**: 3

### R1 · 검증자(codex) — 판정 ⚠️ NEEDS-REVISION

VERDICT: NEEDS-REVISION
- 강점: DB/RPC/API/미들웨어/UI/검증 흐름이 작업 단위별로 구체적이며, 로컬 검증 시나리오가 일부 측정 가능하게 제시됨.
- 결함/누락: out-of-scope가 없음. 성공기준이 운영 관점의 완료 조건까지 명확하지 않음. Cloudflare for SaaS 설정, DNS 전파, Supabase Auth Redirect URL 수동 등록, `SECURITY DEFINER`/RLS 보안, Host 헤더 처리, rewrite loop, rollback 같은 리스크/가정이 부족함. 기존 자산 재사용 검토도 암시적일 뿐 명시되지 않음.
- 개선 제안: 성공기준을 “도메인 등록→DNS 안내→검증→active 라우팅→해제” 단계별로 측정 가능하게 재작성하고, scope/out-of-scope 섹션을 추가하세요. 리스크/의존성/완화책 표와 기존 RPC·미들웨어·Supabase client 재사용 근거를 별도 섹션으로 명시하세요.

### R2 · 원작자(claude) — 입장 AGREE

STANCE: **AGREE**

- **근거:**
  1. **out-of-scope 부재** — 문서는 "이것을 하지 않는다"가 명확하지 않습니다. 예: DNS 자동 등록 미지원, 도메인 이전 미처리, multi-domain per church 미지원 등이 명시되면 스코프가 명확해집니다.
  
  2. **운영 완료 조건 불명확** — W6은 로컬 검증(단위 테스트 수준)만 있고, 실제 도메인 등록 후 "DNS 전파 확인 → active 라우팅 동작 → 실제 조회 가능성" 같은 **end-to-end 검증 기준**이 없습니다.
  
  3. **리스크·가정 누락** — Supabase Auth Redirect URL **수동 등록의 반복성**, SECURITY DEFINER + RLS 보안(anon도 호출 가능한데 active만 필터링하는 것이 충분?), **rewrite loop 방지**, **rollback 절차**(CF custom_hostname 삭제 원자성) 등이 운영 리스크인데 언급 없습니다.
  
  4. **기존 자산 재사용이 암시적** — "기존 미들웨어", "RPC 구조" 재사용이라 하지만, 어디를 수정/신규하는지, 의존성이 무엇인지 별도 섹션 없이 흩어져 있습니다.

- **수정계획:**
  1. **Scope/Out-of-Scope** 섹션 추가 (예: DNS 자동화 X, domain transfer X, rate limiting X)
  2. **Success Criteria** 재작성 → 로컬 검증(W6 유지) + **운영 체크리스트**(도메인 등록→DNS 안내→status 폴링→active 확인→라우팅 동작→해제)
  3. **리스크·의존성·완화책 표** 추가 (CF 설정 필수, DNS 전파 시간, Auth Redirect URL 체크리스트, rewrite loop 방지, RLS 보안 재검토)
  4. **기존 자산 재사용 섹션** 명시 (어디를 수정하고, 어디를 신규로 작성하는지 명확히)

### R3 · 검증자(codex) — 판정 ⚠️ NEEDS-REVISION

VERDICT: NEEDS-REVISION
- 최종 판단 근거: 반론은 원 critique를 전면 수용했으므로 수용합니다. 다만 문서 자체에는 아직 Scope/Out-of-Scope, 운영 Success Criteria, 리스크·의존성·완화책 표, 기존 자산 재사용 섹션이 반영되지 않았습니다. Cloudflare/Auth Redirect/RLS·SECURITY DEFINER/rewrite loop/rollback도 배포 메모 수준이거나 누락되어 있어 통과 기준에는 미달입니다.

<!-- /doc-crossverify:managed -->
