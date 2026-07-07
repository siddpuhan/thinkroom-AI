"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import ResourceBoard from '../../ResourceBoard';

export default function Resources() {
  const { user, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      const returnTo = typeof window !== 'undefined' ? window.location.pathname : '/resources';
      router.push(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return null;
  }

  return <ResourceBoard onBack={() => router.push('/')} />;
}
