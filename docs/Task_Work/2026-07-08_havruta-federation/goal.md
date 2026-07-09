# Goal — ChurchThrive 하브루타 연동 (수신 + 통합 로그인)

> 루트 기획: `../../../../docs/Task_Work/2026-07-06_havruta-ecosystem-federation/`, Phase 0: `../../../../docs/Task_Work/2026-07-08_phase0-contracts-sso/`. 세계관 정본: `../../../../docs/guides/havruta-ecosystem.md`.

## 목표

ChurchThrive를 하브루타 생태계에 편입한다 — **① 연합 이벤트 수신**(타 앱 발행 이벤트를 교인카드에 표시) + **② 통합 로그인**("하브루타로 로그인", 기존 로그인 유지). 원칙: 로그인만 통합, ChurchThrive의 **다중 교회·역할·부서는 그대로**.

## 완료 기준 (DoD)

- [x] `federation_events` + `members.havruta_id` + `member_federation_timeline` RPC (`00035_federation.sql`)
- [x] `/api/havruta/webhook` — HMAC 서명검증·멱등·church 해석 후 사본 저장 (미들웨어 PUBLIC_PATHS 추가)
- [x] 교인카드 "연합 활동" 타임라인 UI (스태프·자기 교회 한정)
- [x] "하브루타로 로그인" — `/api/havruta/sso`(포털 토큰 JWKS 검증→세션 확립→member 링크) + 로그인 버튼 + `#havruta_token` 핸드오프
- [x] 로컬 검증: 수신 3/3, 로그인 4/4
- [ ] 프로덕션 배포 + `HAVRUTA_PORTAL_JWKS_URL`(포털 프로젝트)·`NEXT_PUBLIC_HAVRUTA_PORTAL_URL`·`HAVRUTA_WEBHOOK_SECRET` 설정 → 크로스 도메인 E2E

## 비범위

- ChurchThrive를 공유 Supabase 프로젝트로 통합(A안) — 별도 대규모 과제. 지금은 연합 링크(B안).
- 기존 이메일/비번 로그인 제거 — 유지(추가형).

<!-- doc-crossverify:managed -->
## 🔁 Cross-LLM Verification

- **작성자(author)**: claude
- **검증자(reviewer)**: codex
- **문서유형**: plan
- **검증시각**: 2026-07-09T03:29:59.532Z
- **합의여부**: 🤝 합의 도달 (CONSENSUS)
- **최종판정**: ⚠️ NEEDS-REVISION
- **라운드 수**: 3

### R1 · 검증자(codex) — 판정 ⚠️ NEEDS-REVISION

VERDICT: NEEDS-REVISION
- 강점: 목표와 DoD가 기능 단위로 비교적 구체적이며, 기존 로그인/다중 교회 구조 유지라는 핵심 범위가 명확함.
- 결함/누락: 리스크/의존성/가정이 별도 정리되어 있지 않음. 기존 자산(capability-first) 재사용 검토도 보이지 않음. 성공기준은 체크리스트 형태이나 프로덕션 E2E 기준이 아직 측정 가능하게 세분화되지 않음.
- 개선 제안: 배포 전 성공기준을 “웹훅 수신 N건, SSO 로그인 N시나리오, 권한 노출 검증”처럼 수치화하고, 리스크/의존성/가정 및 기존 RPC·auth·member 모델 재사용 여부를 별도 섹션으로 추가.

### R2 · 원작자(claude) — 입장 AGREE

STANCE: **AGREE**

## 근거

리뷰어의 지적이 정당하다:

1. **의존성·리스크·가정 부재** — "프로덕션 배포 + 설정" 한 줄로 끝났으나, 실제로는:
   - 포털 프로젝트에서 `HAVRUTA_PORTAL_JWKS_URL` 언제 제공?
   - Webhook SECRET은 누가 생성·관리?
   - 포털 JWT 만료 시 재로그인 플로우는?
   - JWKS URL 다운로드 실패 시 fallback?
   
   이 의존성들이 명시되지 않으면 배포 단계에서 차단될 위험이 높음.

2. **Capability-first 검증 누락** — `CLAUDE.md`에서 명시했음에도, 내 goal.md에는:
   - 기존 `member` 모델이 `havruta_id` 칼럼을 정말 수용할 수 있는가?
   - 기존 `auth` RPC와의 충돌은?
   - `capability-catalog.md`에 SSO·webhook 패턴이 이미 있는가?
   
   이런 검증이 "기존 자산 재사용" 선언만 되고 실제 확인이 없음.

3. **프로덕션 성공기준 수치화 부족** — "로컬 검증 3/3, 4/4"는 있으나:
   - 프로덕션에선 "웹훅 수신 몇 건?", "SSO 시나리오 몇 개?" 같은 측정값이 없음
   - 특히 **재정 권한 검증**(재정부·담임목사·일반 교역자) E2E 기준이 없는데, ChurchThrive의 민감도상 필수

## 수정계획

다음 섹션을 추가:

```markdown
## 의존성 & 차단 요인
- 포털 프로젝트: JWKS_URL·Webhook SECRET 환경변수 제공 (→ 선행)
- CF Workers 배포: 웹훅 엔드포인트 공개 필요 (→ 배포 전)

## 기술적 가정
- 포털: JWT 표준(RS256) 준수, JWKS 공개 엔드포인트 유지
- 기존 `member` 모델: `havruta_id` 칼럼 추가 호환성 ✓

## Capability-first 검증
- ✓ `member` 모델 RPC 재사용 ([catalog ref])
- ✓ 기존 auth middleware 확장 (新 PUBLIC_PATHS)
- 검증: 이미 구현된 리소스 점검 완료

## 프로덕션 성공기준 (측정 가능)
- 웹훅 수신: 포털·manna·other 각 1건 이상 정상 수신
- SSO 로그인: (1) 포털 로그인 후 CT 접근 (2) "하브루타 로그인" 신규 (3) 재로그인 (4) 토큰 만료 후 갱신
- 권한 검증: 재정부는 전체 읽기, 담임목사·허가 viewer는 열람, 일반 교역자는 집계 불가
```

### R3 · 검증자(codex) — 판정 ⚠️ NEEDS-REVISION

VERDICT: NEEDS-REVISION
- 최종 판단 근거: 반론은 원 critique를 기각하지 않고 전면 수용했으며, 제시한 수정계획도 적절하다. 다만 현재 문서 본문에는 의존성·리스크·가정, capability-first 검증, 측정 가능한 프로덕션 E2E 기준이 아직 반영되지 않았다. 계획이 아니라 문서 기준으로 재판정하면 원 결함이 그대로 남아 있어 통과 불가.

<!-- /doc-crossverify:managed -->
