---
stage: consultation
status: retroactive
created: 2026-02-05
sources:
  - Dev_Plan/00_프로젝트_개요.md
  - Dev_Plan/03_비즈니스_모델.md
  - Dev_Plan/10_개발팀_및_예산.md
---

# 01. Consultation (상담) - 역방향 문서화

## 요약

ChurchThrive 프로젝트의 상담 스테이지는 기획 문서 작성 과정에서 완료되었습니다.
프로젝트 개요, 비즈니스 모델, 개발팀/예산 문서를 통해 핵심 요구사항과 제약 조건이 정의되었습니다.

## 주요 결정 사항

### 1. 서비스 정의
- **서비스명**: ChurchThrive App (교회성장연구소 앱)
- **유형**: 교회 총괄 관리 SaaS
- **타겟**: 한국 개신교 교회 (중형교회 50-300명 중심)
- **플랫폼**: PWA (웹) + React Native (iOS/Android) 동시 개발

### 2. 핵심 차별화 요소
1. AI 기반 한국어 설교 STT (Google Cloud STT + Whisper + CLOVA 3중화)
2. 영적성장 도구 통합 (말씀노트 + 암송 + 통독/필사)
3. ChurchThrive 컨설팅 생태계 연동 (127명 부트캠프 졸업생 기반)
4. 교회 홈페이지 자동 빌드
5. 비용 최소화 (Cloudflare Pages + Supabase 무료 티어)

### 3. 비즈니스 모델
- **Freemium SaaS**: 무료(씨앗) → Basic(새싹, 19,900원) → Standard(열매, 49,900원) → Premium(숲, 99,900원)
- STT 종량제 + 컨설팅 번들 추가 수익
- 3년 내 5,000개 교회 등록, 1,550개 유료 전환 목표

### 4. 비전/미션
- **비전**: 모든 교회가 건강하게 성장할 수 있도록 기술로 돕는다
- **미션**: 행정의 디지털 전환과 영적 성장 도구를 통합

### 5. 핵심 가치
1. 교회 중심 (Church-First)
2. 접근성 (Accessibility) - 고령 교인도 사용 가능한 UX
3. 데이터 주권 (Data Sovereignty)
4. 비용 효율 (Cost Efficiency)
5. 보안 우선 (Security First) - PIPA 준수

## 소스 문서 링크
- [프로젝트 개요](../Church_Thrive/Dev_Plan/00_프로젝트_개요.md)
- [비즈니스 모델](../Church_Thrive/Dev_Plan/03_비즈니스_모델.md)
- [개발팀 및 예산](../Church_Thrive/Dev_Plan/10_개발팀_및_예산.md)
