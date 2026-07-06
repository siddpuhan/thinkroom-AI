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
      router.push('/auth/login'); // Auth0 default login route
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return null;
  }

  return <ChatPage />;
}
