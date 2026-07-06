#!/usr/bin/env node
/**
 * UI 고도화 + P0 검증 (ui-upgrade U6)
 *  N. 사이드 네비 노출 매트릭스 (역할 × 항목 → visible/disabled/hidden)
 *  W. 역할별 위젯 홈 구성 상이
 *  X. /platform 별도 공간 + 격리
 *  J. 가입 신청 → 승인 플로우
 *  A. 감사 트리거 / 교회 생성 한도
 * 결과: scripts/ui-report.md
 */
import { createClient } from "@supabase/supabase-js";
import puppeteer from "puppeteer-core";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const URL_ = "http://127.0.0.1:54321";
const WEB = "http://localhost:3120";
const ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
const SERVICE = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";
const CHUNGPA = "11111111-1111-1111-1111-111111111111";

const results = []; let pass = 0, fail = 0;
const check = (n, ok, d = "") => { results.push(`| ${ok ? "✅" : "❌"} | ${n} | ${d} |`); ok ? pass++ : fail++; if (!ok) console.error("FAIL:", n, d); };
const svc = createClient(URL_, SERVICE);

const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new",
});

async function loginPage(email, pw, viewport = { width: 1280, height: 900 }) {
  const ctx = await browser.createBrowserContext();
  const pg = await ctx.newPage();
  await pg.setViewport(viewport);
  await pg.goto(WEB + "/login", { waitUntil: "networkidle0" });
  await pg.type("input[type=email]", email);
  await pg.type("input[type=password]", pw);
  await Promise.all([pg.click("form button"), pg.waitForNavigation({ waitUntil: "networkidle0" }).catch(() => {})]);
  await new Promise((r) => setTimeout(r, 1500));
  return pg;
}

async function navStates(pg) {
  await pg.waitForSelector("[data-nav]", { timeout: 10000 }).catch(() => {});
  return pg.evaluate(() =>
    Object.fromEntries([...document.querySelectorAll("[data-nav]")]
      .map((el) => [el.getAttribute("data-nav"), el.getAttribute("data-nav-state")])));
}

/* ===== N. 노출 매트릭스 (detail_goal 기대표) ===== */
{
  const pg = await loginPage("member@chungpa.local", "chungpa-member-2026!");
  await pg.goto(WEB + "/home", { waitUntil: "networkidle0" });
  // 웹 기준: 데스크톱 교인 = 사이드바 노출 매트릭스 (누적 원칙)
  const n = await navStates(pg);
  check("N1 교인(웹): 내공간 v / 출석 h / 교회관리 h / 시스템 h",
    n.home === "visible" && n.me === "visible" && !n.check && !n.church && !n.platform,
    JSON.stringify(n));
  await pg.browserContext().close();
}
{
  const pg = await loginPage("checker@chungpa.local", "chungpa-check-2026!");
  await pg.goto(WEB + "/check", { waitUntil: "networkidle0" });
  const n = await navStates(pg);
  check("N2 출석담당: 출석 v / 교회관리 d(잠금) / 시스템 h",
    n.check === "visible" && n.scan === "visible" && n.church === "disabled" && !n.platform, JSON.stringify(n));
  // disabled 탭 → 안내 시트
  await pg.click('[data-nav="church"]');
  await new Promise((r) => setTimeout(r, 500));
  const sheet = await pg.evaluate(() => document.body.innerText.includes("권한이 필요합니다"));
  check("N3 잠금 항목 탭 → 승급 안내 시트", sheet);
  await pg.browserContext().close();
}
{
  const pg = await loginPage("pastor@chungpa.local", "chungpa-pastor-2026!");
  await pg.goto(WEB + "/church", { waitUntil: "networkidle0" });
  const n = await navStates(pg);
  check("N4 교역자: 교회관리 v / 시스템 h (누적: 내공간 유지)",
    n.church === "visible" && !n.platform && n.me === "visible", JSON.stringify(n));
  await pg.browserContext().close();
}
{
  const pg = await loginPage("admin@chungpa.local", "chungpa-admin-2026!");
  await pg.goto(WEB + "/church", { waitUntil: "networkidle0" });
  const n = await navStates(pg);
  check("N5 교회관리자+플랫폼: 전부 v + 누적 스택(내 교적 유지)",
    n.church === "visible" && n.platform === "visible" && n.me === "visible" && n.check === "visible",
    JSON.stringify(n));
  await pg.browserContext().close();
}
{ // 모바일 시니어: 사이드바 DOM 자체가 숨김 (md:flex)
  const pg = await loginPage("member@chungpa.local", "chungpa-member-2026!", { width: 390, height: 800 });
  await pg.goto(WEB + "/home", { waitUntil: "networkidle0" });
  const sidebarVisible = await pg.evaluate(() => {
    const el = document.querySelector('[data-testid="sidebar"]');
    return el ? getComputedStyle(el).display !== "none" : false;
  });
  check("N6 모바일 교인: 사이드바 미노출", sidebarVisible === false);
  await pg.browserContext().close();
}

/* ===== W. 위젯 홈 상이 ===== */
{
  const pgM = await loginPage("member@chungpa.local", "chungpa-member-2026!");
  await pgM.goto(WEB + "/home", { waitUntil: "networkidle0" });
  const wM = await pgM.evaluate(() => [...document.querySelectorAll("[data-widget]")].map((e) => e.getAttribute("data-widget")));
  const pgP = await loginPage("pastor@chungpa.local", "chungpa-pastor-2026!");
  await pgP.goto(WEB + "/home", { waitUntil: "networkidle0" });
  const wP = await pgP.evaluate(() => [...document.querySelectorAll("[data-widget]")].map((e) => e.getAttribute("data-widget")));
  check("W1 교인 홈: 작업/미출석 위젯 없음", !wM.includes("work-shortcut") && !wM.includes("absentee"), wM.join(","));
  check("W2 교역자 홈: 작업+미출석 위젯 있음", wP.includes("work-shortcut") && wP.includes("absentee"), wP.join(","));
  await pgM.browserContext().close(); await pgP.browserContext().close();
}

/* ===== X. /platform 별도 공간 ===== */
{
  const pg = await loginPage("pastor@chungpa.local", "chungpa-pastor-2026!");
  const res = await pg.goto(WEB + "/platform", { waitUntil: "networkidle0" });
  check("X1 비보유자 /platform → 차단(리다이렉트)", !pg.url().includes("/platform"), pg.url());
  await pg.browserContext().close();

  const pg2 = await loginPage("admin@chungpa.local", "chungpa-admin-2026!");
  await pg2.goto(WEB + "/platform", { waitUntil: "networkidle0" });
  const banner = await pg2.evaluate(() => document.body.innerText.includes("플랫폼 운영") && document.body.innerText.includes("교회로 돌아가기"));
  await pg2.click('[data-pnav="churches"]').catch(() => {});
  await new Promise((r) => setTimeout(r, 800));
  const churchCount = await pg2.evaluate(() => document.querySelectorAll("tbody tr").length);
  check("X2 플랫폼 콘솔: 운영 배너 + 복귀 버튼 + 교회 목록", banner && churchCount >= 3, `배너=${banner}, 교회=${churchCount}곳`);
  await pg2.screenshot({ path: "/private/tmp/claude-501/-Users-xbradpig-aretevision-dev-Havruta-Project/8f49d000-6d9f-47a2-975d-95ea78162575/scratchpad/platform.png" });
  await pg2.browserContext().close();
}

/* ===== J. 가입 신청 → 승인 ===== */
{
  const email = "joiner-" + Math.random().toString(36).slice(2, 8) + "@test.local";
  const joiner = createClient(URL_, ANON, { auth: { persistSession: false } });
  await joiner.auth.signUp({ email, password: "joiner-2026!" });
  const { data: rid, error: e1 } = await joiner.rpc("request_join", { p_slug: "chungpa", p_name: "가입테스트" });
  check("J1 교회 검색·가입 신청", !e1 && !!rid, e1?.message);

  const admin = createClient(URL_, ANON, { auth: { persistSession: false } });
  await admin.auth.signInWithPassword({ email: "admin@chungpa.local", password: "chungpa-admin-2026!" });
  const { error: e2 } = await admin.rpc("approve_join", { p_request: rid });
  const { data: newRole } = await svc.from("church_roles").select("role")
    .eq("church_id", CHUNGPA).eq("user_id", (await joiner.auth.getUser()).data.user.id);
  check("J2 관리자 승인 → member 역할 + 교적 생성", !e2 && newRole?.[0]?.role === "member", e2?.message);

  const { data: home } = await joiner.rpc("my_member_id");
  check("J3 승인된 교인: 교적 연결 확인", !!home);
  // 정리
  await svc.from("join_requests").delete().eq("id", rid);
  const { data: m } = await svc.from("members").select("id").eq("name", "가입테스트").eq("church_id", CHUNGPA);
  for (const x of m ?? []) {
    await svc.from("member_qr_tokens").delete().eq("member_id", x.id);
    await svc.from("audit_log").delete().eq("target_id", x.id);
    await svc.from("members").delete().eq("id", x.id);
  }
}

/* ===== A. 감사 트리거 + 생성 한도 ===== */
{
  const admin = createClient(URL_, ANON, { auth: { persistSession: false } });
  await admin.auth.signInWithPassword({ email: "admin@chungpa.local", password: "chungpa-admin-2026!" });
  const before = (await svc.from("audit_log").select("*", { count: "exact", head: true })
    .eq("target_table", "church_modules")).count ?? 0;
  await admin.rpc("set_module", { p_module: "verse", p_enabled: true });
  const after = (await svc.from("audit_log").select("*", { count: "exact", head: true })
    .eq("target_table", "church_modules")).count ?? 0;
  check("A1 모듈 토글 감사 기록", after > before, `${before}→${after}`);

  const bAdmin = createClient(URL_, ANON, { auth: { persistSession: false } });
  await bAdmin.auth.signInWithPassword({ email: "b-admin@verify.local", password: "verify-b-2026!" });
  const { error: limitErr } = await bAdmin.rpc("create_church", { p_name: "두번째교회", p_slug: "second-abuse-test" });
  check("A2 교회 생성 한도(계정당 1개)", limitErr !== null && /1개/.test(limitErr?.message ?? ""), limitErr?.message?.slice(0, 40));
}

await browser.close();
const md = `# UI 고도화 + P0 검증 리포트\n\n- 실행: ${new Date().toISOString()}\n- 결과: **${pass} PASS / ${fail} FAIL**\n\n| 결과 | 시나리오 | 상세 |\n|------|----------|------|\n${results.join("\n")}\n`;
fs.writeFileSync(fileURLToPath(new URL("./ui-report.md", import.meta.url)), md);
console.log(md);
process.exit(fail > 0 ? 1 : 0);
