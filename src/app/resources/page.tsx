"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import ResourceBoard from '../../ResourceBoard';

export default function Resources() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/');
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded || !isSignedIn) {
    return null;
  }

  return <ResourceBoard onBack={() => router.push('/')} />;
}
