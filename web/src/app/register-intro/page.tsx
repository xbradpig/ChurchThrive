import Link from "next/link";

/** 교회 등록 안내 — 승인제 정책 설명 (가입 전 첫 화면) */
export default function RegisterIntroPage() {
  return (
    <main className="min-h-dvh flex items-center justify-center p-6">
      <div className="w-full max-w-md flex flex-col gap-4 pop-in">
        <div className="text-center">
          <span className="text-4xl">⛪</span>
          <h1 className="text-2xl font-black text-[var(--color-brand-800)] mt-2">우리 교회 등록하기</h1>
          <p className="text-[var(--text-soft)] mt-1">등록부터 사용까지, 이렇게 진행됩니다</p>
        </div>

        {/* 절차 3단계 */}
        <div className="card p-5 flex flex-col gap-4">
          {[
            ["1", "신청서 제출", "계정 없이 교회 이름·교단·담임목사·연락처만 (약 3분)"],
            ["2", "확인 후 승인", "운영팀이 등록 정보를 확인합니다 (보통 1일 이내)"],
            ["3", "메일로 시작", "승인 메일의 가입 링크로 비밀번호만 정하면 바로 관리 시작"],
          ].map(([n, t, d]) => (
            <div key={n} className="flex gap-3 items-start">
              <span className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center font-black text-white"
                    style={{ background: "var(--color-brand-700)" }}>{n}</span>
              <span><b>{t}</b><span className="block text-sm text-[var(--text-soft)]">{d}</span></span>
            </div>
          ))}
        </div>

        {/* 승인제 정책 설명 */}
        <div className="card p-5" style={{ borderColor: "var(--color-accent)" }}>
          <h2 className="font-black text-[var(--color-brand-800)] mb-2">🛡 왜 승인 절차가 있나요?</h2>
          <p className="text-sm leading-relaxed">
            ChurchThrive는 <b>건강한 교회들의 공간</b>으로 지키기 위해,
            등록하신 교단·소속 정보를 확인한 뒤 사용을 승인해드립니다.
            이단·사이비 및 확인되지 않는 단체의 이용을 막기 위한 절차이니 양해 부탁드립니다.
          </p>
          <p className="text-xs text-[var(--text-soft)] mt-2">
            승인 전에는 기능이 잠겨 있으며, 등록 정보는 심사 목적으로만 사용됩니다.
            문의: hello@havrutaproject.org
          </p>
        </div>

        <Link href="/apply" className="btn btn-primary text-lg">
          신청서 작성하기 (1/3)
        </Link>
        <Link href="/login" className="btn btn-ghost text-sm">이미 계정이 있어요 — 로그인</Link>
      </div>
    </main>
  );
}
