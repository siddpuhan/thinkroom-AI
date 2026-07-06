"use client";

import { useRouter } from 'next/navigation';
import LandingPage from '../LandingPage';

export default function Home() {
  const router = useRouter();
  
  return (
    <LandingPage 
      onEnterChat={() => router.push('/chat')}
      onEnterResources={() => router.push('/resources')}
    />
  );
}
