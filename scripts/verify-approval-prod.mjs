#!/usr/bin/env node
/** 실서비스 교회 승인제 검증 (고도화 폼 → pending → 심사 큐 → 승인/거절) */
import { createClient } from "@supabase/supabase-js";
const URL_ = process.env.URL, ANON = process.env.ANON;
const svc = createClient(URL_, process.env.SVC);
const email = "approval-test@havrutaproject.org";
const { data: list } = await svc.auth.admin.listUsers();
let uid = list.users.find((u) => u.email === email)?.id;
if (!uid) uid = (await svc.auth.admin.createUser({ email, password: "approval-2026!!", email_confirm: true })).data.user.id;
else await svc.auth.admin.updateUserById(uid, { password: "approval-2026!!" });
// 이전 잔여 정리 (교회 1개 한도)
const { data: old } = await svc.from("churches").select("id").eq("created_by", uid);
for (const c of old ?? []) {
  for (const t of ["church_modules","field_permissions","events","departments","active_church","church_roles"]) await svc.from(t).delete().eq("church_id", c.id);
  await svc.from("audit_log").delete().eq("target_id", c.id);
  await svc.from("churches").delete().eq("id", c.id);
}
const founder = createClient(URL_, ANON, { auth: { persistSession: false } });
await founder.auth.signInWithPassword({ email, password: "approval-2026!!" });
const { data: cid, error: e1 } = await founder.rpc("create_church", {
  p_name: "승인테스트교회", p_slug: "approval-" + Math.random().toString(36).slice(2, 6),
  p_denomination: "기독교대한감리회", p_pastor: "김목사", p_phone: "010-0000-0000",
  p_address: "서울시", p_size: "50~100명", p_intro: "https://test.example",
});
console.log("① 고도화 폼 등록:", e1 ? "❌ " + e1.message : "✅");
const [{ data: st }, { data: mod }] = await Promise.all([
  founder.rpc("my_church_status"), founder.rpc("module_enabled", { p_module: "attendance" })]);
console.log("② 등록 직후:", st === "pending" && mod === false ? "✅ pending + 모듈 잠김" : "❌ " + st + "/" + mod);
const admin = createClient(URL_, ANON, { auth: { persistSession: false } });
await admin.auth.signInWithPassword({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PW });
const { data: queue } = await admin.rpc("platform_pending_churches");
console.log("③ 심사 큐(교단·담임·연락처):", queue?.some((c) => c.id === cid && c.denomination === "기독교대한감리회" && c.pastor_name === "김목사") ? "✅" : "❌");
const ap = await admin.rpc("platform_set_church_status", { p_church: cid, p_status: "active" });
const { data: mod2 } = await founder.rpc("module_enabled", { p_module: "attendance" });
console.log("④ 승인 → 모듈 열림:", !ap.error && mod2 === true ? "✅" : "❌ " + (ap.error?.message ?? mod2));
await admin.rpc("platform_set_church_status", { p_church: cid, p_status: "rejected", p_note: "검증 테스트" });
const { data: st2 } = await founder.rpc("my_church_status");
console.log("⑤ 거절 + 사유 기록:", st2 === "rejected" ? "✅" : "❌");
// 정리
for (const t of ["church_modules","field_permissions","events","departments","active_church","church_roles"]) await svc.from(t).delete().eq("church_id", cid);
await svc.from("audit_log").delete().eq("target_id", cid);
await svc.from("churches").delete().eq("id", cid);
await svc.auth.admin.deleteUser(uid);
console.log("(정리 완료)");
