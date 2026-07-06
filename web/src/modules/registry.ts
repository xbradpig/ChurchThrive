/** 모듈 레지스트리 — 스토어·메뉴·라우팅·권한의 단일 소스 (ecosystem-architecture §2) */

export type ModuleLevel = "viewer" | "manager" | "admin";

export type ModuleDef = {
  key: string;
  name: string;
  icon: string;
  tagline: string;
  description: string;
  core?: boolean;                 // 코어 = 항상 설치·해지 불가
  home: string;
  adminHome?: string;
  memberVisible?: boolean;        // 교인 메뉴 노출 여부
  scopes: string[];               // 설치 동의 화면 표기
  priceLabel: string;
};

export const MODULES: ModuleDef[] = [
  {
    key: "core", name: "교적", icon: "📇", core: true,
    tagline: "교인카드·동의 관리·조직",
    description: "교인 명부와 교적카드, 항목별 공개 동의, 부서·직분 관리. 모든 교회의 기본입니다.",
    home: "/me", adminHome: "/admin", memberVisible: true,
    scopes: [], priceLabel: "기본 포함",
  },
  {
    key: "attendance", name: "출석", icon: "✅",
    tagline: "탭 한 번 출석 체크 · QR · 자동 감지",
    description: "ㄱ~ㅎ 카드 체크, 교인별 QR 스캔, WiFi/BLE 자동 감지(장비), 장기 미출석 알림, 이름만 신규 등록.",
    home: "/check", adminHome: "/admin",
    memberVisible: false,
    scopes: ["교인 이름·부서 (읽기)", "출석 기록 (읽기·쓰기)", "푸시 알림 발송"],
    priceLabel: "무료 (파일럿)",
  },
  {
    key: "verse", name: "말씀 암송", icon: "📖",
    tagline: "주차별 구절 · 암송 체크 · 암송률",
    description: "매주 암송 구절을 등록하면 교인이 확인하고 암송 체크합니다. MATCH(암송·질문·대화·묵상·순종) 흐름 안내 포함.",
    home: "/m/verse", adminHome: "/m/verse/admin", memberVisible: true,
    scopes: ["교인 이름·부서 (읽기)", "암송 기록 (읽기·쓰기)"],
    priceLabel: "무료 (파일럿)",
  },
  {
    key: "notice", name: "공지·소통", icon: "📢",
    tagline: "교회 소식을 한 곳에서",
    description: "공지사항을 발행하면 교인 홈과 소식 화면에 바로 나타납니다. 부서별 대상 지정 가능.",
    home: "/m/notice", memberVisible: true,
    scopes: ["교인 부서 (읽기)", "공지 (읽기·쓰기)"], priceLabel: "무료 (파일럿)",
  },
  {
    key: "visitation", name: "심방", icon: "🏠",
    tagline: "요청 · 배정 · 기록",
    description: "교인이 심방을 요청하고, 교역자가 배정·기록합니다. 심방 내용은 담당자 등급만 열람합니다.",
    home: "/m/visitation", memberVisible: true,
    scopes: ["교인 이름 (읽기)", "심방 기록 (담당자 한정)"], priceLabel: "무료 (파일럿)",
  },
  {
    key: "newcomer", name: "새가족", icon: "🌱",
    tagline: "등록 → 정착 4단계 추적",
    description: "출석에서 등록된 새가족의 정착 과정을 단계별로 관리합니다.",
    home: "/m/newcomer", memberVisible: false,
    scopes: ["교인 이름·유형 (읽기)", "정착 단계 (읽기·쓰기)"], priceLabel: "무료 (파일럿)",
  },
  {
    key: "training", name: "훈련·교육", icon: "🎓",
    tagline: "과정 개설 · 수강 · 수료",
    description: "제자훈련·성경공부 과정을 열고 수강·수료를 관리합니다.",
    home: "/m/training", memberVisible: true,
    scopes: ["교인 이름 (읽기)", "수강 기록 (읽기·쓰기)"], priceLabel: "무료 (파일럿)",
  },
  {
    key: "giving", name: "헌금 기록", icon: "💝",
    tagline: "기록 · 본인 조회 · 연간 합계",
    description: "헌금을 기록하고 교인은 자기 내역만 봅니다. 재정 담당자 외에는 교역자도 열람할 수 없습니다.",
    home: "/m/giving", memberVisible: true,
    scopes: ["헌금 기록 (재정 담당자·본인 한정)"], priceLabel: "무료 (파일럿)",
  },
  {
    key: "bulletin", name: "전자주보", icon: "📰",
    tagline: "이번 주 주보를 폰에서",
    description: "주보를 작성해 발행하면 교인이 어디서든 봅니다.",
    home: "/m/bulletin", memberVisible: true,
    scopes: ["주보 (읽기·쓰기)"], priceLabel: "무료 (파일럿)",
  },
];

export const getModule = (key: string) => MODULES.find((m) => m.key === key);

/* ================= 사이드 네비 매트릭스 (ui-upgrade detail_goal R1) =================
   상태: visible(활성) / disabled(🔒 자격 존재·미보유 → 승급 안내) / hidden
   누적 스택: 상위 등급이 하위 메뉴를 잃지 않음 (D1) */

export type NavState = "visible" | "disabled" | "hidden";
export type NavSubItem = { key: string; label: string; href: string };
export type NavItem = { key: string; label: string; icon: string; href: string; state: NavState; sub?: NavSubItem[] };
export type NavSection = { group: string; items: NavItem[] };

export type NavCtx = {
  role: "superadmin" | "pastor" | "dept_leader" | "checker" | "member";
  grants: Record<string, string>;          // module → level
  modules: Set<string>;                    // enabled modules
  isPlatformAdmin: boolean;
};

export function buildNav(ctx: NavCtx): NavSection[] {
  const { role, grants, modules, isPlatformAdmin } = ctx;
  const isChurchStaff = role === "superadmin" || role === "pastor";
  const attOp = isChurchStaff || role === "dept_leader" || role === "checker" || !!grants["attendance"];
  const s = (cond: boolean, elseState: NavState = "hidden"): NavState => (cond ? "visible" : elseState);

  const my: NavItem[] = [
    { key: "home", label: "홈", icon: "🏠", href: "/home", state: "visible" },
    { key: "me", label: "내 교적", icon: "📇", href: "/me", state: "visible" },
  ];
  // 설치된 교인용 모듈은 자동으로 내 공간에 (registry 단일 소스)
  for (const m of MODULES) {
    if (!m.core && m.memberVisible && modules.has(m.key)) {
      my.push({ key: m.key, label: m.name, icon: m.icon, href: m.home, state: "visible" });
    }
  }

  const work: NavItem[] = [];
  if (modules.has("attendance")) {
    work.push({ key: "check", label: "출석 체크", icon: "✅", href: "/check", state: s(attOp) });
    work.push({ key: "scan", label: "QR 스캔", icon: "📷", href: "/scan", state: s(attOp) });
    work.push({ key: "invites", label: "교인 초대", icon: "📲", href: "/invites", state: s(attOp) });
  }
  if (modules.has("verse") && (isChurchStaff || grants["verse"] === "admin" || grants["verse"] === "manager")) {
    work.push({ key: "verse-admin", label: "말씀 암송 관리", icon: "📖", href: "/m/verse/admin", state: "visible" });
  }
  if (modules.has("newcomer") && (isChurchStaff || !!grants["newcomer"])) {
    work.push({ key: "newcomer", label: "새가족 관리", icon: "🌱", href: "/m/newcomer", state: "visible" });
  }

  const ops: NavItem[] = [
    // 자격 존재·미보유 → disabled (승급 동선): 담당자·부서담당자에게 잠금 표시
    { key: "church", label: "교회 관리", icon: "🏛", href: "/church",
      state: isChurchStaff ? "visible"
        : (role === "dept_leader" || role === "checker" || Object.keys(grants).length > 0) ? "disabled" : "hidden",
      sub: isChurchStaff ? [
        { key: "church-overview", label: "현황", href: "/church?tab=overview" },
        { key: "church-members", label: "교인 명부", href: "/church?tab=members" },
        { key: "church-departments", label: "부서 관리", href: "/church?tab=departments" },
        { key: "church-absentees", label: "미출석·케어", href: "/church?tab=absentees" },
        { key: "church-permissions", label: "권한·담당자", href: "/church?tab=permissions" },
        { key: "church-events", label: "이벤트", href: "/church?tab=events" },
        { key: "church-store", label: "모듈 스토어", href: "/store" },
        { key: "church-import", label: "교인 일괄 등록", href: "/church/import" },
        { key: "church-export", label: "내보내기", href: "/church?tab=export" },
        { key: "church-settings", label: "교회 설정", href: "/church?tab=settings" },
      ] : undefined },
    { key: "platform", label: "시스템 관리", icon: "🛠", href: "/platform",
      state: isPlatformAdmin ? "visible" : role === "superadmin" ? "disabled" : "hidden" },
  ];

  const sections: NavSection[] = [{ group: "내 공간", items: my }];
  const workVisible = work.filter((w) => w.state !== "hidden");
  if (workVisible.length) sections.push({ group: "사역", items: workVisible });
  const opsVisible = ops.filter((o) => o.state !== "hidden");
  if (opsVisible.length) sections.push({ group: "운영", items: opsVisible });
  return sections;
}
