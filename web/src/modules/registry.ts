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
