#!/usr/bin/env node
/** 실서비스 "승인 먼저" 온보딩 검증: 무계정 신청 → 승인(메일) → 링크 → 비번 설정 → 관리자 */
import { createClient } from "@supabase/supabase-js";
import puppeteer from "puppeteer-core";
const ORIGIN = "https://church.havrutaproject.org";
const svc = createClient(process.env.URL, process.env.SVC);
const email = "apply-test@havrutaproject.org";
const slug = "apply-" + Math.random().toString(36).slice(2, 6);

// 잔여 정리
{ const { data: u } = await svc.auth.admin.listUsers();
  const old = u.users.find((x) => x.email === email);
  if (old) { await svc.from("church_roles").delete().eq("user_id", old.id);
    await svc.from("active_church").delete().eq("user_id", old.id);
    await svc.auth.admin.deleteUser(old.id); }
  await svc.from("church_applications").delete().eq("applicant_email", email); }

// ① 계정 없이 신청서 제출 (공개 API)
const r1 = await fetch(`${ORIGIN}/api/apply`, { method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "신청테스트교회", slug, denomination: "기독교대한감리회",
    pastor_name: "이목사", contact_phone: "010-1111-2222", applicant_email: email, member_size: "50~100명" }) });
console.log("① 무계정 신청 제출:", r1.ok ? "✅" : "❌ " + (await r1.json()).error);

// ② 플랫폼 관리자: 큐 확인 → 승인 (웹 API — 세션 쿠키 필요하므로 puppeteer로)
const b = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new" });
const pg = await b.newPage();
await pg.goto(`${ORIGIN}/login`, { waitUntil: "networkidle0" });
await pg.type("input[type=email]", process.env.ADMIN_EMAIL);
await pg.type("input[type=password]", process.env.ADMIN_PW);
await Promise.all([pg.click("form button"), pg.waitForNavigation({ waitUntil: "networkidle0" }).catch(() => {})]);
await pg.goto(`${ORIGIN}/platform`, { waitUntil: "networkidle0" });
const queueText = await pg.evaluate(() => document.body.innerText);
console.log("② 플랫폼 신청 큐 표시:", queueText.includes("신청테스트교회") && queueText.includes(email) ? "✅" : "❌");
// 승인 API 호출 (같은 세션으로)
const { data: app } = await svc.from("church_applications").select("id").eq("applicant_email", email).eq("status", "pending").single();
const approveRes = await pg.evaluate(async (id) => {
  const r = await fetch("/api/platform/review-application", { method: "POST",
    headers: { "Content-Type": "application/json" }, body: JSON.stringify({ application_id: id, approve: true }) });
  return { ok: r.ok, body: await r.json() };
}, app.id);
console.log("③ 승인(교회 생성+메일 발송):", approveRes.ok ? "✅ " + approveRes.body.church : "❌ " + approveRes.body.error);

// ④ 교회가 active로 생성 + 신청자 계정에 관리자 사전 바인딩 확인
const { data: church } = await svc.from("churches").select("id, status").eq("slug", slug).single();
const { data: users } = await svc.auth.admin.listUsers();
const newUser = users.users.find((u) => u.email === email);
const { data: roles } = await svc.from("church_roles").select("role").eq("user_id", newUser?.id ?? "");
console.log("④ 교회 active + 관리자 바인딩:", church?.status === "active" && roles?.some((r) => r.role === "superadmin") ? "✅" : "❌");

// ⑤ 가입 링크(메일 내용물) 재현 → 비번 설정 페이지 → 설정 → 관리자 홈
const { data: link } = await svc.auth.admin.generateLink({ type: "magiclink", email,
  options: { redirectTo: `${ORIGIN}/set-password` } });
const pg2 = await (await b.createBrowserContext()).newPage();
await pg2.goto(link.properties.action_link, { waitUntil: "networkidle0" });
await new Promise((r) => setTimeout(r, 2500));
const onSetPw = pg2.url().includes("set-password") || (await pg2.evaluate(() => document.body.innerText)).includes("비밀번호");
await pg2.type("input[type=password]", "apply-new-pw-2026!").catch(() => {});
const inputs = await pg2.$$("input[type=password]");
if (inputs[1]) await inputs[1].type("apply-new-pw-2026!");
await pg2.click("form button").catch(() => {});
await new Promise((r) => setTimeout(r, 4000));
const finalUrl = pg2.url();
const homeText = await pg2.evaluate(() => document.body.innerText);
console.log("⑤ 메일 링크→비번 설정→시작:", onSetPw && finalUrl.includes("/home") ? "✅ 관리자 홈 도착" : "❌ " + finalUrl);
console.log("⑥ 새 교회 컨텍스트:", homeText.includes("신청테스트교회") ? "✅ 교회명 표시" : "❌");
await b.close();

// 정리
for (const t of ["church_modules","field_permissions","events","departments","active_church","church_roles"]) await svc.from(t).delete().eq("church_id", church.id);
await svc.from("audit_log").delete().eq("target_id", church.id);
await svc.from("church_applications").delete().eq("applicant_email", email);
await svc.from("churches").delete().eq("id", church.id);
if (newUser) await svc.auth.admin.deleteUser(newUser.id);
console.log("(정리 완료)");
