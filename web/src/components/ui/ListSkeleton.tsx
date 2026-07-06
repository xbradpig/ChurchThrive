/** 목록 스켈레톤 — 로딩 중 구조 미리보기 (흰 화면 방지) */
export default function ListSkeleton({ rows = 6, avatar = true }: { rows?: number; avatar?: boolean }) {
  return (
    <div className="card divide-y divide-[var(--line)]" aria-busy="true" aria-label="불러오는 중">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          {avatar && <span className="skeleton !rounded-full w-10 h-10 shrink-0" />}
          <span className="flex flex-col gap-1.5 flex-1">
            <span className="skeleton h-4" style={{ width: `${45 + (i * 13) % 35}%` }} />
            <span className="skeleton h-3" style={{ width: `${25 + (i * 7) % 30}%` }} />
          </span>
        </div>
      ))}
    </div>
  );
}
