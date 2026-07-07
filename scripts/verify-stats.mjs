#!/usr/bin/env node
/** 교회 현황(/stats) 실작동 검증 — 역할별 로그인 → 페이지 렌더링·리다이렉트·권한 확인 + 스크린샷 */
import puppeteer from "puppeteer-core";

const BASE = process.env.BASE ?? "http://localhost:3130";
const OUT = process.env.OUT ?? "/tmp/stats-verify";
const SLUG = "chungpa21";
import fs from "node:fs";
fs.mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
});

const results = [];
const ok = (name, cond, extra = "") => {
  results.push(`${cond ? "PASS" : "FAIL"} ${name}${extra ? " — " + extra : ""}`);
  console.log(results[results.length - 1]);
};

async function loginCtx(email, password, viewport = { width: 1280, height: 1000 }) {
  const ctx = await (browser.createBrowserContext?.() ?? browser.createIncognitoBrowserContext());
  const page = await ctx.newPage();
  await page.setViewport({ ...viewport, deviceScaleFactor: 2 });
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle0" });
  await page.type('input[type="email"]', email);
  await page.type('input[type="password"]', password);
  await Promise.all([
    page.click("button[type=submit], form button"),
    page.waitForNavigation({ waitUntil: "networkidle0", timeout: 25000 }).catch(() => {}),
  ]);
  return { ctx, page };
}
const settle = (ms = 1500) => new Promise((r) => setTimeout(r, ms));

/* ===== 1) superadmin: 전체 페이지 + 리다이렉트 ===== */
{
  const { ctx, page } = await loginCtx("admin@chungpa.local", "chungpa-admin-2026!");
  await page.goto(`${BASE}/${SLUG}/stats`, { waitUntil: "networkidle0" });
  await settle();
  const body = await page.evaluate(() => document.body.innerText);
  ok("A1 오버뷰 KPI(주일 출석)", body.includes("주일 출석"));
  ok("A2 오버뷰 해야 할 일", body.includes("해야 할 일"));
  ok("A3 오버뷰 헌금 카드(superadmin)", body.includes("주간 헌금 가정"));
  ok("A4 사이드바 교회 현황", body.includes("교회 현황"));
  await page.screenshot({ path: `${OUT}/1-admin-overview.png`, fullPage: true });

  for (const [path, expectText, shot] of [
    ["stats/attendance", "출석 일관성", "2-admin-attendance"],
    ["stats/verse", "암송률", "3-admin-verse"],
    ["stats/notes", "작성", "4-admin-notes"],
    ["stats/giving", "개인별 명세", "5-admin-giving"],
    ["stats/members", "직분별 분포", "6-admin-members"],
  ]) {
    await page.goto(`${BASE}/${SLUG}/${path}`, { waitUntil: "networkidle0" });
    await settle();
    const t = await page.evaluate(() => document.body.innerText);
    ok(`A5 /${path}`, t.includes(expectText), expectText);
    await page.screenshot({ path: `${OUT}/${shot}.png`, fullPage: true });
  }

  // 기존 현황 탭 → /stats 리다이렉트
  await page.goto(`${BASE}/${SLUG}/church?tab=overview`, { waitUntil: "networkidle0" });
  ok("A6 church?tab=overview → /stats 리다이렉트", page.url().includes(`/${SLUG}/stats`), page.url());

  // 모바일 뷰포트(375px) 1열 스택 + 가로 스크롤 없음
  await page.setViewport({ width: 375, height: 900, deviceScaleFactor: 2 });
  await page.goto(`${BASE}/${SLUG}/stats`, { waitUntil: "networkidle0" });
  await settle();
  const noHScroll = await page.evaluate(() => document.documentElement.scrollWidth <= 380);
  ok("A7 375px 가로 스크롤 없음", noHScroll);
  await page.screenshot({ path: `${OUT}/7-admin-mobile.png`, fullPage: true });
  await ctx.close();
}

/* ===== 2) pastor(담임목사 지정 상태): 재정 접근 가능 ===== */
{
  const { ctx, page } = await loginCtx("pastor@chungpa.local", "chungpa-pastor-2026!");
  await page.goto(`${BASE}/${SLUG}/stats/giving`, { waitUntil: "networkidle0" });
  await settle();
  const t = await page.evaluate(() => document.body.innerText);
  ok("B1 담임목사 재정 열람", page.url().includes("/stats/giving") && t.includes("개인별 명세"));
  ok("B2 담임목사 지정 카드는 superadmin 전용(비노출)", !t.includes("대표 교역자(담임목사) 지정"));
  await page.screenshot({ path: `${OUT}/8-senior-pastor-giving.png`, fullPage: true });
  await ctx.close();
}

/* ===== 3) checker: 오버뷰 출석만 + 교적 차단 ===== */
{
  const { ctx, page } = await loginCtx("checker@chungpa.local", "chungpa-check-2026!");
  await page.goto(`${BASE}/${SLUG}/stats`, { waitUntil: "networkidle0" });
  await settle();
  const t = await page.evaluate(() => document.body.innerText);
  ok("C1 checker 오버뷰 접근 + 주일 출석", t.includes("주일 출석"));
  ok("C2 checker 헌금 카드 없음", !t.includes("주간 헌금 가정"));
  ok("C3 checker 새가족 카드 없음", !t.includes("이번 주 새가족"));
  await page.screenshot({ path: `${OUT}/9-checker-overview.png`, fullPage: true });
  await page.goto(`${BASE}/${SLUG}/stats/members`, { waitUntil: "networkidle0" });
  ok("C4 checker 교적 → /stats 리다이렉트", !page.url().includes("/stats/members"));
  await page.goto(`${BASE}/${SLUG}/stats/giving`, { waitUntil: "networkidle0" });
  ok("C5 checker 재정 → 차단", !page.url().includes("/stats/giving"));
  await ctx.close();
}

/* ===== 4) member: /stats 접근 불가 + 말씀노트 작성 ===== */
{
  const { ctx, page } = await loginCtx("member@chungpa.local", "chungpa-member-2026!");
  await page.goto(`${BASE}/${SLUG}/stats`, { waitUntil: "networkidle0" });
  ok("D1 member /stats → home 리다이렉트", page.url().includes(`/${SLUG}/home`), page.url());

  // 말씀노트 작성 (실제 쓰기 경로)
  await page.goto(`${BASE}/${SLUG}/m/note`, { waitUntil: "networkidle0" });
  await settle();
  const noteBody = await page.evaluate(() => document.body.innerText);
  ok("D2 말씀노트 페이지 + 프라이버시 문구", noteBody.includes("나만"));
  const ta = await page.$("textarea");
  if (ta) {
    await ta.click({ clickCount: 3 });
    await ta.type("주일 설교 은혜 메모 — 실작동 검증 " + new Date().toISOString().slice(0, 16));
    const btns = await page.$$("button");
    for (const b of btns) {
      const label = await b.evaluate((el) => el.textContent);
      if (label?.includes("노트")) { await b.click(); break; }
    }
    await settle(1200);
    const after = await page.evaluate(() => document.body.innerText);
    ok("D3 노트 저장(수정) 동작", after.includes("연속") || after.includes("저장"));
  } else ok("D3 노트 저장", false, "textarea 없음");
  await page.screenshot({ path: `${OUT}/10-member-note.png`, fullPage: true });
  await ctx.close();
}

await browser.close();
const fails = results.filter((r) => r.startsWith("FAIL"));
console.log(`\n===== ${results.length - fails.length}/${results.length} PASS =====`);
if (fails.length) { console.log(fails.join("\n")); process.exit(1); }
