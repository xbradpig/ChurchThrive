import type { Metadata, Viewport } from "next";
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./globals.css";
import AppDialogProvider from "@/components/ui/AppDialog";
import RecoveryRedirect from "@/components/RecoveryRedirect";

export const metadata: Metadata = {
  metadataBase: new URL("https://church-thrive.org"),
  title: "ChurchThrive — 교회의 건강한 성장을 돕는 통합 관리 플랫폼",
  description: "출석은 자동으로, 교적은 안전하게, 필요한 기능은 모듈로. ChurchThrive는 교회가 본질에 집중하도록 돕는 통합 교회 관리 플랫폼입니다.",
  alternates: {
    canonical: "/",
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "ChurchThrive — 교회의 건강한 성장을 돕는 통합 관리 플랫폼",
    description: "출석·교적·말씀·케어·행정을 한 곳에서 관리하는 교회 관리 플랫폼입니다.",
    url: "https://church-thrive.org",
    siteName: "ChurchThrive",
    locale: "ko_KR",
    type: "website",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ChurchThrive",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#1e3350",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <script dangerouslySetInnerHTML={{ __html:
          `try{var f=+localStorage.getItem("font-scale")||0;if(f>0)document.documentElement.style.fontSize=[17,19,21][f]+"px";}catch(e){}` }} />
      </head>
      <body>
        <RecoveryRedirect />
        <AppDialogProvider>{children}</AppDialogProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js'))}`,
          }}
        />
      </body>
    </html>
  );
}
