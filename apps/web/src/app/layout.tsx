'use client';

import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from '@/store/auth';
import { useThemeStore } from '@/store/theme';
import Sidebar from '@/components/layout/Sidebar';
import Navbar from '@/components/layout/Navbar';
import { usePathname, useRouter } from 'next/navigation';
import './globals.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

function AppContent({ children }: { children: React.ReactNode }) {
  const { user, isLoading, checkSession } = useAuthStore();
  const { setDark } = useThemeStore();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Initialize dark mode
    const saved = localStorage.getItem('theme');
    setDark(saved !== 'light');
  }, [setDark]);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  useEffect(() => {
    if (!isLoading && !user && pathname !== '/login') {
      router.push('/login');
    }
  }, [isLoading, user, pathname, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-800">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center animate-pulse">
            <span className="text-accent text-xl">🚀</span>
          </div>
          <p className="text-sm text-text-muted">Loading ProjectHub...</p>
        </div>
      </div>
    );
  }

  // Login page — no layout
  if (pathname === '/login') {
    return <>{children}</>;
  }

  // Authenticated pages — full layout
  if (!user) return null;

  return (
    <div className="min-h-screen bg-dark-800 flex">
      <Sidebar />
      <main className="flex-1 ml-60 transition-all duration-450 ease-smooth">
        <Navbar />
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Geist+Mono&display=swap" rel="stylesheet" />
        <title>ProjectHub</title>
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <AppContent>{children}</AppContent>
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#1f332b',
                color: '#f4f7f5',
                border: '1px solid #1f332b',
                borderRadius: '8px',
                fontSize: '14px',
              },
              success: { iconTheme: { primary: '#09bc8a', secondary: '#010907' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#010907' } },
            }}
          />
        </QueryClientProvider>
      </body>
    </html>
  );
}
