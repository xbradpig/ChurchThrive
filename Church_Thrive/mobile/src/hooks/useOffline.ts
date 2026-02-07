import { useState, useEffect, useCallback } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { mobileSyncManager } from '@/lib/offline/sync';

export function useOffline() {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const connected = state.isConnected === true;
      setIsOnline(connected);
      if (connected) {
        handleSync();
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSync = useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      await mobileSyncManager.syncAll();
    } catch (err) {
      console.error('Mobile sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]);

  return { isOnline, isSyncing, sync: handleSync };
}
