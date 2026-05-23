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
    // Mark as logged out so checkSession knows to skip the API call
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('ph_logged_out', 'true');
    }

    // Clear local token immediately
    api.setToken(null);
    set({ user: null, isLoading: false });

    // Tell server to clear the HTTP-only cookie (await it!)
    try {
      await api.post('/api/v1/auth/logout');
    } catch { /* ignore */ }

    // Navigate to login
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
