import { create } from 'zustand';
import { api } from '@/lib/api';

interface AuthState {
  user: {
    id: string;
    email: string;
    name: string;
    avatar_url: string | null;
    timezone: string;
  } | null;
  isLoading: boolean;
  setUser: (user: AuthState['user']) => void;
  loginWithGoogle: (accessToken: string) => Promise<void>;
  loginWithGithub: (code: string) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user, isLoading: false }),

  loginWithGoogle: async (accessToken) => {
    const res = await api.loginWithGoogle(accessToken);
    set({ user: res.data.user, isLoading: false });
  },

  loginWithGithub: async (code) => {
    const res = await api.loginWithGithub(code);
    set({ user: res.data.user, isLoading: false });
  },

  logout: async () => {
    // Step 1: Tell the server to clear the HTTP-only cookie FIRST
    // This must complete before we navigate anywhere, otherwise
    // the client-side AppContent auth guard will fire checkSession
    // and the still-valid cookie will re-authenticate the user.
    try {
      await api.post('/api/v1/auth/logout');
    } catch { /* ignore */ }

    // Step 2: Mark as logged out (belt-and-suspenders — cookie is already gone)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('ph_logged_out', 'true');
    }

    // Step 3: Clear local state
    api.setToken(null);
    set({ user: null, isLoading: false });

    // Step 4: Navigate to login via FULL browser navigation
    // This prevents the AppContent routing guard from firing a
    // client-side router.push('/login') before the cookie is cleared.
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  },

  checkSession: async () => {
    // If user just logged out, skip session check entirely
    if (typeof window !== 'undefined' && sessionStorage.getItem('ph_logged_out') === 'true') {
      set({ user: null, isLoading: false });
      return;
    }

    try {
      const session = await api.getSession();
      if (session?.user) {
        set({ user: session.user, isLoading: false });
      } else {
        set({ user: null, isLoading: false });
      }
    } catch {
      set({ user: null, isLoading: false });
    }
  },
}));
