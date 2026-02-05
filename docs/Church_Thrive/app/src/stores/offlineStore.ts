import { create } from 'zustand';

export type SyncStatus = 'idle' | 'syncing' | 'error';

export interface PendingSync {
  id: string;
  type: 'create' | 'update' | 'delete';
  table: string;
  data: any;
  timestamp: number;
}

export interface OfflineStore {
  // Network status
  isOnline: boolean;
  setOnline: (online: boolean) => void;

  // Sync status
  syncStatus: SyncStatus;
  setSyncStatus: (status: SyncStatus) => void;

  // Pending syncs
  pendingSyncs: PendingSync[];
  addPendingSync: (sync: Omit<PendingSync, 'id' | 'timestamp'>) => void;
  removePendingSync: (id: string) => void;
  clearPendingSyncs: () => void;
  getPendingSyncCount: () => number;

  // Last sync time
  lastSyncTime: number | null;
  setLastSyncTime: (time: number) => void;

  // Initialize offline detection
  initialize: () => void;
}

export const useOfflineStore = create<OfflineStore>((set, get) => ({
  // Network status
  isOnline: typeof window !== 'undefined' ? window.navigator.onLine : true,
  setOnline: (online) => set({ isOnline: online }),

  // Sync status
  syncStatus: 'idle',
  setSyncStatus: (status) => set({ syncStatus: status }),

  // Pending syncs
  pendingSyncs: [],
  addPendingSync: (sync) => {
    const id = `sync-${Date.now()}-${Math.random()}`;
    const newSync: PendingSync = {
      ...sync,
      id,
      timestamp: Date.now(),
    };
    set((state) => ({
      pendingSyncs: [...state.pendingSyncs, newSync],
    }));
  },
  removePendingSync: (id) => set((state) => ({
    pendingSyncs: state.pendingSyncs.filter((s) => s.id !== id),
  })),
  clearPendingSyncs: () => set({ pendingSyncs: [] }),
  getPendingSyncCount: () => get().pendingSyncs.length,

  // Last sync time
  lastSyncTime: null,
  setLastSyncTime: (time) => set({ lastSyncTime: time }),

  // Initialize offline detection
  initialize: () => {
    if (typeof window === 'undefined') return;

    // Set initial state
    set({ isOnline: window.navigator.onLine });

    // Listen for online/offline events
    const handleOnline = () => {
      set({ isOnline: true });
      console.log('[OfflineStore] Network connection restored');
    };

    const handleOffline = () => {
      set({ isOnline: false });
      console.log('[OfflineStore] Network connection lost');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  },
}));
