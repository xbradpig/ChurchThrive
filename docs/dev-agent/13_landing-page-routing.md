# Stage 13: 소개 페이지 및 역할 기반 라우팅

## 프로젝트 개요
- **요청**: Church Thrive 소개 페이지 생성 + 로그인 후 역할 기반 라우팅
- **일자**: 2026-02-06
- **상태**: completed

---

## 1. 요구사항 분석

### 1.1 소개 페이지 (Landing Page)
- 서비스 소개 및 주요 기능 설명
- 로그인/회원가입 버튼
- 비회원도 접근 가능 (공개 페이지)

### 1.2 역할 기반 라우팅
로그인 후 사용자 역할에 따라 다른 페이지로 이동:

| 역할 | 라우팅 대상 | 설명 |
|------|------------|------|
| admin | /dashboard | 관리자 대시보드 |
| pastor | /dashboard | 관리자 대시보드 |
| staff | /dashboard | 관리자 대시보드 |
| leader | /home | 교인 홈페이지 |
| member | /home | 교인 홈페이지 |

### 1.3 기존 시스템 분석
- **역할 정의**: `packages/shared/src/constants/roles.ts`
- **미들웨어**: `app/src/lib/supabase/middleware.ts`
- **인증 스토어**: `app/src/stores/authStore.ts`

---

## 2. 기술 설계

### 2.1 새로 생성할 페이지
```
app/src/app/
├── page.tsx                    # 소개 페이지 (루트)
├── (member)/                   # 교인용 그룹
│   ├── layout.tsx
│   └── home/
│       └── page.tsx            # 교인 홈페이지
```

### 2.2 수정할 파일
- `middleware.ts`: 역할 기반 라우팅 로직 추가
- `(auth)/login/page.tsx`: 라우팅 로직 개선

### 2.3 라우팅 플로우
```
[방문자] → / (소개 페이지) → [로그인 클릭] → /login
                                    ↓
                              [로그인 성공]
                                    ↓
                    ┌───────────────┴───────────────┐
                    ↓                               ↓
            [admin/pastor/staff]              [leader/member]
                    ↓                               ↓
              /dashboard                         /home
```

---

## 3. 구현 계획

### Phase 1: 소개 페이지 (/)
- [x] 루트 page.tsx 생성
- [x] 히어로 섹션 (서비스 소개)
- [x] 기능 소개 섹션 (6개 기능)
- [x] CTA 섹션 (로그인/회원가입)

### Phase 2: 교인 홈페이지 (/home)
- [x] (member) 라우트 그룹 생성
- [x] 교인용 레이아웃 (하단 네비게이션)
- [x] 홈페이지 컴포넌트 (인사말, 빠른 액션, 최근 설교, 공지사항)
- [x] 공지사항 목록 페이지
- [x] 프로필 페이지

### Phase 3: 역할 기반 라우팅
- [x] 미들웨어 수정 (역할 기반 라우팅)
- [x] 로그인 후 리다이렉션 로직 (이메일, 카카오, 전화번호)
- [x] OAuth 콜백 역할 기반 리다이렉션
- [x] 권한 검증 (member 역할은 admin 라우트 접근 불가)

---

## 4. 산출물

### 새로 생성한 파일
| 파일 | 설명 |
|------|------|
| `app/src/app/page.tsx` | 소개 페이지 (랜딩) |
| `app/src/app/(member)/layout.tsx` | 교인용 레이아웃 |
| `app/src/app/(member)/home/page.tsx` | 교인 홈페이지 |
| `app/src/app/(member)/announcements/page.tsx` | 공지사항 목록 |
| `app/src/app/(member)/profile/page.tsx` | 내 정보 페이지 |

### 수정한 파일
| 파일 | 변경 사항 |
|------|----------|
| `app/src/lib/supabase/middleware.ts` | 역할 기반 라우팅 로직 추가 |
| `app/src/app/(auth)/login/page.tsx` | 역할 기반 리다이렉션 로직 |
| `app/src/app/api/auth/callback/route.ts` | OAuth 콜백 역할 기반 처리 |

---

## 5. 라우팅 규칙

### 역할별 접근 권한
```
admin, pastor, staff → /dashboard (관리자 대시보드)
leader, member      → /home (교인 홈페이지)
```

### 라우트 보호
- `/dashboard`, `/admin/*`, `/members/*` → admin/pastor/staff만 접근 가능
- `/home`, `/announcements`, `/profile` → 모든 인증 사용자 접근 가능
- `/` (랜딩 페이지) → 비인증 사용자에게만 표시 (인증 시 역할 기반 리다이렉션)

---

## 6. 빌드 결과
```
✓ Compiled successfully
✓ Generating static pages (31/31)

Route (app)                      Size
┌ ○ /                            178 B
├ ○ /announcements               3.16 kB
├ ○ /dashboard                   5.55 kB
├ ○ /home                        4.12 kB
├ ○ /profile                     3.81 kB
└ ...
```
