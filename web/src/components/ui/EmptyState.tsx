"use client";

/** 빈 상태 — "없습니다"가 아니라 다음 행동을 제시 */
export default function EmptyState({ icon, title, body, actionLabel, onAction }: {
  icon: string; title: string; body?: string; actionLabel?: string; onAction?: () => void;
}) {
  return (
    <div className="p-10 text-center flex flex-col items-center gap-2" data-empty>
      <span className="text-4xl opacity-80">{icon}</span>
      <b className="text-lg">{title}</b>
      {body && <p className="text-sm text-[var(--text-soft)] leading-relaxed">{body}</p>}
      {actionLabel && onAction && (
        <button className="btn btn-primary !min-h-11 text-sm mt-2" onClick={onAction}>{actionLabel}</button>
      )}
    </div>
  );
}
