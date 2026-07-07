import { redirect } from "next/navigation";

/** 기존 URL 하위 호환 (북마크 보호 — ui-upgrade D5) */
export default function AdminRedirect() {
  redirect("/church");
}
