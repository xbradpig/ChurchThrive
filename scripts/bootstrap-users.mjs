#!/usr/bin/env node
/** 초기 계정 생성: 수퍼관리자 + 역할별 테스트 계정 (로컬/최초 설치용) */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL ?? "http://127.0.0.1:54321",
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU",
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const USERS = [
  { email: "admin@chungpa.local",   password: "chungpa-admin-2026!",   role: "superadmin", member: null },
  { email: "pastor@chungpa.local",  password: "chungpa-pastor-2026!",  role: "pastor",     member: null },
  { email: "checker@chungpa.local", password: "chungpa-check-2026!",   role: "checker",    member: null },
  { email: "leader@chungpa.local",  password: "chungpa-leader-2026!",  role: "dept_leader", member: "박종영", leadDept: "남전도회" },
  { email: "member@chungpa.local",  password: "chungpa-member-2026!",  role: "member",     member: "김인자" },
];

for (const u of USERS) {
  let userId;
  const { data, error } = await supabase.auth.admin.createUser({
    email: u.email, password: u.password, email_confirm: true,
  });
  if (error) {
    if (!/already/i.test(error.message)) { console.error(u.email, error.message); continue; }
    const { data: list } = await supabase.auth.admin.listUsers();
    userId = list.users.find((x) => x.email === u.email)?.id;
  } else {
    userId = data.user.id;
  }
  await supabase.from("user_roles").upsert({ user_id: userId, role: u.role });

  if (u.member) {
    const { data: m } = await supabase.from("members").select("id")
      .eq("name", u.member).eq("name_suffix", "").single();
    if (m) {
      await supabase.from("members").update({ user_id: userId }).eq("id", m.id);
      if (u.leadDept) {
        const { data: d } = await supabase.from("departments").select("id").eq("name", u.leadDept).single();
        if (d) {
          await supabase.from("department_members").upsert(
            { member_id: m.id, department_id: d.id }, { onConflict: "member_id,department_id" });
          await supabase.from("department_leaders").upsert(
            { member_id: m.id, department_id: d.id, status: "approved", approved_at: new Date().toISOString() },
            { onConflict: "member_id,department_id" });
        }
      }
    }
  }
  console.log(`✓ ${u.email} (${u.role})`);
}
console.log("\n초기 계정 생성 완료 — 비밀번호는 최초 로그인 후 변경하세요.");
