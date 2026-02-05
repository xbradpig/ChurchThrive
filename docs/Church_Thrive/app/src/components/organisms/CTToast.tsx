'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';
import { CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, XCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

const iconMap: Record<ToastType, React.ComponentType<{ className?: string }>> = {
  success: CheckCircleIcon,
  error: XCircleIcon,
  warning: ExclamationTriangleIcon,
  info: InformationCircleIcon,
};

const styleMap: Record<ToastType, string> = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};

// Global toast state
let toastListeners: ((toasts: Toast[]) => void)[] = [];
let toasts: Toast[] = [];

function notify(toastList: Toast[]) {
  toasts = toastList;
  toastListeners.forEach((fn) => fn(toasts));
}

export const toast = {
  success: (message: string, duration = 3000) => {
    const id = Math.random().toString(36).slice(2);
    notify([...toasts, { id, type: 'success', message, duration }]);
  },
  error: (message: string, duration = 5000) => {
    const id = Math.random().toString(36).slice(2);
    notify([...toasts, { id, type: 'error', message, duration }]);
  },
  warning: (message: string, duration = 4000) => {
    const id = Math.random().toString(36).slice(2);
    notify([...toasts, { id, type: 'warning', message, duration }]);
  },
  info: (message: string, duration = 3000) => {
    const id = Math.random().toString(36).slice(2);
    notify([...toasts, { id, type: 'info', message, duration }]);
  },
};

export function CTToastContainer() {
  const [currentToasts, setCurrentToasts] = useState<Toast[]>([]);

  useEffect(() => {
    toastListeners.push(setCurrentToasts);
    return () => {
      toastListeners = toastListeners.filter((fn) => fn !== setCurrentToasts);
    };
  }, []);

  function removeToast(id: string) {
    notify(toasts.filter((t) => t.id !== id));
  }

  return (
    <div className="fixed top-4 right-4 z-[var(--ct-z-toast)] flex flex-col gap-2 max-w-sm w-full">
      {currentToasts.map((t) => {
        const Icon = iconMap[t.type];
        return (
          <ToastItem key={t.id} toast={t} Icon={Icon} onRemove={() => removeToast(t.id)} />
        );
      })}
    </div>
  );
}

function ToastItem({ toast: t, Icon, onRemove }: { toast: Toast; Icon: React.ComponentType<{ className?: string }>; onRemove: () => void }) {
  useEffect(() => {
    if (t.duration) {
      const timer = setTimeout(onRemove, t.duration);
      return () => clearTimeout(timer);
    }
  }, [t.duration, onRemove]);

  return (
    <div className={cn(
      'flex items-start gap-3 p-3 rounded-ct-lg border shadow-ct-2 animate-slide-down',
      styleMap[t.type]
    )}>
      <Icon className="w-5 h-5 shrink-0 mt-0.5" />
      <p className="flex-1 text-ct-sm">{t.message}</p>
      <button onClick={onRemove} className="shrink-0" aria-label="닫기">
        <XMarkIcon className="w-4 h-4 opacity-60 hover:opacity-100" />
      </button>
    </div>
  );
}
