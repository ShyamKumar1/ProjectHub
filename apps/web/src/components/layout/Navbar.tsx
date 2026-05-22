'use client';

import { useUIStore } from '@/store/ui';
import { useAuthStore } from '@/store/auth';
import Button from '@/components/ui/Button';
import { Moon, Sun, Plus, LogOut, Flame } from 'lucide-react';
import { useThemeStore } from '@/store/theme';

export default function Navbar() {
  const { setCreateProjectOpen } = useUIStore();
  const { user, logout } = useAuthStore();
  const { isDark, toggle } = useThemeStore();

  return (
    <header className="h-16 border-b border-dark-300 flex items-center justify-between px-6 bg-dark-800/50 backdrop-blur-md">
      <div className="flex items-center gap-4">
        <h1 className="text-h6 font-medium text-text-primary hidden md:block">Dashboard</h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Create Project Button */}
        <Button
          variant="primary"
          size="sm"
          onClick={() => setCreateProjectOpen(true)}
          className="hidden sm:flex"
        >
          <Plus size={16} />
          New Project
        </Button>

        {/* Streak indicator */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/20">
          <Flame size={16} className="text-accent animate-streak-pulse" />
          <span className="text-sm font-medium text-accent">0</span>
        </div>

        {/* Dark mode toggle */}
        <button
          onClick={toggle}
          className="w-8 h-8 rounded-lg bg-dark-700 border border-dark-300 flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Logout */}
        <button
          onClick={logout}
          className="w-8 h-8 rounded-lg bg-dark-700 border border-dark-300 flex items-center justify-center text-text-muted hover:text-danger transition-colors"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
