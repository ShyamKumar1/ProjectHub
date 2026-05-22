'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';

export default function GoogleCallback() {
  const router = useRouter();
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);

  useEffect(() => {
    // Google implicit flow returns token in URL fragment (#access_token=...)
    // Fragments are not sent to server — we parse them client-side
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');

    if (accessToken) {
      loginWithGoogle(accessToken).then(() => {
        router.push('/dashboard');
      }).catch(() => {
        router.push('/login?error=google_auth_failed');
      });
    } else {
      router.push('/login?error=no_token');
    }
  }, []);

  return <div className="min-h-screen flex items-center justify-center text-text-muted">Authenticating with Google...</div>;
}
