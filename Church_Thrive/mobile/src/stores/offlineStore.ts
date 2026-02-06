import { create } from 'zustand';
import { mobileSyncManager, SyncStatus } from '@/lib/offline/sync';

interface OfflineQueue {
  id: string;
  type: 'note' | 'attendance' | 'member_update';
  operation: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  retries: number;
  error?: string;
}

interface OfflineStore {
  // Sync state
  syncStatus: SyncStatus;
  lastSync: Date | null;
  syncError: string | null;
  isSyncing: boolean;

  // Offline queue
  queue: OfflineQueue[];
  addToQueue: (item: Omit<OfflineQueue, 'id' | 'timestamp' | 'retries'>) => void;
  removeFromQueue: (id: string) => void;
  clearQueue: () => void;

  // Sync operations
  triggerSync: (churchId?: string) => Promise<void>;
  setSyncStatus: (status: SyncStatus) => void;
  setLastSync: (date: Date | null) => void;
  setSyncError: (error: string | null) => void;

  // Offline data status
  hasLocalData: boolean;
  setHasLocalData: (hasData: boolean) => void;

  // Data freshness
  dataAge: number; // milliseconds since last sync
  updateDataAge: () => void;
  isDataStale: () => boolean; // true if > 1 hour old
}

export const useOfflineStore = create<OfflineStore>((set, get) => ({
  // Sync state
  syncStatus: 'idle',
  lastSync: null,
  syncError: null,
  isSyncing: false,

  // Offline queue
  queue: [],

  addToQueue: (item) => {
    const queueItem: OfflineQueue = {
      ...item,
      id: `queue_${Date.now()}_${Math.random()}`,
      timestamp: Date.now(),
      retries: 0,
    };

    set((state) => ({
      queue: [...state.queue, queueItem],
    }));
  },

  removeFromQueue: (id) =>
    set((state) => ({
      queue: state.queue.filter((item) => item.id !== id),
    })),

  clearQueue: () => set({ queue: [] }),

  // Sync operations
  triggerSync: async (churchId) => {
    const { isSyncing } = get();

    if (isSyncing) {
      console.log('Sync already in progress');
      return;
    }

    set({ isSyncing: true, syncStatus: 'syncing', syncError: null });

    try {
      // Subscribe to sync manager state
      const unsubscribe = mobileSyncManager.subscribe((state) => {
        set({
          syncStatus: state.status,
          lastSync: state.lastSync,
          syncError: state.error,
        });
      });

      await mobileSyncManager.syncAll(churchId);

      // Unsubscribe after sync
      unsubscribe();

      set({
        isSyncing: false,
        syncStatus: 'success',
        lastSync: new Date(),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sync failed';
      set({
        isSyncing: false,
        syncStatus: 'error',
        syncError: message,
      });
    }
  },

  setSyncStatus: (status) => set({ syncStatus: status }),

  setLastSync: (date) => set({ lastSync: date }),

  setSyncError: (error) => set({ syncError: error }),

  // Offline data status
  hasLocalData: false,
  setHasLocalData: (hasData) => set({ hasLocalData: hasData }),

  // Data freshness
  dataAge: 0,

  updateDataAge: () => {
    const { lastSync } = get();
    if (lastSync) {
      set({ dataAge: Date.now() - lastSync.getTime() });
    } else {
      set({ dataAge: 0 });
    }
  },

  isDataStale: () => {
    get().updateDataAge();
    const { dataAge } = get();
    const ONE_HOUR = 60 * 60 * 1000;
    return dataAge > ONE_HOUR;
  },
}));

// Auto-update data age every minute
setInterval(() => {
  useOfflineStore.getState().updateDataAge();
}, 60 * 1000);
