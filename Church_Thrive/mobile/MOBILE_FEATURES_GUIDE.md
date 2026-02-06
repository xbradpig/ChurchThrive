# ChurchThrive Mobile Features Guide

Quick reference for using the newly implemented mobile features.

## 🔄 Offline Sync

### Basic Usage

```typescript
import { mobileSyncManager } from '@/lib/offline/sync';
import { useOfflineStore } from '@/stores';

// In a component
function MyComponent() {
  const { triggerSync, syncStatus, lastSync } = useOfflineStore();
  const { church } = useAuthStore();

  // Trigger full sync
  const handleSync = async () => {
    await triggerSync(church?.id);
  };

  return (
    <View>
      <Text>Status: {syncStatus}</Text>
      <Text>Last sync: {lastSync?.toLocaleString()}</Text>
      <Button onPress={handleSync} title="Sync Now" />
    </View>
  );
}
```

### Working with Local Database

```typescript
import { database } from '@/lib/offline/database';
import SermonNote from '@/lib/offline/models/SermonNote';
import { Q } from '@nozbe/watermelondb';

// Create a new note
const createNote = async () => {
  await database.write(async () => {
    const note = await database.get<SermonNote>('sermon_notes').create((n) => {
      n.sermonId = 'sermon-123';
      n.memberId = 'member-456';
      n.title = 'My Sermon Note';
      n.content = 'Note content here...';
      n.isFavorite = false;
      n.syncStatus = 'pending'; // Will sync on next connection
    });
  });
};

// Query notes
const myNotes = await database
  .get<SermonNote>('sermon_notes')
  .query(Q.where('member_id', memberId), Q.sortBy('created_at', Q.desc))
  .fetch();

// Update a note
await database.write(async () => {
  await note.update((n) => {
    n.title = 'Updated title';
    n.syncStatus = 'pending';
  });
});
```

## 🎤 Audio Recording

### Basic Recording

```typescript
import { useAudioRecorder } from '@/hooks/useAudioRecorder';

function RecordingScreen() {
  const {
    isRecording,
    isPaused,
    duration,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    saveLocally,
    uploadToStorage,
    error,
  } = useAudioRecorder();

  const handleRecord = async () => {
    if (!isRecording) {
      await startRecording();
    } else if (isPaused) {
      await resumeRecording();
    } else {
      await pauseRecording();
    }
  };

  const handleStop = async () => {
    const session = await stopRecording();
    if (session) {
      // Save locally
      const localUri = await saveLocally(`sermon_${Date.now()}`);

      // Upload to cloud
      if (localUri) {
        const result = await uploadToStorage(
          localUri,
          `sermons/${memberId}/${Date.now()}.m4a`
        );
        console.log('Uploaded:', result?.url);
      }
    }
  };

  return (
    <View>
      <Text>Duration: {Math.floor(duration / 1000)}s</Text>
      <Button onPress={handleRecord} title={isRecording ? 'Pause' : 'Record'} />
      <Button onPress={handleStop} title="Stop" disabled={!isRecording && !isPaused} />
      {error && <Text style={{ color: 'red' }}>{error}</Text>}
    </View>
  );
}
```

## 🔔 Push Notifications

### Setup (in App Root)

```typescript
import { useNotifications } from '@/hooks/useNotifications';
import { useEffect } from 'react';

function App() {
  const { initialize, isEnabled } = useNotifications();

  useEffect(() => {
    // Initialize on app start
    initialize();
  }, []);

  return <YourAppContent />;
}
```

### Schedule Local Notification

```typescript
import { useNotifications } from '@/hooks/useNotifications';

function MyComponent() {
  const { scheduleLocal } = useNotifications();

  const scheduleReminder = async () => {
    await scheduleLocal(
      '예배 리마인더',
      '오늘 저녁 예배가 30분 후에 시작됩니다.',
      {
        type: 'reminder',
        id: 'service-123',
      }
    );
  };

  return <Button onPress={scheduleReminder} title="알림 예약" />;
}
```

### Clear Badge Count

```typescript
import { useNotifications } from '@/hooks/useNotifications';

function NotificationsScreen() {
  const { clearBadge } = useNotifications();

  useEffect(() => {
    // Clear badge when user views notifications
    clearBadge();
  }, []);

  return <NotificationsList />;
}
```

## 🔗 Deep Linking

### Navigate from Deep Link

```typescript
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { getInitialURL, addLinkingListener, parseDeepLink } from '@/lib/linking/config';

function AppRoot() {
  const router = useRouter();

  useEffect(() => {
    // Handle initial URL (app opened from link)
    getInitialURL().then((url) => {
      if (url) {
        const parsed = parseDeepLink(url);
        if (parsed?.screen) {
          router.push(parsed.screen as any);
        }
      }
    });

    // Listen for links while app is running
    const subscription = addLinkingListener((event) => {
      const parsed = parseDeepLink(event.url);
      if (parsed?.screen) {
        router.push(parsed.screen as any);
      }
    });

    return () => subscription.remove();
  }, []);

  return <YourApp />;
}
```

### Create Shareable Links

```typescript
import {
  createQRLink,
  createNoteShareLink,
  createSermonLink,
  createAnnouncementLink,
} from '@/lib/linking/config';

// QR code for member check-in
const qrUrl = createQRLink(memberId);
// https://churchthrive.kr/qr/member-123

// Share sermon note
const noteUrl = createNoteShareLink(noteId);
// https://churchthrive.kr/notes/note-456/share

// Share sermon
const sermonUrl = createSermonLink(sermonId);
// https://churchthrive.kr/admin/sermons/sermon-789

// Share announcement
const announcementUrl = createAnnouncementLink(announcementId);
// https://churchthrive.kr/admin/announcements/announcement-012
```

### QR Code Display

```typescript
import { createQRLink } from '@/lib/linking/config';
import QRCode from 'react-native-qrcode-svg';

function MemberQRScreen() {
  const { member } = useAuthStore();
  const qrUrl = createQRLink(member.id);

  return (
    <View>
      <QRCode value={qrUrl} size={200} />
      <Text>스캔하여 출석 체크</Text>
    </View>
  );
}
```

## 🎨 UI State Management

### Theme Management

```typescript
import { useUIStore } from '@/stores';

function SettingsScreen() {
  const { theme, setTheme, getActiveTheme } = useUIStore();
  const activeTheme = getActiveTheme(); // 'light' or 'dark'

  return (
    <View>
      <Button onPress={() => setTheme('light')} title="Light" />
      <Button onPress={() => setTheme('dark')} title="Dark" />
      <Button onPress={() => setTheme('auto')} title="Auto" />
      <Text>Current: {activeTheme}</Text>
    </View>
  );
}
```

### Loading States

```typescript
import { useUIStore } from '@/stores';

function DataScreen() {
  const { setLoading, isLoading } = useUIStore();

  const fetchData = async () => {
    setLoading('fetchData', true);
    try {
      // Fetch data...
    } finally {
      setLoading('fetchData', false);
    }
  };

  return (
    <View>
      {isLoading('fetchData') ? <Spinner /> : <DataView />}
    </View>
  );
}
```

### Toast Notifications

```typescript
import { useUIStore } from '@/stores';

function MyComponent() {
  const { showToast } = useUIStore();

  const handleSuccess = () => {
    showToast('success', '저장되었습니다', 3000);
  };

  const handleError = () => {
    showToast('error', '오류가 발생했습니다', 5000);
  };

  return (
    <View>
      <Button onPress={handleSuccess} title="Success" />
      <Button onPress={handleError} title="Error" />
    </View>
  );
}
```

### Modal Management

```typescript
import { useUIStore } from '@/stores';

function MyScreen() {
  const { activeModal, openModal, closeModal } = useUIStore();

  return (
    <View>
      <Button onPress={() => openModal('editProfile')} title="Edit Profile" />

      {activeModal === 'editProfile' && (
        <Modal visible onRequestClose={closeModal}>
          <EditProfileForm onClose={closeModal} />
        </Modal>
      )}
    </View>
  );
}
```

### Network Status

```typescript
import { useUIStore } from '@/stores';
import { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';

function NetworkMonitor() {
  const { setOnline } = useUIStore();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setOnline(state.isConnected === true);
    });

    return () => unsubscribe();
  }, []);

  return null;
}
```

## 📦 Offline Queue Management

### Add Operations to Queue

```typescript
import { useOfflineStore } from '@/stores';

function AttendanceScreen() {
  const { addToQueue } = useOfflineStore();

  const markAttendance = async (memberId: string, status: string) => {
    // Save locally first
    await database.write(async () => {
      const record = await database.get('attendance_records').create((r) => {
        r.memberId = memberId;
        r.status = status;
        r.syncStatus = 'pending';
      });
    });

    // Add to offline queue
    addToQueue({
      type: 'attendance',
      operation: 'create',
      data: { memberId, status },
    });
  };

  return <AttendanceForm onSubmit={markAttendance} />;
}
```

### Check Data Freshness

```typescript
import { useOfflineStore } from '@/stores';

function DataScreen() {
  const { lastSync, isDataStale } = useOfflineStore();
  const stale = isDataStale(); // true if > 1 hour old

  return (
    <View>
      {stale && (
        <Text style={{ color: 'orange' }}>
          데이터가 오래되었습니다. 동기화를 권장합니다.
        </Text>
      )}
      <Text>마지막 동기화: {lastSync?.toLocaleString()}</Text>
    </View>
  );
}
```

## 🔐 Security Best Practices

### Secure Token Storage

```typescript
// Auth tokens are automatically stored securely
import { supabase } from '@/lib/supabase/client';

// Tokens stored in Expo SecureStore
const { data: { session } } = await supabase.auth.getSession();
// No manual token storage needed
```

### Logout Cleanup

```typescript
import { useAuthStore } from '@/stores';
import { useNotifications } from '@/hooks/useNotifications';

function LogoutButton() {
  const { signOut } = useAuthStore();
  const { unregister } = useNotifications();

  const handleLogout = async () => {
    // Unregister push notifications
    await unregister();

    // Clear auth state
    await signOut();
  };

  return <Button onPress={handleLogout} title="로그아웃" />;
}
```

## 📱 Platform-Specific Code

### Conditional Rendering

```typescript
import { Platform } from 'react-native';

function MyComponent() {
  return (
    <View>
      {Platform.OS === 'ios' && <IOSSpecificComponent />}
      {Platform.OS === 'android' && <AndroidSpecificComponent />}

      <Text style={Platform.select({
        ios: { fontFamily: 'System' },
        android: { fontFamily: 'Roboto' },
      })}>
        Platform-specific font
      </Text>
    </View>
  );
}
```

## 🧪 Testing Helpers

### Mock Offline Mode

```typescript
import { useUIStore } from '@/stores';

// In dev menu or settings
function DeveloperSettings() {
  const { setOnline } = useUIStore();

  return (
    <View>
      <Button onPress={() => setOnline(false)} title="Simulate Offline" />
      <Button onPress={() => setOnline(true)} title="Simulate Online" />
    </View>
  );
}
```

### Clear Local Data

```typescript
import { database } from '@/lib/offline/database';

// For testing/development only
async function clearAllLocalData() {
  await database.write(async () => {
    const allCollections = [
      'sermon_notes',
      'attendance_records',
      'members',
      'sermons',
      'announcements',
    ];

    for (const collectionName of allCollections) {
      const collection = database.get(collectionName);
      const allRecords = await collection.query().fetch();

      for (const record of allRecords) {
        await record.markAsDeleted();
      }
    }
  });
}
```

## 📊 Performance Tips

1. **Use WatermelonDB Queries**: Reactive and efficient
   ```typescript
   // Good: Reactive query
   const notes = useQuery(() =>
     database.get('sermon_notes').query(Q.where('member_id', memberId))
   );

   // Avoid: Fetching in useEffect
   ```

2. **Batch Database Writes**: Use single write transaction
   ```typescript
   await database.write(async () => {
     // Multiple operations in one transaction
     await note1.update(...);
     await note2.create(...);
     await note3.markAsDeleted();
   });
   ```

3. **Optimize Sync Frequency**: Don't sync too often
   ```typescript
   // Sync on app foreground, not every navigation
   useEffect(() => {
     const subscription = AppState.addEventListener('change', (state) => {
       if (state === 'active') {
         triggerSync(churchId);
       }
     });
     return () => subscription.remove();
   }, []);
   ```

4. **Use Image Optimization**: Expo Image component
   ```typescript
   import { Image } from 'expo-image';

   <Image
     source={{ uri: member.photoUrl }}
     placeholder={blurhash}
     contentFit="cover"
     transition={200}
   />
   ```

## 🚀 Deployment Checklist

- [ ] Set `EXPO_PUBLIC_SUPABASE_URL` in environment
- [ ] Set `EXPO_PUBLIC_SUPABASE_ANON_KEY` in environment
- [ ] Update EAS project ID in `app.config.ts`
- [ ] Update EAS project ID in `notifications/setup.ts`
- [ ] Configure Apple Developer account in `eas.json`
- [ ] Configure Google Play account in `eas.json`
- [ ] Test offline mode thoroughly
- [ ] Test push notifications on physical devices
- [ ] Verify deep links work correctly
- [ ] Test audio recording permissions
- [ ] Verify sync conflict resolution
- [ ] Run `npm install` before building

## 📚 Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [WatermelonDB Docs](https://nozbe.github.io/WatermelonDB/)
- [Expo Notifications Guide](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Expo Linking Guide](https://docs.expo.dev/guides/linking/)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
