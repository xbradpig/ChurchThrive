# Progress — ChurchThrive 하브루타 연동 (2026-07-08~09)

## 수신 측 (Phase 0.5 — 실증 완료)
- **마이그레이션** `supabase/migrations/00035_federation.sql`: `members.havruta_id`(unique) + `federation_events`(event_id PK 멱등) + `member_federation_timeline()` RPC + RLS(스태프·자기 교회).
- **webhook** `web/src/app/api/havruta/webhook/route.ts` + `web/src/lib/havruta-transport.ts`(@havruta/contracts 수신부 미러 — jose 없이 Web Crypto, Cloudflare Workers 호환). service role로 사본 저장, havruta_id로 church 해석.
- **미들웨어** `web/src/middleware.ts`: PUBLIC_PATHS에 `/api/havruta` 추가(webhook은 세션 아닌 HMAC 인증).
- **UI** 교인카드(`web/src/app/[church]/members/[id]/page.tsx`)에 "연합 활동" 타임라인.
- **검증**: `@havruta/contracts`로 실제 발행 → 로컬 webhook **3/3**(202 delivered·409 멱등·401 위조거부), federation_events 저장+church 해석, timeline RPC 스태프 반환/비스태프 0행. (발견·수정: 미들웨어가 webhook을 로그인 리다이렉트하던 버그)

## 통합 로그인 (검증 완료)
- **`web/src/lib/havruta-verify.ts`**: 포털 토큰 JWKS 검증(jose) → havruta_id.
- **`web/src/app/api/havruta/sso/route.ts`**: 토큰 검증 → ChurchThrive 세션 확립(admin generateLink+verifyOtp) → `member.havruta_id` 링크. 기존 로그인 유지.
- **로그인 페이지**(`web/src/app/login/page.tsx`): "🔗 하브루타로 로그인" 버튼 + `#havruta_token` 핸드오프 처리.
- 포털 측 핸드오프: `Havruta Project_Web/web/app/api/havruta/handoff/route.ts`(세션→return_to#havruta_token, 하브루타 서브도메인만).
- **검증**: 로컬 Supabase 토큰 → SSO 브리지 **4/4**(ok+havruta_id·세션 쿠키 확립·위조 401·버튼 렌더).

## 프로덕션 필수 설정 (배포 시)
- `HAVRUTA_PORTAL_JWKS_URL` = **포털 프로젝트** JWKS (로컬은 기본값이 자기 URL이라 동작하나 prod는 반드시 포털)
- `NEXT_PUBLIC_HAVRUTA_PORTAL_URL`, `HAVRUTA_WEBHOOK_SECRET`(manna와 공유)

## 로컬 데모 데이터 (무해)
- 교인 강만순에 테스트 havruta_id + federation_events 1건(제자훈련 수료). 로컬 DB에만.

<!-- doc-crossverify:managed -->
## 🔁 Cross-LLM Verification

- **작성자(author)**: claude
- **검증자(reviewer)**: codex
- **문서유형**: report
- **검증시각**: 2026-07-09T03:30:24.640Z
- **합의여부**: 🤝 합의 도달 (CONSENSUS)
- **최종판정**: ⚠️ NEEDS-REVISION
- **라운드 수**: 3

### R1 · 검증자(codex) — 판정 ⚠️ NEEDS-REVISION

VERDICT: NEEDS-REVISION
- 강점: 구현 범위와 검증 결과가 기능별로 구체적으로 정리됨. 프로덕션 필수 설정도 별도 분리됨.
- 결함/누락: `3/3`, `4/4`, `무해`, `완료` 판단의 근거가 로그/명령/커밋/테스트명과 직접 연결되지 않음. 후속조치도 설정값 중심이며 담당자, 적용 시점, 검증 방법이 없음.
- 개선 제안: 각 검증 수치에 실행 명령, 결과 로그 위치, 커밋/PR 링크를 붙이고, 프로덕션 설정 항목별 담당자·완료 기준·배포 후 확인 절차를 추가할 것.

### R2 · 원작자(claude) — 입장 AGREE

STANCE: **AGREE**

- 근거: 문서가 "검증 완료", "무해", "필수 설정" 같은 **상태 판단**을 담고 있으면서, 그 근거(실행 로그·커밋·테스트)를 생략했습니다. 특히 프로덕션 배포 단계에서 참고할 "필수 설정" 섹션이 있는데, 담당자·타이밍·사후검증이 빠져 있어 실제로 누가 어떻게 적용하는지 불명확합니다. 3개월 뒤 배포할 때 이 문서만으로는 추적 불가능합니다.

- 수정계획:
  1. **검증 항목별** — 각 `3/3`, `4/4` 옆에 다음 추가:
     - 테스트 실행 명령어 (예: `curl -X POST ... webhook`)
     - 결과 로그 위치 (예: `commit abc123`, `logs/webhook-test.log`)
     - 테스트 파일/PR 링크 (예: `[테스트 커밋](https://...)`)
  
  2. **프로덕션 설정 항목별** — 표 형식으로 전환:
     ```
     | 항목 | 값 출처 | 담당자 | 완료 기준 | 배포 후 검증 |
     | --- | --- | --- | --- | --- |
     | `HAVRUTA_PORTAL_JWKS_URL` | 포털 project/.env | DevOps | CF대시보드 반영 | JWKS 엔드포인트 응답 확인 |
     ```
  
  3. **로컬 데모 데이터** — 후속조치 명시:
     ```
     → 프로덕션 배포 전 `DELETE FROM federation_events WHERE member_id = (SELECT id FROM members WHERE name='강만순')`
     → 담당자: QA팀 / 타이밍: 배포 당일 오전
     ```

### R3 · 검증자(codex) — 판정 ⚠️ NEEDS-REVISION

VERDICT: NEEDS-REVISION
- 최종 판단 근거: 반론은 수용합니다. 저자가 결함을 정확히 인정했고 수정계획도 타당하지만, 현재 문서에는 여전히 `3/3`, `4/4`, `무해`, `필수 설정`의 근거 로그·명령·커밋·테스트명과 담당자·시점·완료 기준·배포 후 검증 절차가 반영되어 있지 않습니다.

<!-- /doc-crossverify:managed -->
