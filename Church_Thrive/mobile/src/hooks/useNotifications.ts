import { useState, useEffect, useCallback } from 'react';
import { notificationManager, NotificationToken } from '@/lib/notifications/setup';
import { useAuthStore } from '@/stores/authStore';

interface UseNotificationsResult {
  token: NotificationToken | null;
  isEnabled: boolean;
  isLoading: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  scheduleLocal: (
    title: string,
    body: string,
    data: Record<string, any>
  ) => Promise<string | null>;
  clearBadge: () => Promise<void>;
  unregister: () => Promise<void>;
}

export function useNotifications(): UseNotificationsResult {
  const { member } = useAuthStore();
  const [token, setToken] = useState<NotificationToken | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if notifications are enabled on mount
  useEffect(() => {
    checkEnabled();
  }, []);

  const checkEnabled = async () => {
    const enabled = await notificationManager.areNotificationsEnabled();
    setIsEnabled(enabled);
  };

  const initialize = useCallback(async () => {
    if (!member?.id) {
      setError('No member ID available');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const tokenData = await notificationManager.initialize(member.id);
      if (tokenData) {
        setToken(tokenData);
        setIsEnabled(true);
      } else {
        setError('Failed to get notification token');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to initialize notifications';
      setError(message);
      console.error('Notification initialization error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [member?.id]);

  const scheduleLocal = useCallback(
    async (
      title: string,
      body: string,
      data: Record<string, any>
    ): Promise<string | null> => {
      try {
        setError(null);
        const id = await notificationManager.scheduleLocalNotification(title, body, data);
        return id;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to schedule notification';
        setError(message);
        console.error('Schedule notification error:', err);
        return null;
      }
    },
    []
  );

  const clearBadge = useCallback(async () => {
    try {
      await notificationManager.clearBadge();
    } catch (err) {
      console.error('Clear badge error:', err);
    }
  }, []);

  const unregister = useCallback(async () => {
    if (!member?.id) return;

    try {
      setError(null);
      await notificationManager.unregister(member.id);
      setToken(null);
      setIsEnabled(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to unregister notifications';
      setError(message);
      console.error('Unregister notification error:', err);
    }
  }, [member?.id]);

  return {
    token,
    isEnabled,
    isLoading,
    error,
    initialize,
    scheduleLocal,
    clearBadge,
    unregister,
  };
}
