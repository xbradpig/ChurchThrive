---
stage: planning
status: retroactive
created: 2026-02-05
sources:
  - Dev_Plan/04_기능_요구사항_Phase1_MVP.md
  - Dev_Plan/05_기능_요구사항_Phase2_4.md
  - Dev_Plan/08_비기능_요구사항.md
  - Dev_Plan/09_통합_요구사항.md
  - Dev_Plan/12_리스크_관리.md
---

# 03. Planning (기획) - 역방향 문서화

## 요약

기능 요구사항(Phase 1-4), 비기능 요구사항, 통합 요구사항, 리스크 관리 문서를 통해
기획 스테이지가 완료되었습니다. 4단계 개발 로드맵과 MVP 합격 기준이 정의되었습니다.

## 주요 결정 사항

### 1. Phase 1 MVP 기능 (Month 1-4)
- **FR-0**: 가입/인증/교회 격리 (Supabase Auth + Kakao OAuth + RLS)
- **FR-1**: 교인관리 (교적, 출석, 심방, QR 등록, 초성 검색)
- **FR-2**: 말씀노트 (텍스트 에디터, 오프라인 지원, 교역자 피드백)
- **FR-3**: 교회 행정관리 (공지/알림, 조직도, 직분관리, 권한위임)
- **FR-4**: 교회 홈페이지 자동 빌드
- **FR-5**: 구역/셀 관리

### 2. 가입 플로우 결정
1. 이메일/전화 + 비밀번호 입력
2. 소속 교회 검색/선택
3. 가입 요청 → 교회 관리자 승인
4. 승인 전까지 대기 화면
5. 교회별 RLS 완전 격리

### 3. 멀티테넌시 전략
- `church_id` 기반 RLS로 교회 간 데이터 완전 격리
- 모든 API/Edge Function에서 church_id 검증 필수
- 교인 데이터 자기 관리 (본인 교적 수정 가능, 직분/역할은 관리자만)

### 4. 교인 이적 시스템
- 교인카드 이전/백업 가능
- 플랫폼 관리자 승인 필요
- 개인 데이터(말씀노트 등)는 교인 소유로 유지

### 5. Phase 2-4 로드맵
- **Phase 2 (Month 5-7)**: STT, 전자결재, 재정, 훈련, 암송/통독
- **Phase 3 (Month 8-10)**: LVI 진단, 봉사 스케줄링, 회의록
- **Phase 4 (Month 11-16)**: 멀티캠퍼스, AI 추천, API 공개

### 6. 비기능 요구사항
- 성능: 페이지 로드 3초 이내
- 보안: PIPA 준수, 데이터 암호화
- 접근성: WCAG 2.1 AA 수준
- 오프라인: PWA + 로컬 캐시로 핵심 기능 오프라인 지원

### 7. 리스크 관리
- Supabase 무료 티어 한계 → 사용량 모니터링 + 유료 전환 기준 설정
- STT 비용 → 3중화로 비용 최적화
- 경쟁사 → 컨설팅 생태계 차별화

## 소스 문서 링크
- [기능 요구사항 Phase 1 MVP](../Church_Thrive/Dev_Plan/04_기능_요구사항_Phase1_MVP.md)
- [기능 요구사항 Phase 2-4](../Church_Thrive/Dev_Plan/05_기능_요구사항_Phase2_4.md)
- [비기능 요구사항](../Church_Thrive/Dev_Plan/08_비기능_요구사항.md)
- [통합 요구사항](../Church_Thrive/Dev_Plan/09_통합_요구사항.md)
- [리스크 관리](../Church_Thrive/Dev_Plan/12_리스크_관리.md)
