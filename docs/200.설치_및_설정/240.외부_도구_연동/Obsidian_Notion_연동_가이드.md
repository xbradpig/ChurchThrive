---
type: guide
aliases:
  - Obsidian Notion 연동
  - 양방향 동기화
  - Notion 자동화
author:
  - "[[박종영]]"
date created: 2025-11-14
date modified: 2025-11-14
tags: [교회컨설팅, Obsidian, Notion, 자동화, 연동]
status: published
priority: high
target_audience: 목회자, 사역자, IT 담당자
description: Obsidian과 Notion을 함께 활용하여 최고의 협업 환경 구축하기
---

# Obsidian ↔ Notion 연동 가이드

> **"Obsidian으로 작성하고, Notion으로 공유하세요"**
>
> 두 도구의 장점을 모두 누리는 완벽한 워크플로우!

---

## 📋 목차

1. [왜 Obsidian + Notion인가?](#왜-obsidian--notion인가)
2. [연동 방식 비교](#연동-방식-비교)
3. [방법 1: Obsidian → Notion (단방향 푸시)](#방법-1-obsidian--notion-단방향-푸시)
4. [방법 2: Notion → Obsidian (가져오기)](#방법-2-notion--obsidian-가져오기)
5. [방법 3: 양방향 준동기화](#방법-3-양방향-준동기화)
6. [실전 워크플로우](#실전-워크플로우)
7. [교회 활용 시나리오](#교회-활용-시나리오)
8. [자동화 설정](#자동화-설정)
9. [문제 해결](#문제-해결)
10. [FAQ](#faq)

---

## 왜 Obsidian + Notion인가?

### Obsidian의 강점 ✨

**1. 빠른 작성**
```
마크다운 기반 → 키보드만으로 초고속
플러그인 풍부 → 맞춤형 환경
로컬 파일 → 완전한 소유권
```

**2. 강력한 연결**
```
위키링크 [[링크]]
Graph View (관계 시각화)
Dataview 쿼리
```

**3. 프라이버시**
```
로컬 저장 → 개인정보 안전
백업 용이
```

---

### Notion의 강점 🌐

**1. 웹 기반 공유**
```
링크 하나로 공유
비기술자도 쉽게 접근
모바일 앱 우수
```

**2. 협업**
```
실시간 협업 편집
댓글 기능
멘션 (@사용자)
```

**3. 시각적 아름다움**
```
예쁜 디자인
데이터베이스 뷰 (표, 갤러리, 캘린더)
아이콘, 이미지
```

---

### 결합 전략: 역할 분담

```
┌─────────────────────────────────────────┐
│         Obsidian (작성 + 관리)            │
│                                         │
│  - 목회자가 설교 노트 작성                │
│  - 심방 기록, 회의록 작성                 │
│  - 개인 연구 노트                        │
│  - 지식 연결 및 관리                     │
└─────────────────┬───────────────────────┘
                  │ 자동 푸시
                  ▼
┌─────────────────────────────────────────┐
│          Notion (공유 + 협업)            │
│                                         │
│  - 주보 (성도들에게 공개)                 │
│  - 행사 안내 (외부 공유)                 │
│  - 팀원들과 협업                         │
│  - 웹사이트처럼 접근                     │
└─────────────────────────────────────────┘
```

**핵심 아이디어**:
- **Obsidian**: 내부 작업 (목회자, 사역자 전용)
- **Notion**: 외부 공유 (성도, 봉사자, 협력 교회)

---

## 연동 방식 비교

| 방식 | 난이도 | 자동화 | 양방향 | 추천 대상 |
|------|--------|--------|--------|----------|
| **플러그인 (Share to Notion)** | ⭐ 쉬움 | ⚠️ 수동 | ❌ 단방향 | 초보자 |
| **Zapier/Make** | ⭐⭐ 중간 | ✅ 자동 | ⚠️ 부분 | 자동화 원하는 경우 |
| **Python 스크립트** | ⭐⭐⭐ 어려움 | ✅ 자동 | ✅ 가능 | 개발자 있는 경우 |
| **Notion API + Obsidian Local REST API** | ⭐⭐⭐ 어려움 | ✅ 자동 | ✅ 완벽 | 고급 사용자 |

---

## 방법 1: Obsidian → Notion (단방향 푸시)

### 가장 현실적이고 추천하는 방법!

---

### 플러그인: Share to Notion

#### Step 1: Notion API 키 발급 (10분)

1. **Notion 웹사이트 접속**
   - https://www.notion.so

2. **Settings & Members**
   - 우측 상단 "Settings & Members" 클릭

3. **Integrations → Develop your own integrations**
   - https://www.notion.so/my-integrations
   - "New integration" 클릭

4. **Integration 생성**
   ```yaml
   Name: Obsidian 연동
   Associated workspace: 우리교회
   Type: Internal Integration
   ```

5. **API 키 복사**
   ```
   Secret: secret_XXXXXXXXXXXXXXXXXXXXXXXXXXXX
   → 복사 (잘 보관!)
   ```

---

#### Step 2: Notion 데이터베이스 준비 (5분)

1. **Notion에서 새 페이지 생성**
   - "Obsidian 동기화" 페이지

2. **Database 생성**
   ```
   /table 입력 → "Table - Inline" 선택
   ```

3. **데이터베이스 속성 설정**
   ```yaml
   제목: Title (기본)
   태그: Multi-select
   날짜: Date
   카테고리: Select
   내용: (본문)
   ```

4. **Database ID 복사**
   ```
   데이터베이스 우측 상단 "..." → "Copy link"

   링크: https://www.notion.so/123abc456def...?v=xxx
               ↑
   Database ID: 123abc456def (32자리)
   ```

5. **Integration 연결**
   ```
   데이터베이스 우측 상단 "..."
   → "Connections"
   → "Obsidian 연동" 선택 ✅
   ```

---

#### Step 3: Obsidian 플러그인 설치 (5분)

1. **Community Plugins**
   - Settings → Community plugins
   - "Browse" 클릭

2. **검색**
   ```
   검색: "Share to Notion"
   → "Share Note to Notion" 설치
   → Enable ✅
   ```

3. **플러그인 설정**
   ```yaml
   Notion API Token: secret_XXXXXXXXXXXX (Step 1에서 복사)
   Database ID: 123abc456def (Step 2에서 복사)

   Default Properties:
     - Title: {{title}}
     - Date: {{date}}
     - Tags: {{tags}}
   ```

4. **저장**

---

#### Step 4: 사용법 (30초!)

**Obsidian에서**:

1. **공유하고 싶은 노트 열기**
   - 예: "2025-01-19 주보.md"

2. **Command Palette** (`Ctrl+P`)
   ```
   입력: "Share to Notion"
   → "Share current note to Notion" 선택
   ```

3. **자동으로 Notion에 업로드!** ✨

4. **Notion 확인**
   - 데이터베이스에 새 행 추가됨
   - 제목, 내용, 태그 모두 자동 반영

---

### 대안: Obsidian to Notion Sync (더 강력)

**플러그인 이름**: "Obsidian to Notion"

**추가 기능**:
- ✅ 폴더 전체 동기화
- ✅ 자동 업데이트 (수정 시 Notion도 업데이트)
- ✅ 이미지 자동 업로드
- ✅ 테이블 변환

**설정 예시**:
```yaml
Sync folder: "100.교회운영/110.주보"
Auto sync: true
Sync interval: 30분
```

**효과**: 주보 폴더 모든 파일이 30분마다 자동으로 Notion에!

---

## 방법 2: Notion → Obsidian (가져오기)

### Notion 데이터를 Obsidian으로

---

### 방법 A: Notion 내보내기 (수동)

#### Step 1: Notion에서 내보내기 (5분)

1. **Notion 페이지 열기**
2. **우측 상단 "..." → Export**
3. **설정**
   ```yaml
   Export format: Markdown & CSV
   Include content: Everything
   Create folders for subpages: ✅
   ```
4. **Export 클릭**
   - ZIP 파일 다운로드

---

#### Step 2: Obsidian으로 가져오기 (5분)

1. **ZIP 압축 해제**
   ```
   Notion_Export.zip → Notion_Export/
   ```

2. **파일 복사**
   ```
   Notion_Export/ → Obsidian Vault/300.Notion에서_가져옴/
   ```

3. **정리**
   - Notion 링크 → Obsidian 위키링크 변환
   - 파일명 정리
   - 메타데이터 추가

---

### 방법 B: Notion API로 자동 가져오기 (고급)

**Python 스크립트 사용**

#### 준비물:
```bash
pip install notion-client
pip install python-dotenv
```

#### 스크립트 예시:

```python
# notion_to_obsidian.py

from notion_client import Client
import os
from datetime import datetime

# Notion API 설정
notion = Client(auth="secret_XXXXXXXXXXXX")

# 데이터베이스 쿼리
database_id = "123abc456def"
results = notion.databases.query(database_id=database_id)

# Obsidian Vault 경로
vault_path = "/Users/macbook/우리교회/"

for page in results["results"]:
    # 페이지 제목
    title = page["properties"]["Title"]["title"][0]["text"]["content"]

    # 페이지 내용 가져오기
    page_id = page["id"]
    blocks = notion.blocks.children.list(page_id)

    # 마크다운 변환
    content = ""
    for block in blocks["results"]:
        if block["type"] == "paragraph":
            text = block["paragraph"]["rich_text"]
            if text:
                content += text[0]["text"]["content"] + "\n\n"

    # 파일로 저장
    filename = f"{vault_path}{title}.md"
    with open(filename, "w", encoding="utf-8") as f:
        f.write(f"# {title}\n\n")
        f.write(content)

    print(f"✅ {title} 가져오기 완료")

print("\n모든 페이지 가져오기 완료!")
```

**실행**:
```bash
python notion_to_obsidian.py
```

**효과**: Notion 데이터베이스 전체가 Obsidian 마크다운으로!

---

## 방법 3: 양방향 준동기화

### 완전 자동 양방향은 어렵지만, 실용적인 방법!

---

### 전략: 역할 분담 + 선택적 동기화

**시나리오**: 주보 제작

```
월요일 (Obsidian):
  담임목사가 설교 노트 작성
  "2025-01-19 설교.md"

화요일 (Obsidian):
  행정간사가 주보 초안 작성
  "2025-01-19 주보.md"

수요일 (Obsidian → Notion):
  주보를 Notion으로 푸시 (플러그인)
  → Notion 데이터베이스에 추가됨

목요일 (Notion):
  교육전도사가 Notion에서 교육부 공지 추가
  (Notion 댓글 기능으로 의견 공유)

금요일 (Notion → Obsidian):
  최종본을 Notion에서 복사
  Obsidian 주보에 수동으로 반영

주일 (Notion):
  주보 링크를 카카오톡으로 성도들에게 공유
  "이번 주 주보: https://notion.so/주보-123abc"
```

**핵심**:
- **작성**: Obsidian (빠르고 효율적)
- **협업**: Notion (댓글, 실시간 수정)
- **공유**: Notion (링크 하나로 끝)

---

### 자동화 도구: Zapier / Make

#### Zapier 예시

**Trigger**: Obsidian 파일 변경 (Git 사용 시)
```yaml
Trigger: New file in GitHub repository
Folder: 100.교회운영/110.주보/
```

**Action**: Notion 페이지 생성
```yaml
Action: Create page in Notion
Database: 주보 데이터베이스
Title: {{file_name}}
Content: {{file_content}}
```

**결과**: GitHub에 푸시 → 자동으로 Notion에 생성!

---

#### Make (Integromat) 예시

**더 강력한 자동화**:

```
Scenario:
1. Watch Obsidian folder (Dropbox/OneDrive)
2. New or updated .md file detected
3. Parse Markdown → Extract YAML frontmatter
4. Create or Update Notion page
5. Send Slack notification: "주보가 Notion에 업데이트되었습니다"
```

**무료 플랜**: 월 1,000회 실행 (충분!)

---

## 실전 워크플로우

### 워크플로우 1: 주보 제작 및 공유

#### 목표
- Obsidian에서 빠르게 작성
- Notion으로 성도들에게 공유

#### 단계

**1. Obsidian에서 주보 작성** (화요일)
```markdown
---
type: bulletin
date: 2025-01-19
title: 2025년 1월 19일 주보
tags: [주보, 주일예배]
---

# 2025년 1월 19일 주보

## 예배 순서
1. 찬송: 23장
2. 기도: 담임목사
...

## 설교
- 제목: 하나님의 사랑
- 본문: 요한복음 3:16
- 설교자: [[담임목사]]

## 광고
...
```

**2. Notion으로 푸시** (목요일)
```
Ctrl+P → "Share to Notion"
```

**3. Notion에서 다듬기** (목요일-금요일)
- 예쁜 아이콘 추가
- 색상, 레이아웃 조정
- 이미지 삽입

**4. 성도들에게 공유** (토요일)
```
Notion 페이지 우측 상단 "Share"
→ "Share to web" ✅
→ 링크 복사

카카오톡 단체방:
"이번 주 주보입니다: https://notion.so/주보-123abc"
```

**5. 결과**
- ✅ 성도들이 웹브라우저로 주보 확인
- ✅ 모바일에서도 보기 편함
- ✅ Obsidian에는 원본 보관

---

### 워크플로우 2: 회의록 협업

#### 목표
- Obsidian에서 빠르게 기록
- Notion으로 팀원들과 협업

#### 단계

**1. Obsidian에서 회의록 작성** (회의 중)
```markdown
# 2025년 1월 운영위원회 회의록

## 참석자
- [[담임목사]]
- [[부목사]]
- [[장로1]]

## 안건 1: 2025년 예산안
- 논의 내용: ...
- 결정: ...

## 안건 2: 새가족 환영회
- 일시: 2월 5일
- 준비: 교육전도사 담당
```

**2. Notion으로 푸시**
```
Ctrl+P → "Share to Notion"
```

**3. Notion에서 팀 협업**
- 부목사가 댓글 추가: "@교육전도사 새가족 환영회 준비 부탁드립니다"
- 교육전도사가 체크박스 추가
- 실시간으로 진행 상황 업데이트

**4. 최종본 Obsidian에 반영** (다음 날)
- Notion에서 복사 → Obsidian에 붙여넣기
- 또는 Notion Export → Obsidian으로 가져오기

---

### 워크플로우 3: 설교 아카이브 웹사이트

#### 목표
- Obsidian에서 설교 노트 관리
- Notion으로 설교 아카이브 웹사이트 만들기

#### 구조

**Obsidian**:
```
100.교회운영/120.설교/
├── 요한복음 시리즈/
│   ├── 2025-01-05 요한복음 1장.md
│   ├── 2025-01-12 요한복음 2장.md
│   └── 2025-01-19 요한복음 3장.md
```

**Notion 데이터베이스**:
```
┌──────────────┬─────────┬──────────┬────────┐
│ 설교 제목     │ 날짜    │ 시리즈   │ 본문   │
├──────────────┼─────────┼──────────┼────────┤
│ 요한복음 1장  │ 01/05   │ 요한복음 │ 1:1-18 │
│ 요한복음 2장  │ 01/12   │ 요한복음 │ 2:1-12 │
│ 요한복음 3장  │ 01/19   │ 요한복음 │ 3:1-21 │
└──────────────┴─────────┴──────────┴────────┘
```

**Notion 뷰**:
- 📅 Calendar View: 날짜별로 설교 확인
- 📚 Gallery View: 시리즈별로 이미지 카드
- 📊 Table View: 전체 리스트

**공유**:
```
Notion 페이지 공개 → 교회 홈페이지에 임베드
<iframe src="https://notion.so/설교아카이브" />
```

---

## 교회 활용 시나리오

### 시나리오 1: 소형 교회 (목회자 혼자)

**문제**:
- 주보를 Word로 작성
- 성도들에게 PDF로 전송
- 관리 어려움

**해결**:
```
Obsidian으로 주보 작성 (마크다운, 빠름)
→ Notion으로 푸시
→ Notion 링크를 카카오톡으로 공유
→ 성도들이 웹에서 확인
```

**효과**:
- ✅ 작성 시간 50% 단축
- ✅ 링크 하나로 공유
- ✅ 과거 주보 검색 쉬움

---

### 시나리오 2: 중형 교회 (목회자 + 사역자 팀)

**문제**:
- 목회자는 Obsidian 선호 (빠름)
- 사역자들은 Notion 선호 (예쁨, 협업)
- 도구가 달라서 협업 어려움

**해결**:
```
역할 분담:
  목회자: Obsidian에서 설교, 심방 기록
  사역자: Notion에서 행사 기획, 주보 디자인

연결:
  Obsidian → Notion 자동 푸시
  필요 시 Notion → Obsidian 가져오기
```

**효과**:
- ✅ 각자 편한 도구 사용
- ✅ 데이터는 공유됨
- ✅ 최고의 협업 효율

---

### 시나리오 3: 대형 교회 (다수 부서)

**문제**:
- 부서별로 다른 도구 사용
- 청년부: Notion
- 교육부: Google Docs
- 행정부: Obsidian
- 정보 분산

**해결**:
```
통합 전략:
  1. 중앙 허브: Notion (모든 부서 접근 가능)
  2. 개인 작업: Obsidian (목회자, 사역자)
  3. 자동 동기화: Zapier

흐름:
  Obsidian (개인 작업)
  → Zapier (자동화)
  → Notion (중앙 허브)
  → 각 부서가 확인
```

**효과**:
- ✅ 정보 통합
- ✅ 부서 간 소통 원활
- ✅ 중복 작업 감소

---

## 자동화 설정

### 방법 A: Zapier 무료 플랜

#### Zap 설정 예시

**Trigger**: GitHub에 새 파일
```yaml
App: GitHub
Event: New File in Folder
Repository: 우리교회-vault
Path: 100.교회운영/110.주보/
```

**Filter**: 마크다운 파일만
```yaml
Filter: File name
Condition: Ends with
Value: .md
```

**Action**: Notion 페이지 생성
```yaml
App: Notion
Event: Create Page
Database: 주보 데이터베이스
Title: {{file_name}}
Content: {{file_content}}
Date: {{date}}
```

**결과**: Git Push → 자동으로 Notion에!

---

### 방법 B: Make (Integromat) 자동화

**더 강력한 시나리오**:

```
Module 1: Dropbox - Watch Folder
  Folder: /Obsidian/우리교회/100.교회운영/110.주보/
  Trigger: New or updated file

Module 2: Text Parser - Extract YAML
  Pattern: ---\n(.+?)\n---
  Extract: title, date, tags

Module 3: Markdown to HTML
  Input: {{file_content}}

Module 4: Notion - Create Page
  Database: {{주보_database_id}}
  Properties:
    Title: {{yaml.title}}
    Date: {{yaml.date}}
    Tags: {{yaml.tags}}
  Content: {{html}}

Module 5: Slack - Send Message
  Channel: #교회-알림
  Message: "새 주보가 Notion에 업로드되었습니다: {{notion_url}}"
```

**무료**: 월 1,000회 작업

---

### 방법 C: Python 스크립트 (완전 자동화)

#### 설치

```bash
pip install notion-client watchdog pyyaml markdown
```

#### 스크립트: obsidian_notion_sync.py

```python
import os
import time
import yaml
import markdown
from notion_client import Client
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# Notion 설정
notion = Client(auth="secret_XXXXXXXXXXXX")
database_id = "123abc456def"

# Obsidian Vault 경로
vault_path = "/Users/macbook/우리교회/"
watch_folder = os.path.join(vault_path, "100.교회운영/110.주보/")

class ObsidianHandler(FileSystemEventHandler):
    def on_modified(self, event):
        if event.src_path.endswith('.md'):
            print(f"📝 파일 변경 감지: {event.src_path}")
            sync_to_notion(event.src_path)

    def on_created(self, event):
        if event.src_path.endswith('.md'):
            print(f"📝 새 파일 생성: {event.src_path}")
            sync_to_notion(event.src_path)

def sync_to_notion(file_path):
    """Obsidian 파일을 Notion으로 동기화"""

    # 파일 읽기
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # YAML frontmatter 추출
    if content.startswith('---'):
        parts = content.split('---', 2)
        frontmatter = yaml.safe_load(parts[1])
        body = parts[2].strip()
    else:
        frontmatter = {}
        body = content

    # 마크다운 → HTML 변환
    html_content = markdown.markdown(body)

    # Notion 페이지 생성
    try:
        page = notion.pages.create(
            parent={"database_id": database_id},
            properties={
                "Title": {
                    "title": [{"text": {"content": frontmatter.get('title', 'Untitled')}}]
                },
                "Date": {
                    "date": {"start": frontmatter.get('date', '')}
                },
                "Tags": {
                    "multi_select": [{"name": tag} for tag in frontmatter.get('tags', [])]
                }
            },
            children=[
                {
                    "object": "block",
                    "type": "paragraph",
                    "paragraph": {
                        "rich_text": [{"type": "text", "text": {"content": body}}]
                    }
                }
            ]
        )

        print(f"✅ Notion에 업로드 완료: {frontmatter.get('title')}")
        print(f"🔗 URL: https://notion.so/{page['id']}")

    except Exception as e:
        print(f"❌ 오류 발생: {e}")

# 폴더 감시 시작
if __name__ == "__main__":
    event_handler = ObsidianHandler()
    observer = Observer()
    observer.schedule(event_handler, watch_folder, recursive=False)
    observer.start()

    print(f"👀 폴더 감시 중: {watch_folder}")
    print("Ctrl+C로 종료")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()

    observer.join()
```

#### 실행

```bash
python obsidian_notion_sync.py
```

**효과**:
- 주보 폴더의 파일 변경 감지
- 자동으로 Notion에 업로드
- 백그라운드로 계속 실행

---

## 문제 해결

### 문제 1: Notion API 권한 오류

**증상**:
```
Error: Object not found
```

**원인**: Integration이 데이터베이스에 연결 안 됨

**해결**:
```
1. Notion 데이터베이스 열기
2. 우측 상단 "..." → "Connections"
3. "Obsidian 연동" 체크 ✅
```

---

### 문제 2: 한글 깨짐

**증상**: Notion에서 한글이 ???로 표시

**원인**: 인코딩 문제

**해결**:
```python
# 파일 읽기 시
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()
```

---

### 문제 3: 위키링크 변환 안 됨

**증상**: `[[링크]]`가 Notion에서 그대로 표시

**해결**:
- Obsidian → Notion 푸시 전에 위키링크를 일반 링크로 변환
- 또는 Notion에서 수동으로 정리

---

### 문제 4: 이미지 업로드 안 됨

**증상**: 로컬 이미지가 Notion에 안 보임

**원인**: Notion은 외부 이미지 URL만 지원

**해결**:
```python
# 이미지를 Imgur/Cloudinary에 업로드 후 URL 사용
# 또는 Notion에 직접 업로드하는 API 사용
```

---

### 문제 5: 동기화 충돌

**증상**: Obsidian과 Notion 양쪽에서 수정 → 충돌

**해결**:
- **단방향 권장**: Obsidian → Notion만
- 또는 명확한 규칙:
  - 작성: Obsidian
  - 디자인/협업: Notion
  - 최종본: Obsidian에 수동 반영

---

## FAQ

### Q1: 완전 양방향 실시간 동기화 가능한가요?

**A**: 기술적으로 가능하지만 비추천

**이유**:
- 충돌 발생 가능성 높음
- Obsidian (마크다운) ↔ Notion (블록 기반) 구조 차이
- 실시간 동기화 시 성능 이슈

**대안**:
- 단방향 자동화 (Obsidian → Notion)
- 역할 분담 (작성 vs 공유)

---

### Q2: 무료로 가능한가요?

**A**: 대부분 무료!

**무료**:
- Notion API: 무료
- Obsidian 플러그인: 무료
- Python 스크립트: 무료

**유료 (선택)**:
- Zapier: 무료 플랜 월 100회 (제한적)
- Make: 무료 플랜 월 1,000회 (충분)
- Notion Pro: $8/월 (더 많은 기능)

---

### Q3: 어느 방법이 가장 좋나요?

**A**: 상황에 따라

**초보자**:
- **Share to Notion 플러그인** (가장 쉬움)

**자동화 원하는 경우**:
- **Make (Integromat)** (무료 1,000회)

**개발자 있는 경우**:
- **Python 스크립트** (완전 맞춤형)

**추천**:
- 소형 교회: 플러그인 (수동)
- 중형 교회: Make (자동화)
- 대형 교회: Python (완전 제어)

---

### Q4: Obsidian과 Notion 중 하나만 써도 되지 않나요?

**A**: 맞습니다! 하지만 함께 쓰면 더 좋습니다

**Obsidian만**:
- ✅ 빠른 작성, 강력한 연결
- ❌ 비기술자 접근 어려움
- ❌ 웹 공유 불편

**Notion만**:
- ✅ 예쁜 디자인, 쉬운 공유
- ❌ 작성 느림, 로컬 저장 안 됨

**Obsidian + Notion**:
- ✅ 빠른 작성 (Obsidian)
- ✅ 쉬운 공유 (Notion)
- ✅ 최고의 효율!

---

### Q5: 설교 영상도 연동 가능한가요?

**A**: 가능합니다!

**방법**:
```
1. YouTube에 설교 영상 업로드
2. Obsidian에 링크 추가
3. Notion으로 푸시
4. Notion에서 영상 임베드 자동 생성
```

**결과**: Notion 페이지에서 영상 재생 가능!

---

### Q6: 모바일에서도 작동하나요?

**A**: 부분적으로

**Obsidian 모바일**:
- Share to Notion 플러그인: ✅ 작동

**Notion 모바일**:
- 웹 공유 확인: ✅ 완벽
- 댓글, 협업: ✅ 완벽

**추천**: PC에서 동기화, 모바일에서 확인

---

### Q7: 과거 자료를 한 번에 옮길 수 있나요?

**A**: 가능합니다

**방법 1: 플러그인 일괄 처리**
```
1. Obsidian에서 폴더 선택
2. Command Palette: "Share folder to Notion"
3. 전체 폴더가 Notion으로!
```

**방법 2: Python 스크립트**
```python
import os
import glob

files = glob.glob("100.교회운영/110.주보/*.md")
for file in files:
    sync_to_notion(file)
```

---

### Q8: 보안은 괜찮나요?

**A**: 안전합니다

**Notion API**:
- HTTPS 암호화 통신
- Integration은 특정 데이터베이스만 접근

**주의사항**:
- API 키 노출 금지 (`.env` 파일로 관리)
- Public 공유 시 민감 정보 제외

---

### Q9: 여러 Notion 워크스페이스에 푸시할 수 있나요?

**A**: 가능합니다

**설정**:
```yaml
# Obsidian 플러그인 설정
Default workspace: 우리교회
Alternative workspaces:
  - 협력교회A
  - 협력교회B
```

**사용**:
- Command Palette: "Share to Notion (select workspace)"

---

### Q10: Dataview 쿼리 결과도 Notion으로 갈 수 있나요?

**A**: 부분적으로

**문제**: Dataview는 동적 쿼리 → Notion에서 실행 안 됨

**해결**:
```
1. Obsidian에서 Dataview 결과 확인
2. 결과를 표로 변환 (Export to CSV)
3. Notion 데이터베이스에 임포트
```

**또는**:
- Notion 데이터베이스 자체 사용 (Notion 내장 필터)

---

## 📚 관련 문서

- **[[팀_협업_무료_동기화_가이드]]** - Obsidian 팀 협업
- **[[무료_웹사이트_퍼블리싱_가이드]]** - Obsidian 웹 퍼블리싱
- **[[Claude_Code_설치_및_연동]]** - AI 자동화
- **[[핵심_플러그인_TOP10]]** - 필수 플러그인

---

## 🎯 시작 체크리스트

### 초기 설정 (30분)

- [ ] Notion 계정 생성
- [ ] Notion API 키 발급
- [ ] Notion 데이터베이스 생성
- [ ] Obsidian "Share to Notion" 플러그인 설치
- [ ] 플러그인 설정 (API 키, Database ID)
- [ ] 테스트 노트 푸시

### 워크플로우 정하기

- [ ] 역할 분담 결정 (누가 Obsidian, 누가 Notion)
- [ ] 동기화 방향 결정 (단방향 or 양방향)
- [ ] 자동화 필요 여부 (수동 vs 자동)
- [ ] 팀원들에게 사용법 교육

### 선택 사항 (자동화)

- [ ] Zapier/Make 계정 생성
- [ ] 자동화 시나리오 설정
- [ ] 또는 Python 스크립트 실행
- [ ] 백그라운드 실행 설정 (Windows 작업 스케줄러 / macOS Automator)

---

## 💡 Pro Tips

### Tip 1: 템플릿 활용

**Notion 템플릿 버튼 만들기**:
```
Notion 데이터베이스 → "New" 옆 "▼"
→ "New template"
→ "주보 템플릿" 생성
  - 고정된 섹션
  - 기본 레이아웃
```

**Obsidian에서 푸시 → Notion 템플릿 적용**

---

### Tip 2: 링크 단축

**Notion 공유 링크 길이 줄이기**:
```
원본: https://www.notion.so/123abc456def789...
단축: https://bit.ly/주보0119
```

**카카오톡에 짧은 링크 공유!**

---

### Tip 3: 임베드 활용

**Notion 페이지를 교회 홈페이지에**:
```html
<iframe
  src="https://notion.so/주보-123abc"
  width="100%"
  height="800px"
  style="border:none;">
</iframe>
```

---

### Tip 4: 백업 자동화

**Notion 데이터를 주간 백업**:
```
Make 시나리오:
  Schedule: 매주 일요일 밤 12시
  Action: Notion 데이터베이스 Export
  Save to: Google Drive
```

---

### Tip 5: 통계 활용

**Notion 데이터베이스로 통계**:
```
설교 데이터베이스:
  - 올해 설교 수: COUNT
  - 시리즈별 분포: GROUP BY
  - 본문 분포: CHART

→ 연간 보고서 자동 생성!
```

---

**작성**: [[박종영]]
**날짜**: 2025-11-14
**버전**: 1.0

**다음 단계**: 지금 바로 Notion API 키 발급받고 시작하세요! 🚀

---

## 보너스: 실전 예시

### 예시 1: 주보 자동화 완성본

**Obsidian 파일**: `2025-01-19 주보.md`
```markdown
---
type: bulletin
date: 2025-01-19
title: 2025년 1월 19일 주보
tags: [주보, 주일예배, 새해]
notion_sync: true
---

# 2025년 1월 19일 주보

## 🙏 예배 순서

| 순서 | 내용 | 담당 |
|------|------|------|
| 전주 | 묵상 | 반주자 |
| 찬송 | 23장 | 회중 |
| 기도 | 대표 기도 | [[담임목사]] |

## 📖 설교

**제목**: 하나님의 사랑
**본문**: [[요한복음 3장 16절]]
**설교자**: [[담임목사]]

> "하나님이 세상을 이처럼 사랑하사..."

## 📢 광고

### 1. 새가족 환영회
- **일시**: 2월 5일 (주일) 오후 2시
- **장소**: 친교실
- **대상**: 신규 등록 성도

### 2. 겨울 수련회
- **일시**: 2월 12-14일
- **장소**: OO수양관
- **신청**: 교육전도사

## 🎵 다음 주 찬양

- 입례송: 35장
- 찬양: 특송 (청년부)
```

**Notion 결과**:
- 예쁜 테이블로 변환
- 이모지 자동 유지
- 링크 클릭 가능
- 웹에서 깔끔하게 표시

---

### 예시 2: Python 완전 자동화

**폴더 구조**:
```
obsidian-notion-sync/
├── .env
├── sync.py
├── requirements.txt
└── logs/
```

**.env**:
```
NOTION_API_KEY=secret_XXXXXXXXXXXX
NOTION_DATABASE_ID=123abc456def
VAULT_PATH=/Users/macbook/우리교회/
WATCH_FOLDER=100.교회운영/110.주보/
```

**실행**:
```bash
# 설치
pip install -r requirements.txt

# 백그라운드 실행
nohup python sync.py &

# 로그 확인
tail -f logs/sync.log
```

**결과**: PC 켜져 있으면 항상 자동 동기화! ✨

---

이제 Obsidian과 Notion의 장점을 모두 활용하세요! 💪
