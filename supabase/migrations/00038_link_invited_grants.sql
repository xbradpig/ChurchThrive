-- 00038: 초대 간편 계정 → 하브루타 ID 연결 경로 권한
-- /api/havruta/link-invited(service_role)가 계정 연결 직후 '계정 연결 대기' 임명을 활성화할 수 있도록 허용.
-- (00037에서 PUBLIC/anon/authenticated EXECUTE는 차단 유지 — 함수 내부의 승인 가드도 그대로)
grant execute on function public.try_activate_role_appointment to service_role;
