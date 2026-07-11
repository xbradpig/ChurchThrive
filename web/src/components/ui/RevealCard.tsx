import Link from "next/link";

/**
 * RevealCard — 사진 롤업 카드 공통 템플릿 (docs/guides/reveal-card-template.md)
 * 도메인 비종속: 데이터 → 슬롯 매핑은 호출부 책임.
 * hover/focus-within 시 패널 롤업, 터치 기기(hover: none)는 정적 레이아웃 (CSS 처리).
 */
export type RevealCardProps = {
  /** 사진 URL. null이면 이니셜 폴백 렌더 */
  photoUrl: string | null;
  /** 폴백 이니셜/이모지 (photoUrl 없을 때) */
  fallbackText: string;
  /** 스크림·패널 공통 제목 (항상 노출) */
  title: React.ReactNode;
  /** 부제 — 직분, 카테고리 등 (항상 노출) */
  subtitle?: React.ReactNode;
  /** 우상단 오버레이 배지 슬롯 */
  badge?: React.ReactNode;
  /** 롤업 패널 내용 슬롯 — 행 3개 + 액션 1줄 이내 권장 */
  children?: React.ReactNode;
  /** 카드 전체 클릭 이동 (패널 내부 링크·버튼과 공존) */
  href?: string;
  /** href용 접근성 라벨 (예: "김은혜 교적 보기") */
  linkLabel?: string;
  /** 사진 비율. 기본 3/4 (세로형 인물) — 터치 기기는 항상 1/1 */
  aspect?: "3/4" | "1/1" | "4/3";
};

export default function RevealCard({
  photoUrl, fallbackText, title, subtitle, badge, children, href, linkLabel, aspect,
}: RevealCardProps) {
  return (
    <div className="reveal-card">
      <div className="reveal-card__media"
           style={aspect ? ({ "--reveal-aspect": aspect } as React.CSSProperties) : undefined}>
        {photoUrl ? <img src={photoUrl} alt="" loading="lazy" />
          : <div className="reveal-card__fallback">{fallbackText}</div>}
      </div>
      {href && <Link href={href} className="reveal-card__link" aria-label={linkLabel} />}
      {badge && <span className="reveal-card__badge">{badge}</span>}
      <div className="reveal-card__scrim" aria-hidden="true">
        <div className="font-black text-lg leading-tight">{title}</div>
        {subtitle && <div className="text-sm opacity-80">{subtitle}</div>}
      </div>
      <div className="reveal-card__panel">
        <div className="font-black leading-tight">{title}</div>
        {subtitle && <div className="text-sm text-[var(--text-soft)]">{subtitle}</div>}
        {children}
      </div>
    </div>
  );
}
