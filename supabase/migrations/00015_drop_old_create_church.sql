-- 00014의 8인자 버전과 오버로드 충돌하는 구버전 제거 (PostgREST 모호성 해소)
drop function if exists create_church(text, text);
