# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Repository Overview

**ChurchThrive [교회성장연구소]** is a comprehensive church knowledge management system built on Obsidian, designed to help Korean churches of all sizes implement systematic operations and transformative leadership development.

- **Primary Language**: Korean (한국어)
- **Format**: Markdown documentation with YAML frontmatter
- **Platform**: Obsidian vault (Personal Knowledge Management)
- **Target Users**: Church pastors, ministry leaders, administrative staff

---

## Core Architecture: 3-Layer System

ChurchThrive implements a **Progressive Disclosure** knowledge management architecture optimized for AI interactions:

### Layer 0: CLAUDE.md (This File)
- **Size**: ~40KB
- **Role**: Core navigation and quick reference
- **Always loaded by AI**: Provides instant understanding of vault structure

### Layer 1: Quick Reference Guides (200KB total)
- Located in numbered folders (310-390, 500)
- Category-specific guides and templates
- Loaded by AI when needed

### Layer 2: Implementation Documents
- Actual church operational documents
- Selectively loaded based on user queries

**Key Principle**: This layered approach enables AI to efficiently navigate potentially massive church documentation (10MB+) by loading only what's needed, keeping context within token limits (~600KB for Claude/ChatGPT).

---

## Folder Structure

```
ChurchThrive/
├── 310.시작_가이드/                    # Getting Started Guides
│   ├── 교회_지식관리_3Layer_완벽_가이드.md
│   └── 빠른_시작_15분_가이드.md
│
├── 320.Obsidian_설치_및_설정/         # Obsidian Setup
│   ├── Obsidian_다운로드_및_설치_가이드.md
│   └── 초기_설정_완벽_가이드.md
│
├── 330.필수_플러그인_가이드/           # Essential Plugins
│   └── 핵심_플러그인_TOP10.md
│
├── 340.AI_연동_가이드/                 # AI Integration
│   ├── Claude_Code_설치_및_연동.md
│   ├── 무료_웹사이트_퍼블리싱_가이드.md
│   ├── 팀_협업_무료_동기화_가이드.md
│   └── Obsidian_Notion_연동_가이드.md
│
├── 350.교회_템플릿_모음/               # Church Templates
│   ├── YAML_프론트매터_표준.md          # ⭐ CRITICAL for document standards
│   └── 회의록_템플릿_모음.md
│
├── 360.카테고리_설계_가이드/           # Category Design
│   ├── 교회_카테고리_구조_설계_가이드.md
│   ├── 소형교회_카테고리_예시.md
│   ├── 중형교회_카테고리_예시.md
│   └── 대형교회_카테고리_예시.md
│
├── 365.에니어그램_활용_가이드/         # Enneagram for Ministry
│   ├── 310.검사_도구/
│   ├── 320.유형별_가이드/
│   ├── 330.사역_매칭_시스템/
│   ├── 340.통계_및_분석/
│   └── 350.템플릿_모음/
│
├── 370.워크플로우_가이드/              # Workflow Guides
│   ├── 목회자_주간_워크플로우.md
│   ├── 목회자_월간_워크플로우.md
│   └── 교회행정_연간_캘린더.md
│
├── 380.고급_활용_가이드/               # Advanced Features
│   ├── Dataview_쿼리_20선.md
│   ├── 대시보드_구축_가이드.md
│   ├── Graph_View_활용법.md
│   ├── 도서_데이터베이스_구축_가이드.md
│   └── 설교_피드백_시스템_구축_가이드.md
│
├── 390.교육_참고_자료/                 # Educational Resources
│
├── 500.15일_집중_부트캠프/             # 15-Day Intensive Bootcamp
│   ├── 510.프로그램_소개/
│   ├── 520.Week1_집중구축/
│   ├── 530.Week2_고급완성/
│   ├── 540.Day15_졸업/
│   ├── 550.코칭_운영/
│   ├── 560.평가_인증/
│   ├── 570.커뮤니티/
│   └── 580.부록/
│
├── ChurchThrive_MVC_Framework.md      # ⭐ Mission, Vision, Core Values
├── ChurchThrive_브랜드_가이드북.md
├── ChurchThrive_팀원_오리엔테이션.md
├── 교회_건강_진단_체크리스트.md
└── README.md
```

---

## YAML Frontmatter Standards

**CRITICAL**: All ChurchThrive documents follow strict YAML frontmatter standards defined in `350.교회_템플릿_모음/YAML_프론트매터_표준.md`.

### Required Fields (All Documents)
```yaml
---
type: note                    # Document type (REQUIRED)
aliases: []                   # Alternative names
author:
  - "[[작성자명]]"            # MUST use "[[wikilink]]" format
date created: 2025-11-14     # YYYY-MM-DD (ISO 8601)
date modified: 2025-11-14    # YYYY-MM-DD
tags: []                     # Array format
---
```

### Document Types
- `bulletin` - Weekly bulletins (주보)
- `sermon` - Sermon notes (설교)
- `meeting` - Meeting minutes (회의록)
- `event` - Event planning (행사)
- `visit` - Pastoral visits (심방)
- `education` - Educational materials (교육)
- `finance` - Financial reports (재정)
- `report` - General reports (보고서)
- `people` - People profiles (성도)
- `organization` - Organizational units (조직)
- `guide` - Documentation/guides (가이드)
- `documentation` - Technical documentation

### Critical Formatting Rules
1. **Author field**: MUST use `"[[Name]]"` format (quotes + wikilinks)
2. **Dates**: ALWAYS use `YYYY-MM-DD` format (ISO 8601)
3. **Tags**: MUST be array format `[tag1, tag2]`
4. **Indentation**: 2 spaces (NOT tabs)
5. **Status values**: Use predefined English lowercase values (draft, published, reviewed, approved, completed)

---

## Key Frameworks and Methodologies

### ChurchThrive MVC Framework
Documented in `ChurchThrive_MVC_Framework.md`:

**Mission**: Diagnose church vital signs and empower churches with systems and leadership to realize God's Kingdom vision

**Vision 2030**:
- Restore vital signs of 500 churches
- Equip 5,000 next-generation leaders
- Position Korean churches as global missions hub

**Core Values** (7):
1. Kingdom First - God's kingdom over individual church growth
2. Excellence - Setting new standards in church consulting
3. Integrity - Truth over flattery
4. Partnership - Walking together, not hired experts
5. Innovation - Embracing AI and technology
6. Empowerment - Teaching to fish, not giving fish
7. Sustainability - 10-year systems, not one-time events

### Two-Pillar Approach
1. **CHEONGPA System**: Systematic church operations (meetings, sermons, member management, finances, knowledge assets)
2. **Bluehill21Leader Program**: Transformative leadership development (6 core competencies: spiritual leadership, servant leadership, vision/mission, communication, team building, conflict management)

### Church Size Categories
- **Small Churches (50-100)**: Simple 9-category structure
- **Medium Churches (100-300)**: 15-20 categories with departmental separation
- **Large Churches (300+)**: 30+ categories with professional systems

---

## Working with ChurchThrive Documents

### When Creating New Documents

1. **Always start with proper YAML frontmatter** - refer to `350.교회_템플릿_모음/YAML_프론트매터_표준.md`
2. **Use appropriate document type** from the predefined list
3. **Follow numbering conventions** for folder organization (e.g., 310, 320, etc.)
4. **Link related documents** using `[[wikilink]]` format
5. **Maintain Korean language** for content (ChurchThrive is Korean-language focused)

### When Editing Existing Documents

1. **Preserve YAML frontmatter** - update `date modified` field
2. **Maintain consistent formatting** with existing content
3. **Respect the 3-Layer architecture** - place content in appropriate layer
4. **Update related documents** if making structural changes

### Common AI Tasks

**Searching for Information**:
- Start with CLAUDE.md (Layer 0)
- Check relevant guide in 310-390 folders (Layer 1)
- Search specific implementation docs (Layer 2)

**Creating Templates**:
- Reference `350.교회_템플릿_모음/YAML_프론트매터_표준.md` for YAML structure
- Follow church size recommendations in `360.카테고리_설계_가이드/`

**Understanding Workflows**:
- Check `370.워크플로우_가이드/` for pastoral and administrative workflows

---

## Key Concepts

### Progressive Disclosure
Information is hierarchically organized so users (and AI) only see what they need:
- Layer 0: Navigation and overview (this file)
- Layer 1: Category guides and templates
- Layer 2: Actual operational documents

### AI-First Design
The system is designed for seamless AI collaboration:
- Structured YAML enables AI to understand document metadata
- Consistent formatting allows AI to generate accurate content
- Linked documents create context graph for AI navigation

### Church-Specific Terminology
- **주보** (Bulletin): Weekly service bulletin
- **설교** (Sermon): Sermon notes and preparation
- **회의록** (Meeting Minutes): Official meeting records
- **심방** (Pastoral Visit): Home/hospital visits to church members
- **새가족** (New Family): New church members
- **교인** (Church Member): Registered members
- **구역** (District/Cell): Small group divisions
- **사역** (Ministry): Ministry/service activities

---

## Git Workflow

This repository uses git for version control:

```bash
# Check status
git status

# View recent commits
git log --oneline -10

# Current branch
git branch
```

**Main branch**: `main` (use this for pull requests)

---

## File Operations

### Creating Documents
- Use appropriate folder based on content type (310-500 series)
- Follow YAML frontmatter standards strictly
- Use Korean for document content
- Include proper metadata for AI and human searchability

### Organizing Content
- Numbered folders (310, 320, etc.) maintain hierarchy
- Sub-numbering (111, 112, etc.) for nested categories
- Consistent naming: Korean descriptive titles

### Linking Documents
- Use `[[Document Name]]` for internal links
- Reference related guides for context
- Build knowledge graph through connections

---

## Technical Considerations

### File Encoding
- UTF-8 encoding for Korean characters
- Markdown format (.md extension)
- YAML frontmatter at document start

### Obsidian-Specific Features
- Supports Obsidian plugins (Calendar, Templater, Dataview, QuickAdd)
- Graph view for visualizing document relationships
- Tags and backlinks for navigation
- Daily notes and templates

### Cloud Sync
- Designed to work with OneDrive/Google Drive
- Mobile-friendly (Obsidian mobile app)
- Team collaboration support

---

## Reference Documents

For comprehensive understanding, refer to these key documents:

1. **`ChurchThrive_MVC_Framework.md`** - Mission, vision, core values, strategic framework
2. **`310.시작_가이드/교회_지식관리_3Layer_완벽_가이드.md`** - Complete 3-Layer system explanation
3. **`310.시작_가이드/빠른_시작_15분_가이드.md`** - Quick start for new users
4. **`350.교회_템플릿_모음/YAML_프론트매터_표준.md`** - YAML standards (CRITICAL)
5. **`360.카테고리_설계_가이드/교회_카테고리_구조_설계_가이드.md`** - Category design principles

---

## Version Information

- **Created**: 2025-11-25
- **Last Updated**: 2025-11-25
- **ChurchThrive Version**: 1.0
- **Primary Author**: [[박종영]]

---

## Notes for AI Assistants

1. **Language**: Default to Korean for all content creation unless explicitly requested otherwise
2. **YAML Compliance**: Strictly follow the YAML standards - this is critical for system functionality
3. **Progressive Loading**: Start with this file, then load relevant Layer 1 guides, then specific Layer 2 documents
4. **Context Awareness**: ChurchThrive serves Korean churches - understand cultural and religious context
5. **Wikilink Format**: When referencing people or documents, always use `[[Name]]` format
6. **Date Format**: Always use ISO 8601 (YYYY-MM-DD) for dates in YAML
7. **Document Types**: Use predefined document types - don't create new ones without good reason
8. **Respect Structure**: The numbered folder system (310, 320, etc.) is intentional - maintain it
