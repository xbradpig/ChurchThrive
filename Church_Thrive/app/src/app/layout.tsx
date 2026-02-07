import type { Metadata, Viewport } from 'next';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: {
    default: 'ChurchThrive - 교회 혁신 성장 통합  SaaS 플랫폼',
    template: '%s | ChurchThrive',
  },
  description: '교회 교인관리, 말씀노트, 행정을 한 곳에서. 교회의 건강한 성장을 돕는 올인원 플랫폼.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#228B22' },
    { media: '(prefers-color-scheme: dark)', color: '#196919' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="font-sans antialiased bg-[var(--ct-color-bg)] text-[var(--ct-color-text-primary)]">
        {children}
      </body>
    </html>
  );
}
