import Link from "next/link";

/**
 * ChurchThrive 공개 랜딩 — 기존 ChurchThrive 마케팅 자산의 가치 카피
 * (섬김·지혜로운 혁신·투명한 운영, 교회별 데이터 분리)를 재활용하고
 * 검증된 차별화(제로터치 출석·마켓 스토어·시니어 UX)를 전면에.
 */

const FEATURES = [
  { icon: "✅", title: "탭 한 번 출석 체크", desc: "ㄱ~ㅎ 카드에서 탭 한 번. 어르신 얼굴 사진과 큰 글씨로 누구나 실수 없이 체크합니다." },
  { icon: "📡", title: "아무것도 안 해도 되는 출석", desc: "교회 와이파이에 폰이 연결되는 순간 자동으로 출석됩니다. 폰이 없는 어르신은 목걸이 태그로." },
  { icon: "🏪", title: "필요한 기능만 골라 설치", desc: "마켓 스토어에서 출석·말씀 암송·심방 등 우리 교회에 필요한 기능만 켜서 씁니다." },
  { icon: "📖", title: "말씀 암송 훈련", desc: "매주 구절을 등록하면 온 교인이 함께 암송하고, 암송률이 자동 집계됩니다." },
  { icon: "🔔", title: "놓치는 성도가 없도록", desc: "2주 이상 안 나오신 분을 자동으로 알려드립니다. 케어 대상 어르신은 우선 표시됩니다." },
  { icon: "🔒", title: "교회별 완전한 데이터 분리", desc: "교회 간 데이터는 데이터베이스 차원에서 격리되고, 민감 정보는 본인 동의와 관리자 승인을 모두 거쳐야 열립니다." },
];

const STEPS = [
  { n: "1", title: "계정 만들기", desc: "이메일 하나로 시작" },
  { n: "2", title: "교회 등록", desc: "이름과 주소만 입력하면 기본 기능이 준비됩니다" },
  { n: "3", title: "바로 사용", desc: "교인 명단을 올리고, 이번 주일부터 출석 체크" },
];

const VALUES = [
  { title: "섬김의 마음", desc: "교회의 본질은 섬김입니다. 기술로 목회자와 성도의 섬김을 돕습니다." },
  { title: "지혜로운 혁신", desc: "전통의 가치를 존중하며, 시대에 맞는 지혜로운 변화를 추구합니다." },
  { title: "투명한 운영", desc: "모든 기록이 남고, 언제든 데이터를 내보낼 수 있습니다." },
];

export default function Landing() {
  return (
    <div className="min-h-dvh">
      {/* 헤더 */}
      <header className="flex items-center gap-2 px-5 py-4 max-w-5xl mx-auto">
        <span className="text-[var(--color-accent)] text-xl font-black">✝</span>
        <b className="text-lg text-[var(--color-brand-800)]">ChurchThrive</b>
        <div className="ml-auto flex gap-2">
          <Link href="/login" className="btn btn-ghost !min-h-10 text-sm">로그인</Link>
          <Link href="/signup" className="btn btn-primary !min-h-10 text-sm">시작하기</Link>
        </div>
      </header>

      {/* 히어로 */}
      <section className="px-5 pt-14 pb-16 text-center text-white"
               style={{ background: "linear-gradient(160deg, var(--color-brand-800), var(--color-brand-900))" }}>
        <div className="max-w-2xl mx-auto flex flex-col items-center gap-5">
          <span className="badge" style={{ background: "rgb(255 255 255 / 0.12)", color: "var(--color-accent)" }}>
            어르신이 많은 한국 교회를 위해 설계했습니다
          </span>
          <h1 className="text-4xl sm:text-5xl font-black leading-tight">
            교회 관리,<br />
            <span style={{ color: "var(--color-accent)" }}>이제 아무것도 안 해도 됩니다</span>
          </h1>
          <p className="text-lg opacity-85 leading-relaxed">
            출석은 자동으로, 교적은 안전하게, 기능은 골라서.<br />
            등록부터 사용까지 15분이면 충분합니다.
          </p>
          <div className="flex gap-3 mt-2">
            <Link href="/register-intro" className="btn text-lg !px-8"
                  style={{ background: "var(--color-accent)", color: "var(--color-brand-900)" }}>
              ⛪ 우리 교회 등록하기
            </Link>
          </div>
          <p className="text-sm opacity-60">파일럿 기간 전 기능 무료 · 카드 등록 없음</p>
        </div>
      </section>

      {/* 기능 */}
      <section className="px-5 py-16 max-w-5xl mx-auto">
        <h2 className="text-2xl font-black text-center text-[var(--color-brand-800)] mb-2">
          교회에 정말 필요한 것만 담았습니다
        </h2>
        <p className="text-center text-[var(--text-soft)] mb-10">모든 기능은 실제 교회에서 검증하며 만듭니다</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="card p-6">
              <span className="text-3xl">{f.icon}</span>
              <b className="block mt-3 text-lg text-[var(--color-brand-800)]">{f.title}</b>
              <p className="mt-1.5 text-sm text-[var(--text-soft)] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 시작 3단계 */}
      <section className="px-5 py-16" style={{ background: "var(--color-sand-100)" }}>
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-black text-center text-[var(--color-brand-800)] mb-10">
            시작은 이렇게 간단합니다
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {STEPS.map((s) => (
              <div key={s.n} className="card p-6 text-center">
                <span className="inline-flex w-10 h-10 rounded-full items-center justify-center font-black text-white"
                      style={{ background: "var(--color-brand-700)" }}>{s.n}</span>
                <b className="block mt-3">{s.title}</b>
                <p className="mt-1 text-sm text-[var(--text-soft)]">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 가치 (ChurchThrive 카피 재활용) */}
      <section className="px-5 py-16 max-w-4xl mx-auto">
        <div className="grid sm:grid-cols-3 gap-6 text-center">
          {VALUES.map((v) => (
            <div key={v.title}>
              <b className="text-lg text-[var(--color-brand-800)]">{v.title}</b>
              <p className="mt-2 text-sm text-[var(--text-soft)] leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 마지막 CTA */}
      {/* 차별점 — 업계 리뷰의 최대 불만 2가지를 정면으로 */}
      <section className="px-5 py-16 max-w-5xl mx-auto">
        <h2 className="text-2xl font-black text-center mb-2">기존 교회 프로그램과 무엇이 다른가요?</h2>
        <p className="text-center text-[var(--text-soft)] mb-8">해외 1위 제품 사용자들이 가장 많이 호소하는 불편을 처음부터 설계로 풀었습니다.</p>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="card p-6">
            <span className="text-3xl">🧭</span>
            <h3 className="font-black mt-2 mb-1">길 잃지 않는 하나의 사이드바</h3>
            <p className="text-sm text-[var(--text-soft)] leading-relaxed">
              기능마다 다른 화면을 오가지 않습니다. 출석·교적·공지·훈련 — 모든 기능이 한 네비게이션에
              역할에 맞게 자동으로 쌓입니다.
            </p>
          </div>
          <div className="card p-6">
            <span className="text-3xl">🙋</span>
            <h3 className="font-black mt-2 mb-1">어르신은 버튼 하나로 시작</h3>
            <p className="text-sm text-[var(--text-soft)] leading-relaxed">
              이메일도 비밀번호도 없이 — 담당자가 보낸 문자 링크나 QR을 통해
              [시작하기] 한 번이면 끝. 글자 크기도 취향대로 키울 수 있습니다.
            </p>
          </div>
          <div className="card p-6">
            <span className="text-3xl">🛡</span>
            <h3 className="font-black mt-2 mb-1">개인정보는 이중 잠금</h3>
            <p className="text-sm text-[var(--text-soft)] leading-relaxed">
              연락처·심방 기록은 관리자 승인과 교인 본인 동의가 모두 있어야 보입니다.
              헌금 내역은 재정 담당 외엔 교역자도 볼 수 없습니다.
            </p>
          </div>
        </div>
      </section>

      {/* 요금 */}
      <section className="px-5 py-16" style={{ background: "var(--color-sand-100)" }}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-black mb-2">교회 규모에 맞게, 쓰는 만큼만</h2>
          <p className="text-[var(--text-soft)] mb-8">교적·출석 등 핵심 기능은 무료입니다. 필요한 모듈만 골라 더하세요.</p>
          <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <div className="card p-6 text-left">
              <p className="font-black text-lg">코어</p>
              <p className="text-3xl font-black mt-1">무료</p>
              <p className="text-sm text-[var(--text-soft)] mt-2 leading-relaxed">
                교적 관리 · 출석 체크 · QR · 교인 초대 · 부서 관리 · 가입 승인
              </p>
            </div>
            <div className="card p-6 text-left" style={{ borderColor: "var(--color-accent)" }}>
              <p className="font-black text-lg">모듈 스토어</p>
              <p className="text-3xl font-black mt-1">모듈별 구독</p>
              <p className="text-sm text-[var(--text-soft)] mt-2 leading-relaxed">
                공지·심방·새가족·훈련·헌금 기록·전자주보 — 파일럿 기간 전 모듈 무료
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-5 py-16 max-w-3xl mx-auto">
        <h2 className="text-2xl font-black text-center mb-8">자주 묻는 질문</h2>
        <div className="flex flex-col gap-3">
          {[
            ["등록하면 바로 쓸 수 있나요?", "건강한 교회 생태계를 위해 등록 정보(교단·담임목사·연락처)를 확인한 뒤 승인해드립니다. 보통 1일 이내이며, 승인 메일의 링크로 비밀번호만 정하면 바로 시작됩니다."],
            ["교인들이 앱스토어에서 설치해야 하나요?", "아니요. 웹 주소로 바로 쓰고, 홈 화면에 추가하면 앱처럼 동작합니다. 어르신은 담당자가 보낸 초대 링크·QR로 가입 절차 없이 시작합니다."],
            ["기존 엑셀 교적을 옮길 수 있나요?", "네. 엑셀에서 복사해 붙여넣으면 미리보기 후 일괄 등록됩니다. 사진도 함께 옮겨드립니다."],
            ["교인 정보는 안전한가요?", "모든 데이터는 교회별로 격리되고, 민감 정보는 관리자 승인+본인 동의의 이중 잠금을 거칩니다. 모든 권한 변경은 감사 기록으로 남습니다."],
          ].map(([q, a]) => (
            <details key={q} className="card p-5 group">
              <summary className="font-black cursor-pointer list-none flex items-center">
                {q} <span className="ml-auto transition-transform group-open:rotate-45 text-xl text-[var(--text-soft)]">+</span>
              </summary>
              <p className="text-sm text-[var(--text-soft)] leading-relaxed mt-3">{a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="px-5 py-16 text-center text-white"
               style={{ background: "var(--color-brand-900)" }}>
        <h2 className="text-2xl font-black mb-3">이번 주일부터 시작해보세요</h2>
        <p className="opacity-75 mb-6">지금 등록하면 15분 뒤, 우리 교회 출석부가 준비됩니다.</p>
        <Link href="/register-intro" className="btn text-lg !px-8"
              style={{ background: "var(--color-accent)", color: "var(--color-brand-900)" }}>
          무료로 시작하기
        </Link>
      </section>

      <footer className="px-5 py-8 text-center text-sm text-[var(--text-soft)]">
        ✝ ChurchThrive — 교회를 위한 관리 플랫폼 · 문의: hello@churchthrive.kr
      </footer>
    </div>
  );
}
