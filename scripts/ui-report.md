# UI 고도화 + P0 검증 리포트

- 실행: 2026-07-06T15:22:28.705Z
- 결과: **15 PASS / 0 FAIL**

| 결과 | 시나리오 | 상세 |
|------|----------|------|
| ✅ | N1 교인(웹): 내공간 v / 출석 h / 교회관리 h / 시스템 h | {"home":"visible","me":"visible","verse":"visible","notice":"visible","visitation":"visible","training":"visible","giving":"visible","bulletin":"visible"} |
| ✅ | N2 출석담당: 출석 v / 교회관리 d(잠금) / 시스템 h | {"home":"visible","me":"visible","verse":"visible","notice":"visible","visitation":"visible","training":"visible","giving":"visible","bulletin":"visible","check":"visible","scan":"visible","invites":"visible","church":"disabled"} |
| ✅ | N3 잠금 항목 탭 → 승급 안내 시트 |  |
| ✅ | N4 교역자: 교회관리 v / 시스템 h (누적: 내공간 유지) | {"home":"visible","me":"visible","verse":"visible","notice":"visible","visitation":"visible","training":"visible","giving":"visible","bulletin":"visible","check":"visible","scan":"visible","invites":"visible","verse-admin":"visible","newcomer":"visible","church":"visible","church-overview":"active","church-members":"visible","church-departments":"visible","church-absentees":"visible","church-permissions":"visible","church-events":"visible","church-store":"visible","church-import":"visible","church-export":"visible","church-settings":"visible"} |
| ✅ | N5 교회관리자+플랫폼: 전부 v + 누적 스택(내 교적 유지) | {"home":"visible","me":"visible","verse":"visible","notice":"visible","visitation":"visible","training":"visible","giving":"visible","bulletin":"visible","check":"visible","scan":"visible","invites":"visible","verse-admin":"visible","newcomer":"visible","church":"visible","church-overview":"active","church-members":"visible","church-departments":"visible","church-absentees":"visible","church-permissions":"visible","church-events":"visible","church-store":"visible","church-import":"visible","church-export":"visible","church-settings":"visible","platform":"visible"} |
| ✅ | N6 모바일 교인: 사이드바 미노출 |  |
| ✅ | W1 교인 홈: 작업/미출석 위젯 없음 | install,verse,my-attendance |
| ✅ | W2 교역자 홈: 작업+미출석 위젯 있음 | install,work-shortcut,absentee,verse,my-attendance |
| ✅ | X1 비보유자 /platform → 차단(리다이렉트) | http://localhost:3120/home |
| ✅ | X2 플랫폼 콘솔: 운영 배너 + 복귀 버튼 + 교회 목록 | 배너=true, 교회=4곳 |
| ✅ | J1 교회 검색·가입 신청 |  |
| ✅ | J2 관리자 승인 → member 역할 + 교적 생성 |  |
| ✅ | J3 승인된 교인: 교적 연결 확인 |  |
| ✅ | A1 모듈 토글 감사 기록 | 135→136 |
| ✅ | A2 교회 생성 한도(계정당 1개) | 교회는 계정당 1개까지 만들 수 있습니다. 추가가 필요하면 플랫폼 운영팀 |
