'use client';

import { useEffect, useCallback, useRef, useState } from 'react';

interface SWUpdateState {
  isUpdateAvailable: boolean;
  registration: ServiceWorkerRegistration | null;
}

export function useServiceWorker() {
  const [state, setState] = useState<SWUpdateState>({
    isUpdateAvailable: false,
    registration: null,
  });
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    async function registerSW() {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        registrationRef.current = registration;

        // Check for updates periodically (every 60 minutes)
        const intervalId = setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);

        // Listen for a new service worker being installed
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              // New version available
              setState({
                isUpdateAvailable: true,
                registration,
              });
            }
          });
        });

        // Listen for messages from the service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          const { type } = event.data || {};

          if (type === 'NAVIGATE') {
            window.location.href = event.data.url;
          }
        });

        return () => clearInterval(intervalId);
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }

    registerSW();
  }, []);

  const applyUpdate = useCallback(() => {
    const reg = registrationRef.current;
    if (reg?.waiting) {
      reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }, []);

  const clearAllCaches = useCallback(async () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' });
    }
    // Also clear from the main thread
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  }, []);

  return {
    isUpdateAvailable: state.isUpdateAvailable,
    applyUpdate,
    clearAllCaches,
  };
}
