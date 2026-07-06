import type { Metadata, Viewport } from "next";
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./globals.css";
import AppDialogProvider from "@/components/ui/AppDialog";

export const metadata: Metadata = {
  title: "ChurchThrive — 교회 관리 플랫폼",
  description: "출석·교적·말씀 암송 — 교회에 필요한 기능을 골라 쓰는 교회 관리 플랫폼",
  manifest: "/manifest.json",
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
