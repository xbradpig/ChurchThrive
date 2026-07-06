"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

/**
 * @churchthrive/ui — 브랜드 다이얼로그·토스트 (브라우저 alert/confirm/prompt 대체)
 * 시니어 규칙 내장: 버튼 48px, 본문 17px+, 명시적 버튼 (텍스트 링크 없음)
 */

type ConfirmOpts = { title: string; body?: string; confirmLabel?: string; danger?: boolean };
type PromptOpts = { title: string; body?: string; placeholder?: string; defaultValue?: string };
type Toast = { id: number; kind: "success" | "error" | "info"; text: string };

type Ctx = {
  confirm: (o: ConfirmOpts) => Promise<boolean>;
  promptText: (o: PromptOpts) => Promise<string | null>;
  toast: (kind: Toast["kind"], text: string) => void;
};

const DialogCtx = createContext<Ctx | null>(null);

/* 모듈 레벨 명령형 API — 훅 없이 어디서나 (Provider가 마운트 시 바인딩) */
let _api: Ctx | null = null;
export function notify(text: string, kind: Toast["kind"] = "info") { _api?.toast(kind, text); }
export function askConfirm(o: ConfirmOpts) { return _api ? _api.confirm(o) : Promise.resolve(window.confirm(o.title)); }
export function askPrompt(o: PromptOpts) { return _api ? _api.promptText(o) : Promise.resolve(window.prompt(o.title, o.defaultValue ?? "")); }
export function useAppDialog() {
  const ctx = useContext(DialogCtx);
  if (!ctx) throw new Error("AppDialogProvider 필요");
  return ctx;
}

export default function AppDialogProvider({ children }: { children: React.ReactNode }) {
  const [confirmState, setConfirmState] = useState<(ConfirmOpts & { resolve: (v: boolean) => void }) | null>(null);
  const [promptState, setPromptState] = useState<(PromptOpts & { resolve: (v: string | null) => void }) | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const promptInput = useRef<HTMLInputElement>(null);

  const confirm = useCallback((o: ConfirmOpts) =>
    new Promise<boolean>((resolve) => setConfirmState({ ...o, resolve })), []);
  const promptText = useCallback((o: PromptOpts) =>
    new Promise<string | null>((resolve) => setPromptState({ ...o, resolve })), []);
  const toast = useCallback((kind: Toast["kind"], text: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, kind, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  _api = { confirm, promptText, toast };

  return (
    <DialogCtx.Provider value={{ confirm, promptText, toast }}>
      {children}

      {(confirmState || promptState) && (
        <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-4"
             style={{ background: "rgb(14 25 40 / 0.55)", backdropFilter: "blur(3px)" }}
             onClick={() => {
               confirmState?.resolve(false); setConfirmState(null);
               promptState?.resolve(null); setPromptState(null);
             }}>
          <div className="card w-full max-w-sm p-6 pop-in" style={{ boxShadow: "var(--shadow-pop)" }}
               onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <h3 className="text-lg font-black">{(confirmState ?? promptState)!.title}</h3>
            {(confirmState ?? promptState)!.body && (
              <p className="mt-1.5 text-[var(--text-soft)] leading-relaxed">{(confirmState ?? promptState)!.body}</p>
            )}
            {promptState && (
              <input ref={promptInput} className="input mt-3" autoFocus
                     placeholder={promptState.placeholder} defaultValue={promptState.defaultValue}
                     onKeyDown={(e) => {
                       if (e.key === "Enter") { promptState.resolve(promptInput.current?.value ?? ""); setPromptState(null); }
                     }} />
            )}
            <div className="mt-5 flex gap-2">
              <button className="btn btn-ghost flex-1"
                      onClick={() => {
                        confirmState?.resolve(false); setConfirmState(null);
                        promptState?.resolve(null); setPromptState(null);
                      }}>
                취소
              </button>
              <button className={`btn flex-1 ${confirmState?.danger ? "" : "btn-primary"}`}
                      style={confirmState?.danger ? { background: "var(--color-danger)", color: "#fff" } : undefined}
                      onClick={() => {
                        if (confirmState) { confirmState.resolve(true); setConfirmState(null); }
                        if (promptState) { promptState.resolve(promptInput.current?.value ?? ""); setPromptState(null); }
                      }}>
                {confirmState?.confirmLabel ?? "확인"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 토스트 */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[95] flex flex-col gap-2 items-center pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pop-in px-4 py-3 rounded-xl font-bold text-white flex items-center gap-2"
               style={{ background: t.kind === "success" ? "var(--color-positive)" : t.kind === "error" ? "var(--color-danger)" : "var(--color-brand-800)",
                        boxShadow: "var(--shadow-pop)" }}>
            {t.kind === "success" ? "✓" : t.kind === "error" ? "!" : "·"} {t.text}
          </div>
        ))}
      </div>
    </DialogCtx.Provider>
  );
}
