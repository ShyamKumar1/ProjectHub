import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  createProjectOpen: boolean;
  toggleSidebar: () => void;
  setCreateProjectOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  createProjectOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setCreateProjectOpen: (open) => set({ createProjectOpen: open }),
}));
