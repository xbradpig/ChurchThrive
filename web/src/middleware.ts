import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

const PUBLIC_PATHS = ["/login", "/signup", "/forgot-password", "/reset-password", "/register-intro", "/apply", "/api/apply", "/set-password", "/invite", "/api/invite", "/manifest.json", "/sw.js", "/icons"];

/** 경로 기반 테넌시 (church-url-tenancy W2) */
// 로그인 필요 + 테넌트 무관 루트 라우트 (slug로 오인 금지)
const ROOT_PRIVATE = new Set(["start", "join", "pending", "platform", "api", "register-church"]);
// 구 URL 1단계 세그먼트 → /{slug}/... 로 307 (북마크·PWA 하위호환)
const LEGACY_TENANT = new Set(["home", "church", "admin", "check", "scan", "me", "menu", "members", "invites", "m", "store"]);
const SLUG_RE = /^[a-z0-9][a-z0-9_-]{1,62}$/;
const CHURCH_COOKIE = "ct-church";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.SUPABASE_URL_INTERNAL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: { name: "sb-churchthrive-auth" },
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet: CookieToSet[]) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  const isPublic = path === "/" || PUBLIC_PATHS.some((p) => path.startsWith(p));

  if (isPublic) return response;
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url); // 307
  }

  const seg = path.split("/")[1] ?? "";
  const cookieSlug = request.cookies.get(CHURCH_COOKIE)?.value;

  // 1) 레거시 테넌트 경로 → 활성 교회 slug 접두 후 307 (301 금지: 캐시 비가역)
  if (LEGACY_TENANT.has(seg)) {
    let slug = cookieSlug && SLUG_RE.test(cookieSlug) ? cookieSlug : null;
    if (!slug) {
      const { data } = await supabase.rpc("my_church_slug");
      slug = typeof data === "string" && SLUG_RE.test(data) ? data : null;
    }
    const url = request.nextUrl.clone();
    if (!slug) {
      url.pathname = "/join";
      url.search = "";
      return NextResponse.redirect(url);
    }
    url.pathname = `/${slug}${path}`;
    return NextResponse.redirect(url);
  }

  // 2) 테넌트 무관 루트 라우트
  if (ROOT_PRIVATE.has(seg)) return response;

  // 3) 첫 세그먼트 = 교회 slug — URL이 SSOT: 쿠키 불일치 시 active_church 동기화
  if (!SLUG_RE.test(seg)) return response; // 형식 불량 → [church] layout이 404
  if (cookieSlug === seg) return response; // 이미 동기화됨 (RPC 0회)

  const { data: churchId } = await supabase.rpc("set_active_church_by_slug", { p_slug: seg });
  if (!churchId) {
    // 존재하지 않거나 비소속 (정보 비노출) → 가입 안내
    const url = request.nextUrl.clone();
    url.pathname = "/join";
    url.search = `church=${encodeURIComponent(seg)}`;
    return NextResponse.redirect(url);
  }
  response.cookies.set(CHURCH_COOKIE, seg, { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 365 });
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|svg|ico)$).*)"],
};
