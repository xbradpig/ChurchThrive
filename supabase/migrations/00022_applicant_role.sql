-- 신청자 역할: 교회 등록 신청 시 본인 직분 선택 (심사 참고 + 기존 교회 연결 시 부여 역할 결정)
alter table church_applications
  add column if not exists applicant_role text not null default '담당 관리자'
  check (applicant_role in ('담임목사','교역자','담당 관리자','부서 담당자'));
