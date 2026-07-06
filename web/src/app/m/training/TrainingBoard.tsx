"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { notify } from "@/components/ui/AppDialog";

type Course = { id: string; name: string; description: string | null; start_on: string | null; active: boolean };
type Enroll = { course_id: string; member_id: string; status: string };

export default function TrainingBoard({ canManage, isAdmin }: { canManage: boolean; isAdmin: boolean }) {
  const supabase = useMemo(() => createClient(), []);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolls, setEnrolls] = useState<Enroll[]>([]);
  const [myId, setMyId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");

  const load = useCallback(async () => {
    const [{ data: cs }, { data: es }, { data: mid }] = await Promise.all([
      supabase.schema("mod_training").from("courses").select("id, name, description, start_on, active").order("start_on", { ascending: false }),
      supabase.schema("mod_training").from("enrollments").select("course_id, member_id, status"),
      supabase.rpc("my_member_id"),
    ]);
    setCourses(cs ?? []); setEnrolls(es ?? []); setMyId(mid);
  }, [supabase]);
  useEffect(() => { load(); }, [load]);

  async function createCourse() {
    if (!newName.trim()) return;
    const { data: cid } = await supabase.rpc("my_church_id");
    const { error } = await supabase.schema("mod_training").from("courses")
      .insert({ church_id: cid, name: newName.trim(), start_on: new Date().toISOString().slice(0, 10) });
    if (error) return notify(error.message, "error");
    setNewName(""); load();
  }

  async function enroll(courseId: string) {
    if (!myId) return notify("교적이 연결되어 있지 않습니다.");
    const { data: cid } = await supabase.rpc("my_church_id");
    const { error } = await supabase.schema("mod_training").from("enrollments")
      .insert({ course_id: courseId, member_id: myId, church_id: cid });
    if (error) return notify(error.message, "error");
    load();
  }

  async function complete(courseId: string, memberId: string) {
    await supabase.schema("mod_training").from("enrollments")
      .update({ status: "completed", updated_at: new Date().toISOString() })
      .eq("course_id", courseId).eq("member_id", memberId);
    load();
  }

  return (
    <main className="max-w-lg mx-auto p-4 flex flex-col gap-4">
      {isAdmin && (
        <div className="card p-5 flex gap-2" data-widget="training-admin">
          <input className="input flex-1" placeholder="새 과정 이름 (예: 제자훈련 1기)" value={newName}
                 onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && createCourse()} />
          <button className="btn btn-primary" onClick={createCourse}>개설</button>
        </div>
      )}
      {courses.length === 0 && <p className="text-center py-14 text-[var(--text-soft)]">개설된 과정이 없습니다.</p>}
      {courses.map((c) => {
        const list = enrolls.filter((e) => e.course_id === c.id);
        const mine = list.find((e) => e.member_id === myId);
        return (
          <div key={c.id} className="card p-5">
            <div className="flex items-center gap-2 flex-wrap">
              <b className="text-lg">{c.name}</b>
              {c.start_on && <span className="text-xs text-[var(--text-soft)]">{c.start_on}~</span>}
              <span className="badge" style={{ background: "var(--color-brand-100)", color: "var(--color-brand-700)" }}>
                수강 {list.length}명 · 수료 {list.filter((e) => e.status === "completed").length}명
              </span>
              <span className="ml-auto">
                {mine ? (
                  <span className="badge" style={mine.status === "completed"
                    ? { background: "var(--color-positive-soft)", color: "var(--color-positive)" }
                    : { background: "var(--color-caution-soft)", color: "var(--color-caution)" }}>
                    {mine.status === "completed" ? "수료 🎓" : "수강 중"}
                  </span>
                ) : (
                  <button className="btn btn-ghost !min-h-9 text-sm" onClick={() => enroll(c.id)}>수강 신청</button>
                )}
              </span>
            </div>
            {canManage && list.some((e) => e.status === "enrolled") && (
              <div className="mt-3 pt-2 border-t border-[var(--line)] flex flex-wrap gap-1.5">
                {list.filter((e) => e.status === "enrolled").map((e) => (
                  <button key={e.member_id} className="badge"
                          style={{ background: "var(--color-sand-100)", color: "var(--text)" }}
                          onClick={() => complete(c.id, e.member_id)}
                          title="탭하면 수료 처리">
                    수료 처리 →
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </main>
  );
}
