#!/usr/bin/env node
/** Phase 2 모듈 6종 + CSV 임포트 검증 — 기능 + 프라이버시(재정 분리 등) */
import { createClient } from "@supabase/supabase-js";
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

const admin = await login("admin@chungpa.local", "chungpa-admin-2026!");
const pastor = await login("pastor@chungpa.local", "chungpa-pastor-2026!");
const member = await login("member@chungpa.local", "chungpa-member-2026!");
const { data: kimId } = await member.rpc("my_member_id");

// 사전 정리 (idempotent)
for (const [sch, tbl] of [["mod_notice","notices"],["mod_visitation","visits"],["mod_training","enrollments"],["mod_training","courses"],["mod_giving","records"],["mod_bulletin","issues"],["mod_newcomer","progress"]]) {
  await svc.schema(sch).from(tbl).delete().eq("church_id", CHUNGPA);
}
async function purgeMember(name) {
  const { data: ms } = await svc.from("members").select("id").eq("church_id", CHUNGPA).eq("name", name);
  for (const m of ms ?? []) {
    await svc.from("member_qr_tokens").delete().eq("member_id", m.id);
    await svc.from("attendances").delete().eq("member_id", m.id);
    await svc.from("audit_log").delete().eq("target_id", m.id);
    await svc.from("members").delete().eq("id", m.id);
  }
}
await purgeMember("임포트테스트");

/* M0. 스토어 설치 (전 모듈) */
for (const m of ["notice","visitation","newcomer","training","giving","bulletin"]) {
  await admin.rpc("set_module", { p_module: m, p_enabled: true });
}
const { data: mods } = await admin.from("church_modules").select("module").eq("enabled", true);
check("M0 스토어에서 6모듈 설치", mods.length >= 8, mods.map((m) => m.module).join(","));

/* M1. 공지: 교역자 발행 → 교인 열람 */
{
  const { error: e1 } = await pastor.schema("mod_notice").from("notices")
    .insert({ church_id: CHUNGPA, title: "여름 수련회 안내", body: "8월 첫 주" });
  const { data: seen } = await member.schema("mod_notice").from("notices").select("title");
  check("M1 공지 발행→교인 열람", !e1 && seen?.some((n) => n.title === "여름 수련회 안내"), e1?.message);
  const { error: e2 } = await member.schema("mod_notice").from("notices")
    .insert({ church_id: CHUNGPA, title: "x", body: "y" });
  check("M1b 교인의 공지 발행 차단", e2 !== null);
}

/* M2. 심방: 교인 요청 → 교역자 배정·완료 */
{
  const { error: e1 } = await member.schema("mod_visitation").from("visits")
    .insert({ church_id: CHUNGPA, member_id: kimId });
  const { data: q } = await pastor.schema("mod_visitation").from("visits").select("id, status").eq("member_id", kimId);
  const vid = q?.[0]?.id;
  await pastor.schema("mod_visitation").from("visits").update({ status: "assigned" }).eq("id", vid);
  const { error: e3 } = await pastor.schema("mod_visitation").from("visits")
    .update({ status: "done", note: "기도 제목: 건강", visit_date: "2026-07-06" }).eq("id", vid);
  check("M2 심방 요청→배정→완료 기록", !e1 && !!vid && !e3, e1?.message ?? e3?.message);
  const { error: e4 } = await member.schema("mod_visitation").from("visits")
    .update({ status: "done" }).eq("id", vid);
  const { data: still } = await svc.schema("mod_visitation").from("visits").select("note").eq("id", vid);
  check("M2b 교인의 심방 기록 수정 차단", still?.[0]?.note === "기도 제목: 건강", e4?.message ?? "silent-block");
}

/* M3. 새가족: 신규 등록 → 단계 추적 */
{
  const { data: ev } = await svc.from("events").select("id").eq("church_id", CHUNGPA).eq("name", "주일예배").single();
  const today = new Date().toISOString().slice(0, 10);
  const checker = await login("checker@chungpa.local", "chungpa-check-2026!");
  const { data: newId } = await checker.rpc("quick_register", { p_name: "정착테스트", p_event_id: ev.id, p_event_date: today });
  const { error: e1 } = await pastor.schema("mod_newcomer").from("progress")
    .upsert({ church_id: CHUNGPA, member_id: newId, stage: 3 }, { onConflict: "church_id,member_id" });
  const { data: st } = await pastor.schema("mod_newcomer").from("progress").select("stage").eq("member_id", newId);
  check("M3 새가족 등록→정착 3단계 기록", !e1 && st?.[0]?.stage === 3, e1?.message);
  // 정리
  await svc.schema("mod_newcomer").from("progress").delete().eq("member_id", newId);
  await svc.from("attendances").delete().eq("member_id", newId);
  await svc.from("member_qr_tokens").delete().eq("member_id", newId);
  await svc.from("audit_log").delete().eq("target_id", newId);
  await svc.from("members").delete().eq("id", newId);
}

/* M4. 훈련: 개설 → 수강 → 수료 */
{
  const { data: course, error: e1 } = await admin.schema("mod_training").from("courses")
    .insert({ church_id: CHUNGPA, name: "제자훈련 1기" }).select("id").single();
  const { error: e2 } = await member.schema("mod_training").from("enrollments")
    .insert({ course_id: course.id, member_id: kimId, church_id: CHUNGPA });
  const { error: e3 } = await pastor.schema("mod_training").from("enrollments")
    .update({ status: "completed" }).eq("course_id", course.id).eq("member_id", kimId);
  const { data: done } = await member.schema("mod_training").from("enrollments")
    .select("status").eq("course_id", course.id);
  check("M4 훈련 개설→수강→수료", !e1 && !e2 && !e3 && done?.[0]?.status === "completed",
    e1?.message ?? e2?.message ?? e3?.message);
}

/* M5. 헌금: 기록 + 재정 분리 (교역자도 grant 없으면 비열람) */
{
  const { error: e1 } = await admin.schema("mod_giving").from("records")
    .insert({ church_id: CHUNGPA, member_id: kimId, fund: "십일조", amount: 100000 });
  const { data: mine } = await member.schema("mod_giving").from("records").select("amount");
  check("M5 헌금 기록→본인 조회", !e1 && mine?.length === 1 && mine[0].amount === 100000, e1?.message);

  const { data: pastorSees } = await pastor.schema("mod_giving").from("records").select("id");
  check("M5b 재정 분리: 교역자(grant 없음) 열람 0건", (pastorSees ?? []).length === 0, `${pastorSees?.length}건`);

  const { error: e2 } = await pastor.schema("mod_giving").from("records")
    .insert({ church_id: CHUNGPA, member_id: kimId, fund: "감사헌금", amount: 5 });
  check("M5c 재정 분리: 교역자 기록도 차단", e2 !== null, e2?.message?.slice(0, 40));

  const { data: kimUid } = await svc.from("members").select("user_id").eq("id", kimId).single();
  await svc.from("module_grants").upsert({ church_id: CHUNGPA, user_id: (await pastor.auth.getUser()).data.user.id, module: "giving", level: "manager" });
  const { data: afterGrant } = await pastor.schema("mod_giving").from("records").select("id");
  check("M5d giving 담당 임명 후 열람 가능", (afterGrant ?? []).length === 1);
  await svc.from("module_grants").delete().eq("module", "giving");
  void kimUid;
}

/* M6. 주보: 발행 전 비노출 → 발행 후 교인 열람 */
{
  const { data: cid2 } = await admin.rpc("my_church_id");
  await admin.schema("mod_bulletin").from("issues")
    .insert({ church_id: cid2, week_start: "2026-07-05", title: "7월 첫 주", content_md: "예배 순서…", published: false });
  const { data: hidden } = await member.schema("mod_bulletin").from("issues").select("id");
  await admin.schema("mod_bulletin").from("issues").update({ published: true }).eq("week_start", "2026-07-05").eq("church_id", cid2);
  const { data: shown } = await member.schema("mod_bulletin").from("issues").select("title");
  check("M6 주보: 미발행 비노출→발행 후 열람", (hidden ?? []).length === 0 && shown?.[0]?.title === "7월 첫 주",
    `before=${hidden?.length}, after=${shown?.length}`);
}

/* M7. CSV 임포트 (중복 건너뜀 포함) */
{
  const { data: r1 } = await admin.rpc("import_members", {
    p_rows: [{ name: "임포트테스트", phone: "010-9999-0001", birthday: "1960-01-01", position: "집사" },
             { name: "김인자" },   // 기존과 중복 → skip
             { name: "" }],
  });
  check("M7 CSV 임포트: 신규 1·중복 skip", r1?.inserted === 1 && r1?.skipped === 2, JSON.stringify(r1));
  const { data: again } = await admin.rpc("import_members", { p_rows: [{ name: "임포트테스트" }] });
  check("M7b 재실행 idempotent", again?.inserted === 0 && again?.skipped === 1);
}

/* M8. 게이팅: 해지 시 접근 차단·데이터 보존 */
{
  await admin.rpc("set_module", { p_module: "giving", p_enabled: false });
  const { data: off } = await member.schema("mod_giving").from("records").select("id");
  const { count: kept } = await svc.schema("mod_giving").from("records").select("*", { count: "exact", head: true });
  check("M8 해지: 접근 0건·데이터 보존", (off ?? []).length === 0 && (kept ?? 0) >= 1, `접근=${off?.length}, 보존=${kept}`);
  await admin.rpc("set_module", { p_module: "giving", p_enabled: true });
}

await purgeMember("임포트테스트");   // 종료 정리 — 타 스위트 오염 방지

const md = `# Phase 2 모듈 검증 리포트\n\n- 실행: ${new Date().toISOString()}\n- 결과: **${pass} PASS / ${fail} FAIL**\n\n| 결과 | 시나리오 | 상세 |\n|------|----------|------|\n${results.join("\n")}\n`;
fs.writeFileSync(fileURLToPath(new URL("./modules-report.md", import.meta.url)), md);
console.log(md);
process.exit(fail > 0 ? 1 : 0);
