---
type: guide
aliases:
  - Dataview 가이드
  - 교회 통계 쿼리
author:
  - "[[박종영]]"
date created: 2025-11-14
tags: [교회컨설팅, dataview, 쿼리, 통계]
status: published
priority: high
target_audience: 중급 이상 사용자
description: 교회 지식관리를 위한 필수 Dataview 쿼리 20선
---

# Dataview 쿼리 20선

> **"데이터는 숨어있고, 쿼리는 드러냅니다"**
>
> 복사해서 바로 사용할 수 있는 20가지 실전 쿼리

---

## 📋 목차

1. [Dataview 기초](#dataview-기초)
2. [출석 관련 쿼리 (5개)](#출석-관련-쿼리)
3. [재정 관련 쿼리 (3개)](#재정-관련-쿼리)
4. [설교 관련 쿼리 (4개)](#설교-관련-쿼리)
5. [심방 관련 쿼리 (3개)](#심방-관련-쿼리)
6. [행사 관련 쿼리 (3개)](#행사-관련-쿼리)
7. [회의록 관련 쿼리 (2개)](#회의록-관련-쿼리)
8. [대시보드 쿼리 (복합)](#대시보드-쿼리)

---

## Dataview 기초

### 설치

1. Settings → Community plugins
2. "Dataview" 검색
3. Install → Enable

### 기본 문법

```dataview
SELECT (무엇을)
FROM (어디서)
WHERE (조건)
SORT (정렬)
LIMIT (개수)
```

---

## 출석 관련 쿼리

### 쿼리 1: 최근 4주 출석 현황

**용도**: 출석 추이 한눈에 보기

````markdown
```dataview
TABLE
  date AS "날짜",
  total_attendance AS "출석",
  (total_attendance - 200) AS "목표 대비"
FROM "100.교회운영/110.주보"
WHERE type = "bulletin"
  AND date >= date(today) - dur(28 days)
SORT date DESC
```
````

**결과 예시**:
| 파일 | 날짜 | 출석 | 목표 대비 |
|------|------|------|-----------|
| 2025-01-26 주보 | 2025-01-26 | 210 | +10 |
| 2025-01-19 주보 | 2025-01-19 | 195 | -5 |
| 2025-01-12 주보 | 2025-01-12 | 200 | 0 |

---

### 쿼리 2: 월별 평균 출석

**용도**: 월간 리포트 작성

````markdown
```dataview
TABLE
  dateformat(date, "yyyy-MM") AS "월",
  round(avg(rows.total_attendance), 0) AS "평균 출석",
  min(rows.total_attendance) AS "최소",
  max(rows.total_attendance) AS "최대"
FROM "100.교회운영/110.주보"
WHERE type = "bulletin"
  AND date >= date("2025-01-01")
GROUP BY dateformat(date, "yyyy-MM")
SORT dateformat(date, "yyyy-MM") DESC
```
````

**결과 예시**:
| 월 | 평균 출석 | 최소 | 최대 |
|----|----------|------|------|
| 2025-01 | 202 | 195 | 210 |
| 2024-12 | 198 | 180 | 220 |

---

### 쿼리 3: 출석률 상승/하락 주간

**용도**: 문제 주일 찾기

````markdown
```dataview
TABLE
  date AS "날짜",
  total_attendance AS "출석",
  round((total_attendance / 200.0) * 100, 1) + "%" AS "목표 대비"
FROM "100.교회운영/110.주보"
WHERE type = "bulletin"
  AND total_attendance < 180
  AND date >= date("2025-01-01")
SORT date DESC
```
````

---

### 쿼리 4: 1부 vs 2부 출석 비교

**용도**: 예배 시간 최적화

````markdown
```dataview
TABLE
  date AS "날짜",
  attendance_1st AS "1부",
  attendance_2nd AS "2부",
  round((attendance_1st / total_attendance) * 100, 0) + "%" AS "1부 비율"
FROM "100.교회운영/110.주보"
WHERE type = "bulletin"
  AND date >= date(today) - dur(56 days)
SORT date DESC
```
````

---

### 쿼리 5: 연간 출석 그래프 데이터

**용도**: 엑셀 차트용 데이터 추출

````markdown
```dataview
TABLE
  date AS "날짜",
  total_attendance AS "출석"
FROM "100.교회운영/110.주보"
WHERE type = "bulletin"
  AND date >= date("2025-01-01")
SORT date ASC
```
````

**팁**: 결과를 복사하여 Excel에 붙여넣기

---

## 재정 관련 쿼리

### 쿼리 6: 주간 헌금 추이

**용도**: 헌금 흐름 파악

````markdown
```dataview
TABLE
  date AS "날짜",
  offering AS "헌금",
  round(offering / 1000000, 1) + "M" AS "백만원"
FROM "100.교회운영/110.주보"
WHERE type = "bulletin"
  AND date >= date(today) - dur(84 days)
SORT date DESC
```
````

---

### 쿼리 7: 월별 헌금 통계

**용도**: 월간 재정 보고

````markdown
```dataview
TABLE
  dateformat(date, "yyyy-MM") AS "월",
  sum(rows.offering) AS "총 헌금",
  round(avg(rows.offering), 0) AS "주평균",
  count(rows) AS "주수"
FROM "100.교회운영/110.주보"
WHERE type = "bulletin"
  AND date >= date("2025-01-01")
GROUP BY dateformat(date, "yyyy-MM")
SORT dateformat(date, "yyyy-MM") DESC
```
````

---

### 쿼리 8: 헌금 목표 달성률

**용도**: 예산 대비 실적

````markdown
```dataview
TABLE WITHOUT ID
  "연간 목표: 600,000,000원" AS "목표",
  sum(offering) AS "현재",
  round((sum(offering) / 600000000.0) * 100, 1) + "%" AS "달성률"
FROM "100.교회운영/110.주보"
WHERE type = "bulletin"
  AND date >= date("2025-01-01")
```
````

---

## 설교 관련 쿼리

### 쿼리 9: 최근 설교 목록

**용도**: 설교 이력 확인

````markdown
```dataview
TABLE
  date AS "날짜",
  sermon_title AS "제목",
  sermon_text AS "본문",
  status AS "상태"
FROM "100.교회운영/120.설교"
WHERE type = "sermon"
SORT date DESC
LIMIT 10
```
````

---

### 쿼리 10: 성경 책별 설교 통계

**용도**: 설교 균형 점검

````markdown
```dataview
TABLE
  length(rows) AS "설교 수",
  rows.sermon_title AS "제목들"
FROM "100.교회운영/120.설교"
WHERE type = "sermon"
  AND date >= date("2025-01-01")
GROUP BY sermon_text
SORT length(rows) DESC
```
````

---

### 쿼리 11: 미완성 설교 (Draft)

**용도**: 준비 중인 설교 확인

````markdown
```dataview
LIST
FROM "100.교회운영/120.설교"
WHERE type = "sermon"
  AND status = "draft"
SORT date ASC
```
````

---

### 쿼리 12: 설교 시리즈별 모음

**용도**: 시리즈 설교 관리

````markdown
```dataview
TABLE
  date AS "날짜",
  sermon_title AS "제목"
FROM "100.교회운영/120.설교"
WHERE type = "sermon"
  AND sermon_series = "[[요한복음 시리즈]]"
SORT date ASC
```
````

---

## 심방 관련 쿼리

### 쿼리 13: 이번 주 심방 대상

**용도**: 심방 일정 관리

````markdown
```dataview
TABLE
  date AS "예정일",
  visitee AS "대상",
  visit_type AS "유형",
  location AS "장소"
FROM "200.성도관리/220.심방기록"
WHERE type = "visit"
  AND date >= date(today)
  AND date <= date(today) + dur(7 days)
SORT date ASC
```
````

---

### 쿼리 14: 후속 심방 필요 목록

**용도**: Follow-up 관리

````markdown
```dataview
TABLE
  visitee AS "대상",
  visit_type AS "유형",
  follow_up_date AS "후속 심방일"
FROM "200.성도관리/220.심방기록"
WHERE type = "visit"
  AND follow_up = true
  AND follow_up_date <= date(today) + dur(14 days)
SORT follow_up_date ASC
```
````

---

### 쿼리 15: 월간 심방 통계

**용도**: 심방 실적 확인

````markdown
```dataview
TABLE
  dateformat(date, "yyyy-MM") AS "월",
  count(rows) AS "심방 건수",
  rows.visit_type AS "유형별"
FROM "200.성도관리/220.심방기록"
WHERE type = "visit"
  AND date >= date("2025-01-01")
GROUP BY dateformat(date, "yyyy-MM")
SORT dateformat(date, "yyyy-MM") DESC
```
````

---

## 행사 관련 쿼리

### 쿼리 16: 다가오는 행사

**용도**: 행사 일정 확인

````markdown
```dataview
TABLE
  date AS "날짜",
  event_name AS "행사명",
  location AS "장소",
  status AS "상태",
  expected_attendance AS "예상 인원"
FROM "600.행사"
WHERE type = "event"
  AND date >= date(today)
  AND status != "cancelled"
SORT date ASC
LIMIT 5
```
````

---

### 쿼리 17: 준비 중인 행사 (체크리스트)

**용도**: 행사 준비 현황

````markdown
```dataview
LIST
FROM "600.행사"
WHERE type = "event"
  AND status = "planning"
SORT date ASC
```
````

---

### 쿼리 18: 행사별 예산 및 실적

**용도**: 재정 관리

````markdown
```dataview
TABLE
  event_name AS "행사",
  date AS "날짜",
  budget AS "예산",
  expected_attendance AS "예상",
  status AS "상태"
FROM "600.행사"
WHERE type = "event"
  AND date >= date("2025-01-01")
SORT date DESC
```
````

---

## 회의록 관련 쿼리

### 쿼리 19: 최근 회의록 & 결정사항

**용도**: 회의 이력 확인

````markdown
```dataview
TABLE
  date AS "날짜",
  meeting_type AS "유형",
  agenda_count AS "안건 수",
  status AS "상태"
FROM "100.교회운영/130.회의록"
WHERE type = "meeting"
SORT date DESC
LIMIT 10
```
````

---

### 쿼리 20: 미승인 회의록

**용도**: 승인 대기 문서 확인

````markdown
```dataview
LIST
FROM "100.교회운영/130.회의록"
WHERE type = "meeting"
  AND status != "approved"
SORT date DESC
```
````

---

## 대시보드 쿼리

### 종합 대시보드 (복합 쿼리)

**용도**: 한 페이지에 모든 통계

````markdown
# 교회 대시보드 (2025)

## 📊 출석 통계

### 최근 4주
```dataview
TABLE
  date AS "날짜",
  total_attendance AS "출석"
FROM "100.교회운영/110.주보"
WHERE type = "bulletin"
  AND date >= date(today) - dur(28 days)
SORT date DESC
```

### 월평균
```dataview
TABLE WITHOUT ID
  "2025년 평균" AS "기간",
  round(avg(total_attendance), 0) AS "평균 출석"
FROM "100.교회운영/110.주보"
WHERE type = "bulletin"
  AND date >= date("2025-01-01")
```

---

## 💰 재정 통계

### 월별 헌금
```dataview
TABLE
  dateformat(date, "yyyy-MM") AS "월",
  sum(rows.offering) AS "헌금"
FROM "100.교회운영/110.주보"
WHERE type = "bulletin"
  AND date >= date("2025-01-01")
GROUP BY dateformat(date, "yyyy-MM")
SORT dateformat(date, "yyyy-MM") DESC
```

---

## 🙏 심방 현황

### 이번 달 심방
```dataview
TABLE
  date AS "날짜",
  visitee AS "대상"
FROM "200.성도관리/220.심방기록"
WHERE type = "visit"
  AND date >= date(today) - dur(30 days)
SORT date DESC
```

---

## 📅 다가오는 행사

```dataview
TABLE
  date AS "날짜",
  event_name AS "행사"
FROM "600.행사"
WHERE type = "event"
  AND date >= date(today)
SORT date ASC
LIMIT 3
```
````

---

## 고급 팁

### Tip 1: 결과를 표로 내보내기

1. 쿼리 결과 우클릭
2. "Copy as CSV"
3. Excel에 붙여넣기

---

### Tip 2: DataviewJS 사용 (고급)

**JavaScript로 더 복잡한 쿼리**:

````markdown
```dataviewjs
let pages = dv.pages('"100.교회운영/110.주보"')
  .where(p => p.type == "bulletin");

let avgAttendance = pages
  .array()
  .reduce((sum, p) => sum + p.total_attendance, 0) / pages.length;

dv.paragraph(`평균 출석: ${Math.round(avgAttendance)}명`);
```
````

---

### Tip 3: 쿼리 템플릿 만들기

**폴더**: `Templates/Dataview_Templates/`

**파일**: `출석_통계_템플릿.md`

```markdown
# 출석 통계 보고

**기간**: YYYY-MM-DD ~ YYYY-MM-DD

## 주간 출석
```dataview
... (쿼리)
```

## 분석
-
```

---

## 📚 관련 문서

- **[[대시보드_구축_가이드]]** - 대시보드 만들기
- **[[핵심_플러그인_TOP10]]** - Dataview 설치
- **[[YAML_프론트매터_표준]]** - 쿼리를 위한 메타데이터

---

## 🎯 다음 단계

### Level 1: 기본 쿼리 사용 ✅
- [ ] 위 쿼리 20개 복사
- [ ] 대시보드 노트 생성
- [ ] 매주 확인

### Level 2: 쿼리 커스터마이징
- [ ] 교회 상황에 맞게 수정
- [ ] 새로운 필드 추가
- [ ] 조건 변경

### Level 3: DataviewJS 활용
- [ ] JavaScript 기초 학습
- [ ] 복잡한 통계 쿼리 작성
- [ ] 차트 생성

---

**작성**: [[박종영]]
**날짜**: 2025-11-14
**버전**: 1.0

**다음 가이드**: [[대시보드_구축_가이드]] (실전 대시보드) →
