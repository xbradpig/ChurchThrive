import { redirect } from "next/navigation";

/** /{slug} → /{slug}/home (공개 랜딩 콘텐츠는 2단계 행사 모듈과 함께) */
export default async function ChurchRoot({ params }: { params: Promise<{ church: string }> }) {
  const { church } = await params;
  redirect(`/${church}/home`);
}
