"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MODULES, type ModuleDef } from "@/modules/registry";

export default function StoreBoard({
  isAdmin, churchName, installed,
}: { isAdmin: boolean; churchName: string; installed: Record<string, boolean> }) {
  const supabase = useMemo(() => createClient(), []);
  const [state, setState] = useState(installed);
  const [confirm, setConfirm] = useState<ModuleDef | null>(null);
  const [busy, setBusy] = useState(false);

  async function toggle(mod: ModuleDef, enable: boolean) {
    setBusy(true);
    const { error } = await supabase.rpc("set_module", { p_module: mod.key, p_enabled: enable });
    setBusy(false);
    if (error) { alert(error.message); return; }
    setState((s) => ({ ...s, [mod.key]: enable }));
    setConfirm(null);
  }

  return (
    <main className="max-w-2xl mx-auto p-4 flex flex-col gap-3">
      <p className="text-[var(--text-soft)] px-1">
        <b>{churchName}</b>에 필요한 기능을 골라 설치하세요. 해지해도 데이터는 보존됩니다.
      </p>

      {MODULES.map((m) => {
        const on = m.core || state[m.key] === true;
        return (
          <div key={m.key} className="card p-5 flex gap-4">
            <span className="text-4xl w-14 text-center shrink-0">{m.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <b className="text-lg text-[var(--color-brand-800)]">{m.name}</b>
                <span className="badge" style={{ background: "var(--color-brand-100)", color: "var(--color-brand-700)" }}>
                  {m.priceLabel}
                </span>
                {on && (
                  <span className="badge" style={{ background: "var(--color-positive-soft)", color: "var(--color-positive)" }}>
                    설치됨
                  </span>
                )}
              </div>
              <p className="text-sm font-bold text-[var(--text-soft)]">{m.tagline}</p>
              <p className="text-sm mt-1">{m.description}</p>
              {m.scopes.length > 0 && (
                <p className="text-xs mt-2 text-[var(--text-soft)]">
                  접근 정보: {m.scopes.join(" · ")}
                </p>
              )}
            </div>
            <div className="shrink-0 self-center">
              {m.core ? (
                <span className="text-sm font-bold text-[var(--text-soft)]">기본</span>
              ) : isAdmin ? (
                on ? (
                  <button className="btn btn-danger-soft !min-h-10 text-sm" disabled={busy}
                          onClick={() => toggle(m, false)}>해지</button>
                ) : (
                  <button className="btn btn-primary !min-h-10 text-sm" disabled={busy}
                          onClick={() => setConfirm(m)}>설치</button>
                )
              ) : (
                <span className="text-xs text-[var(--text-soft)]">관리자 설치</span>
              )}
            </div>
          </div>
        );
      })}

      {/* 설치 동의 (ecosystem §3: 스코프 고지) */}
      {confirm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-5"
             onClick={() => setConfirm(null)}>
          <div className="card p-6 max-w-sm w-full pop-in" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-black text-lg mb-2">{confirm.icon} {confirm.name} 설치</h3>
            <p className="text-sm mb-3">이 기능이 접근하는 우리 교회 정보:</p>
            <ul className="text-sm mb-4 flex flex-col gap-1">
              {confirm.scopes.map((s) => (
                <li key={s} className="badge w-full justify-start"
                    style={{ background: "var(--color-sand-100)", color: "var(--text)" }}>• {s}</li>
              ))}
            </ul>
            <p className="text-xs text-[var(--text-soft)] mb-4">
              설치하면 교회 메뉴에 바로 나타납니다. 언제든 해지할 수 있고, 해지해도 기록은 보존됩니다.
            </p>
            <div className="flex gap-2">
              <button className="btn btn-primary flex-1" disabled={busy} onClick={() => toggle(confirm, true)}>
                동의하고 설치
              </button>
              <button className="btn btn-ghost" onClick={() => setConfirm(null)}>취소</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
