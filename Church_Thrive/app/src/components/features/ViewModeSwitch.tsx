'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronDownIcon,
  ShieldCheckIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { useNavigation } from '@/hooks/useNavigation';
import type { ViewMode } from '@/stores/authStore';

const MODE_CONFIG: Record<ViewMode, { label: string; icon: typeof ShieldCheckIcon; color: string }> = {
  admin: {
    label: '관리자 모드',
    icon: ShieldCheckIcon,
    color: 'text-blue-600 bg-blue-50',
  },
  member: {
    label: '교인 모드',
    icon: UserIcon,
    color: 'text-green-600 bg-green-50',
  },
};

interface ViewModeSwitchProps {
  className?: string;
}

export function ViewModeSwitch({ className = '' }: ViewModeSwitchProps) {
  const router = useRouter();
  const { viewMode, setViewMode, canToggleViewMode } = useNavigation();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    setIsOpen(false);
    // 모드 변경 시 해당 모드의 홈으로 리다이렉트
    if (mode === 'admin') {
      router.push('/dashboard');
    } else {
      router.push('/home');
    }
  };

  // 외부 클릭 시 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!canToggleViewMode) {
    return null;
  }

  const currentMode = MODE_CONFIG[viewMode];
  const CurrentIcon = currentMode.icon;

  return (
    <div ref={menuRef} className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
      >
        <div className={`w-6 h-6 rounded-md flex items-center justify-center ${currentMode.color}`}>
          <CurrentIcon className="w-4 h-4" />
        </div>
        <span className="text-sm font-medium text-gray-700 hidden sm:inline">{currentMode.label}</span>
        <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
          <div className="py-1">
            {(Object.entries(MODE_CONFIG) as [ViewMode, typeof currentMode][]).map(([mode, config]) => {
              const Icon = config.icon;
              const isActive = mode === viewMode;
              return (
                <button
                  key={mode}
                  onClick={() => handleModeChange(mode)}
                  className={`flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-gray-50 ${
                    isActive ? 'text-ct-primary font-medium' : 'text-gray-700'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center ${config.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span>{config.label}</span>
                  {isActive && (
                    <span className="ml-auto text-ct-primary text-xs">현재</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
