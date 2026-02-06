import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase/client';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationToken {
  token: string;
  platform: 'ios' | 'android' | 'web';
  deviceId: string;
}

export class NotificationManager {
  private token: string | null = null;
  private notificationListener: Notifications.Subscription | null = null;
  private responseListener: Notifications.Subscription | null = null;

  /**
   * Initialize push notifications and register for tokens
   */
  async initialize(memberId: string): Promise<NotificationToken | null> {
    try {
      // Check if running on physical device
      if (!Device.isDevice) {
        console.warn('Push notifications only work on physical devices');
        return null;
      }

      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Push notification permission not granted');
        return null;
      }

      // Get push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-eas-project-id', // Replace with actual EAS project ID
      });

      this.token = tokenData.data;

      const notificationToken: NotificationToken = {
        token: this.token,
        platform: Platform.OS as 'ios' | 'android',
        deviceId: Device.modelId || 'unknown',
      };

      // Register token with Supabase
      await this.registerTokenWithServer(memberId, notificationToken);

      // Set up notification listeners
      this.setupListeners();

      // Configure notification channel for Android
      if (Platform.OS === 'android') {
        await this.setupAndroidChannel();
      }

      console.log('Push notifications initialized:', notificationToken);
      return notificationToken;
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
      return null;
    }
  }

  /**
   * Set up Android notification channel (required for Android 8+)
   */
  private async setupAndroidChannel(): Promise<void> {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'ChurchThrive 알림',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#228B22',
      sound: 'default',
      enableVibrate: true,
      enableLights: true,
      showBadge: true,
    });

    await Notifications.setNotificationChannelAsync('announcements', {
      name: '공지사항',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#228B22',
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('reminders', {
      name: '리마인더',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    });
  }

  /**
   * Register push token with Supabase
   */
  private async registerTokenWithServer(
    memberId: string,
    tokenData: NotificationToken
  ): Promise<void> {
    try {
      // Check if token already exists
      const { data: existingToken } = await supabase
        .from('push_tokens')
        .select('id')
        .eq('member_id', memberId)
        .eq('token', tokenData.token)
        .single();

      if (existingToken) {
        // Update existing token
        await supabase
          .from('push_tokens')
          .update({
            platform: tokenData.platform,
            device_id: tokenData.deviceId,
            is_active: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingToken.id);
      } else {
        // Insert new token
        await supabase.from('push_tokens').insert({
          member_id: memberId,
          token: tokenData.token,
          platform: tokenData.platform,
          device_id: tokenData.deviceId,
          is_active: true,
        });
      }

      console.log('Push token registered with server');
    } catch (error) {
      console.error('Failed to register token with server:', error);
    }
  }

  /**
   * Set up notification event listeners
   */
  private setupListeners(): void {
    // Listener for notifications received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification);
        // Handle foreground notification display
        // You can show custom UI here if needed
      }
    );

    // Listener for user tapping on notification
    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('Notification tapped:', response);
        // Handle notification tap - navigate to appropriate screen
        const data = response.notification.request.content.data;
        this.handleNotificationTap(data);
      }
    );
  }

  /**
   * Handle notification tap navigation
   */
  private handleNotificationTap(data: Record<string, any>): void {
    const { type, id } = data;

    // This should be integrated with your navigation system
    switch (type) {
      case 'announcement':
        console.log('Navigate to announcement:', id);
        // router.push(`/(tabs)/admin/announcements/${id}`);
        break;
      case 'sermon':
        console.log('Navigate to sermon:', id);
        // router.push(`/(tabs)/sermons/${id}`);
        break;
      case 'attendance':
        console.log('Navigate to attendance');
        // router.push('/(tabs)/admin/attendance');
        break;
      default:
        console.log('Unknown notification type:', type);
    }
  }

  /**
   * Schedule a local notification
   */
  async scheduleLocalNotification(
    title: string,
    body: string,
    data: Record<string, any>,
    trigger?: Notifications.NotificationTriggerInput
  ): Promise<string> {
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
          badge: 1,
        },
        trigger: trigger || null, // null = immediate
      });

      console.log('Local notification scheduled:', id);
      return id;
    } catch (error) {
      console.error('Failed to schedule local notification:', error);
      throw error;
    }
  }

  /**
   * Cancel a scheduled notification
   */
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log('Notification cancelled:', notificationId);
    } catch (error) {
      console.error('Failed to cancel notification:', error);
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('All notifications cancelled');
    } catch (error) {
      console.error('Failed to cancel all notifications:', error);
    }
  }

  /**
   * Get badge count
   */
  async getBadgeCount(): Promise<number> {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      console.error('Failed to get badge count:', error);
      return 0;
    }
  }

  /**
   * Set badge count
   */
  async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Failed to set badge count:', error);
    }
  }

  /**
   * Clear badge count
   */
  async clearBadge(): Promise<void> {
    await this.setBadgeCount(0);
  }

  /**
   * Unregister from push notifications
   */
  async unregister(memberId: string): Promise<void> {
    try {
      if (this.token) {
        // Deactivate token in database
        await supabase
          .from('push_tokens')
          .update({ is_active: false })
          .eq('member_id', memberId)
          .eq('token', this.token);
      }

      // Remove listeners
      if (this.notificationListener) {
        this.notificationListener.remove();
        this.notificationListener = null;
      }

      if (this.responseListener) {
        this.responseListener.remove();
        this.responseListener = null;
      }

      this.token = null;
      console.log('Push notifications unregistered');
    } catch (error) {
      console.error('Failed to unregister notifications:', error);
    }
  }

  /**
   * Get current push token
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Check if notifications are enabled
   */
  async areNotificationsEnabled(): Promise<boolean> {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  }
}

// Singleton instance
export const notificationManager = new NotificationManager();
