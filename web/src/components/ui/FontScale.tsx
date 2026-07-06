"use client";

import { useEffect, useState } from "react";

const SCALES = [
  { px: 17, label: "기본" },
  { px: 19, label: "크게" },
  { px: 21, label: "아주 크게" },
];

/** 글자 크기 토글 (Toss 시니어 연구 — 큰 글씨 모드) */
export default function FontScale({ compact = false }: { compact?: boolean }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const saved = Number(localStorage.getItem("font-scale") ?? 0);
    if (saved > 0 && saved < SCALES.length) {
      setIdx(saved);
      document.documentElement.style.fontSize = `${SCALES[saved].px}px`;
    }
  }, []);

  function cycle() {
    const next = (idx + 1) % SCALES.length;
    setIdx(next);
    document.documentElement.style.fontSize = `${SCALES[next].px}px`;
    localStorage.setItem("font-scale", String(next));
  }

  if (compact) {
    return (
      <button onClick={cycle} aria-label={`글자 크기: ${SCALES[idx].label}`}
              className="min-w-11 min-h-11 rounded-lg font-black flex items-center justify-center"
              style={{ background: "rgb(255 255 255 / 0.12)", fontSize: 14 + idx * 2 }}>
        가
      </button>
    );
  }
  return (
    <button onClick={cycle} data-font-scale
            className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg font-bold text-[15px] opacity-75 hover:opacity-100 hover:bg-white/5 text-left">
      <span style={{ fontSize: 15 + idx * 3 }}>가</span>
      글자 크기 — {SCALES[idx].label}
    </button>
  );
}
