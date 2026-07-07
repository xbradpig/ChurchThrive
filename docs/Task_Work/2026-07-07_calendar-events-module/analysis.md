# Analysis — 행사 모듈 (현황·재사용 조사)

> 2026-07-07 · 근거: migrations 00001–00026 + web/src 실사

## 1. 기존 자산 (Capability-First)

| 자산 | 위치 | 재사용 방식 |
|---|---|---|
| 모듈 스키마 규약 | `00007_verse.sql` | 그대로 복제 — `mod_calendar` 스키마, RLS + SECURITY INVOKER RPC, `grant usage to authenticated` |
| `module_enabled('calendar')` / `has_module('calendar', level)` | `00006:126-140` | 무변경 재사용 (module 키 문자열만 신규) |
| `my_led_departments()` → setof uuid | `00009` | 부서 담당자 쓰기 정책에 재사용 (확인: DB `SETOF uuid`) |
| `departments` select 정책 | `00006:206` (교인 전체) | 관리 폼 부서 셀렉트에 직접 테이블 조회 |
| `church_modules` (PK church_id, module) | `00006:75` | `insert … on conflict do nothing`으로 기존 교회 활성화 시드 |
| 모듈 UI 3단 패턴 | `m/verse/` (page → Board / admin → Admin) | 디렉토리 구조·ModulePage/ModuleGate 그대로 |
| `set_module` RPC (스토어 토글) | StoreBoard.tsx:18 | 무변경 — registry 등록만 하면 스토어에 자동 노출 |
| 공개 표면 규약 | 1단계 결정(명시적 public RPC만, anon 테이블 grant 금지) | `public_events`/`public_event` SECURITY DEFINER |
| 미들웨어 공개 예외 지점 | 1단계 detail_goal "이후 단계 연결"에 예고 | slug 브랜치 앞 `/{slug}/events/*` 허용 |

## 2. 기존 `events` 테이블과의 관계

- `events`(00001)는 `schedule_rule` jsonb 주간 반복 규칙 — 출석 체크 대상·홈 "이번 주 예배·모임" 위젯이 소비. **날짜 개념이 없어 행사에 부적합.**
- 대안 검토: ① `events`에 starts_at 추가 — 기각 (출석 도메인과 결합, attendances FK가 걸려 있어 의미 혼선) ② 신규 `mod_calendar.events` — 채택 (모듈 규약 정합, 스토어 토글 가능, 도메인 분리).
- 혼동 방지: 관리 UI 기존 "이벤트" 탭 라벨을 "예배·모임 규칙"으로 변경, 신규 모듈명은 "행사·일정".

## 3. PostgREST 노출 방식

`supabase/config.toml`의 `schemas` 목록에 `mod_verse`가 없는데도 verse가 동작하는 이유: **테이블 직접 접근 없이 public 스키마 RPC로만 노출**하기 때문. mod_calendar도 동일 패턴 → config.toml 변경·Supabase 재기동 불필요.

## 4. 홈 위젯 데이터 경로

- 1~3단계에서는 홈이 `calendar_upcoming` RPC를 별도 호출 (Promise.all 배치에 1개 추가).
- 4단계 `home_feed()` v2에서 upcoming_events로 흡수 예정 — RPC 시그니처를 v2 페이로드와 동일한 필드로 설계해 이관 비용 최소화.

## 5. 시간대

`starts_at timestamptz` 저장, 표시 포맷은 클라이언트 로컬(KST) — 기존 코드베이스가 별도 TZ 라이브러리 없이 동일 방식.
