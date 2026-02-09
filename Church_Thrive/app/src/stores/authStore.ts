import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createClient } from '@/lib/supabase/client';
import type { AuthState, AuthUser } from '@churchthrive/shared';
import type { Database } from '@churchthrive/shared';

type Member = Database['public']['Tables']['members']['Row'];
type Church = Database['public']['Tables']['churches']['Row'];

export type ViewMode = 'admin' | 'member';

const ADMIN_ROLES = ['admin', 'pastor', 'staff'];

export interface AuthStore extends AuthState {
  viewMode: ViewMode;
  initialize: () => Promise<void>;
  signOut: () => Promise<void>;
  setMember: (member: Member | null) => void;
  setChurch: (church: Church | null) => void;
  setViewMode: (mode: ViewMode) => void;
  toggleViewMode: () => void;
  canToggleViewMode: () => boolean;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
  session: null,
  user: null,
  member: null,
  church: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
  viewMode: 'admin' as ViewMode,

  initialize: async () => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const user: AuthUser = {
          id: session.user.id,
          email: session.user.email ?? null,
          phone: session.user.phone ?? null,
        };

        // Fetch member data
        const { data: member } = await supabase
          .from('members')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('status', 'active')
          .single();

        let church: Church | null = null;
        if (member && member.church_id) {
          const { data } = await supabase
            .from('churches')
            .select('*')
            .eq('id', member.church_id)
            .single();
          church = data;
        }

        set({
          session: {
            user,
            accessToken: session.access_token,
            refreshToken: session.refresh_token,
            expiresAt: session.expires_at ?? 0,
          },
          user,
          member,
          church,
          isAuthenticated: !!member,
          isLoading: false,
        });
      } else {
        set({ isLoading: false, isAuthenticated: false });
      }
    } catch (error) {
      set({ isLoading: false, error: 'Failed to initialize auth' });
    }

    // Listen for auth changes
    const supabase = createClient();
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        set({
          session: null,
          user: null,
          member: null,
          church: null,
          isAuthenticated: false,
        });
      }
    });
  },

  signOut: async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    set({
      session: null,
      user: null,
      member: null,
      church: null,
      isAuthenticated: false,
    });
  },

  setMember: (member) => set({ member }),
  setChurch: (church) => set({ church }),

  setViewMode: (mode: ViewMode) => set({ viewMode: mode }),

  toggleViewMode: () => {
    const { viewMode, canToggleViewMode } = get();
    if (canToggleViewMode()) {
      set({ viewMode: viewMode === 'admin' ? 'member' : 'admin' });
    }
  },

  canToggleViewMode: () => {
    const { member } = get();
    return member?.role ? ADMIN_ROLES.includes(member.role) : false;
  },
}),
    {
      name: 'churchthrive-auth',
      partialize: (state) => ({ viewMode: state.viewMode }),
    }
  )
);
