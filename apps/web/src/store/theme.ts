import { create } from 'zustand';

interface ThemeState {
  isDark: boolean;
  toggle: () => void;
  setDark: (dark: boolean) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  isDark: true,
  toggle: () =>
    set((state) => {
      const next = !state.isDark;
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', next ? 'dark' : 'light');
        document.documentElement.classList.toggle('dark', next);
      }
      return { isDark: next };
    }),
  setDark: (dark: boolean) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', dark ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', dark);
    }
    set({ isDark: dark });
  },
}));
