import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CATEGORY_LABEL, fmtRange } from "../../m/calendar/format";

/** 공개 행사 공유 페이지 — 비로그인 열람 (visibility='public'만, public_event RPC가 SSOT) */
export default async function PublicEventPage({ params }:
  { params: Promise<{ church: string; id: string }> }) {
  const { church, id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const supabase = await createClient();
  const { data } = await supabase.rpc("public_event", { p_id: id });
  const e = (data as {
    id: string; title: string; description: string | null; category: string;
    starts_at: string; ends_at: string | null; location: string | null;
    church_name: string; church_slug: string;
  }[] | null)?.[0];
  if (!e || e.church_slug !== church) notFound();

  return (
    <main className="min-h-dvh flex items-center justify-center p-6">
      <div className="card w-full max-w-md overflow-hidden pop-in">
        <div className="px-6 py-4 text-white" style={{ background: "var(--color-brand-800)" }}>
          <p className="text-sm opacity-80">⛪ {e.church_name}</p>
          <h1 className="text-xl font-black mt-0.5">{e.title}</h1>
        </div>
        <div className="p-6 flex flex-col gap-3">
          <p className="flex items-center gap-2">
            <span className="badge" style={{ background: "var(--color-brand-100)", color: "var(--color-brand-700)" }}>
              {CATEGORY_LABEL[e.category] ?? e.category}
            </span>
            <b>{fmtRange(e)}</b>
          </p>
          {e.location && <p className="text-[15px]">📍 {e.location}</p>}
          {e.description && (
            <p className="text-[15px] leading-relaxed text-[var(--text-soft)] whitespace-pre-wrap">{e.description}</p>
          )}
          <div className="flex gap-2 mt-2">
            <Link href="/login" className="btn btn-primary flex-1">교인 로그인</Link>
            <Link href={`/join?church=${e.church_slug}`} className="btn btn-ghost flex-1">우리 교회 가입</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
