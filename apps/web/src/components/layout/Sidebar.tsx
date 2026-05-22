'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Bell,
  Settings,
  Github,
  Flame,
  ChevronLeft,
  Plus,
} from 'lucide-react';
import { useUIStore } from '@/store/ui';
import { useAuthStore } from '@/store/auth';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/friends', label: 'Friends', icon: Users },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const user = useAuthStore((s) => s.user);

  return (
    <aside
      className={clsx(
        'fixed left-0 top-0 h-full z-40 flex flex-col bg-dark-800/95 backdrop-blur-md border-r border-dark-300 transition-all duration-450 ease-smooth',
        sidebarOpen ? 'w-60' : 'w-16',
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-dark-300">
        {sidebarOpen ? (
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
              <Flame size={18} className="text-accent" />
            </div>
            <span className="text-h6 font-medium text-gradient">ProjectHub</span>
          </Link>
        ) : (
          <Link href="/dashboard" className="mx-auto">
            <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
              <Flame size={18} className="text-accent" />
            </div>
          </Link>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-4 space-y-1 px-2">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-450 ease-smooth group',
                isActive
                  ? 'bg-accent/10 text-accent border border-accent/20'
                  : 'text-text-muted hover:text-text-primary hover:bg-dark-700 border border-transparent',
              )}
            >
              <item.icon size={18} className="shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Profile */}
      <div className="p-3 border-t border-dark-300">
        {sidebarOpen && user ? (
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-xs font-medium text-accent">
              {user.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text-primary truncate">{user.name}</p>
              <p className="text-xs text-text-muted truncate">{user.email}</p>
            </div>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-dark-700 mx-auto" />
        )}
      </div>

      {/* Collapse button */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-dark-700 border border-dark-300 flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
      >
        <ChevronLeft size={14} className={clsx('transition-transform', !sidebarOpen && 'rotate-180')} />
      </button>
    </aside>
  );
}
