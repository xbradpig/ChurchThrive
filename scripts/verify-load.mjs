#!/usr/bin/env node
/** 부하 테스트: 1,200명 교회에서 핵심 RPC 응답 시간 측정 (백로그 P3) */
import { createClient } from "@supabase/supabase-js";
import { execSync } from "node:child_process";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const URL_ = "http://127.0.0.1:54321";
const ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
const SERVICE = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";
const svc = createClient(URL_, SERVICE);
const N = 1200, WEEKS = 8;

// 1) 로드테스트 교회 시드 (SQL 벌크 — 빠름)
execSync(`docker exec -i supabase_db_ChungpaAttend psql -U postgres -d postgres -v ON_ERROR_STOP=1`, { input: `
do $$
declare cid uuid; evid uuid; d date;
begin
  delete from attendances where church_id in (select id from churches where slug='loadtest');
  delete from member_qr_tokens where member_id in (select id from members where church_id in (select id from churches where slug='loadtest'));
  delete from members where church_id in (select id from churches where slug='loadtest');
  delete from events where church_id in (select id from churches where slug='loadtest');
  delete from departments where church_id in (select id from churches where slug='loadtest');
  delete from field_permissions where church_id in (select id from churches where slug='loadtest');
  delete from church_modules where church_id in (select id from churches where slug='loadtest');
  delete from church_roles where church_id in (select id from churches where slug='loadtest');
  delete from active_church where church_id in (select id from churches where slug='loadtest');
  delete from churches where slug='loadtest';

  insert into churches (name, slug) values ('부하테스트교회', 'loadtest') returning id into cid;
  insert into church_modules (church_id, module) values (cid, 'attendance'), (cid, 'verse');
  insert into events (church_id, name, category, schedule_rule, sort_order)
    values (cid, '주일예배', 'worship', '{"dow":[0],"start":"09:00","end":"13:30"}', 1) returning id into evid;
  insert into members (church_id, name, name_suffix, member_type, status)
    select cid, '교인' || g, '', 'registered', 'active' from generate_series(1, ${N}) g;
  -- 8주 × 평균 70% 출석
  for i in 0..${WEEKS - 1} loop
    d := current_date - (extract(dow from current_date)::int) - (i * 7);
    insert into attendances (church_id, member_id, event_id, event_date, method, approved)
      select cid, m.id, evid, d, 'manual', true
      from members m where m.church_id = cid and random() < 0.7;
  end loop;
end $$;` });

const counts = execSync(`docker exec supabase_db_ChungpaAttend psql -U postgres -d postgres -tAc "
  select (select count(*) from members m join churches c on c.id=m.church_id where c.slug='loadtest') || '명 / ' ||
         (select count(*) from attendances a join churches c on c.id=a.church_id where c.slug='loadtest') || '행';"`,
  { encoding: "utf8" }).trim();
console.log("시드:", counts);

// 2) 로드테스트 교회 관리자 계정
const email = "load-admin@verify.local";
const { data: list } = await svc.auth.admin.listUsers();
let uid = list.users.find((u) => u.email === email)?.id;
if (!uid) uid = (await svc.auth.admin.createUser({ email, password: "load-2026!", email_confirm: true })).data.user.id;
const { data: ch } = await svc.from("churches").select("id").eq("slug", "loadtest").single();
await svc.from("church_roles").upsert({ church_id: ch.id, user_id: uid, role: "superadmin" });
await svc.from("active_church").upsert({ user_id: uid, church_id: ch.id });

const c = createClient(URL_, ANON, { auth: { persistSession: false } });
await c.auth.signInWithPassword({ email, password: "load-2026!" });
const { data: ev } = await c.from("events").select("id").eq("name", "주일예배").single();
const today = new Date().toISOString().slice(0, 10);

// 3) 측정 (각 5회, P95 근사 = max of 5)
async function bench(name, fn, budgetMs) {
  const times = [];
  for (let i = 0; i < 5; i++) {
    const t0 = performance.now();
    const { error } = await fn();
    times.push(Math.round(performance.now() - t0));
    if (error) { console.log(name, "ERROR", error.message); return { name, err: error.message }; }
  }
  const max = Math.max(...times), avg = Math.round(times.reduce((a, b) => a + b) / times.length);
  const ok = max <= budgetMs;
  console.log(`${ok ? "✅" : "❌"} ${name}: avg ${avg}ms / max ${max}ms (예산 ${budgetMs}ms)`);
  return { name, avg, max, budgetMs, ok };
}

const rows = [];
rows.push(await bench(`get_check_list (${N}명)`, () => c.rpc("get_check_list", { p_event_id: ev.id, p_event_date: today }), 1500));
rows.push(await bench("absentee_list (2주)", () => c.rpc("absentee_list", { p_weeks: 2 }), 1500));
rows.push(await bench("attendance_trend (8주)", () => c.rpc("attendance_trend", { p_weeks: 8 }), 1000));
rows.push(await bench("members 기본 조회", () => c.from("members").select("id, name").limit(2000), 1500));
const { data: firstMember } = await c.from("members").select("id").limit(1).single();
rows.push(await bench("set_attendance 단건", () => c.rpc("set_attendance", {
  p_member_id: firstMember.id, p_event_id: ev.id, p_event_date: today,
  p_present: true, p_method: "manual",
}), 800));

const allOk = rows.every((r) => r.ok);
const md = `# 부하 테스트 리포트 (${N}명 · 출석 ${WEEKS}주)\n\n- 실행: ${new Date().toISOString()}\n- 시드: ${counts}\n- 결과: **${allOk ? "전 항목 예산 내" : "예산 초과 있음"}**\n\n| 항목 | 평균 | 최대(≈P95) | 예산 | 판정 |\n|------|------|------|------|------|\n${rows.map((r) => `| ${r.name} | ${r.avg}ms | ${r.max}ms | ${r.budgetMs}ms | ${r.ok ? "✅" : "❌"} |`).join("\n")}\n\n> 청파(220명) 회귀에는 영향 없음 — loadtest 교회는 격리 테넌트로 유지(추가 회귀의 다교회 조건 강화)\n`;
fs.writeFileSync(fileURLToPath(new URL("./load-report.md", import.meta.url)), md);
console.log("\n" + md);
process.exit(allOk ? 0 : 1);
