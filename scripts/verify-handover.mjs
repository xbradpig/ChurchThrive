#!/usr/bin/env node
/** 관리자 인수인계·복구 검증 */
import { createClient } from "@supabase/supabase-js";
const URL_ = "http://127.0.0.1:54321";
const ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
const SERVICE = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";
const svc = createClient(URL_, SERVICE);
let pass = 0, fail = 0;
const check = (n, ok, d="") => { console.log((ok?"✅":"❌"), n, d); ok?pass++:fail++; };
async function login(email, pw) {
  const c = createClient(URL_, ANON, { auth: { persistSession: false } });
  const { error } = await c.auth.signInWithPassword({ email, password: pw });
  if (error) throw new Error(email + ": " + error.message);
  return c;
}
// 후임자 계정 준비
const email2 = "successor@verify.local";
const { data: list } = await svc.auth.admin.listUsers();
let uid2 = list.users.find(u => u.email === email2)?.id;
if (!uid2) uid2 = (await svc.auth.admin.createUser({ email: email2, password: "successor-2026!", email_confirm: true })).data.user.id;
await svc.from("church_roles").delete().eq("user_id", uid2);

const admin = await login("admin@chungpa.local", "chungpa-admin-2026!");

// H1. 마지막 관리자 보호: 유일 관리자가 자기 자신 해제 시도 → 차단
const { data: me } = await admin.auth.getUser();
const { error: e0 } = await admin.rpc("remove_church_role", { p_user: me.user.id, p_role: "superadmin" });
check("H1 마지막 관리자 해제 차단", e0 !== null && /마지막 관리자/.test(e0?.message ?? ""), e0?.message?.slice(0, 30));

// H2. 이메일로 후임 관리자 임명
const { error: e1 } = await admin.rpc("set_church_role_by_email", { p_email: email2, p_role: "superadmin" });
const successor = await login(email2, "successor-2026!");
const { data: r2 } = await successor.rpc("my_role");
check("H2 후임 관리자 임명(이메일)", !e1 && r2 === "superadmin", e1?.message ?? r2);

// H3. 없는 이메일 → 친절한 오류
const { error: e3 } = await admin.rpc("set_church_role_by_email", { p_email: "ghost@nowhere.io", p_role: "checker" });
check("H3 미가입 이메일 안내", /먼저 회원가입/.test(e3?.message ?? ""));

// H4. 담당자 목록 (관리자에게만)
const { data: staffList } = await admin.rpc("list_church_staff");
const checkerC = await login("checker@chungpa.local", "chungpa-check-2026!");
const { data: hidden } = await checkerC.rpc("list_church_staff");
check("H4 담당자 목록: 관리자만", (staffList ?? []).some(s => s.email === email2) && (hidden ?? []).length === 0,
  `관리자=${staffList?.length}건, 체커=${hidden?.length ?? 0}건`);

// H5. 후임자가 전임자 관리자 권한 해제 (2명이므로 허용)
const { error: e5 } = await successor.rpc("remove_church_role", { p_user: me.user.id, p_role: "superadmin" });
const { data: rOld } = await admin.rpc("my_role");
check("H5 전임자 권한 해제(인수인계 완료)", !e5 && rOld !== "superadmin", e5?.message ?? `전임자=${rOld}`);

// H6. 플랫폼 복구: 운영자가 전임자를 다시 관리자로 (연락 두절 시나리오의 역방향 복원)
const pa = await login("admin@chungpa.local", "chungpa-admin-2026!"); // platform_admins 시드 계정
const CHUNGPA = "11111111-1111-1111-1111-111111111111";
const { error: e6 } = await pa.rpc("platform_transfer_admin",
  { p_church: CHUNGPA, p_new_email: "admin@chungpa.local", p_revoke_email: email2 });
const { data: rBack } = await pa.rpc("my_role");
const { data: gone } = await svc.from("church_roles").select("role").eq("user_id", uid2);
check("H6 플랫폼 소유권 복구(+퇴사자 회수)", !e6 && rBack === "superadmin" && (gone ?? []).length === 0,
  e6?.message ?? `복구=${rBack}, 퇴사자 잔여=${gone?.length}`);

await svc.auth.admin.deleteUser(uid2);
console.log(`\n결과: ${pass} PASS / ${fail} FAIL`);
process.exit(fail ? 1 : 0);
