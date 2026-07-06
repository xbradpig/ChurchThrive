"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Hit = { kind: "member" | "nav"; id: string; label: string; sub?: string; href: string };

/** 전역 검색 (⌘K / Ctrl+K) — 교인 즉시 점프 + 화면 이동 */
export default function GlobalSearch({ isStaff, navItems }:
  { isStaff: boolean; navItems: { label: string; href: string }[] }) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 30); else { setQ(""); setHits([]); } }, [open]);

  const search = useCallback(async (term: string) => {
    const navHits: Hit[] = navItems
      .filter((n) => n.label.includes(term))
      .map((n) => ({ kind: "nav" as const, id: n.href, label: n.label, href: n.href }));
    let memberHits: Hit[] = [];
    if (isStaff && term.trim()) {
      const { data } = await supabase.rpc("admin_list_members", { p_search: term });
      memberHits = (data ?? []).slice(0, 7).map((m: { id: string; name: string; name_suffix: string; position: string | null; status: string }) => ({
        kind: "member" as const, id: m.id,
        label: m.name + (m.name_suffix ?? ""),
        sub: [m.position, m.status !== "active" ? "비활동" : null].filter(Boolean).join(" · ") || "교인",
        href: `/members/${m.id}`,
      }));
    }
    setHits([...memberHits, ...navHits.slice(0, 5)]);
    setSel(0);
  }, [supabase, isStaff, navItems]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => search(q), 180);
    return () => clearTimeout(t);
  }, [q, open, search]);

  function go(h: Hit) {
    setOpen(false);
    router.push(h.href);
  }

  return (
    <>
      <button onClick={() => setOpen(true)} data-global-search
              className="flex items-center gap-2.5 px-3 py-2 mx-3 mb-1 rounded-lg text-[14px] font-bold text-left"
              style={{ background: "rgb(255 255 255 / 0.08)", color: "rgb(255 255 255 / 0.6)" }}>
        🔍 검색
        <kbd className="ml-auto text-[11px] px-1.5 py-0.5 rounded"
             style={{ background: "rgb(255 255 255 / 0.1)" }}>⌘K</kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-[85] flex items-start justify-center pt-[12vh] p-4"
             style={{ background: "rgb(14 25 40 / 0.5)", backdropFilter: "blur(3px)" }}
             onClick={() => setOpen(false)}>
          <div className="card w-full max-w-md overflow-hidden pop-in" style={{ boxShadow: "var(--shadow-pop)" }}
               onClick={(e) => e.stopPropagation()} data-search-palette>
            <input ref={inputRef} className="w-full px-5 py-4 text-lg font-bold bg-transparent outline-none"
                   placeholder={isStaff ? "교인 이름 또는 메뉴 검색…" : "메뉴 검색…"}
                   value={q} onChange={(e) => setQ(e.target.value)}
                   onKeyDown={(e) => {
                     if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(s + 1, hits.length - 1)); }
                     if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
                     if (e.key === "Enter" && hits[sel]) go(hits[sel]);
                   }} />
            <div className="border-t border-[var(--line)] max-h-80 overflow-y-auto">
              {hits.map((h, i) => (
                <button key={h.kind + h.id} onClick={() => go(h)} onMouseEnter={() => setSel(i)}
                        className="w-full flex items-center gap-3 px-5 py-3 text-left"
                        style={i === sel ? { background: "var(--surface-soft)" } : undefined}>
                  <span>{h.kind === "member" ? "👤" : "📄"}</span>
                  <span className="font-bold">{h.label}</span>
                  {h.sub && <span className="text-sm text-[var(--text-soft)]">{h.sub}</span>}
                  <span className="ml-auto text-xs text-[var(--text-soft)]">{h.kind === "member" ? "교적 열기" : "이동"}</span>
                </button>
              ))}
              {q.trim() && hits.length === 0 && (
                <p className="px-5 py-6 text-center text-[var(--text-soft)]">결과가 없습니다.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
