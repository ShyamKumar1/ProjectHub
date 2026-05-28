'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth';

function GithubCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const loginWithGithub = useAuthStore((s) => s.loginWithGithub);

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      loginWithGithub(code).then(() => {
        router.push('/dashboard');
      }).catch(() => {
        router.push('/login?error=github_auth_failed');
      });
    } else {
      router.push('/login?error=no_code');
    }
  }, []);

  return <div className="min-h-screen flex items-center justify-center text-text-muted">Authenticating with GitHub...</div>;
}

export default function GithubCallback() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-text-muted">Loading...</div>}>
      <GithubCallbackInner />
    </Suspense>
  );
}
