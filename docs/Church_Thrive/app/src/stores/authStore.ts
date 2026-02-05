import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import type { AuthState, AuthUser } from '@churchthrive/shared';
import type { Database } from '@churchthrive/shared';

type Member = Database['public']['Tables']['members']['Row'];
type Church = Database['public']['Tables']['churches']['Row'];

export interface AuthStore extends AuthState {
  initialize: () => Promise<void>;
  signOut: () => Promise<void>;
  setMember: (member: Member | null) => void;
  setChurch: (church: Church | null) => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  session: null,
  user: null,
  member: null,
  church: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,

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
        if (member?.church_id) {
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
}));
