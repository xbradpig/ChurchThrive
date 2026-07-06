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
];

export const getModule = (key: string) => MODULES.find((m) => m.key === key);

/* ================= 사이드 네비 매트릭스 (ui-upgrade detail_goal R1) =================
   상태: visible(활성) / disabled(🔒 자격 존재·미보유 → 승급 안내) / hidden
   누적 스택: 상위 등급이 하위 메뉴를 잃지 않음 (D1) */

export type NavState = "visible" | "disabled" | "hidden";
export type NavItem = { key: string; label: string; icon: string; href: string; state: NavState };
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
  if (modules.has("verse")) {
    my.push({ key: "verse", label: "말씀 암송", icon: "📖", href: "/m/verse", state: "visible" });
  }

  const work: NavItem[] = [];
  if (modules.has("attendance")) {
    work.push({ key: "check", label: "출석 체크", icon: "✅", href: "/check", state: s(attOp) });
    work.push({ key: "scan", label: "QR 스캔", icon: "📷", href: "/scan", state: s(attOp) });
  }
  if (modules.has("verse") && (isChurchStaff || grants["verse"] === "admin" || grants["verse"] === "manager")) {
    work.push({ key: "verse-admin", label: "말씀 암송 관리", icon: "📖", href: "/m/verse/admin", state: "visible" });
  }

  const ops: NavItem[] = [
    // 자격 존재·미보유 → disabled (승급 동선): 담당자·부서담당자에게 잠금 표시
    { key: "church", label: "교회 관리", icon: "🏛", href: "/church",
      state: isChurchStaff ? "visible"
        : (role === "dept_leader" || role === "checker" || Object.keys(grants).length > 0) ? "disabled" : "hidden" },
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
