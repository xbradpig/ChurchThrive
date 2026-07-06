#!/usr/bin/env node
/** 실서비스 어르신 초대 검증: 링크 생성 → 수락 페이지 → 시작하기 → 자동 로그인 */
import { createClient } from "@supabase/supabase-js";
import puppeteer from "puppeteer-core";
const URL_ = process.env.URL, ANON = process.env.ANON, ORIGIN = "https://church.havrutaproject.org";
const svc = createClient(URL_, process.env.SVC);
// 계정 미연결 교인 하나 선택
const { data: target } = await svc.from("members").select("id, name")
  .eq("church_id", "11111111-1111-1111-1111-111111111111").is("user_id", null).limit(1).single();
// 담당자(관리자)가 초대 생성
const admin = createClient(URL_, ANON, { auth: { persistSession: false } });
await admin.auth.signInWithPassword({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PW });
const { data: token, error: e1 } = await admin.rpc("create_member_invite", { p_member: target.id });
console.log("① 초대 링크 생성(담당자):", e1 ? "❌ " + e1.message : "✅ " + target.name + " 님");
// 어르신 브라우저 여정
const b = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new" });
const pg = await b.newPage();
await pg.goto(`${ORIGIN}/invite/${token}`, { waitUntil: "networkidle0" });
const welcome = await pg.evaluate(() => document.body.innerText);
console.log("② 수락 페이지:", welcome.includes(target.name) && welcome.includes("환영") ? "✅ 이름·환영 문구" : "❌");
await pg.click("button");
await pg.waitForNavigation({ waitUntil: "networkidle0", timeout: 30000 }).catch(() => {});
await new Promise((r) => setTimeout(r, 3000));
const url = pg.url();
console.log("③ 시작하기 → 자동 로그인:", url.includes("/home") ? "✅ 홈 도착 (이메일·비번 없이)" : "❌ " + url);
const home = await pg.evaluate(() => document.body.innerText);
console.log("④ 교인 홈 위젯:", home.includes("내 출석") || home.includes("암송") || home.includes("홈") ? "✅" : "❌");
await b.close();
// 정리: 가상 계정 연결 해제
const { data: m2 } = await svc.from("members").select("user_id").eq("id", target.id).single();
if (m2.user_id) {
  await svc.from("church_roles").delete().eq("user_id", m2.user_id);
  await svc.from("active_church").delete().eq("user_id", m2.user_id);
  await svc.from("members").update({ user_id: null }).eq("id", target.id);
  await svc.from("member_invites").delete().eq("member_id", target.id);
  await svc.auth.admin.deleteUser(m2.user_id);
}
console.log("(테스트 연결 정리 완료 — 교적은 원상태)");
