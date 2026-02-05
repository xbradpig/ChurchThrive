---
stage: db-design
status: retroactive
created: 2026-02-05
sources:
  - Dev_Plan/07_데이터베이스_설계.md
  - Church_Thrive/supabase/migrations/ (17 files)
  - Church_Thrive/packages/shared/src/types/database.ts
---

# 06. DB Design (데이터베이스 설계) - 역방향 문서화

## 요약

데이터베이스 설계 문서와 17개 SQL 마이그레이션 파일, 자동 생성된 TypeScript 타입을 통해
DB 설계 스테이지가 완료되었습니다. Supabase PostgreSQL + RLS 멀티테넌시가 채택되었습니다.

## 주요 결정 사항

### 1. DBMS 및 격리 전략
- **DBMS**: Supabase PostgreSQL
- **멀티테넌시**: Row Level Security (RLS)로 `church_id` 기반 완전 격리
- **암호화**: pgcrypto 확장으로 민감 데이터 암호화

### 2. 핵심 테이블 (13개)

| # | 테이블 | 마이그레이션 | 용도 |
|---|--------|-------------|------|
| 1 | churches | 00002_churches.sql | 교회 정보 |
| 2 | members | 00003_members.sql | 교인 정보 (교적) |
| 3 | families | 00004_families.sql | 가족 관계 |
| 4 | sermons | 00005_sermons.sql | 설교 정보 |
| 5 | sermon_notes | 00006_sermon_notes.sql | 말씀노트 |
| 6 | note_feedbacks | 00007_note_feedbacks.sql | 교역자 피드백 |
| 7 | organizations | 00008_organizations.sql | 조직 (당회, 부서 등) |
| 8 | org_roles | 00009_org_roles.sql | 조직 역할/권한 |
| 9 | announcements | 00010_announcements.sql | 공지사항 |
| 10 | attendances | 00011_attendances.sql | 출석 기록 |
| 11 | cell_groups | 00012_cell_groups.sql | 구역/셀 그룹 |
| 12 | pastor_assignments | 00013_pastor_assignments.sql | 교역자 배정 |
| 13 | access_requests | 00014_access_requests.sql | 가입 승인 요청 |

### 3. 마이그레이션 순서 (17개)

| 순서 | 파일 | 내용 |
|------|------|------|
| 1 | 00001_extensions.sql | PostgreSQL 확장 (uuid-ossp, pgcrypto 등) |
| 2-13 | 00002~00014 | 테이블 생성 (위 표 참조) |
| 14 | 00015_rls_policies.sql | Row Level Security 정책 |
| 15 | 00016_indexes.sql | 성능 인덱스 |
| 16 | 00017_functions.sql | PostgreSQL 함수/트리거 |

### 4. 주요 관계

```
Church (1) ──→ (N) Member ──→ (1) Family
  │                  │
  ├── (N) Sermon ──→ (N) SermonNote ──→ (N) NoteFeedback
  │
  ├── (N) Organization ──→ (N) OrgRole
  ├── (N) Announcement
  ├── (N) Attendance
  ├── (N) CellGroup
  ├── (N) PastorAssignment
  └── (N) AccessRequest
```

### 5. RLS 정책 패턴
- 모든 테이블에 `church_id` 기반 RLS 적용
- SELECT: 같은 교회 소속 멤버만 조회 가능
- INSERT/UPDATE/DELETE: 역할(role) 기반 권한 제어
- `super_admin`, `admin`, `pastor`, `leader`, `member` 5단계 역할

### 6. TypeScript 타입 생성
- `packages/shared/src/types/database.ts`: Supabase CLI로 자동 생성된 DB 타입
- 각 테이블의 Row, Insert, Update 타입 포함
- 전체 약 15.9KB

### 7. 주요 필드 설계
- **churches**: subscription_tier (free/basic/standard/premium), subdomain, custom_domain
- **members**: name_chosung (초성 검색용), role (super_admin~member), status
- **sermons**: audio_url, duration, stt_text (STT 변환 텍스트)
- **sermon_notes**: rich text (TipTap JSON), is_offline_created

## 소스 문서/코드 링크
- [데이터베이스 설계](../Church_Thrive/Dev_Plan/07_데이터베이스_설계.md)
- [마이그레이션 디렉토리](../Church_Thrive/supabase/migrations/)
- [DB 타입 정의](../Church_Thrive/packages/shared/src/types/database.ts)
