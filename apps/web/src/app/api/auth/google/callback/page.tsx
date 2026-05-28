'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';

function GoogleCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      // Send code + PKCE verifier to our backend for token exchange
      const verifier = sessionStorage.getItem('pkce_verifier');
      api.post<{ token: string; user: any }>('/api/v1/auth/google', {
        code,
        code_verifier: verifier,
        redirect_uri: `${window.location.origin}/api/auth/google/callback`,
      }).then((res) => {
        if (res.data?.token) api.setToken(res.data.token);
        // Set user in Zustand store immediately so the auth guard on /dashboard
        // doesn't redirect back to /login before checkSession can respond.
        if (res.data?.user) useAuthStore.getState().setUser(res.data.user);
        router.push('/dashboard');
      }).catch(() => {
        router.push('/login?error=google_auth_failed');
      });
    } else if (searchParams.get('error')) {
      router.push('/login?error=' + searchParams.get('error'));
    } else {
      router.push('/login?error=no_code');
    }
  }, []);

  return <div className="min-h-screen flex items-center justify-center text-text-muted">Authenticating with Google...</div>;
}

export default function GoogleCallback() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-text-muted">Loading...</div>}>
      <GoogleCallbackInner />
    </Suspense>
  );
}
