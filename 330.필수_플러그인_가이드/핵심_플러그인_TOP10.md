---
type: guide
aliases:
  - 필수 플러그인
  - Essential Plugins
  - 옵시디언 플러그인
author:
  - "[[박종영]]"
date created: 2025-11-14
date modified: 2025-11-14
tags: [교회컨설팅, obsidian, 플러그인, 필수도구]
status: published
priority: high
estimated_reading_time: 45 min
target_audience: Obsidian 초기 설정 완료한 분
description: 교회 업무에 필수적인 Obsidian 플러그인 TOP10 + 설치 및 활용 가이드
---

# 핵심 플러그인 TOP10

> **"플러그인으로 생산성 10배 향상"**
>
> 교회 업무에 꼭 필요한 10개 플러그인을 선별했습니다. 각각의 설치 방법과 실전 활용법을 안내합니다.

---

## 📋 목차

1. [플러그인이란?](#1-플러그인이란)
2. [플러그인 설치 방법 (공통)](#2-플러그인-설치-방법-공통)
3. [TOP 10 플러그인 상세 가이드](#3-top-10-플러그인-상세-가이드)
4. [플러그인 조합 추천](#4-플러그인-조합-추천)
5. [트러블슈팅](#5-트러블슈팅)

---

## 1. 플러그인이란?

### 🧩 Obsidian 플러그인 개념

**플러그인 = Obsidian의 기능을 확장하는 추가 도구**

**비유**:
```
Obsidian = 스마트폰
플러그인 = 앱 (카카오톡, 지도, 카메라...)

기본 Obsidian만으로도 충분하지만,
플러그인을 추가하면 훨씬 강력해집니다!
```

### 📦 플러그인 2종류

#### Core Plugins (기본 플러그인)
- Obsidian에 기본 포함
- 무료, 안전
- Settings → Core plugins에서 켜기/끄기
- **예시**: Templates, Daily notes, Graph view

#### Community Plugins (커뮤니티 플러그인)
- 사용자들이 만든 플러그인
- 무료, 오픈소스
- Settings → Community plugins에서 설치
- **예시**: Calendar, Dataview, Kanban

**이 가이드는 Community Plugins 중심입니다**

---

## 2. 플러그인 설치 방법 (공통)

### 🔧 Community Plugins 활성화 (최초 1회)

1. **Settings 열기** (`Ctrl+,` 또는 `Cmd+,`)

2. **Community plugins 메뉴 클릭**

3. **"Turn on community plugins" 버튼 클릭**
   ```
   ⚠️ 경고 메시지 나타남:
   "Community plugins can access files on your computer..."

   → "Turn on" 버튼 클릭
   ```

4. **활성화 완료!**
   - 이제 Browse 버튼이 활성화됨

---

### 📥 플러그인 설치 4단계 (공통)

**모든 플러그인 설치가 동일**:

1. **Settings → Community plugins → Browse 클릭**

2. **검색창에 플러그인 이름 입력**
   - 예: "Calendar"

3. **플러그인 클릭 → Install 버튼 클릭**

4. **Enable 버튼 클릭**

**완료! 이제 사용 가능**

---

## 3. TOP 10 플러그인 상세 가이드

---

## 🗓️ #1. Calendar

### 개요
**달력 기반 노트 관리 - 교회 업무의 필수!**

**용도**:
- 주보를 날짜별로 보기
- 과거 주일 주보 즉시 찾기
- 설교 스케줄 관리

**난이도**: ⭐ (매우 쉬움)

---

### 설치

1. Settings → Community plugins → Browse
2. 검색: "**Calendar**"
3. **Calendar by Liam Cain** 선택
4. Install → Enable

---

### 설정

**Settings → Community plugins → Calendar → Options**

```
Show week number:
→ ✅ 켜기 (주차 표시)

Start week on Monday:
→ 선택 (월요일부터 시작하려면 체크)

Confirm before creating new note:
→ ❌ 끄기 (확인 없이 바로 생성)
```

---

### 활용법

#### 1. 달력 보기
- 오른쪽에 달력 패널 자동 표시
- 날짜에 동그라미 = 그날 노트 존재

#### 2. 날짜 클릭으로 주보 열기
```
사용 시나리오:
"작년 크리스마스 주보 어떻게 했지?"

→ Calendar에서 2024년 12월 25일 클릭
→ "2024-12-25 주보.md" 즉시 열림
→ 3초만에 찾기 완료!
```

#### 3. 주보 파일명 규칙
```
추천 파일명: YYYY-MM-DD 주보
예시:
- 2025-11-17 주보.md
- 2025-11-24 주보.md
- 2025-12-01 주보.md

→ Calendar가 자동으로 날짜 인식!
```

---

### 교회 활용 사례

**Case 1: 주보 관리**
```
110.주보/
├── 2025-11-03 주보.md
├── 2025-11-10 주보.md
├── 2025-11-17 주보.md ← 오늘
└── 2025-11-24 주보.md (예정)

Calendar에서 클릭 한 번으로 원하는 주일 주보 즉시 접근!
```

**Case 2: 설교 스케줄**
```
120.설교/
├── 2025-11-03_창세기_1장.md
├── 2025-11-10_창세기_2장.md
├── 2025-11-17_창세기_3장.md

→ Calendar에서 설교 시리즈 진행 상황 한눈에 파악
```

**시간 절약**: 파일 찾기 10분 → 3초 (99.5% 단축!)

---

## 📊 #2. Dataview

### 개요
**동적 데이터 쿼리 - 통계 자동화의 핵심!**

**용도**:
- 출석 통계 자동 집계
- 헌금 추이 그래프
- 행사 일정 자동 정리
- 회의록 검색

**난이도**: ⭐⭐⭐ (보통 - 쿼리 학습 필요)

---

### 설치

1. Community plugins → Browse
2. 검색: "**Dataview**"
3. Install → Enable

---

### 기본 개념

**Dataview = 노트 속의 SQL 데이터베이스**

```markdown
모든 주보에 YAML로 출석, 헌금 기록

---
type: bulletin
date: 2025-11-17
출석: 250
헌금: 5000000
---

→ Dataview가 자동으로 모든 주보에서 데이터 추출!
```

---

### 활용법

#### 쿼리 1: 최근 10주 주보 목록

````markdown
```dataview
TABLE date as "날짜", 출석, 헌금
FROM #주보
SORT date DESC
LIMIT 10
```
````

**결과**:
| 파일 | 날짜 | 출석 | 헌금 |
|------|------|------|------|
| 2025-11-17 주보 | 2025-11-17 | 250 | 5000000 |
| 2025-11-10 주보 | 2025-11-10 | 230 | 4500000 |
| ... | ... | ... | ... |

---

#### 쿼리 2: 11월 출석 통계

````markdown
```dataview
TABLE 출석, 헌금
FROM #주보
WHERE date >= date(2025-11-01) AND date <= date(2025-11-30)
SORT date ASC
```
````

---

#### 쿼리 3: 평균 출석 계산

````markdown
```dataviewjs
let pages = dv.pages('#주보')
let total = pages.length
let avgAttendance = pages.출석.reduce((a,b) => a+b, 0) / total

dv.paragraph("평균 출석: " + Math.round(avgAttendance) + "명")
```
````

---

### 교회 활용 사례

**대시보드 노트 생성**:

`000.대시보드.md`:
````markdown
# 📊 교회 대시보드

## 이번 달 출석 추이
```dataview
TABLE 출석 as "출석 인원", 헌금 as "헌금"
FROM #주보
WHERE date >= date(2025-11-01)
SORT date ASC
```

## 미완료 태스크
```dataview
TASK
WHERE !completed
GROUP BY file.folder
```

## 이번 주 행사
```dataview
LIST
FROM #행사
WHERE date >= date(today) AND date <= date(today) + dur(7 days)
```
````

**효과**: 매주 자동 업데이트되는 실시간 대시보드!

---

## ⚡ #3. Templater

### 개요
**템플릿 자동화 - 반복 작업을 0.1초로!**

**용도**:
- 버튼 클릭으로 이번 주 주보 생성
- 오늘 날짜 자동 입력
- 파일명 자동화

**난이도**: ⭐⭐ (중간)

---

### 설치

1. Community plugins → Browse
2. 검색: "**Templater**"
3. Install → Enable

---

### 설정

**Settings → Templater**

```
Template folder location:
→ "Templates" 입력

Trigger Templater on new file creation:
→ ✅ 켜기
```

---

### 템플릿 예시

**Templates/주보_자동생성.md**:
````markdown
---
type: bulletin
date: <% tp.date.now("YYYY-MM-DD") %>
출석:
헌금:
tags: [주보, <% tp.date.now("YYYY") %>]
---

# <% tp.date.now("YYYY년 MM월 DD일") %> 주보

## 📅 예배 순서

### 1부 예배 (오전 9시)
- 전주
- 찬송:
- 기도:
- 설교: **[제목]**

## 📢 교회 소식

### 이번 주 일정
- **수요일**: 수요기도회
- **금요일**: 청년부 모임

## 📖 이번 주 말씀

>

---

**작성일**: <% tp.date.now("YYYY-MM-DD HH:mm") %>
````

---

### 활용법

**주보 생성 3초 완성**:

1. 새 노트 생성 (`Ctrl+N`)
2. 파일 이름: `<% tp.date.now("YYYY-MM-DD") %> 주보`
3. 템플릿 삽입 (`Alt+E` 또는 명령 팔레트)
4. "주보_자동생성" 선택
5. **완료!**
   - 오늘 날짜가 자동으로 입력됨
   - YAML도 자동 생성
   - 구조도 완성

**시간**: 기존 10분 → 3초 (99.5% 단축!)

---

## 📋 #4. Kanban

### 개요
**칸반 보드 - 행사 프로젝트 관리**

**용도**:
- 부활절 행사 준비 태스크 관리
- To Do → In Progress → Done
- 팀 업무 분담

**난이도**: ⭐ (쉬움)

---

### 설치

1. Community plugins → Browse
2. 검색: "**Kanban**"
3. Install → Enable

---

### 활용법

**행사 준비 보드 생성**:

1. 새 노트: `부활절_행사_준비.md`
2. 우클릭 → "Open as Kanban board"
3. 3개 칸 생성:
   - To Do (해야 할 일)
   - In Progress (진행 중)
   - Done (완료)

**카드 추가**:
```
To Do 칸:
- [ ] 예산 승인 받기 (담당: 재정부)
- [ ] 장소 예약 (담당: 행정팀)
- [ ] 포스터 디자인 (담당: 디자인팀)
- [ ] 봉사자 모집 (담당: 총무)
```

**진행 상황 관리**:
- 카드를 드래그하여 이동
- To Do → In Progress → Done
- 체크박스 자동 업데이트

---

## ☁️ #5. Remotely Save

### 개요
**클라우드 백업 - 데이터 보호의 핵심**

**용도**:
- OneDrive/Google Drive 자동 동기화
- 여러 기기에서 접근
- 팀원들과 공유

**난이도**: ⭐⭐ (중간)

---

### 설치

1. Community plugins → Browse
2. 검색: "**Remotely Save**"
3. Install → Enable

---

### 설정 (OneDrive 예시)

**Settings → Remotely Save**

1. **Choose Remote Service**
   - "OneDrive" 선택

2. **Auth**
   - "Auth via OneDrive" 버튼 클릭
   - 웹 브라우저에서 Microsoft 계정 로그인
   - 승인

3. **Sync Settings**
   ```
   Sync on startup:
   → ✅ 켜기 (시작 시 자동 동기화)

   Auto sync every X minutes:
   → "30" 입력 (30분마다 자동 동기화)
   ```

4. **첫 동기화**
   - "Sync Now" 버튼 클릭
   - 완료!

---

### 교회 활용

**팀 협업 시나리오**:
```
담임목사 (데스크톱)
    ↕ OneDrive 동기화
교육전도사 (노트북)
    ↕ OneDrive 동기화
행정직원 (데스크톱)
```

**효과**:
- ✅ 실시간 공유
- ✅ 자동 백업
- ✅ 어디서나 접근

---

## 🚀 #6. QuickAdd

### 개요
**빠른 생성 - 버튼으로 1초 작업**

**용도**:
- "주보 작성" 버튼 클릭 → 자동 생성
- "회의록 작성" 버튼 → 즉시 템플릿 삽입

**난이도**: ⭐⭐⭐ (중급)

---

### 설치 & 설정

1. Community plugins → Browse → "QuickAdd" 설치

2. **Settings → QuickAdd**

3. **Macro 생성**:
   ```
   Name: "새 주보 작성"
   Type: Template
   Template Path: Templates/주보_템플릿.md
   File Name: {{DATE:YYYY-MM-DD}} 주보
   Folder: 110.주보/
   ```

4. **Lightning 버튼 클릭** → 명령 팔레트에 추가

---

### 활용

**명령 팔레트 (`Ctrl+P`) 또는 단축키로**:
- "새 주보 작성" 입력
- Enter
- **1초 완성!**

---

## 📅 #7. Periodic Notes

### 개요
**주기적 노트 - 주보 자동화**

**용도**:
- 매주 일요일 주보 자동 생성
- 월간 보고서 자동 생성

**난이도**: ⭐⭐ (중간)

---

### 설치

1. Community plugins → "Periodic Notes" 설치

---

### 설정 (주간 주보)

**Settings → Periodic Notes → Weekly**

```
Enable:
→ ✅ 켜기

Format:
→ "YYYY-MM-DD [주보]"

Template:
→ Templates/주보_템플릿.md

Folder:
→ 110.주보/
```

---

### 활용

**명령 팔레트 → "Open Weekly Note"**
- 이번 주 주보 자동 열림
- 없으면 자동 생성!

---

## ✅ #8. Tasks

### 개요
**할 일 관리 - 업무 추적**

**용도**:
- 미완료 태스크 자동 정리
- 마감일 관리
- 담당자 배정

**난이도**: ⭐⭐ (중간)

---

### 설치

1. Community plugins → "Tasks" 설치

---

### 활용법

**태스크 작성**:
```markdown
- [ ] 주보 인쇄 📅 2025-11-16 ⏫
- [ ] 찬양팀 연습 📅 2025-11-17
- [x] 헌금 봉투 준비 ✅ 2025-11-15
```

**쿼리로 조회**:
````markdown
```tasks
not done
due before in 7 days
group by due
```
````

---

## 🎨 #9. Excalidraw

### 개요
**다이어그램 - 시각화 도구**

**용도**:
- 조직도 그리기
- 행사 레이아웃 스케치
- 프로세스 플로우차트

**난이도**: ⭐⭐ (중간)

---

### 설치

1. Community plugins → "Excalidraw" 설치

---

### 활용

**새 그림 생성**:
1. 새 노트: `교회_조직도.excalidraw.md`
2. 자동으로 Excalidraw 에디터 열림
3. 도형, 화살표, 텍스트 추가
4. 저장

**노트에 삽입**:
```markdown
![[교회_조직도.excalidraw]]
```

---

## 🏠 #10. Homepage

### 개요
**홈페이지 대시보드 - 시작 화면**

**용도**:
- Obsidian 열면 대시보드 자동 표시
- 주요 링크 모음
- 이번 주 일정 요약

**난이도**: ⭐ (쉬움)

---

### 설치

1. Community plugins → "Homepage" 설치

---

### 설정

**Settings → Homepage**

```
Open on startup:
→ ✅ 켜기

Homepage file:
→ "000.대시보드.md"
```

---

### 대시보드 예시

`000.대시보드.md`:
```markdown
# 🏠 교회 대시보드

## 📌 빠른 링크
- [[주보_템플릿]]
- [[이번 주 주보]]
- [[최근 회의록]]

## ✅ 오늘 할 일
- [ ] 주보 인쇄
- [ ] 예배 준비
- [ ] 찬양 연습

## 📅 이번 주 일정
- 수요일: 기도회
- 금요일: 청년부
- 주일: 예배

## 📊 최근 통계
```dataview
TABLE 출석
FROM #주보
SORT date DESC
LIMIT 5
```
```

---

## 4. 플러그인 조합 추천

### 🎯 초보자 세트 (필수 3개)

```
1. Calendar - 날짜 관리
2. Templater - 자동화
3. Remotely Save - 백업
```

**소요 시간**: 30분
**효과**: 업무 효율 3배 향상

---

### ⚡ 중급자 세트 (7개)

```
초보자 세트 +
4. Dataview - 통계
5. Kanban - 프로젝트
6. QuickAdd - 빠른 생성
7. Tasks - 할 일 관리
```

**소요 시간**: 2시간
**효과**: 업무 효율 10배 향상

---

### 🚀 고급자 세트 (전체 10개)

```
중급자 세트 +
8. Periodic Notes - 주기 노트
9. Excalidraw - 다이어그램
10. Homepage - 대시보드
```

**소요 시간**: 4시간
**효과**: 완벽한 지식관리 시스템

---

## 5. 트러블슈팅

### 문제 1: 플러그인 설치 버튼이 안 보여요

**해결**:
1. Community plugins가 활성화되었나 확인
2. "Turn on community plugins" 버튼 클릭

---

### 문제 2: Dataview 쿼리가 안 돼요

**해결**:
1. Settings → Dataview
2. "Enable JavaScript Queries" 켜기
3. "Enable Inline Queries" 켜기

---

### 문제 3: Templater가 작동 안 해요

**해결**:
1. Template 폴더 경로 확인
2. Settings → Templater → "Template folder location"
3. 정확한 폴더명 입력

---

### 문제 4: 플러그인이 너무 많아서 느려요

**해결**:
1. 사용 안 하는 플러그인 비활성화
2. Settings → Community plugins
3. 각 플러그인 토글 끄기

---

## ✅ 완료 체크리스트

### 필수 (초보자)
- [ ] Calendar 설치 및 설정
- [ ] Templater 설치 및 템플릿 1개 생성
- [ ] Remotely Save 설치 및 OneDrive 연결

### 권장 (중급자)
- [ ] Dataview 설치 및 첫 쿼리 작성
- [ ] Kanban 설치 및 보드 1개 생성
- [ ] QuickAdd 설치 및 매크로 1개 생성
- [ ] Tasks 설치

### 선택 (고급자)
- [ ] Periodic Notes 설치
- [ ] Excalidraw 설치
- [ ] Homepage 설치 및 대시보드 생성

---

## 📚 관련 문서

- **[[초기_설정_완벽_가이드]]** - 기본 설정
- **[[Claude_Code_설치_및_연동]]** - AI 연동
- **[[Dataview_쿼리_20선]]** - 고급 쿼리

---

**작성**: [[박종영]]
**날짜**: 2025-11-14
**버전**: 1.0
**추천 순서**: Calendar → Templater → Remotely Save → 나머지

**다음 가이드**: [[Claude_Code_설치_및_연동]] →
