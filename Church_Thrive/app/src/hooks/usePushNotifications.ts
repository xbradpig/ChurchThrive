'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  requestNotificationPermission,
  onForegroundMessage,
  isNotificationSupported,
  getNotificationPermission,
} from '@/lib/firebase/messaging';
import { toast } from '@/components/organisms/CTToast';

interface PushNotificationState {
  isSupported: boolean;
  permission: NotificationPermission | 'unsupported';
  isLoading: boolean;
  token: string | null;
  error: string | null;
}

export function usePushNotifications() {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    permission: 'default',
    isLoading: false,
    token: null,
    error: null,
  });

  const supabase = createClient();

  // Initialize on mount
  useEffect(() => {
    const supported = isNotificationSupported();
    const permission = getNotificationPermission();

    setState((prev) => ({
      ...prev,
      isSupported: supported,
      permission: permission === 'unsupported' ? 'default' : permission,
    }));
  }, []);

  // Set up foreground message listener
  useEffect(() => {
    let unsubscribe: () => void = () => {};

    async function setupListener() {
      unsubscribe = await onForegroundMessage((payload) => {
        // Show toast for foreground notifications
        toast.info(payload.notification?.title || '새 알림');
      });
    }

    if (state.permission === 'granted') {
      setupListener();
    }

    return () => unsubscribe();
  }, [state.permission]);

  // Request permission and get token
  const requestPermission = useCallback(async () => {
    if (!state.isSupported) {
      setState((prev) => ({
        ...prev,
        error: '이 브라우저에서는 알림을 지원하지 않습니다.',
      }));
      return false;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const token = await requestNotificationPermission();

      if (!token) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          permission: getNotificationPermission() as NotificationPermission,
          error: '알림 권한이 거부되었습니다.',
        }));
        return false;
      }

      // Save token to database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: member } = await supabase
          .from('members')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (member) {
          // Store token in member's settings or a separate table
          // For now, we'll store it in a device_tokens table (needs to be created)
          // This is a placeholder - you may want to create a proper table for device tokens
          console.log('FCM token saved for member:', member.id, token);
        }
      }

      setState((prev) => ({
        ...prev,
        isLoading: false,
        permission: 'granted',
        token,
      }));

      return true;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: '알림 설정 중 오류가 발생했습니다.',
      }));
      return false;
    }
  }, [state.isSupported, supabase]);

  return {
    ...state,
    requestPermission,
  };
}
