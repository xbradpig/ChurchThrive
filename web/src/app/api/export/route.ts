import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Obsidian 출석명단 내보내기 — 기존 B332 형식과 100% 동일한 계약:
 *   type/date/service_type + registered_members(이름: bool 전원) + new_families + visitors
 * 기존 파서 정규식: /registered_members:([\s\S]*?)(?=\n#|$)/ 등 (🌐 출석부 생성기.html:780-874)
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: role } = await supabase.rpc("my_role");
  if (!role || role === "member") {
    return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
  }

  const date = req.nextUrl.searchParams.get("date");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "date=YYYY-MM-DD 필요" }, { status: 400 });
  }

  // 해당 날짜의 주 이벤트(출석 수 최다)를 service_type으로
  const { data: atts } = await supabase
    .from("attendances")
    .select("member_id, approved, events(name)")
    .eq("event_date", date);

  const byEvent = new Map<string, Set<string>>();
  for (const a of atts ?? []) {
    if (!a.approved) continue;
    const ev = (a.events as unknown as { name: string })?.name ?? "주일예배";
    if (!byEvent.has(ev)) byEvent.set(ev, new Set());
    byEvent.get(ev)!.add(a.member_id);
  }
  const serviceType = [...byEvent.entries()].sort((x, y) => y[1].size - x[1].size)[0]?.[0] ?? "주일예배";
  const presentIds = byEvent.get(serviceType) ?? new Set();

  const { data: members } = await supabase
    .from("members")
    .select("id, name, name_suffix, member_type, status")
    .eq("status", "active")
    .order("name");

  const registered = (members ?? []).filter((m) => m.member_type === "registered");
  const newcomers = (members ?? []).filter((m) => m.member_type === "new_family" && presentIds.has(m.id));

  const display = (m: { name: string; name_suffix: string }) => `${m.name}${m.name_suffix}`;
  const sorted = [...registered].sort((a, b) => display(a).localeCompare(display(b), "ko"));

  let md = `---\n`;
  md += `type: attendance\n`;
  md += `date: ${date}\n`;
  md += `service_type: ${serviceType}\n\n`;
  md += `# 등록 교인 출석 (${sorted.length}명)\n`;
  md += `registered_members:\n`;
  for (const m of sorted) md += `  ${display(m)}: ${presentIds.has(m.id)}\n`;
  md += `\n# 새가족 (새로 오신 분들)\n`;
  if (newcomers.length === 0) {
    md += `new_families: []\n`;
  } else {
    md += `new_families:\n`;
    for (const n of newcomers) {
      md += `  - name: "${display(n)}"\n    phone: ""\n    address: ""\n    introducer: "[[]]"\n    visit_count: 1\n    notes: ""\n`;
    }
  }
  md += `\n# 방문자 (일시 방문)\nvisitors: []\n`;
  md += `---\n\n`;

  const attended = sorted.filter((m) => presentIds.has(m.id));
  const absent = sorted.filter((m) => !presentIds.has(m.id));
  const rate = sorted.length ? ((attended.length / sorted.length) * 100).toFixed(1) : "0.0";
  const total = attended.length + newcomers.length;

  md += `# ${date} 출석명단\n\n`;
  md += `> **📋 출석 요약**\n`;
  md += `> - ✅ 등록 교인: ${attended.length}명 / ${sorted.length}명 (${rate}%)\n`;
  md += `> - 🌟 새가족: ${newcomers.length}명\n`;
  md += `> - 👥 방문자: 0명\n`;
  md += `> - 📊 **총 출석: ${total}명**\n\n---\n\n`;
  md += `## ✅ 출석자 명단 (${attended.length}명)\n\n${attended.map(display).join(", ")}\n\n`;
  if (absent.length > 0) {
    md += `## ❌ 결석자 명단 (${absent.length}명)\n\n${absent.map(display).join(", ")}\n\n`;
  }
  md += `---\n\n**생성 시간**: ${new Date().toLocaleString("ko-KR")}\n**생성 도구**: ChungpaAttend\n`;

  return new NextResponse(md, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(`${date} 출석명단.md`)}`,
    },
  });
}
