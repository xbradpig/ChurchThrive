#!/usr/bin/env node
/** checker 로그인 → /check 화면 캡처 (태블릿 뷰포트) */
import puppeteer from "puppeteer-core";

const OUT = process.argv[2] ?? "/tmp/check-screen.png";
const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
});
const page = await browser.newPage();
await page.setViewport({ width: 1024, height: 1200, deviceScaleFactor: 2 }); // 태블릿 세로

await page.goto("http://localhost:3120/login", { waitUntil: "networkidle0" });
await page.type('input[type="email"]', "checker@chungpa.local");
await page.type('input[type="password"]', "chungpa-check-2026!");
await Promise.all([
  page.click("button[type=submit], form button"),
  page.waitForNavigation({ waitUntil: "networkidle0", timeout: 20000 }).catch(() => {}),
]);
await page.waitForSelector(".member-card", { timeout: 20000 });
await new Promise((r) => setTimeout(r, 1200)); // 사진 로딩

// 초성 필터 데모: "ㅈ" 칩 클릭 → 해당 초성만 표시되는지 확인
const chosung = process.argv[3];
if (chosung) {
  const chips = await page.$$(".chosung-chip");
  for (const chip of chips) {
    const label = await chip.evaluate((el) => el.textContent?.trim());
    if (label === chosung) { await chip.click(); break; }
  }
  await new Promise((r) => setTimeout(r, 600));
}

await page.screenshot({ path: OUT });
console.log("saved:", OUT, "url:", page.url());
await browser.close();
