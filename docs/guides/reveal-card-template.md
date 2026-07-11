# RevealCard — 사진 롤업 카드 공통 템플릿 기획서

> 상태: 기획 (구현 전) · 작성일: 2026-07-11
> 대상: ChurchThrive web (`web/src`) · 향후 하브루타 연합 앱 공통 패턴 후보

## 1. 목적

쇼핑몰 상품 카드처럼 **사진이 카드 전면을 채우고**, 포인터를 올리면 **정보 패널이 아래에서 롤업(slide-up)** 되며 나타나는 카드를 특정 화면에 하드코딩하지 않고 **재사용 가능한 슬롯 기반 템플릿**으로 만든다.

적용 후보 (템플릿이므로 도메인 비종속):

| 화면 | 콘텐츠 | 비고 |
|---|---|---|
| 교인 명부 그리드 보기 (토글) | 사진 + 이름/직분 → 롤업: 부서·연락처·상태 | 1차 적용 대상 |
| **출석 체크 보드** (`/check`) | 사진 + 이름 → 롤업: 출석 상태·방법 | **버튼 변형 `reveal-card--check`** — 카드 전체가 출석 토글, 링크형 컴포넌트 대신 CSS 템플릿 직접 사용. 출석 시 positive 테두리 + 체크마크 + 스크림 틴트 |
| 교적 수정 대상 선택, 새가족 목록 | 동일 | |
| 향후: 사역자 소개, 부서 소개, 행사 갤러리 | 사진 + 제목 → 롤업: 설명·CTA | 마케팅/랜딩 표면 |

**비적용**: 교적 상세 카드(`MemberCard.tsx`)는 단일 상세 뷰라 정보를 숨길 이유가 없음 — 상세 카드는 별도 리디자인(큰 사진 헤더)으로 처리하고 이 템플릿을 쓰지 않는다.

## 2. 인터랙션 스펙

### 상태 정의

```
[기본]                          [활성 (hover / focus-within)]
┌──────────────┐               ┌──────────────┐
│              │               │   사진(살짝    │
│    사진       │               │   zoom 1.04)  │
│  (전면 채움)   │    ──▶        ├──────────────┤
│              │               │ ▲ 정보 패널     │
├╌╌╌╌╌╌╌╌╌╌╌╌╌╌┤               │  이름 · 직분    │
│▒스크림: 이름·직분│               │  부서 / 연락처  │
└──────────────┘               │  [배지] [액션]  │
                               └──────────────┘
```

- **기본 상태**: 사진이 카드 전체를 채우고, 하단에 그라데이션 스크림 + **최소 정보(제목·부제)는 항상 노출**. 완전히 숨기면 카드가 무엇인지 알 수 없고 호버를 유도할 단서도 사라진다.
- **활성 상태**: 정보 패널이 카드 하단에서 `translateY(100%) → 0`으로 롤업(카드 높이의 최대 55~60%까지). 사진은 `scale(1.04)`로 미세 줌. 스크림의 제목은 패널 제목으로 자연스럽게 대체(스크림 fade-out).
- **패널 내부 콘텐츠**는 슬롯(children)로 주입 — 템플릿은 행 레이아웃만 제공.

### 활성화 트리거 (입력 수단별)

| 입력 | 트리거 | 근거 |
|---|---|---|
| 포인터(데스크톱) | `:hover` | 기본 시나리오 |
| 키보드 | `:focus-within` | 카드 내 링크/버튼 포커스 시 동일 롤업. hover 전용 정보 금지(WCAG 1.4.13) |
| 터치(모바일/태블릿) | 롤업 없음 — **정적 레이아웃으로 전환** | `@media (hover: none)`에서 사진 위 + 정보 아래 상시 노출. 웹/앱 분리 원칙: 모바일에 데스크톱 호버 문법을 이식하지 않는다 |
| 스크린리더 | 항상 접근 가능 | 패널을 `display:none`/`visibility:hidden` 처리하지 않고 `transform`+`opacity`로만 숨김 (DOM에 상시 존재) |

### 모션 토큰

기존 `globals.css` 토큰을 재사용하되, 롤업은 마이크로 인터랙션(160ms)보다 긴 **전용 duration 토큰 1개**만 추가한다.

```css
:root {
  --dur-reveal: 280ms;      /* 롤업 전용. --dur(160ms)는 그대로 */
}
/* easing은 기존 --ease: cubic-bezier(0.2, 0.8, 0.2, 1) 재사용 */
```

- 롤업(패널): `transform var(--dur-reveal) var(--ease), opacity var(--dur-reveal) var(--ease)`
- 사진 줌: `transform calc(var(--dur-reveal) + 120ms) var(--ease)` — 패널보다 살짝 느리게 따라와 깊이감
- `prefers-reduced-motion: reduce`: transform 전환 제거, opacity만 즉시 전환 (기존 전역 규칙에 편승)

## 3. 컴포넌트 API 설계

위치: `web/src/components/ui/RevealCard.tsx` (presentational, 데이터 로직 없음)

```tsx
type RevealCardProps = {
  /** 사진 URL. null이면 폴백(이니셜 그라데이션) 렌더 */
  photoUrl: string | null;
  /** 폴백 이니셜/이모지 (photoUrl 없을 때) */
  fallbackText: string;
  /** 스크림·패널 공통 제목 (항상 노출) */
  title: React.ReactNode;
  /** 부제 — 직분, 카테고리 등 (항상 노출) */
  subtitle?: React.ReactNode;
  /** 우상단 오버레이 배지 슬롯 (상태·케어 등) */
  badge?: React.ReactNode;
  /** 롤업 패널 내용 슬롯 — Field 행, 배지, 버튼 등 자유 구성 */
  children?: React.ReactNode;
  /** 카드 전체 클릭 이동 (있으면 <Link> 래핑) */
  href?: string;
  /** 사진 비율. 기본 "3/4" (세로형 인물), "1/1" · "4/3" 지원 */
  aspect?: "3/4" | "1/1" | "4/3";
};
```

사용 예 (명부 그리드):

```tsx
<RevealCard
  photoUrl={r.photo_url} fallbackText={r.name.slice(0, 1)}
  title={<>{r.name}{r.name_suffix && <sub>{r.name_suffix}</sub>}</>}
  subtitle={r.position}
  badge={<StatusBadge status={r.status} />}
  href={`${base}/members/${r.id}`}
>
  <span>{r.departments.map(d => d.name).join(" · ") || "부서 미배정"}</span>
  {r.phone && <a href={`tel:${r.phone}`}>{r.phone}</a>}
</RevealCard>
```

**하드코딩 금지 원칙**: 템플릿은 `member` 타입을 모른다. 도메인 데이터 → 슬롯 매핑은 호출부(각 화면)가 담당한다.

## 4. CSS 설계 (globals.css 추가분)

기존 `.card` 계열과 나란히 두는 독립 블록. 토큰만 참조하고 색상 리터럴 금지.

```css
.reveal-card {            /* 컨테이너: overflow hidden, radius-card, shadow-card */ }
.reveal-card__media       /* 사진/폴백: aspect-ratio, object-fit: cover */
.reveal-card__media--fallback  /* 이니셜 + brand-600→800 그라데이션 (avatar 문법 재사용) */
.reveal-card__scrim       /* 하단 그라데이션(brand-950 65% → transparent) + 항상 노출 제목 */
.reveal-card__badge       /* 우상단 오버레이 배지 영역 */
.reveal-card__panel {     /* 롤업 패널: absolute bottom, surface 배경,
                             transform: translateY(100%); opacity: 0 */ }

.reveal-card:hover .reveal-card__panel,
.reveal-card:focus-within .reveal-card__panel {
  transform: translateY(0); opacity: 1;
}
.reveal-card:hover .reveal-card__media img { transform: scale(1.04); }

@media (hover: none) {    /* 터치: 정적 레이아웃 — 패널을 문서 흐름으로, 스크림 제목 숨김 */
  .reveal-card__panel { position: static; transform: none; opacity: 1; }
}
```

다크모드: 패널 배경은 `var(--surface)` 사용으로 자동 대응. 스크림은 양 테마 공통(사진 위이므로 항상 어두운 그라데이션).

## 5. 폴백·품질 규칙

1. **사진 없음**: 빈 회색 박스 금지. 이니셜 1자 + 브랜드 그라데이션(기존 avatar 폴백 문법 확장). 사진 없는 교인이 다수인 초기에도 그리드가 성립해야 한다.
2. **이미지 로딩**: `loading="lazy"` + 로드 전 `--surface-soft` 배경(기존 shimmer 재사용 가능).
3. **패널 오버플로**: 패널 최대 높이 60% 고정, 내용 초과 시 잘라내지 말고 호출부에서 항목 수를 제한(가이드: 3행 + 액션 1줄 이내).
4. **개인정보**: 패널에 넣을 필드는 서버가 게이트해 내려준 것만(기존 `admin_list_members` 원칙 그대로). 템플릿은 받은 것만 그린다.
5. **폰트 스케일**: `FontScale` 확대 시 패널 행이 넘칠 수 있음 — 패널은 `min-height` 기반으로 내용에 맞춰 늘어나되 55~60% 상한 유지.

## 6. 구현 단계

| 단계 | 작업 | 산출물 |
|---|---|---|
| 1 | `globals.css`에 `--dur-reveal` + `.reveal-card` 블록 추가 | CSS 템플릿 |
| 2 | `ui/RevealCard.tsx` 컴포넌트 구현 | 공통 컴포넌트 |
| 3 | 교인 명부에 리스트/그리드 보기 토글 추가, 그리드 모드에서 RevealCard 사용 | 1차 적용 |
| 4 | 데스크톱(hover)·모바일(hover:none)·키보드·reduced-motion 4경로 실기기 검증 | 검증 |

리스트 보기는 기존 그대로 유지(관리 업무 기본값). 그리드는 옵트인 토글.
