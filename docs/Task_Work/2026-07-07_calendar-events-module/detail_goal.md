# Detail Goal — 행사 모듈 구현 설계

> 2026-07-07 · goal.md의 실행 설계. 근거는 analysis.md.

## 스키마 (W1 — `00027_mod_calendar.sql`)

```text
mod_calendar.events
  id uuid PK · church_id FK · title · description · location
  category: worship|education|fellowship|outreach|meeting|other (기본 other)
  starts_at timestamptz NOT NULL · ends_at (>= starts_at CHECK)
  target_department_id FK null=전교회 · visibility: public|member (기본 member)
  created_by · created_at
인덱스: (church_id, starts_at)
```

**RLS** (verse 규약):
- select: 교인 전체 (`church_id = my_church_id()` + `module_enabled('calendar')`)
- insert/update/delete: 교역자·관리자 OR `has_module('calendar','manager')` OR **부서 담당자가 자기 부서 타겟 행사** (`target_department_id in my_led_departments()`)

**RPC** (public 스키마):
| 함수 | 보안 | 용도 |
|---|---|---|
| `calendar_upcoming(p_limit)` | INVOKER | 홈·멤버 화면: 오늘 이후, 전교회 + 내 부서(직원은 전체), 부서명 조인 |
| `calendar_admin_list(p_past)` | INVOKER | 관리 화면: 과거 포함 목록 |
| `calendar_save(p jsonb)` | INVOKER | id 있으면 update, 없으면 insert (RLS가 권한 판정) |
| `calendar_delete(p_id)` | INVOKER | 삭제 |
| `public_events(p_slug, p_limit)` | DEFINER, anon 허용 | 공개 행사 목록 (active 교회 + visibility='public'만) |
| `public_event(p_id)` | DEFINER, anon 허용 | 공유 페이지 단건 (교회명·slug 포함) |

**시드**: `insert into church_modules select id,'calendar',true from churches on conflict do nothing`

## UI (W2~W5)

- **W2 레지스트리**: MODULES에 `{key:"calendar", name:"행사·일정", icon:"📅", home:"/m/calendar", adminHome:"/m/calendar/admin", memberVisible:true}` → 내 공간 네비·스토어 자동 노출. 사역 섹션에 verse-admin 패턴으로 "행사 관리" 추가. 기존 `church-events` 서브라벨 "이벤트" → "예배·모임 규칙".
- **W3 멤버 화면** `m/calendar/`: page.tsx(verse 패턴) + CalendarBoard.tsx — `calendar_upcoming(20)`, D-day 배지·부서 배지·공개 배지, 월 구분 헤더. 매니저에겐 관리 링크.
- **W4 관리 화면** `m/calendar/admin/`: ModulePage(canManage 게이트) + CalendarAdmin.tsx — 폼(제목·분류·일시·종료·장소·부서·공개범위·설명) + 목록(수정/삭제) + 공개 행사 공유 링크 복사.
- **W5 홈 위젯**: home/page.tsx 좌측 컬럼(church-today 아래) "다가오는 행사" 카드 — `calendar_upcoming(4)`, D-day 정렬, 더보기 → `/m/calendar`. `module_enabled('calendar')` 게이트.

## 공개 공유 페이지 (W6)

- `app/[church]/events/[id]/page.tsx` — 서버 컴포넌트, `public_event(id)` 호출. 비로그인 열람: 제목·일시·장소·설명·교회명 + "우리 교회 보러 가기(로그인)" CTA. 데이터 없으면 notFound.
- **미들웨어**: isPublic 판정 직후·`!user` 리다이렉트 전에 `/{slug}/events/*` 패턴 통과 (동기화도 생략 — 비소속 로그인 사용자도 열람 가능해야 함). 콘텐츠 자체는 public RPC가 `visibility='public'`만 반환하므로 member 행사는 URL을 알아도 비노출.

## 검증 (W7)

| 시나리오 | 기대 |
|---|---|
| 비로그인 GET `/{slug}/events/{id}` (public 행사) | 200, 행사 렌더 |
| 비로그인 GET `/{slug}/events/{id}` (member 행사) | 404 (RPC null) |
| 비로그인 GET `/{slug}/m/calendar` | 307 `/login` (기존 게이트 유지) |
| `calendar_save` — member 역할 | RLS 위반 에러 |
| `calendar_save` — 부서 담당자, 타 부서 타겟 | RLS 위반 에러 |
| typecheck / build / 배포 후 프로덕션 헬스체크 | 통과 |

### 권한 매트릭스 (RLS가 SSOT — `mod_calendar.can_write`)

| 역할 | 열람 | 전교회 행사 쓰기 | 자기 부서 행사 쓰기 | 타 부서 행사 쓰기 |
|---|---|---|---|---|
| 비로그인 | public 행사만(공개 RPC) | ✕ | ✕ | ✕ |
| member/checker | 전체(모듈 활성 시) | ✕ | ✕ | ✕ |
| dept_leader | 전체 | ✕ | ○ | ✕ |
| calendar manager 권한자 | 전체 | ○ | ○ | ○ |
| pastor/superadmin | 전체 | ○ | ○ | ○ |

### 명시 결정 (검증 R1 반영)

- **공개 RPC 필드 화이트리스트**: `public_events` = id·title·category·starts_at·ends_at·location (description 제외). `public_event` = +description·church_name·church_slug. 그 외 필드(작성자·부서 등) 비노출. 모듈 비활성 교회는 공개 RPC도 빈 결과.
- **공개 ID 추측**: UUID v4 PK — 순차 열거 불가. member 행사는 ID를 알아도 공개 RPC가 null.
- **타임존**: timestamptz(UTC) 저장, 렌더링은 클라이언트 로컬(Intl, 실사용상 KST). 전일 행사 개념 없음(시각 필수) — 후속 필요 시 all_day 컬럼.
- **인덱스**: `(church_id, starts_at)` 복합 1개 — 조회가 전부 교회+기간 축.
- **롤백**: `drop schema mod_calendar cascade; drop function public.calendar_* , public.public_event*; delete from church_modules where module='calendar';` — public 스키마 기존 객체 무접촉이라 안전.
- **기존 자산 재사용 상세**: ModulePage(canManage 게이트)·ModuleGate·AppFrame 무변경 재사용 / VerseAdmin 폼 구조 복제 후 필드 교체 / 홈 카드 마크업은 church-today 카드 문법 준수 / 공유 링크는 1단계 URL 구조 의존.

<!-- doc-crossverify:managed -->
## 🔁 Cross-LLM Verification

- **작성자(author)**: claude
- **검증자(reviewer)**: codex
- **문서유형**: plan
- **검증시각**: 2026-07-07T05:15:02.361Z
- **합의여부**: 🤝 합의 도달 (CONSENSUS)
- **최종판정**: ⚠️ NEEDS-REVISION
- **라운드 수**: 3

### R1 · 검증자(codex) — 판정 ⚠️ NEEDS-REVISION

VERDICT: NEEDS-REVISION
- 강점: 스키마/RLS/RPC/UI/공개 페이지/검증 시나리오가 구체적이며 권한 흐름이 비교적 명확함.
- 결함/누락: out-of-scope가 없음. 리스크/의존성/가정이 별도 정리되지 않았고, 성공기준도 W7 검증에 일부만 묻혀 있음. 기존 자산 재사용 검토는 패턴 언급 수준으로, 실제 재사용 대상/비교 근거가 부족함.
- 개선 제안: 측정 가능한 완료 기준을 별도 섹션으로 분리하고, scope/out-of-scope를 명시할 것. RLS/RPC/미들웨어/타임존/기존 `church-events`와의 충돌 등 리스크·의존성·가정을 표로 추가할 것. 기존 컴포넌트·RPC·관리 페이지 패턴 재사용 여부를 항목별로 적을 것.

### R2 · 원작자(claude) — 입장 AGREE

STANCE: **AGREE**

- **근거**: 문서가 구체적인 구현 스펙은 잘 담았으나, 다음이 명확하지 않음:
  - **out-of-scope 부재**: 반복 일정(recurring)? 타임존 처리? 기존 `church-events` 마이그레이션? 알림/공지? 이 경계가 없으면 구현 중 스코프 크리프 위험이 높음.
  - **리스크·의존성·가정이 산재**: W6 미들웨어에서 타임존/비로그인 사용자 동기화 관련 제약이 언급되지만, 체계적으로 정리되지 않았음. 부서 담당자의 정확한 권한 범위(다른 부서 행사 조회 가능? RLS에서만 "자기 부서" 대상인지?) 도 모호.
  - **완료 기준이 W7 검증에만 묻혀 있음**: 공개 페이지 성능, 폼 검증 규칙, 부서 배지 렌더링 정확도, 세션 재개 후 데이터 일관성 같은 "측정 가능한 완료 기준"이 분리되지 않았음.
  - **기존 자산 재사용이 패턴 수준**: "verse 패턴", "ModulePage 게이트" 언급하지만, 실제 재사용 대상(어느 파일? 구체적 복사/수정 항목?)과 비교 근거가 부족함.

- **수정계획**:
  1. **Scope / Out-of-Scope** 섹션 추가 (반복 일정, 타임존, 마이그레이션, 알림 명시)
  2. **Risks / Dependencies / Assumptions** 표 추가:
     - RLS 권한 충돌 → 부서 담당자 vs 교역자 우선순위?
     - 기존 `church-events` 테이블과의 관계? (완전 대체? 병행?)
     - 타임존 기본값 (서울? UTC? 설정 가능?)
     - 공개 페이지 SEO/OG 메타
  3. **완료 기준** 섹션 분리 (W7 검증 시나리오 + 메트릭: 폼 필드 검증, 공유 링크 복사 성공률, 권한 거부 에러 메시지 정확성)
  4. **기존 자산 재사용** 항목별 명시:
     - CalendarBoard vs church-today EventCard: D-day 배지 추가, 부서 필터링 로직 신규
     - 관리 폼: ModulePage의 canManage 게이트만 재사용, 폼 자체는 신규
     - public RPC: `public_events` 패턴은 기존 verse 공개 RPC와 동일 구조

### R3 · 검증자(codex) — 판정 ⚠️ NEEDS-REVISION

VERDICT: NEEDS-REVISION
- 최종 판단 근거: 반론은 원 critique를 인정하고 수정계획을 제시한 것이므로 수용한다. 다만 현재 문서에는 Scope/Out-of-Scope, Risks/Dependencies/Assumptions 표, 분리된 측정 가능 완료 기준, 기존 자산 재사용 대상과 비교 근거가 아직 실제로 반영되지 않았다. 구현 스펙 자체는 구체적이지만 문서 품질 기준상 수정 필요 판단은 유지한다.

<!-- /doc-crossverify:managed -->
