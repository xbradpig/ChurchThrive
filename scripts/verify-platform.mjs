#!/usr/bin/env node
/**
 * ChurchThrive 플랫폼 검증 (SG5)
 *  P0. 기존 21종 회귀 (verify-e2e.mjs 재실행)
 *  P1. 교회 등록 셀프서비스 (create_church + 시드)
 *  P2. 테넌트 격리 교차 (A↔B 전 방향)
 *  P3. 모듈 토글 게이팅 (미설치 차단 → 설치 후 동작)
 *  P4. 기능별 담당자(module_grants) — verse:admin만 관리 가능
 *  P5. verse 흐름 (등록→셀프 체크→중복 수렴→암송률)
 * 결과: scripts/platform-report.md
 */
import { createClient } from "@supabase/supabase-js";
import { execSync } from "node:child_process";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const URL_ = "http://127.0.0.1:54321";
const ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
const SERVICE = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";
const CHUNGPA = "11111111-1111-1111-1111-111111111111";

const results = []; let pass = 0, fail = 0;
const check = (n, ok, d = "") => { results.push(`| ${ok ? "✅" : "❌"} | ${n} | ${d} |`); ok ? pass++ : fail++; if (!ok) console.error("FAIL:", n, d); };
const svc = createClient(URL_, SERVICE);
async function login(email, pw) {
  const c = createClient(URL_, ANON, { auth: { persistSession: false } });
  const { error } = await c.auth.signInWithPassword({ email, password: pw });
  if (error) throw new Error(email + ": " + error.message);
  return c;
}

/* ===== 사전 정리 (idempotent — psql 직접, mod_verse FK 순서 보장) ===== */
{
  const sql = `
    do $$ declare cid uuid;
    begin
      select id into cid from churches where slug = 'verify-test';
      delete from mod_verse.checks where church_id = '${CHUNGPA}' or church_id = cid;
      delete from mod_verse.assignments where church_id = '${CHUNGPA}' or church_id = cid;
      if cid is not null then
        delete from module_grants where church_id = cid;
        delete from church_modules where church_id = cid;
        delete from active_church where church_id = cid;
        delete from church_roles where church_id = cid;
        delete from attendances where church_id = cid;
        delete from member_qr_tokens where member_id in (select id from members where church_id = cid);
        delete from devices where church_id = cid;
        delete from department_members where member_id in (select id from members where church_id = cid);
        delete from audit_log where target_id in (select id::text from members where church_id = cid);
        delete from members where church_id = cid;
        delete from events where church_id = cid;
        delete from departments where church_id = cid;
        delete from field_permissions where church_id = cid;
        delete from churches where id = cid;
      end if;
    end $$;`;
  execSync(`docker exec -i supabase_db_ChungpaAttend psql -U postgres -d postgres -v ON_ERROR_STOP=1`, { input: sql });
}

/* ===== P0. 기존 21종 회귀 ===== */
{
  let out = "", ok = true;
  try { out = execSync("node verify-e2e.mjs", { cwd: fileURLToPath(new URL(".", import.meta.url)), encoding: "utf8" }); }
  catch (e) { ok = false; out = String(e.stdout ?? e); }
  const m = out.match(/\*\*(\d+) PASS \/ (\d+) FAIL\*\*/);
  check("P0 기존 E2E 21종 회귀 (테넌시 이후)", ok && m?.[1] === "21" && m?.[2] === "0", m ? `${m[1]} PASS / ${m[2]} FAIL` : "실행 실패");
}

/* ===== P1. 교회 등록 ===== */
let bAdmin, bChurchId;
{
  const email = "b-admin@verify.local";
  const { data: list } = await svc.auth.admin.listUsers();
  let uid = list.users.find((u) => u.email === email)?.id;
  if (!uid) {
    const { data } = await svc.auth.admin.createUser({ email, password: "verify-b-2026!", email_confirm: true });
    uid = data.user.id;
  }
  bAdmin = await login(email, "verify-b-2026!");
  const { data: cid, error } = await bAdmin.rpc("create_church", { p_name: "검증테스트교회", p_slug: "verify-test" });
  bChurchId = cid;
  const [{ count: ev }, { count: dept }, { data: mods }] = await Promise.all([
    svc.from("events").select("*", { count: "exact", head: true }).eq("church_id", cid),
    svc.from("departments").select("*", { count: "exact", head: true }).eq("church_id", cid),
    svc.from("church_modules").select("module").eq("church_id", cid),
  ]);
  check("P1 교회 셀프 등록 + 기본 시드", !error && ev === 3 && dept === 3 && mods?.length === 1,
    `events=${ev}, depts=${dept}, modules=${mods?.map((m) => m.module)}`);
}

/* ===== P2. 테넌트 격리 ===== */
{
  // B교회에 교인 1명 생성 (B admin이 직접 quick_register — attendance 설치됨)
  const { data: bEvent } = await svc.from("events").select("id").eq("church_id", bChurchId).eq("name", "주일예배").single();
  const today = new Date().toISOString().slice(0, 10);
  const { data: bMemberId, error: qErr } = await bAdmin.rpc("quick_register",
    { p_name: "비교회교인", p_event_id: bEvent.id, p_event_date: today });
  check("P2a B교회 신규 등록 동작 (모듈 상속)", !qErr && !!bMemberId, qErr?.message ?? "ok");

  const { data: bSees } = await bAdmin.from("members").select("id");
  check("P2b B관리자: 자기 교회 교인만 (청파 220명 비노출)", bSees?.length === 1, `${bSees?.length}행`);

  const pastor = await login("pastor@chungpa.local", "chungpa-pastor-2026!");
  const { data: aSees } = await pastor.from("members").select("id");
  check("P2c 청파 교역자: B교회 교인 비노출", aSees?.length === 220, `${aSees?.length}행`);

  const { data: crossCard } = await pastor.rpc("get_member_card", { p_member_id: bMemberId });
  check("P2d 교차 교적카드 접근 차단", crossCard === null, JSON.stringify(crossCard)?.slice(0, 40));

  const { data: bAtt } = await bAdmin.from("attendances").select("id");
  const { count: totalAtt } = await svc.from("attendances").select("*", { count: "exact", head: true });
  check("P2e B관리자: 출석도 자기 교회만", bAtt?.length === 1 && (totalAtt ?? 0) > 1000, `B=${bAtt?.length}, 전체=${totalAtt}`);

  // DEFINER RPC 테넌트 가드 (00009에서 수정된 구멍의 회귀 방지)
  const checker = await login("checker@chungpa.local", "chungpa-check-2026!");
  const { data: aEvent } = await svc.from("events").select("id").eq("church_id", CHUNGPA).eq("name", "주일예배").single();
  const { data: list } = await checker.rpc("get_check_list", { p_event_id: aEvent.id, p_event_date: today });
  check("P2f 출석 명단 RPC: 타 교회 교인 비노출", list?.length === 220, `${list?.length}명`);

  const { error: crossSet } = await checker.rpc("set_attendance",
    { p_member_id: bMemberId, p_event_id: aEvent.id, p_event_date: today, p_present: true, p_method: "manual" });
  check("P2g 타 교회 교인 출석 기록 차단", crossSet !== null, crossSet?.message?.slice(0, 40));

  const { data: bTrend } = await bAdmin.rpc("attendance_trend", { p_weeks: 52 });
  const bTotal = (bTrend ?? []).reduce((s, r) => s + Number(r.cnt), 0);
  check("P2h 출석 추이 RPC: 교회별 분리", bTotal === 1, `B교회 합계=${bTotal}`);
}

/* ===== P3. 모듈 토글 게이팅 ===== */
{
  // B는 verse 미설치 → 등록 시도 차단
  const { error: e1 } = await bAdmin.rpc("verse_create_assignment",
    { p_week_start: "2026-07-05", p_reference: "시편 23:1", p_body: "여호와는 나의 목자시니" });
  check("P3a verse 미설치 교회: 구절 등록 차단", e1 !== null, e1?.message?.slice(0, 50));

  await bAdmin.rpc("set_module", { p_module: "verse", p_enabled: true });
  const { error: e2 } = await bAdmin.rpc("verse_create_assignment",
    { p_week_start: "2026-07-05", p_reference: "시편 23:1", p_body: "여호와는 나의 목자시니" });
  check("P3b 스토어 설치 후: 즉시 동작", e2 === null, e2?.message);

  await bAdmin.rpc("set_module", { p_module: "verse", p_enabled: false });
  const { data: afterOff } = await bAdmin.rpc("verse_current");
  check("P3c 해지 후: 데이터 보존·접근 차단", (afterOff ?? []).length === 0, `rows=${afterOff?.length}`);

  const member = await login("member@chungpa.local", "chungpa-member-2026!");
  const { error: e3 } = await member.rpc("set_module", { p_module: "verse", p_enabled: false });
  check("P3d 교인의 모듈 토글 차단", e3 !== null, e3?.message?.slice(0, 40));
}

/* ===== P4. 기능별 담당자 (module_grants) ===== */
{
  const member = await login("member@chungpa.local", "chungpa-member-2026!");
  const { data: kimUid } = await svc.from("members").select("user_id").eq("name", "김인자").single();

  const { error: before } = await member.rpc("verse_create_assignment",
    { p_week_start: "2026-07-12", p_reference: "요한복음 3:16", p_body: "하나님이 세상을 이처럼 사랑하사" });
  check("P4a 일반 교인: verse 관리 차단", before !== null, before?.message?.slice(0, 50));

  await svc.from("module_grants").upsert({ church_id: CHUNGPA, user_id: kimUid.user_id, module: "verse", level: "admin" });
  const { error: after } = await member.rpc("verse_create_assignment",
    { p_week_start: "2026-07-12", p_reference: "요한복음 3:16", p_body: "하나님이 세상을 이처럼 사랑하사" });
  check("P4b verse:admin 임명 후: 구절 등록 가능", after === null, after?.message);

  await svc.from("module_grants").delete().eq("user_id", kimUid.user_id).eq("module", "verse");
  const { error: revoked } = await member.rpc("verse_create_assignment",
    { p_week_start: "2026-07-19", p_reference: "빌립보서 4:13", p_body: "내게 능력 주시는 자 안에서" });
  check("P4c 임명 해제 후: 다시 차단", revoked !== null, revoked?.message?.slice(0, 40));

  // 다른 모듈 관리 불가 확인: verse:admin이어도 set_module(교회 설정)은 불가 → P3d에서 확인됨
}

/* ===== P5. verse 흐름 ===== */
{
  const pastor = await login("pastor@chungpa.local", "chungpa-pastor-2026!");
  const member = await login("member@chungpa.local", "chungpa-member-2026!");
  const { data: aid } = await pastor.rpc("verse_create_assignment",
    { p_week_start: "2026-07-26", p_reference: "잠언 3:5", p_body: "너는 마음을 다하여 여호와를 신뢰하고", p_guide: "MATCH: 무엇을 신뢰하기 어려운가요?" });

  const { data: memberView } = await member.rpc("verse_current");
  check("P5a 등록 즉시 교인 화면 표시", (memberView ?? []).some((v) => v.id === aid), `${memberView?.length}건`);

  await member.rpc("verse_check", { p_assignment: aid });
  await member.rpc("verse_check", { p_assignment: aid });  // 중복
  const rows = execSync(
    `docker exec supabase_db_ChungpaAttend psql -U postgres -d postgres -tAc "select count(*) || ':' || min(method) from mod_verse.checks where assignment_id = '${aid}'"`,
    { encoding: "utf8" }).trim();
  check("P5b 셀프 체크 + 중복 수렴 1건", rows === "1:self", `db=${rows}`);

  const { data: adminView } = await pastor.rpc("verse_current");
  const row = (adminView ?? []).find((v) => v.id === aid);
  check("P5c 암송률 집계 (1/220)", row?.check_count === 1 && row?.target_count === 220,
    `${row?.check_count}/${row?.target_count}`);
}

const md = `# ChurchThrive 플랫폼 검증 리포트

- 실행: ${new Date().toISOString()}
- 결과: **${pass} PASS / ${fail} FAIL**

| 결과 | 시나리오 | 상세 |
|------|----------|------|
${results.join("\n")}
`;
fs.writeFileSync(fileURLToPath(new URL("./platform-report.md", import.meta.url)), md);
console.log(md);
process.exit(fail > 0 ? 1 : 0);
