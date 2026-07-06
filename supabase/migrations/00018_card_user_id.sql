-- 교적카드에 user_id 포함 (앱 초대 버튼 노출 판단용: 계정 연결 여부)
-- 기존 get_member_card의 jsonb에 user_id 필드 추가
do $$
declare src text;
begin
  select prosrc into src from pg_proc where proname = 'get_member_card';
  if src not like '%''user_id''%' then
    execute replace(
      pg_get_functiondef((select oid from pg_proc where proname='get_member_card')),
      '''id'', m.id,',
      '''id'', m.id, ''user_id'', m.user_id,');
  end if;
end $$;
