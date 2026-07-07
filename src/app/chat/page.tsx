"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import ChatPage from '../../components/ChatPage'; // Need to separate ChatPage from App.jsx

export default function Chat() {
  const { user, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      const returnTo = typeof window !== 'undefined' ? window.location.pathname : '/chat';
      router.push(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return null;
  }

  return <ChatPage />;
}
