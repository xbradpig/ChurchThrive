import Link from "next/link";

/** 미설치 모듈 접근 시 안내 (관리자에게만 설치 유도) */
export default function ModuleGate({ moduleName, isAdmin }: { moduleName: string; isAdmin: boolean }) {
  return (
    <main className="max-w-lg mx-auto p-6">
      <div className="card p-8 text-center flex flex-col gap-3 items-center">
        <span className="text-4xl">🏪</span>
        <b className="text-lg">{moduleName} 기능이 아직 설치되지 않았습니다</b>
        {isAdmin ? (
          <Link href="/store" className="btn btn-primary">마켓 스토어에서 설치하기</Link>
        ) : (
          <p className="text-[var(--text-soft)] text-sm">교회 관리자에게 설치를 요청해주세요.</p>
        )}
      </div>
    </main>
  );
}
