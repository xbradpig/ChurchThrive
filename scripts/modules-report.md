# Phase 2 모듈 검증 리포트

- 실행: 2026-07-06T04:04:31.513Z
- 결과: **15 PASS / 0 FAIL**

| 결과 | 시나리오 | 상세 |
|------|----------|------|
| ✅ | M0 스토어에서 6모듈 설치 | attendance,verse,notice,visitation,newcomer,training,giving,bulletin |
| ✅ | M1 공지 발행→교인 열람 |  |
| ✅ | M1b 교인의 공지 발행 차단 |  |
| ✅ | M2 심방 요청→배정→완료 기록 |  |
| ✅ | M2b 교인의 심방 기록 수정 차단 | silent-block |
| ✅ | M3 새가족 등록→정착 3단계 기록 |  |
| ✅ | M4 훈련 개설→수강→수료 |  |
| ✅ | M5 헌금 기록→본인 조회 |  |
| ✅ | M5b 재정 분리: 교역자(grant 없음) 열람 0건 | 0건 |
| ✅ | M5c 재정 분리: 교역자 기록도 차단 | new row violates row-level security poli |
| ✅ | M5d giving 담당 임명 후 열람 가능 |  |
| ✅ | M6 주보: 미발행 비노출→발행 후 열람 | before=0, after=1 |
| ✅ | M7 CSV 임포트: 신규 1·중복 skip | {"skipped":2,"inserted":1} |
| ✅ | M7b 재실행 idempotent |  |
| ✅ | M8 해지: 접근 0건·데이터 보존 | 접근=0, 보존=1 |
