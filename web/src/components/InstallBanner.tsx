"use client";

import { useEffect, useState } from "react";

/** 홈 화면 앱 설치 안내 (PWA A2HS) — 설치돼 있으면 숨김, 닫으면 30일 기억 */
export default function InstallBanner() {
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [deferred, setDeferred] = useState<Event & { prompt?: () => void } | null>(null);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) return;   // 이미 앱으로 사용 중
    if (localStorage.getItem("install-dismissed") &&
        Date.now() - Number(localStorage.getItem("install-dismissed")) < 30 * 864e5) return;
    setIsIOS(/iPhone|iPad|iPod/.test(navigator.userAgent));
    setShow(true);
    const onPrompt = (e: Event) => { e.preventDefault(); setDeferred(e as never); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (!show) return null;
  return (
    <div className="card p-4 flex items-start gap-3" data-widget="install"
         style={{ borderColor: "var(--color-accent)" }}>
      <span className="text-2xl">📱</span>
      <div className="flex-1">
        <b>앱으로 설치하면 더 편해요</b>
        {deferred ? (
          <button className="btn btn-primary !min-h-11 text-sm mt-2 block"
                  onClick={() => deferred.prompt?.()}>
            지금 설치하기
          </button>
        ) : (
          <p className="text-sm text-[var(--text-soft)] mt-1 leading-relaxed">
            {isIOS
              ? <>사파리 아래 <b>공유 버튼(□↑)</b> → <b>홈 화면에 추가</b>를 눌러주세요.</>
              : <>브라우저 메뉴(⋮) → <b>앱 설치</b> 또는 <b>홈 화면에 추가</b>를 눌러주세요.</>}
          </p>
        )}
      </div>
      <button className="text-[var(--text-soft)] p-1" aria-label="닫기"
              onClick={() => { localStorage.setItem("install-dismissed", String(Date.now())); setShow(false); }}>
        ✕
      </button>
    </div>
  );
}
