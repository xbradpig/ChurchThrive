---
type: documentation
aliases:
  - YAML 표준
  - Frontmatter Guide
  - 메타데이터 가이드
author:
  - "[[박종영]]"
date created: 2025-11-14
date modified: 2025-11-14
tags: [교회컨설팅, yaml, frontmatter, 표준, 템플릿]
status: published
priority: high
target_audience: 교회 목회자, 사역자, 행정 담당자
description: 교회 지식관리를 위한 YAML Frontmatter 완벽 표준 가이드
---

# YAML 프론트매터 표준 가이드

> **"메타데이터가 곧 검색력이다"**
>
> YAML Frontmatter는 문서의 DNA입니다. 체계적인 메타데이터가 있어야 AI와 Dataview가 정확하게 작동합니다.

---

## 📋 목차

1. [YAML Frontmatter란?](#yaml-frontmatter란)
2. [필수 필드 5가지](#필수-필드-5가지)
3. [문서 타입별 표준 템플릿](#문서-타입별-표준-템플릿)
4. [필드 상세 설명](#필드-상세-설명)
5. [실전 예시](#실전-예시)
6. [일반적인 실수와 해결책](#일반적인-실수와-해결책)
7. [Dataview 쿼리 연동](#dataview-쿼리-연동)
8. [FAQ](#faq)

---

## YAML Frontmatter란?

### 1분 설명

**YAML Frontmatter = 문서의 메타데이터 (정보의 정보)**

```markdown
---
type: sermon
date: 2025-11-17
title: 하나님의 사랑
tags: [설교, 요한복음]
---

# 설교 내용 시작...
```

위 `---` 사이의 부분이 바로 **YAML Frontmatter**입니다.

### 왜 필요한가?

#### Before (YAML 없이)
```
파일명: 2025-11-17.md

언제 작성했는지 모름
누가 작성했는지 모름
어떤 종류인지 모름
→ 검색 불가능
→ AI가 이해 못함
→ 통계 불가능
```

#### After (YAML 사용)
```yaml
---
type: sermon
date: 2025-11-17
author: "[[홍길동]]"
tags: [설교, 요한복음]
---
```

```
→ 날짜별 검색 가능
→ 작성자별 검색 가능
→ 타입별 검색 가능
→ AI가 정확히 이해
→ 통계 대시보드 구축
```

---

## 필수 필드 5가지

**모든 교회 문서는 최소한 이 5가지를 포함해야 합니다**:

```yaml
---
type: note                    # 문서 타입 (필수)
aliases: []                   # 별칭 (배열 형식)
author:
  - "[[담당자명]]"            # 작성자 (wikilink 형식)
date created: 2025-11-14     # 생성일 (YYYY-MM-DD)
date modified: 2025-11-14    # 수정일 (YYYY-MM-DD)
tags: []                     # 태그 (배열 형식)
---
```

### 필드 규칙 (CRITICAL)

#### ✅ 올바른 형식
```yaml
author:
  - "[[홍길동]]"              # ✅ 큰따옴표 + [[wikilink]]
date: 2025-11-17             # ✅ YYYY-MM-DD (ISO 8601)
tags: [설교, 요한복음]        # ✅ 배열 형식
```

#### ❌ 잘못된 형식
```yaml
author:
  - [[홍길동]]                # ❌ 큰따옴표 없음
date: 2025/11/17             # ❌ 슬래시 사용
date: 11-17-2025             # ❌ MM-DD-YYYY
tags: 설교, 요한복음          # ❌ 배열 형식 아님
```

---

## 문서 타입별 표준 템플릿

### 1. 주보 (bulletin)

```yaml
---
type: bulletin
aliases: []
author:
  - "[[담임목사명]]"
date created: 2025-11-17
date: 2025-11-17              # 주일 날짜
organization: "[[우리교회]]"
tags: [주보, 주일]
status: published
sermon_title: "하나님의 사랑"
sermon_text: "요한복음 3:16"
service_times:
  - "1부: 오전 9시"
  - "2부: 오전 11시"
---
```

**활용**:
- 주일별 주보 관리
- 설교 제목 검색
- 예배 시간 참조

---

### 2. 설교 노트 (sermon)

```yaml
---
type: sermon
aliases: []
author:
  - "[[담임목사명]]"
date created: 2025-11-17
date: 2025-11-17              # 설교 날짜
organization: "[[우리교회]]"
tags: [설교, 요한복음, 사랑]
status: preached               # draft / reviewed / preached
sermon_series: "[[요한복음 시리즈]]"
sermon_title: "하나님의 사랑"
sermon_text: "요한복음 3:16"
sermon_type: 주일설교          # 주일설교 / 수요예배 / 특별예배
attendance: 250
offering: 5000000
---
```

**활용**:
- 설교 시리즈 관리
- 성경 본문별 검색
- 출석 및 헌금 통계

---

### 3. 회의록 (meeting)

```yaml
---
type: meeting
aliases: []
author:
  - "[[서기명]]"
date created: 2025-11-14
date: 2025-11-14              # 회의 날짜
organization: "[[우리교회]]"
tags: [회의록, 운영위원회]
status: approved              # draft / reviewed / approved
meeting_type: 운영위원회       # 운영위원회 / 제직회 / 당회 / 공동의회
attendees:
  - "[[담임목사]]"
  - "[[장로1]]"
  - "[[장로2]]"
location: 교회 사무실
duration: 2h
next_meeting: 2025-12-14
---
```

**활용**:
- 회의 이력 추적
- 참석자별 회의 검색
- 다음 회의 일정 관리

---

### 4. 행사 기획 (event)

```yaml
---
type: event
aliases: []
author:
  - "[[행사담당자]]"
date created: 2025-11-14
date: 2025-12-25              # 행사 날짜
organization: "[[우리교회]]"
tags: [행사, 크리스마스]
status: planning              # planning / confirmed / completed / cancelled
event_name: "2025 크리스마스 축제"
event_type: 특별행사           # 특별행사 / 전도행사 / 친교행사
location: 교회 대강당
budget: 3000000
expected_attendance: 500
coordinator:
  - "[[행사팀장]]"
---
```

**활용**:
- 행사 일정 관리
- 예산 추적
- 과거 행사 참조

---

### 5. 심방 기록 (visit)

```yaml
---
type: visit
aliases: []
author:
  - "[[목회자명]]"
date created: 2025-11-14
date: 2025-11-14              # 심방 날짜
organization: "[[우리교회]]"
tags: [심방, 병원]
status: completed
visit_type: 병원심방           # 가정심방 / 병원심방 / 사무실방문
visitee:
  - "[[김철수]]"
location: 서울대병원 501호
prayer_requests:
  - 수술 잘 되도록
  - 빠른 회복
follow_up: true
follow_up_date: 2025-11-21
---
```

**활용**:
- 성도 심방 이력
- 기도 제목 추적
- 후속 방문 일정

---

### 6. 교육 자료 (education)

```yaml
---
type: education
aliases: []
author:
  - "[[교육담당자]]"
date created: 2025-11-14
date modified: 2025-11-14
organization: "[[우리교회]]"
tags: [교육, 새가족]
status: published
course_name: "새가족반"
course_level: 입문             # 입문 / 기초 / 중급 / 고급
target_audience: 새가족
duration: 4주
materials:
  - "[[새가족반_교재.pdf]]"
  - "[[영상자료_링크]]"
---
```

**활용**:
- 교육 과정 관리
- 레벨별 자료 검색
- 교재 버전 관리

---

### 7. 재정 보고 (finance)

```yaml
---
type: finance
aliases: []
author:
  - "[[재정담당자]]"
date created: 2025-11-30
date: 2025-11-30              # 보고 기준일
organization: "[[우리교회]]"
tags: [재정, 월보고]
status: reviewed              # draft / reviewed / approved
report_type: 월보고            # 주보고 / 월보고 / 분기보고 / 연보고
period: "2025-11"
income: 50000000
expense: 40000000
balance: 10000000
categories:
  - 십일조: 30000000
  - 감사헌금: 15000000
  - 기타: 5000000
---
```

**활용**:
- 재정 추이 분석
- 수입/지출 통계
- 예산 대비 실적

---

### 8. 일반 보고서 (report)

```yaml
---
type: report
aliases: []
author:
  - "[[보고자명]]"
date created: 2025-11-14
date modified: 2025-11-14
organization: "[[우리교회]]"
tags: [보고서, 전도]
status: submitted             # draft / reviewed / submitted / approved
report_title: "2025년 전도 사역 현황"
report_category: 사역보고       # 사역보고 / 현황보고 / 제안서
submitted_to:
  - "[[담임목사]]"
  - "[[운영위원회]]"
deadline: 2025-11-20
---
```

**활용**:
- 보고서 제출 현황
- 카테고리별 분류
- 마감일 관리

---

### 9. 사람 정보 (people)

```yaml
---
type: people
aliases:
  - 김철수
  - 철수 집사
author:
  - "[[등록담당자]]"
date created: 2025-11-14
date modified: 2025-11-14
organization: "[[우리교회]]"
tags: [성도, 집사]
status: active                # active / inactive / moved
role: 집사
ministry:
  - "[[청년부]]"
  - "[[찬양팀]]"
birthday: 1985-05-15
join_date: 2020-03-01
contact: 010-1234-5678
email: chulsoo@example.com
address: "서울시 강남구"
family:
  - "[[배우자명]]"
  - "[[자녀1]]"
---
```

**활용**:
- 성도 정보 관리
- 생일 알림
- 사역팀 구성원 검색

---

### 10. 조직 정보 (organization)

```yaml
---
type: organization
aliases: []
author:
  - "[[등록담당자]]"
date created: 2025-11-14
date modified: 2025-11-14
tags: [조직, 부서]
status: active
org_name: "청년부"
org_type: 부서                 # 부서 / 위원회 / 팀 / 소그룹
parent_org: "[[우리교회]]"
leader:
  - "[[청년부장]]"
members_count: 50
meeting_day: 토요일
meeting_time: "오후 7시"
description: "20-30대 청년들의 신앙 공동체"
---
```

**활용**:
- 조직도 관리
- 리더 검색
- 모임 일정 참조

---

## 필드 상세 설명

### type (문서 타입)

**형식**: 문자열 (string)

**가능한 값**:
- `bulletin` - 주보
- `sermon` - 설교
- `meeting` - 회의록
- `event` - 행사
- `visit` - 심방
- `education` - 교육
- `finance` - 재정
- `report` - 보고서
- `people` - 사람
- `organization` - 조직
- `note` - 일반 노트

**사용 예시**:
```yaml
type: sermon
```

---

### aliases (별칭)

**형식**: 배열 (array)

**용도**: 문서를 다른 이름으로 검색할 때 사용

**사용 예시**:
```yaml
aliases:
  - 크리스마스 행사
  - Christmas Event
  - 2025 성탄축제
```

**활용**:
- `[[크리스마스 행사]]` → 원본 문서로 연결
- `[[Christmas Event]]` → 원본 문서로 연결

---

### author (작성자)

**형식**: 배열 + Wikilink + 따옴표

**CRITICAL**: 반드시 `"[[이름]]"` 형식으로 작성

**사용 예시**:
```yaml
author:
  - "[[홍길동]]"
  - "[[김영희]]"    # 공동 작성자
```

**잘못된 예시**:
```yaml
author:
  - [[홍길동]]      # ❌ 따옴표 없음
  - 홍길동          # ❌ Wikilink 없음
```

---

### date created & date modified

**형식**: YYYY-MM-DD (ISO 8601)

**사용 예시**:
```yaml
date created: 2025-11-14
date modified: 2025-11-17
```

**자동화 팁**:
- Templater 플러그인 사용 시:
  ```
  date created: {{date:YYYY-MM-DD}}
  date modified: {{date:YYYY-MM-DD}}
  ```

---

### date (행사/회의 날짜)

**형식**: YYYY-MM-DD

**용도**: 문서가 다루는 실제 날짜 (생성일과 다를 수 있음)

**사용 예시**:
```yaml
date created: 2025-11-14    # 문서 작성일
date: 2025-11-17            # 실제 주일 날짜
```

---

### organization (소속 조직)

**형식**: Wikilink + 따옴표

**사용 예시**:
```yaml
organization: "[[새소망교회]]"
```

---

### tags (태그)

**형식**: 배열

**사용 예시**:
```yaml
tags: [설교, 요한복음, 사랑, 복음]
```

**태그 네이밍 규칙**:
- 한글 태그: `주보`, `설교`, `회의록`
- 영문 태그: `sermon`, `meeting`
- 복합 태그: `청년부`, `새가족반`

**체계적인 태그 구조**:
```yaml
tags:
  - 분류: sermon
  - 성경: 요한복음
  - 주제: 사랑
  - 대상: 청년
```

---

### status (상태)

**형식**: 문자열

**설교용 status**:
- `draft` - 작성 중
- `reviewed` - 검토 완료
- `preached` - 설교 완료

**회의록용 status**:
- `draft` - 작성 중
- `reviewed` - 검토 완료
- `approved` - 승인 완료

**행사용 status**:
- `planning` - 기획 중
- `confirmed` - 확정
- `completed` - 완료
- `cancelled` - 취소

---

## 실전 예시

### 예시 1: 2025년 11월 17일 주보

```yaml
---
type: bulletin
aliases:
  - 2025-11-17 주보
  - 11월 셋째주 주보
author:
  - "[[홍길동]]"
date created: 2025-11-14
date: 2025-11-17
organization: "[[새소망교회]]"
tags: [주보, 주일, 추수감사절]
status: published
sermon_title: "감사의 제사를 드리는 자"
sermon_text: "시편 50:23"
service_times:
  - "1부 예배: 오전 9시"
  - "2부 예배: 오전 11시"
special_events:
  - 추수감사절 예배
  - 새가족 환영회
---

# 2025년 11월 17일 주보

## 📅 예배 순서
...
```

---

### 예시 2: 요한복음 시리즈 3회 설교

```yaml
---
type: sermon
aliases:
  - 요한복음 3회
  - 하나님의 사랑 설교
author:
  - "[[홍길동]]"
date created: 2025-11-10
date: 2025-11-17
organization: "[[새소망교회]]"
tags: [설교, 요한복음, 사랑, 복음, 주일설교]
status: preached
sermon_series: "[[요한복음 시리즈]]"
sermon_number: 3
sermon_title: "하나님의 사랑"
sermon_text: "요한복음 3:16"
sermon_type: 주일설교
sermon_duration: 45분
attendance: 250
offering: 5200000
key_points:
  - 하나님의 사랑은 희생적이다
  - 믿음으로 영생을 얻는다
  - 복음을 전해야 한다
related_sermons:
  - "[[요한복음 시리즈 2회]]"
  - "[[사랑에 관한 설교 모음]]"
---

# 하나님의 사랑 (요한복음 3:16)

## 본문
> 하나님이 세상을 이처럼 사랑하사 독생자를 주셨으니...
```

---

### 예시 3: 운영위원회 회의록

```yaml
---
type: meeting
aliases:
  - 2025-11 운영위원회
  - 11월 운영위원회
author:
  - "[[김서기]]"
date created: 2025-11-14
date: 2025-11-14
organization: "[[새소망교회]]"
tags: [회의록, 운영위원회, 11월]
status: approved
meeting_type: 운영위원회
meeting_number: 11
attendees:
  - "[[홍길동]]"
  - "[[장로1]]"
  - "[[장로2]]"
  - "[[안수집사1]]"
absent:
  - "[[장로3]]"
location: 교회 사무실
start_time: "19:00"
end_time: "21:00"
duration: 2h
next_meeting: 2025-12-12
agenda_items:
  - 크리스마스 행사 계획
  - 2026년 예산안
  - 새가족 관리 방안
decisions:
  - 크리스마스 예산 300만원 승인
  - 새가족부 신설 결정
---

# 2025년 11월 운영위원회 회의록

## 회의 정보
- **일시**: 2025-11-14 (목) 오후 7시
- **장소**: 교회 사무실
- **참석자**: 홍길동 목사, 장로1, 장로2, 안수집사1
- **결석자**: 장로3 (출장)
```

---

## 일반적인 실수와 해결책

### 실수 1: Wikilink에 따옴표 누락

❌ **잘못된 예시**:
```yaml
author:
  - [[홍길동]]
```

✅ **올바른 예시**:
```yaml
author:
  - "[[홍길동]]"
```

**원인**: YAML 파서가 `[` 문자를 배열로 인식
**해결**: 반드시 큰따옴표로 감싸기

---

### 실수 2: 날짜 형식 오류

❌ **잘못된 예시**:
```yaml
date: 2025/11/17        # 슬래시
date: 11-17-2025        # MM-DD-YYYY
date: 2025.11.17        # 점
```

✅ **올바른 예시**:
```yaml
date: 2025-11-17        # YYYY-MM-DD
```

**원인**: ISO 8601 표준을 따라야 Dataview가 인식
**해결**: 항상 `YYYY-MM-DD` 형식 사용

---

### 실수 3: 들여쓰기 오류

❌ **잘못된 예시**:
```yaml
author:
- "[[홍길동]]"          # 들여쓰기 없음
  - "[[김영희]]"        # 들여쓰기 불일치
```

✅ **올바른 예시**:
```yaml
author:
  - "[[홍길동]]"        # 2칸 들여쓰기
  - "[[김영희]]"        # 2칸 들여쓰기
```

**원인**: YAML은 들여쓰기에 민감
**해결**: 항상 2칸 스페이스 사용 (탭 X)

---

### 실수 4: 태그를 문자열로 작성

❌ **잘못된 예시**:
```yaml
tags: 설교, 요한복음     # 문자열
```

✅ **올바른 예시**:
```yaml
tags: [설교, 요한복음]   # 배열
```

**원인**: Dataview가 배열만 인식
**해결**: 반드시 `[]` 배열 형식 사용

---

### 실수 5: status 값 불일치

❌ **잘못된 예시**:
```yaml
status: 완료             # 한글
status: Done            # 대문자
status: in-progress     # 하이픈
```

✅ **올바른 예시**:
```yaml
status: completed       # 영문 소문자
```

**원인**: 표준화되지 않으면 검색 불가
**해결**: 미리 정의된 status 값 사용

---

## Dataview 쿼리 연동

### 쿼리 1: 이번 주 설교 목록

```dataview
TABLE
  sermon_title AS "설교 제목",
  sermon_text AS "본문",
  attendance AS "출석"
FROM "100.교회운영/120.설교"
WHERE type = "sermon"
  AND date >= date(today) - dur(7 days)
SORT date DESC
```

**결과**:
| 파일 | 설교 제목 | 본문 | 출석 |
|------|-----------|------|------|
| 2025-11-17 설교 | 하나님의 사랑 | 요한복음 3:16 | 250 |
| 2025-11-10 설교 | 영생의 길 | 요한복음 14:6 | 240 |

---

### 쿼리 2: 미승인 회의록

```dataview
TABLE
  meeting_type AS "회의 종류",
  date AS "회의일",
  status AS "상태"
FROM "100.교회운영/130.회의록"
WHERE type = "meeting"
  AND status != "approved"
SORT date DESC
```

---

### 쿼리 3: 다가오는 행사

```dataview
TABLE
  event_name AS "행사명",
  date AS "날짜",
  location AS "장소",
  expected_attendance AS "예상 인원"
FROM "100.교회운영/140.행사"
WHERE type = "event"
  AND date >= date(today)
  AND status = "confirmed"
SORT date ASC
LIMIT 5
```

---

### 쿼리 4: 출석 통계 (최근 4주)

```dataview
TABLE
  date AS "날짜",
  attendance AS "출석",
  offering AS "헌금"
FROM "100.교회운영/120.설교"
WHERE type = "sermon"
  AND date >= date(today) - dur(28 days)
SORT date DESC
```

---

### 쿼리 5: 심방 필요 목록

```dataview
TABLE
  visitee AS "대상",
  visit_type AS "종류",
  follow_up_date AS "후속 방문"
FROM "200.성도관리/심방"
WHERE type = "visit"
  AND follow_up = true
  AND follow_up_date <= date(today) + dur(7 days)
SORT follow_up_date ASC
```

---

## FAQ

### Q1: YAML Frontmatter가 화면에 보여요!

**A**: Reading View로 전환하세요.
- 방법: 오른쪽 상단의 책 아이콘 클릭
- 또는: `Ctrl+E` (토글)

---

### Q2: 필수 필드 5개는 꼭 넣어야 하나요?

**A**: 네, 필수입니다.

**이유**:
- AI가 문서를 이해하려면 최소 정보 필요
- Dataview 쿼리가 작동하려면 type 필수
- 검색 및 정렬을 위해 date 필수

**예외**: 간단한 메모는 생략 가능하지만 권장하지 않음

---

### Q3: 한글 필드명 써도 되나요?

**A**: 가능하지만 권장하지 않습니다.

```yaml
# ✅ 권장
sermon_title: "하나님의 사랑"

# ⚠️ 가능하지만 비추천
설교제목: "하나님의 사랑"
```

**이유**:
- Dataview 쿼리에서 한글 필드명 사용 불편
- 영문이 더 간결하고 표준적

---

### Q4: 날짜를 여러 개 넣고 싶어요!

**A**: 가능합니다. 용도별로 필드를 분리하세요.

```yaml
date created: 2025-11-14    # 문서 생성일
date: 2025-11-17            # 행사/설교 날짜
date modified: 2025-11-18   # 최종 수정일
deadline: 2025-11-20        # 마감일
start_date: 2025-12-01      # 시작일
end_date: 2025-12-25        # 종료일
```

---

### Q5: 태그를 계층적으로 만들 수 있나요?

**A**: 네, 슬래시(`/`)를 사용하세요.

```yaml
tags:
  - 사역/전도
  - 사역/양육
  - 부서/청년부
  - 부서/청년부/찬양팀
```

**활용**:
- `#사역` 검색 → 모든 사역 관련 문서
- `#사역/전도` 검색 → 전도 관련만

---

### Q6: wikilink 대신 일반 텍스트 쓰면 안 되나요?

**A**: 안 됩니다.

```yaml
# ❌ 잘못된 예시
author: 홍길동            # 일반 텍스트

# ✅ 올바른 예시
author:
  - "[[홍길동]]"          # Wikilink
```

**이유**:
- Wikilink로 연결해야 역링크(Backlinks) 생성
- 사람 정보 페이지와 자동 연결
- AI가 관계를 이해

---

### Q7: 배열은 어떻게 작성하나요?

**A**: 두 가지 방법이 있습니다.

**방법 1: 인라인 배열** (짧을 때)
```yaml
tags: [설교, 요한복음, 사랑]
```

**방법 2: 멀티라인 배열** (길 때)
```yaml
tags:
  - 설교
  - 요한복음
  - 사랑
  - 복음
  - 전도
```

**둘 다 동일하게 작동**합니다!

---

### Q8: YAML 문법 체크는 어떻게 하나요?

**A**: 3가지 방법:

1. **Obsidian 자체 검사**:
   - YAML 오류 시 문서 상단에 경고 표시

2. **온라인 검사기**:
   - https://www.yamllint.com/
   - YAML 복사 → 붙여넣기 → 검사

3. **Linter 플러그인**:
   - Community Plugins → "Linter" 설치
   - 자동으로 YAML 형식 교정

---

### Q9: 기존 문서에 YAML을 추가하려면?

**A**: 3단계 프로세스:

**Step 1**: 문서 맨 위에 `---` 추가
```markdown
---

---

# 기존 제목
기존 내용...
```

**Step 2**: 필수 필드 5개 입력
```markdown
---
type: note
aliases: []
author:
  - "[[작성자]]"
date created: 2025-11-14
date modified: 2025-11-14
tags: []
---
```

**Step 3**: 타입별 추가 필드 입력

---

### Q10: YAML을 자동으로 넣을 수 있나요?

**A**: 네! Templater 플러그인 사용하세요.

**템플릿 만들기**:
```markdown
---
type: <% tp.system.prompt("문서 타입") %>
aliases: []
author:
  - "[[박종영]]"
date created: <% tp.date.now("YYYY-MM-DD") %>
date modified: <% tp.date.now("YYYY-MM-DD") %>
tags: []
---

# <% tp.file.title %>

<% tp.file.cursor() %>
```

**사용법**:
1. 새 문서 생성
2. `Ctrl+P` → "Templater: Insert Template"
3. 템플릿 선택
4. YAML 자동 생성!

---

## 🎯 체크리스트

### 신규 문서 작성 시

- [ ] 문서 타입 확인 (sermon, meeting, event 등)
- [ ] 필수 필드 5개 입력
- [ ] 날짜 형식 확인 (YYYY-MM-DD)
- [ ] author에 wikilink + 따옴표 사용
- [ ] 배열 형식 사용 (tags, attendees 등)
- [ ] 들여쓰기 2칸 (스페이스)
- [ ] `---`로 시작하고 `---`로 끝내기

### 기존 문서 업데이트 시

- [ ] date modified 업데이트
- [ ] status 변경 (필요 시)
- [ ] 관련 문서 링크 추가
- [ ] 태그 추가/수정

---

## 📚 관련 문서

### 필수 참조
- **[[교회_지식관리_3Layer_완벽_가이드]]** - 전체 시스템 이해
- **[[핵심_플러그인_TOP10]]** - Dataview 플러그인 설치

### 추가 학습
- **[[Dataview_쿼리_20선]]** - 고급 쿼리 작성
- **[[Templater_활용_가이드]]** - YAML 자동화

### 템플릿 모음
- **[[주보_템플릿]]** - 주보 YAML 템플릿
- **[[설교_템플릿]]** - 설교 YAML 템플릿
- **[[회의록_템플릿]]** - 회의록 YAML 템플릿

---

## 🎓 다음 단계

### Level 1: YAML 기초 완료 ✅
- ✅ 필수 필드 5개 이해
- ✅ 문서 타입별 템플릿 숙지

### Level 2: YAML 활용
- [ ] Dataview 쿼리 작성 시작
- [ ] Templater로 자동화
- [ ] 커스텀 필드 추가

### Level 3: YAML 마스터
- [ ] 고급 Dataview 쿼리 작성
- [ ] JavaScript 쿼리 활용
- [ ] 대시보드 구축

---

**작성**: [[박종영]]
**날짜**: 2025-11-14
**버전**: 1.0
**대상**: 교회 목회자, 사역자, 행정 담당자

**다음 가이드**: [[Dataview_쿼리_20선]] (쿼리 작성법) →
