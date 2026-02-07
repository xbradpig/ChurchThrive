import { create } from 'zustand';
import { ColorSchemeName } from 'react-native';

export type Theme = 'light' | 'dark' | 'auto';

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

interface LoadingState {
  [key: string]: boolean;
}

interface UIStore {
  // Theme
  theme: Theme;
  systemTheme: ColorSchemeName;
  setTheme: (theme: Theme) => void;
  setSystemTheme: (theme: ColorSchemeName) => void;
  getActiveTheme: () => 'light' | 'dark';

  // Loading states
  loadingStates: LoadingState;
  setLoading: (key: string, loading: boolean) => void;
  isLoading: (key: string) => boolean;
  clearLoading: () => void;

  // Toast notifications
  toasts: ToastMessage[];
  showToast: (type: ToastMessage['type'], message: string, duration?: number) => void;
  hideToast: (id: string) => void;
  clearToasts: () => void;

  // Modal states
  activeModal: string | null;
  openModal: (modalId: string) => void;
  closeModal: () => void;

  // Tab bar visibility
  tabBarVisible: boolean;
  setTabBarVisible: (visible: boolean) => void;

  // Network status
  isOnline: boolean;
  setOnline: (online: boolean) => void;
}

export const useUIStore = create<UIStore>((set, get) => ({
  // Theme
  theme: 'auto',
  systemTheme: null,

  setTheme: (theme) => set({ theme }),

  setSystemTheme: (systemTheme) => set({ systemTheme }),

  getActiveTheme: () => {
    const { theme, systemTheme } = get();
    if (theme === 'auto') {
      return systemTheme === 'dark' ? 'dark' : 'light';
    }
    return theme as 'light' | 'dark';
  },

  // Loading states
  loadingStates: {},

  setLoading: (key, loading) =>
    set((state) => ({
      loadingStates: {
        ...state.loadingStates,
        [key]: loading,
      },
    })),

  isLoading: (key) => {
    const { loadingStates } = get();
    return loadingStates[key] || false;
  },

  clearLoading: () => set({ loadingStates: {} }),

  // Toast notifications
  toasts: [],

  showToast: (type, message, duration = 3000) => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    const toast: ToastMessage = { id, type, message, duration };

    set((state) => ({
      toasts: [...state.toasts, toast],
    }));

    // Auto-hide after duration
    if (duration > 0) {
      setTimeout(() => {
        get().hideToast(id);
      }, duration);
    }
  },

  hideToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  clearToasts: () => set({ toasts: [] }),

  // Modal states
  activeModal: null,
  openModal: (modalId) => set({ activeModal: modalId }),
  closeModal: () => set({ activeModal: null }),

  // Tab bar visibility
  tabBarVisible: true,
  setTabBarVisible: (visible) => set({ tabBarVisible: visible }),

  // Network status
  isOnline: true,
  setOnline: (online) => set({ isOnline: online }),
}));
