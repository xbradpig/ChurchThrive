# ChungpaAttend — 청파중앙교회 출석·교적 통합 시스템

어르신이 많은 교회를 위해 "아무것도 하지 않아도" 출석이 집계되는 시스템.
기획: `docs/Task_Work/2026-07-05_chungpa-attendance-system/` (R1~R13)

## 구성

```
ChungpaAttend/
├── web/              Next.js 15 PWA (스토어 없이 홈 화면 설치)
├── supabase/         DB 마이그레이션 5개 (스키마·RLS·RPC·시드·권한)
├── presence-agent/   라즈베리파이 자동 감지 (WiFi arp-scan + BLE 비콘)
└── scripts/          데이터 이관 / 초기 계정 / E2E 검증 / QR 카드 / 알림 발송
```

## 역할과 화면

| 역할 | 로그인 후 | 기능 |
|------|-----------|------|
| checker 출석 담당자 | `/check` | ㄱ~ㅎ 카드 체크, 신규 이름 등록, QR 스캔(/scan) |
| dept_leader 부서 담당자 | `/check` | 담당 부서 스코프 + 대시보드(미출석) |
| pastor / superadmin | `/admin` | 통계, 미출석 알림, 권한 매트릭스, 승인 큐, 이벤트, 내보내기 |
| member 교인 | `/me` | 교적카드(수정 가능·삭제 불가), 내 QR, 동의 관리, 셀프 인증 |

## 로컬 실행

```bash
# 1) DB (Docker 필요)
npx supabase start          # 프로젝트 루트에서 — 마이그레이션 자동 적용

# 2) 데이터 이관 + 초기 계정 (1회)
cd scripts && npm i && node migrate-members.mjs && node bootstrap-users.mjs

# 3) 웹
cd ../web && npm i && npm run build && npx next start -p 3120
# → http://localhost:3120  (계정: bootstrap-users.mjs 참조, 로그인 후 비밀번호 변경)

# 4) 검증
cd ../scripts && node verify-e2e.mjs    # 21개 시나리오 (RLS 2중 게이트 포함)
```

## 클라우드 배포 (교회 실사용)

1. **Supabase**: supabase.com에서 무료 프로젝트 생성 → `npx supabase link --project-ref <ref>` → `npx supabase db push` → `scripts/`를 새 URL/키로 재실행
2. **웹**: Cloudflare Pages(무료)에 `web/` 배포, 환경변수 3개 설정
3. **사진**: 로컬은 `web/public/photos/`, 클라우드는 Supabase Storage 업로드로 전환
4. **라즈베리파이**: `presence-agent/README.md` (약 15분)
5. **알림 cron**: `send-digest.mjs`를 매시 실행 (Pi crontab 권장)

## 보안 원칙 (검증 완료)

- 교적 DELETE 불가 — DB 정책 자체가 없음 (42501 거부 확인)
- 민감 항목은 **관리자 승인 ∧ 본인 동의** 시에만 서버가 반환 (4조합 매트릭스 테스트 통과)
- 기기 MAC/비콘ID는 SHA-256 해시만 저장, 미등록 기기는 아무것도 기록하지 않음
- 모든 교적 변경 audit_log 기록
