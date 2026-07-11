import Link from "next/link";

const APP_URLS = {
  start: "/register-intro",
  login: "/login",
  partnerMail: "mailto:partner@churchthrive.org",
  contactMail: "mailto:hello@churchthrive.org",
};

const PRODUCT_PILLARS = [
  {
    label: "출석",
    title: "탭 한 번, 또는 자동 출석",
    desc: "ㄱ~ㅎ 카드, QR 스캔, WiFi/BLE 자동 감지까지 교회 상황에 맞게 출석을 기록합니다.",
  },
  {
    label: "교적",
    title: "교인카드와 조직을 한 곳에",
    desc: "교인 명부, 가족 관계, 부서, 직분, 동의 상태를 안전하게 관리합니다.",
  },
  {
    label: "케어",
    title: "놓치는 성도가 없도록",
    desc: "2주 이상 미출석, 새가족 정착, 심방 요청처럼 돌봄이 필요한 흐름을 홈에서 바로 확인합니다.",
  },
  {
    label: "말씀",
    title: "말씀 암송과 노트",
    desc: "주차별 암송 구절, 말씀노트, 작성 여부 통계를 통해 말씀 훈련을 생활 리듬으로 만듭니다.",
  },
  {
    label: "운영",
    title: "공지·일정·훈련·주보",
    desc: "공지, 행사, 제자훈련, 전자주보 같은 사역 모듈을 필요할 때 켜서 사용합니다.",
  },
  {
    label: "보안",
    title: "교회별 데이터 분리",
    desc: "교회 간 데이터는 분리되고, 민감 정보는 관리자 승인과 본인 동의를 모두 거쳐야 열립니다.",
  },
];

const START_STEPS = [
  ["1", "교회 등록 신청", "교회 이름, 교단, 담당자 연락처만 제출합니다."],
  ["2", "확인 후 승인", "건강한 교회 공간을 위해 등록 정보를 확인합니다."],
  ["3", "이번 주일부터 사용", "교인 명단을 올리고 출석·교적·모듈을 바로 시작합니다."],
];

const DIFFERENTIATORS = [
  {
    title: "어르신도 쓰는 큰 글씨 UX",
    desc: "출석 담당자는 큰 카드에서 탭하고, 성도는 QR이나 문자 링크로 시작합니다. 앱스토어 설치가 필요 없습니다.",
  },
  {
    title: "역할별 하나의 사이드바",
    desc: "교인, 출석 담당자, 부서장, 교역자, 관리자가 자기 역할에 맞는 메뉴만 봅니다.",
  },
  {
    title: "필요한 기능만 설치",
    desc: "코어는 가볍게 시작하고, 공지·심방·새가족·훈련·헌금·주보 같은 모듈을 교회 상황에 맞게 더합니다.",
  },
  {
    title: "개인정보 이중 잠금",
    desc: "연락처와 심방 기록은 관리자 승인과 교인 본인 동의가 모두 있어야 열람됩니다.",
  },
];

const VALUES = [
  ["섬김의 마음", "교회의 본질은 섬김입니다. 기술로 목회자와 성도의 섬김을 돕습니다."],
  ["지혜로운 혁신", "전통의 가치를 존중하며, 시대에 맞는 지혜로운 변화를 추구합니다."],
  ["투명한 운영", "기록과 권한, 의사결정의 흐름을 투명하게 남겨 신뢰를 세웁니다."],
  ["함께하는 성장", "혼자가 아닌 함께, 개인의 성공이 공동체의 성장이 되도록 만듭니다."],
];

const PARTNER_PRINCIPLES = [
  ["기여도 기반 보상", "창출한 가치에 비례하는 공정한 보상 체계를 만들어갑니다."],
  ["수익 공유", "서비스가 수익을 만들면 기여도에 따라 파트너들과 나눕니다."],
  ["유연한 참여", "풀타임이 아니어도 괜찮습니다. 본업과 병행하며 기여할 수 있습니다."],
  ["투명한 운영", "의사결정과 재정 흐름을 파트너에게 투명하게 공개합니다."],
];

const PARTNER_FIELDS: [string, string, string[]][] = [
  ["개발자", "Frontend, Backend, Mobile", ["Next.js", "Node.js", "React Native", "TypeScript"]],
  ["UI/UX 디자이너", "교회 현장에 맞는 경험 설계", ["Figma", "UI Design", "UX Research"]],
  ["마케팅/홍보", "교회 네트워크와 콘텐츠 확산", ["콘텐츠", "SNS", "영상", "교회 네트워크"]],
  ["기획/운영", "서비스 기획과 고객 지원", ["서비스 기획", "문서화", "고객 지원"]],
];

const FAQS = [
  [
    "등록하면 바로 쓸 수 있나요?",
    "등록 정보를 확인한 뒤 승인 메일을 보내드립니다. 승인 후 비밀번호만 정하면 바로 교회 관리 화면을 사용할 수 있습니다.",
  ],
  [
    "교인들이 앱을 설치해야 하나요?",
    "아니요. 웹 주소로 바로 쓰고, 홈 화면에 추가하면 앱처럼 동작합니다. 어르신은 초대 링크나 QR로 간단히 시작합니다.",
  ],
  [
    "기존 엑셀 교적을 옮길 수 있나요?",
    "네. 교인 명단을 일괄 등록할 수 있고, 교회 상황에 맞춰 부서와 역할을 정리할 수 있습니다.",
  ],
  [
    "헌금이나 심방 기록도 안전한가요?",
    "민감 정보는 권한과 동의를 분리합니다. 헌금 내역은 재정 담당자와 본인 중심으로 제한하고, 권한 변경은 감사 기록으로 남깁니다.",
  ],
];

export default function Landing() {
  return (
    <main className="min-h-dvh overflow-hidden bg-[var(--bg)] pt-[4.5rem]">
      <header className="fixed left-0 right-0 top-0 z-40 border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--bg)_90%,transparent)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-3">
          <a href="#top" className="flex items-center gap-2" aria-label="ChurchThrive 처음으로">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-brand-800)] text-lg text-white">C</span>
            <span>
              <b className="block text-[var(--color-brand-800)]">ChurchThrive</b>
              <span className="block text-xs text-[var(--text-soft)]">교회 관리 플랫폼</span>
            </span>
          </a>
          <nav className="ml-auto hidden items-center gap-5 text-sm font-bold text-[var(--text-soft)] lg:flex">
            <a href="#features" className="hover:text-[var(--color-brand-700)]">기능</a>
            <a href="#difference" className="hover:text-[var(--color-brand-700)]">차별점</a>
            <a href="#mission" className="hover:text-[var(--color-brand-700)]">소개</a>
            <a href="#pricing" className="hover:text-[var(--color-brand-700)]">요금</a>
            <a href="#partners" className="hover:text-[var(--color-brand-700)]">파트너</a>
            <a href="#faq" className="hover:text-[var(--color-brand-700)]">FAQ</a>
          </nav>
          <div className="ml-auto flex items-center gap-2 lg:ml-4">
            <Link href={APP_URLS.login} className="btn btn-ghost !min-h-10 !px-3 text-sm sm:!px-4">로그인</Link>
            <Link href={APP_URLS.start} className="btn btn-primary !min-h-10 !px-3 text-sm sm:!px-4">시작하기</Link>
          </div>
        </div>
      </header>

      <section id="top" className="relative px-5 pb-14 pt-14 text-white sm:pb-20 sm:pt-20">
        <div className="absolute inset-0 bg-[linear-gradient(145deg,var(--color-brand-950),var(--color-brand-800)_48%,var(--color-auto)_115%)]" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-[linear-gradient(180deg,transparent,var(--bg))]" />
        <div className="relative mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <span className="badge bg-white/10 text-[var(--color-accent-soft)]">
              교회 관리의 새로운 패러다임
            </span>
            <h1 className="mt-5 max-w-3xl text-4xl font-black leading-[1.08] sm:text-5xl lg:text-6xl">
              교회의 건강한 성장을
              <span className="block text-[var(--color-accent-soft)]">운영 구조로 돕습니다</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/80 sm:text-xl">
              출석은 자동으로, 교적은 안전하게, 필요한 기능은 모듈로.
              ChurchThrive는 목회자와 행정 담당자가 본연의 사역에 더 집중하도록 돕는 통합 교회 관리 플랫폼입니다.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href={APP_URLS.start} className="btn text-base sm:text-lg" style={{ background: "var(--color-accent)", color: "var(--color-brand-950)" }}>
                우리 교회 등록하기
              </Link>
              <a href="#features" className="btn border border-white/30 bg-white/10 text-base text-white hover:bg-white/15 sm:text-lg">
                기능 살펴보기
              </a>
            </div>
            <p className="mt-4 text-sm text-white/60">파일럿 기간 핵심 기능 무료 · 카드 등록 없음 · 웹/PWA 지원</p>
          </div>

          <div className="rounded-[1.75rem] border border-white/15 bg-white/10 p-3 shadow-[0_24px_90px_-32px_rgb(0_0_0/0.65)] backdrop-blur">
            <div className="rounded-[1.25rem] bg-[var(--surface)] p-5 text-[var(--text)]">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase text-[var(--text-soft)]">오늘의 교회 현황</p>
                  <b className="text-xl text-[var(--color-brand-800)]">주일예배 운영 보드</b>
                </div>
                <span className="badge bg-[var(--color-positive-soft)] text-[var(--color-positive)]">실시간</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  ["출석", "자동 집계"],
                  ["미출석", "케어 알림"],
                  ["새가족", "정착 단계"],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-xl border border-[var(--line)] bg-[var(--color-sand-50)] p-3">
                    <p className="text-xs text-[var(--text-soft)]">{k}</p>
                    <b className="mt-1 block text-sm text-[var(--color-brand-800)]">{v}</b>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-2">
                {[
                  ["교적 수정 요청", "승인 대기"],
                  ["2주 이상 미출석", "담당자 확인"],
                  ["이번 주 암송", "교인 홈 노출"],
                ].map(([label, state]) => (
                  <div key={label} className="flex items-center gap-3 rounded-xl border border-[var(--line)] bg-white p-3">
                    <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-accent)]" />
                    <b className="text-sm">{label}</b>
                    <span className="ml-auto text-xs font-bold text-[var(--text-soft)]">{state}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-14">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <span className="badge bg-[var(--color-accent-soft)] text-[var(--color-brand-800)]">왜 필요한가</span>
            <h2 className="mt-4 text-3xl font-black text-[var(--color-brand-800)] sm:text-4xl">
              엑셀, 카카오톡, 여러 도구 사이에서 사역 시간이 흩어집니다
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              "교인 정보와 출석 기록이 분리되어 있습니다.",
              "새가족과 장기 미출석 케어가 담당자의 기억에 의존합니다.",
              "공지, 심방, 교육, 주보가 서로 다른 채널에서 흩어집니다.",
              "민감 정보 권한과 교인 동의를 수기로 관리하기 어렵습니다.",
            ].map((text) => (
              <div key={text} className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
                <p className="leading-relaxed text-[var(--text-soft)]">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="scroll-mt-20 px-5 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto mb-10 max-w-3xl text-center">
            <span className="badge bg-[var(--color-brand-100)] text-[var(--color-brand-700)]">실제 서비스 기능</span>
            <h2 className="mt-4 text-3xl font-black text-[var(--color-brand-800)] sm:text-4xl">
              교회 사역에 필요한 핵심 흐름을 한 곳에서 관리합니다
            </h2>
            <p className="mt-3 text-[var(--text-soft)]">
              코어 기능으로 가볍게 시작하고, 교회 상황에 맞는 모듈을 더해 운영 범위를 넓힐 수 있습니다.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PRODUCT_PILLARS.map((feature) => (
              <article key={feature.title} className="card card-hover p-6">
                <span className="badge bg-[var(--color-sand-100)] text-[var(--color-brand-700)]">{feature.label}</span>
                <h3 className="mt-4 text-xl font-black text-[var(--color-brand-800)]">{feature.title}</h3>
                <p className="mt-2 leading-relaxed text-[var(--text-soft)]">{feature.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[var(--surface-soft)] px-5 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-black text-[var(--color-brand-800)]">시작은 3단계면 충분합니다</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {START_STEPS.map(([n, title, desc]) => (
              <div key={n} className="rounded-2xl bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-brand-700)] text-lg font-black text-white">{n}</span>
                <h3 className="mt-4 text-lg font-black text-[var(--color-brand-800)]">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-soft)]">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="difference" className="scroll-mt-20 px-5 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <span className="badge bg-[var(--color-auto-soft)] text-[var(--color-auto)]">왜 다른가</span>
              <h2 className="mt-4 text-3xl font-black text-[var(--color-brand-800)]">
                한국 교회 현장에 맞춰 처음부터 다시 설계했습니다
              </h2>
              <p className="mt-4 leading-relaxed text-[var(--text-soft)]">
                ChurchThrive는 기능 목록을 늘리는 데서 멈추지 않습니다. 실제 교회 운영자, 출석 담당자, 어르신 성도가 같은 흐름 안에서 사용할 수 있도록 화면과 권한을 정리합니다.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {DIFFERENTIATORS.map((item) => (
                <div key={item.title} className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
                  <h3 className="font-black text-[var(--color-brand-800)]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--text-soft)]">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="mission" className="scroll-mt-20 bg-[var(--color-brand-950)] px-5 py-16 text-white">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div>
              <span className="badge bg-white/10 text-[var(--color-accent-soft)]">Mission · Vision · Core Values</span>
              <h2 className="mt-4 text-3xl font-black sm:text-4xl">
                교회가 본질에 집중하도록 기술로 섬깁니다
              </h2>
              <p className="mt-4 leading-relaxed text-white/70">
                행정 부담을 줄이고, 목회와 양육에 더 많은 시간을 쓸 수 있게 돕습니다.
                규모와 관계없이 한국의 모든 교회가 효과적인 도구로 건강하게 성장하는 세상을 지향합니다.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {VALUES.map(([title, desc]) => (
                <div key={title} className="rounded-2xl border border-white/15 bg-white/10 p-5">
                  <h3 className="font-black text-[var(--color-accent-soft)]">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/70">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="scroll-mt-20 px-5 py-16">
        <div className="mx-auto max-w-5xl text-center">
          <span className="badge bg-[var(--color-positive-soft)] text-[var(--color-positive)]">요금</span>
          <h2 className="mt-4 text-3xl font-black text-[var(--color-brand-800)]">교회 규모에 맞게, 필요한 만큼만</h2>
          <p className="mx-auto mt-3 max-w-2xl text-[var(--text-soft)]">
            교적과 출석 같은 코어 기능으로 시작하고, 모듈 스토어에서 사역에 필요한 기능을 더하는 구조입니다.
          </p>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-7 text-left shadow-[var(--shadow-card)]">
              <p className="font-black text-[var(--color-brand-800)]">코어</p>
              <p className="mt-2 text-4xl font-black">무료</p>
              <p className="mt-3 leading-relaxed text-[var(--text-soft)]">
                교적 관리, 출석 체크, QR, 교인 초대, 부서 관리, 가입 승인.
              </p>
            </div>
            <div className="rounded-2xl border-2 border-[var(--color-accent)] bg-[var(--surface)] p-7 text-left shadow-[var(--shadow-card)]">
              <p className="font-black text-[var(--color-brand-800)]">모듈 스토어</p>
              <p className="mt-2 text-4xl font-black">모듈별 구독</p>
              <p className="mt-3 leading-relaxed text-[var(--text-soft)]">
                공지, 심방, 새가족, 훈련, 헌금 기록, 전자주보, 말씀노트 등.
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm text-[var(--text-soft)]">파일럿 기간에는 핵심 기능을 무료로 제공합니다.</p>
        </div>
      </section>

      <section id="partners" className="scroll-mt-20 bg-[var(--surface-soft)] px-5 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto mb-10 max-w-3xl text-center">
            <span className="badge bg-[var(--color-brand-100)] text-[var(--color-brand-700)]">직원이 아닌 파트너</span>
            <h2 className="mt-4 text-3xl font-black text-[var(--color-brand-800)] sm:text-4xl">
              함께 만들어갈 동역자를 찾습니다
            </h2>
            <p className="mt-3 leading-relaxed text-[var(--text-soft)]">
              ChurchThrive는 기여한 만큼 함께 나누는 공정하고 투명한 협력 모델을 추구합니다.
              정규직, 파트타임, 재능 기부 모두 열려 있습니다.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            {PARTNER_PRINCIPLES.map(([title, desc]) => (
              <div key={title} className="rounded-2xl bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
                <h3 className="font-black text-[var(--color-brand-800)]">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-soft)]">{desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            {PARTNER_FIELDS.map(([title, desc, tags]) => (
              <div key={title} className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
                <h3 className="font-black text-[var(--color-brand-800)]">{title}</h3>
                <p className="mt-1 text-sm text-[var(--text-soft)]">{desc}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <span key={tag} className="badge bg-[var(--color-sand-100)] text-[var(--text-soft)]">{tag}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <a href={APP_URLS.partnerMail} className="btn btn-primary !px-8">파트너 지원하기</a>
            <p className="mt-3 text-sm text-[var(--text-soft)]">파트너 문의: partner@churchthrive.org</p>
          </div>
        </div>
      </section>

      <section id="faq" className="scroll-mt-20 px-5 py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-3xl font-black text-[var(--color-brand-800)]">자주 묻는 질문</h2>
          <div className="mt-8 flex flex-col gap-3">
            {FAQS.map(([question, answer]) => (
              <details key={question} className="card group p-5">
                <summary className="flex cursor-pointer list-none items-center gap-3 font-black text-[var(--color-brand-800)]">
                  {question}
                  <span className="ml-auto text-xl text-[var(--text-soft)] transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-[var(--text-soft)]">{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 text-center text-white" style={{ background: "linear-gradient(135deg, var(--color-brand-900), var(--color-brand-700))" }}>
        <h2 className="text-3xl font-black">이번 주일부터 교회 관리 흐름을 바꿔보세요</h2>
        <p className="mx-auto mt-3 max-w-2xl text-white/75">
          교회 등록부터 교인 관리까지, 작은 시작으로 충분합니다.
          ChurchThrive가 출석과 교적, 돌봄의 흐름을 함께 정리해드립니다.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href={APP_URLS.start} className="btn text-base sm:text-lg" style={{ background: "var(--color-accent)", color: "var(--color-brand-950)" }}>
            무료로 시작하기
          </Link>
          <a href={APP_URLS.contactMail} className="btn border border-white/30 bg-white/10 text-white hover:bg-white/15">
            문의하기
          </a>
        </div>
      </section>

      <footer className="px-5 py-8 text-center text-sm text-[var(--text-soft)]">
        <p>
          ChurchThrive — 교회를 위한 관리 플랫폼 · 문의{" "}
          <a className="font-bold text-[var(--color-brand-700)]" href={APP_URLS.contactMail}>hello@churchthrive.org</a>
        </p>
      </footer>
    </main>
  );
}
