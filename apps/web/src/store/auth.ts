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
    // Clear local state immediately, then try API
    api.setToken(null);
    set({ user: null, isLoading: false });
    try {
      await api.post('/api/v1/auth/logout');
    } catch {
      // API cleanup is optional - local state is already cleared
    }
  },
  checkSession: async () => {
    try {
      const session = await api.getSession();
      set({ user: session?.user || null, isLoading: false });
    } catch {
      set({ user: null, isLoading: false });
    }
  },
}));
