---
stage: design
status: retroactive
created: 2026-02-05
sources:
  - Dev_Plan/Design/01_UX_리서치.md
  - Dev_Plan/Design/02_정보_아키텍처.md
  - Dev_Plan/Design/03_와이어프레임_설계.md
  - Dev_Plan/Design/04_비주얼_디자인.md
  - Dev_Plan/Design/05_디자인_시스템.md
  - Dev_Plan/Design/06_프로토타입_설계.md
  - Dev_Plan/Design/07_접근성_감사.md
  - Church_Thrive/app/src/components/
  - Church_Thrive/app/src/styles/design-tokens.css
---

# 05. Design (디자인) - 역방향 문서화

## 요약

7개 디자인 문서(UX 리서치 ~ 접근성 감사)와 실제 구현된 컴포넌트/스타일을 통해
디자인 스테이지가 완료되었습니다. Atomic Design 패턴과 디자인 토큰 시스템이 적용되었습니다.

## 주요 결정 사항

### 1. 디자인 시스템
- **패턴**: Atomic Design (Atoms → Molecules → Organisms → Templates)
- **접두사**: `CT` (ChurchThrive) - CTButton, CTInput, CTCard 등
- **스타일링**: Tailwind CSS (웹) + NativeWind (모바일)
- **폰트**: Pretendard (한글 최적화)
- **애니메이션**: Framer Motion (웹)

### 2. 컴포넌트 목록

#### Atoms (기본 요소) - 12개
| 컴포넌트 | 용도 |
|---------|------|
| CTAvatar | 프로필 이미지 |
| CTBadge | 상태 배지 |
| CTButton | 액션 버튼 |
| CTCheckbox | 체크박스 |
| CTInput | 텍스트 입력 |
| CTSelect | 선택 드롭다운 |
| CTSkeleton | 로딩 스켈레톤 |
| CTSpinner | 로딩 스피너 |
| CTTag | 태그/라벨 |
| CTTextArea | 텍스트 영역 |
| CTToggle | 토글 스위치 |

#### Molecules (조합 요소) - 9개
CTCard, CTEmptyState, CTFormField, CTListItem, CTSearchBar, CTStatCard, CTTabMenu

#### Organisms (복합 요소) - 5개
CTBottomSheet, CTModal, CTOfflineIndicator, CTToast

#### Templates (페이지 레이아웃) - 4개
CTListPage, CTDetailPage, CTFormPage

### 3. 디자인 토큰 (CSS Variables)
- `app/src/styles/design-tokens.css`에 정의
- 색상, 간격, 타이포그래피, 그림자 등 변수화
- 다크모드 지원 준비

### 4. 정보 아키텍처
- **인증 영역**: 로그인, 회원가입, 교회 검색, 승인 대기
- **메인 영역**: 대시보드, 교인관리, 말씀노트, 설정
- **관리자 영역**: 공지관리, 출석관리, 조직관리, 구역관리, 역할관리

### 5. 접근성
- WCAG 2.1 AA 수준 목표
- 고령 교인 대응: 큰 터치 영역, 단순한 네비게이션
- 한국어 최적화 (초성 검색 등)

### 6. PWA 지원
- 오프라인 인디케이터 (CTOfflineIndicator)
- PWA 설치 배너 (PWAInstallBanner)
- Service Worker 업데이트 배너 (SWUpdateBanner)
- 서비스 워커 관리 훅 (useServiceWorker)

## 소스 문서/코드 링크
- [UX 리서치](../Church_Thrive/Dev_Plan/Design/01_UX_리서치.md)
- [정보 아키텍처](../Church_Thrive/Dev_Plan/Design/02_정보_아키텍처.md)
- [와이어프레임 설계](../Church_Thrive/Dev_Plan/Design/03_와이어프레임_설계.md)
- [비주얼 디자인](../Church_Thrive/Dev_Plan/Design/04_비주얼_디자인.md)
- [디자인 시스템](../Church_Thrive/Dev_Plan/Design/05_디자인_시스템.md)
- [프로토타입 설계](../Church_Thrive/Dev_Plan/Design/06_프로토타입_설계.md)
- [접근성 감사](../Church_Thrive/Dev_Plan/Design/07_접근성_감사.md)
- [디자인 토큰 CSS](../Church_Thrive/app/src/styles/design-tokens.css)
- [컴포넌트 디렉토리](../Church_Thrive/app/src/components/)
