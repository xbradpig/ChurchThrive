import Link from 'next/link';
import {
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const NAV_ITEMS = [
  { href: '/about', label: '소개' },
  { href: '/mission', label: 'Mission' },
  { href: '/services', label: '서비스' },
  { href: '/join', label: '파트너 모집' },
];

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-ct-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <span className="text-xl font-bold text-ct-primary">ChurchThrive</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm font-medium text-gray-600 hover:text-ct-primary transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-ct-primary transition-colors"
              >
                로그인
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 text-sm font-medium text-white bg-ct-primary rounded-lg hover:bg-ct-primary-600 transition-colors"
              >
                시작하기
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-16">
        {children}
      </main>

      {/* Footer */}
      <footer className="py-12 px-4 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  <span className="text-ct-primary font-bold text-lg">C</span>
                </div>
                <span className="text-xl font-bold text-white">ChurchThrive</span>
              </Link>
              <p className="text-gray-400 text-sm max-w-md">
                교회의 건강한 성장을 함께 만들어갑니다.
                기술로 섬기고, 함께 나누며, 투명하게 운영합니다.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">서비스</h4>
              <ul className="space-y-2">
                <li><Link href="/about" className="text-gray-400 hover:text-white text-sm transition-colors">소개</Link></li>
                <li><Link href="/services" className="text-gray-400 hover:text-white text-sm transition-colors">기능</Link></li>
                <li><Link href="/register" className="text-gray-400 hover:text-white text-sm transition-colors">시작하기</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">파트너</h4>
              <ul className="space-y-2">
                <li><Link href="/join" className="text-gray-400 hover:text-white text-sm transition-colors">파트너 모집</Link></li>
                <li><a href="mailto:partner@churchthrive.org" className="text-gray-400 hover:text-white text-sm transition-colors">지원하기</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-800">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-gray-400 text-sm">
                &copy; 2026 ChurchThrive. All rights reserved.
              </p>
              <p className="text-gray-500 text-xs">
                Made with ❤️ for Korean Churches
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
