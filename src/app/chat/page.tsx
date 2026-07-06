"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import ChatPage from '../../components/ChatPage'; // Need to separate ChatPage from App.jsx

export default function Chat() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in'); // Or home page if sign-in is managed there
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded || !isSignedIn) {
    return null;
  }

  return <ChatPage />;
}
