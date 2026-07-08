# Goal — 교회 커스텀 도메인 연결 (Cloudflare for SaaS) · 홈 고도화 6단계

> 2026-07-08 · 상위 제안서 §1-B · 선행 1단계(경로 기반 URL) · 인프라: Cloudflare Workers + 클라우드 Supabase

## 목표

교회가 자체 구입한 도메인(예: `chungpa.church`)을 교회 설정 페이지에서 등록하면, 그 도메인이 자기 테넌트 홈으로 연결되는 화이트라벨 기능.

동작: 관리자가 도메인 입력 → CF for SaaS Custom Hostname 생성 → 검증용 DNS(CNAME/TXT) 안내 → 교회가 DNS 설정 → CF가 소유 검증(DCV) + TLS 자동 발급 → 미들웨어가 `Host`로 slug 해석해 내부 rewrite (`chungpa.church/home` → `/{chungpa21}/home`, URL은 커스텀 도메인 유지).

## 범위 구분 (사용자 확정: 빌드 가능한 부분 먼저)

**이번에 구현·로컬 검증 (본 과업):**
- [x] `00034` 적용: custom_domain 컬럼 + church_slug_by_domain(anon)·set/clear/set_state(superadmin) + get_church_profile 확장
- [x] 미들웨어 Host 분기 + slug rewrite + active_church 동기화 (쿠키 carry)
- [x] `web/src/lib/cloudflare.ts` CF for SaaS 모듈 (cfConfigured 게이트)
- [x] `/api/custom-domain` POST/GET/DELETE (superadmin 게이트, RPC write)
- [x] 교회 설정 UI 도메인 등록·DNS 안내(CNAME/TXT)·상태 새로고침·해제
- [x] typecheck·build·로컬 검증 (2026-07-08):
  RPC 6/6(형식거부·pending_dns·active→slug·미등록null·교인 등록/해제 거부),
  미들웨어 5/5(커스텀 /→login, /home→login, /login 200, /events rewrite 404, 미등록→기본도메인 리다이렉트)

**외부 자격증명·프로덕션 필요 (배포 시 사용자 자격증명으로 실행):**
- CF API 토큰 발급 + 존에 Cloudflare for SaaS 활성화
- 각 커스텀 도메인을 Supabase Auth redirect 허용목록 등록(호스트별 쿠키)
- 실제 Custom Hostname 프로비저닝·DCV·TLS

## 가정 / 리스크

- **가정**: 커스텀 도메인 방문자는 대개 해당 교회 멤버. 미들웨어는 기본 도메인이 아닌 Host에만 조회 1회(기본 도메인 요청은 스킵).
- **리스크**: ① 인증 쿠키는 호스트 단위 — 커스텀 도메인 세션이 기본 도메인과 분리 → OAuth 콜백은 기본 도메인, 커스텀 도메인은 각각 Supabase redirect 등록(배포 시). ② rewrite 시 쿠키 전달 누락 → 명시적 carry. ③ 미지의 커스텀 Host 접근 → 기본 도메인으로 리다이렉트. ④ 매 요청 RPC 비용 → 커스텀 Host에만, `ct-church` 쿠키로 동기화 생략.

## 비범위

- 커스텀 도메인 자동 갱신 모니터링 대시보드 (CF가 인증서 자동 갱신)
- 서브도메인 방식(경로 기반으로 충분)
- 이메일 도메인(발신)

<!-- doc-crossverify:managed -->
## 🔁 Cross-LLM Verification

- **작성자(author)**: claude
- **검증자(reviewer)**: codex
- **문서유형**: plan
- **검증시각**: 2026-07-08T04:31:44.364Z
- **합의여부**: 🤝 합의 도달 (CONSENSUS)
- **최종판정**: ⚠️ NEEDS-REVISION
- **라운드 수**: 3

### R1 · 검증자(codex) — 판정 ⚠️ NEEDS-REVISION

VERDICT: NEEDS-REVISION
- 강점: 구현 범위와 배포/외부 자격증명 필요 범위가 잘 분리되어 있고, 주요 인증·DNS·rewrite 리스크를 인지하고 있음.
- 결함/누락: 성공기준이 “무엇이 통과하면 완료인지” 수준으로 측정 가능하지 않음. 기존 미들웨어, 교회 설정 UI, Supabase RPC/RLS, Cloudflare 연동 유틸 등 기존 자산 재사용 검토가 명시되지 않음. 도메인 중복/검증/보안/RLS 실패, CF for SaaS 권한·요금제 의존성도 부족함.
- 개선 제안: 완료 기준을 `migration 적용`, `RPC 권한 테스트`, `POST/GET/DELETE API 동작`, `Host rewrite 검증`, `typecheck/build 통과`처럼 체크 가능한 항목으로 분리. 기존 파일/컴포넌트/헬퍼 재사용 계획을 추가하고, 도메인 유효성·중복·권한·Cloudflare 의존성 리스크를 보강할 것.

### R2 · 원작자(claude) — 입장 AGREE

STANCE: AGREE

- 근거: 성공 기준이 체크리스트 형태이지만, 각 항목의 **"검증 방법"**과 **"통과 조건"**이 명확하지 않음. 예를 들어 "미들웨어" 항목이 있지만 "Host rewrite가 정확히 어떻게 동작하면 성공인가"가 불명확함. 또한 기존 코드 자산(미들웨어, 교회 설정 UI, RPC/RLS 패턴, Cloudflare 유틸)을 재사용할 계획이 완전히 누락되었고, 도메인 중복 검증·유효성 확인·권한 검증 등 보안/운영 리스크가 충분히 다뤄지지 않음. Cloudflare for SaaS의 기술적 의존성(권한 요구사항, 요금제 제한, RLS 정책 충돌)도 명시되지 않음.

- 수정계획:
  1. **성공 기준 재구성** — 체크 가능하도록 구체화:
     - `migration 00034` 적용 + `PRAGMA table_info` 확인
     - RPC 권한 테스트: superadmin만 `set_custom_domain` 호출 가능 검증
     - API 동작 테스트: `POST /api/custom-domain` (생성), `GET` (조회), `DELETE` (해제) 각각 상태 코드 + 응답 검증
     - Host rewrite 검증: `curl -H "Host: chungpa.church" localhost:3000/home` → 내부적으로 `/{chungpa21}/home` 경로 접근 확인
     - typecheck/build 통과 (기존 항목 유지)
  
  2. **기존 자산 재사용 섹션 추가**:
     - 미들웨어: 기존 `src/middleware.ts`의 어느 부분을 확장할지 명시
     - 교회 설정 UI: 기존 폼/검증 컴포넌트 식별
     - RPC/RLS: 기존 `church_slug_by_domain`·`get_church_profile` 등과의 의존성 확인
  
  3. **리스크/의존성 섹션 보강**:
     - ⑤ 도메인 중복 방지: `custom_domain` 컬럼에 `UNIQUE` 제약 + 중복 검증 RPC
     - ⑥ Cloudflare for SaaS 권한: 존에 이 기능 활성화 확인, API 토큰 권한(`#zone:read`, `#account:read`)
     - ⑦ RLS 실패 시나리오: anon이 다른 교회 도메인 해제 시도 → 403 반환 확인

### R3 · 검증자(codex) — 판정 ⚠️ NEEDS-REVISION

VERDICT: NEEDS-REVISION
- 최종 판단 근거: 반론은 수용한다. 저자의 수정계획은 타당하지만, 현재 문서에는 아직 반영되지 않았다. 성공 기준은 여전히 검증 방법/통과 조건이 부족하고, 기존 자산 재사용 계획과 도메인 중복·권한·RLS 실패·Cloudflare for SaaS 의존성 리스크 보강도 빠져 있다. 원 판정 유지.

<!-- /doc-crossverify:managed -->
