# Analysis — 커스텀 도메인 (현황 조사)

> 2026-07-08 · 인프라 + web/src 실사

## 1. 인프라 (중요)

- **프로덕션 = Cloudflare Workers(OpenNext)** — `wrangler.jsonc`: worker `churchthrive`, route `church.havrutaproject.org` custom_domain. `server: cloudflare`/`x-opennext` 헤더 확인.
- **DB = 클라우드 Supabase** `fcnbbumpjqhycpbhlyfk`. (로컬 Docker는 dev용, 별개)
- CF Workers는 커스텀 호스트네임을 Worker route로 받을 수 있고, **Cloudflare for SaaS(Custom Hostnames)**로 교회별 도메인을 프로그래매틱 발급·DCV·TLS 자동.

## 2. 기존 자산 (Capability-First)

| 자산 | 재사용 |
|---|---|
| `churches.slug`(unique)·`set_active_church_by_slug`(1단계) | 커스텀 도메인 → slug rewrite 후 동일 테넌트 플로우 |
| 미들웨어 slug 분기(1단계) | Host 분기 1개 최상단 추가 |
| `get_church_profile`(00024, slug 반환) | custom_domain 필드 추가 |
| API 라우트 service-client 패턴(`api/apply`) | `/api/custom-domain`에 재사용 |
| `ct-church` 쿠키 | 커스텀 도메인에서도 동기화 생략 힌트 |

## 3. 인증 쿠키 제약 (핵심)

- Supabase Auth 쿠키(`sb-churchthrive-auth`)는 **호스트 단위**. 커스텀 도메인 로그인 세션 ≠ 기본 도메인 세션.
- 대응: 각 커스텀 도메인을 Supabase Auth `redirect allow-list`(Site URL/Additional Redirect URLs)에 등록해야 OAuth/매직링크 콜백 정상. 이는 **배포 시 사용자 자격증명으로** 처리(Supabase Management API 또는 대시보드).
- 커스텀 도메인 자체는 같은 Worker가 서빙하므로 `/login` 등 루트 라우트도 그 도메인에서 동작.

## 4. Cloudflare for SaaS API

- Custom Hostname 생성: `POST /zones/{zone_id}/custom_hostnames` body `{hostname, ssl:{method:'txt'|'http', type:'dv'}}` → 반환에 `ownership_verification`(TXT) + SSL `validation_records`(CNAME/TXT).
- 상태 조회: `GET /zones/{zone_id}/custom_hostnames/{id}` → `status`(pending/active), `ssl.status`.
- 삭제: `DELETE`. 토큰 권한: Zone > SSL and Certificates: Edit + Zone > Zone Settings.
- env: `CF_API_TOKEN`, `CF_ZONE_ID` (Worker secret/var). 없으면 등록 API가 명확히 "미설정" 반환.

## 5. 미들웨어 rewrite 설계

- 커스텀 도메인은 slug가 Host로 **암묵** → 사용자는 `customdomain/home`을 입력(경로에 slug 없음). `Host`→slug 조회 후 `/{slug}${path}`로 **rewrite**(리다이렉트 아님, URL 유지).
- 루트 라우트(login·api·signup 등)는 rewrite 없이 그대로. 테넌트 경로만 slug 주입.
- rewrite 응답에 세션 쿠키 명시 carry(기존 response 누적 쿠키 복사).

## 6. 최신 상태

- 다음 마이그레이션: **00034** (로컬 00033까지 적용). 클라우드 반영은 배포 시.
- 로컬 검증법: `churches.custom_domain` 임시 세팅 + curl `-H "Host: <domain>"` 로 rewrite 확인.

<!-- doc-crossverify:managed -->
## 🔁 Cross-LLM Verification

- **작성자(author)**: claude
- **검증자(reviewer)**: codex
- **문서유형**: analysis
- **검증시각**: 2026-07-08T04:32:52.513Z
- **합의여부**: 🤝 합의 도달 (CONSENSUS)
- **최종판정**: ⚠️ NEEDS-REVISION
- **라운드 수**: 3

### R1 · 검증자(codex) — 판정 ⚠️ NEEDS-REVISION

VERDICT: NEEDS-REVISION
- 강점: `web/wrangler.jsonc`, `web/src/middleware.ts`, `supabase/migrations/00024/00026`, `web/src/app/api/apply/route.ts` 기반의 재사용 후보 식별은 대체로 타당함.
- 결함/누락: 중복 자산/심볼/테이블 검토가 명시적으로 없음. `custom_domain`, `church_slug_by_domain`, 기존 도메인 관련 테이블/컬럼 부재를 `rg`/스키마 근거로 제시하지 않음. `server: cloudflare`/`x-opennext` 헤더 확인, 클라우드 Supabase 실측, Cloudflare API 권한/응답 구조는 증거 출력이나 출처가 없어 추정처럼 보임.
- 개선 제안: `rg custom_domain|church_slug_by_domain|hostname`, `supabase/migrations` 스키마 확인, `curl -I` 헤더 확인, Supabase 프로젝트/마이그레이션 상태 확인 결과를 파일경로·심볼·명령 출력으로 붙이고, “기존 재사용”과 “신규 생성 필요”를 항목별로 분리해 근거를 명시할 것.

### R2 · 원작자(claude) — 입장 AGREE

STANCE: **AGREE**

- **근거:** 분석이 개념적으로는 방향이 맞지만, **근거 없는 추정**이 3곳 이상:
  1. `custom_domain` 필드가 실제로 스키마에 존재하는지 → `supabase/migrations` 내용 확인 없음
  2. `church_slug_by_domain` 테이블 존재 여부 → `rg` 명령 출력 없음  
  3. Cloudflare API 권한(`CF_API_TOKEN` 등) 실제 설정 상태 → Worker env 검증 없음
  4. "다음 마이그레이션: 00034" 주장 → 실제 파일 목록 확인 없음

  이 때문에 "추정처럼 보이고" 실행 단계에서 틀릴 위험이 높음.

- **수정계획:**
  1. `grep -r "custom_domain\|church_slug_by_domain\|hostname" supabase/migrations` 출력 포함 → 존재 확인
  2. `supabase/migrations/` 최신 파일 목록 + 해당 SQL 스키마 변경 부분 직접 인용
  3. `wrangler.jsonc`, `web/src/middleware.ts` 실제 코드 조각 인용 (env 변수, route 패턴)
  4. 각 자산을 **명시적으로 분류:**
     - ✅ 기존 재사용 가능: `churches.slug`, `set_active_church_by_slug` (파일경로+함수명)
     - ⚠️ 신규 필드 추가 필요: `churches.custom_domain` (마이그레이션 필요)
     - ⚠️ 신규 테이블 필요: `church_slug_by_domain` (존재 확인 → 부재면 생성)
     - ⚠️ Worker 설정 필요: `CF_API_TOKEN`, `CF_ZONE_ID` (명시적 setup)
  5. Cloudflare API 권한 검증 또는 "배포 시 확인 필요" 명시

### R3 · 검증자(codex) — 판정 ⚠️ NEEDS-REVISION

VERDICT: NEEDS-REVISION
- 최종 판단 근거: 반론은 수용한다. 저자가 기존 critique를 인정했고 수정계획도 적절하지만, 현재 문서에는 여전히 `rg/grep` 출력, 마이그레이션 파일 목록/스키마 근거, 코드 인용, 헤더 확인, Cloudflare/Supabase 설정 검증이 반영되어 있지 않다. 즉 계획은 맞지만 문서 자체의 근거 부족은 아직 해소되지 않았으므로 PASS는 불가하다.

<!-- /doc-crossverify:managed -->
