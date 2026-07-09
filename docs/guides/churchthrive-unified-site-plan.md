# ChurchThrive 통합 페이지 구성 기획서

> 작성일 2026-07-09 · 대상: `www.church-thrive.org`(마케팅) + `church.havrutaproject.org`(앱) 통합
> 관련: [havruta-ecosystem](./havruta-ecosystem.md), 포털 `havrutaproject.org/projects/churchthrive`

## 0. 배경

현재 ChurchThrive는 **세 개의 웹 표면**이 따로 존재하며 메시지·CTA·브랜드가 흩어져 있다.

| 표면 | URL | 현재 역할 | 소유/인프라 |
|---|---|---|---|
| 마케팅 사이트 | `www.church-thrive.org` | 조직 소개·파트너 모집 | 자체 구매 도메인(.org) |
| 실제 앱 + 랜딩 | `church.havrutaproject.org` | 제품 랜딩 + 로그인 후 전체 앱 | 하브루타 연합 도메인, CF for SaaS 테넌시 구축됨 |
| 연합 커뮤니티 | `havrutaproject.org/projects/churchthrive` | 5개 앱 연합 쇼케이스·개발 커뮤니티 | 포털(하브루타 세계관) |

목표: **구매 도메인 `church-thrive.org`를 브랜드 정문**으로 삼아 두 마케팅성 표면을 하나로 합치고, 실제 앱은 기존 테넌시 인프라를 그대로 활용한다.

---

## 1. 현황 분석

### 1-A. `www.church-thrive.org` (마케팅 사이트)
- **포지셔닝**: "교회 관리의 새로운 패러다임" — 광범위한 SaaS, 다소 일반적
- **구성**: Hero → 문제/해결(엑셀·카톡→통합) → Mission·Vision·Core Values → 기능 6종(교인관리·말씀노트·행정·통계·모바일앱·데이터) → **파트너 모집(기여기반 보상·수익 공유·모집분야 4종)** → CTA → Footer
- **CTA/링크**: `/login/`, `/register/` (자체 경로 — 앱과 분리)
- **연락처**: `partner@churchthrive.org` / footer "Made with ❤️ for Korean Churches"
- **고유 자산**: 완결된 Mission/Vision/Core Values, **파트너 모집(채용) 콘텐츠** ← 앱 랜딩에 없음

### 1-B. `church.havrutaproject.org` (앱 + 랜딩)
- **포지셔닝**: "어르신이 많은 한국 교회를 위해 설계 · 교회 관리, 이제 아무것도 안 해도 됩니다" — **구체적·차별적·설득력 높음**
- **구성**: Hero → 기능(탭출석·자동출석·모듈스토어·말씀암송·케어알림·데이터분리) → 3단계 시작 → Core values → **차별점(하나의 사이드바·어르신 버튼 하나·개인정보 이중잠금)** → 요금(무료+모듈 스토어) → FAQ 4종 → CTA → Footer
- **CTA/링크**: `/register-intro`, `/signup` (실제 온보딩)
- **연락처**: `hello@churchthrive.kr`
- **고유 자산**: 어르신 특화 포지셔닝, **구체 기능·요금·FAQ·차별점** ← 마케팅 사이트에 없음

### 1-C. 문제점 요약
1. **브랜드 이메일 2개** — `partner@churchthrive.org` vs `hello@churchthrive.kr`
2. **시작/로그인 흐름 2벌** — `/register/`(마케팅) vs `/register-intro`,`/signup`(앱)
3. **메시지 불일치** — 마케팅=일반 SaaS, 앱=어르신 특화. 앱 쪽이 훨씬 강력한데 정문(마케팅)이 약함
4. **콘텐츠 상호 결핍** — 마케팅엔 요금·FAQ·차별점 없음, 앱 랜딩엔 Mission·파트너모집 없음
5. **비주얼/네비 불일치** — nav 항목·톤·컴포넌트 제각각

---

## 2. 통합 전략

### 2-1. 도메인·라우팅 역할 정의 (권장안)

```
church-thrive.org            → 브랜드 정문(마케팅 홈). 모든 공개 콘텐츠 통합
   /                         → 통합 랜딩
   /about, /mission          → 소개·미션·가치
   /features (또는 /services) → 기능 상세
   /pricing                  → 요금·모듈
   /partners (또는 /join)     → 파트너 모집(채용)
   /faq, /contact
   [로그인]/[시작하기] 버튼    → church.havrutaproject.org 로 연결 (앱)

church.havrutaproject.org    → 실제 앱(로그인 후 전체 기능). 기존 유지
   랜딩(비로그인 루트)은 간결화하거나 church-thrive.org 로 301 유도

havrutaproject.org/projects/churchthrive → 연합 커뮤니티/개발자 공간 (그대로)
   서비스 CTA는 이미 church-thrive.org 로 연결됨(lib/constants.ts serviceUrl)
```

**권장 이유**: `church-thrive.org`는 구매한 브랜드 도메인(.org, 영문 브랜드)이라 정문에 적합. 앱은 하브루타 연합 도메인에 두어 **이미 구축된 커스텀 도메인·경로 테넌시 인프라(CF for SaaS)** 를 재활용 — 앱을 옮기면 그 인프라를 재구성해야 하므로 비효율.

**대안(B)**: 앱을 `app.church-thrive.org`로 이전해 단일 브랜드로 완전 통합. 브랜드는 더 깔끔하나 커스텀 호스트네임·미들웨어 재작업 필요 → **결정 필요(§6)**.

### 2-2. 브랜드 일관성 규칙
- **대표 이메일 1개로 통일**: 문의=`hello@…`, 파트너=`partner@…` 하위 구분은 두되 **도메인 통일**(`.org` 또는 `.kr` 중 택1). → **결정 필요**
- **핵심 메시지 = 앱 랜딩 채택**: "어르신이 많은 한국 교회를 위해 / 아무것도 안 해도 되는 교회 관리" 를 전 표면 공통 헤드라인으로.
- **비주얼 토큰 통일**: 앱의 디자인 시스템(색·타이포·카드·사이드바 UX 언어)을 마케팅에도 적용.
- **CTA 문구·목적지 통일**: "무료로 시작하기" → 앱 `/register-intro` 하나로.

---

## 3. 통합 정보구조 (IA)

```
ChurchThrive (church-thrive.org)
├─ 홈(랜딩)                     ← §4-1
├─ 소개
│   ├─ 회사/미션 (Mission·Vision·Core Values)   [출처: 마케팅]
│   └─ 왜 다른가 (차별점 3종)                    [출처: 앱]
├─ 기능/서비스                  ← §4-2  [출처: 앱 기능 6종 + 마케팅 기능 서술 보강]
├─ 요금                         [출처: 앱]
├─ 파트너 모집(채용)            [출처: 마케팅]
├─ FAQ                          [출처: 앱]
├─ 문의
└─ [로그인 / 무료로 시작하기] → 앱(church.havrutaproject.org)
```

---

## 4. 페이지별 섹션 구성 (콘텐츠 출처 매핑)

> 원칙: **제품 마케팅 = 앱 랜딩 콘텐츠 채택**(구체적이라 전환율 높음), **조직/채용 = 마케팅 사이트 콘텐츠 채택**.

### 4-1. 통합 홈(랜딩) — 위→아래 섹션 순서
| # | 섹션 | 콘텐츠 출처 | 비고 |
|---|---|---|---|
| 1 | Hero | **앱** ("아무것도 안 해도 됩니다" + 파일럿 무료·카드없음) | 마케팅의 밋밋한 헤드라인 폐기 |
| 2 | 문제/해결 | 마케팅(엑셀·카톡→통합) | 앱 톤으로 재작성 |
| 3 | 핵심 기능 | **앱**(탭출석·자동출석·모듈스토어·암송·케어알림·데이터분리) | 가장 강력한 섹션 |
| 4 | 3단계 시작 | **앱** | 온보딩 간결성 강조 |
| 5 | 왜 다른가(차별점) | **앱**(사이드바·어르신 버튼·이중잠금) | 해외 1위 대비 포인트 |
| 6 | 요금/모듈 | **앱** | 무료+모듈 스토어 |
| 7 | Mission·가치 | 마케팅(축약 배너) | 상세는 /about |
| 8 | 파트너 모집 티저 | 마케팅 | 상세는 /partners |
| 9 | FAQ | **앱** 4종 | |
| 10 | 최종 CTA | **앱** ("이번 주일부터") → `/register-intro` | |
| — | Footer | 통합(이메일·연합 링크·SNS) | |

### 4-2. /기능(서비스)
- 앱 랜딩 기능 6종을 상세 페이지로 확장(각 기능 스크린샷·설명). 마케팅의 "통계 대시보드·모바일 앱" 서술을 흡수.

### 4-3. /about · /mission
- 마케팅의 Mission/Vision/Core Values 전문 + 앱의 차별점 3종을 "왜 다르게 만들었나" 서사로 결합.

### 4-4. /partners (파트너 모집)
- 마케팅 콘텐츠 그대로 이관: 기여기반 보상·수익 공유·유연한 참여·모집분야(개발/디자인/마케팅/기획). **하브루타 연합 개발 커뮤니티**(`havrutaproject.org/projects/churchthrive/community`)로 크로스링크.

### 4-5. /pricing · /faq · /contact
- 앱 콘텐츠 이관. 문의 이메일 통일.

---

## 5. 실행 로드맵

| 단계 | 작업 | 산출 |
|---|---|---|
| 1 | **결정 확정**(§6): 도메인 전략 A/B, 대표 이메일 | 확정서 |
| 2 | 통합 홈 카피·섹션 확정(§4-1) | 랜딩 카피 문서 |
| 3 | 마케팅 사이트를 앱 디자인 토큰으로 리스킨 + 섹션 재배치 | church-thrive.org 개편 |
| 4 | 전 CTA를 앱 온보딩(`/register-intro`)으로 통일, 자체 `/login /register` 제거·리다이렉트 | 흐름 단일화 |
| 5 | /about·/partners·/pricing·/faq 페이지 이관 | 페이지 5종 |
| 6 | 앱 비로그인 랜딩 간결화 or church-thrive.org 301 유도 | 중복 제거 |
| 7 | 이메일·연합 링크·SNS 통일, SEO(canonical) 정리 | 일관성 |

---

## 6. 결정 확정 (2026-07-09)

1. **도메인 전략 = A** — 마케팅 정문 + 앱 진입. 하나의 통합 페이지에 Mission/Vision/Core Values + 기능 + 협업자 모집을 모두 담고 "서비스 시작하기 → 로그인/앱"으로 진입. 앱은 `church.havrutaproject.org` 유지.
2. **대표 이메일 = `@churchthrive.org`** (문의 `hello@churchthrive.org`, 파트너 `partner@churchthrive.org`).

## 7. 진행 현황

- **통합 랜딩 1차 구현·배포 완료** — 앱 공개 랜딩(`web/src/components/Landing.tsx`)을 통합 페이지로 확장: Mission·Vision·Core Values(4) 섹션 + 협업자 모집(기여보상·수익공유·유연참여·투명운영 + 모집분야 4종) 섹션 추가, 헤더에 섹션 앵커 내비(기능·소개·요금·함께하기), CTA "서비스 시작하기"→앱 진입, 이메일 `@churchthrive.org` 통일. 배포: `church.havrutaproject.org` (version 1aec1d09).
- **미해결(인프라)**: `www.church-thrive.org`의 **소스가 워크스페이스에 없음** — `Church_Thrive/`엔 Vercel 빌드 산출물만 존재(별도 Next 앱, `(marketing)(auth)(member)` 라우트). 따라서 church-thrive.org 자체를 직접 편집 불가.
  - 후속 결정 필요: (a) church-thrive.org 소스를 확보해 동일 통합 콘텐츠로 개편 / (b) church-thrive.org → `church.havrutaproject.org` 통합 랜딩으로 리다이렉트·프록시 / (c) 앱 통합 랜딩을 church-thrive.org 도메인으로도 배포(도메인 연결).
