-- 플랫폼 감사 기록 조회 (운영자 전용 — 계정 이메일 포함)
create or replace function platform_recent_audit(p_limit int default 100)
returns table (logged_at timestamptz, actor_email text, action text,
               target_table text, detail jsonb)
language sql stable security definer set search_path = public as $$
  select a.at, coalesce(u.email::text, '(시스템)'), a.action, a.target_table, a.after_json
  from audit_log a left join auth.users u on u.id = a.actor_user_id
  where is_platform_admin()
  order by a.at desc
  limit least(coalesce(p_limit, 100), 500)
$$;
grant execute on function platform_recent_audit to authenticated;
