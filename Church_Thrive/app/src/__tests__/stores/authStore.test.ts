import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthStore } from '@/stores/authStore';

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      signOut: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(),
          })),
          single: vi.fn(),
        })),
      })),
    })),
  })),
}));

describe('authStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAuthStore.setState({
      session: null,
      user: null,
      member: null,
      church: null,
      isLoading: true,
      isAuthenticated: false,
      error: null,
    });
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = useAuthStore.getState();
      expect(state.session).toBeNull();
      expect(state.user).toBeNull();
      expect(state.member).toBeNull();
      expect(state.church).toBeNull();
      expect(state.isLoading).toBe(true);
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('setMember', () => {
    it('should update member state', () => {
      const mockMember = {
        id: 'member-1',
        user_id: 'user-1',
        church_id: 'church-1',
        name: '김철수',
        phone: '010-1234-5678',
        role: 'member' as const,
        status: 'active' as const,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      useAuthStore.getState().setMember(mockMember);

      const state = useAuthStore.getState();
      expect(state.member).toEqual(mockMember);
    });

    it('should set member to null', () => {
      const mockMember = {
        id: 'member-1',
        user_id: 'user-1',
        church_id: 'church-1',
        name: '김철수',
        phone: '010-1234-5678',
        role: 'member' as const,
        status: 'active' as const,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      useAuthStore.getState().setMember(mockMember);
      expect(useAuthStore.getState().member).not.toBeNull();

      useAuthStore.getState().setMember(null);
      expect(useAuthStore.getState().member).toBeNull();
    });
  });

  describe('setChurch', () => {
    it('should update church state', () => {
      const mockChurch = {
        id: 'church-1',
        name: '사랑의교회',
        slug: 'sarang-church',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      useAuthStore.getState().setChurch(mockChurch);

      const state = useAuthStore.getState();
      expect(state.church).toEqual(mockChurch);
    });

    it('should set church to null', () => {
      const mockChurch = {
        id: 'church-1',
        name: '사랑의교회',
        slug: 'sarang-church',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      useAuthStore.getState().setChurch(mockChurch);
      expect(useAuthStore.getState().church).not.toBeNull();

      useAuthStore.getState().setChurch(null);
      expect(useAuthStore.getState().church).toBeNull();
    });
  });

  describe('signOut', () => {
    it('should clear all auth state on sign out', async () => {
      const { createClient } = await import('@/lib/supabase/client');
      const mockSupabase = createClient();

      // Set initial authenticated state
      useAuthStore.setState({
        session: {
          user: { id: 'user-1', email: 'test@example.com', phone: null },
          accessToken: 'token',
          refreshToken: 'refresh',
          expiresAt: Date.now() + 3600000,
        },
        user: { id: 'user-1', email: 'test@example.com', phone: null },
        member: {
          id: 'member-1',
          user_id: 'user-1',
          church_id: 'church-1',
          name: '김철수',
          phone: '010-1234-5678',
          role: 'member' as const,
          status: 'active' as const,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
        church: {
          id: 'church-1',
          name: '사랑의교회',
          slug: 'sarang-church',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
        isAuthenticated: true,
        isLoading: false,
      });

      await useAuthStore.getState().signOut();

      expect(mockSupabase.auth.signOut).toHaveBeenCalled();

      const state = useAuthStore.getState();
      expect(state.session).toBeNull();
      expect(state.user).toBeNull();
      expect(state.member).toBeNull();
      expect(state.church).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('initialize', () => {
    it('should set isLoading to false when no session', async () => {
      const { createClient } = await import('@/lib/supabase/client');
      const mockSupabase = createClient();

      vi.mocked(mockSupabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      await useAuthStore.getState().initialize();

      const state = useAuthStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.isAuthenticated).toBe(false);
    });

    it('should load user and member data when session exists', async () => {
      const { createClient } = await import('@/lib/supabase/client');
      const mockSupabase = createClient();

      const mockSession = {
        user: {
          id: 'user-1',
          email: 'test@example.com',
          phone: null,
        },
        access_token: 'token',
        refresh_token: 'refresh',
        expires_at: Date.now() + 3600000,
      };

      const mockMember = {
        id: 'member-1',
        user_id: 'user-1',
        church_id: 'church-1',
        name: '김철수',
        phone: '010-1234-5678',
        role: 'member' as const,
        status: 'active' as const,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      const mockChurch = {
        id: 'church-1',
        name: '사랑의교회',
        slug: 'sarang-church',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      vi.mocked(mockSupabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession as any },
        error: null,
      });

      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: mockMember, error: null }),
            })),
            single: vi.fn().mockResolvedValue({ data: mockChurch, error: null }),
          })),
        })),
      }));

      vi.mocked(mockSupabase.from).mockImplementation(mockFrom as any);

      await useAuthStore.getState().initialize();

      const state = useAuthStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.isAuthenticated).toBe(true);
      expect(state.user?.id).toBe('user-1');
      expect(state.member).toEqual(mockMember);
      expect(state.church).toEqual(mockChurch);
    });

    it('should handle errors during initialization', async () => {
      const { createClient } = await import('@/lib/supabase/client');
      const mockSupabase = createClient();

      vi.mocked(mockSupabase.auth.getSession).mockRejectedValue(
        new Error('Network error')
      );

      await useAuthStore.getState().initialize();

      const state = useAuthStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Failed to initialize auth');
    });
  });

  describe('auth state change listener', () => {
    it('should setup auth state change listener', async () => {
      const { createClient } = await import('@/lib/supabase/client');
      const mockSupabase = createClient();

      vi.mocked(mockSupabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      await useAuthStore.getState().initialize();

      expect(mockSupabase.auth.onAuthStateChange).toHaveBeenCalled();
    });

    it('should clear state on SIGNED_OUT event', async () => {
      const { createClient } = await import('@/lib/supabase/client');
      const mockSupabase = createClient();

      let authChangeCallback: ((event: string, session: any) => void) | null = null;

      vi.mocked(mockSupabase.auth.onAuthStateChange).mockImplementation((callback) => {
        authChangeCallback = callback;
        return {
          data: { subscription: { unsubscribe: vi.fn() } },
        };
      });

      vi.mocked(mockSupabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      await useAuthStore.getState().initialize();

      // Set authenticated state
      useAuthStore.setState({
        session: {
          user: { id: 'user-1', email: 'test@example.com', phone: null },
          accessToken: 'token',
          refreshToken: 'refresh',
          expiresAt: Date.now() + 3600000,
        },
        user: { id: 'user-1', email: 'test@example.com', phone: null },
        isAuthenticated: true,
      });

      // Trigger SIGNED_OUT event
      if (authChangeCallback) {
        authChangeCallback('SIGNED_OUT', null);
      }

      const state = useAuthStore.getState();
      expect(state.session).toBeNull();
      expect(state.user).toBeNull();
      expect(state.member).toBeNull();
      expect(state.church).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });
});
