'use client';

import { firebaseConfig, vapidKey, isFirebaseConfigured } from './config';

let messagingInstance: any = null;

// Dynamically import Firebase to avoid SSR issues
async function getMessaging() {
  if (typeof window === 'undefined') return null;
  if (!isFirebaseConfigured()) return null;

  if (!messagingInstance) {
    const { initializeApp, getApps, getApp } = await import('firebase/app');
    const { getMessaging, isSupported } = await import('firebase/messaging');

    const supported = await isSupported();
    if (!supported) {
      console.log('Firebase Messaging is not supported in this browser');
      return null;
    }

    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    messagingInstance = getMessaging(app);
  }

  return messagingInstance;
}

// Request notification permission and get FCM token
export async function requestNotificationPermission(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  try {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.log('Notifications not supported');
      return null;
    }

    // Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return null;
    }

    // Register service worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    console.log('Service worker registered:', registration);

    // Get FCM token
    const messaging = await getMessaging();
    if (!messaging) return null;

    const { getToken } = await import('firebase/messaging');
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });

    console.log('FCM token obtained:', token);
    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
}

// Listen for foreground messages
export async function onForegroundMessage(callback: (payload: any) => void): Promise<() => void> {
  if (typeof window === 'undefined') return () => {};

  try {
    const messaging = await getMessaging();
    if (!messaging) return () => {};

    const { onMessage } = await import('firebase/messaging');
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload);
      callback(payload);
    });

    return unsubscribe;
  } catch (error) {
    console.error('Error setting up foreground message listener:', error);
    return () => {};
  }
}

// Check if notifications are supported
export function isNotificationSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'Notification' in window && 'serviceWorker' in navigator;
}

// Get current notification permission status
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined') return 'unsupported';
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}
